// js/pages/guilds.js
// Guild system page - view membership, perks, and start guild contracts

let _guildTimerInterval = null;

Router.register('guilds', function renderGuilds(container) {
    if (_guildTimerInterval) {
        clearInterval(_guildTimerInterval);
        _guildTimerInterval = null;
    }
    _renderGuildsPage(container);
});

function _renderGuildsPage(container) {
    const player = PlayerSystem.current;
    const currentGuild = player.guild ? PlayerSystem.getGuild() : null;
    const availableGuilds = PlayerSystem.getAvailableGuilds();

    if (currentGuild) {
        const rank       = PlayerSystem.getGuildRank();
        const bonuses    = PlayerSystem.getGuildBonuses();
        const reputation = PlayerSystem.getCurrentGuildReputation();
        const nextRank   = PlayerSystem.getNextGuildRank();
        const contracts  = (typeof QuestGeneratorSystem !== 'undefined')
            ? QuestGeneratorSystem.getGuildBoard()
            : [];

        container.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <h1 class="page-title">${currentGuild.name}</h1>
                    <p class="page-subtitle">"${currentGuild.flavor}"</p>
                </div>

                <!-- Status + Perks row -->
                <div class="guild-container">
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
                            ` : `<p class="muted-text">No perks unlocked yet.</p>`}
                        </div>
                    </div>

                    <div class="card card-wide">
                        <div class="card-header">About This Guild</div>
                        <div class="card-body">
                            <p class="guild-description">${currentGuild.description}</p>
                        </div>
                    </div>
                </div>

                <!-- Active quest tracker (guild contracts only) -->
                ${_buildGuildActiveQuest(player)}

                <!-- Guild Contracts board -->
                <div class="guild-contracts-section">
                    <div class="quest-section-header" style="margin-top:8px">
                        Guild Contracts
                        <span class="section-count">${contracts.length}</span>
                    </div>
                    <p class="guild-contracts-note muted-text">
                        Contracts refresh daily. Completing them earns guild reputation.
                    </p>
                    <div class="guild-contracts-list">
                        ${contracts.length
                            ? contracts.map(q => _buildGuildQuestCard(q, player, currentGuild)).join('')
                            : '<p class="muted-text" style="padding:12px 0">No contracts available.</p>'
                        }
                    </div>
                </div>
            </div>
        `;

        _bindGuildContractButtons(container);
        if (player.quests.active) _startGuildTimer(container);

    } else if (availableGuilds.length > 0) {
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

// ── Active quest tracker (shown when a guild quest is running) ────────────────
function _buildGuildActiveQuest(player) {
    const active = player.quests.active;
    if (!active) return '';

    const quest = QuestSystem._findQuest(active.questId);
    if (!quest?.isGuildQuest) return '';

    const remaining = QuestSystem.getRemainingMs();
    const progress  = QuestSystem.getProgress();
    const chance    = QuestSystem.getSuccessChance(quest);

    return `
        <div class="active-quest-card" style="margin-top:16px">
            <div class="aq-header">
                <div class="aq-label">Active Contract</div>
                <span class="quest-tier-badge tier-badge-${quest.tier}">Tier ${quest.tier}</span>
            </div>
            <div class="aq-name">${quest.name}</div>
            <div class="aq-meta">
                <span>Eff. ${skillLabel(quest.skillCheck.skill)} ${quest.skillCheck.required.toLocaleString()} required</span>
                <span class="aq-chance" style="color:${successColor(chance)}">${chance}% success</span>
            </div>
            <div class="aq-progress-row">
                <div class="aq-progress-track">
                    <div class="aq-progress-fill" id="guild-aq-fill" style="width:${progress}%"></div>
                </div>
                <div class="aq-timer" id="guild-quest-countdown">${formatMs(remaining)}</div>
            </div>
            <div class="aq-actions">
                <button class="btn-secondary btn-sm" id="guild-abandon-quest">Abandon contract</button>
            </div>
        </div>
    `;
}

// ── Guild quest card ──────────────────────────────────────────────────────────
function _buildGuildQuestCard(quest, player, guild) {
    const hasActive  = !!player.quests.active;
    const chance     = QuestSystem.getSuccessChance(quest);
    const skillVal   = PlayerSystem.getEffectiveSkill(quest.skillCheck.skill);
    const meetsSkill = skillVal >= quest.skillCheck.required;
    const chestDef   = CHEST_DEFS[quest.chestReward.tier];
    const repReward  = quest.guildReputation ?? 0;

    let btnLabel = 'Accept Contract →';
    if (hasActive) btnLabel = 'Quest Active';

    return `
        <div class="quest-card guild-contract-card ${hasActive ? 'quest-card-blocked' : ''}">
            <div class="quest-card-top">
                <div class="quest-card-left">
                    <div class="quest-card-name">${quest.name}</div>
                    <div class="quest-card-desc">${quest.description}</div>
                    <div class="quest-card-lore">"${quest.lore}"</div>
                </div>
                <div class="quest-card-right">
                    <span class="quest-tier-badge tier-badge-${quest.tier}">Tier ${quest.tier}</span>
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
                    <span class="quest-stat-icon" style="color:${guild.color}">★</span>
                    <span>+${repReward} reputation</span>
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
                    class="btn-primary btn-sm btn-guild-contract ${hasActive ? 'btn-blocked' : ''}"
                    data-quest-id="${quest.id}"
                    ${hasActive ? 'disabled' : ''}
                    title="${hasActive ? 'A quest is already in progress.' : `Accept: ${quest.name}`}"
                >${btnLabel}</button>
            </div>
        </div>
    `;
}

// ── Event binding ─────────────────────────────────────────────────────────────
function _bindGuildContractButtons(container) {
    container.querySelectorAll('.btn-guild-contract:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () => {
            const result = QuestSystem.start(btn.dataset.questId);
            if (!result.ok) { Log.add(result.reason, 'warning'); return; }
            _renderGuildsPage(container);
        });
    });

    container.querySelector('#guild-abandon-quest')?.addEventListener('click', () => {
        if (confirm('Abandon this contract? You will receive no reward.')) {
            QuestSystem.abandon();
        }
    });
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

// ── Live countdown timer ──────────────────────────────────────────────────────
function _startGuildTimer(container) {
    _guildTimerInterval = setInterval(() => {
        const countdown = document.getElementById('guild-quest-countdown');
        const fill      = document.getElementById('guild-aq-fill');
        if (!countdown && !fill) {
            clearInterval(_guildTimerInterval);
            _guildTimerInterval = null;
            return;
        }
        if (countdown) countdown.textContent = formatMs(QuestSystem.getRemainingMs());
        if (fill)      fill.style.width = `${QuestSystem.getProgress()}%`;
    }, 1000);
}
