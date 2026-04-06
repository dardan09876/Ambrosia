// js/pages/warbands.js
// Warbands page — tug-of-war control map of the Capital Ruins.

let _wbSelectedTile  = null;
let _wbTimerInterval = null;

function _clearWbTimer() {
    if (_wbTimerInterval) { clearInterval(_wbTimerInterval); _wbTimerInterval = null; }
}

Router.register('warbands', function renderWarbands(container) {
    const player = PlayerSystem.current;
    if (!player) return;

    const winLoss = WarbandSystem.checkWinLoss(player);
    const tiles   = WarbandSystem.getMap(player);
    const owned   = tiles.filter(t => WarbandSystem.controlState(t.controlScore) === 'player').length;
    const total   = tiles.length;

    container.innerHTML = `
        <div class="page">
            <div class="page-header">
                <h1 class="page-title">Warbands</h1>
                <p class="page-subtitle">Capital Ruins — contest the fallen city tile by tile. Hold ground. Push forward.</p>
            </div>

            ${winLoss.win  ? `<div class="wb-outcome wb-outcome-win">⚑ Victory — ${winLoss.winReason}</div>`  : ''}
            ${winLoss.loss ? `<div class="wb-outcome wb-outcome-loss">☠ Defeat — all territory lost. Regain a pathway to rebuild.</div>` : ''}

            <div class="warbands-layout">
                <div class="warbands-main">
                    <!-- War Map -->
                    <div class="card warbands-map-card">
                        <div class="card-header">
                            War Map — Capital Ruins
                            <span class="wb-influence-badge">⚑ ${player.warbandInfluence || 0} Influence · ${owned}/${total} tiles</span>
                        </div>
                        <div class="card-body">
                            ${_renderWarMap(player)}
                        </div>
                    </div>

                    <!-- Tile detail panel -->
                    <div class="card wb-tile-detail" id="wb-tile-detail">
                        ${_renderTileDetail(player, _wbSelectedTile)}
                    </div>
                </div>

                <div class="warbands-sidebar">
                    <!-- Rift Quests -->
                    <div class="card">
                        <div class="card-header">Rift Quests</div>
                        <div class="card-body">
                            <p class="muted-text" style="font-size:11px;margin-bottom:10px">
                                Complete quests to gain influence and push control. One active at a time.
                            </p>
                            ${_renderRiftQuests(player)}
                        </div>
                    </div>

                    <!-- Faction support -->
                    <div class="card">
                        <div class="card-header">Faction Support</div>
                        <div class="card-body">
                            ${_renderFactionSupport(player)}
                        </div>
                    </div>

                    <!-- Active bonuses -->
                    <div class="card">
                        <div class="card-header">Active Bonuses</div>
                        <div class="card-body">
                            ${_renderActiveBonuses(player)}
                        </div>
                    </div>

                    <!-- Campaign stats -->
                    <div class="card">
                        <div class="card-header">Campaign</div>
                        <div class="card-body">
                            ${_renderCampaignStats(player)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    _bindWarbandEvents(container, player);
});

// ── SVG War Map ───────────────────────────────────────────────────────────────

function _renderWarMap(player) {
    const tiles = WarbandSystem.getMap(player);
    const CELL  = 64, GAP = 6, COLS = 5, ROWS = 4;
    const W     = COLS * (CELL + GAP) + GAP;
    const H     = ROWS * (CELL + GAP) + GAP;
    const byId  = Object.fromEntries(tiles.map(t => [t.id, t]));

    // Connection lines
    const lines = [];
    const drawn = new Set();
    for (const t of tiles) {
        for (const adjId of t.adjacentIds) {
            const key = [t.id, adjId].sort().join('|');
            if (drawn.has(key)) continue;
            drawn.add(key);
            const adj = byId[adjId];
            if (!adj) continue;
            const x1 = GAP + t.x*(CELL+GAP) + CELL/2, y1 = GAP + t.y*(CELL+GAP) + CELL/2;
            const x2 = GAP + adj.x*(CELL+GAP) + CELL/2, y2 = GAP + adj.y*(CELL+GAP) + CELL/2;
            lines.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#3a3a3a" stroke-width="1.5" stroke-dasharray="4,3"/>`);
        }
    }

    // Tiles
    const rects = tiles.map(t => {
        const typeDef = WARBAND_TILE_TYPES[t.type] || {};
        const state   = t.unlocked ? WarbandSystem.controlState(t.controlScore) : 'locked';
        const colors  = typeDef.color || {};
        const fill    = colors[state] || colors.enemy || '#1a1a1a';
        const opacity = t.unlocked ? 1 : 0.35;
        const x       = GAP + t.x*(CELL+GAP);
        const y       = GAP + t.y*(CELL+GAP);
        const cx      = x + CELL/2, cy = y + CELL/2;
        const isSelected = _wbSelectedTile === t.id;

        // Control bar at bottom of tile
        const pct    = Math.round(((t.controlScore - WARBAND_CONTROL.enemyFull) / (WARBAND_CONTROL.playerFull - WARBAND_CONTROL.enemyFull)) * 100);
        const barW   = Math.round((CELL - 8) * pct / 100);
        const barColor = state === 'player' ? '#4a9e6b' : state === 'contested' ? '#c9a84c' : '#c04040';

        // Status icons (fortified/stabilized/troops)
        const tTroops = t.troopCount ?? (t.troops ? 1 : 0);
        const tFort   = t.fortLevel  ?? (t.fortified ? 1 : 0);
        const icons = [];
        if (tFort > 0)   icons.push(tFort >= 2 ? '🛡🛡' : '🛡');
        if (t.stabilized) icons.push('✦');
        if (tTroops > 0) icons.push('⚔'.repeat(tTroops));
        const iconStr = icons.length > 0
            ? `<text x="${x+4}" y="${y+CELL-13}" font-size="9" opacity="${opacity}">${icons.join('')}</text>` : '';

        const strokeColor = isSelected ? '#c9a84c' : (state === 'player' ? '#4a9e6b' : state === 'contested' ? '#8a7a3a' : '#2a2a2a');
        const strokeW     = isSelected ? 2.5 : 1.5;

        const diffDots = Array.from({ length: t.difficulty }, (_, i) =>
            `<circle cx="${x+5+i*8}" cy="${y+8}" r="2.5" fill="#c9a84c" opacity="${opacity * 0.7}"/>`
        ).join('');

        return `
            <g data-tile-id="${t.id}" class="wb-tile" style="cursor:${t.unlocked ? 'pointer' : 'default'}">
                <rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" fill="${fill}" rx="5"
                      opacity="${opacity}" stroke="${strokeColor}" stroke-width="${strokeW}"/>
                <text x="${cx}" y="${cy-5}" text-anchor="middle" dominant-baseline="middle"
                      font-size="20" opacity="${opacity}">${typeDef.icon || '?'}</text>
                <text x="${cx}" y="${cy+12}" text-anchor="middle" dominant-baseline="middle"
                      font-size="9" fill="#ccc" opacity="${opacity}">${typeDef.label || t.type}</text>
                ${diffDots}
                <rect x="${x+4}" y="${y+CELL-8}" width="${CELL-8}" height="4" fill="#111" rx="2"/>
                <rect x="${x+4}" y="${y+CELL-8}" width="${Math.max(0,barW)}" height="4" fill="${barColor}" rx="2" opacity="${opacity}"/>
                ${iconStr}
            </g>
        `;
    }).join('');

    const legend = `
        <div class="wb-map-legend">
            <span class="wb-legend-item"><span class="wb-legend-dot" style="background:#4a9e6b"></span>Player</span>
            <span class="wb-legend-item"><span class="wb-legend-dot" style="background:#c9a84c"></span>Contested</span>
            <span class="wb-legend-item"><span class="wb-legend-dot" style="background:#7a1a1a"></span>Enemy</span>
            <span class="wb-legend-item"><span class="wb-legend-dot" style="background:#1a1a2a;border:1px solid #444"></span>Locked</span>
            <span class="wb-legend-item">🛡 Fortified</span>
            <span class="wb-legend-item">✦ Stabilized</span>
            <span class="wb-legend-item">⚔ Troops</span>
        </div>
    `;

    return `
        <svg id="wb-map-svg" viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;display:block;margin:0 auto">
            ${lines.join('')}${rects}
        </svg>
        ${legend}
    `;
}

// ── Tile Detail ───────────────────────────────────────────────────────────────

function _renderTileDetail(player, tileId) {
    if (!tileId) {
        return `<div class="card-header">Tile Detail</div>
                <div class="card-body muted-text" style="font-size:13px">Click a tile on the map to inspect it.</div>`;
    }

    const tile    = WarbandSystem.getTile(player, tileId);
    if (!tile) return `<div class="card-header">Tile Detail</div><div class="card-body muted-text">Not found.</div>`;

    const typeDef   = WARBAND_TILE_TYPES[tile.type] || {};
    const state     = WarbandSystem.controlState(tile.controlScore);
    const stateLabel = { player: 'Player Controlled', contested: 'Contested', enemy: 'Enemy Controlled' }[state];
    const stateColor = { player: '#4a9e6b', contested: '#c9a84c', enemy: '#c04040' }[state];
    const scorePct  = Math.round(((tile.controlScore - WARBAND_CONTROL.enemyFull) / 200) * 100);

    const support = WarbandSystem.getActiveFactionSupport(player);

    // Compute effective costs
    let fortifyCost   = WARBAND_COSTS.fortify;
    let stabCost      = WARBAND_COSTS.stabilizeRift;
    if (support?.effects?.fortifyCostMod)   fortifyCost = Math.ceil(fortifyCost * support.effects.fortifyCostMod);
    if (support?.effects?.stabilizeCostMod) stabCost    = Math.ceil(stabCost    * support.effects.stabilizeCostMod);
    const troopCost   = WARBAND_COSTS.deployTroops;
    const inf         = player.warbandInfluence || 0;

    let actions = '';
    if (!tile.unlocked) {
        actions = `<p class="muted-text" style="font-size:12px;margin-top:8px">Locked — control an adjacent tile first.</p>`;
    } else {
        const troopCount = tile.troopCount ?? (tile.troops ? 1 : 0);
        const fortLevel  = tile.fortLevel  ?? (tile.fortified ? 1 : 0);
        const MAX_TROOPS = 3, MAX_FORT = 2;
        const troopAvail = troopCount < MAX_TROOPS;
        const fortAvail  = fortLevel  < MAX_FORT;
        const stabAvail  = tile.type === 'rift' && !tile.stabilized;
        const btnClass   = (cost, condition) => `btn btn-sm ${(inf >= cost && condition) ? 'btn-primary' : 'btn-disabled'}`;

        const fortReductionLabel = fortLevel === 0 ? '−50% pressure'
                                 : fortLevel === 1 ? '−75% pressure (max next)'
                                 : '−75% pressure (max)';

        actions = `
            <div class="wb-tile-actions">
                <button class="${btnClass(troopCost, troopAvail)}"
                    ${troopAvail && inf >= troopCost ? `data-tile-action="troops" data-tile-id="${tileId}"` : 'disabled'}
                    title="Stack troops to push control +20 and boost hold gain (max ${MAX_TROOPS})">
                    ⚔ Troops ${troopCount}/${MAX_TROOPS} <span class="wb-cost">${troopCost}</span>
                </button>
                <button class="${btnClass(fortifyCost, fortAvail)}"
                    ${fortAvail && inf >= fortifyCost ? `data-tile-action="fortify" data-tile-id="${tileId}"` : 'disabled'}
                    title="Fortify to reduce enemy pressure (max ${MAX_FORT} levels)">
                    🛡 Fortify ${fortLevel}/${MAX_FORT} <span class="wb-cost">${fortifyCost}</span>
                </button>
                ${stabAvail ? `<button class="${btnClass(stabCost, stabAvail)}"
                    ${inf >= stabCost ? `data-tile-action="stabilize" data-tile-id="${tileId}"` : 'disabled'}
                    title="Disable enemy spawns on this rift node">
                    ✦ Stabilize <span class="wb-cost">${stabCost}</span>
                </button>` : ''}
            </div>
            ${troopCount > 0 ? `<p class="muted-text" style="font-size:11px;margin-top:4px">⚔ ${troopCount} troop stack${troopCount > 1 ? 's' : ''} — +${troopCount * 4}/tick hold gain, −${troopCount * 15}% pressure.</p>` : ''}
            ${fortLevel  > 0 ? `<p class="muted-text" style="font-size:11px;margin-top:2px">🛡 Fortified lv${fortLevel} — ${fortReductionLabel}.</p>` : ''}
            ${tile.stabilized ? `<p class="muted-text" style="font-size:11px;margin-top:2px">✦ Stabilized — no enemy spawns.</p>` : ''}
        `;
    }

    return `
        <div class="card-header">
            ${typeDef.icon || ''} ${typeDef.label || tile.type}
            <span style="color:${stateColor};font-size:12px;font-weight:400;margin-left:8px">${stateLabel}</span>
        </div>
        <div class="card-body">
            <p style="font-size:12px;color:#aaa;margin-bottom:8px">${typeDef.description || ''}</p>
            <div class="wb-detail-row"><span>Difficulty</span><span>${'◆'.repeat(tile.difficulty)}</span></div>
            <div class="wb-detail-row"><span>Control</span><span style="color:${stateColor}">${tile.controlScore > 0 ? '+' : ''}${tile.controlScore}</span></div>
            ${typeDef.bonusLabel ? `<div class="wb-detail-row"><span>Bonus</span><span style="color:var(--gold)">${typeDef.bonusLabel}</span></div>` : ''}
            <div class="wb-control-bar-wrap" style="margin:8px 0 4px">
                <div class="stat-bar-track">
                    <div class="wb-control-bar-fill" style="width:${scorePct}%;background:${stateColor}"></div>
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:10px;color:#666;margin-bottom:10px">
                <span>Enemy</span><span>Contested</span><span>Player</span>
            </div>
            ${actions}
        </div>
    `;
}

// ── Rift Quests ───────────────────────────────────────────────────────────────

function _renderRiftQuests(player) {
    const active  = player.warbandStats?.activeRiftQuest;
    const support = WarbandSystem.getActiveFactionSupport(player);

    return WARBAND_RIFT_QUESTS.map(quest => {
        const check    = WarbandSystem.canStartRiftQuest(player, quest.id);
        const cdMs     = WarbandSystem.getRiftQuestCooldownRemaining(player, quest.id);
        const isActive = active?.questId === quest.id;
        const rem      = isActive ? Math.max(0, active.endsAt - Date.now()) : 0;
        const influence = calcQuestInfluence(quest, support);

        let action = '';
        if (isActive) {
            const m = Math.floor(rem / 60000), s = Math.ceil((rem % 60000) / 1000);
            action = `<span class="wb-quest-timer" id="wb-quest-timer-${quest.id}" data-ends-at="${active.endsAt}">⏳ ${m}:${String(s).padStart(2,'0')}</span>`;
        } else if (cdMs > 0) {
            const cdSec = Math.ceil(cdMs / 1000);
            const cdExpires = Date.now() + cdMs;
            const cdM = Math.floor(cdSec / 60), cdS = cdSec % 60;
            action = `<span class="muted-text wb-cd-timer" id="wb-cd-timer-${quest.id}" data-cd-expires="${cdExpires}" style="font-size:11px">Cooldown ${cdM}:${String(cdS).padStart(2,'0')}</span>`;
        } else {
            action = `<button class="btn btn-sm ${check.ok ? 'btn-primary' : 'btn-disabled'}"
                ${check.ok ? `data-rift-quest="${quest.id}"` : `disabled title="${check.reason}"`}>Start</button>`;
        }

        const typeDef = WARBAND_TILE_TYPES[quest.tileType] || {};
        return `
            <div class="wb-quest-card">
                <div class="wb-quest-header">
                    <span class="wb-quest-name">${quest.name}</span>
                    <span class="wb-quest-type">${typeDef.icon || ''} ${typeDef.label || quest.tileType}</span>
                </div>
                <p class="wb-quest-desc">${quest.description}</p>
                <div class="wb-quest-footer">
                    <span class="wb-quest-reward">+${influence} inf · ${quest.goldReward.min}–${quest.goldReward.max}g · +${quest.controlGain} ctrl</span>
                    ${action}
                </div>
            </div>
        `;
    }).join('');
}

// ── Faction Support ───────────────────────────────────────────────────────────

function _renderFactionSupport(player) {
    const support  = WarbandSystem.getActiveFactionSupport(player);
    const ws       = player.warbandStats || {};
    const cost     = WARBAND_COSTS.factionSupport;
    const inf      = player.warbandInfluence || 0;

    if (support) {
        const expires = ws.factionSupportExpires || 0;
        const remMins = Math.max(0, Math.ceil((expires - Date.now()) / 60000));
        return `
            <div class="wb-faction-active">
                <span style="font-size:16px">${support.icon}</span>
                <div>
                    <div style="font-weight:600;font-size:13px">${support.name} Support Active</div>
                    <div class="muted-text" style="font-size:11px">${support.supportLabel}</div>
                    <div class="muted-text" style="font-size:11px">${remMins}m remaining</div>
                </div>
            </div>
        `;
    }

    const factionDef = getWarbandFactionSupport(player.faction);
    if (!factionDef) {
        return `<p class="muted-text" style="font-size:12px">Your faction has no support available in these ruins.</p>`;
    }

    return `
        <div style="margin-bottom:10px">
            <div style="font-weight:600;font-size:13px">${factionDef.icon} ${factionDef.name}</div>
            <div class="muted-text" style="font-size:12px;margin:4px 0">${factionDef.description}</div>
            <div style="font-size:12px;color:var(--gold);margin-bottom:8px">${factionDef.supportLabel}</div>
        </div>
        <button class="btn btn-sm ${inf >= cost ? 'btn-secondary' : 'btn-disabled'}" style="width:100%"
            ${inf >= cost ? 'id="wb-faction-support-btn"' : 'disabled'}>
            Request Support (${cost} inf · 30 min)
        </button>
        ${inf < cost ? `<p class="muted-text" style="font-size:11px;margin-top:4px">Need ${cost - inf} more influence.</p>` : ''}
    `;
}

// ── Active Bonuses ────────────────────────────────────────────────────────────

function _renderActiveBonuses(player) {
    const tiles = WarbandSystem.getMap(player).filter(t => WarbandSystem.controlState(t.controlScore) === 'player');
    if (tiles.length === 0) {
        return `<p class="muted-text" style="font-size:12px">Control tiles to gain passive bonuses.</p>`;
    }

    const byType = {};
    for (const t of tiles) byType[t.type] = (byType[t.type] || 0) + 1;

    const rows = [];
    if (byType.stronghold) rows.push(`<div class="wb-bonus-row"><span>⛫ Strongholds ×${byType.stronghold}</span><span style="color:#4a9edb">+${byType.stronghold * 10} max HP</span></div>`);
    if (byType.rift)       rows.push(`<div class="wb-bonus-row"><span>🌀 Rift Nodes ×${byType.rift}</span><span style="color:#c9a84c">+${byType.rift * 15}% delve XP</span></div>`);
    if (byType.supply)     rows.push(`<div class="wb-bonus-row"><span>⊕ Supply ×${byType.supply}</span><span style="color:#4a9e6b">+${byType.supply * 10}% quest gold</span></div>`);
    if (byType.pathway)    rows.push(`<div class="wb-bonus-row"><span>◈ Pathways ×${byType.pathway}</span><span style="color:#aaa">Access</span></div>`);

    const stabs = WarbandSystem.getMap(player).filter(t => t.stabilized).length;
    if (stabs > 0) rows.push(`<div class="wb-bonus-row"><span>✦ Stabilized Rifts ×${stabs}</span><span style="color:#9b6bd4">Spawns suppressed</span></div>`);

    return rows.join('') || `<p class="muted-text" style="font-size:12px">No bonuses active.</p>`;
}

// ── Campaign Stats ────────────────────────────────────────────────────────────

function _renderCampaignStats(player) {
    const ws    = player.warbandStats || {};
    const tiles = WarbandSystem.getMap(player);
    const byState = { player: 0, contested: 0, enemy: 0 };
    for (const t of tiles) byState[WarbandSystem.controlState(t.controlScore)]++;

    return `
        <div class="wb-stat-row"><span>Player</span><span style="color:#4a9e6b">${byState.player}</span></div>
        <div class="wb-stat-row"><span>Contested</span><span style="color:#c9a84c">${byState.contested}</span></div>
        <div class="wb-stat-row"><span>Enemy</span><span style="color:#c04040">${byState.enemy}</span></div>
        <div class="wb-stat-row"><span>Influence held</span><span>${player.warbandInfluence || 0}</span></div>
        <div class="wb-stat-row"><span>Total earned</span><span>${ws.totalInfluenceEarned || 0}</span></div>
        <div class="wb-stat-row"><span>Quests done</span><span>${ws.questsCompleted || 0}</span></div>
    `;
}

// ── Event binding ─────────────────────────────────────────────────────────────

function _bindWarbandEvents(container, player) {
    // Live countdown timer — ticks every second, updates timer spans in-place
    _clearWbTimer();
    _wbTimerInterval = setInterval(() => {
        // Active quest timer
        const activeTimers = container.querySelectorAll('[data-ends-at]');
        activeTimers.forEach(el => {
            const endsAt = parseInt(el.dataset.endsAt, 10);
            const rem    = Math.max(0, endsAt - Date.now());
            const m = Math.floor(rem / 60000);
            const s = Math.ceil((rem % 60000) / 1000);
            el.textContent = `⏳ ${m}:${String(s).padStart(2,'0')}`;
            if (rem === 0) {
                // Quest finished — do a full page reload so the reward banner appears
                _clearWbTimer();
                Router._load('warbands');
            }
        });

        // Cooldown timers
        const cdTimers = container.querySelectorAll('[data-cd-expires]');
        cdTimers.forEach(el => {
            const expires = parseInt(el.dataset.cdExpires, 10);
            const rem     = Math.max(0, expires - Date.now());
            if (rem === 0) {
                _clearWbTimer();
                Router._load('warbands');
                return;
            }
            const cdSec = Math.ceil(rem / 1000);
            const cdM = Math.floor(cdSec / 60), cdS = cdSec % 60;
            el.textContent = `Cooldown ${cdM}:${String(cdS).padStart(2,'0')}`;
        });
    }, 1000);

    // Clean up interval when navigating away
    document.addEventListener('warbands-unload', () => _clearWbTimer(), { once: true });
    // Patch: Router clears on next navigation by emitting via a MutationObserver on content-area
    const contentArea = document.getElementById('content-area');
    if (contentArea) {
        const mo = new MutationObserver(() => { _clearWbTimer(); mo.disconnect(); });
        mo.observe(contentArea, { childList: true });
    }

    // SVG tile click — update selected tile and refresh detail panel only
    const svg = container.querySelector('#wb-map-svg');
    if (svg) {
        svg.addEventListener('click', e => {
            const el = e.target.closest('[data-tile-id]');
            if (!el) return;
            const tile = WarbandSystem.getTile(player, el.dataset.tileId);
            if (!tile?.unlocked) return;
            _wbSelectedTile = el.dataset.tileId;
            // Refresh only the detail panel + SVG highlight (full reload to update selection stroke)
            Router._load('warbands');
        });
    }

    // Rift quest start buttons
    container.querySelectorAll('[data-rift-quest]').forEach(btn => {
        btn.addEventListener('click', () => {
            WarbandSystem.startRiftQuest(player, btn.dataset.riftQuest);
            Router._load('warbands');
        });
    });

    // Faction support button
    const fsBtn = container.querySelector('#wb-faction-support-btn');
    if (fsBtn) {
        fsBtn.addEventListener('click', () => {
            WarbandSystem.requestFactionSupport(player);
            Router._load('warbands');
        });
    }

    // Tile action buttons (deploy, fortify, stabilize)
    container.querySelectorAll('[data-tile-action]').forEach(btn => {
        btn.addEventListener('click', () => {
            const { tileAction, tileId } = btn.dataset;
            if (tileAction === 'troops')    WarbandSystem.deployTroops(player, tileId);
            if (tileAction === 'fortify')   WarbandSystem.fortifyTile(player, tileId);
            if (tileAction === 'stabilize') WarbandSystem.stabilizeRift(player, tileId);
            Router._load('warbands');
        });
    });
}
