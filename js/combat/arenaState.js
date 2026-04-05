// js/combat/arenaState.js
// Shared mutable state for the current arena run.
// All arena modules read/write this object directly.

const ArenaState = {
    inRun:      false,   // true while a run is active
    inCombat:   false,   // true while a fight is ongoing
    round:      0,       // current round number (1-based)
    turn:       0,       // turn counter within a fight
    turnOrder:  [],      // ['player','enemy'] or ['enemy','player']
    turnIndex:  0,       // index into turnOrder

    player:     null,    // combat snapshot — see combatEngine.js
    enemy:      null,    // combat snapshot — see enemyGenerator.js

    combatLog:  [],      // array of string messages
    winner:     null,    // 'player' | 'enemy' | null

    totalGold:       0,  // gold earned this run
    totalTokens:     0,  // arena tokens earned this run
    chestsEarned:    [], // { tier, name } objects

    _interval:  null,    // setInterval handle for combat ticks

    reset() {
        this.inRun      = false;
        this.inCombat   = false;
        this.round      = 0;
        this.turn       = 0;
        this.turnOrder  = [];
        this.turnIndex  = 0;
        this.player     = null;
        this.enemy      = null;
        this.combatLog  = [];
        this.winner     = null;
        this.totalGold  = 0;
        this.totalTokens = 0;
        this.chestsEarned = [];
        if (this._interval) { clearInterval(this._interval); this._interval = null; }
    },

    log(msg) {
        this.combatLog.unshift(msg);    // newest first
        if (this.combatLog.length > 60) this.combatLog.length = 60;
    },
};
