// js/pages/map.js
// World map page — SVG hex grid + region info panel.

Router.register('map', function () {
    _renderMapPage();
});

// ── Constants ─────────────────────────────────────────────────────────────────
const _MAP_HEX_SIZE   = 48;
const _MAP_OFFSET_X   = 80;
const _MAP_OFFSET_Y   = 60;
const _MAP_VIEWBOX    = '0 0 1000 800';

// Solid faction fill colours — political map style
const _MAP_TYPE_FILLS = {
    neutral:        '#2c200e',
    iron_dominion:  '#6e1212',
    ashen_covenant: '#0f2050',
    thornwood:      '#12501a',
    conflict:       '#0e0b08',
};

// ── State ─────────────────────────────────────────────────────────────────────
let _mapSelectedId  = null;
let _mapCurrentPath = null; // multi-tile BFS path to selected tile

// ── Main render ───────────────────────────────────────────────────────────────
function _renderMapPage() {
    const el = document.getElementById('content-area');
    if (!el) return;

    const player = PlayerSystem.current;
    const locId  = player.location;
    const adjIds = MapSystem.getAdjacentIds(locId);

    if (!_mapSelectedId || !MAP_REGIONS[_mapSelectedId]) {
        _mapSelectedId = locId;
    }

    // Reset path when selection is current or adjacent
    if (_mapSelectedId === locId || adjIds.includes(_mapSelectedId)) {
        _mapCurrentPath = null;
    }

    el.innerHTML = `
        <div class="page-map">
            <div class="map-header">
                <h2 class="heading">World Map</h2>
                <span class="map-location-badge">◉ ${MapSystem.getCurrentRegionName()}</span>
            </div>
            <div class="map-body">
                <div class="map-svg-wrap">
                    ${_buildMapSvg(locId, adjIds)}
                </div>
                <div class="map-info-panel" id="map-info-panel">
                    ${_buildInfoPanel(MAP_REGIONS[_mapSelectedId], player, locId, adjIds)}
                </div>
            </div>
        </div>
    `;
}

// ── SVG hex grid ──────────────────────────────────────────────────────────────
function _buildMapSvg(locId, adjIds) {
    const S  = _MAP_HEX_SIZE;
    const ox = _MAP_OFFSET_X;
    const oy = _MAP_OFFSET_Y;

    function hexToPixel(q, r) {
        return {
            x: ox + S * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r),
            y: oy + S * (1.5 * r),
        };
    }

    function hexCorners(cx, cy) {
        const pts = [];
        for (let i = 0; i < 6; i++) {
            const angle = Math.PI / 180 * (60 * i - 30);
            pts.push(`${(cx + S * Math.cos(angle)).toFixed(1)},${(cy + S * Math.sin(angle)).toFixed(1)}`);
        }
        return pts.join(' ');
    }

    const landMask = [];
    const fills    = [];
    const borders  = [];
    const glows    = [];
    const dots     = [];
    const labels   = [];

    const ACT_COLORS = { quests: '#c9a84c', market: '#4aaa6a', training: '#4a9edb' };
    const ACT_KEYS   = ['quests', 'market', 'training'];

    for (const [id, region] of Object.entries(MAP_REGIONS)) {
        const { x, y } = hexToPixel(region.q, region.r);
        const corners  = hexCorners(x, y);

        const isCurrent  = id === locId;
        const isAdjacent = adjIds.includes(id);
        const isSelected = id === _mapSelectedId;
        const canEnter   = isAdjacent && MapSystem.canTravel(id).ok;
        const isLocked   = isAdjacent && !canEnter;
        const isOnPath   = !!(Array.isArray(_mapCurrentPath) && _mapCurrentPath.includes(id));

        landMask.push(`<polygon points="${corners}" fill="white"/>`);

        const fillColor = _MAP_TYPE_FILLS[region.type] || '#1a1208';
        fills.push(
            `<polygon class="map-hex${isCurrent ? ' map-hex-current' : ''}` +
            `${isSelected ? ' map-hex-selected' : ''}" points="${corners}" ` +
            `fill="${fillColor}" data-region="${id}" style="cursor:pointer"/>`
        );

        borders.push(
            `<polygon points="${corners}" fill="none" ` +
            `stroke="rgba(255,255,255,0.28)" stroke-width="0.8" ` +
            `stroke-dasharray="3,4" pointer-events="none"/>`
        );

        if (isCurrent) {
            glows.push(
                `<polygon points="${corners}" fill="rgba(201,168,76,0.12)" ` +
                `stroke="#c9a84c" stroke-width="2.5" pointer-events="none"/>`
            );
        } else if (isSelected) {
            glows.push(
                `<polygon points="${corners}" fill="rgba(255,255,255,0.06)" ` +
                `stroke="rgba(255,255,255,0.5)" stroke-width="1.5" pointer-events="none"/>`
            );
        } else if (canEnter) {
            glows.push(
                `<polygon points="${corners}" fill="none" ` +
                `stroke="rgba(100,200,120,0.4)" stroke-width="1.2" pointer-events="none"/>`
            );
        } else if (isLocked) {
            glows.push(
                `<polygon points="${corners}" fill="none" ` +
                `stroke="rgba(180,60,60,0.35)" stroke-width="1.2" pointer-events="none"/>`
            );
        } else if (isOnPath) {
            glows.push(
                `<polygon points="${corners}" fill="rgba(220,160,40,0.07)" ` +
                `stroke="#dca028" stroke-width="1.5" stroke-dasharray="4,3" ` +
                `opacity="0.65" pointer-events="none"/>`
            );
        }

        const acts    = region.activities ?? [];
        const actDots = ACT_KEYS.filter(a => acts.includes(a));
        if (actDots.length > 0) {
            const spacing = 9;
            const startX  = x - (actDots.length - 1) * spacing / 2;
            const dotY    = y + S * 0.52;
            actDots.forEach((key, i) => {
                dots.push(
                    `<circle cx="${(startX + i * spacing).toFixed(1)}" cy="${dotY.toFixed(1)}" ` +
                    `r="3.5" fill="${ACT_COLORS[key]}" opacity="0.9" pointer-events="none"/>`
                );
            });
        }

        const hasActivities = acts.length > 0;
        const labelY        = hasActivities ? y - S * 0.18 : y + S * 0.12;
        const shortLabel    = region.label.length > 11 ? region.label.slice(0, 10) + '\u2026' : region.label;
        const labelColor    = isCurrent ? '#f0d880' : '#e0d0a8';
        const fontSize      = hasActivities ? 8 : 7;

        if (hasActivities) {
            const bw = Math.min(shortLabel.length * 5.2 + 10, S * 1.7);
            const bh = 11;
            labels.push(
                `<rect x="${(x - bw/2).toFixed(1)}" y="${(labelY - bh/2 - 1).toFixed(1)}" ` +
                `width="${bw.toFixed(1)}" height="${bh}" rx="3" ` +
                `fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.18)" stroke-width="0.5" ` +
                `pointer-events="none"/>`
            );
        }
        labels.push(
            `<text x="${x.toFixed(1)}" y="${(labelY + 3.5).toFixed(1)}" ` +
            `text-anchor="middle" font-size="${fontSize}" fill="${labelColor}" ` +
            `font-family="'Cinzel',serif" pointer-events="none"` +
            `>${shortLabel}</text>`
        );
    }

    const land = landMask.join('');

    return `
        <svg class="map-svg" viewBox="${_MAP_VIEWBOX}" xmlns="http://www.w3.org/2000/svg"
             onclick="_mapHandleClick(event)">
            <defs>
                <filter id="shore-ring" x="-40%" y="-50%" width="180%" height="200%"
                        color-interpolation-filters="sRGB">
                    <feMorphology in="SourceAlpha" operator="dilate" radius="40" result="d1"/>
                    <feComposite in="d1" in2="SourceAlpha" operator="out" result="ring"/>
                    <feFlood flood-color="#3a8fbf" result="col"/>
                    <feComposite in="col" in2="ring" operator="in"/>
                </filter>
            </defs>

            <!-- Ocean background -->
            <rect width="100%" height="100%" fill="#2a6a9a"/>

            <!-- Shore ring -->
            <g filter="url(#shore-ring)">${land}</g>

            <!-- Hex fills (faction colours) -->
            ${fills.join('')}

            <!-- Hex grid lines (dashed white) -->
            ${borders.join('')}

            <!-- Selection / adjacency highlights -->
            ${glows.join('')}

            <!-- Activity indicator dots -->
            ${dots.join('')}

            <!-- Region labels -->
            ${labels.join('')}
        </svg>
    `;
}

// ── Click handler ─────────────────────────────────────────────────────────────
function _mapHandleClick(e) {
    const poly = e.target.closest('[data-region]');
    if (!poly) return;
    const id = poly.dataset.region;
    if (!MAP_REGIONS[id]) return;

    _mapSelectedId = id;

    const player = PlayerSystem.current;
    const locId  = player.location;
    const adjIds = MapSystem.getAdjacentIds(locId);

    // Compute multi-tile path for non-adjacent tiles
    if (id !== locId && !adjIds.includes(id)) {
        _mapCurrentPath = MapSystem.findPath(locId, id);
        _renderMapPage();
        return;
    }

    _mapCurrentPath = null;

    const panel = document.getElementById('map-info-panel');
    if (panel) panel.innerHTML = _buildInfoPanel(MAP_REGIONS[id], player, locId, adjIds);

    document.querySelectorAll('.map-hex').forEach(p => p.classList.remove('map-hex-selected'));
    poly.classList.add('map-hex-selected');
}

// ── Info panel ────────────────────────────────────────────────────────────────
function _buildInfoPanel(region, player, locId, adjIds) {
    if (!region) {
        return `<div class="map-info-empty">Select a region to view details.</div>`;
    }

    const isCurrent  = region.id === locId;
    const isAdjacent = adjIds.includes(region.id);
    const travelCheck = isAdjacent ? MapSystem.canTravel(region.id) : null;

    const typeLabel = {
        neutral:        'Neutral',
        iron_dominion:  'Iron Dominion',
        ashen_covenant: 'Ashen Covenant',
        thornwood:      'Thornwood',
        conflict:       'Ruins of Valdros',
    }[region.type] || region.type;

    const dangerLabel = ['Safe','Low','Moderate','High','Extreme','Lethal'][region.danger] || `${region.danger}`;
    const dangerColor = ['#4a9e6b','#8aa84a','#c9a84c','#c07830','#c04040','#9b1a1a'][region.danger] || '#c9a84c';
    const tierStars   = region.tier === 0 ? 'Starter' : '\u2605'.repeat(region.tier) + '\u2606'.repeat(Math.max(0, 5 - region.tier));

    let reqHtml = '';
    if (region.accessReq) {
        const req = region.accessReq;
        if (req.totalSkill != null) {
            const current = PlayerSystem.getTotalSkill();
            const met     = current >= req.totalSkill;
            reqHtml = `<div class="map-info-req${met ? '' : ' map-req-unmet'}">Total Skill: ${current} / ${req.totalSkill}</div>`;
        } else if (req.anyOf) {
            const parts = req.anyOf.map(r => `${skillLabel(r.skill)} ${r.level}`).join(' <em>or</em> ');
            const met   = MapSystem.meetsReq(player, req);
            reqHtml = `<div class="map-info-req${met ? '' : ' map-req-unmet'}">Requires: ${parts}</div>`;
        } else {
            const met = MapSystem.meetsReq(player, req);
            reqHtml = `<div class="map-info-req${met ? '' : ' map-req-unmet'}">Requires: ${skillLabel(req.skill)} ${req.level}</div>`;
        }
    }

    const actHtml = region.activities && region.activities.length
        ? `<div class="map-info-activities">${region.activities.map(a =>
            `<span class="map-activity-chip">${a}</span>`).join('')}</div>`
        : '';

    let travelHtml = '';
    if (isCurrent) {
        travelHtml = `<div class="map-info-here">You are here.</div>`;
    } else if (isAdjacent) {
        if (travelCheck.ok) {
            const cost    = MapSystem.getTravelCost(region.id);
            const canAfford = player.gold >= cost;
            const costLabel = `${cost.toLocaleString()}g`;
            if (canAfford) {
                travelHtml = `<button class="map-btn-travel" onclick="_mapTravel('${region.id}')">Travel to ${region.name} <span class="map-travel-duration">${costLabel}</span></button>`;
            } else {
                travelHtml = `<button class="map-btn-travel map-btn-locked" disabled title="Need ${costLabel}">Travel to ${region.name} <span class="map-travel-duration">${costLabel}</span> — insufficient gold</button>`;
            }
        } else {
            travelHtml = `<button class="map-btn-travel map-btn-locked" disabled title="${travelCheck.reason}">Locked — ${travelCheck.reason}</button>`;
        }
    } else if (_mapCurrentPath) {
        const costInfo = MapSystem.pathTravelCost(_mapCurrentPath);
        if (costInfo.ok) {
            const costLabel  = `${costInfo.totalCost.toLocaleString()}g`;
            const stops      = _mapCurrentPath.length - 1;
            const stopsStr   = stops > 0 ? ` via ${stops} stop${stops > 1 ? 's' : ''}` : '';
            const canAfford  = player.gold >= costInfo.totalCost;
            if (canAfford) {
                travelHtml = `<button class="map-btn-travel" onclick="_mapTravelPath()">Travel to ${region.name}${stopsStr} <span class="map-travel-duration">${costLabel}</span></button>`;
            } else {
                travelHtml = `<button class="map-btn-travel map-btn-locked" disabled title="Need ${costLabel}">Travel to ${region.name}${stopsStr} <span class="map-travel-duration">${costLabel}</span> — insufficient gold</button>`;
            }
        } else {
            travelHtml = `<div class="map-info-nonadj muted-text">Cannot reach: ${costInfo.reason}</div>`;
        }
    } else {
        travelHtml = `<div class="map-info-nonadj muted-text">No accessible path to this region.</div>`;
    }

    return `
        <div class="map-info-card">
            <div class="map-info-name">${region.name}</div>
            <div class="map-info-meta">
                <span class="map-info-type">${typeLabel}</span>
                <span class="map-info-tier">${tierStars}</span>
                <span class="map-info-danger" style="color:${dangerColor}">${dangerLabel} Danger</span>
            </div>
            ${reqHtml}
            <div class="map-info-desc">${region.description}</div>
            <div class="map-info-flavour muted-text">${region.flavour}</div>
            ${actHtml}
            <div class="map-info-action">${travelHtml}</div>
        </div>
    `;
}

// ── Travel actions ────────────────────────────────────────────────────────────
function _mapTravel(toId) {
    const result = MapSystem.travel(toId);
    if (!result.ok) {
        Log.add(result.reason, 'danger');
        return;
    }
    _mapSelectedId  = PlayerSystem.current.location;
    _mapCurrentPath = null;
    _renderMapPage();
}

function _mapTravelPath() {
    if (!_mapCurrentPath) return;
    const result = MapSystem.travelPath(_mapCurrentPath);
    if (!result.ok) {
        Log.add(result.reason, 'danger');
        return;
    }
    _mapSelectedId  = PlayerSystem.current.location;
    _mapCurrentPath = null;
    _renderMapPage();
}
