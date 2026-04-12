// js/systems/trainingSystem.js
// Handles all training logic: queuing, resolving, buffs, fatigue, mastery.

const TrainingSystem = {

    // ── Formulas ───────────────────────────────────────────────────────────

    // Study XP: meaningful early, diminishing at high skill, modified by facility
    getStudyXpGain({ skillLevel, trainingTier, facilityBonus = 1, instructorBonus = 1, fatigueMultiplier = 1 }) {
        const base           = 6 + trainingTier * 4;
        const scalingPenalty = 100 / (100 + skillLevel * 3);
        return Math.floor(base * scalingPenalty * facilityBonus * instructorBonus * fatigueMultiplier);
    },

    // Temporary buff magnitude: grows with skill + tier, capped ~25–35% with heavy investment
    getTrainingBuff({ relevantSkill, drillTier, facilityBonus = 1 }) {
        const base         = 0.03 + drillTier * 0.02;
        const skillScaling = Math.min(0.20, relevantSkill / 500);
        return (base + skillScaling) * facilityBonus;
    },

    // Fatigue: first 1–2 trainings are full value; spam degrades to 35% floor
    getFatigueMultiplier(trainingActionsToday) {
        return Math.max(0.35, 1 - trainingActionsToday * 0.12);
    },

    // Readiness gained per drill
    getReadinessGain(drillTier, relevantSkill) {
        return drillTier * 10 + Math.floor(relevantSkill / 20);
    },

    // Mastery points earned from study XP
    getMasteryGain(skillXpEarned) {
        return Math.max(1, Math.floor(skillXpEarned / 25));
    },

    // ── Daily fatigue reset ────────────────────────────────────────────────
    _checkDailyReset() {
        const player = PlayerSystem.current;
        if (!player?.training) return;
        const today = new Date().toISOString().slice(0, 10);
        if (player.training.lastTrainingDate !== today) {
            player.training.lastTrainingDate      = today;
            player.training.trainingActionsToday  = 0;
        }
    },

    // ── Validate & enqueue a training action ──────────────────────────────
    startTraining(actionId) {
        const player = PlayerSystem.current;
        if (!player) return { ok: false, reason: 'No player loaded.' };

        this._checkDailyReset();

        const action = TRAINING_ACTIONS[actionId];
        if (!action) return { ok: false, reason: 'Unknown training action.' };

        // Hospitalization blocks all training
        if (PlayerSystem.isHospitalized()) {
            return { ok: false, reason: 'You are hospitalized and cannot train.' };
        }

        // Facility check (drills and study need a training facility; warband does not)
        if (action.category !== 'warband') {
            if (typeof MapSystem !== 'undefined' && !MapSystem.hasActivity('training')) {
                return { ok: false, reason: 'No training facility at this location.' };
            }
        }

        // Queue slot check
        const slotsMax = player.training.slotsMax || 1;
        if (player.training.activeQueue.length >= slotsMax) {
            return { ok: false, reason: 'Training slot is occupied. Wait for it to finish or cancel.' };
        }

        // Duplicate check
        if (player.training.activeQueue.some(q => q.actionId === actionId)) {
            return { ok: false, reason: 'This training action is already queued.' };
        }

        // Resource check
        const cost = action.cost;
        for (const [res, amount] of Object.entries(cost)) {
            if (res === 'gold') {
                if (player.gold < amount) {
                    return { ok: false, reason: `Not enough gold (need ${amount}g).` };
                }
            } else {
                const stat = player.stats[res];
                if (!stat || stat.value < amount) {
                    const label = this._resLabel(res);
                    return { ok: false, reason: `Not enough ${label} (need ${amount}).` };
                }
            }
        }

        // Deduct resources
        for (const [res, amount] of Object.entries(cost)) {
            if (res === 'gold') {
                player.gold -= amount;
            } else {
                player.stats[res].value = Math.max(0, player.stats[res].value - amount);
            }
        }

        // Enqueue
        const now = Date.now();
        player.training.activeQueue.push({
            actionId,
            startTime: now,
            endTime:   now + action.durationSec * 1000,
        });

        if (typeof Layout !== 'undefined') Layout.updateStatBars();
        if (typeof SaveSystem !== 'undefined') SaveSystem.save();

        return { ok: true };
    },

    // ── Cancel a queued training action ───────────────────────────────────
    cancelTraining(index) {
        const player = PlayerSystem.current;
        if (!player) return;
        const queue = player.training.activeQueue;
        if (index < 0 || index >= queue.length) return;

        const item   = queue[index];
        const action = TRAINING_ACTIONS[item.actionId];
        const now    = Date.now();

        // 50% resource refund if cancelled before halfway
        if (action) {
            const elapsed = now - item.startTime;
            const total   = item.endTime - item.startTime;
            if (elapsed < total * 0.5) {
                for (const [res, amount] of Object.entries(action.cost)) {
                    if (res !== 'gold') {
                        const stat = player.stats[res];
                        if (stat) {
                            const cap = PlayerSystem.getStatMax(res);
                            stat.value = Math.min(cap, stat.value + Math.floor(amount * 0.5));
                        }
                    }
                }
                Log.add(`Training cancelled — ${action.label}. Half your resources returned.`, 'warning');
            } else {
                Log.add(`Training cancelled — ${action.label}.`, 'warning');
            }
        }

        queue.splice(index, 1);
        if (typeof Layout !== 'undefined') Layout.updateStatBars();
        if (typeof SaveSystem !== 'undefined') SaveSystem.save();
    },

    // ── Game loop tick: resolve completed training ─────────────────────────
    tick() {
        const player = PlayerSystem.current;
        if (!player?.training?.activeQueue?.length) return;

        const now       = Date.now();
        const completed = player.training.activeQueue.filter(q => now >= q.endTime);
        if (!completed.length) return;

        for (const item of completed) {
            this._resolveTraining(item);
        }

        player.training.activeQueue = player.training.activeQueue.filter(q => now < q.endTime);

        // Refresh training page if open
        if (typeof Router !== 'undefined' && Router._current === 'training') {
            Router._load('training');
        }
    },

    // ── Resolve a single completed training action ─────────────────────────
    _resolveTraining(item) {
        const player = PlayerSystem.current;
        const action = TRAINING_ACTIONS[item.actionId];
        if (!action || !player) return;

        this._checkDailyReset();

        // Fatigue uses count BEFORE this action increments it
        const fatigueMultiplier = this.getFatigueMultiplier(player.training.trainingActionsToday);
        player.training.trainingActionsToday++;

        const skillLevel    = player.skills[action.linkedSkill] || 0;
        const facilityBonus = (typeof MapSystem !== 'undefined' && MapSystem.hasActivity('training')) ? 1.2 : 1.0;
        const logParts      = [];

        // ── XP (study actions + small XP from drills) ─────────────────────
        if (action.rewards.xp || action.rewards.xpBase) {
            const xpGain = this.getStudyXpGain({
                skillLevel,
                trainingTier:      action.tier,
                facilityBonus,
                fatigueMultiplier,
            });

            if (xpGain > 0) {
                const before = player.skills[action.linkedSkill] || 0;
                player.skills[action.linkedSkill] = before + xpGain;
                PlayerSystem.gainSkillExperience(action.linkedSkill, Math.ceil(xpGain * 3));
                if (typeof PlayerSystem._recalcStatMaxes === 'function') {
                    PlayerSystem._recalcStatMaxes();
                }
                logParts.push(`+${xpGain} ${action.linkedSkill} XP`);

                // Mastery
                if (action.rewards.mastery) {
                    const masteryGain = this.getMasteryGain(xpGain);
                    player.training.masteryPoints = (player.training.masteryPoints || 0) + masteryGain;
                    logParts.push(`+${masteryGain} mastery`);
                }
            }
        }

        // ── Temporary buff (drills) ────────────────────────────────────────
        if (action.rewards.tempBuff) {
            const buffMag = this.getTrainingBuff({
                relevantSkill: skillLevel,
                drillTier:     action.tier,
                facilityBonus,
            });
            const pct  = Math.round(buffMag * 100);
            const buff = {
                type:       'training_buff',
                subtype:    action.rewards.tempBuff.type,
                skill:      action.linkedSkill,
                amount:     buffMag,
                label:      `${action.label} (+${pct}% ${action.rewards.tempBuff.label})`,
                questsLeft: 2,
                expiresAt:  Date.now() + 4 * 60 * 60 * 1000, // 4 hours
            };
            if (!player.training.activeBuffs) player.training.activeBuffs = [];
            player.training.activeBuffs.push(buff);
            logParts.push(`+${pct}% buff (${action.rewards.tempBuff.label})`);
        }

        // ── Warband buff ───────────────────────────────────────────────────
        if (action.rewards.warbandBuff) {
            if (!player.training.warbandBuffs) player.training.warbandBuffs = [];
            player.training.warbandBuffs.push({
                type:      action.rewards.warbandBuff.type,
                label:     action.rewards.warbandBuff.label,
                amount:    0.10 + (action.tier - 1) * 0.05,
                expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
            });
            logParts.push(action.rewards.warbandBuff.label);
        }

        // ── Readiness ─────────────────────────────────────────────────────
        if (action.rewards.readiness) {
            const raw    = this.getReadinessGain(action.tier, skillLevel);
            const gained = Math.max(1, Math.floor(raw * fatigueMultiplier));
            player.training.readiness = Math.min(200, (player.training.readiness || 0) + gained);
            logParts.push(`+${gained} readiness`);
        }

        // ── Results log ───────────────────────────────────────────────────
        const resultLine = `${action.label}: ${logParts.join(', ')}`;
        if (!player.training.resultsLog) player.training.resultsLog = [];
        player.training.resultsLog.unshift({ text: resultLine, ts: Date.now() });
        if (player.training.resultsLog.length > 8) player.training.resultsLog.length = 8;

        const fatigueNote = fatigueMultiplier < 0.88 ? ` (fatigue ×${fatigueMultiplier.toFixed(2)})` : '';
        Log.add(`Training complete — ${resultLine}${fatigueNote}`, 'success');
    },

    // ── Spend mastery points for a permanent skill bonus ──────────────────
    spendMastery(skillKey, cost = 10) {
        const player = PlayerSystem.current;
        if (!player) return { ok: false, reason: 'No player.' };
        const current = player.training.masteryPoints || 0;
        if (current < cost) return { ok: false, reason: `Need ${cost} mastery points (have ${current}).` };

        player.training.masteryPoints -= cost;
        if (!player.training.masteryBonuses) player.training.masteryBonuses = {};
        const prev = player.training.masteryBonuses[skillKey] || 0;
        player.training.masteryBonuses[skillKey] = prev + 0.01;

        Log.add(`Mastery invested — permanent +1% ${skillKey} bonus.`, 'success');
        if (typeof SaveSystem !== 'undefined') SaveSystem.save();
        return { ok: true };
    },

    // ── Get combined active training buff for a skill ─────────────────────
    getActiveBuff(skillKey, subtype) {
        const player = PlayerSystem.current;
        if (!player?.training?.activeBuffs) return 0;
        const now = Date.now();
        return player.training.activeBuffs
            .filter(b => b.skill === skillKey
                      && (!subtype || b.subtype === subtype)
                      && b.questsLeft > 0
                      && b.expiresAt > now)
            .reduce((sum, b) => sum + b.amount, 0);
    },

    // Get all active warband buffs (for warband system to read)
    getWarbandBuff(type) {
        const player = PlayerSystem.current;
        if (!player?.training?.warbandBuffs) return 0;
        const now = Date.now();
        return player.training.warbandBuffs
            .filter(b => b.type === type && b.expiresAt > now)
            .reduce((sum, b) => sum + b.amount, 0);
    },

    // ── Consume a training buff (call when quest uses it) ─────────────────
    consumeQuestBuff(skillKey) {
        const player = PlayerSystem.current;
        if (!player?.training?.activeBuffs) return;
        const now = Date.now();
        for (const b of player.training.activeBuffs) {
            if (b.skill === skillKey && b.questsLeft > 0 && b.expiresAt > now) {
                b.questsLeft--;
            }
        }
    },

    // ── Remove expired buffs ───────────────────────────────────────────────
    cleanBuffs() {
        const player = PlayerSystem.current;
        if (!player?.training) return;
        const now = Date.now();
        if (player.training.activeBuffs) {
            player.training.activeBuffs = player.training.activeBuffs.filter(
                b => b.questsLeft > 0 && b.expiresAt > now
            );
        }
        if (player.training.warbandBuffs) {
            player.training.warbandBuffs = player.training.warbandBuffs.filter(
                b => b.expiresAt > now
            );
        }
    },

    // ── Readiness display helper ───────────────────────────────────────────
    getReadinessLabel(readiness) {
        if (readiness >= 150) return { label: 'Battle-Ready',  color: '#4a9e6b' };
        if (readiness >= 100) return { label: 'Prepared',      color: '#c9a84c' };
        if (readiness >= 50)  return { label: 'Warming Up',    color: '#c07830' };
        return                       { label: 'Unprepared',    color: '#6b7585' };
    },

    // ── Fatigue display helper ─────────────────────────────────────────────
    getFatigueLabel(trainingActionsToday) {
        const mult = this.getFatigueMultiplier(trainingActionsToday);
        if (mult >= 0.99) return { label: 'Rested',     color: '#4a9e6b', mult };
        if (mult >= 0.76) return { label: 'Warmed Up',  color: '#c9a84c', mult };
        if (mult >= 0.52) return { label: 'Fatigued',   color: '#c07830', mult };
        return                   { label: 'Exhausted',  color: '#c04040', mult };
    },

    // ── Format a cost object into a readable string ────────────────────────
    formatCost(cost) {
        return Object.entries(cost).map(([res, amt]) => {
            if (res === 'gold') return `${amt}g`;
            const meta = (typeof RESOURCE_META !== 'undefined' && RESOURCE_META[res])
                ? RESOURCE_META[res]
                : { abbr: res.toUpperCase() };
            return `${amt} ${meta.abbr}`;
        }).join(' · ');
    },

    // ── Format duration ────────────────────────────────────────────────────
    formatDuration(sec) {
        if (sec >= 60) return `${Math.floor(sec / 60)} min`;
        return `${sec}s`;
    },

    // ── Remaining time label ───────────────────────────────────────────────
    formatRemaining(endTime) {
        const ms   = Math.max(0, endTime - Date.now());
        const secs = Math.ceil(ms / 1000);
        if (secs >= 60) return `${Math.floor(secs / 60)}m ${secs % 60}s`;
        return `${secs}s`;
    },

    // ── Check if player can afford an action ──────────────────────────────
    canAfford(action) {
        const player = PlayerSystem.current;
        if (!player) return false;
        for (const [res, amt] of Object.entries(action.cost)) {
            if (res === 'gold') {
                if (player.gold < amt) return false;
            } else {
                if ((player.stats[res]?.value ?? 0) < amt) return false;
            }
        }
        return true;
    },

    // ── Internal ──────────────────────────────────────────────────────────
    _resLabel(res) {
        if (typeof RESOURCE_META !== 'undefined' && RESOURCE_META[res]) {
            return RESOURCE_META[res].label;
        }
        return res.charAt(0).toUpperCase() + res.slice(1);
    },
};
