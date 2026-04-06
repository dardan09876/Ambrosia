// js/combat/combatEngine.js
// Orchestrates the arena run: starts fights, advances turns, ends rounds.

const CombatEngine = {

    // ── Build a player combat snapshot ──────────────────────────────────────────
    _snapshot(player) {
        const stats   = player.stats;
        const upg     = player.arenaUpgrades || {};
        const loadout = buildPlayerLoadout(player.skills);

        // Base stats
        let maxHealth  = PlayerSystem.getStatMax('health');
        let maxMana    = PlayerSystem.getStatMax('mana');
        let maxStamina = PlayerSystem.getStatMax('stamina');

        // Apply permanent upgrade: Iron Constitution (+5% HP per level)
        maxHealth = Math.floor(maxHealth * (1 + (upg.healthBoost || 0) * 0.05));

        // Equipment stat contributions
        const equipStats = (typeof EquipSystem !== 'undefined') ? EquipSystem.getTotalStats() : { totalDamage: 0, totalDefense: 0 };

        const snapshot = {
            id:          'player',
            name:        player.name,
            health:      Math.min(stats.health.value, maxHealth),
            maxHealth,
            mana:        stats.mana.value,
            maxMana,
            stamina:     stats.stamina.value,
            maxStamina,
            skills:      Object.assign({}, player.skills),
            abilities:   loadout,
            effects:     [],
            cooldowns:   {},
            alive:       true,
            // Equipment-derived combat stats
            equipAttack:  equipStats.totalDamage,
            equipDefense: equipStats.totalDefense,
            // Arena damage multiplier from upgrades and items (1.0 = no bonus)
            arenaDamageMultiplier: 1 + (upg.combatDamage || 0) * 0.05,
            // Flat attack bonus from momentum (increments each round win)
            arenaDamageFlat: 0,
        };

        // Apply arena-exclusive equipment effects
        this._applyArenaItemEffects(snapshot, player);

        // Apply pending run consumable buffs
        this._applyRunBuffs(snapshot, player);

        return snapshot;
    },

    // ── Scan equipped items for arena-exclusive effects ──────────────────────────
    _applyArenaItemEffects(snapshot, player) {
        const allEquipped = Object.values(player.equipment).filter(Boolean);
        for (const item of allEquipped) {
            if (!item.arenaEffect) continue;
            switch (item.arenaEffect) {
                case 'selfBleed':
                    snapshot.selfBleedPerTurn = 5;
                    break;
                case 'spearBonus':
                    snapshot.arenaDamageMultiplier = (snapshot.arenaDamageMultiplier || 1) * 1.30;
                    break;
                case 'executioner':
                    snapshot.executioner = true;
                    break;
                case 'reducedStaminaRegen':
                    snapshot.reducedStaminaRegen = true;
                    break;
                case 'survivorsDodge':
                    snapshot.maxHealth   = Math.floor(snapshot.maxHealth * 0.90);
                    snapshot.health      = Math.min(snapshot.health, snapshot.maxHealth);
                    snapshot.passiveDodgeChance = (snapshot.passiveDodgeChance || 0) + 0.20;
                    break;
                case 'staminaRegen':
                    snapshot.ringStaminaRegen = (snapshot.ringStaminaRegen || 0) + 25;
                    break;
                case 'momentum':
                    snapshot.momentum = true;
                    break;
                case 'tokenBonus':
                    snapshot.tokenBonus = true;
                    break;
            }
        }
    },

    // ── Apply consumable buffs staged in player.pendingArenaBuffs ────────────────
    _applyRunBuffs(snapshot, player) {
        const pending = player.pendingArenaBuffs || [];
        for (const buffId of pending) {
            const def = (typeof getArenaConsumable !== 'undefined') ? getArenaConsumable(buffId) : null;
            if (!def) continue;
            const { type, value } = def.buff;
            switch (type) {
                case 'maxHealthPct':
                    snapshot.maxHealth = Math.floor(snapshot.maxHealth * (1 + value));
                    snapshot.health    = Math.min(snapshot.health, snapshot.maxHealth);
                    break;
                case 'maxManaPct':
                    snapshot.maxMana = Math.floor(snapshot.maxMana * (1 + value));
                    snapshot.mana    = Math.min(snapshot.mana, snapshot.maxMana);
                    break;
                case 'fullStamina':
                    snapshot.stamina = snapshot.maxStamina;
                    break;
                case 'revive':
                    snapshot.hasRevive = value;  // fraction of maxHealth to revive at
                    break;
            }
            ArenaState.runBuffs.push(buffId);
        }
        // Consume the pending buffs
        player.pendingArenaBuffs = [];
    },

    // ── Recover between rounds ──────────────────────────────────────────────────
    _recover(c) {
        const player = PlayerSystem.current;
        const upg    = player?.arenaUpgrades || {};

        // HP: base 15% + Battle Hardened upgrade (+5% per level)
        const hpPct = 0.15 + (upg.roundRecovery || 0) * 0.05;
        c.health = Math.min(c.maxHealth, c.health + Math.floor(c.maxHealth * hpPct));

        // Mana: base 20% of max + Arcane Focus upgrade (+10 flat per level)
        const extraMana = (upg.manaRegen || 0) * 10;
        c.mana = Math.min(c.maxMana, c.mana + Math.floor(c.maxMana * 0.20) + extraMana);

        // Stamina: base 25% of max + Endurance Training (+10 flat) + ring bonus, minus plate penalty
        let staminaRestore = Math.floor(c.maxStamina * 0.25)
            + (upg.staminaBonus || 0) * 10
            + (c.ringStaminaRegen || 0);
        if (c.reducedStaminaRegen) staminaRestore = Math.floor(staminaRestore * 0.80);
        c.stamina = Math.min(c.maxStamina, c.stamina + staminaRestore);

        c.effects   = [];
        c.cooldowns = {};
    },

    // ── Start a new arena run ───────────────────────────────────────────────────
    startRun() {
        const player = PlayerSystem.current;
        if (!player) return;

        const hp    = player.stats.health.value;
        const maxHp = PlayerSystem.getStatMax('health');
        if (hp < maxHp) {
            Log.add('You must be at full health to enter the arena.', 'warning');
            return;
        }

        ArenaState.reset();
        ArenaState.inRun   = true;
        ArenaState.round   = 1;
        ArenaState.player  = this._snapshot(player);

        const buffCount = ArenaState.runBuffs.length;
        const buffMsg   = buffCount > 0 ? ` (${buffCount} consumable${buffCount > 1 ? 's' : ''} active)` : '';
        Log.add(`Arena run started${buffMsg}.`, 'info');
        this._startFight();
    },

    // ── Start the current round's fight ────────────────────────────────────────
    _startFight() {
        const round = ArenaState.round;
        ArenaState.enemy = EnemyGenerator.generate(round);
        ArenaState.inCombat  = true;
        ArenaState.winner    = null;
        ArenaState.turn      = 0;
        ArenaState.turnOrder = ['player', 'enemy'];
        ArenaState.turnIndex = 0;

        ArenaState.log(`── Round ${round}: ${ArenaState.player.name} vs ${ArenaState.enemy.name} ──`);
        if (ArenaState.enemy.isBoss) ArenaState.log(`A powerful champion steps forward!`);

        // Tick one turn per second
        ArenaState._interval = setInterval(() => {
            this._tick();
        }, 1000);

        if (Router._current === 'arena') Router._load('arena');
    },

    // ── One combat turn ─────────────────────────────────────────────────────────
    _tick() {
        const state = ArenaState;
        if (!state.inCombat || !state.player?.alive || state.winner) {
            clearInterval(state._interval);
            state._interval = null;
            return;
        }

        state.turn++;
        const actorKey = state.turnOrder[state.turnIndex];
        const user     = actorKey === 'player' ? state.player : state.enemy;
        const target   = actorKey === 'player' ? state.enemy  : state.player;

        // Tick ongoing effects first
        CombatResolver.tickCombatant(user);

        // Self-bleed from Bloodforged Blade (player only)
        if (actorKey === 'player' && state.player.selfBleedPerTurn) {
            state.player.health = Math.max(0, state.player.health - state.player.selfBleedPerTurn);
            state.log(`The Bloodforged Blade drains ${state.player.selfBleedPerTurn} HP from ${state.player.name}.`);
            if (state.player.health <= 0) {
                state.player.alive = false;
                state.winner       = 'enemy';
                state.inCombat     = false;
                clearInterval(state._interval);
                state._interval    = null;
                state.log(`${state.player.name} has fallen to their own blade.`);
                this._onRunEnd();
                return;
            }
        }

        // Choose and resolve ability
        const ability = CombatAI.choose(user, target);
        CombatResolver.resolve(user, target, ability);

        // Check win condition
        if (!target.alive || target.health <= 0) {
            target.health = 0;
            target.alive  = false;

            // Revive check — Second Wind Elixir (player only, triggers when enemy kills player)
            if (actorKey === 'enemy' && state.player.hasRevive) {
                const revivePct = state.player.hasRevive;
                state.player.health   = Math.floor(state.player.maxHealth * revivePct);
                state.player.alive    = true;
                state.player.hasRevive = null;
                state.log(`${state.player.name} surges back with a Second Wind! (${Math.round(revivePct * 100)}% HP)`);
                if (Router._current === 'arena') Router._load('arena');
                // Advance turn so combat continues
                state.turnIndex = state.turnIndex === 0 ? 1 : 0;
                return;
            }

            state.winner   = actorKey;
            state.inCombat = false;
            clearInterval(state._interval);
            state._interval = null;

            if (actorKey === 'player') {
                state.log(`${user.name} wins round ${state.round}!`);
                this._onRoundWin();
            } else {
                state.log(`${target.name} has fallen. Run over.`);
                this._onRunEnd();
            }
            return;
        }

        // Advance turn
        state.turnIndex = state.turnIndex === 0 ? 1 : 0;

        if (Router._current === 'arena') Router._load('arena');
    },

    // ── Player wins a round ─────────────────────────────────────────────────────
    _onRoundWin() {
        const round = ArenaState.round;
        ArenaRewards.applyRound(round);
        this._recover(ArenaState.player);

        // Amulet of Momentum — +4 flat damage per round survived
        if (ArenaState.player.momentum) {
            ArenaState.player.arenaDamageFlat = (ArenaState.player.arenaDamageFlat || 0) + 4;
        }

        ArenaState.round++;
        ArenaState.log(`Preparing for round ${ArenaState.round}…`);

        // Sync player's live stats after recovery
        const livePlayer = PlayerSystem.current;
        if (livePlayer) {
            livePlayer.stats.health.value  = Math.min(ArenaState.player.health,  PlayerSystem.getStatMax('health'));
            livePlayer.stats.mana.value    = Math.min(ArenaState.player.mana,    PlayerSystem.getStatMax('mana'));
            livePlayer.stats.stamina.value = Math.min(ArenaState.player.stamina, PlayerSystem.getStatMax('stamina'));
        }

        if (Router._current === 'arena') Router._load('arena');

        // Short pause between rounds, then start next fight
        setTimeout(() => {
            if (ArenaState.inRun) this._startFight();
        }, 2500);
    },

    // ── Run ends (player died or withdrew) ──────────────────────────────────────
    _onRunEnd() {
        const roundsCleared = Math.max(0, ArenaState.round - 1);
        ArenaState.inRun    = false;
        ArenaState.inCombat = false;

        Log.add(
            `Arena run ended. ${roundsCleared} round${roundsCleared !== 1 ? 's' : ''} cleared · ` +
            `${ArenaState.totalGold}g earned · ${ArenaState.totalTokens} tokens.`,
            roundsCleared > 0 ? 'warning' : 'danger'
        );

        // Sync reduced health back to the live player
        const livePlayer = PlayerSystem.current;
        if (livePlayer && ArenaState.player) {
            livePlayer.stats.health.value  = Math.max(1, ArenaState.player.health);
            livePlayer.stats.mana.value    = Math.max(0, ArenaState.player.mana);
            livePlayer.stats.stamina.value = Math.max(0, ArenaState.player.stamina);
        }

        if (typeof SaveSystem !== 'undefined') SaveSystem.save();
        if (Router._current === 'arena') Router._load('arena');
    },

    // ── Manual withdraw ─────────────────────────────────────────────────────────
    withdraw() {
        if (!ArenaState.inRun) return;
        clearInterval(ArenaState._interval);
        ArenaState._interval = null;
        ArenaState.log('You withdraw from the arena.');
        this._onRunEnd();
    },
};
