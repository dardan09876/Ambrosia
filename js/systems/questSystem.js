// js/systems/questSystem.js
// Handles quest lifecycle: start → countdown → resolve → reward.
// The game loop calls QuestSystem.tick() every second.
//
// DAILY BOARD: Each day, 2 random quests per tier (10 total) are drawn and posted
// to the board. The board resets at midnight. Players can only start quests on
// the current board.
//
// DAILY LIMIT: Unlimited quest completions (no daily cap).
//
// SUCCESS FORMULA: chance = clamp(5, 95, floor((playerSkill / required) * 70 + 5))
//   At required skill     → 75%
//   At 1.29× required     → 95% (cap)
//   At 0.5× required      → ~40%
//   At 0                  →  5% (floor)

const QuestSystem = {

    // Set by resolve() — quests page reads this to show a reward banner
    lastReward: null,

    // ── Daily date string (YYYY-MM-DD, local time) ────────────────────────────
    _today() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    },

    // ── Daily quest board ─────────────────────────────────────────────────────
    // Returns the array of quest IDs on today's board for the player's current
    // region. Board regenerates when the date OR region changes.
    getDailyBoard() {
        const player    = PlayerSystem.current;
        const today     = this._today();
        const regionId  = player.location ?? FACTION_CAPITALS[player.faction] ?? 'ironhold';
        const board     = player.quests.board;

        if (board.date === today && board.regionId === regionId && board.questIds.length > 0) {
            return board.questIds;
        }

        // Determine which quest tiers are available in this region
        const allowedTiers = (typeof MapSystem !== 'undefined')
            ? MapSystem.getQuestTiersForRegion(regionId)
            : [1, 2, 3, 4, 5];

        // Include every quest for the allowed tiers so all skills are always represented
        const questIds = QUESTS
            .filter(q => allowedTiers.includes(q.tier))
            .map(q => q.id);

        player.quests.board = { date: today, regionId, questIds };
        SaveSystem.save();
        return questIds;
    },

    // Returns the QUESTS objects on today's board.
    getBoardQuests() {
        const ids = this.getDailyBoard();
        return ids.map(id => QUESTS.find(q => q.id === id)).filter(Boolean);
    },

// Seconds until midnight (local time)
    secondsUntilReset() {
        const now       = new Date();
        const midnight  = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        return Math.floor((midnight - now) / 1000);
    },

    // ── Quest lookup (board + guild contracts) ────────────────────────────────
    _findQuest(questId) {
        const fromBoard = QUESTS.find(q => q.id === questId);
        if (fromBoard) return fromBoard;
        const guildQuests = PlayerSystem.current?.quests?.guildBoard?.quests;
        return guildQuests?.find(q => q.id === questId) ?? null;
    },

    // ── Build phase schedule for a quest ─────────────────────────────────────
    _buildPhases(quest, startAt) {
        const skill  = quest.skillCheck?.skill ?? 'melee';
        const names  = (typeof QUEST_PHASE_NAMES !== 'undefined' && QUEST_PHASE_NAMES[skill])
            ? QUEST_PHASE_NAMES[skill]
            : ['Approach', 'Engage', 'Objective', 'Return'];
        const totalMs = quest.duration * 1000;
        // Phase duration ratios: 20 / 30 / 30 / 20
        const ratios  = [0.20, 0.30, 0.30, 0.20];
        let cursor = startAt;
        return ratios.map((ratio, i) => {
            const durationMs = Math.floor(totalMs * ratio);
            const phase = { index: i, name: names[i], durationMs, startAt: cursor };
            cursor += durationMs;
            return phase;
        });
    },

    // ── Start a quest ─────────────────────────────────────────────────────────
    start(questId) {
        const player = PlayerSystem.current;
        if (!player) return { ok: false, reason: 'No player loaded.' };
        if (PlayerSystem.isHospitalized()) return { ok: false, reason: 'You are hospitalized. Rest until you recover.' };
        if (player.quests.active) return { ok: false, reason: 'A quest is already in progress.' };

        const quest = this._findQuest(questId);
        if (!quest) return { ok: false, reason: 'Unknown quest.' };

        // Regular quests must be on today's board; guild quests bypass this check
        if (!quest.isGuildQuest) {
            const board = this.getDailyBoard();
            if (!board.includes(questId)) {
                return { ok: false, reason: 'This quest is not on today\'s board.' };
            }
        }

        const now = Date.now();
        player.quests.active = {
            questId,
            startedAt: now,
            endsAt: now + quest.duration * 1000,
            phases: this._buildPhases(quest, now),
            currentPhaseIndex: 0,
            log: [],
            rewardMultiplier: 1.0,
        };

        Log.add(`Quest started: "${quest.name}". Returns in ${formatDuration(quest.duration)}.`, 'info');
        SaveSystem.save();

        return { ok: true };
    },

    // ── Abandon active quest ──────────────────────────────────────────────────
    abandon() {
        const player = PlayerSystem.current;
        if (!player?.quests?.active) return;

        const quest = this._findQuest(player.quests.active.questId);
        player.quests.active = null;
        this.lastReward = null;

        Log.add(`Abandoned: "${quest ? quest.name : 'quest'}". No daily slot used.`, 'warning');
        SaveSystem.save();

        if (Router._current === 'quests' || Router._current === 'guilds') Router._load(Router._current);
    },

    // ── Tick — called by game loop every second ───────────────────────────────
    tick() {
        const player = PlayerSystem.current;
        if (!player?.quests?.active) return;
        const active = player.quests.active;
        // Migrate old active quests that lack phase data
        if (!active.phases) {
            const quest = this._findQuest(active.questId);
            if (quest) {
                active.phases = this._buildPhases(quest, active.startedAt);
                active.currentPhaseIndex = 0;
                active.log = [];
                active.rewardMultiplier = 1.0;
            }
        }
        // Advance phases
        const quest = this._findQuest(active.questId);
        if (quest) this._catchUpPhases(active, quest);
        if (Date.now() >= active.endsAt) this.resolve();
    },

    // ── Resolve completed phases (also handles offline catch-up) ──────────────
    _catchUpPhases(active, quest) {
        const now = Date.now();
        let dirty = false;
        // Safety limit: max 4 phases to process per call
        let safety = 4;
        while (
            safety > 0 &&
            active.currentPhaseIndex < (active.phases?.length ?? 0)
        ) {
            const phase = active.phases[active.currentPhaseIndex];
            const phaseEndsAt = phase.startAt + phase.durationMs;
            if (now < phaseEndsAt) break;
            this._resolvePhaseEvent(active, quest, phase);
            active.currentPhaseIndex++;
            dirty = true;
            safety--;
        }
        if (dirty) SaveSystem.save();
    },

    // ── Fire one narrative event for a phase ──────────────────────────────────
    _resolvePhaseEvent(active, quest, phase) {
        const skill  = quest.skillCheck?.skill ?? 'melee';
        const pool   = (typeof QUEST_PHASE_EVENTS !== 'undefined' && QUEST_PHASE_EVENTS[skill])
            ? QUEST_PHASE_EVENTS[skill]
            : null;
        if (!pool || !pool.length) return;

        const event = pool[Math.floor(Math.random() * pool.length)];

        // Use the quest's success chance adjusted by the event's difficulty modifier
        const baseChance   = this.getSuccessChance(quest);
        const eventChance  = Math.min(95, Math.max(5, baseChance / event.difficultyMod));
        const success      = Math.random() * 100 < eventChance;

        active.log.push(`— ${phase.name} —`);
        active.log.push(event.logIntro);
        const lines = success ? event.logSuccess : event.logFailure;
        for (const line of lines) active.log.push(line);

        const mod = success ? event.successEffect.rewardMod : event.failureEffect.rewardMod;
        active.rewardMultiplier = Math.min(1.5, Math.max(0.3,
            (active.rewardMultiplier ?? 1.0) + mod
        ));
    },

    // ── Resolve completed quest ───────────────────────────────────────────────
    resolve() {
        const player = PlayerSystem.current;
        if (!player?.quests?.active) return;

        const activeData = player.quests.active;
        const quest      = this._findQuest(activeData.questId);
        player.quests.active = null;

        if (!quest) { SaveSystem.save(); return; }

        const chance  = this.getSuccessChance(quest);
        const rolled  = Math.random() * 100;
        const success = rolled < chance;
        const partial = !success && rolled < chance * 1.5;

        const mult = Math.min(1.5, Math.max(0.3, activeData.rewardMultiplier ?? 1.0));

        if (success) {
            const gold = Math.round(this._rand(quest.goldReward.min, quest.goldReward.max) * mult);
            player.gold += gold;
            const isGuild = !!quest.isGuildQuest;
            for (let i = 0; i < quest.chestReward.count; i++) {
                this._addChestToInventory(player, quest.chestReward.tier, isGuild);
            }
            const chestName = isGuild
                ? (LOOT_TIERS[quest.chestReward.tier]?.name ?? `Tier ${quest.chestReward.tier} Cache`)
                : (CHEST_DEFS[quest.chestReward.tier]?.name ?? `Tier ${quest.chestReward.tier} Chest`);
            this.lastReward = { outcome: 'success', questName: quest.name, gold, chests: quest.chestReward, log: activeData.log ?? [] };
            Log.add(`"${quest.name}" complete! +${gold.toLocaleString()} gold · ${quest.chestReward.count}× ${chestName}.`, 'success');

            // Award guild reputation on success
            if (quest.isGuildQuest && quest.guild && quest.guildReputation) {
                PlayerSystem.gainGuildReputation(quest.guild, quest.guildReputation);
            }

            // Award XP and materials on success
            this._awardQuestXp(quest);
            this._awardQuestMaterials(quest, 1.0);
            this._applyDurabilityWear(quest, 1.0);

        } else if (partial) {
            const gold = Math.round(this._rand(quest.goldReward.min, quest.goldReward.max) * 0.4 * mult);
            player.gold += gold;
            this.lastReward = { outcome: 'partial', questName: quest.name, gold, chests: null, log: activeData.log ?? [] };
            Log.add(`"${quest.name}" — partial success. +${gold.toLocaleString()} gold, no chest.`, 'warning');

            // Award half reputation on partial
            if (quest.isGuildQuest && quest.guild && quest.guildReputation) {
                PlayerSystem.gainGuildReputation(quest.guild, Math.floor(quest.guildReputation * 0.5));
            }

            // Award reduced XP and materials on partial success
            this._awardQuestXp(quest, 0.5);
            this._awardQuestMaterials(quest, 0.5);
            this._applyDurabilityWear(quest, 0.65);

        } else {
            this.lastReward = { outcome: 'failure', questName: quest.name, gold: 0, chests: null, log: activeData.log ?? [] };
            Log.add(`"${quest.name}" failed. No reward.`, 'danger');
            this._applyDurabilityWear(quest, 0.40);
        }

        // Short completed history
        player.quests.completed.unshift({ questId: quest.id, outcome: this.lastReward.outcome, ts: Date.now() });
        // Cap board quest history at 20, but always preserve story/tutorial entries
        // so that tutorial completion checks remain valid no matter how many quests are done.
        const _isStoryEntry = e => /(_intro_|_guard_intro|_scout_intro|_sentinel_intro|main_proving_quest)/.test(e.questId);
        const _storyEntries = player.quests.completed.filter(_isStoryEntry);
        const _boardEntries = player.quests.completed.filter(e => !_isStoryEntry(e));
        if (_boardEntries.length > 20) _boardEntries.length = 20;
        player.quests.completed = [..._storyEntries, ..._boardEntries];

        // Count successful board quests toward world-unlock progression
        const isTutorialQuest = /(_intro_|_guard_intro|_scout_intro|_sentinel_intro)/.test(quest.id);
        if (success && !isTutorialQuest) {
            if (!player.flags) player.flags = { boardQuestSuccesses: 0, worldUnlocked: false };
            player.flags.boardQuestSuccesses = (player.flags.boardQuestSuccesses || 0) + 1;
        }

        // Track per-quest success count for auto-repeat unlock (5 successes = eligible)
        if (success && !isTutorialQuest) {
            if (!player.quests.questCompletionCounts) player.quests.questCompletionCounts = {};
            player.quests.questCompletionCounts[quest.id] = (player.quests.questCompletionCounts[quest.id] || 0) + 1;
        }

        // Handle auto-repeat before save/render
        this._handleAutoRepeat(quest, success, partial);

        SaveSystem.save();
        if (Router._current === 'quests' || Router._current === 'guilds') Router._load(Router._current);
    },

    // ── Award crafting materials for quest completion ─────────────────────────
    _awardQuestMaterials(quest, multiplier = 1.0) {
        if (typeof CraftingSystem === 'undefined') return;

        const player = PlayerSystem.current;
        const tier = quest.tier || 1;

        // Material pools by rarity tier
        const common  = ['scrap_iron','rough_wood','cloth_scraps','tattered_leather',
                         'herbs','beast_fat','ash_resin','fiber_bundle','beast_bone'];
        const refined = ['iron_ingot','wood_handle','treated_plank','leather_strap',
                         'woven_cloth','glass_vial','charcoal','simple_binding'];
        const rare    = ['rift_shard','veil_dust','emberglass_fragment','faded_sigil_wax'];

        const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const rng  = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

        // Build reward list based on quest tier
        const rewards = [];
        if (tier === 1) {
            for (let i = 0; i < rng(1, 2); i++) rewards.push({ id: pick(common),  amount: rng(1, 2) });
        } else if (tier === 2) {
            for (let i = 0; i < rng(1, 2); i++) rewards.push({ id: pick(common),  amount: rng(1, 3) });
            rewards.push({ id: pick(refined), amount: 1 });
        } else if (tier === 3) {
            for (let i = 0; i < 2; i++) rewards.push({ id: pick(refined), amount: rng(1, 2) });
            if (Math.random() < 0.5) rewards.push({ id: pick(rare), amount: 1 });
        } else if (tier === 4) {
            for (let i = 0; i < rng(2, 3); i++) rewards.push({ id: pick(refined), amount: rng(1, 2) });
            rewards.push({ id: pick(rare), amount: rng(1, 2) });
        } else {
            for (let i = 0; i < 2; i++) rewards.push({ id: pick(refined), amount: rng(1, 2) });
            for (let i = 0; i < rng(2, 3); i++) rewards.push({ id: pick(rare), amount: rng(1, 2) });
        }

        const summary = [];
        for (const r of rewards) {
            const amount = Math.max(1, Math.floor(r.amount * multiplier));
            CraftingSystem.addMaterial(player, r.id, amount);
            const matDef = (typeof getMaterial !== 'undefined') ? getMaterial(r.id) : null;
            summary.push(`${amount}× ${matDef ? matDef.name : r.id}`);
        }
        if (summary.length > 0) {
            Log.add(`Materials: ${summary.join(', ')}.`, 'info');
        }
    },

    // ── Award experience + skill gain for quest completion ───────────────────
    _awardQuestXp(quest, multiplier = 1.0) {
        // Base level XP scales with quest tier
        // Tier 1:  100  Tier 2:  300  Tier 3:  800  Tier 4: 1800  Tier 5: 4000
        const tierBaseXp = [0, 100, 300, 800, 1800, 4000];
        const baseXp = tierBaseXp[Math.max(1, Math.min(5, quest.tier))] || 100;
        const xp = Math.floor(baseXp * multiplier);

        // Direct skill gain based on quest difficulty (skillCheck.required)
        // Scales so completing quests at-level advances the skill meaningfully
        // Tier 1 (~req 28):   +5    Tier 2 (~req 95):  +15
        // Tier 3 (~req 270):  +40   Tier 4 (~req 800): +100   Tier 5 (~req 1800): +250
        const tierSkillGain = [0, 5, 15, 40, 100, 250];
        const baseSkillGain = tierSkillGain[Math.max(1, Math.min(5, quest.tier))] || 5;
        const skillGain = Math.max(1, Math.floor(baseSkillGain * multiplier));

        const skillKey = quest.skillCheck.skill;
        if (typeof PlayerSystem !== 'undefined') {
            PlayerSystem.gainSkillExperience(skillKey, xp);
            PlayerSystem.current.skills[skillKey] = (PlayerSystem.current.skills[skillKey] || 0) + skillGain;
            PlayerSystem._recalcStatMaxes();
            if (xp > 0) {
                Log.add(`+${xp} ${skillLabel(skillKey)} experience.`, 'info');
            }
            Log.add(`+${skillGain} ${skillLabel(skillKey)} skill from quest difficulty.`, 'info');
        }
    },

    // ── Success chance (5–95%) ────────────────────────────────────────────────
    // Uses effective skill (compressed value) vs effective-equivalent required.
    // At required effective skill → 75%. At ~1.3× required → 95% cap.
    getSuccessChance(quest) {
        const playerSkill  = PlayerSystem.getEffectiveSkill(quest.skillCheck.skill);
        const required     = quest.skillCheck.required;
        const base         = Math.floor((playerSkill / Math.max(1, required)) * 70 + 5);
        const abilityBonus = (typeof AbilitySystem !== 'undefined')
            ? AbilitySystem.getQuestBonus(quest.skillCheck.skill)
            : 0;
        const miscBonus    = PlayerSystem.getQuestBonus();
        return Math.min(95, Math.max(5, base + abilityBonus + miscBonus));
    },

    // ── Remaining ms / progress for active quest ──────────────────────────────
    getRemainingMs() {
        const active = PlayerSystem.current?.quests?.active;
        return active ? Math.max(0, active.endsAt - Date.now()) : 0;
    },

    getProgress() {
        const active = PlayerSystem.current?.quests?.active;
        if (!active) return 0;
        const total   = active.endsAt - active.startedAt;
        const elapsed = Date.now() - active.startedAt;
        return Math.min(100, Math.round((elapsed / total) * 100));
    },

    // ── Phase helpers for UI ──────────────────────────────────────────────────
    getCurrentPhase() {
        const active = PlayerSystem.current?.quests?.active;
        if (!active?.phases) return null;
        const idx = Math.min(active.currentPhaseIndex, active.phases.length - 1);
        return active.phases[idx] ?? null;
    },

    getPhaseRemainingMs() {
        const active = PlayerSystem.current?.quests?.active;
        if (!active?.phases) return 0;
        const idx = active.currentPhaseIndex;
        if (idx >= active.phases.length) return 0;
        const phase = active.phases[idx];
        return Math.max(0, (phase.startAt + phase.durationMs) - Date.now());
    },

    getPhaseProgress() {
        const active = PlayerSystem.current?.quests?.active;
        if (!active?.phases) return 0;
        const idx = active.currentPhaseIndex;
        if (idx >= active.phases.length) return 100;
        const phase = active.phases[idx];
        const elapsed = Date.now() - phase.startAt;
        return Math.min(100, Math.round((elapsed / phase.durationMs) * 100));
    },

    // ── Auto-repeat ───────────────────────────────────────────────────────────

    // Called at end of resolve() to continue or stop auto-repeat.
    _handleAutoRepeat(quest, success, partial) {
        const player = PlayerSystem.current;
        const ar = player.quests.autoRepeat;
        if (!ar || ar.questId !== quest.id) return;

        const failed = !success && !partial;

        if (ar.stopOnFailure && failed) {
            player.quests.autoRepeat = null;
            Log.add('Auto-repeat stopped: quest failed.', 'warning');
            return;
        }
        if (ar.stopOnLowDurability && this._checkLowDurability()) {
            player.quests.autoRepeat = null;
            Log.add('Auto-repeat stopped: equipment durability is low.', 'warning');
            return;
        }
        if (ar.repeatsLeft <= 0) {
            player.quests.autoRepeat = null;
            Log.add('Auto-repeat complete.', 'info');
            return;
        }

        ar.repeatsLeft--;
        const startResult = this.start(quest.id);
        if (!startResult.ok) {
            player.quests.autoRepeat = null;
            Log.add(`Auto-repeat stopped: ${startResult.reason}`, 'warning');
        }
    },

    // Returns true if any equipped item with durability is below 25% of max.
    _checkLowDurability() {
        const player = PlayerSystem.current;
        const SLOTS  = ['weapon', 'offhand', 'head', 'torso', 'back', 'hands', 'legs', 'feet'];
        for (const slot of SLOTS) {
            const item = player.equipment[slot];
            if (!item || item.durability == null || !item.maxDurability) continue;
            if (item.durability / item.maxDurability < 0.25) return true;
        }
        return false;
    },

    // Returns the number of successful completions recorded for a quest.
    getQuestSuccessCount(questId) {
        return PlayerSystem.current?.quests?.questCompletionCounts?.[questId] ?? 0;
    },

    // Configure and activate auto-repeat for a quest.
    // Called by the popup confirm button — the caller is responsible for starting the first run.
    setAutoRepeat(questId, config) {
        const player = PlayerSystem.current;
        if (!player) return;
        // repeatsLeft = total runs - 1 (first run starts immediately after this call)
        player.quests.autoRepeat = {
            questId,
            repeatsLeft:          config.repeats - 1,
            stopOnFailure:        config.stopOnFailure,
            stopOnLowDurability:  config.stopOnLowDurability,
        };
        SaveSystem.save();
    },

    cancelAutoRepeat() {
        const player = PlayerSystem.current;
        if (!player) return;
        player.quests.autoRepeat = null;
        SaveSystem.save();
    },

    // ── Helpers ───────────────────────────────────────────────────────────────
    _rand(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // ── Apply durability wear to equipped items after a quest ─────────────────
    _applyDurabilityWear(quest, multiplier = 1.0) {
        const player = PlayerSystem.current;
        const WEAR_SLOTS = ['weapon', 'offhand', 'head', 'torso', 'back', 'hands', 'legs', 'feet'];
        const tierWear   = [0, 3, 6, 10, 15, 22];
        const baseWear   = tierWear[Math.max(1, Math.min(5, quest.tier))] || 3;
        const wear       = Math.max(1, Math.round(baseWear * multiplier));

        const broken = [];
        for (const slot of WEAR_SLOTS) {
            const item = player.equipment[slot];
            if (!item || item.durability == null) continue;
            item.durability = Math.max(0, item.durability - wear);
            if (item.durability === 0) broken.push(item.name);
        }
        if (broken.length > 0) {
            Log.add(`Equipment at 0 durability: ${broken.join(', ')}. Visit a smith to repair.`, 'danger');
        }
    },

    // Add a chest to player.inventory as a stacked item.
    // Regular quests use CHEST_DEFS names; guild quests use LOOT_TIERS names.
    // Stacks are keyed by tier+name so the two types stay separate.
    _addChestToInventory(player, tier, isGuild = false) {
        const name = isGuild
            ? (LOOT_TIERS[tier]?.name ?? `Tier ${tier} Cache`)
            : (CHEST_DEFS[tier]?.name ?? `Tier ${tier} Chest`);
        const existing = player.inventory.find(
            i => i.type === 'chest' && i.tier === tier && i.name === name
        );
        if (existing) {
            existing.quantity = (existing.quantity || 1) + 1;
        } else {
            player.inventory.push({
                uid:      Date.now() * 10000 + Math.floor(Math.random() * 10000),
                type:     'chest',
                tier,
                name,
                quantity: 1,
            });
        }
    },
};

// ── Shared formatting utilities (used by quests page) ─────────────────────────

function formatDuration(seconds) {
    if (seconds <= 0) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
    if (m > 0) return s > 0 ? `${m}m ${s}s` : `${m}m`;
    return `${s}s`;
}

function formatMs(ms) {
    return formatDuration(Math.ceil(ms / 1000));
}

function successColor(chance) {
    if (chance >= 95) return 'var(--gold)';
    if (chance >= 75) return 'var(--success)';
    if (chance >= 50) return 'var(--warning)';
    return 'var(--danger)';
}
