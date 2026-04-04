// js/pages/guilds.js
// Guild system page - view membership, perks, and join available guilds

Router.register('guilds', function renderGuilds(container) {
    _renderGuildsPage(container);
});

function _renderGuildsPage(container) {
    const player = PlayerSystem.current;
    const currentGuild = player.guild ? PlayerSystem.getGuild() : null;
    const availableGuilds = PlayerSystem.getAvailableGuilds();

    if (currentGuild) {
        // Player is in a guild - show guild page
        const rank = PlayerSystem.getGuildRank();
        const bonuses = PlayerSystem.getGuildBonuses();
        const reputation = PlayerSystem.getCurrentGuildReputation();
        const nextRank = PlayerSystem.getNextGuildRank();

        container.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <h1 class="page-title">${currentGuild.name}</h1>
                    <p class="page-subtitle">"${currentGuild.flavor}"</p>
                </div>

                <div class="guild-container">
                    <!-- Guild Status -->
                    <div class="card guild-status-card">
                        <div class="card-header">Guild Status</div>
                        <div class="card-body">
                            <div class="guild-rank-display">
                                <div class="rank-icon" style="color:${rank.color}">${rank.icon}</div>
                                <div class="rank-info">
                                    <div class="rank-title">${rank.title}</div>
                                    <div class="rank-rep">Reputation: ${reputation.toLocaleString()}</div>
                                </div>
                            </div>

                            ${nextRank ? `
                                <div class="rank-progress">
                                    <div class="rank-next-label">
                                        <span>${rank.title} → ${nextRank.title}</span>
                                        <span>${reputation} / ${nextRank.minRep}</span>
                                    </div>
                                    <div class="stat-bar-track">
                                        <div class="stat-bar-fill" style="width:${Math.round((reputation / nextRank.minRep) * 100)}%;background:${nextRank.color}"></div>
                                    </div>
                                </div>
                            ` : `
                                <div class="muted-text" style="text-align:center;padding:8px;background:rgba(201,168,76,0.1);border-radius:4px;margin-top:12px">
                                    Maximum Rank Reached
                                </div>
                            `}
                        </div>
                    </div>

                    <!-- Guild Perks -->
                    <div class="card guild-perks-card">
                        <div class="card-header">Active Perks</div>
                        <div class="card-body">
                            ${bonuses.length > 0 ? `
                                <div class="perks-list">
                                    ${bonuses.map(perk => `
                                        <div class="perk-item">
                                            <span class="perk-icon">✓</span>
                                            <span class="perk-label">${perk.label}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : `
                                <p class="muted-text">No perks unlocked yet.</p>
                            `}
                        </div>
                    </div>

                    <!-- Guild Description -->
                    <div class="card card-wide">
                        <div class="card-header">About This Guild</div>
                        <div class="card-body">
                            <p class="guild-description">${currentGuild.description}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else if (availableGuilds.length > 0) {
        // Player can join guilds
        container.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <h1 class="page-title">Guilds</h1>
                    <p class="page-subtitle">Join a guild to unlock specialized quests and bonuses.</p>
                </div>

                <div class="guild-selection">
                    ${availableGuilds.map(guild => `
                        <div class="guild-card joinable">
                            <div class="guild-header">
                                <div class="guild-icon" style="color:${guild.color}">${guild.icon}</div>
                                <div class="guild-name">${guild.name}</div>
                            </div>
                            <div class="guild-tagline">"${guild.flavor}"</div>
                            <div class="guild-desc">${guild.description}</div>
                            <div class="guild-requirements">
                                <div class="req-title">Requirements:</div>
                                ${guild.requiredSkills.map(req => `
                                    <div class="req-item">
                                        <span>${skillLabel(req.skill)}</span>
                                        <span class="req-check">✓</span>
                                        <span class="req-value">${player.skills[req.skill]} / ${req.threshold}</span>
                                    </div>
                                `).join('')}
                            </div>
                            <button class="btn-primary guild-join-btn" data-guild-id="${guild.id}" style="width:100%;margin-top:12px">
                                Join ${guild.name}
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        _bindGuildJoinButtons(container);
    } else {
        // Player cannot join any guild yet
        container.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <h1 class="page-title">Guilds</h1>
                    <p class="page-subtitle">Reach 500 in specific skills to join a guild.</p>
                </div>

                <div class="guild-unavailable">
                    ${GUILDS.map(guild => {
                        const canJoin = PlayerSystem.canJoinGuild(guild.id);
                        return `
                            <div class="guild-card ${canJoin ? 'joinable' : 'locked'}">
                                <div class="guild-icon" style="color:${canJoin ? guild.color : '#444'}">${guild.icon}</div>
                                <div class="guild-name">${guild.name}</div>
                                <div class="guild-tagline">"${guild.flavor}"</div>
                                <div class="guild-desc">${guild.description}</div>
                                <div class="guild-requirements">
                                    <div class="req-title">Requirements:</div>
                                    ${guild.requiredSkills.map(req => {
                                        const playerSkill = player.skills[req.skill] || 0;
                                        const isMet = playerSkill >= req.threshold;
                                        return `
                                            <div class="req-item ${isMet ? 'met' : 'unmet'}">
                                                <span>${skillLabel(req.skill)}</span>
                                                <span class="req-check">${isMet ? '✓' : '✗'}</span>
                                                <span class="req-value">${playerSkill} / ${req.threshold}</span>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
}

function _bindGuildJoinButtons(container) {
    container.querySelectorAll('.guild-join-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const guildId = btn.dataset.guildId;
            const result = PlayerSystem.joinGuild(guildId);
            if (result.ok) {
                SaveSystem.save();
                Router._load('guilds');
            } else {
                Log.add(result.reason, 'danger');
            }
        });
    });
}
