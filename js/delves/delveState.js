// js/delves/delveState.js
// Mutable state for an active interactive grid-based delve run.
// The run is ephemeral — not persisted to saves mid-run.

const DelveState = {
    // ── Run lifecycle ─────────────────────────────────────────────────────────
    // 'idle' | 'exploring' | 'combat' | 'result'
    phase:    'idle',
    delveId:  null,
    delveDef: null,

    // ── Grid (10×10 flat array, index = y*10+x) ───────────────────────────────
    grid:      null,
    playerPos: null,   // { x, y }
    turn:      0,

    // ── Player snapshot for this run ──────────────────────────────────────────
    playerHp:     0,
    playerMaxHp:  0,
    playerAttack: 0,
    playerDefense:0,
    playerPower:  0,

    // ── Corruption accumulated this run (applied to live player at end) ───────
    gainedCorruption: 0,

    // ── Loot collected this run ───────────────────────────────────────────────
    goldFound:       0,
    materialsFound:  [],
    riftShardsFound: 0,
    xpFound:         0,

    // ── Active combat ─────────────────────────────────────────────────────────
    // { enemy: {...with role mods}, enemyHp, enemyMaxHp, isBoss }
    combat: null,

    // ── Run result ────────────────────────────────────────────────────────────
    // 'victory' | 'death' | 'escaped'
    result: null,

    // ── Combat + exploration log ──────────────────────────────────────────────
    log: [],

    // ── Board selection (persists between runs) ───────────────────────────────
    selectedDelveId: 'shattered_rift',

    // ─────────────────────────────────────────────────────────────────────────

    addLog(line) {
        this.log.push(line);
        if (this.log.length > 60) this.log.shift();
    },

    reset() {
        this.phase             = 'idle';
        this.delveId           = null;
        this.delveDef          = null;
        this.grid              = null;
        this.playerPos         = null;
        this.turn              = 0;
        this.playerHp          = 0;
        this.playerMaxHp       = 0;
        this.playerAttack      = 0;
        this.playerDefense     = 0;
        this.playerPower       = 0;
        this.gainedCorruption  = 0;
        this.goldFound         = 0;
        this.materialsFound    = [];
        this.riftShardsFound   = 0;
        this.xpFound           = 0;
        this.combat            = null;
        this.result            = null;
        this.log               = [];
    },
};
