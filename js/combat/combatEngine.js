// js/combat/combatEngine.js
// Orchestrates the arena run: starts fights, advances turns, ends rounds.

const CombatEngine = {

    // ── Build a player combat snapshot ──────────────────────────────────────────
    _snapshot(player) {
        const stats    = player.stats;
        const loadout  = buildPlayerLoadout(player.skills);
        return {
            id:          'player',
            name:        player.name,
            health:      stats.health.value,
            maxHealth:   PlayerSystem.getStatMax('health'),
            mana:        stats.mana.value,
            maxMana:     PlayerSystem.getStatMax('mana'),
            stamina:     stats.stamina.value,
            maxStamina:  PlayerSystem.getStatMax('stamina'),
            skills:      Object.assign({}, player.skills),
            abilities:   loadout,
            effects:     [],
            cooldowns:   {},
            alive:       true,
        };
    },

    // ── Recover between rounds ──────────────────────────────────────────────────
    _recover(c) {
        c.health  = Math.min(c.maxHealth,  c.health  + Math.floor(c.maxHealth  * 0.15));
        c.mana    = Math.min(c.maxMana,    c.mana    + Math.floor(c.maxMana    * 0.20));
        c.stamina = Math.min(c.maxStamina, c.stamina + Math.floor(c.maxStamina * 0.25));
        c.effects   = [];
        c.cooldowns = {};
    },

    // ── Start a new arena run ───────────────────────────────────────────────────
    startRun() {
        const player = PlayerSystem.current;
        if (!player) return;

        ArenaState.reset();
        ArenaState.inRun   = true;
        ArenaState.round   = 1;
        ArenaState.player  = this._snapshot(player);

        Log.add('Arena run started.', 'info');
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

        // Choose and resolve ability
        const ability = CombatAI.choose(user, target);
        CombatResolver.resolve(user, target, ability);

        // Check win condition
        if (!target.alive || target.health <= 0) {
            target.health = 0;
            target.alive  = false;
            state.winner  = actorKey;
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
        ArenaRewards.applyRound(ArenaState.round);
        this._recover(ArenaState.player);

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
