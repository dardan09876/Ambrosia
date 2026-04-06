// js/pages/riftDelvePage.js
// Rift Delve page — board, animated playback, and results.
//
// IMPORTANT: during playback the canvas must not be destroyed on every re-render.
// _renderDelvePlayback() creates the full layout once. Subsequent ticks call
// _updateDelvePlaybackDynamic() to update only the log/controls/status bar.

Router.register('rift_delve', function renderRiftDelve(container) {
    const player = PlayerSystem.current;
    if (!player) return;

    switch (DelveState.status) {
        case 'playing':
        case 'paused':
            _renderDelvePlayback(container, player);
            break;
        case 'complete':
            _renderDelveResults(container);
            break;
        default:
            _renderDelveBoard(container, player);
    }
});

// ══════════════════════════════════════════════════════════════════════════════
// BOARD
// ══════════════════════════════════════════════════════════════════════════════

function _renderDelveBoard(container, player) {
    const delves       = Object.values(DELVE_TYPES);
    const playerLevel  = player.level || 1;
    const doctrine     = DelveDecisionAI.getDoctrine(player);
    const def          = getDelveType(DelveState.selectedDelveId) || delves[0];

    const delveCards = delves.map(d => {
        const locked   = playerLevel < d.minLevel;
        const selected = DelveState.selectedDelveId === d.id;
        const danger   = '◆'.repeat(d.dangerRating) + '◇'.repeat(10 - d.dangerRating);
        const reward   = '◆'.repeat(d.rewardRating) + '◇'.repeat(10 - d.rewardRating);
        return `
            <div class="delve-card ${selected ? 'delve-card-selected' : ''} ${locked ? 'delve-card-locked' : ''}"
                 onclick="${!locked ? `delveSelectDelve('${d.id}')` : ''}">
                <div class="delve-card-header">
                    <span class="delve-card-name">${d.name}</span>
                    <span class="delve-card-tier">T${d.tier}</span>
                </div>
                <p class="delve-card-subtitle">${d.subtitle}</p>
                <div class="delve-card-ratings">
                    <div class="delve-rating-row"><span class="delve-rating-label">Danger</span><span class="delve-rating-dots danger">${danger}</span></div>
                    <div class="delve-rating-row"><span class="delve-rating-label">Reward</span><span class="delve-rating-dots reward">${reward}</span></div>
                </div>
                <p class="delve-card-desc">${d.description}</p>
                ${locked ? `<div class="delve-card-lock">🔒 Level ${d.minLevel} required</div>` : ''}
            </div>
        `;
    }).join('');

    const hpPct   = Math.round((player.stats.health.value / PlayerSystem.getStatMax('health')) * 100);
    const locked  = playerLevel < (def?.minLevel || 1);

    container.innerHTML = `
        <div class="page">
            <div class="page-header">
                <h1 class="page-title">Rift Delves</h1>
                <p class="page-subtitle">Auto-resolving expedition simulator. Choose a delve and watch your character navigate it.</p>
            </div>
            <div class="delve-board-layout">
                <div class="delve-select-panel">
                    <div class="card-header">Select Expedition</div>
                    <div class="delve-card-grid">${delveCards}</div>
                </div>
                <div class="delve-briefing-panel">
                    <div class="card delve-brief-card">
                        <div class="card-header">Expedition Brief — ${def?.name || '?'}</div>
                        <div class="card-body">
                            <div class="delve-brief-row"><span class="delve-brief-label">Nodes</span><span>${def?.nodeCount || 8}</span></div>
                            <div class="delve-brief-row"><span class="delve-brief-label">Loot Tier</span><span>Tier ${def?.lootTier || 2}</span></div>
                            <div class="delve-brief-row"><span class="delve-brief-label">Boss</span><span>${DELVE_BOSSES[def?.bossId]?.name || '?'}</span></div>
                            <div class="delve-brief-row"><span class="delve-brief-label">Doctrine</span><span class="delve-doctrine-tag">${doctrine}</span></div>
                            <div class="delve-brief-row"><span class="delve-brief-label">Current HP</span><span class="${hpPct < 40 ? 'text-danger' : ''}">${hpPct}%</span></div>
                            ${hpPct < 40 ? '<p class="delve-warn">⚠ Health is low — rest before entering.</p>' : ''}
                            <button class="btn btn-primary delve-start-btn" ${locked ? 'disabled' : `onclick="delveStartRun('${def?.id}')"`}>
                                ${locked ? `Locked (Level ${def?.minLevel})` : 'Begin Expedition'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ══════════════════════════════════════════════════════════════════════════════
// PLAYBACK — initial full render
// ══════════════════════════════════════════════════════════════════════════════

function _renderDelvePlayback(container, player) {
    // If the layout is already in DOM, just do a dynamic update (preserves canvas)
    if (container.querySelector('[data-delve-live]')) {
        _updateDelvePlaybackDynamic(container, DelveState.currentRecord());
        return;
    }

    const run    = DelveState.run || {};
    const speed  = DelveState.speed || 1;
    const paused = DelveState.status === 'paused';

    container.innerHTML = `
        <div class="page" data-delve-live="1">
            <div class="page-header">
                <h1 class="page-title" id="delve-page-title">⚔ ${run.delveName || 'Delve'}</h1>
                <p class="page-subtitle" id="delve-page-subtitle">${run.doctrine || ''} doctrine</p>
            </div>

            <!-- Status bar -->
            <div id="delve-status-bar" class="delve-status-bar">
                ${_statusBarHtml()}
            </div>

            <!-- Canvas — the dungeon animation -->
            <div class="delve-canvas-wrap">
                <canvas id="delve-canvas" height="240"></canvas>
                <div id="delve-canvas-overlay" class="delve-canvas-overlay">
                    <span id="delve-node-label" class="delve-node-label-overlay"></span>
                </div>
            </div>

            <!-- Two-column below canvas: current event card + log -->
            <div class="delve-active-layout">
                <div id="delve-event-card" class="delve-event-card-wrap">
                    ${_eventCardHtml(DelveState.currentRecord())}
                </div>
                <div class="delve-log-panel">
                    <div class="delve-log-header">Expedition Log</div>
                    <div id="delve-log-scroll" class="delve-log-scroll">
                        ${_logHtml()}
                    </div>
                </div>
            </div>

            <!-- Controls -->
            <div id="delve-controls" class="delve-controls">
                ${_controlsHtml(speed, paused)}
            </div>
        </div>
    `;

    // Init animator after DOM is in place
    requestAnimationFrame(() => {
        const canvas = document.getElementById('delve-canvas');
        if (canvas) {
            DelveAnimator.init(canvas);
            DelveAnimator.setSpeed(speed);
            const rec = DelveState.currentRecord();
            if (rec) DelveAnimator.showRecord(rec);
        }
    });
}

// ── Partial DOM update during playback (canvas is left untouched) ─────────────

function _updateDelvePlaybackDynamic(container, record) {
    const statusEl = container.querySelector('#delve-status-bar');
    if (statusEl) statusEl.innerHTML = _statusBarHtml();

    const cardEl = container.querySelector('#delve-event-card');
    if (cardEl) cardEl.innerHTML = _eventCardHtml(record);

    const logEl = container.querySelector('#delve-log-scroll');
    if (logEl) {
        logEl.innerHTML = _logHtml();
        logEl.scrollTop = logEl.scrollHeight;
    }

    const ctrlEl = container.querySelector('#delve-controls');
    if (ctrlEl) ctrlEl.innerHTML = _controlsHtml(DelveState.speed, DelveState.status === 'paused');

    const lblEl = container.querySelector('#delve-node-label');
    if (lblEl) lblEl.textContent = record?.title || '';
}

// ── Sub-renderers ─────────────────────────────────────────────────────────────

function _statusBarHtml() {
    const record  = DelveState.currentRecord();
    const after   = record?.playerAfter;
    const hpPct   = after ? Math.round((after.health / after.maxHealth) * 100) : 100;
    const hpColor = hpPct > 50 ? 'var(--stat-health)' : hpPct > 25 ? 'var(--warning)' : 'var(--danger)';
    const idx     = DelveState.playbackIndex;
    const total   = DelveState.playbackRecords.length;
    return `
        <span class="delve-status-label">${DelveState.run?.delveName || 'Delve'}</span>
        <span class="delve-node-counter">Node ${Math.max(0, idx + 1)} / ${total}</span>
        <div class="delve-hp-bar-track">
            <div class="delve-hp-bar-fill" style="width:${hpPct}%;background:${hpColor}"></div>
        </div>
        <span class="delve-status-hp">${after ? `${after.health} / ${after.maxHealth} HP` : '…'}</span>
    `;
}

function _eventCardHtml(record) {
    if (!record) return '<div class="delve-event-card"><p class="delve-hint">Preparing expedition…</p></div>';
    const out   = record.outcome;
    const parts = [];
    if (out?.damageTaken > 0) parts.push(`<span class="oc-damage">-${out.damageTaken} HP</span>`);
    if (out?.gold > 0)        parts.push(`<span class="oc-gold">+${out.gold}g</span>`);
    if (out?.xp > 0)          parts.push(`<span class="oc-xp">+${out.xp} XP</span>`);
    if (out?.material)        parts.push(`<span class="oc-mat">${out.material.amount}× ${out.material.id.replace(/_/g,' ')}</span>`);
    if (out?.item)            parts.push(`<span class="oc-item">⚔ ${out.item.name}</span>`);
    if (out?.chest)           parts.push(`<span class="oc-item">📦 ${out.chest.name}</span>`);
    if (out?.retreat)         parts.push(`<span class="oc-warn">Retreated</span>`);
    if (out?.death)           parts.push(`<span class="oc-danger">Fallen</span>`);

    return `
        <div class="delve-event-card delve-card-${record.nodeType}">
            <div class="delve-event-top">
                <span class="delve-event-icon-sm">${record.icon || '◈'}</span>
                <span class="delve-event-title-sm">${record.title}</span>
            </div>
            <div class="delve-event-log">
                ${(record.logLines || []).map(l => `<p class="delve-event-line">${l}</p>`).join('')}
            </div>
            ${parts.length ? `<div class="delve-outcome-chips">${parts.join('')}</div>` : ''}
        </div>
    `;
}

function _logHtml() {
    return DelveState.visibleLog.slice(-35).map(l =>
        `<div class="delve-log-line">${l}</div>`
    ).join('');
}

function _controlsHtml(speed, paused) {
    return `
        <button class="btn btn-sm ${paused ? 'btn-primary' : 'btn-secondary'}"
            onclick="${paused ? 'DelvePlayback.resume()' : 'DelvePlayback.pause()'}">
            ${paused ? '▶ Resume' : '⏸ Pause'}
        </button>
        <button class="btn btn-sm btn-secondary" onclick="DelvePlayback.skipToNext()">⏭ Skip</button>
        <span class="delve-speed-label">Speed:</span>
        ${[1, 2, 4].map(s => `
            <button class="btn btn-sm ${speed === s ? 'btn-primary' : 'btn-secondary'}"
                onclick="DelvePlayback.setSpeed(${s})">${s}×</button>
        `).join('')}
    `;
}

// ══════════════════════════════════════════════════════════════════════════════
// RESULTS
// ══════════════════════════════════════════════════════════════════════════════

function _renderDelveResults(container) {
    const run = DelveState.run;
    if (!run) { delveReturnToBoard(); return; }

    const success     = run.result === 'success';
    const rewards     = DelveRewards.summarize(run);
    const rewardHtml  = rewards.map(r => `<div class="delve-reward-line">${r}</div>`).join('');
    const fullLogHtml = DelveState.visibleLog.map(l => `<div class="delve-log-line">${l}</div>`).join('');

    container.innerHTML = `
        <div class="page">
            <div class="page-header">
                <h1 class="page-title">${success ? '✔ Expedition Complete' : '✘ Expedition Failed'}</h1>
                <p class="page-subtitle">${run.delveName} — ${run.doctrine} doctrine</p>
            </div>
            <div class="delve-results-layout">
                <div class="card delve-results-summary">
                    <div class="card-header">Spoils</div>
                    <div class="card-body">
                        <div class="delve-rewards-list">
                            ${rewardHtml || '<p class="delve-hint">Nothing recovered.</p>'}
                        </div>
                        <div class="delve-results-actions">
                            <button class="btn btn-primary"   onclick="delveReturnToBoard()">Return to Board</button>
                            <button class="btn btn-secondary" onclick="delveStartRun('${run.delveId}')">Run Again</button>
                        </div>
                    </div>
                </div>
                <div class="card delve-results-log">
                    <div class="card-header">Full Expedition Log</div>
                    <div class="delve-log-scroll">${fullLogHtml}</div>
                </div>
            </div>
        </div>
    `;
}

// ══════════════════════════════════════════════════════════════════════════════
// GLOBAL HANDLERS
// ══════════════════════════════════════════════════════════════════════════════

function delveSelectDelve(id) {
    DelveState.selectedDelveId = id;
    const c = document.getElementById('content-area');
    if (c) Router._load('rift_delve');
}

function delveStartRun(delveId) {
    const player = PlayerSystem.current;
    if (!player) return;

    DelveState.reset();
    DelveState.selectedDelveId = delveId;

    const resolved = DelveEngine.resolveRun(delveId, player);
    if (!resolved) { Log.add('Could not start delve.', 'danger'); return; }

    Log.add(`Expedition begun: ${resolved.runSnapshot.delveName} (${resolved.runSnapshot.doctrine} doctrine).`, 'info');
    DelvePlayback.start(resolved.runSnapshot, resolved.playbackRecords);
}

function delveReturnToBoard() {
    if (typeof DelveAnimator !== 'undefined') DelveAnimator.destroy();
    DelveState.status = 'idle';
    const c = document.getElementById('content-area');
    if (c) Router._load('rift_delve');
}
