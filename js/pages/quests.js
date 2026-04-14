// js/pages/quests.js
// Quest board page.
// Shows: active quest tracker, daily board (randomised per day), chest inventory.

let _boardTierFilter = 0; // 0 = All
let _questTimerInterval = null;

Router.register('quests', function renderQuests(container) {
    if (_questTimerInterval) {
        clearInterval(_questTimerInterval);
        _questTimerInterval = null;
    }
    _renderQuestsPage(container);
});

// ── Full page render ──────────────────────────────────────────────────────────
function _renderQuestsPage(container) {
    const player = PlayerSystem.current;
    if (!player) return;

    if (typeof _tutorialComplete === 'function' && !_tutorialComplete()) {
        container.innerHTML = `<div class="page"><div class="page-header"><h1 class="page-title">Quests</h1></div><div class="page-body"><p class="page-empty-state">Complete your faction's introduction in the capital city to unlock this page.</p></div></div>`;
        return;
    }

    const hasQuestBoard = typeof MapSystem === 'undefined' || MapSystem.hasActivity('quests');

    const boardQuests = QuestSystem.getBoardQuests();

    const regionName = typeof MapSystem !== 'undefined' ? MapSystem.getCurrentRegionName() : '';

    let boardContent;
    if (!hasQuestBoard) {
        boardContent = `<div class="page-facility-blocked"><p>There is no quest board in ${regionName}.</p><p class="muted-text">Travel to a region that has a quest board to pick up work.</p></div>`;
    } else {
        boardContent = _buildBoardSection(boardQuests, player);
    }

    container.innerHTML = `
        <div class="page">
            <div class="page-header">
                <h1 class="page-title">Quest Board</h1>
                <p class="page-subtitle">
                    Complete quests to earn gold and loot chests.
                </p>
            </div>

            ${_buildRewardBanner()}
            ${_buildActiveQuestSection(player)}
            ${boardContent}
        </div>
    `;

    _bindAllButtons(container);
    _startQuestTimer();
}

// ── Reward banner ─────────────────────────────────────────────────────────────
function _buildRewardBanner() {
    const r = QuestSystem.lastReward;
    if (!r) return '';

    const cfg = {
        success: { cls: 'reward-success', icon: '✦', label: 'Quest Complete' },
        partial:  { cls: 'reward-partial',  icon: '◈', label: 'Partial Success' },
        failure:  { cls: 'reward-failure',  icon: '✗', label: 'Quest Failed' },
    }[r.outcome] || { cls: 'reward-partial', icon: '◈', label: 'Quest Done' };

    let detail = '';
    if (r.outcome === 'success') {
        const chestDef = CHEST_DEFS[r.chests?.tier];
        detail = `+${r.gold.toLocaleString()} gold  ·  ${r.chests?.count}× ${chestDef?.name ?? 'chest'}`;
    } else if (r.outcome === 'partial') {
        detail = `+${r.gold.toLocaleString()} gold  ·  no chest`;
    } else {
        detail = 'Skill check failed — no reward.';
    }

    // Phase log
    const log = r.log ?? [];
    const logHtml = log.length
        ? `<div class="reward-log">
            ${log.map(line =>
                line.startsWith('—')
                    ? `<div class="reward-log-phase">${line}</div>`
                    : `<div class="reward-log-line">${line}</div>`
            ).join('')}
        </div>`
        : '';

    return `
        <div class="quest-reward-banner ${cfg.cls}">
            <div class="reward-top">
                <span class="reward-icon">${cfg.icon}</span>
                <div class="reward-body">
                    <div class="reward-title">${r.questName}</div>
                    <div class="reward-outcome-label">${cfg.label}</div>
                    <div class="reward-detail">${detail}</div>
                </div>
                <button class="reward-dismiss" id="dismiss-reward">✕</button>
            </div>
            ${logHtml}
        </div>
    `;
}

// ── Active quest ──────────────────────────────────────────────────────────────
function _buildActiveQuestSection(player) {
    const active = player.quests.active;
    if (!active) return '<div id="active-quest-wrap"></div>';

    const quest = QUESTS.find(q => q.id === active.questId)
        ?? player.quests.guildBoard?.quests?.find(q => q.id === active.questId);
    if (!quest) return '<div id="active-quest-wrap"></div>';

    const remaining     = QuestSystem.getRemainingMs();
    const chance        = QuestSystem.getSuccessChance(quest);
    const currentPhase  = QuestSystem.getCurrentPhase();
    const phaseRemMs    = QuestSystem.getPhaseRemainingMs();
    const phaseProg     = QuestSystem.getPhaseProgress();
    const phases        = active.phases ?? [];
    const doneIndex     = active.currentPhaseIndex ?? 0;

    // Phase timeline dots
    const phaseTimeline = phases.length
        ? `<div class="aq-phase-timeline">
            ${phases.map((p, i) => {
                const isDone    = i < doneIndex;
                const isActive  = i === doneIndex;
                return `<div class="aq-phase-dot ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}" title="${p.name}">
                    <span class="aq-phase-dot-label">${p.name}</span>
                </div>`;
            }).join('<div class="aq-phase-connector"></div>')}
        </div>`
        : '';

    // Quest log
    const log = active.log ?? [];
    const logHtml = log.length
        ? `<div class="aq-log" id="aq-log">
            ${log.map(line =>
                line.startsWith('—')
                    ? `<div class="aq-log-phase">${line}</div>`
                    : `<div class="aq-log-line">${line}</div>`
            ).join('')}
        </div>`
        : `<div class="aq-log" id="aq-log"><div class="aq-log-line aq-log-muted">Awaiting first phase…</div></div>`;

    // Reward multiplier hint
    const mult    = active.rewardMultiplier ?? 1.0;
    const multPct = Math.round((mult - 1) * 100);
    const multStr = multPct > 0 ? `+${multPct}%` : multPct < 0 ? `${multPct}%` : '';
    const multCls = multPct > 0 ? 'aq-mult-pos' : multPct < 0 ? 'aq-mult-neg' : '';

    return `
        <div id="active-quest-wrap">
            <div class="active-quest-card">
                <div class="aq-header">
                    <div class="aq-label">Active Quest</div>
                    <div style="display:flex;align-items:center;gap:8px">
                        ${multStr ? `<span class="aq-mult ${multCls}" title="Reward modifier from phase events">${multStr} reward</span>` : ''}
                        <span class="quest-tier-badge tier-badge-${quest.tier}">Tier ${quest.tier}</span>
                    </div>
                </div>
                <div class="aq-name">${quest.name}</div>
                <div class="aq-meta">
                    <span>Eff. ${skillLabel(quest.skillCheck.skill)} ${quest.skillCheck.required.toLocaleString()} required</span>
                    <span class="aq-chance" style="color:${successColor(chance)}">${chance}% success</span>
                </div>

                ${phaseTimeline}

                <div class="aq-phase-status">
                    <span class="aq-phase-name" id="aq-phase-name">${currentPhase ? currentPhase.name : 'Complete'}</span>
                    <span class="aq-phase-timer" id="aq-phase-timer">${currentPhase ? formatMs(phaseRemMs) : ''}</span>
                </div>

                <div class="aq-progress-row">
                    <div class="aq-progress-track">
                        <div class="aq-progress-fill" id="aq-progress-fill" style="width:${phaseProg}%"></div>
                    </div>
                    <div class="aq-timer" id="quest-countdown">${formatMs(remaining)} total</div>
                </div>

                <div class="aq-log-header">Quest Log</div>
                ${logHtml}

                <div class="aq-actions">
                    ${(() => {
                        const ar = player.quests.autoRepeat;
                        if (ar && ar.questId === active.questId) {
                            const total = ar.repeatsLeft + 1;
                            return `<div class="aq-auto-repeat-badge">Auto-repeating · ${total} run${total !== 1 ? 's' : ''} remaining</div>`;
                        }
                        return '';
                    })()}
                    <button class="btn-secondary btn-sm" id="abandon-quest">Abandon quest</button>
                </div>
            </div>
        </div>
    `;
}

// ── Board section ─────────────────────────────────────────────────────────────
function _buildBoardSection(boardQuests, player) {
    const filtered = _boardTierFilter === 0
        ? boardQuests
        : boardQuests.filter(q => q.tier === _boardTierFilter);

    // Count board quests by tier for tab labels
    const tierCounts = [1, 2, 3, 4, 5].map(t => boardQuests.filter(q => q.tier === t).length);

    return `
        <div class="quest-section-header" style="margin-top:4px">
            Today's Board
            <span class="section-count">${boardQuests.length} quests</span>
        </div>
        <div class="quest-tier-tabs">
            <button class="qtab ${_boardTierFilter === 0 ? 'active' : ''}" data-tier="0">All</button>
            ${[1,2,3,4,5].map((t, i) => `
                <button class="qtab ${_boardTierFilter === t ? 'active' : ''}" data-tier="${t}">
                    Tier ${t}
                    <span class="qtab-count">${tierCounts[i]}</span>
                </button>
            `).join('')}
        </div>
        <div class="quest-list" id="quest-list">
            ${filtered.length
                ? filtered.map(q => _buildQuestCard(q, player)).join('')
                : '<p class="muted-text" style="padding:16px 0">No quests match this filter.</p>'
            }
        </div>
    `;
}

function _buildQuestCard(quest, player) {
    const hasActive    = !!player.quests.active;
    const blocked      = hasActive;
    const chance       = QuestSystem.getSuccessChance(quest);
    const skillVal     = PlayerSystem.getEffectiveSkill(quest.skillCheck.skill);
    const meetsSkill   = skillVal >= quest.skillCheck.required;
    const chestDef     = CHEST_DEFS[quest.chestReward.tier];
    const successCount = QuestSystem.getQuestSuccessCount(quest.id);
    const repeatUnlocked = successCount >= 5;

    let btnLabel = 'Begin Quest →';
    let btnTitle = `Start: ${quest.name}`;
    if (hasActive) { btnLabel = 'Quest Active'; btnTitle = 'A quest is already in progress.'; }

    // Repeat Quest button — visible only once 5 successes are recorded
    let repeatBtn = '';
    if (repeatUnlocked) {
        repeatBtn = `<button
            class="btn-secondary btn-sm btn-repeat-quest"
            data-quest-id="${quest.id}"
            ${blocked ? 'disabled' : ''}
            title="${blocked ? 'A quest is already in progress.' : 'Auto-repeat this quest'}"
        >Repeat Quest</button>`;
    }

    // Progress toward unlock hint (3–4 completions)
    let repeatHint = '';
    if (!repeatUnlocked && successCount >= 3) {
        repeatHint = `<span class="quest-repeat-hint">${successCount}/5 to unlock auto-repeat</span>`;
    }

    return `
        <div class="quest-card ${blocked ? 'quest-card-blocked' : ''}">
            <div class="quest-card-top">
                <div class="quest-card-left">
                    <div class="quest-card-name">${quest.name}</div>
                    <div class="quest-card-desc">${quest.description}</div>
                    <div class="quest-card-lore">"${quest.lore}"</div>
                </div>
                <div class="quest-card-right">
                    <span class="quest-tier-badge tier-badge-${quest.tier}">Tier ${quest.tier}</span>
                    ${successCount > 0 ? `<span class="quest-completions" title="${successCount} successful completion${successCount !== 1 ? 's' : ''}">×${successCount}</span>` : ''}
                </div>
            </div>

            <div class="quest-card-stats">
                <div class="quest-stat">
                    <span class="quest-stat-icon">⏱</span>
                    <span>${formatDuration(quest.duration)}</span>
                </div>
                <div class="quest-stat">
                    <span class="quest-stat-icon">◈</span>
                    <span>${quest.goldReward.min.toLocaleString()}–${quest.goldReward.max.toLocaleString()} gold</span>
                </div>
                <div class="quest-stat">
                    <span class="quest-stat-icon" style="color:${ITEM_TIER_COLORS[quest.chestReward.tier]}">⬡</span>
                    <span>${chestDef?.name ?? 'Chest'}</span>
                </div>
                <div class="quest-stat">
                    <span class="quest-stat-label">Requires:</span>
                    <span class="${meetsSkill ? 'req-met' : 'req-unmet'}">
                        Eff. ${skillLabel(quest.skillCheck.skill)} ${quest.skillCheck.required.toLocaleString()}
                        ${meetsSkill ? '✓' : `(you: ${skillVal.toLocaleString()})`}
                    </span>
                </div>
                <div class="quest-stat">
                    <span class="quest-stat-label">Success:</span>
                    <span style="color:${successColor(chance)};font-weight:700">${chance}%</span>
                </div>
            </div>

            <div class="quest-card-footer">
                ${repeatHint}
                <div class="quest-card-footer-btns">
                    ${repeatBtn}
                    <button
                        class="btn-primary btn-sm btn-start-quest ${blocked ? 'btn-blocked' : ''}"
                        data-quest-id="${quest.id}"
                        ${blocked ? 'disabled' : ''}
                        title="${btnTitle}"
                    >${btnLabel}</button>
                </div>
            </div>
        </div>
    `;
}

// ── Event binding ─────────────────────────────────────────────────────────────
function _bindAllButtons(container) {
    // Dismiss reward banner
    container.querySelector('#dismiss-reward')?.addEventListener('click', () => {
        QuestSystem.lastReward = null;
        container.querySelector('.quest-reward-banner')?.remove();
    });

    // Abandon
    container.querySelector('#abandon-quest')?.addEventListener('click', () => {
        if (confirm('Abandon this quest? You will receive no reward.')) {
            QuestSystem.abandon();
        }
    });

    // Tier filter tabs
    container.querySelectorAll('.qtab').forEach(btn => {
        btn.addEventListener('click', () => {
            _boardTierFilter = parseInt(btn.dataset.tier);
            container.querySelectorAll('.qtab').forEach(b => b.classList.toggle('active', b === btn));
            const boardQuests = QuestSystem.getBoardQuests();
            const filtered    = _boardTierFilter === 0
                ? boardQuests
                : boardQuests.filter(q => q.tier === _boardTierFilter);
            document.getElementById('quest-list').innerHTML =
                filtered.length
                    ? filtered.map(q => _buildQuestCard(q, PlayerSystem.current)).join('')
                    : '<p class="muted-text" style="padding:16px 0">No quests match this filter.</p>';
            // Rebind start + repeat buttons after partial re-render
            document.querySelectorAll('.btn-start-quest:not([disabled])').forEach(_bindStartBtn);
            document.querySelectorAll('.btn-repeat-quest:not([disabled])').forEach(btn => {
                btn.addEventListener('click', () => _openRepeatQuestPopup(btn.dataset.questId));
            });
        });
    });

    // Start quest buttons
    container.querySelectorAll('.btn-start-quest:not([disabled])').forEach(_bindStartBtn);

    // Repeat quest buttons
    container.querySelectorAll('.btn-repeat-quest:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () => _openRepeatQuestPopup(btn.dataset.questId));
    });
}

function _bindStartBtn(btn) {
    btn.addEventListener('click', () => {
        const result = QuestSystem.start(btn.dataset.questId);
        if (!result.ok) { Log.add(result.reason, 'warning'); return; }
        const container = document.getElementById('content-area');
        if (container) _renderQuestsPage(container);
    });
}

// ── Repeat Quest popup ────────────────────────────────────────────────────────
function _openRepeatQuestPopup(questId) {
    if (document.getElementById('repeat-quest-overlay')) return;

    const quest = QuestSystem._findQuest(questId);
    if (!quest) return;

    const overlay = document.createElement('div');
    overlay.id = 'repeat-quest-overlay';
    overlay.className = 'rq-overlay';
    overlay.innerHTML = `
        <div class="rq-panel">
            <div class="rq-header">
                <div class="rq-title">Repeat Quest</div>
                <button class="rq-close" id="rq-close">✕</button>
            </div>
            <div class="rq-quest-name">${quest.name}</div>
            <div class="rq-body">
                <div class="rq-field">
                    <div class="rq-field-label">Repeats</div>
                    <div class="rq-opts" id="rq-repeats">
                        ${[2, 4, 6, 8].map((n, i) =>
                            `<button class="rq-opt${i === 0 ? ' active' : ''}" data-value="${n}">${n}</button>`
                        ).join('')}
                    </div>
                </div>
                <div class="rq-field">
                    <div class="rq-field-label">Stop on failure</div>
                    <div class="rq-toggle-row">
                        <button class="rq-toggle active" id="rq-fail-yes">Yes</button>
                        <button class="rq-toggle" id="rq-fail-no">No</button>
                    </div>
                </div>
                <div class="rq-field">
                    <div class="rq-field-label">Stop if durability below 25%</div>
                    <div class="rq-toggle-row">
                        <button class="rq-toggle active" id="rq-dur-yes">Yes</button>
                        <button class="rq-toggle" id="rq-dur-no">No</button>
                    </div>
                </div>
            </div>
            <div class="rq-footer">
                <button class="btn-secondary btn-sm" id="rq-cancel">Cancel</button>
                <button class="btn-primary btn-sm" id="rq-confirm">Begin Auto-Repeat →</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Backdrop click closes
    overlay.addEventListener('click', e => { if (e.target === overlay) _closeRepeatQuestPopup(); });

    overlay.querySelector('#rq-close').addEventListener('click', _closeRepeatQuestPopup);
    overlay.querySelector('#rq-cancel').addEventListener('click', _closeRepeatQuestPopup);

    // Repeats selector
    overlay.querySelectorAll('#rq-repeats .rq-opt').forEach(btn => {
        btn.addEventListener('click', () => {
            overlay.querySelectorAll('#rq-repeats .rq-opt').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Yes/No toggles
    function _bindToggle(yesId, noId) {
        const yes = overlay.querySelector('#' + yesId);
        const no  = overlay.querySelector('#' + noId);
        yes.addEventListener('click', () => { yes.classList.add('active'); no.classList.remove('active'); });
        no.addEventListener('click',  () => { no.classList.add('active');  yes.classList.remove('active'); });
    }
    _bindToggle('rq-fail-yes', 'rq-fail-no');
    _bindToggle('rq-dur-yes',  'rq-dur-no');

    // Confirm
    overlay.querySelector('#rq-confirm').addEventListener('click', () => {
        const repeats            = parseInt(overlay.querySelector('#rq-repeats .rq-opt.active')?.dataset.value ?? '2');
        const stopOnFailure      = overlay.querySelector('#rq-fail-yes').classList.contains('active');
        const stopOnLowDurability = overlay.querySelector('#rq-dur-yes').classList.contains('active');

        QuestSystem.setAutoRepeat(questId, { repeats, stopOnFailure, stopOnLowDurability });

        const startResult = QuestSystem.start(questId);
        _closeRepeatQuestPopup();

        if (!startResult.ok) {
            QuestSystem.cancelAutoRepeat();
            Log.add(startResult.reason, 'warning');
            return;
        }

        const container = document.getElementById('content-area');
        if (container) _renderQuestsPage(container);
    });

    // Escape key
    overlay._keyHandler = e => { if (e.key === 'Escape') _closeRepeatQuestPopup(); };
    document.addEventListener('keydown', overlay._keyHandler);
}

function _closeRepeatQuestPopup() {
    const overlay = document.getElementById('repeat-quest-overlay');
    if (!overlay) return;
    if (overlay._keyHandler) document.removeEventListener('keydown', overlay._keyHandler);
    overlay.remove();
}

// ── Live countdown timers ─────────────────────────────────────────────────────
function _startQuestTimer() {
    _questTimerInterval = setInterval(() => {
        // Self-clean on navigation
        if (!document.getElementById('quest-countdown') && !document.getElementById('board-reset-timer')) {
            clearInterval(_questTimerInterval);
            _questTimerInterval = null;
            return;
        }

        // Quest countdown + phase display
        const countdownEl = document.getElementById('quest-countdown');
        if (countdownEl) {
            countdownEl.textContent = `${formatMs(QuestSystem.getRemainingMs())} total`;
        }
        const progressEl = document.getElementById('aq-progress-fill');
        if (progressEl) {
            progressEl.style.width = `${QuestSystem.getPhaseProgress()}%`;
        }
        const phaseNameEl = document.getElementById('aq-phase-name');
        const phaseTimerEl = document.getElementById('aq-phase-timer');
        if (phaseNameEl || phaseTimerEl) {
            const phase = QuestSystem.getCurrentPhase();
            const active = PlayerSystem.current?.quests?.active;
            const doneIdx = active?.currentPhaseIndex ?? 0;
            if (phaseNameEl) phaseNameEl.textContent = phase ? phase.name : 'Complete';
            if (phaseTimerEl) phaseTimerEl.textContent = phase ? formatMs(QuestSystem.getPhaseRemainingMs()) : '';
            // Update phase dots in case a phase just completed
            if (active?.phases) {
                document.querySelectorAll('.aq-phase-dot').forEach((dot, i) => {
                    dot.classList.toggle('done',   i < doneIdx);
                    dot.classList.toggle('active', i === doneIdx);
                });
            }
            // Refresh log if new entries exist
            const logEl = document.getElementById('aq-log');
            if (logEl && active?.log) {
                const newHtml = active.log.map(line =>
                    line.startsWith('—')
                        ? `<div class="aq-log-phase">${line}</div>`
                        : `<div class="aq-log-line">${line}</div>`
                ).join('');
                if (logEl.innerHTML !== newHtml) {
                    logEl.innerHTML = newHtml;
                    logEl.scrollTop = logEl.scrollHeight;
                }
            }
            // Refresh reward multiplier badge
            const multEl = document.querySelector('.aq-mult');
            if (multEl !== null || active) {
                const mult    = active?.rewardMultiplier ?? 1.0;
                const multPct = Math.round((mult - 1) * 100);
                const multStr = multPct > 0 ? `+${multPct}%` : multPct < 0 ? `${multPct}%` : '';
                const header  = document.querySelector('.aq-header');
                if (header) {
                    let badge = header.querySelector('.aq-mult');
                    if (multStr) {
                        const cls = multPct > 0 ? 'aq-mult-pos' : 'aq-mult-neg';
                        if (badge) {
                            badge.textContent = `${multStr} reward`;
                            badge.className = `aq-mult ${cls}`;
                        } else {
                            const span = document.createElement('span');
                            span.className = `aq-mult ${cls}`;
                            span.title = 'Reward modifier from phase events';
                            span.textContent = `${multStr} reward`;
                            header.querySelector('div[style]')?.prepend(span);
                        }
                    } else if (badge) {
                        badge.remove();
                    }
                }
            }
        }

        // Board reset timer
        const resetEl = document.getElementById('board-reset-timer');
        if (resetEl) {
            resetEl.textContent = formatDuration(QuestSystem.secondsUntilReset());
        }
    }, 1000);
}
