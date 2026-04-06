// js/systems/gameLoop.js
// Master game loop — runs every second once a character is loaded.

const GameLoop = {
    TICK_MS: 1000,          // 1 second per tick
    FOOD_DRAIN_RATE: 300,   // seconds between each -1 food drain
    AUTO_SAVE_INTERVAL: 30, // seconds between auto-saves

    _interval: null,
    _foodTimer: 0,
    _saveTimer: 0,

    start() {
        if (this._interval) return;
        this._interval = setInterval(() => this._tick(), this.TICK_MS);
        console.log('[GameLoop] Started');
    },

    stop() {
        if (this._interval) {
            clearInterval(this._interval);
            this._interval = null;
        }
    },

    _tick() {
        if (!PlayerSystem.current) return;

        this._foodTimer++;
        this._saveTimer++;

        // ── Food drain ────────────────────────────────────────
        const foodEfficiency    = (typeof AbilitySystem !== 'undefined')
            ? AbilitySystem.getFoodEfficiency()
            : 0;
        const effectiveDrainRate = Math.round(this.FOOD_DRAIN_RATE / Math.max(0.05, 1 - foodEfficiency));
        if (this._foodTimer >= effectiveDrainRate) {
            this._foodTimer = 0;
            const sv = PlayerSystem.current.survival;
            if (sv.food > 0) {
                sv.food = Math.max(0, sv.food - 1);
            }
            PlayerSystem.updateSurvivalState();
        }

        // ── Stat regen ────────────────────────────────────────
        this._regenStats();

        // ── Auto-save ─────────────────────────────────────────
        if (this._saveTimer >= this.AUTO_SAVE_INTERVAL) {
            this._saveTimer = 0;
            SaveSystem.save();
        }

        // ── Active effects cleanup ────────────────────────────
        PlayerSystem.cleanActiveEffects();

        // ── Quest tick (resolve completed quests) ─────────────
        QuestSystem.tick();

        // ── Warband tick (resolve rift quests, enemy pressure) ─
        if (typeof WarbandSystem !== 'undefined') WarbandSystem.tick();

        // ── Daily shelter cost ─────────────────────────────────
        this._checkShelterCost();

        // ── Hospitalization check (before instability) ────────
        this._hospitalizationCheck();

        // ── Corruption instability events ─────────────────────
        this._corruptionInstabilityCheck();

        // ── UI refresh ────────────────────────────────────────
        Layout.updateStatBars();
    },

    // ── Daily shelter cost — charged once per real calendar day ───────────────
    _checkShelterCost() {
        const player = PlayerSystem.current;
        if (typeof MapSystem === 'undefined') return;

        const today = QuestSystem._today();

        // First login ever — record today and don't charge
        if (!player.shelter.date) {
            player.shelter.date = today;
            return;
        }

        // Already charged today
        if (player.shelter.date === today) return;

        player.shelter.date = today;

        const regionName = MapSystem.getCurrentRegionName();
        const cost       = MapSystem.getShelterCost(player.location);

        if (player.gold >= cost) {
            player.gold -= cost;
            Log.add(`Paid ${cost.toLocaleString()}g for shelter in ${regionName}.`, 'info');
        } else {
            const paid   = player.gold;
            player.gold  = 0;
            Log.add(`Could not afford shelter in ${regionName} (${cost.toLocaleString()}g). Paid what you had (${paid.toLocaleString()}g) and owe a debt.`, 'danger');
        }

        SaveSystem.save();
    },

    // ── Hospitalization check ─────────────────────────────────────────────────
    // Corruption can overwhelm the player and force them to the capital.
    // Chance per tick: Corrupted 0.02%, Fallen 0.06%, Abyssal 0.15%
    // Duration: Corrupted 20 min, Fallen 45 min, Abyssal 90 min
    _hospitalizationCheck() {
        const player = PlayerSystem.current;
        if (!player) return;

        // Clear expired hospitalization
        if (player.hospitalized && Date.now() >= player.hospitalized.until) {
            player.hospitalized = null;
            Log.add('You have recovered and been discharged from the hospital.', 'success');
            SaveSystem.save();
            return;
        }

        // Already hospitalized — nothing to trigger
        if (player.hospitalized) return;

        const tier   = PlayerSystem.getCorruptionTier();
        const config = {
            corrupted: { chance: 0.0002, durationMs: 20 * 60 * 1000 },
            fallen:    { chance: 0.0006, durationMs: 45 * 60 * 1000 },
            abyssal:   { chance: 0.0015, durationMs: 90 * 60 * 1000 },
        }[tier.id];
        if (!config || Math.random() > config.chance) return;

        PlayerSystem.hospitalize(config.durationMs);
        // Refresh whichever page is open
        if (typeof Router !== 'undefined' && Router._current) {
            Router._load(Router._current);
        }
    },

    // ── Corruption instability — random events at Corrupted+ tier ────────────
    // Chance per tick: Corrupted 0.2%, Fallen 0.5%, Abyssal 1.0%
    _corruptionInstabilityCheck() {
        const player = PlayerSystem.current;
        if (!player) return;

        const tier   = PlayerSystem.getCorruptionTier();
        const chance = { corrupted: 0.002, fallen: 0.005, abyssal: 0.010 }[tier.id];
        if (!chance || Math.random() > chance) return;

        const events = [
            () => {
                const loss = Math.max(1, Math.floor(player.stats.health.value * 0.08));
                player.stats.health.value = Math.max(1, player.stats.health.value - loss);
                Log.add(`Corruption flares — lost ${loss} health.`, 'danger');
            },
            () => {
                PlayerSystem.applyActiveEffect({ type: 'regen_reduction', stat: 'focus', amount: 0.50, durationMin: 5 });
                Log.add('Rift whispers distract you — Focus regen halved for 5 min.', 'warning');
            },
            () => {
                const loss = Math.max(1, Math.floor(player.stats.stamina.value * 0.10));
                player.stats.stamina.value = Math.max(0, player.stats.stamina.value - loss);
                Log.add(`Corrupt energy drains your stamina — lost ${loss} stamina.`, 'warning');
            },
        ];
        events[Math.floor(Math.random() * events.length)]();
    },

    // ── Offline progress — called once on load ────────────────────────────────
    // Simulates food drain, stat regen, and shelter costs for the time the game
    // was closed. Uses base regen intervals (active effects are ignored — they
    // would have expired during the offline period). Capped at 8 hours.
    applyOfflineProgress(savedAt) {
        if (!PlayerSystem.current || !savedAt) return;
        const now       = Date.now();
        const elapsedMs = now - savedAt;
        if (elapsedMs < 2000) return; // trivially short — skip

        const MAX_OFFLINE_MS = 8 * 60 * 60 * 1000; // 8-hour cap
        const clampedMs  = Math.min(elapsedMs, MAX_OFFLINE_MS);
        const elapsedSec = Math.floor(clampedMs / 1000);

        const player   = PlayerSystem.current;
        const logLines = [];

        // ── Food drain ────────────────────────────────────────
        const drainCycles = Math.floor(elapsedSec / this.FOOD_DRAIN_RATE);
        if (drainCycles > 0) {
            const sv     = player.survival;
            const before = sv.food;
            sv.food      = Math.max(0, sv.food - drainCycles);
            const drained = before - sv.food;
            PlayerSystem.updateSurvivalState();
            if (drained > 0) logLines.push(`Food −${drained} (offline drain).`);
        }

        // ── Stat regen (base intervals, active effects ignored) ───────────────
        const gains = {};
        for (const [statName, stat] of Object.entries(player.stats)) {
            const cap = PlayerSystem.getStatMax(statName);
            if (stat.value >= cap) continue;
            const totalSec = elapsedSec + stat._timer;
            const cycles   = Math.floor(totalSec / stat.regenInterval);
            if (cycles > 0) {
                const gain = Math.min(cap - stat.value, cycles * stat.regenAmount);
                if (gain > 0) {
                    stat.value    += gain;
                    gains[statName] = gain;
                }
            }
            stat._timer = totalSec % stat.regenInterval;
        }
        if (Object.keys(gains).length > 0) {
            logLines.push('Regen: ' + Object.entries(gains).map(([k, v]) => `+${v} ${k}`).join(', ') + '.');
        }

        // ── Shelter cost for each missed calendar day ─────────────────────────
        // Today's charge is handled by the live game loop; only back-fill past days.
        if (typeof MapSystem !== 'undefined') {
            const toDateStr = (d) =>
                `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

            const todayStr   = toDateStr(new Date());
            const cost       = MapSystem.getShelterCost(player.location);
            const regionName = MapSystem.getCurrentRegionName();

            // Start charging from the day after the last recorded shelter date
            const lastCharged = player.shelter.date || toDateStr(new Date(savedAt));
            const cur         = new Date(lastCharged + 'T00:00:00');
            cur.setDate(cur.getDate() + 1);

            let shelterPaid = 0;
            let shelterDebt = false;
            let dayCount    = 0;

            while (toDateStr(cur) < todayStr) {
                dayCount++;
                player.shelter.date = toDateStr(cur);
                if (player.gold >= cost) {
                    player.gold  -= cost;
                    shelterPaid  += cost;
                } else {
                    shelterPaid  += player.gold;
                    player.gold   = 0;
                    shelterDebt   = true;
                }
                cur.setDate(cur.getDate() + 1);
            }

            if (dayCount > 0) {
                const dayWord = dayCount === 1 ? 'day' : 'days';
                if (shelterDebt) {
                    logLines.push(`Shelter in ${regionName}: paid ${shelterPaid.toLocaleString()}g over ${dayCount} ${dayWord} but couldn't cover all costs.`);
                } else if (shelterPaid > 0) {
                    logLines.push(`Shelter in ${regionName}: paid ${shelterPaid.toLocaleString()}g over ${dayCount} ${dayWord} offline.`);
                }
            }
        }

        // ── Summary log ───────────────────────────────────────
        if (logLines.length > 0) {
            const mins   = Math.round(clampedMs / 60000);
            const capped = elapsedMs > MAX_OFFLINE_MS ? ' (capped at 8 h)' : '';
            Log.add(`Welcome back! Offline for ~${mins} min${capped}.`, 'info');
            for (const line of logLines) Log.add(line, 'info');
        }
    },

    // Tick each stat's regen timer and add regenAmount when due
    _regenStats() {
        const stats = PlayerSystem.current.stats;
        for (const statName of Object.keys(stats)) {
            const stat             = stats[statName];
            const cap              = PlayerSystem.getStatMax(statName);
            if (stat.value >= cap) continue;

            stat._timer++;
            const effectiveInterval = PlayerSystem.getEffectiveRegenInterval(statName);
            if (stat._timer >= effectiveInterval) {
                stat._timer = 0;
                stat.value  = Math.min(cap, stat.value + stat.regenAmount);
            }
        }
    },
};
