// js/pages/map.js
// World map page — SVG hex grid + region info panel.

let _mapInitialized = false;

Router.register("map", function () {
  _renderMapPage();
});

// ── Constants ─────────────────────────────────────────────────────────────────
const _MAP_HEX_SIZE = 48;
const _MAP_OFFSET_X = 80;
const _MAP_OFFSET_Y = 60;
// const _MAP_VIEWBOX    = '0 0 1000 800';
let _mapView = {
  x: 200,
  y: 150,
  width: 850,
  height: 680,
};
let _isDragging = false;
let _wasDragging = false;
let _dragStart = { x: 0, y: 0 };
const _DRAG_THRESHOLD = 8;
let _dragPending = false;

function _centerMapOnContent() {
  const regions = Object.values(MAP_REGIONS);
  if (!regions.length) return;

  const S = _MAP_HEX_SIZE;
  const ox = _MAP_OFFSET_X;
  const oy = _MAP_OFFSET_Y;

  function hexToPixel(q, r) {
    return {
      x: ox + S * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r),
      y: oy + S * (1.5 * r),
    };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const region of regions) {
    const { x, y } = hexToPixel(region.q, region.r);

    minX = Math.min(minX, x - S);
    maxX = Math.max(maxX, x + S);
    minY = Math.min(minY, y - S);
    maxY = Math.max(maxY, y + S);
  }

  const padding = 100;

  _mapView.x = minX - padding;
  _mapView.y = minY - padding;
  _mapView.width = (maxX - minX) + padding * 2;
  _mapView.height = (maxY - minY) + padding * 2;
}

function _mapStartDrag(e) {
  _dragPending = true;
  _isDragging = false;
  _wasDragging = false;
  _dragStart.x = e.clientX;
  _dragStart.y = e.clientY;
}

function _mapDrag(e) {
  if (!_dragPending && !_isDragging) return;

  const dx = e.clientX - _dragStart.x;
  const dy = e.clientY - _dragStart.y;

  // Do not start dragging until the mouse has moved enough
  if (!_isDragging) {
    const distance = Math.hypot(dx, dy);
    if (distance < _DRAG_THRESHOLD) return;

    _isDragging = true;
    _wasDragging = true;
  }

  const scaleX = _mapView.width / 1000;
  const scaleY = _mapView.height / 800;

  _mapView.x -= dx * scaleX;
  _mapView.y -= dy * scaleY;

  _dragStart.x = e.clientX;
  _dragStart.y = e.clientY;

  _clampMapView();
  _renderMapPage();
}

function _mapEndDrag() {
  _dragPending = false;
  _isDragging = false;

  // Delay reset so click handler can still see it
  setTimeout(() => {
    _wasDragging = false;
  }, 0);
}

function _clampMapView() {
  _mapView.x = Math.max(-200, Math.min(_mapView.x, 1200));
  _mapView.y = Math.max(-200, Math.min(_mapView.y, 1200));
}
// Solid faction fill colours — political map style
const _MAP_TYPE_FILLS = {
  neutral: "#2c200e",
  iron_dominion: "#6e1212",
  ashen_covenant: "#0f2050",
  thornwood: "#12501a",
  conflict: "#0e0b08",
};

// ── State ─────────────────────────────────────────────────────────────────────
let _mapSelectedId = null;
let _mapCurrentPath = null;     // multi-tile BFS path to selected tile
let _mapLayer = 'world';        // 'world' | 'region'
let _mapRegionFilter = null;    // faction mapView for MAP_REGIONS filter
let _activeWorldHexId = null;   // currently selected world hex ID
let _worldSelectedHexId = null; // highlighted hex on world map (for info panel)

// ── Main render ───────────────────────────────────────────────────────────────
function _renderMapPage() {

    if (!_mapInitialized) {
    _centerMapOnContent();
    _mapInitialized = true;
  }

  const el = document.getElementById("content-area");
  if (!el) return;

  const player = PlayerSystem.current;

  // Route to world or region view based on layer
  if (_mapLayer === 'world') {
    _renderWorldMapPage();
  } else {
    _renderRegionMapPage(player);
  }
}

// ── World Map View (Macro Layer) ──────────────────────────────────────────────
function _renderWorldMapPage() {
  const el = document.getElementById("content-area");
  if (!el) return;

  const player = PlayerSystem.current;
  const playerFaction = player ? player.faction : null;
  const selectedHex = _worldSelectedHexId ? MAP_WORLD[_worldSelectedHexId] : null;

  el.innerHTML = `
    <div class="page-map page-map-world">
      <div class="map-header">
        <h2 class="heading">World Map</h2>
        <span class="map-location-badge">◉ ${_worldCurrentRegionLabel(player)}</span>
      </div>
      <div class="map-body">
        <div class="map-svg-wrap">
          ${_buildWorldMapSvg(playerFaction)}
        </div>
        <div class="map-info-panel" id="map-info-panel">
          ${_buildWorldInfoPanel(selectedHex)}
        </div>
      </div>
    </div>
  `;
}

function _worldCurrentRegionLabel(player) {
  if (!player) return 'Unknown';
  // Find which world hex contains the player's current location
  const curRegion = MAP_REGIONS[player.location];
  if (curRegion) {
    // Find world hex whose linksTo matches curRegion.mapView
    const worldHex = Object.values(MAP_WORLD).find(h => h.linksTo === curRegion.mapView);
    if (worldHex) return worldHex.name;
  }
  return 'Ashenveil';
}

// ── Region Map View (Core Gameplay Layer) ─────────────────────────────────────
function _renderRegionMapPage(player) {
  const el = document.getElementById("content-area");
  if (!el) return;

  const activeWorldHex = _activeWorldHexId ? MAP_WORLD[_activeWorldHexId] : null;
  const regionName = activeWorldHex ? activeWorldHex.name : 'Region';

  // Dispatch: faction hexes use handcrafted MAP_REGIONS, neutral hexes use generated grid
  const useGenerated = activeWorldHex && !activeWorldHex.linksTo;

  const locId = player.location;
  const adjIds = useGenerated ? [] : MapSystem.getAdjacentIds(locId);

  if (!useGenerated) {
    if (!_mapSelectedId || !MAP_REGIONS[_mapSelectedId]) _mapSelectedId = locId;
    if (_mapSelectedId === locId || adjIds.includes(_mapSelectedId)) _mapCurrentPath = null;
  }

  const selectedRegion = useGenerated ? null : MAP_REGIONS[_mapSelectedId];
  const backBtnHtml = `<button class="btn-secondary" style="padding:6px 10px;font-size:12px;" id="map-back-btn">← World</button>`;

  el.innerHTML = `
    <div class="page-map page-map-region">
      <div class="map-header">
        <div style="display:flex;align-items:center;gap:12px;">
          ${backBtnHtml}
          <div>
            <h2 class="heading" style="margin:0;">${regionName}</h2>
            <span class="map-location-badge">◉ ${MapSystem.getCurrentRegionName()}</span>
            ${activeWorldHex ? `<span class="map-tier-badge">${_tierStars(activeWorldHex.tier)} ${_dangerLabel(activeWorldHex.danger)}</span>` : ''}
          </div>
        </div>
      </div>
      <div class="map-body">
        <div class="map-svg-wrap">
          ${useGenerated
            ? _buildGeneratedRegionSvg(_activeWorldHexId, player)
            : _buildRegionMapSvg(locId, adjIds, player)}
        </div>
        <div class="map-info-panel" id="map-info-panel">
          ${useGenerated
            ? _buildWorldInfoPanel(activeWorldHex)
            : _buildInfoPanel(selectedRegion, player, locId, adjIds)}
        </div>
      </div>
    </div>
  `;

  // Bind back button
  setTimeout(() => {
    const backBtn = document.getElementById('map-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        _mapLayer = 'world';
        _mapSelectedId = null;
        _mapCurrentPath = null;
        _renderMapPage();
      });
    }
  }, 0);
}

// ── Tier + danger helpers ─────────────────────────────────────────────────────
function _tierStars(tier) {
  if (tier === 0) return 'Starter';
  return '★'.repeat(tier) + '☆'.repeat(Math.max(0, 5 - tier));
}
function _dangerLabel(danger) {
  return (['Safe','Low','Moderate','High','Extreme','Lethal'][danger] || '') ;
}

// ── World Map SVG (Macro Layer — 18 continental hexes) ───────────────────────
function _buildWorldMapSvg(playerFaction) {
  const S = 52; // Hex size — slightly smaller to fit 18 hexes
  const PAD = 80;

  function hexToPixel(q, r) {
    return {
      x: S * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r),
      y: S * (1.5 * r),
    };
  }

  function hexCorners(cx, cy) {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30);
      pts.push(
        `${(cx + S * Math.cos(angle)).toFixed(1)},${(cy + S * Math.sin(angle)).toFixed(1)}`,
      );
    }
    return pts.join(" ");
  }

  // Auto-calculate viewBox bounding box from hex positions
  const entries = Object.entries(MAP_WORLD);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [, hex] of entries) {
    const { x, y } = hexToPixel(hex.q, hex.r);
    minX = Math.min(minX, x - S);
    maxX = Math.max(maxX, x + S);
    minY = Math.min(minY, y - S);
    maxY = Math.max(maxY, y + S);
  }
  const vbX = minX - PAD;
  const vbY = minY - PAD;
  const vbW = (maxX - minX) + PAD * 2;
  const vbH = (maxY - minY) + PAD * 2;

  const lands = [];
  const borders = [];
  const fills = [];
  const glows = [];
  const labels = [];

  for (const [id, hex] of entries) {
    const { x, y } = hexToPixel(hex.q, hex.r);
    const corners = hexCorners(x, y);
    const isPlayerFaction = hex.type === playerFaction;
    const isSelected = id === _worldSelectedHexId;
    const fillColor = _MAP_TYPE_FILLS[hex.type] || '#1a1208';

    lands.push(`<polygon points="${corners}" fill="white"/>`);

    fills.push(
      `<polygon points="${corners}" fill="${fillColor}" data-world-hex="${id}" ` +
      `style="cursor:pointer;opacity:${isPlayerFaction ? '1' : '0.82'}"/>`
    );

    borders.push(
      `<polygon points="${corners}" fill="none" ` +
      `stroke="rgba(255,255,255,0.22)" stroke-width="1" stroke-dasharray="3,4" pointer-events="none"/>`
    );

    if (isPlayerFaction) {
      glows.push(
        `<polygon points="${corners}" fill="rgba(201,168,76,0.12)" ` +
        `stroke="#c9a84c" stroke-width="2" pointer-events="none"/>`
      );
    }
    if (isSelected) {
      glows.push(
        `<polygon points="${corners}" fill="rgba(255,255,255,0.08)" ` +
        `stroke="rgba(255,255,255,0.6)" stroke-width="1.8" pointer-events="none"/>`
      );
    }

    // Tier danger dots
    if (hex.tier >= 3) {
      const dotColor = hex.tier >= 5 ? '#9b1a1a' : hex.tier >= 4 ? '#c04040' : '#c07830';
      labels.push(`<circle cx="${(x + S * 0.55).toFixed(1)}" cy="${(y - S * 0.55).toFixed(1)}" r="4" fill="${dotColor}" pointer-events="none"/>`);
    }

    const fontSize = 9;
    const shortLabel = hex.label.length > 12 ? hex.label.slice(0, 11) + '…' : hex.label;
    labels.push(
      `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" ` +
      `text-anchor="middle" font-size="${fontSize}" fill="#e0d0a8" ` +
      `font-family="'Cinzel',serif" font-weight="600" pointer-events="none">` +
      `${shortLabel}</text>`
    );
  }

  const land = lands.join("");
  return `
    <svg class="map-svg" viewBox="${vbX.toFixed(0)} ${vbY.toFixed(0)} ${vbW.toFixed(0)} ${vbH.toFixed(0)}"
      xmlns="http://www.w3.org/2000/svg"
      onmousedown="_mapStartDrag(event)"
      onmousemove="_mapDrag(event)"
      onmouseup="_mapEndDrag()"
      onmouseleave="_mapEndDrag()"
      onclick="_mapHandleWorldHexClick(event)">
      <defs>
        <filter id="shore-ring-world" x="-40%" y="-50%" width="180%" height="200%" color-interpolation-filters="sRGB">
          <feMorphology in="SourceAlpha" operator="dilate" radius="50" result="d1"/>
          <feComposite in="d1" in2="SourceAlpha" operator="out" result="ring"/>
          <feFlood flood-color="#3a8fbf" result="col"/>
          <feComposite in="col" in2="ring" operator="in"/>
        </filter>
      </defs>
      <rect x="${(vbX - 200).toFixed(0)}" y="${(vbY - 200).toFixed(0)}" width="${(vbW + 400).toFixed(0)}" height="${(vbH + 400).toFixed(0)}" fill="#2a6a9a"/>
      <g filter="url(#shore-ring-world)">${land}</g>
      ${fills.join("")}
      ${borders.join("")}
      ${glows.join("")}
      ${labels.join("")}
    </svg>
  `;
}

// ── World Map Info Panel ──────────────────────────────────────────────────────
function _buildWorldInfoPanel(hex) {
  if (!hex) {
    return `
      <div class="map-info-empty">
        <h3 style="margin-top:0;color:#c9a84c;">World Map</h3>
        <p style="font-size:13px;line-height:1.6;color:#b0a090;">
          Click a territory to explore it. Your faction territory is highlighted in gold.
        </p>
        <div style="font-size:11px;color:#7d7060;margin-top:16px;line-height:1.8;">
          <div>🔴 High danger</div>
          <div>🟡 Your territory</div>
          <div>◻ Click to enter region</div>
        </div>
      </div>
    `;
  }

  const typeLabel = {
    neutral: 'Neutral Territory',
    iron_dominion: 'Iron Dominion',
    ashen_covenant: 'Ashen Covenant',
    thornwood: 'Thornwood',
    ruins: 'Ruins of Valdros',
  }[hex.type] || hex.type;

  const dangerColor = ['#4a9e6b','#8aa84a','#c9a84c','#c07830','#c04040','#9b1a1a'][hex.danger] || '#c9a84c';
  const dangerStr = _dangerLabel(hex.danger);

  return `
    <div class="map-info-content">
      <div class="map-info-name">${hex.name}</div>
      <div class="map-info-type">${typeLabel}</div>
      <div class="map-info-tier">
        <span class="map-tier-stars">${_tierStars(hex.tier)}</span>
        <span class="map-danger-label" style="color:${dangerColor}">${dangerStr}</span>
      </div>
      <p class="map-info-desc">${hex.description}</p>
      <div class="map-info-biome">Terrain: <strong>${hex.biome}</strong></div>
      <div class="map-info-travel">
        <button class="map-btn-travel" onclick="_mapEnterWorldHex('${hex.id}')">
          Enter Region →
        </button>
      </div>
    </div>
  `;
}

// ── Generated Region SVG (Procedural Neutral Zones) ──────────────────────────
function _buildGeneratedRegionSvg(worldHexId, player) {
  if (typeof RegionGenerator === 'undefined') {
    return `<div class="map-info-empty">Region generator not loaded.</div>`;
  }

  const grid = RegionGenerator.getOrGenerate(worldHexId);
  const tiles = Object.values(grid);
  if (!tiles.length) return `<div class="map-info-empty">Empty region.</div>`;

  const S = _MAP_HEX_SIZE;
  const ox = _MAP_OFFSET_X;
  const oy = _MAP_OFFSET_Y;
  const discovered = new Set(player?.discoveredLocations || []);

  // Terrain fill colors (lighter palette for generated tiles)
  const TERRAIN_FILLS = {
    city:      '#3a2a10', town:     '#2a3a18', camp:     '#1e2e12',
    plains:    '#1e3010', hills:    '#2a2010', forest:   '#0e2a0e',
    wasteland: '#2a1e0e', fortress: '#2a1010', tower:    '#1a1a2a',
    ruins:     '#120a0a',
  };

  function hexToPixel(q, r) {
    return {
      x: ox + S * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r),
      y: oy + S * (1.5 * r),
    };
  }

  function hexCorners(cx, cy) {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30);
      pts.push(`${(cx + S * Math.cos(angle)).toFixed(1)},${(cy + S * Math.sin(angle)).toFixed(1)}`);
    }
    return pts.join(' ');
  }

  // Auto center view on content
  if (!_mapInitialized) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const tile of tiles) {
      const { x, y } = hexToPixel(tile.q, tile.r);
      minX = Math.min(minX, x - S); maxX = Math.max(maxX, x + S);
      minY = Math.min(minY, y - S); maxY = Math.max(maxY, y + S);
    }
    const pad = 80;
    _mapView = { x: minX - pad, y: minY - pad, width: (maxX - minX) + pad * 2, height: (maxY - minY) + pad * 2 };
    _mapInitialized = true;
  }

  const lands = [], fills = [], borders = [], glows = [], labels = [];

  for (const tile of tiles) {
    const { x, y } = hexToPixel(tile.q, tile.r);
    const corners = hexCorners(x, y);
    const isDiscovered = discovered.has(tile.id);
    const fillColor = TERRAIN_FILLS[tile.terrain] || '#1a1208';

    lands.push(`<polygon points="${corners}" fill="white"/>`);

    if (!isDiscovered) {
      fills.push(`<polygon points="${corners}" fill="#0d0d0d" opacity="0.9" style="pointer-events:none"/>`);
      glows.push(`<polygon points="${corners}" fill="none" stroke="rgba(100,100,100,0.12)" stroke-width="0.8" pointer-events="none"/>`);
    } else {
      fills.push(`<polygon points="${corners}" fill="${fillColor}" data-gen-tile="${tile.id}" style="cursor:default"/>`);
      borders.push(`<polygon points="${corners}" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="0.8" stroke-dasharray="3,4" pointer-events="none"/>`);

      // Activity dots for hub tiles
      if (tile.activities && tile.activities.length) {
        glows.push(`<circle cx="${x.toFixed(1)}" cy="${(y + S * 0.52).toFixed(1)}" r="3" fill="#c9a84c" opacity="0.9" pointer-events="none"/>`);
      }

      const shortTerrain = tile.terrain.slice(0, 8);
      labels.push(
        `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" ` +
        `text-anchor="middle" font-size="6.5" fill="#a09080" ` +
        `font-family="'Cinzel',serif" pointer-events="none">${shortTerrain}</text>`
      );
    }
  }

  const land = lands.join('');
  return `
    <svg class="map-svg"
      viewBox="${_mapView.x} ${_mapView.y} ${_mapView.width} ${_mapView.height}"
      xmlns="http://www.w3.org/2000/svg"
      onmousedown="_mapStartDrag(event)"
      onmousemove="_mapDrag(event)"
      onmouseup="_mapEndDrag()"
      onmouseleave="_mapEndDrag()"
      onwheel="_mapZoom(event)">
      <defs>
        <filter id="shore-ring-gen" x="-40%" y="-50%" width="180%" height="200%" color-interpolation-filters="sRGB">
          <feMorphology in="SourceAlpha" operator="dilate" radius="40" result="d1"/>
          <feComposite in="d1" in2="SourceAlpha" operator="out" result="ring"/>
          <feFlood flood-color="#3a8fbf" result="col"/>
          <feComposite in="col" in2="ring" operator="in"/>
        </filter>
      </defs>
      <rect width="200%" height="200%" x="-50%" y="-50%" fill="#2a6a9a"/>
      <g filter="url(#shore-ring-gen)">${land}</g>
      ${fills.join('')}
      ${borders.join('')}
      ${glows.join('')}
      ${labels.join('')}
    </svg>
  `;
}

// ── Region Map SVG (Core Gameplay Layer) ──────────────────────────────────────
function _buildRegionMapSvg(locId, adjIds, player) {
  const S = _MAP_HEX_SIZE;
  const ox = _MAP_OFFSET_X;
  const oy = _MAP_OFFSET_Y;

  function hexToPixel(q, r) {
    return {
      x: ox + S * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r),
      y: oy + S * (1.5 * r),
    };
  }

  function hexCorners(cx, cy) {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30);
      pts.push(
        `${(cx + S * Math.cos(angle)).toFixed(1)},${(cy + S * Math.sin(angle)).toFixed(1)}`,
      );
    }
    return pts.join(" ");
  }

  const landMask = [];
  const fills = [];
  const borders = [];
  const glows = [];
  const dots = [];
  const labels = [];

  const ACT_COLORS = {
    quests: "#c9a84c",
    market: "#4aaa6a",
    training: "#4a9edb",
  };
  const ACT_KEYS = ["quests", "market", "training"];

  // Filter regions by current region view
  const visibleRegions = _mapRegionFilter
    ? Object.entries(MAP_REGIONS).filter(([_, r]) => r.mapView === _mapRegionFilter)
    : Object.entries(MAP_REGIONS);

  const discovered = new Set(player?.discoveredLocations || []);

  for (const [id, region] of visibleRegions) {
    const { x, y } = hexToPixel(region.q, region.r);
    const corners = hexCorners(x, y);

    const isCurrent = id === locId;
    const isAdjacent = adjIds.includes(id);
    const isSelected = id === _mapSelectedId;
    const isDiscovered = discovered.has(id);
    const isExplored = isDiscovered && !isAdjacent;  // Discovered but not currently visible
    const canEnter = isAdjacent && MapSystem.canTravel(id).ok;
    const isLocked = isAdjacent && !canEnter;
    const isOnPath = !!(
      Array.isArray(_mapCurrentPath) && _mapCurrentPath.includes(id)
    );

    landMask.push(`<polygon points="${corners}" fill="white"/>`);

    const fillColor = _MAP_TYPE_FILLS[region.type] || "#1a1208";

    // Render tile based on discovery state
    if (!isDiscovered) {
      // Undiscovered: dark hex with no interaction
      fills.push(
        `<polygon points="${corners}" fill="#0d0d0d" opacity="0.9" ` +
        `style="pointer-events:none"/>`
      );
      glows.push(
        `<polygon points="${corners}" fill="none" stroke="rgba(100,100,100,0.15)" ` +
        `stroke-width="0.8" pointer-events="none"/>`
      );
    } else {
      // Discovered: normal rendering
      const opacity = isExplored ? 0.85 : 1.0;
      fills.push(
        `<polygon class="map-hex${isCurrent ? " map-hex-current" : ""}` +
          `${isSelected ? " map-hex-selected" : ""}" points="${corners}" ` +
          `fill="${fillColor}" data-region="${id}" style="cursor:pointer;opacity:${opacity}"/>`,
      );
    }

    borders.push(
      `<polygon points="${corners}" fill="none" ` +
        `stroke="rgba(255,255,255,0.28)" stroke-width="0.8" ` +
        `stroke-dasharray="3,4" pointer-events="none"/>`,
    );

    // Add glow effects only for discovered tiles
    if (isDiscovered) {
      if (isCurrent) {
        glows.push(
          `<polygon points="${corners}" fill="rgba(201,168,76,0.12)" ` +
            `stroke="#c9a84c" stroke-width="2.5" pointer-events="none"/>`,
        );
      } else if (isSelected) {
        glows.push(
          `<polygon points="${corners}" fill="rgba(255,255,255,0.06)" ` +
            `stroke="rgba(255,255,255,0.5)" stroke-width="1.5" pointer-events="none"/>`,
        );
      } else if (canEnter) {
        glows.push(
          `<polygon points="${corners}" fill="none" ` +
            `stroke="rgba(100,200,120,0.4)" stroke-width="1.2" pointer-events="none"/>`,
        );
      } else if (isLocked) {
        glows.push(
          `<polygon points="${corners}" fill="none" ` +
            `stroke="rgba(180,60,60,0.35)" stroke-width="1.2" pointer-events="none"/>`,
        );
      } else if (isOnPath) {
        glows.push(
          `<polygon points="${corners}" fill="rgba(220,160,40,0.07)" ` +
            `stroke="#dca028" stroke-width="1.5" stroke-dasharray="4,3" ` +
            `opacity="0.65" pointer-events="none"/>`,
        );
      }
    }

    // Only show activity dots and labels for discovered tiles
    if (isDiscovered) {
      const acts = region.activities ?? [];
      const actDots = ACT_KEYS.filter((a) => acts.includes(a));
      if (actDots.length > 0) {
        const spacing = 9;
        const startX = x - ((actDots.length - 1) * spacing) / 2;
        const dotY = y + S * 0.52;
        actDots.forEach((key, i) => {
          dots.push(
            `<circle cx="${(startX + i * spacing).toFixed(1)}" cy="${dotY.toFixed(1)}" ` +
              `r="3.5" fill="${ACT_COLORS[key]}" opacity="0.9" pointer-events="none"/>`,
          );
        });
      }

      const hasActivities = acts.length > 0;
      const labelY = hasActivities ? y - S * 0.18 : y + S * 0.12;
      const shortLabel =
        region.label.length > 11
          ? region.label.slice(0, 10) + "\u2026"
          : region.label;
      const labelColor = isCurrent ? "#f0d880" : "#e0d0a8";
      const fontSize = hasActivities ? 8 : 7;

      if (hasActivities) {
        const bw = Math.min(shortLabel.length * 5.2 + 10, S * 1.7);
        const bh = 11;
        labels.push(
          `<rect x="${(x - bw / 2).toFixed(1)}" y="${(labelY - bh / 2 - 1).toFixed(1)}" ` +
            `width="${bw.toFixed(1)}" height="${bh}" rx="3" ` +
            `fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.18)" stroke-width="0.5" ` +
            `pointer-events="none"/>`,
        );
      }
      labels.push(
        `<text x="${x.toFixed(1)}" y="${(labelY + 3.5).toFixed(1)}" ` +
          `text-anchor="middle" font-size="${fontSize}" fill="${labelColor}" ` +
          `font-family="'Cinzel',serif" pointer-events="none"` +
          `>${shortLabel}</text>`,
      );
    }
  }

  const land = landMask.join("");

  return `
<svg
  class="map-svg"
  viewBox="${_mapView.x} ${_mapView.y} ${_mapView.width} ${_mapView.height}"
  xmlns="http://www.w3.org/2000/svg"
  onmousedown="_mapStartDrag(event)"
  onmousemove="_mapDrag(event)"
  onmouseup="_mapEndDrag()"
  onmouseleave="_mapEndDrag()"
  onwheel="_mapZoom(event)"
  onclick="_mapHandleClick(event)"
>
    <defs>
        <filter id="shore-ring" x="-40%" y="-50%" width="180%" height="200%"
                color-interpolation-filters="sRGB">
            <feMorphology in="SourceAlpha" operator="dilate" radius="40" result="d1"/>
            <feComposite in="d1" in2="SourceAlpha" operator="out" result="ring"/>
            <feFlood flood-color="#3a8fbf" result="col"/>
            <feComposite in="col" in2="ring" operator="in"/>
        </filter>
    </defs>

    <rect width="100%" height="100%" fill="#2a6a9a"/>
    <g filter="url(#shore-ring)">${land}</g>
    ${fills.join("")}
    ${borders.join("")}
    ${glows.join("")}
    ${dots.join("")}
    ${labels.join("")}
</svg>
    `;
}

// ── World hex click handler — select hex and show info ──────────────────────
function _mapHandleWorldHexClick(e) {
  if (_wasDragging) {
    _wasDragging = false;
    return;
  }

  const hexEl = e.target.closest("[data-world-hex]");
  if (!hexEl) return;

  const hexId = hexEl.dataset.worldHex;
  const worldHex = MAP_WORLD[hexId];
  if (!worldHex) return;

  // Select hex and update info panel (don't enter region yet)
  _worldSelectedHexId = hexId;

  // Update SVG selection state by re-rendering
  _renderWorldMapPage();
}

// ── Enter a world hex region (called by info panel button) ────────────────────
function _mapEnterWorldHex(hexId) {
  const worldHex = MAP_WORLD[hexId];
  if (!worldHex) return;

  _mapLayer = 'region';
  _activeWorldHexId = hexId;
  _mapRegionFilter = worldHex.linksTo || null;
  _mapSelectedId = null;
  _mapCurrentPath = null;
  _mapView = { x: 200, y: 150, width: 850, height: 680 };
  _mapInitialized = false;
  _renderMapPage();
}

// ── Click handler ─────────────────────────────────────────────────────────────

function _mapZoom(e) {
  e.preventDefault();

  const centerX = _mapView.x + _mapView.width / 2;
  const centerY = _mapView.y + _mapView.height / 2;

  const zoomFactor = 0.1;

  if (e.deltaY < 0) {
    // zoom in
    _mapView.width *= 1 - zoomFactor;
    _mapView.height *= 1 - zoomFactor;
  } else {
    // zoom out
    _mapView.width *= 1 + zoomFactor;
    _mapView.height *= 1 + zoomFactor;
  }

  _mapView.x = centerX - _mapView.width / 2;
  _mapView.y = centerY - _mapView.height / 2;

  _clampMapView();

  _renderMapPage();
}

function _mapHandleClick(e) {

      if (_wasDragging) {
    _wasDragging = false;
    return;
  }

  const poly = e.target.closest("[data-region]");
  if (!poly) return;
  const id = poly.dataset.region;
  if (!MAP_REGIONS[id]) return;

  _mapSelectedId = id;

  const player = PlayerSystem.current;
  const locId = player.location;
  const adjIds = MapSystem.getAdjacentIds(locId);

  // Compute multi-tile path for non-adjacent tiles
  if (id !== locId && !adjIds.includes(id)) {
    _mapCurrentPath = MapSystem.findPath(locId, id);
    _renderMapPage();
    return;
  }

  _mapCurrentPath = null;

  const panel = document.getElementById("map-info-panel");
  if (panel)
    panel.innerHTML = _buildInfoPanel(MAP_REGIONS[id], player, locId, adjIds);

  document
    .querySelectorAll(".map-hex")
    .forEach((p) => p.classList.remove("map-hex-selected"));
  poly.classList.add("map-hex-selected");
}

// ── Info panel ────────────────────────────────────────────────────────────────
function _buildInfoPanel(region, player, locId, adjIds) {
  if (!region) {
    return `<div class="map-info-empty">Select a region to view details.</div>`;
  }

  const isCurrent = region.id === locId;
  const isAdjacent = adjIds.includes(region.id);
  const travelCheck = isAdjacent ? MapSystem.canTravel(region.id) : null;

  const typeLabel =
    {
      neutral: "Neutral",
      iron_dominion: "Iron Dominion",
      ashen_covenant: "Ashen Covenant",
      thornwood: "Thornwood",
      conflict: "Ruins of Valdros",
    }[region.type] || region.type;

  const dangerLabel =
    ["Safe", "Low", "Moderate", "High", "Extreme", "Lethal"][region.danger] ||
    `${region.danger}`;
  const dangerColor =
    ["#4a9e6b", "#8aa84a", "#c9a84c", "#c07830", "#c04040", "#9b1a1a"][
      region.danger
    ] || "#c9a84c";
  const tierStars =
    region.tier === 0
      ? "Starter"
      : "\u2605".repeat(region.tier) +
        "\u2606".repeat(Math.max(0, 5 - region.tier));

  let reqHtml = "";
  if (region.accessReq) {
    const req = region.accessReq;
    if (req.totalSkill != null) {
      const current = PlayerSystem.getTotalSkill();
      const met = current >= req.totalSkill;
      reqHtml = `<div class="map-info-req${met ? "" : " map-req-unmet"}">Total Skill: ${current} / ${req.totalSkill}</div>`;
    } else if (req.anyOf) {
      const parts = req.anyOf
        .map((r) => `${skillLabel(r.skill)} ${r.level}`)
        .join(" <em>or</em> ");
      const met = MapSystem.meetsReq(player, req);
      reqHtml = `<div class="map-info-req${met ? "" : " map-req-unmet"}">Requires: ${parts}</div>`;
    } else {
      const met = MapSystem.meetsReq(player, req);
      reqHtml = `<div class="map-info-req${met ? "" : " map-req-unmet"}">Requires: ${skillLabel(req.skill)} ${req.level}</div>`;
    }
  }

  const actHtml =
    region.activities && region.activities.length
      ? `<div class="map-info-activities">${region.activities
          .map((a) => `<span class="map-activity-chip">${a}</span>`)
          .join("")}</div>`
      : "";

  let travelHtml = "";
  if (isCurrent) {
    travelHtml = `<div class="map-info-here">You are here.</div>`;
  } else if (isAdjacent) {
    if (travelCheck.ok) {
      const cost = MapSystem.getTravelCost(region.id);
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
      const costLabel = `${costInfo.totalCost.toLocaleString()}g`;
      const stops = _mapCurrentPath.length - 1;
      const stopsStr =
        stops > 0 ? ` via ${stops} stop${stops > 1 ? "s" : ""}` : "";
      const canAfford = player.gold >= costInfo.totalCost;
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
    Log.add(result.reason, "danger");
    return;
  }
  _mapSelectedId = PlayerSystem.current.location;
  _mapCurrentPath = null;
  _renderMapPage();
}

function _mapTravelPath() {
  if (!_mapCurrentPath) return;
  const result = MapSystem.travelPath(_mapCurrentPath);
  if (!result.ok) {
    Log.add(result.reason, "danger");
    return;
  }
  _mapSelectedId = PlayerSystem.current.location;
  _mapCurrentPath = null;
  _renderMapPage();
}
