// js/delves/delvePlayback.js
// Controls tick-based playback of a resolved delve run.
// The animator runs independently on requestAnimationFrame.
// Each interval tick advances the playback record and tells the animator what to show.

const DelvePlayback = {

    // Milliseconds per node at each speed setting
    TICK_MS: { 1: 4200, 2: 2100, 4: 850 },

    start(runSnapshot, playbackRecords) {
        DelveState.run             = runSnapshot;
        DelveState.playbackRecords = playbackRecords;
        DelveState.playbackIndex   = -1;
        DelveState.visibleLog      = [];
        DelveState.status          = 'playing';

        if (DelveState._interval) clearInterval(DelveState._interval);
        DelveState._interval = setInterval(() => this._tick(), this.TICK_MS[DelveState.speed] || 4200);

        // Show first node immediately without waiting for the interval
        this._tick();
    },

    _tick() {
        DelveState.playbackIndex++;

        if (DelveState.playbackIndex >= DelveState.playbackRecords.length) {
            this._onComplete();
            return;
        }

        const record = DelveState.playbackRecords[DelveState.playbackIndex];

        // Push log lines
        if (record.logLines) {
            for (const line of record.logLines) DelveState.addLog(line);
        }

        // Tell the animator to play this record's animation sequence
        if (typeof DelveAnimator !== 'undefined' && DelveAnimator.canvas) {
            DelveAnimator.showRecord(record);
        }

        // Update the DOM — use smart partial update if canvas is already in DOM
        if (typeof Router !== 'undefined' && Router._current === 'rift_delve') {
            const container = document.getElementById('content-area');
            if (container?.querySelector('[data-delve-live]')) {
                _updateDelvePlaybackDynamic(container, record);
            } else {
                Router._load('rift_delve');
            }
        }
    },

    _onComplete() {
        clearInterval(DelveState._interval);
        DelveState._interval = null;
        DelveState.status    = 'complete';

        // Stop animator canvas loop
        if (typeof DelveAnimator !== 'undefined') DelveAnimator.destroy();

        // Award rewards to live player (handles corruption and logging for death)
        const player = typeof PlayerSystem !== 'undefined' ? PlayerSystem.current : null;
        if (player && DelveState.run) {
            DelveRewards.apply(player, DelveState.run, DelveState.playbackRecords);
        }

        const result = DelveState.run?.result || 'unknown';

        if (result !== 'death') {
            // Corruption for non-death outcomes — scales with tier
            if (player && DelveState.run && typeof PlayerSystem !== 'undefined') {
                const tier = DELVE_TYPES[DelveState.run.delveId]?.tier ?? 1;
                const base = tier * 4; // T1: 4  T2: 8  T3: 12
                const corr = result === 'success' ? base : Math.ceil(base * 0.5);
                PlayerSystem.gainCorruption(corr);
            }

            Log.add(
                `Delve complete — ${DelveState.run?.delveName}. Result: ${result}. ` +
                `+${DelveState.run?.goldFound || 0}g · +${DelveState.run?.xpFound || 0} XP.`,
                result === 'success' ? 'success' : 'warning'
            );
        }

        if (typeof Router !== 'undefined' && Router._current === 'rift_delve') {
            Router._load('rift_delve');
        }
    },

    setSpeed(n) {
        DelveState.speed = n;
        if (typeof DelveAnimator !== 'undefined') DelveAnimator.setSpeed(n);

        if (DelveState.status === 'playing' && DelveState._interval) {
            clearInterval(DelveState._interval);
            DelveState._interval = setInterval(() => this._tick(), this.TICK_MS[n] || 4200);
        }
    },

    pause() {
        if (DelveState.status !== 'playing') return;
        clearInterval(DelveState._interval);
        DelveState._interval = null;
        DelveState.status    = 'paused';
        if (typeof DelveAnimator !== 'undefined') DelveAnimator.pause();

        const container = document.getElementById('content-area');
        if (container?.querySelector('[data-delve-live]') && typeof _updateDelvePlaybackDynamic !== 'undefined') {
            _updateDelvePlaybackDynamic(container, DelveState.currentRecord());
        } else if (typeof Router !== 'undefined' && Router._current === 'rift_delve') {
            Router._load('rift_delve');
        }
    },

    resume() {
        if (DelveState.status !== 'paused') return;
        DelveState.status = 'playing';
        if (typeof DelveAnimator !== 'undefined') DelveAnimator.resume();
        DelveState._interval = setInterval(() => this._tick(), this.TICK_MS[DelveState.speed] || 4200);

        const container = document.getElementById('content-area');
        if (container?.querySelector('[data-delve-live]') && typeof _updateDelvePlaybackDynamic !== 'undefined') {
            _updateDelvePlaybackDynamic(container, DelveState.currentRecord());
        }
    },

    skipToNext() {
        const records = DelveState.playbackRecords;
        // Jump forward to the next interesting node
        for (let i = DelveState.playbackIndex + 1; i < records.length; i++) {
            const t = records[i].nodeType;
            if (t === 'combat' || t === 'boss' || t === 'reward' || t === 'death') {
                // Flush log for all skipped records
                for (let j = DelveState.playbackIndex + 1; j <= i; j++) {
                    const r = records[j];
                    if (r.logLines) for (const line of r.logLines) DelveState.addLog(line);
                    DelveState.playbackIndex = j;
                }
                const rec = records[DelveState.playbackIndex];
                if (typeof DelveAnimator !== 'undefined' && DelveAnimator.canvas) {
                    DelveAnimator.showRecord(rec);
                }
                const container = document.getElementById('content-area');
                if (container?.querySelector('[data-delve-live]')) {
                    _updateDelvePlaybackDynamic(container, rec);
                } else if (typeof Router !== 'undefined' && Router._current === 'rift_delve') {
                    Router._load('rift_delve');
                }
                return;
            }
        }
        // Nothing ahead — jump to end
        while (DelveState.playbackIndex < records.length - 1) this._tick();
    },

    stop() {
        clearInterval(DelveState._interval);
        DelveState._interval = null;
        DelveState.status    = 'idle';
        if (typeof DelveAnimator !== 'undefined') DelveAnimator.destroy();
    },
};
