// js/pages/synergies.js
// Synergies page — shows passive bonuses unlocked by training complementary skills.
// Only available after choosing a talent.

Router.register('synergies', function renderSynergies(container) {
    _renderSynergiesPage(container);
});

function _renderSynergiesPage(container) {
    const player = PlayerSystem.current;

    // Must have a talent selected
    if (!player.talent) {
        container.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <h1 class="page-title">Synergies</h1>
                    <p class="page-subtitle">Passive bonuses from complementary skills.</p>
                </div>
                <div class="page-facility-blocked">
                    <p>Choose a talent to unlock synergies.</p>
                    <p class="muted-text">Synergies are unlocked by training two complementary skills together.</p>
                </div>
            </div>
        `;
        return;
    }

    const talentName = player.talent ? (TALENTS.find(t => t.id === player.talent)?.name || 'Unknown') : 'None';
    const allSynergies = PlayerSystem.getAllTalentSynergies();

    container.innerHTML = `
        <div class="page">
            <div class="page-header">
                <h1 class="page-title">Synergies</h1>
                <p class="page-subtitle">${talentName} - Passive bonuses from skill combinations</p>
            </div>

            <div class="synergies-grid">
                ${allSynergies.map(s => _buildSynergyCard(s)).join('')}
            </div>
        </div>
    `;
}

function _buildSynergyCard(data) {
    const { synergy, synergyValue, tier, active, progress } = data;
    const skill1 = skillLabel(synergy.skills[0]);
    const skill2 = skillLabel(synergy.skills[1]);

    const tierColors = {
        0: '#444',
        1: '#4a9e6b',
        2: '#4a9edb',
        3: '#9b6bd4',
        4: '#c9a84c',
        5: '#c06060',
    };
    const tierColor = tierColors[tier] || '#666';
    const tierLabel = tier > 0 ? `Tier ${tier}` : 'Locked';

    if (!active) {
        // Not yet unlocked
        return `
            <div class="synergy-card locked">
                <div class="synergy-icon">${synergy.icon}</div>
                <div class="synergy-name">${synergy.name}</div>
                <div class="synergy-desc">${synergy.description}</div>
                <div class="synergy-skills">
                    <span class="skill-badge">${skill1}</span>
                    <span class="skill-sep">+</span>
                    <span class="skill-badge">${skill2}</span>
                </div>
                <div class="synergy-progress">
                    <div class="synergy-progress-label">
                        <span>${skill1}: ${player.skills[synergy.skills[0]] || 0}</span>
                        <span>${skill2}: ${player.skills[synergy.skills[1]] || 0}</span>
                    </div>
                    <div class="stat-bar-track">
                        <div class="stat-bar-fill" style="width:${Math.min(100, (synergyValue / 50) * 100)}%;background:#444"></div>
                    </div>
                    <div class="muted-text" style="font-size:11px;margin-top:4px">
                        Progress: ${synergyValue} / 50 (minimum to unlock)
                    </div>
                </div>
            </div>
        `;
    }

    // Active synergy
    return `
        <div class="synergy-card active" style="--synergy-color:${tierColor}">
            <div class="synergy-header">
                <div class="synergy-icon">${synergy.icon}</div>
                <div class="synergy-tier" style="background:${tierColor}">Tier ${tier}</div>
            </div>
            <div class="synergy-name">${synergy.name}</div>
            <div class="synergy-desc">${synergy.description}</div>
            <div class="synergy-skills">
                <span class="skill-badge">${skill1}</span>
                <span class="skill-sep">+</span>
                <span class="skill-badge">${skill2}</span>
            </div>
            <div class="synergy-current-bonuses">
                <div class="synergy-bonus-title">Current Tier Bonuses</div>
                ${data.tierData && data.tierData.effects.map(effect => `
                    <div class="synergy-bonus-item">
                        <span class="bonus-icon">✓</span>
                        <span>${effect}</span>
                    </div>
                `).join('') || ''}
            </div>
            ${tier < 5 ? `
                <div class="synergy-next-tier">
                    <div class="synergy-progress-label">
                        Tier ${tier + 1}: ${(synergy.tiers.find(t => t.tier === tier + 1)?.threshold || 1000)} minimum
                    </div>
                    <div class="stat-bar-track">
                        <div class="stat-bar-fill" style="width:${progress.percentToNext}%;background:${tierColor}"></div>
                    </div>
                    <div class="muted-text" style="font-size:11px;margin-top:4px">
                        ${synergyValue} / ${progress.nextThreshold}
                    </div>
                </div>
            ` : `
                <div class="muted-text" style="text-align:center;padding:8px;background:rgba(192,0,0,0.1);border-radius:4px">
                    Maximum Tier Reached
                </div>
            `}
        </div>
    `;
}
