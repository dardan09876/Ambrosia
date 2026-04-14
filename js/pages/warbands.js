// js/pages/warbands.js
// Warbands page — three-faction RTS warfront.
// Demons hold the corrupted center. Factions push inward from the outer ring.

let _wbSelectedTile     = null;
let _wbTimerInterval    = null;
let _wbPendingOrder     = null;

function _clearWbTimer() {
    if (_wbTimerInterval) { clearInterval(_wbTimerInterval); _wbTimerInterval = null; }
}

Router.register('warbands', function renderWarbands(container) {
    const player = PlayerSystem.current;
    if (!player) return;

    WarbandSystem._ensureCampaign(player);

    const ws = player.warbandStats || {};
    const gs = ws.gameState ?? 'idle';

    // ── Idle: campaign start screen ───────────────────────────────────────────
    if (gs === 'idle') {
        container.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <h1 class="page-title">Warbands</h1>
                    <p class="page-subtitle">Three factions push through corrupted land toward the Heart of Valdros.</p>
                </div>
                ${_renderIdleScreen()}
            </div>
        `;
        _bindWarbandEvents(container, player);
        return;
    }

    // ── Ended: results screen ─────────────────────────────────────────────────
    if (gs === 'ended') {
        container.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <h1 class="page-title">Warbands</h1>
                    <p class="page-subtitle">Campaign concluded.</p>
                </div>
                ${_renderEndedScreen(player)}
            </div>
        `;
        _bindWarbandEvents(container, player);
        return;
    }

    // ── Countdown / Active: full war layout ───────────────────────────────────
    const terr    = WarbandSystem.getTerritoryStats(player);
    const phase   = WarbandSystem.getPhase(player);
    const intents = WarbandSystem.getAIIntents(player);

    container.innerHTML = `
        <div class="page">
            <div class="page-header">
                <h1 class="page-title">Warbands</h1>
                <p class="page-subtitle">Three factions carve through corrupted land toward the Heart of Valdros. Push inward. Don't overextend.</p>
            </div>

            ${_renderFactionStatusBar(player, terr, phase, intents)}

            <div class="warbands-layout">
                <div class="warbands-main">

                    <div class="card warbands-map-card">
                        <div class="card-header">
                            War Map — Capital Ruins
                            <span class="wb-influence-badge">
                                ⚡ <span id="wb-cmd-val">${Math.floor(ws.command ?? 0)}</span>/<span>${ws.commandCap ?? 300}</span>
                                <span id="wb-cmd-rate" class="wb-cmd-rate">${ws._lastTurnCommandGain != null ? `+${ws._lastTurnCommandGain}/turn` : ''}</span>
                                &nbsp;·&nbsp; ⚑ <span id="wb-inf-val">${player.warbandInfluence || 0}</span> Inf
                                <span class="wb-cmd-rate">${ws._lastTurnInfluenceGain != null ? `+${ws._lastTurnInfluenceGain}/turn` : ''}</span>
                                &nbsp;·&nbsp; ${terr.player}/${terr.total} tiles
                            </span>
                            <span class="wb-game-timer" style="color:#4a9e6b">Turn ${ws.turn ?? 0} / ${ws.turnLimit ?? 60}</span>
                            ${gs === 'active' ? `<button class="btn btn-sm btn-primary" id="wb-end-turn" style="margin-left:4px;font-size:11px;padding:2px 8px">End Turn</button>` : ''}
                            <button class="btn btn-sm btn-secondary" id="wb-end-campaign" style="margin-left:4px;font-size:11px;padding:2px 8px">End Campaign</button>
                        </div>
                        <div class="card-body" style="position:relative">
                            ${gs === 'countdown' ? _renderCountdownOverlay(player) : ''}
                            ${_renderWarMap(player)}
                        </div>
                    </div>

                    <div class="card wb-tile-detail" id="wb-tile-detail">
                        ${_renderTileDetail(player, _wbSelectedTile)}
                    </div>

                    <div class="wb-action-row">
                        <div class="card" style="flex:1">
                            <div class="card-header">Strategic Orders</div>
                            <div class="card-body">${_renderStrategicOrders(player)}</div>
                        </div>
                        <div class="card" style="flex:1">
                            <div class="card-header">Tactical Abilities</div>
                            <div class="card-body">${_renderTacticalAbilities(player)}</div>
                        </div>
                    </div>

                </div>

                <div class="warbands-sidebar">

                    <div class="card">
                        <div class="card-header">War Log</div>
                        <div class="card-body" style="padding:0">${_renderWarLog(player)}</div>
                    </div>

                    <div class="card">
                        <div class="card-header">Faction Support</div>
                        <div class="card-body">${_renderFactionSupport(player)}</div>
                    </div>

                    <div class="card">
                        <div class="card-header">Active Bonuses</div>
                        <div class="card-body">${_renderActiveBonuses(player)}</div>
                    </div>

                    <div class="card">
                        <div class="card-header">Campaign</div>
                        <div class="card-body">${_renderCampaignStats(player)}</div>
                    </div>

                </div>
            </div>
        </div>
    `;

    _bindWarbandEvents(container, player);
});

// ── Faction Status Bar ────────────────────────────────────────────────────────

function _renderFactionStatusBar(player, terr, phase, intents) {
    const total = terr.total || 1;
    const pPct  = Math.round((terr.player     / total) * 100);
    const iPct  = Math.round((terr.ally_iron  / total) * 100);
    const aPct  = Math.round((terr.ally_ashen / total) * 100);
    const ePct  = Math.round((terr.enemy      / total) * 100);
    const cPct  = Math.max(0, 100 - pPct - iPct - aPct - ePct);

    const ws          = player.warbandStats || {};
    const activeOrder = WarbandSystem.getActiveOrder(player);
    const orderDef    = activeOrder ? getStrategicOrder(activeOrder.orderId) : null;
    const orderRem    = activeOrder ? Math.max(0, (activeOrder.expiresTurn ?? 0) - (ws.turn ?? 0)) : 0;

    const phaseColors = { 1: '#4a9e6b', 2: '#c9a84c', 3: '#c04040' };
    const phaseColor  = phaseColors[phase?.id] || '#aaa';

    return `
        <div class="wb-status-banner">
            <!-- Phase indicator -->
            <div class="wb-phase-pill" style="border-color:${phaseColor};color:${phaseColor}">
                Phase ${phase?.id ?? 1}: ${phase?.label ?? 'Frontier War'}
                <span class="wb-phase-desc">${phase?.desc ?? ''}</span>
            </div>

            <!-- Active order badge -->
            ${activeOrder ? `<div class="wb-active-order-badge">
                ${orderDef?.icon} ${orderDef?.name} — <span>${orderRem}t</span> left
            </div>` : ''}

            <!-- Iron Shields badge -->
            ${ws.globalFortBoost && (ws.turn ?? 0) < ws.globalFortBoost.expiresTurn
                ? `<div class="wb-active-order-badge" style="color:#7ab0f0;border-color:rgba(74,126,192,0.4)">🛡 Iron Shields — ${Math.max(0, ws.globalFortBoost.expiresTurn - (ws.turn ?? 0))}t left</div>` : ''}

            <!-- Faction badges row -->
            <div class="wb-faction-badges">
                <div class="wb-faction-badge wb-faction-player">
                    <span>⚑</span><span class="wb-fb-name">You</span><strong>${terr.player}</strong>
                </div>
                <div class="wb-faction-badge wb-faction-iron">
                    <span>⚔</span><span class="wb-fb-name">Iron Dominion</span><strong>${terr.ally_iron}</strong>
                    ${intents.iron_dominion ? `<span class="wb-intent">${intents.iron_dominion}</span>` : ''}
                </div>
                <div class="wb-faction-badge wb-faction-ashen">
                    <span>🔮</span><span class="wb-fb-name">Ashen Covenant</span><strong>${terr.ally_ashen}</strong>
                    ${intents.ashen_covenant ? `<span class="wb-intent">${intents.ashen_covenant}</span>` : ''}
                </div>
                <div class="wb-faction-badge wb-faction-enemy">
                    <span>☠</span><span class="wb-fb-name">Void Horde</span><strong>${terr.enemy}</strong>
                    ${intents.void_horde ? `<span class="wb-intent">${intents.void_horde}</span>` : ''}
                </div>
            </div>

            <!-- Territory bar -->
            <div class="wb-territory-bar">
                <div style="width:${pPct}%;background:#4a9e6b" title="You: ${terr.player}"></div>
                <div style="width:${iPct}%;background:#4a7ec0" title="Iron Dominion: ${terr.ally_iron}"></div>
                <div style="width:${aPct}%;background:#8b4ac0" title="Ashen Covenant: ${terr.ally_ashen}"></div>
                <div style="width:${cPct}%;background:#4a4a3a" title="Contested: ${terr.contested}"></div>
                <div style="width:${ePct}%;background:#7a1a1a" title="Void Horde: ${terr.enemy}"></div>
            </div>
        </div>
    `;
}

// ── Idle screen ───────────────────────────────────────────────────────────────

function _renderIdleScreen() {
    return `
        <div class="wb-idle-screen">
            <div class="wb-idle-icon">⚑</div>
            <h2 class="wb-idle-title">Campaign Ready</h2>
            <p class="wb-idle-desc">
                Iron Dominion, Ashen Covenant, and your forces each start in a corner of corrupted land.
                Demons hold 65% of the map. Push through chokepoints, coordinate with allies, and
                capture the <strong>Heart of Valdros</strong> before time runs out.
            </p>
            <p class="wb-idle-note">Each run gets a randomized <strong>Map Modifier</strong> that changes terrain and demon behavior.</p>
            <button class="btn btn-primary wb-start-btn" id="wb-start-campaign">▶ Start Campaign</button>
        </div>
    `;
}

// ── Countdown overlay (shown over map during 15s countdown) ───────────────────

function _renderCountdownOverlay(player) {
    const ws  = player.warbandStats || {};
    const rem = Math.max(0, Math.ceil(((ws.countdownEndsAt || 0) - Date.now()) / 1000));
    return `
        <div class="wb-countdown-overlay">
            <div class="wb-countdown-box">
                <div class="wb-countdown-num" id="wb-countdown-num" data-ends-at="${ws.countdownEndsAt || 0}">${rem}</div>
                <div class="wb-countdown-label">Campaign begins in...</div>
                <button class="btn btn-sm btn-secondary" id="wb-cancel-countdown" style="margin-top:12px">Cancel</button>
            </div>
        </div>
    `;
}

// ── Ended screen ──────────────────────────────────────────────────────────────

function _renderEndedScreen(player) {
    const ws     = player.warbandStats || {};
    const result = ws.gameResult || {};
    const terr   = WarbandSystem.getTerritoryStats(player);
    const phase  = WarbandSystem.getPhase(player);
    const modDef = ws.mapModifier ? getMapModifier(ws.mapModifier) : null;
    const win    = !!result.win;
    const phaseColor = phase?.id === 3 ? '#c04040' : phase?.id === 2 ? '#c9a84c' : '#4a9e6b';
    return `
        <div class="wb-ended-screen">
            <div class="wb-ended-icon">${win ? '⚑' : '☠'}</div>
            <h2 class="wb-ended-title ${win ? 'wb-ended-win' : 'wb-ended-loss'}">${win ? 'Victory!' : 'Defeat'}</h2>
            <p class="wb-ended-reason">${win
                ? (result.winReason || 'The Heart of Valdros has fallen to your forces!')
                : (result.winReason || 'All turns spent. The Heart of Valdros still stands.')
            }</p>

            <div class="wb-ended-stats">
                <div class="wb-stat-row"><span>Your tiles at end</span><span style="color:#4a9e6b">${terr.player}</span></div>
                <div class="wb-stat-row"><span>Iron Dominion</span><span style="color:#4a7ec0">${terr.ally_iron}</span></div>
                <div class="wb-stat-row"><span>Ashen Covenant</span><span style="color:#b47ae0">${terr.ally_ashen}</span></div>
                <div class="wb-stat-row"><span>Void Horde</span><span style="color:#c04040">${terr.enemy}</span></div>
                <div class="wb-stat-row"><span>Influence earned this run</span><span style="color:#b47ae0">${ws.totalInfluenceEarned || 0}</span></div>
                <div class="wb-stat-row"><span>Total Influence (persistent)</span><span style="color:#b47ae0">${player.warbandInfluence || 0}</span></div>
                <div class="wb-stat-row"><span>Phase reached</span><span style="color:${phaseColor}">${phase?.label || '—'}</span></div>
                ${modDef ? `<div class="wb-stat-row"><span>Map modifier</span><span style="color:var(--gold)">${modDef.icon} ${modDef.name}</span></div>` : ''}
            </div>

            <button class="btn btn-primary wb-start-btn" id="wb-new-campaign">▶ Play Again</button>
        </div>
    `;
}

// ── SVG War Map ───────────────────────────────────────────────────────────────

function _renderWarMap(player) {
    const tiles = WarbandSystem.getMap(player);
    const CELL  = 36, GAP = 3, COLS = 13, ROWS = 10;
    const W     = COLS * (CELL + GAP) + GAP;   // 510
    const H     = ROWS * (CELL + GAP) + GAP;   // 393
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
            const x1 = GAP + t.x*(CELL+GAP) + CELL/2,   y1 = GAP + t.y*(CELL+GAP) + CELL/2;
            const x2 = GAP + adj.x*(CELL+GAP) + CELL/2, y2 = GAP + adj.y*(CELL+GAP) + CELL/2;
            lines.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#2e2e2e" stroke-width="1" stroke-dasharray="3,2"/>`);
        }
    }

    const activeOrder = WarbandSystem.getActiveOrder(player);

    // Lane background tint colors (subtle overlay to show which faction lane a tile belongs to)
    const laneTint = { iron: 'rgba(74,126,192,0.14)', ashen: 'rgba(139,74,192,0.14)', player: 'rgba(74,158,107,0.10)' };

    const rects = tiles.map(t => {
        const typeDef  = WARBAND_TILE_TYPES[t.type] || {};
        const state    = t.unlocked ? WarbandSystem.controlState(t) : 'locked';
        const colors   = typeDef.color || {};
        const fill     = colors[state] || colors.enemy || '#1a1a1a';
        const opacity  = t.unlocked ? 1 : 0.30;
        const x        = GAP + t.x * (CELL + GAP);
        const y        = GAP + t.y * (CELL + GAP);
        const cx       = x + CELL / 2, cy = y + CELL / 2;
        const isSelected    = _wbSelectedTile === t.id;
        const isFocusTgt    = activeOrder?.targetTileId === t.id;
        const isHeart       = t.type === 'heart';
        const isStrongpoint = t.isStrongpoint && state === 'enemy';

        // Strength bar
        let barColor = state === 'player'     ? '#4a9e6b'
                     : state === 'ally_iron'  ? '#4a7ec0'
                     : state === 'ally_ashen' ? '#8b4ac0'
                     : state === 'contested'  ? '#c9a84c' : '#c04040';
        let pct;
        if (state === 'ally_iron' || state === 'ally_ashen') {
            pct = t.allyStrength || 0;
        } else if (state === 'enemy') {
            pct = t.demonStrength || 0;
        } else {
            pct = Math.round(((t.controlScore - WARBAND_CONTROL.enemyFull) / 200) * 100);
        }
        const barW = Math.round((CELL - 6) * Math.max(0, Math.min(100, pct)) / 100);

        // Tier dots (top-left)
        const tierColors = { outer: '#444', mid: '#665', inner: '#844', center: '#b33' };
        const tierColor  = tierColors[t.tier] || '#444';
        const tierDots   = t.tier === 'center' ? 3 : t.tier === 'inner' ? 2 : t.tier === 'mid' ? 1 : 0;
        const tierDotSvg = Array.from({ length: tierDots }, (_, i) =>
            `<circle cx="${x+3+i*5}" cy="${y+5}" r="2" fill="${tierColor}" opacity="${opacity * 0.85}"/>`
        ).join('');

        // Demon zone icon (enemy tiles only, top-right)
        const zd       = t.demonZone ? getDemonZone(t.demonZone) : null;
        const zoneIcon = (state === 'enemy' && zd)
            ? `<text x="${x+CELL-4}" y="${y+9}" font-size="8" text-anchor="end" opacity="${opacity * 0.65}">${zd.icon}</text>`
            : '';

        // Status text (troops / fort, bottom-left, small)
        const tTroops = t.troopCount ?? 0;
        const tFort   = t.fortLevel  ?? 0;
        const parts   = [];
        if (tFort   > 0) parts.push(`F${tFort}`);
        if (t.stabilized) parts.push('S');
        if (tTroops > 0) parts.push(`T${tTroops}`);
        const iconStr = parts.length > 0
            ? `<text x="${x+2}" y="${y+CELL-4}" font-size="7" fill="#aaa" opacity="${opacity}">${parts.join(' ')}</text>`
            : '';

        // Battle intensity ring
        const intensity = t.battleIntensity || 0;
        const pulseRing = intensity > 0
            ? `<rect x="${x-1}" y="${y-1}" width="${CELL+2}" height="${CELL+2}" fill="none" rx="5"
                     stroke="${intensity >= 3 ? '#ff3333' : intensity >= 2 ? '#ff6622' : '#cc5511'}"
                     stroke-width="${intensity >= 3 ? 2 : 1.5}" opacity="0.65"/>`
            : '';

        // Strongpoint border
        const spGlow = isStrongpoint
            ? `<rect x="${x-2}" y="${y-2}" width="${CELL+4}" height="${CELL+4}" fill="none" rx="6"
                     stroke="#bb2222" stroke-width="1.5" opacity="0.5" stroke-dasharray="3,2"/>`
            : '';

        // Heart glow
        const heartGlow = isHeart
            ? `<rect x="${x-3}" y="${y-3}" width="${CELL+6}" height="${CELL+6}" fill="none" rx="7"
                     stroke="#cc33cc" stroke-width="2" opacity="0.5"/>`
            : '';

        // Chokepoint diamond marker (center overlay)
        const cpMark = t.isChokepoint
            ? `<rect x="${cx-4}" y="${cy-4}" width="8" height="8" fill="none" rx="1"
                     stroke="#c9a84c" stroke-width="1" opacity="0.65"
                     transform="rotate(45,${cx},${cy})"/>`
            : '';

        // Lane tint background
        const lTint  = t.lane ? laneTint[t.lane] : null;
        const laneRect = (lTint && state !== 'locked')
            ? `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" fill="${lTint}" rx="4"/>`
            : '';

        const strokeColor = isSelected   ? '#c9a84c'
                          : isFocusTgt   ? '#ff9922'
                          : state === 'player'     ? '#4a9e6b'
                          : state === 'ally_iron'  ? '#4a7ec0'
                          : state === 'ally_ashen' ? '#8b4ac0'
                          : state === 'contested'  ? '#8a7a3a' : '#252525';
        const strokeW = isSelected || isFocusTgt ? 2 : 1;

        return `
            <g data-tile-id="${t.id}" class="wb-tile" style="cursor:${t.unlocked ? 'pointer' : 'default'}">
                ${heartGlow}${spGlow}${pulseRing}
                <rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" fill="${fill}" rx="4"
                      opacity="${opacity}" stroke="${strokeColor}" stroke-width="${strokeW}"/>
                ${laneRect}
                <text x="${cx}" y="${cy+1}" text-anchor="middle" dominant-baseline="middle"
                      font-size="14" opacity="${opacity}">${typeDef.icon || '?'}</text>
                ${tierDotSvg}${zoneIcon}${cpMark}
                <rect x="${x+3}" y="${y+CELL-5}" width="${CELL-6}" height="3" fill="#111" rx="1"/>
                <rect x="${x+3}" y="${y+CELL-5}" width="${Math.max(0,barW)}" height="3" fill="${barColor}" rx="1" opacity="${opacity}"/>
                ${iconStr}
            </g>
        `;
    }).join('');

    // Map modifier badge
    const ws      = player.warbandStats || {};
    const modDef  = ws.mapModifier ? getMapModifier(ws.mapModifier) : null;
    const modBadge = modDef
        ? `<div class="wb-modifier-badge">${modDef.icon} <strong>${modDef.name}</strong> — ${modDef.description}</div>`
        : '';

    const orderHint = _wbPendingOrder
        ? `<div class="wb-order-target-hint">🎯 Click an enemy tile for <strong>${getStrategicOrder(_wbPendingOrder)?.name}</strong> — or <a href="#" id="wb-cancel-order-target">cancel</a></div>`
        : '';

    const legend = `
        <div class="wb-map-legend">
            <span class="wb-legend-item"><span class="wb-legend-dot" style="background:#4a9e6b"></span>Player</span>
            <span class="wb-legend-item"><span class="wb-legend-dot" style="background:#4a7ec0"></span>Iron</span>
            <span class="wb-legend-item"><span class="wb-legend-dot" style="background:#8b4ac0"></span>Ashen</span>
            <span class="wb-legend-item"><span class="wb-legend-dot" style="background:#7a1a1a"></span>Demons</span>
            <span class="wb-legend-item"><span style="color:#c9a84c">◆</span> Chokepoint</span>
            <span class="wb-legend-item">● dots = tier (0–3)</span>
            <span class="wb-legend-item">F/T/S = fort/troops/stab</span>
            <span class="wb-legend-item">♦ = victory tile</span>
        </div>
    `;

    return `
        ${modBadge}${orderHint}
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
    const tile = WarbandSystem.getTile(player, tileId);
    if (!tile) return `<div class="card-header">Tile Detail</div><div class="card-body muted-text">Not found.</div>`;

    const typeDef    = WARBAND_TILE_TYPES[tile.type] || {};
    const state      = WarbandSystem.controlState(tile);
    const stateLabel = { player:'Player Controlled', contested:'Contested', enemy:'Enemy Controlled',
                         ally_iron:'⚔ Iron Dominion', ally_ashen:'🔮 Ashen Covenant' }[state] || state;
    const stateColor = { player:'#4a9e6b', contested:'#c9a84c', enemy:'#c04040',
                         ally_iron:'#4a7ec0', ally_ashen:'#b47ae0' }[state] || '#aaa';
    const scorePct   = Math.round(((tile.controlScore - WARBAND_CONTROL.enemyFull) / 200) * 100);
    const tierDef    = getTierDef(tile.tier);
    const zd         = tile.demonZone ? getDemonZone(tile.demonZone) : null;
    const support    = WarbandSystem.getActiveFactionSupport(player);
    const cmd        = Math.floor(player.warbandStats?.command ?? 0);

    let fortifyCost = WARBAND_COSTS.fortify;
    let stabCost    = WARBAND_COSTS.stabilizeRift;
    if (support?.effects?.fortifyCostMod)   fortifyCost = Math.ceil(fortifyCost * support.effects.fortifyCostMod);
    if (support?.effects?.stabilizeCostMod) stabCost    = Math.ceil(stabCost    * support.effects.stabilizeCostMod);
    const troopCost = WARBAND_COSTS.deployTroops;

    const tierBadge = `<span class="wb-tier-badge wb-tier-${tile.tier}">${tierDef.label}</span>`;
    const zoneBadge = zd ? `<span class="wb-zone-badge">${zd.icon} ${zd.label}</span>` : '';
    const spBadge   = tile.isStrongpoint ? `<span class="wb-sp-badge">⬡ Strongpoint</span>` : '';
    const cpBadge   = tile.isChokepoint  ? `<span class="wb-cp-badge">◆ Chokepoint</span>`  : '';
    const laneLabels = { iron: '⚔ Iron Lane', ashen: '🔮 Ashen Lane', player: '⚑ Player Lane' };
    const laneBadge  = tile.lane ? `<span class="wb-lane-badge">${laneLabels[tile.lane] || tile.lane}</span>` : '';

    const heartNote = tile.type === 'heart'
        ? `<div class="wb-heart-note">♦ Victory tile — capture this to win the warfront.</div>` : '';

    const allyInfo = (state === 'ally_iron' || state === 'ally_ashen')
        ? `<div class="wb-detail-row"><span>Ally Strength</span><span style="color:${stateColor}">${tile.allyStrength || 0}/100</span></div>
           <div class="stat-bar-track" style="margin:4px 0 10px">
               <div class="wb-control-bar-fill" style="width:${tile.allyStrength||0}%;background:${stateColor}"></div>
           </div>`
        : '';

    const demonInfo = state === 'enemy'
        ? `<div class="wb-detail-row"><span>Demon Strength</span><span style="color:#c04040">${tile.demonStrength || 0}/100</span></div>
           <div class="stat-bar-track" style="margin:2px 0 8px">
               <div class="wb-control-bar-fill" style="width:${tile.demonStrength||0}%;background:#8b1a1a"></div>
           </div>
           ${zd ? `<p class="muted-text" style="font-size:11px;margin-bottom:8px">${zd.description}</p>` : ''}`
        : '';

    let actions = '';
    if (!tile.unlocked) {
        actions = `<p class="muted-text" style="font-size:12px;margin-top:8px">Locked — control an adjacent tile first.</p>`;
    } else if (state === 'ally_iron' || state === 'ally_ashen') {
        actions = `<p class="muted-text" style="font-size:12px;margin-top:8px">Allied territory. Issue strategic orders to support their push.</p>`;
    } else {
        const troopCount = tile.troopCount ?? 0;
        const fortLevel  = tile.fortLevel  ?? (tile.fortified ? 1 : 0);
        const MAX_T = 3, MAX_F = 2;
        const btnClass = (cost, ok) => `btn btn-sm ${(cmd >= cost && ok) ? 'btn-primary' : 'btn-disabled'}`;
        const fortReductionLabel = fortLevel === 0 ? '−50% pressure'
                                 : fortLevel === 1 ? '−75% pressure (max next)'
                                 : '−75% pressure (max)';
        const stabAvail = tile.type === 'rift' && !tile.stabilized;

        actions = `
            <div class="wb-tile-actions">
                <button class="${btnClass(troopCost, troopCount < MAX_T)}"
                    ${troopCount < MAX_T && cmd >= troopCost ? `data-tile-action="troops" data-tile-id="${tileId}"` : 'disabled'}
                    title="Deploy troops — +20 ctrl, +4/tick gain, −15% pressure (max 3)">
                    ⚔ Troops ${troopCount}/${MAX_T} <span class="wb-cost">${troopCost} Cmd</span>
                </button>
                <button class="${btnClass(fortifyCost, fortLevel < MAX_F)}"
                    ${fortLevel < MAX_F && cmd >= fortifyCost ? `data-tile-action="fortify" data-tile-id="${tileId}"` : 'disabled'}
                    title="Fortify — reduces enemy pressure (max 2)">
                    🛡 Fortify ${fortLevel}/${MAX_F} <span class="wb-cost">${fortifyCost} Cmd</span>
                </button>
                ${stabAvail ? `<button class="${btnClass(stabCost, true)}"
                    ${cmd >= stabCost ? `data-tile-action="stabilize" data-tile-id="${tileId}"` : 'disabled'}>
                    ✦ Stabilize <span class="wb-cost">${stabCost} Cmd</span>
                </button>` : ''}
            </div>
            ${troopCount > 0 ? `<p class="muted-text" style="font-size:11px;margin-top:4px">⚔ ${troopCount} stack${troopCount>1?'s':''} — +${troopCount*4}/tick, −${troopCount*15}% pressure.</p>` : ''}
            ${fortLevel  > 0 ? `<p class="muted-text" style="font-size:11px;margin-top:2px">🛡 Lv${fortLevel} — ${fortReductionLabel}.</p>` : ''}
            ${tile.stabilized ? `<p class="muted-text" style="font-size:11px;margin-top:2px">✦ Stabilized — no demon spawns.</p>` : ''}
        `;
    }

    return `
        <div class="card-header">
            ${typeDef.icon || ''} ${typeDef.label || tile.type}
            <span style="color:${stateColor};font-size:12px;font-weight:400;margin-left:8px">${stateLabel}</span>
        </div>
        <div class="card-body">
            <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px">${tierBadge}${zoneBadge}${spBadge}${cpBadge}${laneBadge}</div>
            <p style="font-size:12px;color:#aaa;margin-bottom:6px">${typeDef.description || ''}</p>
            ${heartNote}
            ${allyInfo}
            ${demonInfo}
            ${state !== 'ally_iron' && state !== 'ally_ashen' ? `
            <div class="wb-detail-row"><span>Difficulty</span><span>${'◆'.repeat(tile.difficulty)}</span></div>
            <div class="wb-detail-row"><span>Control</span><span style="color:${stateColor}">${tile.controlScore > 0 ? '+' : ''}${tile.controlScore}</span></div>
            ${typeDef.bonusLabel ? `<div class="wb-detail-row"><span>Bonus</span><span style="color:var(--gold)">${typeDef.bonusLabel}</span></div>` : ''}
            <div class="wb-control-bar-wrap" style="margin:8px 0 4px">
                <div class="stat-bar-track">
                    <div class="wb-control-bar-fill" style="width:${scorePct}%;background:${stateColor}"></div>
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:10px;color:#555;margin-bottom:10px">
                <span>Demon</span><span>Contested</span><span>Player</span>
            </div>
            ` : ''}
            ${actions}
        </div>
    `;
}

// ── Strategic Orders ──────────────────────────────────────────────────────────

function _renderStrategicOrders(player) {
    const cmd         = Math.floor(player.warbandStats?.command ?? 0);
    const activeOrder = WarbandSystem.getActiveOrder(player);

    if (activeOrder) {
        const def      = getStrategicOrder(activeOrder.orderId);
        const remTurns = Math.max(0, (activeOrder.expiresTurn ?? 0) - (player.warbandStats?.turn ?? 0));
        const target   = activeOrder.targetTileId
            ? (WARBAND_TILE_TYPES[WarbandSystem.getTile(player, activeOrder.targetTileId)?.type]?.label ?? '...')
            : null;
        return `
            <div class="wb-order-active-panel">
                <div style="font-size:22px">${def?.icon}</div>
                <div style="font-weight:600;color:#c9a84c">${def?.name}</div>
                ${target ? `<div class="muted-text" style="font-size:11px">→ ${target}</div>` : ''}
                <div class="muted-text" style="font-size:11px">${remTurns} turn${remTurns !== 1 ? 's' : ''} remaining</div>
            </div>
            <div class="wb-orders-grid" style="opacity:0.4;pointer-events:none">
                ${_orderButtons(player, cmd, activeOrder)}
            </div>
        `;
    }

    return `
        <p class="muted-text" style="font-size:11px;margin-bottom:10px">Issue a global command. One active at a time.</p>
        <div class="wb-orders-grid">${_orderButtons(player, cmd, null)}</div>
    `;
}

function _orderButtons(player, cmd, activeOrder) {
    return WARBAND_STRATEGIC_ORDERS.map(def => {
        const cdTurns = WarbandSystem.getOrderCooldownRemaining(player, def.id);
        const ok      = !activeOrder && cdTurns === 0 && cmd >= (def.cost || 0);
        const hint    = cdTurns > 0           ? `${cdTurns}t cooldown`
                      : def.cost && cmd < def.cost ? `${def.cost} Cmd needed`
                      : def.cost               ? `${def.cost} Cmd`
                      : def.requiresTarget     ? 'select target' : 'ready';
        return `
            <button class="wb-order-btn ${ok ? '' : 'wb-btn-dim'}"
                ${ok ? `data-order-id="${def.id}"` : 'disabled'} title="${def.description}">
                <span class="wb-order-icon">${def.icon}</span>
                <span class="wb-order-name">${def.name}</span>
                <span class="wb-order-meta">${hint}</span>
            </button>
        `;
    }).join('');
}

// ── Tactical Abilities ────────────────────────────────────────────────────────

function _renderTacticalAbilities(player) {
    const cmd          = Math.floor(player.warbandStats?.command ?? 0);
    const selectedTile = _wbSelectedTile ? WarbandSystem.getTile(player, _wbSelectedTile) : null;
    const tileState    = selectedTile ? WarbandSystem.controlState(selectedTile) : null;

    const rows = WARBAND_TACTICAL_ABILITIES.map(def => {
        const cdTurns  = WarbandSystem.getAbilityCooldownRemaining(player, def.id);
        const hasCost  = def.cost > 0;
        const affdCost = !hasCost || cmd >= def.cost;
        let targetable = true, targetHint = '';
        if (def.targetState && def.targetState !== 'any') {
            if (!selectedTile) { targetable = false; targetHint = 'select a tile'; }
            else if (def.targetState === 'enemy' && tileState !== 'enemy' && tileState !== 'contested')
                { targetable = false; targetHint = 'needs enemy tile'; }
        }
        const ok     = cdTurns === 0 && affdCost && targetable;
        const status = cdTurns > 0    ? `${cdTurns}t cd`
                     : !affdCost      ? `${def.cost} Cmd needed`
                     : !targetable    ? targetHint
                     : def.cost > 0   ? `${def.cost} Cmd` : 'ready';

        const targetLabel = def.targetState && selectedTile
            ? ` → ${WARBAND_TILE_TYPES[selectedTile.type]?.label ?? selectedTile.type}`
            : (def.targetState === null ? ' (global)' : '');

        return `
            <div class="wb-ability-row ${ok ? '' : 'wb-ability-dim'}">
                <div class="wb-ability-icon">${def.icon}</div>
                <div class="wb-ability-info">
                    <div class="wb-ability-name">${def.name}${targetLabel}</div>
                    <div class="wb-ability-desc">${def.description}</div>
                </div>
                <button class="btn btn-sm ${ok ? 'btn-primary' : 'btn-disabled'}"
                    ${ok ? `data-ability-id="${def.id}" data-ability-tile="${_wbSelectedTile || ''}"` : 'disabled'}>
                    ${status}
                </button>
            </div>
        `;
    }).join('');

    return `
        <p class="muted-text" style="font-size:11px;margin-bottom:10px">Select a tile first, then activate. Some are global.</p>
        <div class="wb-abilities-list">${rows}</div>
    `;
}

// ── War Log ───────────────────────────────────────────────────────────────────

function _renderWarLog(player) {
    const log = WarbandSystem.getWarLog(player);
    if (log.length === 0) {
        return `<div class="wb-war-log"><div class="wb-log-empty">The warfront is quiet...</div></div>`;
    }

    const colors = { success:'#4a9e6b', warning:'#c9a84c', danger:'#c04040', ally:'#7ab0f0', info:'#aaa' };
    const entries = log.slice(0, 20).map(e => {
        const color = colors[e.type] || '#aaa';
        const ageMs = Date.now() - (e.ts || 0);
        const age   = ageMs < 60000 ? `${Math.floor(ageMs/1000)}s` : `${Math.floor(ageMs/60000)}m`;
        return `<div class="wb-log-entry">
            <span class="wb-log-text" style="color:${color}">${e.msg}</span>
            <span class="wb-log-age">${age}</span>
        </div>`;
    }).join('');

    return `<div class="wb-war-log">${entries}</div>`;
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
            const m = Math.floor(rem/60000), s = Math.ceil((rem%60000)/1000);
            action = `<span class="wb-quest-timer" data-ends-at="${active.endsAt}">⏳ ${m}:${String(s).padStart(2,'0')}</span>`;
        } else if (cdMs > 0) {
            const cdExpires = Date.now() + cdMs;
            const cdSec = Math.ceil(cdMs/1000);
            const cdM = Math.floor(cdSec/60), cdS = cdSec%60;
            action = `<span class="muted-text wb-cd-timer" data-cd-expires="${cdExpires}" style="font-size:11px">Cooldown ${cdM}:${String(cdS).padStart(2,'0')}</span>`;
        } else {
            action = `<button class="btn btn-sm ${check.ok?'btn-primary':'btn-disabled'}"
                ${check.ok?`data-rift-quest="${quest.id}"`:`disabled title="${check.reason}"`}>Start</button>`;
        }
        const typeDef = WARBAND_TILE_TYPES[quest.tileType] || {};
        return `
            <div class="wb-quest-card">
                <div class="wb-quest-header">
                    <span class="wb-quest-name">${quest.name}</span>
                    <span class="wb-quest-type">${typeDef.icon||''} ${typeDef.label||quest.tileType}</span>
                </div>
                <p class="wb-quest-desc">${quest.description}</p>
                <div class="wb-quest-footer">
                    <span class="wb-quest-reward">+${influence} inf · ${quest.goldReward.min}–${quest.goldReward.max}g</span>
                    ${action}
                </div>
            </div>
        `;
    }).join('');
}

// ── Faction Support ───────────────────────────────────────────────────────────

function _renderFactionSupport(player) {
    const support = WarbandSystem.getActiveFactionSupport(player);
    const ws      = player.warbandStats || {};
    const cost    = WARBAND_COSTS.factionSupport;
    const inf     = player.warbandInfluence || 0;

    if (support) {
        const remTurns = Math.max(0, (ws.factionSupportExpiresTurn ?? 0) - (ws.turn ?? 0));
        return `
            <div class="wb-faction-active">
                <span style="font-size:16px">${support.icon}</span>
                <div>
                    <div style="font-weight:600;font-size:13px">${support.name} Support Active</div>
                    <div class="muted-text" style="font-size:11px">${support.supportLabel}</div>
                    <div class="muted-text" style="font-size:11px">${remTurns} turn${remTurns !== 1 ? 's' : ''} remaining</div>
                </div>
            </div>
        `;
    }

    const factionDef = getWarbandFactionSupport(player.faction);
    if (!factionDef)
        return `<p class="muted-text" style="font-size:12px">Your faction has no support available here.</p>`;

    return `
        <div style="margin-bottom:10px">
            <div style="font-weight:600;font-size:13px">${factionDef.icon} ${factionDef.name}</div>
            <div class="muted-text" style="font-size:12px;margin:4px 0">${factionDef.description}</div>
            <div style="font-size:12px;color:var(--gold);margin-bottom:8px">${factionDef.supportLabel}</div>
        </div>
        <button class="btn btn-sm ${inf>=cost?'btn-secondary':'btn-disabled'}" style="width:100%"
            ${inf>=cost?'id="wb-faction-support-btn"':'disabled'}>
            Request Support (${cost} Influence · 8 turns)
        </button>
        ${inf<cost?`<p class="muted-text" style="font-size:11px;margin-top:4px">Need ${cost-inf} more Influence.</p>`:''}
    `;
}

// ── Active Bonuses ────────────────────────────────────────────────────────────

function _renderActiveBonuses(player) {
    const ws          = player.warbandStats || {};
    const playerTiles = WarbandSystem.getMap(player).filter(t => WarbandSystem.controlState(t) === 'player');
    if (playerTiles.length === 0)
        return `<p class="muted-text" style="font-size:12px">Control tiles to gain passive bonuses.</p>`;

    const byType = {};
    for (const t of playerTiles) byType[t.type] = (byType[t.type] || 0) + 1;

    const rows = [];
    if (byType.stronghold) rows.push(`<div class="wb-bonus-row"><span>⛫ Strongholds ×${byType.stronghold}</span><span style="color:#4a9edb">+${byType.stronghold*10} max HP</span></div>`);
    if (byType.rift)       rows.push(`<div class="wb-bonus-row"><span>🌀 Rift Nodes ×${byType.rift}</span><span style="color:#c9a84c">+${byType.rift*15}% delve XP</span></div>`);
    if (byType.supply)     rows.push(`<div class="wb-bonus-row"><span>⊕ Supply ×${byType.supply}</span><span style="color:#4a9e6b">+${byType.supply*10}% quest gold</span></div>`);
    if (byType.pathway)    rows.push(`<div class="wb-bonus-row"><span>◈ Pathways ×${byType.pathway}</span><span style="color:#aaa">Access</span></div>`);
    if (byType.heart)      rows.push(`<div class="wb-bonus-row"><span>♦ Heart of Valdros</span><span style="color:#cc44cc">Victory!</span></div>`);

    const stabs = WarbandSystem.getMap(player).filter(t => t.stabilized).length;
    if (stabs > 0) rows.push(`<div class="wb-bonus-row"><span>✦ Stabilized Rifts ×${stabs}</span><span style="color:#9b6bd4">Spawns suppressed</span></div>`);

    const gfb = ws.globalFortBoost;
    if (gfb && (ws.turn ?? 0) < gfb.expiresTurn) {
        const remT = Math.max(0, gfb.expiresTurn - (ws.turn ?? 0));
        rows.push(`<div class="wb-bonus-row"><span>🛡 Iron Shields</span><span style="color:#7ab0f0">+${gfb.level} fort · ${remT}t</span></div>`);
    }

    return rows.join('') || `<p class="muted-text" style="font-size:12px">No bonuses active.</p>`;
}

// ── Campaign Stats ────────────────────────────────────────────────────────────

function _renderCampaignStats(player) {
    const ws     = player.warbandStats || {};
    const terr   = WarbandSystem.getTerritoryStats(player);
    const phase  = WarbandSystem.getPhase(player);
    const modDef = ws.mapModifier ? getMapModifier(ws.mapModifier) : null;
    return `
        ${modDef ? `<div class="wb-stat-row"><span>Modifier</span><span style="color:var(--gold)">${modDef.icon} ${modDef.name}</span></div>` : ''}
        <div class="wb-stat-row"><span>Turn</span><span style="color:#c9a84c">${ws.turn ?? 0} / ${ws.turnLimit ?? 60}</span></div>
        <div class="wb-stat-row"><span>Phase</span><span style="color:${phase?.id===3?'#c04040':phase?.id===2?'#c9a84c':'#4a9e6b'}">${phase?.label}</span></div>
        <div class="wb-stat-row"><span>Command</span><span style="color:#c9a84c">${Math.floor(ws.command??0)} / ${ws.commandCap??300}</span></div>
        <div class="wb-stat-row"><span>Influence (persistent)</span><span style="color:#b47ae0">${player.warbandInfluence||0}</span></div>
        <div class="wb-stat-row"><span>Total Inf. earned</span><span>${ws.totalInfluenceEarned||0}</span></div>
        <div class="wb-stat-row"><span>Your tiles</span><span style="color:#4a9e6b">${terr.player}</span></div>
        <div class="wb-stat-row"><span>Iron Dom.</span><span style="color:#4a7ec0">${terr.ally_iron}</span></div>
        <div class="wb-stat-row"><span>Ashen Cov.</span><span style="color:#b47ae0">${terr.ally_ashen}</span></div>
        <div class="wb-stat-row"><span>Contested</span><span style="color:#c9a84c">${terr.contested}</span></div>
        <div class="wb-stat-row"><span>Void Horde</span><span style="color:#c04040">${terr.enemy}</span></div>
    `;
}

// ── Event Binding ─────────────────────────────────────────────────────────────

function _bindWarbandEvents(container, player) {
    _clearWbTimer();
    _wbPendingOrder = null;
    _wbTimerInterval = setInterval(() => {
        // Self-clean if the user has navigated away
        if (typeof Router !== 'undefined' && Router._current !== 'warbands') {
            _clearWbTimer(); return;
        }

        // Countdown number (pre-game)
        const cdNum = container.querySelector('#wb-countdown-num');
        if (cdNum) {
            const rem = Math.max(0, Math.ceil((parseInt(cdNum.dataset.endsAt, 10) - Date.now()) / 1000));
            cdNum.textContent = rem;
            if (rem === 0) { _clearWbTimer(); Router._load('warbands'); }
        }
    }, 1000);

    // SVG tile click
    const svg = container.querySelector('#wb-map-svg');
    if (svg) {
        svg.addEventListener('click', e => {
            const el = e.target.closest('[data-tile-id]');
            if (!el) return;
            const tile = WarbandSystem.getTile(player, el.dataset.tileId);

            if (_wbPendingOrder) {
                if (tile) {
                    const s = WarbandSystem.controlState(tile);
                    if (s === 'enemy' || s === 'contested') {
                        WarbandSystem.applyStrategicOrder(player, _wbPendingOrder, tile.id);
                        _wbPendingOrder = null;
                        Router._load('warbands');
                        return;
                    }
                }
                _wbPendingOrder = null;
                Router._load('warbands');
                return;
            }

            if (!tile?.unlocked) return;
            _wbSelectedTile = el.dataset.tileId;
            Router._load('warbands');
        });
    }

    container.querySelector('#wb-cancel-order-target')?.addEventListener('click', e => {
        e.preventDefault(); _wbPendingOrder = null; Router._load('warbands');
    });

    container.querySelectorAll('[data-order-id]').forEach(btn => {
        btn.addEventListener('click', () => {
            const def = getStrategicOrder(btn.dataset.orderId);
            if (def?.requiresTarget) { _wbPendingOrder = btn.dataset.orderId; Router._load('warbands'); }
            else { WarbandSystem.applyStrategicOrder(player, btn.dataset.orderId, null); Router._load('warbands'); }
        });
    });

    container.querySelectorAll('[data-ability-id]').forEach(btn => {
        btn.addEventListener('click', () => {
            WarbandSystem.useTacticalAbility(player, btn.dataset.abilityId, btn.dataset.abilityTile || null);
            Router._load('warbands');
        });
    });

    container.querySelectorAll('[data-rift-quest]').forEach(btn => {
        btn.addEventListener('click', () => {
            WarbandSystem.startRiftQuest(player, btn.dataset.riftQuest);
            Router._load('warbands');
        });
    });

    container.querySelector('#wb-faction-support-btn')?.addEventListener('click', () => {
        WarbandSystem.requestFactionSupport(player);
        Router._load('warbands');
    });

    container.querySelectorAll('[data-tile-action]').forEach(btn => {
        btn.addEventListener('click', () => {
            const { tileAction, tileId } = btn.dataset;
            if (tileAction === 'troops')    WarbandSystem.deployTroops(player, tileId);
            if (tileAction === 'fortify')   WarbandSystem.fortifyTile(player, tileId);
            if (tileAction === 'stabilize') WarbandSystem.stabilizeRift(player, tileId);
            Router._load('warbands');
        });
    });

    // ── Game state buttons ────────────────────────────────────────────────────
    container.querySelector('#wb-start-campaign')?.addEventListener('click', () => {
        WarbandSystem.startCountdown(player, 1800);
        Router._load('warbands');
    });

    container.querySelector('#wb-new-campaign')?.addEventListener('click', () => {
        WarbandSystem.resetCampaign(player);
        Router._load('warbands');
    });

    container.querySelector('#wb-cancel-countdown')?.addEventListener('click', () => {
        WarbandSystem.resetCampaign(player);
        Router._load('warbands');
    });

    container.querySelector('#wb-end-turn')?.addEventListener('click', () => {
        WarbandSystem.endPlayerTurn(player);
        // endPlayerTurn calls Router._load internally after save
    });

    container.querySelector('#wb-end-campaign')?.addEventListener('click', () => {
        WarbandSystem.endGame(player, { win: false, loss: true, winReason: 'Campaign abandoned.' });
        Router._load('warbands');
    });

}
