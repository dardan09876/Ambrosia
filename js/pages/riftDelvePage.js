// js/pages/riftDelvePage.js
// Interactive grid-based Rift Delve page.
// Three views: board selection → grid game → results.

Router.register('rift_delve', function renderRiftDelve(container) {
    const player = PlayerSystem.current;
    if (!player) return;

    switch (DelveState.phase) {
        case 'exploring':
        case 'combat':
            _renderDelveGame(container);
            break;
        case 'result':
            _renderDelveResult(container);
            break;
        default:
            _renderDelveBoard(container, player);
    }
});

// ══════════════════════════════════════════════════════════════════════════════
// BOARD — delve selection
// ══════════════════════════════════════════════════════════════════════════════

function _renderDelveBoard(container, player) {
    const delves      = Object.values(DELVE_TYPES);
    const playerLevel = player.level || 1;
    const def         = getDelveType(DelveState.selectedDelveId) || delves[0];

    const hp     = player.stats.health.value;
    const maxHp  = PlayerSystem.getStatMax('health');
    const hpPct  = Math.round((hp / maxHp) * 100);
    const corr   = player.corruption || 0;

    // Full HP required to enter
    const canEnter = hp >= maxHp;

    const delveCards = delves.map(d => {
        const locked   = playerLevel < d.minLevel;
        const selected = DelveState.selectedDelveId === d.id;
        const danger   = '◆'.repeat(d.dangerRating) + '◇'.repeat(10 - d.dangerRating);
        const reward   = '◆'.repeat(d.rewardRating) + '◇'.repeat(10 - d.rewardRating);
        return `
            <div class="delve-card ${selected ? 'delve-card-selected' : ''} ${locked ? 'delve-card-locked' : ''}"
                 data-delve-select="${d.id}" ${locked ? '' : 'style="cursor:pointer"'}>
                <div class="delve-card-header">
                    <span class="delve-card-name">${d.name}</span>
                    <span class="delve-card-tier">T${d.tier}</span>
                </div>
                <p class="delve-card-subtitle">${d.subtitle}</p>
                <div class="delve-card-ratings">
                    <div class="delve-rating-row">
                        <span class="delve-rating-label">Danger</span>
                        <span class="delve-rating-dots danger">${danger}</span>
                    </div>
                    <div class="delve-rating-row">
                        <span class="delve-rating-label">Reward</span>
                        <span class="delve-rating-dots reward">${reward}</span>
                    </div>
                </div>
                <p class="delve-card-desc">${d.description}</p>
                ${locked ? `<div class="delve-card-lock">Level ${d.minLevel} required</div>` : ''}
            </div>
        `;
    }).join('');

    const lockedEntry = playerLevel < (def?.minLevel || 1);

    const stats = DelveGridEngine.buildPlayerStats(player);

    container.innerHTML = `
        <div class="page">
            <div class="page-header">
                <h1 class="page-title">Rift Delves</h1>
                <p class="page-subtitle">Enter a rift, navigate the grid, and fight your way to the boss.</p>
            </div>

            <div class="delve-board-layout">
                <div class="delve-select-panel">
                    <div class="card-header">Select Rift</div>
                    <div class="delve-card-grid">${delveCards}</div>
                </div>

                <div class="delve-briefing-panel">
                    <div class="card delve-brief-card">
                        <div class="card-header">${def?.name || '?'}</div>
                        <div class="card-body">
                            <div class="delve-brief-row">
                                <span class="delve-brief-label">Loot tier</span>
                                <span>Tier ${def?.lootTier || 2}</span>
                            </div>
                            <div class="delve-brief-row">
                                <span class="delve-brief-label">Boss</span>
                                <span>${DELVE_BOSSES[def?.bossId]?.name || '?'}</span>
                            </div>
                            <div class="delve-brief-row">
                                <span class="delve-brief-label">Your HP</span>
                                <span class="${hpPct < 100 ? 'text-danger' : ''}">${hp} / ${maxHp}</span>
                            </div>
                            <div class="delve-brief-row">
                                <span class="delve-brief-label">Corruption</span>
                                <span>${corr}</span>
                            </div>
                            <div class="delve-brief-row">
                                <span class="delve-brief-label">Attack</span>
                                <span>${stats.attack}</span>
                            </div>
                            <div class="delve-brief-row">
                                <span class="delve-brief-label">Defense</span>
                                <span>${stats.defense}</span>
                            </div>
                            <div class="delve-brief-row">
                                <span class="delve-brief-label">Power</span>
                                <span>${stats.power}</span>
                            </div>

                            ${!canEnter ? `
                                <div class="delve-warn">
                                    You must be at full HP to enter a delve.<br>
                                    Rest and recover before attempting a run.
                                </div>
                            ` : ''}

                            <button
                                class="btn btn-primary delve-start-btn"
                                id="delve-enter-btn"
                                ${(lockedEntry || !canEnter) ? 'disabled' : ''}
                            >
                                ${lockedEntry ? `Level ${def?.minLevel} required`
                                  : !canEnter ? 'Recover HP first'
                                  : 'Enter Rift →'}
                            </button>

                            <div class="delve-grid-legend">
                                <div class="legend-title">Tile Guide</div>
                                ${[
                                    ['⚔', 'Enemy'],
                                    ['★', 'Elite'],
                                    ['◈', 'Treasure'],
                                    ['✦', 'Shrine'],
                                    ['?', 'Event'],
                                    ['⚠', 'Hazard'],
                                    ['☠', 'Boss'],
                                    ['@', 'You'],
                                ].map(([icon, label]) => `
                                    <div class="legend-row">
                                        <span class="legend-icon">${icon}</span>
                                        <span class="legend-label">${label}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Bind delve card selection
    container.querySelectorAll('[data-delve-select]').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.delveSelect;
            const d  = getDelveType(id);
            if (!d || playerLevel < d.minLevel) return;
            DelveState.selectedDelveId = id;
            Router._load('rift_delve');
        });
    });

    // Bind enter button
    container.querySelector('#delve-enter-btn')?.addEventListener('click', () => {
        _startDelveRun(DelveState.selectedDelveId);
    });
}

// ── Start a run ───────────────────────────────────────────────────────────────

function _startDelveRun(delveId) {
    const player  = PlayerSystem.current;
    const delveDef = getDelveType(delveId);
    if (!player || !delveDef) return;

    const hp    = player.stats.health.value;
    const maxHp = PlayerSystem.getStatMax('health');
    if (hp < maxHp) { Log.add('You must be at full HP to enter a delve.', 'warning'); return; }

    DelveState.reset();
    DelveState.delveId  = delveId;
    DelveState.delveDef = delveDef;

    const stats = DelveGridEngine.buildPlayerStats(player);
    DelveState.playerHp      = hp;
    DelveState.playerMaxHp   = maxHp;
    DelveState.playerAttack  = stats.attack;
    DelveState.playerDefense = stats.defense;
    DelveState.playerPower   = stats.power;

    DelveState.grid      = DelveGridEngine.generateGrid(delveDef);
    DelveState.playerPos = { x: 0, y: Math.floor(DelveGridEngine.H / 2) };
    DelveState.phase     = 'exploring';
    DelveState.turn      = 0;

    DelveState.addLog(`You step into the ${delveDef.name}.`);
    DelveState.addLog(`ATK ${stats.attack}  DEF ${stats.defense}  PWR ${stats.power}`);
    DelveState.addLog('Navigate the grid. Reach the boss at the far end.');

    Router._load('rift_delve');
}

// ══════════════════════════════════════════════════════════════════════════════
// GAME VIEW — interactive grid + sidebar
// ══════════════════════════════════════════════════════════════════════════════

function _renderDelveGame(container) {
    const s      = DelveState;
    const grid   = s.grid;
    const pos    = s.playerPos;
    const phase  = s.phase;
    const combat = s.combat;

    const validMoves = phase === 'exploring'
        ? DelveGridEngine.getValidMoves(grid, pos)
        : [];

    const hpPct   = Math.round((s.playerHp / s.playerMaxHp) * 100);
    const hpColor = hpPct > 50 ? 'var(--stat-health)' : hpPct > 25 ? 'var(--warning)' : 'var(--danger)';
    const corrGain = DelveGridEngine.corruptionGain(s.turn);

    // ── Status bar ────────────────────────────────────────────────────────────
    const statusHtml = `
        <div class="dg-status-bar">
            <div class="dg-status-left">
                <span class="dg-delve-name">${s.delveDef?.name || 'Rift'}</span>
                <span class="dg-turn-badge">Turn ${s.turn}</span>
                <span class="dg-corr-badge">+${corrGain} corruption/move</span>
            </div>
            <div class="dg-status-right">
                <span class="dg-hp-label">${s.playerHp} / ${s.playerMaxHp} HP</span>
                <div class="dg-hp-track">
                    <div class="dg-hp-fill" style="width:${hpPct}%;background:${hpColor}"></div>
                </div>
                <span class="dg-corr-total">Corruption +${s.gainedCorruption}</span>
            </div>
        </div>
    `;

    // ── Grid ──────────────────────────────────────────────────────────────────
    const gridHtml = _buildGridHtml(grid, pos, validMoves, phase);

    // ── Sidebar ───────────────────────────────────────────────────────────────
    let actionHtml = '';

    if (phase === 'combat' && combat) {
        const ePct   = Math.round((combat.enemyHp / combat.enemyMaxHp) * 100);
        const eColor = ePct > 50 ? 'var(--danger)' : ePct > 25 ? 'var(--warning)' : 'var(--gold)';
        const eRole  = combat.enemy.role ? DelveGridEngine.ROLE_LABELS[combat.enemy.role] || combat.enemy.role : '';
        const retreatChance = Math.round(DelveGridEngine.calcRetreatChance(combat.enemy, s.gainedCorruption) * 100);

        actionHtml = `
            <div class="dg-combat-panel">
                <div class="dg-enemy-card">
                    <div class="dg-enemy-header">
                        <span class="dg-enemy-name">${combat.enemy.name}${combat.isBoss ? ' ☠' : ''}</span>
                        ${eRole ? `<span class="dg-enemy-role">${eRole}</span>` : ''}
                    </div>
                    <div class="dg-enemy-hp-row">
                        <div class="dg-enemy-hp-track">
                            <div class="dg-enemy-hp-fill" style="width:${ePct}%;background:${eColor}"></div>
                        </div>
                        <span class="dg-enemy-hp-label">${combat.enemyHp} / ${combat.enemyMaxHp}</span>
                    </div>
                    <div class="dg-enemy-stats">
                        ATK ${combat.enemy.attack} &nbsp;·&nbsp; DEF ${combat.enemy.defense}
                    </div>
                </div>

                <div class="dg-combat-actions">
                    <button class="btn btn-primary dg-combat-btn" id="dg-attack">
                        ⚔ Attack
                        <span class="dg-btn-hint">~${Math.max(1, s.playerAttack - Math.floor(combat.enemy.defense * 0.5))} dmg</span>
                    </button>
                    <button class="btn btn-secondary dg-combat-btn" id="dg-defend">
                        🛡 Defend
                        <span class="dg-btn-hint">Halve incoming damage</span>
                    </button>
                    <button class="btn btn-secondary dg-combat-btn" id="dg-retreat">
                        ↩ Retreat
                        <span class="dg-btn-hint">${retreatChance}% chance</span>
                    </button>
                </div>
            </div>
        `;
    } else if (phase === 'exploring') {
        // Check if player is on shrine tile
        const currentTile = grid[pos.y * DelveGridEngine.W + pos.x];
        const onShrine = currentTile?.type === 'shrine' && !currentTile.cleared;
        actionHtml = `
            <div class="dg-explore-panel">
                <p class="dg-explore-hint">Click a highlighted tile to move.</p>
                <p class="dg-explore-hint dg-hint-dim">Arrow keys also work.</p>
                ${onShrine ? `<button class="btn btn-secondary btn-sm dg-shrine-btn" id="dg-use-shrine">✦ Use Shrine (heal 25%)</button>` : ''}
                <button class="btn btn-secondary btn-sm dg-escape-btn" id="dg-escape">↩ Escape Delve</button>
            </div>
        `;
    }

    // ── Log ───────────────────────────────────────────────────────────────────
    const logLines = s.log.slice(-10);
    const logHtml = `
        <div class="dg-log">
            ${logLines.map(l => `<div class="dg-log-line">${l}</div>`).join('')}
        </div>
    `;

    // ── Stats row ─────────────────────────────────────────────────────────────
    const statsHtml = `
        <div class="dg-player-stats">
            <div class="dg-stat-chip">ATK <strong>${s.playerAttack}</strong></div>
            <div class="dg-stat-chip">DEF <strong>${s.playerDefense}</strong></div>
            <div class="dg-stat-chip">PWR <strong>${s.playerPower}</strong></div>
        </div>
    `;

    container.innerHTML = `
        <div class="page dg-page">
            ${statusHtml}
            <div class="dg-game-layout">
                <div class="dg-grid-wrap" id="dg-grid-wrap">
                    ${gridHtml}
                </div>
                <div class="dg-sidebar" id="dg-sidebar">
                    ${statsHtml}
                    ${actionHtml}
                    ${logHtml}
                </div>
            </div>
        </div>
    `;

    _bindDelveGame(container);
}

// ── Grid renderer ─────────────────────────────────────────────────────────────

function _buildGridHtml(grid, pos, validMoves, phase) {
    const W = DelveGridEngine.W;
    const H = DelveGridEngine.H;

    let html = '<div class="dg-grid" id="dg-grid">';
    for (let y = 0; y < H; y++) {
        html += '<div class="dg-row">';
        for (let x = 0; x < W; x++) {
            html += _buildTileHtml(grid[y * W + x], pos, validMoves, phase);
        }
        html += '</div>';
    }
    html += '</div>';
    return html;
}

function _buildTileHtml(tile, pos, validMoves, phase) {
    const { x, y } = tile;
    const isPlayer = pos.x === x && pos.y === y;
    const isMove   = phase === 'exploring' && validMoves.some(m => m.x === x && m.y === y);

    if (isPlayer) {
        return `<div class="dg-tile tile-player" title="You are here">@</div>`;
    }

    if (!tile.revealed) {
        return `<div class="dg-tile tile-hidden" title="Unexplored">█</div>`;
    }

    const icon  = tile.cleared ? '·' : (DelveGridEngine.TILE_ICONS[tile.type] || '·');
    const label = tile.cleared ? 'Cleared' : (DelveGridEngine.TILE_LABELS[tile.type] || 'Empty');

    let cls = `dg-tile tile-${tile.type}`;
    if (tile.cleared) cls += ' tile-cleared';
    if (isMove)       cls += ' tile-move';
    if (tile.visited && !tile.cleared && tile.type !== 'empty') cls += ' tile-revisit';

    const moveAttr = isMove ? `data-move-x="${x}" data-move-y="${y}"` : '';

    return `<div class="${cls}" ${moveAttr} title="${label} (${x},${y})">${icon}</div>`;
}

// ── Event binding ─────────────────────────────────────────────────────────────

function _bindDelveGame(container) {
    // Grid tile click → move
    container.querySelector('#dg-grid')?.addEventListener('click', e => {
        const tile = e.target.closest('[data-move-x]');
        if (!tile) return;
        const x = parseInt(tile.dataset.moveX);
        const y = parseInt(tile.dataset.moveY);
        _doMove(x, y);
    });

    // Combat buttons
    container.querySelector('#dg-attack')?.addEventListener('click',  _doCombatAttack);
    container.querySelector('#dg-defend')?.addEventListener('click',  _doCombatDefend);
    container.querySelector('#dg-retreat')?.addEventListener('click', _doCombatRetreat);

    // Shrine
    container.querySelector('#dg-use-shrine')?.addEventListener('click', _doUseShrine);

    // Escape
    container.querySelector('#dg-escape')?.addEventListener('click', () => {
        if (confirm('Escape the delve? You keep collected loot and corruption, but no boss reward.')) {
            _endRun('escaped');
        }
    });

    // Keyboard movement
    container._delvekeyHandler = e => {
        if (DelveState.phase !== 'exploring') return;
        const map = {
            ArrowRight: { dx:  1, dy:  0 },
            ArrowLeft:  { dx: -1, dy:  0 },
            ArrowDown:  { dx:  0, dy:  1 },
            ArrowUp:    { dx:  0, dy: -1 },
        };
        const dir = map[e.key];
        if (!dir) return;
        e.preventDefault();
        const nx = DelveState.playerPos.x + dir.dx;
        const ny = DelveState.playerPos.y + dir.dy;
        if (nx < 0 || nx >= DelveGridEngine.W || ny < 0 || ny >= DelveGridEngine.H) return;
        _doMove(nx, ny);
    };
    document.addEventListener('keydown', container._delvekeyHandler);
}

// ══════════════════════════════════════════════════════════════════════════════
// MOVEMENT
// ══════════════════════════════════════════════════════════════════════════════

function _doMove(x, y) {
    const s   = DelveState;
    const grid = s.grid;
    const tile = grid[y * DelveGridEngine.W + x];

    // Corruption per turn (scaling)
    const gain = DelveGridEngine.corruptionGain(s.turn);
    s.gainedCorruption += gain;
    s.turn++;

    // Revisit penalty
    if (tile.visited && tile.type !== 'boss') {
        s.gainedCorruption += 2;
        s.addLog(`You retrace your steps. (+2 corruption)`);
    }

    // Mark visited, reveal surroundings
    tile.visited = true;
    DelveGridEngine._revealAround(grid, x, y);
    s.playerPos = { x, y };

    // Resolve tile
    const result = DelveGridEngine.resolveTile(tile, s.delveDef);
    s.addLog(result.log);

    if (result.type === 'enemy' || result.type === 'boss') {
        // Enter combat
        const enemy = result.enemy || result.boss;
        s.combat = {
            enemy:      enemy,
            enemyHp:    enemy.health,
            enemyMaxHp: enemy.health,
            isBoss:     result.type === 'boss',
        };
        s.phase = 'combat';

    } else if (result.type === 'treasure') {
        s.goldFound        += result.gold;
        s.riftShardsFound  += result.riftShards || 0;
        if (result.material) s.materialsFound.push(result.material);
        tile.cleared = true;

    } else if (result.type === 'shrine') {
        // Player will interact via button; don't auto-clear
        s.phase = 'exploring';

    } else if (result.type === 'event') {
        const eff = result.effect;
        if (eff?.type === 'heal') {
            const healed = Math.floor(s.playerMaxHp * eff.amount);
            s.playerHp = Math.min(s.playerMaxHp, s.playerHp + healed);
        } else if (eff?.type === 'damage') {
            s.playerHp = Math.max(0, s.playerHp - Math.floor(s.playerMaxHp * eff.amount));
        } else if (eff?.type === 'damageAndCorruption') {
            s.playerHp         = Math.max(0, s.playerHp - Math.floor(s.playerMaxHp * eff.damage));
            s.gainedCorruption += eff.corruption || 0;
        } else if (eff?.type === 'shards') {
            s.riftShardsFound += eff.amount || 1;
        } else if (eff?.type === 'gold') {
            s.goldFound += eff.amount || 0;
        } else if (eff?.type === 'corruption') {
            s.gainedCorruption += eff.amount || 0;
        }
        tile.cleared = true;

    } else if (result.type === 'hazard') {
        const hz = result.hazard;
        const dmg = Math.floor(s.playerMaxHp * (hz.damage || 0));
        s.playerHp         = Math.max(0, s.playerHp - dmg);
        s.gainedCorruption += hz.corruption || 0;
        tile.cleared = true;

    } else {
        // Empty
        tile.cleared = true;
    }

    // Death from hazard/event
    if (s.playerHp <= 0 && s.phase !== 'combat') {
        s.addLog('The rift claims you. You fall.');
        _endRun('death');
        return;
    }

    _refreshDelveGame();
}

// ══════════════════════════════════════════════════════════════════════════════
// COMBAT
// ══════════════════════════════════════════════════════════════════════════════

function _doCombatAttack() {
    const s      = DelveState;
    const combat = s.combat;
    if (!combat) return;

    const playerDmg = DelveGridEngine.calcPlayerDamage(s.playerAttack, combat.enemy);
    const enemyDmg  = DelveGridEngine.calcEnemyDamage(combat.enemy, s.playerDefense);

    combat.enemyHp -= playerDmg;
    s.addLog(`You attack for ${playerDmg} damage.`);

    // Enemy role: leech — heals from damage dealt
    if (combat.enemy.role === 'leech') {
        const healed = Math.floor(enemyDmg * 0.30);
        combat.enemyHp = Math.min(combat.enemyMaxHp, combat.enemyHp + healed);
    }

    if (combat.enemyHp <= 0) {
        _onEnemyDefeated();
        return;
    }

    // Enemy counter-attack
    s.playerHp -= enemyDmg;
    s.addLog(`${combat.enemy.name} strikes for ${enemyDmg} damage.`);

    // Enemy role: corruptor — +3 corruption per hit
    if (combat.enemy.role === 'corruptor') {
        s.gainedCorruption += 3;
        s.addLog(`The corruption seeps deeper. (+3 corruption)`);
    }

    if (s.playerHp <= 0) {
        s.playerHp = 0;
        s.addLog(`You have fallen.`);
        _endRun('death');
        return;
    }

    _refreshDelveGame();
}

function _doCombatDefend() {
    const s      = DelveState;
    const combat = s.combat;
    if (!combat) return;

    const enemyDmg  = DelveGridEngine.calcEnemyDamage(combat.enemy, s.playerDefense);
    const reduced   = Math.max(1, Math.floor(enemyDmg * 0.5));

    s.playerHp -= reduced;
    s.addLog(`You brace. ${combat.enemy.name} deals ${reduced} damage (halved).`);

    // Enemy role: corruptor — still applies on defend
    if (combat.enemy.role === 'corruptor') {
        s.gainedCorruption += 3;
        s.addLog(`The corruption seeps deeper. (+3 corruption)`);
    }

    if (s.playerHp <= 0) {
        s.playerHp = 0;
        s.addLog(`You have fallen.`);
        _endRun('death');
        return;
    }

    _refreshDelveGame();
}

function _doCombatRetreat() {
    const s      = DelveState;
    const combat = s.combat;
    if (!combat) return;

    const chance  = DelveGridEngine.calcRetreatChance(combat.enemy, s.gainedCorruption);
    const success = Math.random() < chance;

    if (success) {
        s.addLog(`You break away from the ${combat.enemy.name} and retreat.`);
        // Step back to previous tile if possible (stay on same tile, enemy tile stays uncleared)
        // The enemy tile remains — player can re-enter combat
        s.combat = null;
        s.phase  = 'exploring';
    } else {
        // Retreat failed — enemy attacks
        const enemyDmg = DelveGridEngine.calcEnemyDamage(combat.enemy, s.playerDefense);
        s.playerHp -= enemyDmg;
        s.addLog(`Retreat failed. ${combat.enemy.name} punishes you for ${enemyDmg} damage.`);

        if (combat.enemy.role === 'corruptor') {
            s.gainedCorruption += 3;
            s.addLog(`The corruption seeps deeper. (+3 corruption)`);
        }

        if (s.playerHp <= 0) {
            s.playerHp = 0;
            s.addLog(`You have fallen.`);
            _endRun('death');
            return;
        }
    }

    _refreshDelveGame();
}

function _onEnemyDefeated() {
    const s      = DelveState;
    const combat = s.combat;

    s.addLog(`${combat.enemy.name} is defeated!`);

    // XP
    const xpGained = combat.enemy.xp || 0;
    if (xpGained > 0) {
        s.xpFound += xpGained;
        s.addLog(`+${xpGained} XP.`);
    }

    // Mark tile cleared
    const tile = s.grid[s.playerPos.y * DelveGridEngine.W + s.playerPos.x];
    tile.cleared = true;

    // Boss victory → end run
    if (combat.isBoss) {
        const loot = DelveGridEngine.generateBossLoot(s.delveDef);
        s.goldFound       += loot.gold;
        s.riftShardsFound += loot.riftShards;
        for (const m of loot.materials) s.materialsFound.push(m);
        // Chest added by rewards system
        s._bossChest = loot.chest;
        s.addLog(`Boss slain! +${loot.gold}g · +${loot.riftShards} rift shards · chest reward incoming.`);
        s.combat = null;
        _endRun('victory');
        return;
    }

    s.combat = null;
    s.phase  = 'exploring';

    _refreshDelveGame();
}

// ── Shrine interaction ────────────────────────────────────────────────────────

function _doUseShrine() {
    const s    = DelveState;
    const tile = s.grid[s.playerPos.y * DelveGridEngine.W + s.playerPos.x];
    if (!tile || tile.type !== 'shrine' || tile.cleared) return;

    const r = DelveGridEngine.useShrine(s.playerHp, s.playerMaxHp);
    s.playerHp = r.newHp;
    tile.cleared = true;
    s.addLog(r.log);

    _refreshDelveGame();
}

// ── Refresh game view without full re-render ──────────────────────────────────

function _refreshDelveGame() {
    if (DelveState.phase === 'result') {
        Router._load('rift_delve');
        return;
    }
    // Remove keyboard handler before re-render
    const container = document.getElementById('content-area');
    if (container?._delvekeyHandler) {
        document.removeEventListener('keydown', container._delvekeyHandler);
    }
    if (container) _renderDelveGame(container);
}

// ══════════════════════════════════════════════════════════════════════════════
// END RUN
// ══════════════════════════════════════════════════════════════════════════════

function _endRun(result) {
    const s      = DelveState;
    const player = PlayerSystem.current;

    s.result = result;
    s.phase  = 'result';
    s.combat = null;

    // Apply rewards and penalties to live player
    DelveRewards.apply(player, s);

    Router._load('rift_delve');
}

// ══════════════════════════════════════════════════════════════════════════════
// RESULTS
// ══════════════════════════════════════════════════════════════════════════════

function _renderDelveResult(container) {
    const s = DelveState;
    const isDeath = s.result === 'death';

    const titleMap = {
        victory: '✔ Boss Defeated',
        death:   '✘ You Have Fallen',
        escaped: '↩ Escaped',
    };

    const rewardLines = [];
    if (isDeath) {
        rewardLines.push('No loot recovered.');
        rewardLines.push(`+${s.gainedCorruption} corruption retained.`);
        rewardLines.push('Your HP has been set to 0. Recover before attempting another delve.');
    } else {
        if (s.goldFound > 0)        rewardLines.push(`+${s.goldFound.toLocaleString()} gold`);
        if (s.riftShardsFound > 0)  rewardLines.push(`+${s.riftShardsFound} rift shard${s.riftShardsFound !== 1 ? 's' : ''}`);
        for (const m of s.materialsFound) {
            rewardLines.push(`${m.amount}× ${m.id.replace(/_/g,' ')}`);
        }
        if (s.xpFound > 0)          rewardLines.push(`+${s.xpFound} XP distributed`);
        if (s.gainedCorruption > 0) rewardLines.push(`+${s.gainedCorruption} corruption`);
        if (s._bossChest)           rewardLines.push(`📦 ${s._bossChest.name}`);
    }

    const logHtml = s.log.map(l => `<div class="dg-log-line">${l}</div>`).join('');

    container.innerHTML = `
        <div class="page">
            <div class="page-header">
                <h1 class="page-title">${titleMap[s.result] || 'Delve Complete'}</h1>
                <p class="page-subtitle">${s.delveDef?.name} · Turn ${s.turn}</p>
            </div>

            <div class="dg-results-layout">
                <div class="card dg-results-summary">
                    <div class="card-header">Spoils</div>
                    <div class="card-body">
                        ${rewardLines.map(l => `<div class="dg-reward-line">${l}</div>`).join('')
                          || '<p class="muted-text">Nothing recovered.</p>'}

                        <div class="dg-results-actions">
                            <button class="btn btn-primary" id="dg-return-board">Return to Board</button>
                            ${!isDeath ? `<button class="btn btn-secondary" id="dg-run-again">Run Again</button>` : ''}
                        </div>
                    </div>
                </div>

                <div class="card dg-results-log">
                    <div class="card-header">Run Log</div>
                    <div class="dg-log dg-log-results">${logHtml}</div>
                </div>
            </div>
        </div>
    `;

    container.querySelector('#dg-return-board')?.addEventListener('click', () => {
        DelveState.reset();
        Router._load('rift_delve');
    });

    container.querySelector('#dg-run-again')?.addEventListener('click', () => {
        const id = DelveState.delveId;
        DelveState.reset();
        DelveState.selectedDelveId = id;
        Router._load('rift_delve');
    });
}
