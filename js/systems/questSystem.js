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

    QUESTS_PER_TIER: 3,   // how many quests per tier appear on the board each day

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

        // Generate a new board — QUESTS_PER_TIER random quests per allowed tier
        const questIds = [];
        for (const tier of allowedTiers) {
            const pool     = QUESTS.filter(q => q.tier === tier);
            const shuffled = pool.slice().sort(() => Math.random() - 0.5);
            shuffled.slice(0, this.QUESTS_PER_TIER).forEach(q => questIds.push(q.id));
        }

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

    // ── Start a quest ─────────────────────────────────────────────────────────
    start(questId) {
        const player = PlayerSystem.current;
        if (!player) return { ok: false, reason: 'No player loaded.' };
        if (PlayerSystem.isHospitalized()) return { ok: false, reason: 'You are hospitalized. Rest until you recover.' };
        if (player.quests.active) return { ok: false, reason: 'A quest is already in progress.' };

        const quest = QUESTS.find(q => q.id === questId);
        if (!quest) return { ok: false, reason: 'Unknown quest.' };

        // Must be on today's board
        const board = this.getDailyBoard();
        if (!board.includes(questId)) {
            return { ok: false, reason: 'This quest is not on today\'s board.' };
        }

        const now = Date.now();
        player.quests.active = {
            questId,
            startedAt: now,
            endsAt: now + quest.duration * 1000,
        };

        Log.add(`Quest started: "${quest.name}". Returns in ${formatDuration(quest.duration)}.`, 'info');
        SaveSystem.save();

        return { ok: true };
    },

    // ── Abandon active quest ──────────────────────────────────────────────────
    abandon() {
        const player = PlayerSystem.current;
        if (!player?.quests?.active) return;

        const quest = QUESTS.find(q => q.id === player.quests.active.questId);
        player.quests.active = null;
        this.lastReward = null;

        Log.add(`Abandoned: "${quest ? quest.name : 'quest'}". No daily slot used.`, 'warning');
        SaveSystem.save();

        if (Router._current === 'quests') Router._load('quests');
    },

    // ── Tick — called by game loop every second ───────────────────────────────
    tick() {
        const player = PlayerSystem.current;
        if (!player?.quests?.active) return;
        if (Date.now() >= player.quests.active.endsAt) this.resolve();
    },

    // ── Resolve completed quest ───────────────────────────────────────────────
    resolve() {
        const player = PlayerSystem.current;
        if (!player?.quests?.active) return;

        const activeData = player.quests.active;
        const quest      = QUESTS.find(q => q.id === activeData.questId);
        player.quests.active = null;

        if (!quest) { SaveSystem.save(); return; }

        const chance  = this.getSuccessChance(quest);
        const rolled  = Math.random() * 100;
        const success = rolled < chance;
        const partial = !success && rolled < chance * 1.5;

        if (success) {
            const gold = this._rand(quest.goldReward.min, quest.goldReward.max);
            player.gold += gold;
            for (let i = 0; i < quest.chestReward.count; i++) {
                player.chests.push(this._makeChest(quest.chestReward.tier));
            }
            const chestDef = CHEST_DEFS[quest.chestReward.tier];
            this.lastReward = { outcome: 'success', questName: quest.name, gold, chests: quest.chestReward };
            Log.add(`"${quest.name}" complete! +${gold.toLocaleString()} gold · ${quest.chestReward.count}× ${chestDef?.name}.`, 'success');

        } else if (partial) {
            const gold = Math.floor(this._rand(quest.goldReward.min, quest.goldReward.max) * 0.4);
            player.gold += gold;
            this.lastReward = { outcome: 'partial', questName: quest.name, gold, chests: null };
            Log.add(`"${quest.name}" — partial success. +${gold.toLocaleString()} gold, no chest.`, 'warning');

        } else {
            this.lastReward = { outcome: 'failure', questName: quest.name, gold: 0, chests: null };
            Log.add(`"${quest.name}" failed. No reward.`, 'danger');
        }

        // Short completed history
        player.quests.completed.unshift({ questId: quest.id, outcome: this.lastReward.outcome, ts: Date.now() });
        if (player.quests.completed.length > 20) player.quests.completed.length = 20;

        SaveSystem.save();
        if (Router._current === 'quests') Router._load('quests');
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

    // ── Helpers ───────────────────────────────────────────────────────────────
    _rand(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    _makeChest(tier) {
        const def = CHEST_DEFS[tier];
        return { type: 'chest', tier, name: def ? def.name : `Tier ${tier} Chest`, uid: Date.now() + Math.random() };
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
