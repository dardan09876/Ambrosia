// js/pages/training.js
// Training page — three panels: Field Drills, Study & Practice, Warband Prep.
// Training actions take real time and resolve via TrainingSystem.tick().

// ── Page state ─────────────────────────────────────────────────────────────────
let _trainingTab = 'drills'; // 'drills' | 'study' | 'warband'

// ── Tutorial gate ──────────────────────────────────────────────────────────────
Router.register('training', function renderTraining(container) {
    if (typeof _tutorialComplete === 'function' && !_tutorialComplete()) {
        container.innerHTML = `
            <div class="page">
                <div class="page-header"><h1 class="page-title">Training</h1></div>
                <div class="page-body">
                    <p class="page-empty-state">Complete your faction's introduction to unlock Training.</p>
                </div>
            </div>`;
        return;
    }
    _renderTrainingPage(container);
});

// ── Main render ────────────────────────────────────────────────────────────────
function _renderTrainingPage(container) {
    const player       = PlayerSystem.current;
    const training     = player.training;
    const canTrain     = !PlayerSystem.isHospitalized();
    const hasFacility  = typeof MapSystem !== 'undefined' ? MapSystem.hasActivity('training') : true;
    const regionName   = typeof MapSystem !== 'undefined' ? MapSystem.getCurrentRegionName() : '';

    const hospitalized = PlayerSystem.isHospitalized();
    const facilityNote = !hasFacility && !hospitalized
        ? `<div class="training-facility-note">No training facility in ${regionName}. Drills and Study require one — travel to a region with a training facility. Warband Prep can be done anywhere.</div>`
        : '';
    const hospitNote = hospitalized
        ? `<div class="training-facility-note training-facility-blocked">You are hospitalized. Training is suspended until you recover.</div>`
        : '';

    container.innerHTML = `
        <div class="page">
            <div class="page-header">
                <h1 class="page-title">Training</h1>
                <p class="page-subtitle">Prepare for combat, study your craft, or ready your warband.</p>
            </div>

            ${hospitNote}
            ${facilityNote}

            <div class="training-header-stats" id="training-header-stats">
                ${_buildTrainingHeaderStats(player, training)}
            </div>

            <div class="skills-tabs">
                <button class="skill-tab ${_trainingTab === 'drills'  ? 'active' : ''}" data-ttab="drills">
                    Field Drills
                </button>
                <button class="skill-tab ${_trainingTab === 'study'   ? 'active' : ''}" data-ttab="study">
                    Study &amp; Practice
                </button>
                <button class="skill-tab ${_trainingTab === 'warband' ? 'active' : ''}" data-ttab="warband">
                    Warband Prep
                </button>
            </div>

            <div id="training-tab-content">
                ${_buildTrainingTabContent(canTrain, hasFacility)}
            </div>

            <div class="training-lower">
                <div id="training-queue-panel">
                    ${_buildQueuePanel(training)}
                </div>
                <div id="training-results-panel">
                    ${_buildResultsPanel(training)}
                </div>
            </div>

            <div id="training-mastery-panel">
                ${_buildMasteryPanel(player, training)}
            </div>
        </div>
    `;

    // Tab switching
    container.querySelectorAll('.skill-tab[data-ttab]').forEach(btn => {
        btn.addEventListener('click', () => {
            _trainingTab = btn.dataset.ttab;
            container.querySelectorAll('.skill-tab[data-ttab]').forEach(b =>
                b.classList.toggle('active', b === btn)
            );
            document.getElementById('training-tab-content').innerHTML =
                _buildTrainingTabContent(!PlayerSystem.isHospitalized(), hasFacility);
            _bindTrainingCards(hasFacility);
        });
    });

    _bindTrainingCards(hasFacility);
    _bindMasteryButtons();
}

// ── Header stat bar ────────────────────────────────────────────────────────────
function _buildTrainingHeaderStats(player, training) {
    const readiness   = training.readiness || 0;
    const rLabel      = TrainingSystem.getReadinessLabel(readiness);
    const today       = training.trainingActionsToday || 0;
    const fInfo       = TrainingSystem.getFatigueLabel(today);
    const masteryPts  = training.masteryPoints || 0;

    // Energy + Focus quick view
    const energy = player.stats.energy;
    const focus  = player.stats.focus;
    const eCap   = PlayerSystem.getStatMax('energy');
    const fCap   = PlayerSystem.getStatMax('focus');

    return `
        <div class="training-stat-item">
            <div class="tstat-label" style="color:#4a9edb">Energy</div>
            <div class="tstat-bar-wrap">
                <div class="tstat-bar" style="width:${Math.round(energy.value/eCap*100)}%;background:#4a9edb"></div>
            </div>
            <div class="tstat-value">${energy.value}/${eCap}</div>
        </div>
        <div class="training-stat-item">
            <div class="tstat-label" style="color:#9b6bd4">Focus</div>
            <div class="tstat-bar-wrap">
                <div class="tstat-bar" style="width:${Math.round(focus.value/fCap*100)}%;background:#9b6bd4"></div>
            </div>
            <div class="tstat-value">${focus.value}/${fCap}</div>
        </div>
        <div class="training-stat-item tstat-readiness">
            <div class="tstat-label">Readiness</div>
            <div class="tstat-bar-wrap">
                <div class="tstat-bar" style="width:${Math.min(100, Math.round(readiness/200*100))}%;background:${rLabel.color}"></div>
            </div>
            <div class="tstat-value" style="color:${rLabel.color}">${readiness} <span class="tstat-sublabel">${rLabel.label}</span></div>
        </div>
        <div class="training-stat-item tstat-fatigue">
            <div class="tstat-label">Fatigue</div>
            <div class="tstat-value" style="color:${fInfo.color}">${fInfo.label}
                <span class="tstat-sublabel">×${fInfo.mult.toFixed(2)} (${today} today)</span>
            </div>
        </div>
        <div class="training-stat-item tstat-mastery">
            <div class="tstat-label" style="color:#c9a84c">Mastery</div>
            <div class="tstat-value" style="color:#c9a84c">${masteryPts} pts</div>
        </div>
    `;
}

// ── Tab content ────────────────────────────────────────────────────────────────
function _buildTrainingTabContent(canTrain, hasFacility) {
    const actions   = TRAINING_BY_CATEGORY[_trainingTab] || [];
    const player    = PlayerSystem.current;
    const training  = player.training;
    const queuedIds = new Set(training.activeQueue.map(q => q.actionId));

    // For drills/study: need facility; warband: always available
    const tabNeedsFacility = _trainingTab !== 'warband';
    const tabAvailable     = canTrain && (!tabNeedsFacility || hasFacility);

    const tabDescriptions = {
        drills:  'Short prep sessions that improve your next quest or encounter. Grants temporary buffs and readiness.',
        study:   'Longer personal practice. Slow but permanent skill XP gain and mastery points.',
        warband: 'Train your troops, scouts, and captains. Buffs warband operations for the next 8 hours.',
    };

    return `
        <div class="training-tab-desc">${tabDescriptions[_trainingTab]}</div>
        <div class="training-cards-grid">
            ${actions.map(action => _buildActionCard(action, player, training, queuedIds, tabAvailable)).join('')}
        </div>
    `;
}

// ── Single training card ───────────────────────────────────────────────────────
function _buildActionCard(action, player, training, queuedIds, tabAvailable) {
    const isQueued    = queuedIds.has(action.id);
    const canAfford   = TrainingSystem.canAfford(action);
    const skillLevel  = player.skills[action.linkedSkill] || 0;
    const fatigMult   = TrainingSystem.getFatigueMultiplier(training.trainingActionsToday || 0);
    const hasFacility = typeof MapSystem !== 'undefined' ? MapSystem.hasActivity('training') : true;
    const facilityBonus = hasFacility ? 1.2 : 1.0;

    // Compute preview values
    let rewardLines = [];
    if (action.rewards.tempBuff || action.rewards.xpBase) {
        const buff    = TrainingSystem.getTrainingBuff({ relevantSkill: skillLevel, drillTier: action.tier, facilityBonus });
        const pct     = Math.round(buff * 100);
        const label   = action.rewards.tempBuff?.label || '';
        rewardLines.push(`<span class="tc-reward-buff">+${pct}% ${label}</span>`);
    }
    if (action.rewards.xp || action.rewards.xpBase) {
        const xp = TrainingSystem.getStudyXpGain({
            skillLevel,
            trainingTier:     action.tier,
            facilityBonus,
            fatigueMultiplier: fatigMult,
        });
        rewardLines.push(`<span class="tc-reward-xp">+${xp} ${action.linkedSkill} XP</span>`);
    }
    if (action.rewards.readiness) {
        const rg = Math.max(1, Math.floor(TrainingSystem.getReadinessGain(action.tier, skillLevel) * fatigMult));
        rewardLines.push(`<span class="tc-reward-readiness">+${rg} readiness</span>`);
    }
    if (action.rewards.mastery) {
        const xp = TrainingSystem.getStudyXpGain({ skillLevel, trainingTier: action.tier, facilityBonus, fatigueMultiplier: fatigMult });
        const mp = TrainingSystem.getMasteryGain(xp);
        rewardLines.push(`<span class="tc-reward-mastery">+${mp} mastery</span>`);
    }
    if (action.rewards.warbandBuff) {
        rewardLines.push(`<span class="tc-reward-warband">${action.rewards.warbandBuff.label}</span>`);
    }

    const tierLabel = action.tier >= 2 ? `<span class="tc-tier">Tier ${action.tier}</span>` : '';
    const costStr   = TrainingSystem.formatCost(action.cost);
    const durStr    = TrainingSystem.formatDuration(action.durationSec);

    const canBegin = tabAvailable && canAfford && !isQueued;
    const btnLabel = isQueued    ? 'In Queue'
                   : !canAfford ? 'Insufficient Resources'
                   : !tabAvailable ? 'Unavailable'
                   : 'Begin';
    const btnCls = canBegin ? 'btn-tc-begin' : 'btn-tc-begin btn-tc-off';

    return `
        <div class="training-card ${isQueued ? 'tc-queued' : ''}" data-action-id="${action.id}">
            <div class="tc-header">
                <div class="tc-name">${action.label} ${tierLabel}</div>
                <div class="tc-skill-tag">${skillLabel(action.linkedSkill)}</div>
            </div>
            <div class="tc-desc">${action.desc}</div>
            <div class="tc-meta">
                <span class="tc-cost">${costStr}</span>
                <span class="tc-dur">${durStr}</span>
            </div>
            <div class="tc-rewards">${rewardLines.join('')}</div>
            <button
                class="${btnCls}"
                data-action-begin="${action.id}"
                ${canBegin ? '' : 'disabled'}
            >${btnLabel}</button>
        </div>
    `;
}

// ── Active queue panel ─────────────────────────────────────────────────────────
function _buildQueuePanel(training) {
    const queue = training.activeQueue || [];

    const header = `<div class="training-panel-title">Active Training</div>`;

    if (!queue.length) {
        return `<div class="training-panel training-queue-panel">${header}
            <div class="training-panel-empty">No training in progress. Choose an action above.</div>
        </div>`;
    }

    const items = queue.map((item, idx) => {
        const action   = TRAINING_ACTIONS[item.actionId];
        if (!action) return '';
        const now      = Date.now();
        const total    = item.endTime - item.startTime;
        const elapsed  = now - item.startTime;
        const pct      = Math.min(100, Math.round((elapsed / total) * 100));
        const remaining = TrainingSystem.formatRemaining(item.endTime);

        return `
            <div class="tq-item">
                <div class="tq-name">${action.label}</div>
                <div class="tq-progress-wrap">
                    <div class="tq-progress-fill" style="width:${pct}%"></div>
                </div>
                <div class="tq-meta">
                    <span class="tq-time">${remaining} remaining</span>
                    <button class="tq-cancel-btn" data-cancel-idx="${idx}">Cancel</button>
                </div>
            </div>
        `;
    }).join('');

    return `<div class="training-panel training-queue-panel">${header}${items}</div>`;
}

// ── Results log panel ──────────────────────────────────────────────────────────
function _buildResultsPanel(training) {
    const log = training.resultsLog || [];

    const header = `<div class="training-panel-title">Completed Training</div>`;

    if (!log.length) {
        return `<div class="training-panel training-results-panel">${header}
            <div class="training-panel-empty">Results will appear here after training completes.</div>
        </div>`;
    }

    const entries = log.map(entry => {
        const ago = _timeAgo(entry.ts);
        return `<div class="tresult-item"><span class="tresult-text">${entry.text}</span><span class="tresult-ago">${ago}</span></div>`;
    }).join('');

    return `<div class="training-panel training-results-panel">${header}${entries}</div>`;
}

// ── Mastery panel ──────────────────────────────────────────────────────────────
function _buildMasteryPanel(player, training) {
    const pts     = training.masteryPoints || 0;
    const bonuses = training.masteryBonuses || {};
    const cost    = 10;

    // All skills that can receive mastery
    const allSkills = [
        'melee','ranged','magic','restoration','defense','stealth',
        'blacksmithing','armorsmithing','woodworking','tailoring','magesmithing','alchemy',
    ];

    const canSpend = pts >= cost;

    const skillRows = allSkills.map(sk => {
        const currentBonus = bonuses[sk] ? `+${Math.round(bonuses[sk] * 100)}%` : '—';
        const bonusColor   = bonuses[sk] ? 'var(--gold)' : 'var(--text-muted)';
        return `
            <div class="mastery-skill-row">
                <span class="mastery-skill-name">${skillLabel(sk)}</span>
                <span class="mastery-skill-bonus" style="color:${bonusColor}">${currentBonus}</span>
                <button class="mastery-invest-btn ${canSpend ? '' : 'mastery-invest-off'}"
                    data-mastery-skill="${sk}"
                    ${canSpend ? '' : 'disabled'}
                    title="${canSpend ? `Spend ${cost} mastery → +1% ${skillLabel(sk)}` : `Need ${cost} mastery points (have ${pts})`}"
                >+1%</button>
            </div>
        `;
    }).join('');

    return `
        <div class="training-mastery-section">
            <div class="training-panel-title">
                Mastery Bonds
                <span class="mastery-pts-badge">${pts} pts</span>
            </div>
            <p class="mastery-desc muted-text">
                Spend mastery points for permanent +1% bonuses to any skill's effective value.
                Earned by completing Study training. Cost: ${cost} pts per rank.
            </p>
            <div class="mastery-skills-grid">
                ${skillRows}
            </div>
        </div>
    `;
}

// ── Bind card begin buttons ────────────────────────────────────────────────────
function _bindTrainingCards(hasFacility) {
    document.querySelectorAll('[data-action-begin]').forEach(btn => {
        btn.addEventListener('click', () => {
            const actionId = btn.dataset.actionBegin;
            const result   = TrainingSystem.startTraining(actionId);
            if (!result.ok) {
                Log.add(result.reason, 'warning');
            } else {
                const action = TRAINING_ACTIONS[actionId];
                Log.add(`Training started: ${action?.label || actionId}.`, 'info');
                // Refresh the page
                const content = document.getElementById('content-area');
                if (content) Router._load('training');
            }
        });
    });

    document.querySelectorAll('[data-cancel-idx]').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.cancelIdx, 10);
            TrainingSystem.cancelTraining(idx);
            const content = document.getElementById('content-area');
            if (content) Router._load('training');
        });
    });
}

// ── Bind mastery invest buttons ────────────────────────────────────────────────
function _bindMasteryButtons() {
    document.querySelectorAll('[data-mastery-skill]').forEach(btn => {
        btn.addEventListener('click', () => {
            const result = TrainingSystem.spendMastery(btn.dataset.masterySkill);
            if (!result.ok) {
                Log.add(result.reason, 'warning');
            } else {
                const content = document.getElementById('content-area');
                if (content) Router._load('training');
            }
        });
    });
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function _timeAgo(ts) {
    const secs = Math.floor((Date.now() - ts) / 1000);
    if (secs < 60)   return 'just now';
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    return `${Math.floor(secs / 3600)}h ago`;
}
