// js/pages/home.js
// Home / dashboard page. First thing the player sees after character creation.

Router.register('home', function renderHome(container) {
    const player = PlayerSystem.current;
    if (!player) return;

    const faction = FACTIONS.find(f => f.id === player.faction);
    const origin  = ORIGINS.find(o => o.id === player.origin);

    // Top skills sorted by value (only show ones with progress)
    const topSkills = Object.entries(player.skills)
        .filter(([, v]) => v > 0)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    // Survival info
    const sv = player.survival;
    const survivalInfo = {
        'well-fed': { label: 'Well Fed',  cls: 'survival-wellfed',  note: 'All stats at full capacity.' },
        'hungry':   { label: 'Hungry',    cls: 'survival-hungry',   note: 'Stat maximums reduced by 10%.' },
        'starving': { label: 'Starving',  cls: 'survival-starving', note: 'Stat maximums reduced by 30%.' },
    }[sv.state] || { label: sv.state, cls: '', note: '' };

    // Shelter info
    const shelterCost  = (typeof MapSystem !== 'undefined')
        ? MapSystem.getShelterCost(player.location)
        : 0;
    const regionName   = typeof MapSystem !== 'undefined' ? MapSystem.getCurrentRegionName() : player.location;
    const regionTier   = (typeof MAP_REGIONS !== 'undefined' && MAP_REGIONS[player.location])
        ? MAP_REGIONS[player.location].tier
        : 0;

    container.innerHTML = `
        <div class="page">
            <div class="page-header">
                <h1 class="page-title">${regionName}</h1>
                <p class="page-subtitle">${(typeof MAP_REGIONS !== 'undefined' && MAP_REGIONS[player.location]) ? MAP_REGIONS[player.location].description.split('.')[0] + '.' : ''}</p>
            </div>

            <div class="home-grid">

                <!-- Character overview -->
                <div class="card">
                    <div class="card-header">Character</div>
                    <div class="card-body">
                        <div class="char-overview">
                            <div class="char-name">${player.name}</div>
                            <div class="char-meta">
                                <span style="color:${faction ? faction.accentColor : '#c9a84c'}">${faction ? faction.name : ''}</span>
                                <span class="meta-sep">·</span>
                                <span>${origin ? origin.name : ''}</span>
                            </div>
                            <div class="char-location">◉ ${player.location}</div>
                        </div>
                    </div>
                </div>

                <!-- Level & Experience -->
                <div class="card">
                    <div class="card-header">Level & Talent</div>
                    <div class="card-body">
                        <div class="level-display">
                            <div class="level-value">LVL ${player.level}</div>
                            <div class="level-title">${player.talent ? (TALENTS.find(t => t.id === player.talent)?.name || 'Unknown') : 'Talentless Wanderer'}</div>
                        </div>
                        <div class="xp-bar-wrap" style="margin:12px 0">
                            <div class="stat-bar-track">
                                <div class="stat-bar-fill" style="width:${PlayerSystem.getXpProgress()}%;background:#5b8fd4"></div>
                            </div>
                        </div>
                        <div class="muted-text" style="font-size:12px">
                            ${player.experience.toLocaleString()} / ${PlayerSystem.getXpForNextLevel().toLocaleString()} XP
                        </div>
                        ${player.level >= 15 && !player.talent ? `
                            <button class="btn-primary" style="width:100%;margin-top:8px" id="home-talent-btn">
                                Choose Talent
                            </button>
                        ` : ''}
                    </div>
                </div>

                <!-- Survival status -->
                <div class="card">
                    <div class="card-header">Survival</div>
                    <div class="card-body">
                        <div class="currency-item ${survivalInfo.cls}" style="margin-bottom:8px">
                            <span style="font-size:13px;font-weight:600">${survivalInfo.label}</span>
                        </div>
                        <div class="survival-bar-wrap" style="margin-bottom:6px">
                            <div class="stat-bar-track">
                                <div class="stat-bar-fill" style="width:${sv.food}%;background:#4a9e6b"></div>
                            </div>
                        </div>
                        <div class="muted-text" style="margin-bottom:10px">${sv.food} / ${sv.foodMax} food${survivalInfo.note ? ' — ' + survivalInfo.note : ''}</div>
                        <div class="home-shelter-row">
                            <span class="home-shelter-icon">⌂</span>
                            <div class="home-shelter-body">
                                <span class="home-shelter-cost">${shelterCost.toLocaleString()}g / day</span>
                                <span class="home-shelter-note muted-text">Shelter in ${regionName} · Tier ${regionTier}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Skills snapshot -->
                <div class="card">
                    <div class="card-header">Skills</div>
                    <div class="card-body">
                        ${topSkills.length > 0 ? `
                            <div class="skill-overview-list">
                                ${topSkills.map(([name, val]) => `
                                    <div class="skill-overview-row">
                                        <span class="skill-name">${skillLabel(name)}</span>
                                        <span class="skill-val">${val}</span>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `<p class="muted-text">No skills trained yet. Visit Skills to begin.</p>`}
                    </div>
                </div>

                <!-- Getting started -->
                <div class="card card-wide">
                    <div class="card-header">Getting Started</div>
                    <div class="card-body">
                        <div class="tips-list">
                            <div class="tip-item">
                                <span class="tip-icon">✦</span>
                                <span>Train your skills under <strong>Skills</strong> to increase power and unlock abilities.</span>
                            </div>
                            <div class="tip-item">
                                <span class="tip-icon">◈</span>
                                <span>Take on <strong>Quests</strong> to earn gold and chest rewards. Higher tier quests need higher skills.</span>
                            </div>
                            <div class="tip-item">
                                <span class="tip-icon">◫</span>
                                <span>Open chests from quests in <strong>Inventory</strong> to roll for gear drops.</span>
                            </div>
                            <div class="tip-item">
                                <span class="tip-icon">⊕</span>
                                <span>Keep your <strong>Food</strong> above 0. Starvation reduces all stat maximums.</span>
                            </div>
                            <div class="tip-item">
                                <span class="tip-icon">◎</span>
                                <span>Visit the <strong>Market</strong> to buy food and repair worn equipment.</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    `;

    // Bind events
    const talentBtn = container.querySelector('#home-talent-btn');
    if (talentBtn) {
        talentBtn.addEventListener('click', () => Router.navigate('talents'));
    }
});
