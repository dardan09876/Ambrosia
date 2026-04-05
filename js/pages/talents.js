// js/pages/talents.js
// Talent selection page. Available at level 15 and beyond.
// Players commit to a talent to gain XP modifiers for their chosen path.

// ── Router registration ────────────────────────────────────────────────────
Router.register('talents', function () {
    _activeTab = 'talents';
    Router.navigate('skills');
});

// ── Page render ────────────────────────────────────────────────────────────
function _renderTalentsPage(container) {
    const player = PlayerSystem.current;

    // If player hasn't reached level 15, redirect to home
    if (player.level < 15) {
        container.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <h1 class="page-title">Talents</h1>
                    <p class="page-subtitle">Commit to a path.</p>
                </div>
                <div class="page-facility-blocked">
                    <p>You are not yet ready.</p>
                    <p class="muted-text">Talents become available at level 15. You are level ${player.level}.</p>
                </div>
            </div>
        `;
        return;
    }

    // If player already has a talent, show it
    if (player.talent) {
        const currentTalent = TALENTS.find(t => t.id === player.talent);
        container.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <h1 class="page-title">Your Talent</h1>
                    <p class="page-subtitle">Your path is chosen. You cannot change it.</p>
                </div>

                <div class="talent-committed">
                    <div class="talent-card committed" style="--talent-accent:${_getTalentColor(currentTalent.id)}">
                        <div class="talent-icon">${currentTalent.icon}</div>
                        <div class="talent-name">${currentTalent.name}</div>
                        <div class="talent-desc">${currentTalent.description}</div>
                        <div class="talent-lore">"${currentTalent.lore}"</div>
                        <div class="talent-modifiers">
                            <div class="talent-mod-title">Experience Modifiers</div>
                            ${_buildModifiersList(currentTalent.xpModifiers)}
                        </div>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    // Show talent selection
    container.innerHTML = `
        <div class="page">
            <div class="page-header">
                <h1 class="page-title">Choose Your Talent</h1>
                <p class="page-subtitle">At level 15, you commit to a path. Your choice shapes how you gain experience.</p>
            </div>

            <div class="talent-selection">
                ${TALENTS.map(talent => `
                    <div class="talent-card" style="--talent-accent:${_getTalentColor(talent.id)}">
                        <div class="talent-icon">${talent.icon}</div>
                        <div class="talent-name">${talent.name}</div>
                        <div class="talent-desc">${talent.description}</div>
                        <div class="talent-lore">"${talent.lore}"</div>
                        <div class="talent-modifiers">
                            <div class="talent-mod-title">Experience Modifiers</div>
                            ${_buildModifiersList(talent.xpModifiers)}
                        </div>
                        <div class="talent-synergies">
                            <div class="talent-syn-title">Synergies</div>
                            ${_buildSynergyPreview(talent.id)}
                        </div>
                        <button class="btn-primary talent-select-btn" data-talent-id="${talent.id}">
                            Commit to ${talent.name}
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    _bindTalentButtons(container);
}

// ── Helper: get talent color ───────────────────────────────────────────────
function _getTalentColor(talentId) {
    const colors = {
        ironbound: '#d4511e',
        shade: '#4a3f8f',
        rift_caller: '#5b8fd4',
        veil_keeper: '#6b4fa3',
        wilder: '#4a8f3e',
    };
    return colors[talentId] || '#666';
}

// ── Helper: build modifier display ─────────────────────────────────────────
function _buildModifiersList(modifiers) {
    return Object.entries(modifiers)
        .map(([skill, mult]) => {
            const pct = Math.round((mult - 1) * 100);
            const sign = pct > 0 ? '+' : '';
            const color = pct > 0 ? 'var(--success)' : 'var(--danger)';
            return `
                <div class="talent-mod-item">
                    <span class="talent-mod-skill">${skillLabel(skill)}</span>
                    <span class="talent-mod-value" style="color:${color}">${sign}${pct}%</span>
                </div>
            `;
        })
        .join('');
}

// ── Helper: build synergy preview ──────────────────────────────────────────
function _buildSynergyPreview(talentId) {
    if (typeof getSynergiesForTalent === 'undefined') {
        return '<p class="muted-text" style="font-size:12px">Synergies data not loaded</p>';
    }

    const synergies = getSynergiesForTalent(talentId);
    if (!synergies || synergies.length === 0) {
        return '<p class="muted-text" style="font-size:12px">No synergies available</p>';
    }

    return synergies.map(syn => {
        const skill1 = skillLabel(syn.skills[0]);
        const skill2 = skillLabel(syn.skills[1]);
        return `
            <div class="talent-synergy-item">
                <span class="syn-name">${syn.name}</span>
                <span class="syn-skills">${skill1} + ${skill2}</span>
            </div>
        `;
    }).join('');
}

// ── Event binding ──────────────────────────────────────────────────────────
function _bindTalentButtons(container) {
    container.querySelectorAll('.talent-select-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const talentId = btn.dataset.talentId;
            _commitToTalent(talentId);
        });
    });
}

// ── Commit to a talent ─────────────────────────────────────────────────────
function _commitToTalent(talentId) {
    const result = PlayerSystem.setTalent(talentId);
    if (!result.ok) {
        Log.add(result.reason, 'danger');
        return;
    }

    SaveSystem.save();
    Router._load('talents');
}
