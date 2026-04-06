// js/delves/delveState.js
// Shared mutable state for the current delve run.

const DelveState = {
    // 'idle' | 'playing' | 'paused' | 'complete'
    status:          'idle',

    // The pre-resolved run record (set by DelveEngine before playback starts)
    run:             null,

    // Playback
    playbackRecords: [],   // array of resolved node records (full run)
    playbackIndex:   -1,   // which record is currently "on screen" (-1 = not started)
    speed:           1,    // 1 | 2 | 4
    _interval:       null,

    // Accumulated visible log lines (grows as playback advances)
    visibleLog:      [],

    // Which delve is selected on the board (before starting)
    selectedDelveId: 'shattered_rift',

    reset() {
        this.status          = 'idle';
        this.run             = null;
        this.playbackRecords = [];
        this.playbackIndex   = -1;
        this.speed           = 1;
        this.visibleLog      = [];
        if (this._interval) { clearInterval(this._interval); this._interval = null; }
    },

    // Push a line to the visible log (caps at 80 lines)
    addLog(line) {
        this.visibleLog.push(line);
        if (this.visibleLog.length > 80) this.visibleLog.shift();
    },

    // The record currently shown during playback
    currentRecord() {
        if (this.playbackIndex < 0 || this.playbackIndex >= this.playbackRecords.length) return null;
        return this.playbackRecords[this.playbackIndex];
    },
};
