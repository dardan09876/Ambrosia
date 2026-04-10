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
                    A fresh board is posted each day at midnight.
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
        success: { cls: 'reward-success', icon: '✦' },
        partial:  { cls: 'reward-partial',  icon: '◈' },
        failure:  { cls: 'reward-failure',  icon: '✗' },
    }[r.outcome] || { cls: 'reward-partial', icon: '◈' };

    let detail = '';
    if (r.outcome === 'success') {
        const chestDef = CHEST_DEFS[r.chests?.tier];
        detail = `+${r.gold.toLocaleString()} gold  ·  ${r.chests?.count}× ${chestDef?.name ?? 'chest'}`;
    } else if (r.outcome === 'partial') {
        detail = `+${r.gold.toLocaleString()} gold  ·  no chest (partial success)`;
    } else {
        detail = 'Skill check failed — no reward.';
    }

    return `
        <div class="quest-reward-banner ${cfg.cls}">
            <span class="reward-icon">${cfg.icon}</span>
            <div class="reward-body">
                <div class="reward-title">${r.questName}</div>
                <div class="reward-detail">${detail}</div>
            </div>
            <button class="reward-dismiss" id="dismiss-reward">✕</button>
        </div>
    `;
}

// ── Active quest ──────────────────────────────────────────────────────────────
function _buildActiveQuestSection(player) {
    const active = player.quests.active;
    if (!active) return '<div id="active-quest-wrap"></div>';

    const quest    = QUESTS.find(q => q.id === active.questId);
    if (!quest) return '<div id="active-quest-wrap"></div>';

    const remaining = QuestSystem.getRemainingMs();
    const progress  = QuestSystem.getProgress();
    const chance    = QuestSystem.getSuccessChance(quest);

    return `
        <div id="active-quest-wrap">
            <div class="active-quest-card">
                <div class="aq-header">
                    <div class="aq-label">Active Quest</div>
                    <span class="quest-tier-badge tier-badge-${quest.tier}">Tier ${quest.tier}</span>
                </div>
                <div class="aq-name">${quest.name}</div>
                <div class="aq-meta">
                    <span>Eff. ${skillLabel(quest.skillCheck.skill)} ${quest.skillCheck.required.toLocaleString()} required</span>
                    <span class="aq-chance" style="color:${successColor(chance)}">${chance}% success</span>
                </div>
                <div class="aq-progress-row">
                    <div class="aq-progress-track">
                        <div class="aq-progress-fill" id="aq-progress-fill" style="width:${progress}%"></div>
                    </div>
                    <div class="aq-timer" id="quest-countdown">${formatMs(remaining)}</div>
                </div>
                <div class="aq-actions">
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
    const hasActive  = !!player.quests.active;
    const blocked    = hasActive;
    const chance     = QuestSystem.getSuccessChance(quest);
    const skillVal   = PlayerSystem.getEffectiveSkill(quest.skillCheck.skill);
    const meetsSkill = skillVal >= quest.skillCheck.required;
    const chestDef   = CHEST_DEFS[quest.chestReward.tier];

    const completions = player.quests.completed.filter(c => c.questId === quest.id).length;
    const todayDone   = player.quests.completed.filter(
        c => c.questId === quest.id && Date.now() - c.ts < 86400000
    ).length;

    let btnLabel = 'Begin Quest →';
    let btnTitle = `Start: ${quest.name}`;
    if (hasActive)  { btnLabel = 'Quest Active';    btnTitle = 'A quest is already in progress.'; }

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
                    ${completions > 0 ? `<span class="quest-completions" title="Total completions">×${completions}</span>` : ''}
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
                <button
                    class="btn-primary btn-sm btn-start-quest ${blocked ? 'btn-blocked' : ''}"
                    data-quest-id="${quest.id}"
                    ${blocked ? 'disabled' : ''}
                    title="${btnTitle}"
                >${btnLabel}</button>
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
            // Rebind start buttons after partial re-render
            document.querySelectorAll('.btn-start-quest:not([disabled])').forEach(_bindStartBtn);
        });
    });

    // Start quest buttons
    container.querySelectorAll('.btn-start-quest:not([disabled])').forEach(_bindStartBtn);

}

function _bindStartBtn(btn) {
    btn.addEventListener('click', () => {
        const result = QuestSystem.start(btn.dataset.questId);
        if (!result.ok) { Log.add(result.reason, 'warning'); return; }
        const container = document.getElementById('content-area');
        if (container) _renderQuestsPage(container);
    });
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

        // Quest countdown
        const countdownEl = document.getElementById('quest-countdown');
        if (countdownEl) {
            countdownEl.textContent = formatMs(QuestSystem.getRemainingMs());
        }
        const progressEl = document.getElementById('aq-progress-fill');
        if (progressEl) {
            progressEl.style.width = `${QuestSystem.getProgress()}%`;
        }

        // Board reset timer
        const resetEl = document.getElementById('board-reset-timer');
        if (resetEl) {
            resetEl.textContent = formatDuration(QuestSystem.secondsUntilReset());
        }
    }, 1000);
}
