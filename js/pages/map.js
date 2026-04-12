// js/pages/map.js
// World map page — SVG hex grid + region info panel.

let _mapInitialized = false;

Router.register("map", function () {
  _renderMapPage();
});

// ── Region art ────────────────────────────────────────────────────────────────
const _MAP_REGION_ART = {
  // Valdros
  valdros_heart: "img/Ruins under a cosmic sky.png",
  // Dominion
  ironfront: "img/Fortress in the foggy wasteland.png",
  steelwarden: "img/Dark fortress on a war-torn horizon.png",
  forgecrest: "img/The grand forge of Alaia.png",
  hammerveil: "img/Twilight at the blacksmiths forge.png",
  ironhold: "img/Iron Dominion under fiery skies.png",
  // Covenant
  ashenmire: "img/City of spires and shadows.png",
  veilspire: "img/Twilight market in a gothic city.png",
  ashfall_city: "img/Volcanic ash over a gothic city.png",
  dusk_citadel: "img/Citadel at twilight with gathering forces.png",
  ashenveil: "img/Frontier city beneath the gas giant.png",
  // Thornwood
  thornhaven: "img/Enchanted village in the forest.png",
  deeproot_city: "img/Mystical city beneath the ancient tree.png",
  mosshaven: "img/Moss-covered town on the river.png",
  briarwall: "img/Fortress at the forest's edge.png",
  thornveil: "img/Thornwatch Fort at the wasteland's edge.png",
};

// ── Constants ─────────────────────────────────────────────────────────────────
const _MAP_HEX_SIZE = 48;
const _MAP_OFFSET_X = 80;
const _MAP_OFFSET_Y = 60;
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

// Cached content bounding box in SVG coordinate space
let _mapContentBounds = null;

function _getContentBounds() {
  if (_mapContentBounds) return _mapContentBounds;
  const regions = Object.values(MAP_REGIONS);
  if (!regions.length) return { minX: 0, maxX: 1000, minY: 0, maxY: 800 };

  const S = _MAP_HEX_SIZE,
    ox = _MAP_OFFSET_X,
    oy = _MAP_OFFSET_Y;
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const reg of regions) {
    const x = ox + S * (Math.sqrt(3) * reg.q + (Math.sqrt(3) / 2) * reg.r);
    const y = oy + S * 1.5 * reg.r;
    minX = Math.min(minX, x - S);
    maxX = Math.max(maxX, x + S);
    minY = Math.min(minY, y - S);
    maxY = Math.max(maxY, y + S);
  }
  _mapContentBounds = { minX, maxX, minY, maxY };
  return _mapContentBounds;
}

function _centerMapOnContent() {
  const { minX, maxX, minY, maxY } = _getContentBounds();
  const padding = 120;
  _mapView.x = minX - padding;
  _mapView.y = minY - padding;
  _mapView.width = maxX - minX + padding * 2;
  _mapView.height = maxY - minY + padding * 2;
}

// Return the effective pixel-to-SVG-unit scale for the current viewBox,
// accounting for preserveAspectRatio="xMidYMid meet" letterboxing.
function _getSvgScale() {
  const svg = document.querySelector(".map-svg");
  if (!svg) return 1;
  const r = svg.getBoundingClientRect();
  if (!r.width || !r.height) return 1;
  return Math.min(r.width / _mapView.width, r.height / _mapView.height);
}

// Convert a screen pixel position (relative to the page) to SVG user units.
function _screenToSvg(px, py) {
  const svg = document.querySelector(".map-svg");
  if (!svg) return { x: 0, y: 0 };
  const r = svg.getBoundingClientRect();
  const scale = _getSvgScale();
  const dispW = _mapView.width * scale;
  const dispH = _mapView.height * scale;
  const offX = (r.width - dispW) / 2;
  const offY = (r.height - dispH) / 2;
  return {
    x: _mapView.x + (px - r.left - offX) / scale,
    y: _mapView.y + (py - r.top - offY) / scale,
  };
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

  if (!_isDragging) {
    if (Math.hypot(dx, dy) < _DRAG_THRESHOLD) return;
    _isDragging = true;
    _wasDragging = true;
  }

  const scale = _getSvgScale();
  _mapView.x -= dx / scale;
  _mapView.y -= dy / scale;

  _dragStart.x = e.clientX;
  _dragStart.y = e.clientY;

  _clampMapView();
  _applyViewBox();
}

function _mapEndDrag() {
  _dragPending = false;
  _isDragging = false;
  setTimeout(() => {
    _wasDragging = false;
  }, 0);
}

function _clampMapView() {
  const { minX, maxX, minY, maxY } = _getContentBounds();
  const margin = 200;
  const contentW = maxX - minX;
  const contentH = maxY - minY;

  // Clamp zoom
  _mapView.width = Math.max(
    400,
    Math.min(_mapView.width, contentW + margin * 4),
  );
  _mapView.height = Math.max(
    300,
    Math.min(_mapView.height, contentH + margin * 4),
  );

  // Clamp pan — keep the viewBox center within margin of content
  const cx = Math.max(
    minX - margin,
    Math.min(_mapView.x + _mapView.width / 2, maxX + margin),
  );
  const cy = Math.max(
    minY - margin,
    Math.min(_mapView.y + _mapView.height / 2, maxY + margin),
  );
  _mapView.x = cx - _mapView.width / 2;
  _mapView.y = cy - _mapView.height / 2;
}

// Update the SVG viewBox attribute directly — avoids full page re-render for smooth pan/zoom.
function _applyViewBox() {
  const svg = document.querySelector(".map-svg");
  if (svg)
    svg.setAttribute(
      "viewBox",
      `${_mapView.x} ${_mapView.y} ${_mapView.width} ${_mapView.height}`,
    );
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
let _mapCurrentPath = null; // multi-tile BFS path to selected tile

// ── Main render ───────────────────────────────────────────────────────────────
function _renderMapPage() {
  if (!_mapInitialized) {
    _centerMapOnContent();
    _mapInitialized = true;
  }

  const el = document.getElementById("content-area");
  if (!el) return;

  const player = PlayerSystem.current;
  const locId = player.location;
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

  for (const [id, region] of Object.entries(MAP_REGIONS)) {
    const { x, y } = hexToPixel(region.q, region.r);
    const corners = hexCorners(x, y);

    const isCurrent = id === locId;
    const isAdjacent = adjIds.includes(id);
    const isSelected = id === _mapSelectedId;
    const canEnter = isAdjacent && MapSystem.canTravel(id).ok;
    const isLocked = isAdjacent && !canEnter;
    const isOnPath = !!(
      Array.isArray(_mapCurrentPath) && _mapCurrentPath.includes(id)
    );

    landMask.push(`<polygon points="${corners}" fill="white"/>`);

    const fillColor = _MAP_TYPE_FILLS[region.type] || "#1a1208";
    fills.push(
      `<polygon class="map-hex${isCurrent ? " map-hex-current" : ""}` +
        `${isSelected ? " map-hex-selected" : ""}" points="${corners}" ` +
        `fill="${fillColor}" data-region="${id}" style="cursor:pointer"/>`,
    );

    borders.push(
      `<polygon points="${corners}" fill="none" ` +
        `stroke="rgba(255,255,255,0.28)" stroke-width="0.8" ` +
        `stroke-dasharray="3,4" pointer-events="none"/>`,
    );

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

    // ── Faction quest exclamation marker (intro or main proving quest) ────────
    const _showMarkerForHex = (id === 'ironhold' && (_showIronholdIntroMarker() || _showMainQuestMarker('iron_dominion')))
      || (id === 'thornhaven' && (_showThornhavenIntroMarker() || _showMainQuestMarker('thornwood')))
      || (id === 'ashenmire' && (_showAshenmireIntroMarker() || _showMainQuestMarker('ashen_covenant')));
    if (_showMarkerForHex) {
      const mx = (x + S * 0.55).toFixed(1);
      const my = (y - S * 0.55).toFixed(1);
      labels.push(
        `<g class="map-quest-marker" pointer-events="none">` +
          `<circle cx="${mx}" cy="${my}" r="7" fill="#c9a84c" stroke="#3a2800" stroke-width="1.2"/>` +
          `<text x="${mx}" y="${(parseFloat(my) + 4.5).toFixed(1)}" text-anchor="middle" ` +
            `font-size="11" font-weight="bold" fill="#1a0e00" font-family="serif">!</text>` +
        `</g>`,
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
    <defs></defs>

    <rect width="100%" height="100%" fill="#1a1a1a"/>
    <g>${land}</g>
    ${fills.join("")}
    ${borders.join("")}
    ${glows.join("")}
    ${dots.join("")}
    ${labels.join("")}
</svg>
    `;
}

// ── Click handler ─────────────────────────────────────────────────────────────

function _mapZoom(e) {
  e.preventDefault();

  // Convert cursor position to SVG coords BEFORE scaling
  const svgPt = _screenToSvg(e.clientX, e.clientY);

  const factor = e.deltaY < 0 ? 0.9 : 1.1;
  _mapView.width *= factor;
  _mapView.height *= factor;

  // Recompute scale after dimension change, then pin the cursor SVG coord to
  // the same screen position.
  const svg = document.querySelector(".map-svg");
  if (svg) {
    const r = svg.getBoundingClientRect();
    const scale = Math.min(
      r.width / _mapView.width,
      r.height / _mapView.height,
    );
    const dispW = _mapView.width * scale;
    const dispH = _mapView.height * scale;
    const offX = (r.width - dispW) / 2;
    const offY = (r.height - dispH) / 2;
    _mapView.x = svgPt.x - (e.clientX - r.left - offX) / scale;
    _mapView.y = svgPt.y - (e.clientY - r.top - offY) / scale;
  }

  _clampMapView();
  _applyViewBox();
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
    if (region.id === "thornhaven") {
      travelHtml += `<button class="map-btn-enter-city" onclick="_openThornhavenCityMap()">Enter Thornhaven</button>`;
    }
    if (region.id === "ironhold") {
      travelHtml += `<button class="map-btn-enter-city map-btn-enter-iron" onclick="_openIronholdCityMap()">Enter Ironhold</button>`;
    }
    if (region.id === "ashenmire") {
      travelHtml += `<button class="map-btn-enter-city map-btn-enter-ash" onclick="_openAshenmireCityMap()">Enter Ashenmire</button>`;
    }
    if (region.id === "hammerveil") {
      travelHtml += `<button class="map-btn-enter-city map-btn-enter-iron" onclick="_openHammerveilCityMap()">Enter Hammerveil</button>`;
    }
    if (region.id === "forgecrest") {
      travelHtml += `<button class="map-btn-enter-city map-btn-enter-iron" onclick="_openForgecrestCityMap()">Enter Forgecrest</button>`;
    }
    if (region.id === "steelwarden") {
      travelHtml += `<button class="map-btn-enter-city map-btn-enter-iron" onclick="_openSteelwardenCityMap()">Enter Steelwarden</button>`;
    }
    if (region.id === "ironfront") {
      travelHtml += `<button class="map-btn-enter-city map-btn-enter-iron" onclick="_openIronfrontCityMap()">Enter Ironfront</button>`;
    }
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
            ${_MAP_REGION_ART[region.id] ? `<img src="${_MAP_REGION_ART[region.id]}" class="map-info-art" alt=""/>` : ""}
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

// ── Thornhaven city map ───────────────────────────────────────────────────────

function _openThornhavenCityMap() {
  if (document.getElementById("thornhaven-city-overlay")) return;
  const overlay = document.createElement("div");
  overlay.id = "thornhaven-city-overlay";
  overlay.className = "city-map-overlay";
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) _closeThornhavenCityMap();
  });
  overlay.innerHTML = `
    <div class="city-map-panel">
      <div class="city-map-header">
        <span>
          <span class="city-map-title">Thornhaven</span>
          <span class="city-map-subtitle">Click a building to enter</span>
        </span>
        <button class="city-map-close" onclick="_closeThornhavenCityMap()">✕</button>
      </div>
      <div class="city-map-svg-body">${_buildThornhavenSvg()}</div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay._keyHandler = function (e) {
    if (e.key === "Escape") _closeThornhavenCityMap();
  };
  document.addEventListener("keydown", overlay._keyHandler);
}

function _closeThornhavenCityMap() {
  const overlay = document.getElementById("thornhaven-city-overlay");
  if (!overlay) return;
  if (overlay._keyHandler)
    document.removeEventListener("keydown", overlay._keyHandler);
  overlay.remove();
}

function _cityNavigate(route) {
  _closeThornhavenCityMap();
  _closeIronholdCityMap();
  _closeAshenmireCityMap();
  _closeHammerveilCityMap();
  _closeForgecrestCityMap();
  _closeSteelwardenCityMap();
  _closeIronfrontCityMap();
  Router.navigate(route);
}

function _cityNavigateShrine() {
  _marketTab = "shrine";
  _cityNavigate("market");
}

// ── Ironhold city map ─────────────────────────────────────────────────────────

function _openIronholdCityMap() {
  if (document.getElementById("ironhold-city-overlay")) return;
  const overlay = document.createElement("div");
  overlay.id = "ironhold-city-overlay";
  overlay.className = "city-map-overlay";
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) _closeIronholdCityMap();
  });
  overlay.innerHTML = `
    <div class="city-map-panel">
      <div class="city-map-header">
        <span>
          <span class="city-map-title">Ironhold</span>
          <span class="city-map-subtitle">Click a building to enter</span>
        </span>
        <button class="city-map-close" onclick="_closeIronholdCityMap()">✕</button>
      </div>
      <div class="city-map-svg-body">${_buildIronholdSvg()}</div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay._keyHandler = function (e) {
    if (e.key === "Escape") _closeIronholdCityMap();
  };
  document.addEventListener("keydown", overlay._keyHandler);
}

function _closeIronholdCityMap() {
  const overlay = document.getElementById("ironhold-city-overlay");
  if (!overlay) return;
  if (overlay._keyHandler)
    document.removeEventListener("keydown", overlay._keyHandler);
  overlay.remove();
}

function _buildIronholdSvg() {
  // Top-down aerial view of Ironhold — a granite fortress.
  // Canvas 700×520.
  // Layer order: outer ground → outer walls → outer courtyard → courtyard roads
  //   → corner/mid towers → south gatehouse → inner keep walls → inner keep floor
  //   → keep corner towers → keep flag → buildings → labels.
  //
  // Outer walls:  rect(45,25) → (655,495)   wall thickness ≈22px
  // Outer court:  rect(67,47) → (633,473)
  // Inner keep:   rect(240,170) → (460,350)
  // Inner court:  rect(256,186) → (444,334)
  //
  // Outer quadrant centres (for outer buildings):
  //   NW (Crafting/Forge)   ≈ (153,108)
  //   NE (Market/Armory)    ≈ (547,108)
  //   SW (Training/Barracks)≈ (153,412)
  //   SE (Guilds/War Hall)  ≈ (547,412)
  //
  // Inner keep buildings:
  //   Shrine/Chapel  ≈ (286,232)
  //   Quests/Command ≈ (382,264)

  return `<svg viewBox="0 0 700 520" xmlns="http://www.w3.org/2000/svg">

  <!-- ── Outer ground (earth/moat approach) ───────────────── -->
  <rect width="700" height="520" fill="#434343"/>

  <!-- ── Outer wall body ───────────────────────────────────── -->
  <rect x="45" y="25" width="610" height="470" fill="#1a1a1a"/>

  <!-- ── Outer courtyard (flagstone) ──────────────────────── -->
  <rect x="67" y="47" width="566" height="426" fill="#4e4e4e"/>

  <!-- ── Courtyard road markings (main approach paths) ────── -->
  <rect x="344" y="47"  width="12" height="123" fill="#575757"/>
  <rect x="344" y="350" width="12" height="123" fill="#575757"/>
  <rect x="67"  y="254" width="173" height="12" fill="#575757"/>
  <rect x="460" y="254" width="173" height="12" fill="#575757"/>

  <!-- ── Corner towers (protruding 20px from wall face) ───── -->
  <rect x="25"  y="5"   width="40" height="40" fill="#141414"/>
  <rect x="635" y="5"   width="40" height="40" fill="#141414"/>
  <rect x="25"  y="475" width="40" height="40" fill="#141414"/>
  <rect x="635" y="475" width="40" height="40" fill="#141414"/>

  <!-- Corner tower inner details (slightly lighter square inset) -->
  <rect x="31"  y="11"  width="28" height="28" fill="#191919"/>
  <rect x="641" y="11"  width="28" height="28" fill="#191919"/>
  <rect x="31"  y="481" width="28" height="28" fill="#191919"/>
  <rect x="641" y="481" width="28" height="28" fill="#191919"/>

  <!-- ── Mid-wall towers ───────────────────────────────────── -->
  <rect x="330" y="7"   width="40" height="26" fill="#181818"/>
  <rect x="7"   y="234" width="26" height="40" fill="#181818"/>
  <rect x="667" y="234" width="26" height="40" fill="#181818"/>

  <!-- Mid-wall tower insets -->
  <rect x="336" y="12"  width="28" height="16" fill="#1e1e1e"/>
  <rect x="12"  y="240" width="16" height="28" fill="#1e1e1e"/>
  <rect x="672" y="240" width="16" height="28" fill="#1e1e1e"/>

  <!-- ── South gatehouse (main entrance) ──────────────────── -->
  <!-- Gate flanking towers -->
  <rect x="294" y="466" width="32" height="38" fill="#141414"/>
  <rect x="374" y="466" width="32" height="38" fill="#141414"/>
  <!-- Gate opening (road through south wall) -->
  <rect x="326" y="466" width="48" height="38" fill="#4e4e4e"/>
  <!-- Gate arch lintel -->
  <rect x="326" y="466" width="48" height="7"  fill="#191919"/>
  <!-- Approach road outside gate -->
  <rect x="338" y="495" width="24" height="25" fill="#3c3c3c"/>

  <!-- ── Inner keep walls ──────────────────────────────────── -->
  <rect x="240" y="170" width="220" height="180" fill="#191919"/>

  <!-- ── Inner keep courtyard ─────────────────────────────── -->
  <rect x="256" y="186" width="188" height="148" fill="#424242"/>

  <!-- Inner keep wall inner face lines (suggest stone depth) -->
  <rect x="252" y="182" width="196" height="2"  fill="#161616"/>
  <rect x="252" y="334" width="196" height="2"  fill="#161616"/>
  <rect x="252" y="182" width="2"   height="154" fill="#161616"/>
  <rect x="446" y="182" width="2"   height="154" fill="#161616"/>

  <!-- ── Inner keep corner towers (24×24) ─────────────────── -->
  <rect x="228" y="158" width="24" height="24" fill="#141414"/>
  <rect x="448" y="158" width="24" height="24" fill="#141414"/>
  <rect x="228" y="338" width="24" height="24" fill="#141414"/>
  <rect x="448" y="338" width="24" height="24" fill="#141414"/>

  <!-- Keep corner tower insets -->
  <rect x="232" y="162" width="16" height="16" fill="#1a1a1a"/>
  <rect x="452" y="162" width="16" height="16" fill="#1a1a1a"/>
  <rect x="232" y="342" width="16" height="16" fill="#1a1a1a"/>
  <rect x="452" y="342" width="16" height="16" fill="#1a1a1a"/>

  <!-- ══════════════════════════════════════════════════════ -->
  <!--  BUILDINGS — simple square footprints (roof / top-down) -->
  <!-- ══════════════════════════════════════════════════════ -->

  <rect x="118" y="90"  width="20" height="16" fill="#181818"/>
  <rect x="150" y="82"  width="16" height="14" fill="#1a1a1a"/>
  <rect x="180" y="96"  width="18" height="14" fill="#181818"/>
  <rect x="108" y="140" width="22" height="16" fill="#1a1a1a"/>
  <rect x="220" y="88"  width="14" height="14" fill="#181818"/>
  <!-- NE district filler -->
  <rect x="480" y="88"  width="20" height="16" fill="#181818"/>
  <rect x="514" y="80"  width="16" height="14" fill="#1a1a1a"/>
  <rect x="546" y="94"  width="18" height="14" fill="#181818"/>
  <rect x="500" y="140" width="22" height="16" fill="#1a1a1a"/>
  <!-- SW district filler -->
  <rect x="108" y="390" width="16" height="14" fill="#1a1a1a"/>
  <rect x="240" y="360" width="18" height="14" fill="#181818"/>
  <rect x="230" y="410" width="20" height="16" fill="#1a1a1a"/>
  <!-- SE district filler -->
  <rect x="470" y="358" width="18" height="14" fill="#181818"/>
  <rect x="556" y="376" width="16" height="16" fill="#1a1a1a"/>
  <rect x="540" y="420" width="20" height="14" fill="#181818"/>

  <!-- CRAFTING (The Forge) — NW outer quadrant -->
  <g class="city-building" onclick="_cityNavigate('crafting')" role="button" aria-label="Crafting">
    <rect x="136" y="96"  width="34" height="28" rx="1" fill="#1d1d1d"/>
    <rect x="140" y="99"  width="26" height="22" fill="#111111"/>
    <line x1="140" y1="110" x2="166" y2="110" stroke="#1b1b1b" stroke-width="1.5"/>
    <text x="153" y="87" text-anchor="middle" font-size="9" fill="#939393" font-family="Cinzel,serif" class="city-bldg-label">Crafting</text>
  </g>

  <!-- MARKET (The Armory) — NE outer quadrant -->
  <g class="city-building" onclick="_cityNavigate('market')" role="button" aria-label="Market">
    <rect x="530" y="96"  width="34" height="28" rx="1" fill="#1d1d1d"/>
    <rect x="534" y="99"  width="26" height="22" fill="#111111"/>
    <line x1="534" y1="110" x2="560" y2="110" stroke="#1b1b1b" stroke-width="1.5"/>
    <text x="547" y="87" text-anchor="middle" font-size="9" fill="#939393" font-family="Cinzel,serif" class="city-bldg-label">Market</text>
  </g>

  <!-- TRAINING (The Barracks) — SW outer quadrant -->
  <g class="city-building" onclick="_cityNavigate('skills')" role="button" aria-label="Training">
    <rect x="136" y="400" width="34" height="28" rx="1" fill="#1d1d1d"/>
    <rect x="140" y="403" width="26" height="22" fill="#111111"/>
    <line x1="140" y1="414" x2="166" y2="414" stroke="#1b1b1b" stroke-width="1.5"/>
    <text x="153" y="391" text-anchor="middle" font-size="9" fill="#939393" font-family="Cinzel,serif" class="city-bldg-label">Training</text>
  </g>

  <!-- GUILDS (War Council Hall) — SE outer quadrant -->
  <g class="city-building" onclick="_cityNavigate('guilds')" role="button" aria-label="Guild Hall">
    <rect x="530" y="400" width="34" height="28" rx="1" fill="#1d1d1d"/>
    <rect x="534" y="403" width="26" height="22" fill="#111111"/>
    <line x1="534" y1="414" x2="560" y2="414" stroke="#1b1b1b" stroke-width="1.5"/>
    <text x="547" y="391" text-anchor="middle" font-size="9" fill="#939393" font-family="Cinzel,serif" class="city-bldg-label">Guild Hall</text>
  </g>

  <!-- SHRINE (Iron Chapel) — inside keep, west side -->
  <g class="city-building" onclick="_cityNavigateShrine()" role="button" aria-label="Shrine">
    <rect x="270" y="220" width="28" height="24" rx="1" fill="#1d1d1d"/>
    <rect x="273" y="223" width="22" height="18" fill="#111111"/>
    <line x1="273" y1="232" x2="295" y2="232" stroke="#1b1b1b" stroke-width="1.5"/>
    <line x1="284" y1="223" x2="284" y2="241" stroke="#1b1b1b" stroke-width="1.5"/>
    <text x="284" y="212" text-anchor="middle" font-size="9" fill="#939393" font-family="Cinzel,serif" class="city-bldg-label">Shrine</text>
  </g>

  <!-- QUESTS (Command Post) — inside keep, east side, larger -->
  <g class="city-building" onclick="_cityNavigate('quests')" role="button" aria-label="Quests">
    <rect x="368" y="246" width="34" height="28" rx="1" fill="#1d1d1d"/>
    <rect x="372" y="249" width="26" height="22" fill="#111111"/>
    <line x1="372" y1="260" x2="398" y2="260" stroke="#1b1b1b" stroke-width="1.5"/>
    <text x="385" y="237" text-anchor="middle" font-size="9" fill="#939393" font-family="Cinzel,serif" class="city-bldg-label">Quests</text>
  </g>

  ${_showIronholdIntroMarker() ? `
  <!-- FACTION INTRO QUEST marker — south gatehouse entrance -->
  <g class="city-quest-marker" onclick="_openIronholdIntroDialogue()" role="button" aria-label="Quest available" style="cursor:pointer">
    <circle cx="350" cy="476" r="10" fill="#c9a84c" stroke="#1a0e00" stroke-width="1.5"/>
    <text x="350" y="481" text-anchor="middle" font-size="14" font-weight="bold" fill="#1a0e00" font-family="serif" pointer-events="none">!</text>
  </g>` : ''}

  ${_showIronholdBldgMarker('ironhold_intro_crafting') ? `
  <g class="city-quest-marker" onclick="_openIronholdBldgDialogue('ironhold_intro_crafting')" role="button" style="cursor:pointer">
    <circle cx="175" cy="83" r="8" fill="#c9a84c" stroke="#1a0e00" stroke-width="1.5"/>
    <text x="175" y="87" text-anchor="middle" font-size="12" font-weight="bold" fill="#1a0e00" font-family="serif" pointer-events="none">!</text>
  </g>` : ''}

  ${_showIronholdBldgMarker('ironhold_intro_market') ? `
  <g class="city-quest-marker" onclick="_openIronholdBldgDialogue('ironhold_intro_market')" role="button" style="cursor:pointer">
    <circle cx="569" cy="83" r="8" fill="#c9a84c" stroke="#1a0e00" stroke-width="1.5"/>
    <text x="569" y="87" text-anchor="middle" font-size="12" font-weight="bold" fill="#1a0e00" font-family="serif" pointer-events="none">!</text>
  </g>` : ''}

  ${_showIronholdBldgMarker('ironhold_intro_training') ? `
  <g class="city-quest-marker" onclick="_openIronholdBldgDialogue('ironhold_intro_training')" role="button" style="cursor:pointer">
    <circle cx="175" cy="386" r="8" fill="#c9a84c" stroke="#1a0e00" stroke-width="1.5"/>
    <text x="175" y="390" text-anchor="middle" font-size="12" font-weight="bold" fill="#1a0e00" font-family="serif" pointer-events="none">!</text>
  </g>` : ''}

  ${_showIronholdBldgMarker('ironhold_intro_guilds') ? `
  <g class="city-quest-marker" onclick="_openIronholdBldgDialogue('ironhold_intro_guilds')" role="button" style="cursor:pointer">
    <circle cx="569" cy="386" r="8" fill="#c9a84c" stroke="#1a0e00" stroke-width="1.5"/>
    <text x="569" y="390" text-anchor="middle" font-size="12" font-weight="bold" fill="#1a0e00" font-family="serif" pointer-events="none">!</text>
  </g>` : ''}

  ${_showIronholdBldgMarker('ironhold_intro_shrine') ? `
  <g class="city-quest-marker" onclick="_openIronholdBldgDialogue('ironhold_intro_shrine')" role="button" style="cursor:pointer">
    <circle cx="305" cy="210" r="8" fill="#c9a84c" stroke="#1a0e00" stroke-width="1.5"/>
    <text x="305" y="214" text-anchor="middle" font-size="12" font-weight="bold" fill="#1a0e00" font-family="serif" pointer-events="none">!</text>
  </g>` : ''}

  ${_showIronholdBldgMarker('ironhold_intro_quests') ? `
  <g class="city-quest-marker" onclick="_openIronholdBldgDialogue('ironhold_intro_quests')" role="button" style="cursor:pointer">
    <circle cx="409" cy="234" r="8" fill="#c9a84c" stroke="#1a0e00" stroke-width="1.5"/>
    <text x="409" y="238" text-anchor="middle" font-size="12" font-weight="bold" fill="#1a0e00" font-family="serif" pointer-events="none">!</text>
  </g>` : ''}

  ${_showMainQuestMarker('iron_dominion') ? `
  <!-- MAIN PROVING QUEST marker — inner courtyard, centre of map -->
  <g class="city-quest-marker" onclick="_openIronholdMainQuestDialogue()" role="button" aria-label="Proving quest" style="cursor:pointer">
    <circle cx="350" cy="260" r="12" fill="#e8c84c" stroke="#1a0e00" stroke-width="2"/>
    <text x="350" y="265" text-anchor="middle" font-size="16" font-weight="bold" fill="#1a0e00" font-family="serif" pointer-events="none">!</text>
  </g>` : ''}

</svg>`;
}

function _buildThornhavenSvg() {
  // Top-down aerial view of Thornhaven — a village of treehouses.
  // Canvas 700×520. Seven trees visible from above: six with buildings,
  // one large central hub. Rope bridges connect hub to each tree.
  // Ground (#525252) shows between canopy blobs.
  // Layer order: ground → bg trees → bridges → feature trees → trunks
  //              → branch stubs → platforms → buildings → labels.

  return `<svg viewBox="0 0 700 520" xmlns="http://www.w3.org/2000/svg">

  <!-- ── Ground / forest floor ──────────────────────────────── -->
  <rect width="700" height="520" fill="#525252"/>

  <!-- ── Background decorative trees (no buildings) ─────────── -->
  <ellipse cx="262" cy="148" rx="44" ry="40" fill="#2b2b2b"/>
  <ellipse cx="248" cy="140" rx="30" ry="27" fill="#272727"/>
  <ellipse cx="275" cy="155" rx="28" ry="25" fill="#2f2f2f"/>
  <ellipse cx="258" cy="130" rx="18" ry="16" fill="#323232"/>

  <ellipse cx="442" cy="142" rx="42" ry="38" fill="#2c2c2c"/>
  <ellipse cx="428" cy="135" rx="28" ry="26" fill="#282828"/>
  <ellipse cx="456" cy="148" rx="27" ry="25" fill="#303030"/>
  <ellipse cx="442" cy="128" rx="17" ry="15" fill="#343434"/>

  <ellipse cx="88"  cy="296" rx="40" ry="36" fill="#2b2b2b"/>
  <ellipse cx="76"  cy="288" rx="28" ry="25" fill="#272727"/>
  <ellipse cx="100" cy="302" rx="26" ry="23" fill="#2e2e2e"/>

  <ellipse cx="614" cy="290" rx="42" ry="38" fill="#2c2c2c"/>
  <ellipse cx="600" cy="282" rx="30" ry="27" fill="#282828"/>
  <ellipse cx="627" cy="296" rx="28" ry="25" fill="#303030"/>

  <ellipse cx="238" cy="464" rx="42" ry="37" fill="#2a2a2a"/>
  <ellipse cx="225" cy="456" rx="30" ry="26" fill="#272727"/>
  <ellipse cx="252" cy="470" rx="26" ry="23" fill="#2d2d2d"/>

  <ellipse cx="462" cy="462" rx="40" ry="36" fill="#2b2b2b"/>
  <ellipse cx="450" cy="455" rx="28" ry="25" fill="#272727"/>
  <ellipse cx="474" cy="468" rx="26" ry="23" fill="#2e2e2e"/>

  <!-- ── Rope bridges (hub→each feature tree, behind canopies) ─ -->
  <line x1="350" y1="285" x2="168" y2="200" stroke="#161616" stroke-width="2.5" stroke-dasharray="5,4"/>
  <line x1="350" y1="285" x2="158" y2="392" stroke="#161616" stroke-width="2.5" stroke-dasharray="5,4"/>
  <line x1="350" y1="285" x2="350" y2="92"  stroke="#161616" stroke-width="2.5" stroke-dasharray="5,4"/>
  <line x1="350" y1="285" x2="540" y2="200" stroke="#161616" stroke-width="2.5" stroke-dasharray="5,4"/>
  <line x1="350" y1="285" x2="548" y2="392" stroke="#161616" stroke-width="2.5" stroke-dasharray="5,4"/>
  <line x1="350" y1="285" x2="350" y2="462" stroke="#161616" stroke-width="2.5" stroke-dasharray="5,4"/>

  <!-- ── Feature trees (canopy seen from above) ─────────────── -->

  <!-- MARKET tree — cx=168, cy=200 -->
  <ellipse cx="168" cy="200" rx="64" ry="60" fill="#2d2d2d"/>
  <ellipse cx="148" cy="192" rx="46" ry="42" fill="#292929"/>
  <ellipse cx="185" cy="193" rx="44" ry="40" fill="#303030"/>
  <ellipse cx="160" cy="182" rx="32" ry="30" fill="#353535"/>
  <ellipse cx="176" cy="207" rx="26" ry="24" fill="#2a2a2a"/>

  <!-- TRAINING tree — cx=158, cy=392 -->
  <ellipse cx="158" cy="392" rx="62" ry="58" fill="#2d2d2d"/>
  <ellipse cx="138" cy="384" rx="44" ry="40" fill="#292929"/>
  <ellipse cx="175" cy="385" rx="42" ry="39" fill="#303030"/>
  <ellipse cx="150" cy="375" rx="30" ry="28" fill="#353535"/>
  <ellipse cx="168" cy="400" rx="25" ry="23" fill="#2a2a2a"/>

  <!-- SHRINE tree — cx=350, cy=92 -->
  <ellipse cx="350" cy="92"  rx="58" ry="54" fill="#2d2d2d"/>
  <ellipse cx="330" cy="85"  rx="42" ry="38" fill="#292929"/>
  <ellipse cx="368" cy="86"  rx="40" ry="37" fill="#303030"/>
  <ellipse cx="350" cy="75"  rx="30" ry="27" fill="#353535"/>
  <ellipse cx="340" cy="100" rx="23" ry="21" fill="#2a2a2a"/>

  <!-- HUB tree — cx=350, cy=285  (largest — central meeting point) -->
  <ellipse cx="350" cy="285" rx="80" ry="74" fill="#2c2c2c"/>
  <ellipse cx="324" cy="275" rx="58" ry="52" fill="#292929"/>
  <ellipse cx="373" cy="277" rx="55" ry="50" fill="#2f2f2f"/>
  <ellipse cx="348" cy="262" rx="40" ry="36" fill="#343434"/>
  <ellipse cx="362" cy="297" rx="34" ry="30" fill="#282828"/>
  <ellipse cx="334" cy="296" rx="28" ry="25" fill="#313131"/>

  <!-- GUILDS tree — cx=540, cy=200 -->
  <ellipse cx="540" cy="200" rx="62" ry="58" fill="#2d2d2d"/>
  <ellipse cx="520" cy="192" rx="44" ry="40" fill="#292929"/>
  <ellipse cx="557" cy="193" rx="42" ry="39" fill="#303030"/>
  <ellipse cx="532" cy="182" rx="30" ry="28" fill="#353535"/>
  <ellipse cx="549" cy="208" rx="25" ry="23" fill="#2a2a2a"/>

  <!-- CRAFTING tree — cx=548, cy=392 -->
  <ellipse cx="548" cy="392" rx="62" ry="58" fill="#2d2d2d"/>
  <ellipse cx="528" cy="384" rx="44" ry="40" fill="#292929"/>
  <ellipse cx="565" cy="385" rx="42" ry="39" fill="#303030"/>
  <ellipse cx="540" cy="375" rx="30" ry="28" fill="#353535"/>
  <ellipse cx="557" cy="400" rx="25" ry="23" fill="#2a2a2a"/>

  <!-- QUESTS tree — cx=350, cy=462 -->
  <ellipse cx="350" cy="462" rx="58" ry="52" fill="#2d2d2d"/>
  <ellipse cx="330" cy="455" rx="42" ry="38" fill="#292929"/>
  <ellipse cx="368" cy="456" rx="40" ry="37" fill="#303030"/>
  <ellipse cx="348" cy="446" rx="30" ry="27" fill="#353535"/>
  <ellipse cx="360" cy="470" rx="23" ry="21" fill="#2a2a2a"/>

  <!-- ── Trunk circles (small dark dot at each tree center) ──── -->
  <circle cx="168" cy="200" r="6" fill="#161616"/>
  <circle cx="158" cy="392" r="6" fill="#161616"/>
  <circle cx="350" cy="92"  r="6" fill="#161616"/>
  <circle cx="350" cy="285" r="8" fill="#141414"/>
  <circle cx="540" cy="200" r="6" fill="#161616"/>
  <circle cx="548" cy="392" r="6" fill="#161616"/>
  <circle cx="350" cy="462" r="6" fill="#161616"/>

  <!-- ══════════════════════════════════════════════════════════ -->
  <!--  BUILDINGS — each is a branch stub + wooden platform      -->
  <!--  + square building footprint (top-down / roof view)       -->
  <!-- ══════════════════════════════════════════════════════════ -->

  <!-- MARKET — branch goes NW from trunk -->
  <g class="city-building" onclick="_cityNavigate('market')" role="button" aria-label="Market">
    <line x1="168" y1="200" x2="136" y2="170" stroke="#1c1c1c" stroke-width="9" stroke-linecap="round"/>
    <rect x="120" y="161" width="32" height="22" rx="1" fill="#1e1e1e"/>
    <rect x="124" y="164" width="24" height="16" fill="#111111"/>
    <line x1="136" y1="164" x2="136" y2="180" stroke="#1b1b1b" stroke-width="1.5"/>
    <text x="136" y="152" text-anchor="middle" font-size="9" fill="#939393" font-family="Cinzel,serif" class="city-bldg-label">Market</text>
  </g>

  <!-- TRAINING — branch goes SW from trunk -->
  <g class="city-building" onclick="_cityNavigate('skills')" role="button" aria-label="Training">
    <line x1="158" y1="392" x2="124" y2="364" stroke="#1c1c1c" stroke-width="9" stroke-linecap="round"/>
    <rect x="108" y="355" width="32" height="22" rx="1" fill="#1e1e1e"/>
    <rect x="112" y="358" width="24" height="16" fill="#111111"/>
    <line x1="124" y1="358" x2="124" y2="374" stroke="#1b1b1b" stroke-width="1.5"/>
    <text x="124" y="346" text-anchor="middle" font-size="9" fill="#939393" font-family="Cinzel,serif" class="city-bldg-label">Training</text>
  </g>

  <!-- SHRINE — branch goes NE from trunk (avoids bridge overlap) -->
  <g class="city-building" onclick="_cityNavigateShrine()" role="button" aria-label="Shrine">
    <line x1="350" y1="92" x2="378" y2="62" stroke="#1c1c1c" stroke-width="9" stroke-linecap="round"/>
    <rect x="362" y="52" width="32" height="24" rx="1" fill="#1e1e1e"/>
    <rect x="366" y="55" width="24" height="18" fill="#111111"/>
    <line x1="378" y1="55" x2="378" y2="73" stroke="#1b1b1b" stroke-width="1.5"/>
    <line x1="366" y1="64" x2="390" y2="64" stroke="#1b1b1b" stroke-width="1.5"/>
    <text x="378" y="44" text-anchor="middle" font-size="9" fill="#939393" font-family="Cinzel,serif" class="city-bldg-label">Shrine</text>
  </g>

  <!-- GUILDS — branch goes NE from trunk -->
  <g class="city-building" onclick="_cityNavigate('guilds')" role="button" aria-label="Guild Hall">
    <line x1="540" y1="200" x2="572" y2="170" stroke="#1c1c1c" stroke-width="9" stroke-linecap="round"/>
    <rect x="556" y="161" width="32" height="22" rx="1" fill="#1e1e1e"/>
    <rect x="560" y="164" width="24" height="16" fill="#111111"/>
    <line x1="572" y1="164" x2="572" y2="180" stroke="#1b1b1b" stroke-width="1.5"/>
    <text x="572" y="152" text-anchor="middle" font-size="9" fill="#939393" font-family="Cinzel,serif" class="city-bldg-label">Guild Hall</text>
  </g>

  <!-- CRAFTING — branch goes SE from trunk -->
  <g class="city-building" onclick="_cityNavigate('crafting')" role="button" aria-label="Crafting">
    <line x1="548" y1="392" x2="578" y2="422" stroke="#1c1c1c" stroke-width="9" stroke-linecap="round"/>
    <rect x="562" y="413" width="32" height="22" rx="1" fill="#1e1e1e"/>
    <rect x="566" y="416" width="24" height="16" fill="#111111"/>
    <line x1="578" y1="416" x2="578" y2="432" stroke="#1b1b1b" stroke-width="1.5"/>
    <text x="578" y="404" text-anchor="middle" font-size="9" fill="#939393" font-family="Cinzel,serif" class="city-bldg-label">Crafting</text>
  </g>

  <!-- QUESTS — branch goes E from trunk -->
  <g class="city-building" onclick="_cityNavigate('quests')" role="button" aria-label="Quests">
    <line x1="350" y1="462" x2="390" y2="462" stroke="#1c1c1c" stroke-width="9" stroke-linecap="round"/>
    <rect x="382" y="453" width="32" height="22" rx="1" fill="#1e1e1e"/>
    <rect x="386" y="456" width="24" height="16" fill="#111111"/>
    <line x1="398" y1="456" x2="398" y2="472" stroke="#1b1b1b" stroke-width="1.5"/>
    <text x="398" y="444" text-anchor="middle" font-size="9" fill="#939393" font-family="Cinzel,serif" class="city-bldg-label">Quests</text>
  </g>

  ${_showThornhavenScoutMarker() ? `
  <g class="city-quest-marker" onclick="_openThornhavenIntroDialogue()" role="button" style="cursor:pointer">
    <circle cx="350" cy="505" r="10" fill="#c9a84c" stroke="#1a1200" stroke-width="1.5"/>
    <text x="350" y="510" text-anchor="middle" font-size="14" font-weight="bold" fill="#1a1200" font-family="serif" pointer-events="none">!</text>
  </g>` : ''}

  ${_showThornhavenBldgMarker('thornhaven_intro_market') ? `
  <g class="city-quest-marker" onclick="_openThornhavenBldgDialogue('thornhaven_intro_market')" role="button" style="cursor:pointer">
    <circle cx="110" cy="148" r="8" fill="#c9a84c" stroke="#1a1200" stroke-width="1.5"/>
    <text x="110" y="152" text-anchor="middle" font-size="12" font-weight="bold" fill="#1a1200" font-family="serif" pointer-events="none">!</text>
  </g>` : ''}

  ${_showThornhavenBldgMarker('thornhaven_intro_training') ? `
  <g class="city-quest-marker" onclick="_openThornhavenBldgDialogue('thornhaven_intro_training')" role="button" style="cursor:pointer">
    <circle cx="98" cy="342" r="8" fill="#c9a84c" stroke="#1a1200" stroke-width="1.5"/>
    <text x="98" y="346" text-anchor="middle" font-size="12" font-weight="bold" fill="#1a1200" font-family="serif" pointer-events="none">!</text>
  </g>` : ''}

  ${_showThornhavenBldgMarker('thornhaven_intro_shrine') ? `
  <g class="city-quest-marker" onclick="_openThornhavenBldgDialogue('thornhaven_intro_shrine')" role="button" style="cursor:pointer">
    <circle cx="403" cy="40" r="8" fill="#c9a84c" stroke="#1a1200" stroke-width="1.5"/>
    <text x="403" y="44" text-anchor="middle" font-size="12" font-weight="bold" fill="#1a1200" font-family="serif" pointer-events="none">!</text>
  </g>` : ''}

  ${_showThornhavenBldgMarker('thornhaven_intro_guilds') ? `
  <g class="city-quest-marker" onclick="_openThornhavenBldgDialogue('thornhaven_intro_guilds')" role="button" style="cursor:pointer">
    <circle cx="596" cy="148" r="8" fill="#c9a84c" stroke="#1a1200" stroke-width="1.5"/>
    <text x="596" y="152" text-anchor="middle" font-size="12" font-weight="bold" fill="#1a1200" font-family="serif" pointer-events="none">!</text>
  </g>` : ''}

  ${_showThornhavenBldgMarker('thornhaven_intro_crafting') ? `
  <g class="city-quest-marker" onclick="_openThornhavenBldgDialogue('thornhaven_intro_crafting')" role="button" style="cursor:pointer">
    <circle cx="602" cy="400" r="8" fill="#c9a84c" stroke="#1a1200" stroke-width="1.5"/>
    <text x="602" y="404" text-anchor="middle" font-size="12" font-weight="bold" fill="#1a1200" font-family="serif" pointer-events="none">!</text>
  </g>` : ''}

  ${_showThornhavenBldgMarker('thornhaven_intro_quests') ? `
  <g class="city-quest-marker" onclick="_openThornhavenBldgDialogue('thornhaven_intro_quests')" role="button" style="cursor:pointer">
    <circle cx="422" cy="440" r="8" fill="#c9a84c" stroke="#1a1200" stroke-width="1.5"/>
    <text x="422" y="444" text-anchor="middle" font-size="12" font-weight="bold" fill="#1a1200" font-family="serif" pointer-events="none">!</text>
  </g>` : ''}

  ${_showMainQuestMarker('thornwood') ? `
  <!-- MAIN PROVING QUEST marker — central hub platform -->
  <g class="city-quest-marker" onclick="_openThornhavenMainQuestDialogue()" role="button" aria-label="Proving quest" style="cursor:pointer">
    <circle cx="350" cy="260" r="12" fill="#e8c84c" stroke="#1a1200" stroke-width="2"/>
    <text x="350" y="265" text-anchor="middle" font-size="16" font-weight="bold" fill="#1a1200" font-family="serif" pointer-events="none">!</text>
  </g>` : ''}

</svg>`;
}

// ── Ashenmire city map ────────────────────────────────────────────────────────

function _openAshenmireCityMap() {
  if (document.getElementById("ashenmire-city-overlay")) return;
  const overlay = document.createElement("div");
  overlay.id = "ashenmire-city-overlay";
  overlay.className = "city-map-overlay";
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) _closeAshenmireCityMap();
  });
  overlay.innerHTML = `
    <div class="city-map-panel">
      <div class="city-map-header">
        <span>
          <span class="city-map-title">Ashenmire</span>
          <span class="city-map-subtitle">Click a building to enter</span>
        </span>
        <button class="city-map-close" onclick="_closeAshenmireCityMap()">✕</button>
      </div>
      <div class="city-map-svg-body">${_buildAshenmireSvg()}</div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay._keyHandler = function (e) {
    if (e.key === "Escape") _closeAshenmireCityMap();
  };
  document.addEventListener("keydown", overlay._keyHandler);
}

function _closeAshenmireCityMap() {
  const overlay = document.getElementById("ashenmire-city-overlay");
  if (!overlay) return;
  if (overlay._keyHandler)
    document.removeEventListener("keydown", overlay._keyHandler);
  overlay.remove();
}

function _buildAshenmireSvg() {
  // Top-down aerial view of Ashenmire — arcane city of the Ashen Covenant.
  // Canvas 700×520. The city has a radial plan: a large central Spire
  // surrounded by two concentric ring walls with six districts between them.
  // Ash-covered streets radiate outward like spokes from the Spire.
  //
  // Colors: ash ground #464646, ring walls #1a1a1a, inner district #3e3e3e,
  //         outer district #484848, buildings #111111, spire core #0e0e0e.
  //
  // Centre: cx=350, cy=260.
  // Inner ring wall: r≈90   (inner sanctum boundary)
  // Outer ring wall: r≈190  (city perimeter)
  //
  // Six spoke roads radiate from centre at 0°,60°,120°,180°,240°,300°.
  //
  // Six clickable buildings, one in each outer district sector:
  //   N  (top)        → Quests    (Archivum)
  //   NE              → Market    (Alchemists' Exchange)
  //   SE              → Crafting  (Scriptorum)
  //   S  (bottom)     → Training  (Sanctum of Forms)
  //   SW              → Guilds    (Covenant Conclave)
  //   NW              → Shrine    (Ossuary Spire)
  //
  // Central Spire (non-clickable, decorative landmark).

  const cx = 350,
    cy = 260;

  // Spoke road endpoints (radiate outward, 6 directions, 60° apart)
  // Angles: 270°=N, 330°=NE, 30°=SE, 90°=S, 150°=SW, 210°=NW
  function spoke(deg, r) {
    const rad = ((deg - 90) * Math.PI) / 180;
    return {
      x: +(cx + r * Math.cos(rad)).toFixed(1),
      y: +(cy + r * Math.sin(rad)).toFixed(1),
    };
  }

  const dirs = [0, 60, 120, 180, 240, 300]; // degrees (N=0, clockwise)
  const outerR = 195,
    innerR = 88,
    spokeEnd = outerR + 2;

  // Building positions: midpoint of each outer sector, r≈145
  const bldgR = 145;
  const bldgDefs = [
    { deg: 0, route: "quests", label: "Quests" },
    { deg: 60, route: "market", label: "Market" },
    { deg: 120, route: "crafting", label: "Crafting" },
    { deg: 180, route: "skills", label: "Training" },
    { deg: 240, route: "guilds", label: "Guild Hall" },
    { deg: 300, route: "__shrine__", label: "Shrine" },
  ];

  // Build spoke lines
  const spokeLines = dirs
    .map((d) => {
      const inner = spoke(d, innerR);
      const outer = spoke(d, spokeEnd);
      return `<line x1="${inner.x}" y1="${inner.y}" x2="${outer.x}" y2="${outer.y}" stroke="#3a3a3a" stroke-width="12"/>`;
    })
    .join("\n  ");

  // Build buildings
  const buildings = bldgDefs
    .map((b) => {
      const pos = spoke(b.deg, bldgR);
      const half = 13; // half building size
      const bx = +(pos.x - half).toFixed(1);
      const by = +(pos.y - half).toFixed(1);
      const bw = 26,
        bh = 26;
      // Ridge lines: both diagonals from corner to corner
      const x1 = bx,
        y1 = by,
        x2 = +(bx + bw).toFixed(1),
        y2 = +(by + bh).toFixed(1);
      // Label: offset slightly outward from building centre
      const lblPos = spoke(b.deg, bldgR + 24);
      // Anchor: use text-anchor based on horizontal position
      const anchor =
        pos.x < cx - 20 ? "end" : pos.x > cx + 20 ? "start" : "middle";
      return `
  <g class="city-building" onclick="${b.route === "__shrine__" ? "_cityNavigateShrine()" : `_cityNavigate('${b.route}')`}" role="button" aria-label="${b.label}">
    <rect x="${+(pos.x - half - 3).toFixed(1)}" y="${+(pos.y - half - 3).toFixed(1)}" width="${bw + 6}" height="${bh + 6}" rx="1" fill="#1d1d1d"/>
    <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="#111111"/>
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#1b1b1b" stroke-width="1.5"/>
    <line x1="${x2}" y1="${y1}" x2="${x1}" y2="${y2}" stroke="#1b1b1b" stroke-width="1.5"/>
    <text x="${lblPos.x.toFixed(1)}" y="${+(lblPos.y + 3).toFixed(1)}" text-anchor="${anchor}" font-size="9" fill="#939393" font-family="Cinzel,serif" class="city-bldg-label">${b.label}</text>
  </g>`;
    })
    .join("");

  return `<svg viewBox="0 0 700 520" xmlns="http://www.w3.org/2000/svg">

  <!-- ── Ash ground ──────────────────────────────────────────── -->
  <rect width="700" height="520" fill="#464646"/>

  <!-- ── Outer ring (city perimeter wall, filled disc) ────────── -->
  <circle cx="${cx}" cy="${cy}" r="${outerR + 14}" fill="#1a1a1a"/>

  <!-- ── Outer district (ash streets between ring walls) ──────── -->
  <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="#484848"/>

  <!-- ── Spoke roads through outer district ───────────────────── -->
  ${spokeLines}

  <!-- ── Inner ring wall ───────────────────────────────────────── -->
  <circle cx="${cx}" cy="${cy}" r="${innerR + 12}" fill="#1a1a1a"/>

  <!-- ── Inner sanctum floor ───────────────────────────────────── -->
  <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="#3c3c3c"/>

  <!-- ── Inner sanctum radial details (faint arc divisions) ────── -->
  ${dirs
    .map((d) => {
      const p = spoke(d, innerR);
      return `<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="#333333" stroke-width="1.5"/>`;
    })
    .join("\n  ")}

  <!-- ── Central Spire (decorative — the Archspire of Ashenmire) ── -->
  <!-- Outer spire base ring -->
  <circle cx="${cx}" cy="${cy}" r="32" fill="#161616"/>
  <!-- Spire body (octagon approximated by circle) -->
  <circle cx="${cx}" cy="${cy}" r="22" fill="#0f0f0f"/>
  <!-- Spire inner glow suggestion (very subtle) -->
  <circle cx="${cx}" cy="${cy}" r="12" fill="#131313"/>
  <circle cx="${cx}" cy="${cy}" r="5"  fill="#0c0c0c"/>
  <!-- Four cardinal buttresses radiating from spire base -->
  ${[0, 90, 180, 270]
    .map((d) => {
      const near = spoke(d, 22);
      const far = spoke(d, 34);
      return `<line x1="${near.x}" y1="${near.y}" x2="${far.x}" y2="${far.y}" stroke="#141414" stroke-width="6" stroke-linecap="round"/>`;
    })
    .join("\n  ")}

  <!-- ══════════════════════════════════════════════════════════ -->
  <!--  BUILDINGS — six outer district buildings, one per sector  -->
  <!-- ══════════════════════════════════════════════════════════ -->
  ${buildings}

  ${_showAshenmireSentinelMarker() ? `
  <g class="city-quest-marker" onclick="_openAshenmireIntroDialogue()" role="button" style="cursor:pointer">
    <circle cx="350" cy="476" r="10" fill="#c9a84c" stroke="#060e1e" stroke-width="1.5"/>
    <text x="350" y="481" text-anchor="middle" font-size="14" font-weight="bold" fill="#060e1e" font-family="serif" pointer-events="none">!</text>
  </g>` : ''}

  ${_showAshenmireBldgMarker('ashenmire_intro_quests') ? `
  <g class="city-quest-marker" onclick="_openAshenmireBldgDialogue('ashenmire_intro_quests')" role="button" style="cursor:pointer">
    <circle cx="368" cy="98" r="8" fill="#c9a84c" stroke="#060e1e" stroke-width="1.5"/>
    <text x="368" y="102" text-anchor="middle" font-size="12" font-weight="bold" fill="#060e1e" font-family="serif" pointer-events="none">!</text>
  </g>` : ''}

  ${_showAshenmireBldgMarker('ashenmire_intro_market') ? `
  <g class="city-quest-marker" onclick="_openAshenmireBldgDialogue('ashenmire_intro_market')" role="button" style="cursor:pointer">
    <circle cx="498" cy="170" r="8" fill="#c9a84c" stroke="#060e1e" stroke-width="1.5"/>
    <text x="498" y="174" text-anchor="middle" font-size="12" font-weight="bold" fill="#060e1e" font-family="serif" pointer-events="none">!</text>
  </g>` : ''}

  ${_showAshenmireBldgMarker('ashenmire_intro_crafting') ? `
  <g class="city-quest-marker" onclick="_openAshenmireBldgDialogue('ashenmire_intro_crafting')" role="button" style="cursor:pointer">
    <circle cx="498" cy="346" r="8" fill="#c9a84c" stroke="#060e1e" stroke-width="1.5"/>
    <text x="498" y="350" text-anchor="middle" font-size="12" font-weight="bold" fill="#060e1e" font-family="serif" pointer-events="none">!</text>
  </g>` : ''}

  ${_showAshenmireBldgMarker('ashenmire_intro_training') ? `
  <g class="city-quest-marker" onclick="_openAshenmireBldgDialogue('ashenmire_intro_training')" role="button" style="cursor:pointer">
    <circle cx="368" cy="422" r="8" fill="#c9a84c" stroke="#060e1e" stroke-width="1.5"/>
    <text x="368" y="426" text-anchor="middle" font-size="12" font-weight="bold" fill="#060e1e" font-family="serif" pointer-events="none">!</text>
  </g>` : ''}

  ${_showAshenmireBldgMarker('ashenmire_intro_guilds') ? `
  <g class="city-quest-marker" onclick="_openAshenmireBldgDialogue('ashenmire_intro_guilds')" role="button" style="cursor:pointer">
    <circle cx="202" cy="346" r="8" fill="#c9a84c" stroke="#060e1e" stroke-width="1.5"/>
    <text x="202" y="350" text-anchor="middle" font-size="12" font-weight="bold" fill="#060e1e" font-family="serif" pointer-events="none">!</text>
  </g>` : ''}

  ${_showAshenmireBldgMarker('ashenmire_intro_shrine') ? `
  <g class="city-quest-marker" onclick="_openAshenmireBldgDialogue('ashenmire_intro_shrine')" role="button" style="cursor:pointer">
    <circle cx="202" cy="170" r="8" fill="#c9a84c" stroke="#060e1e" stroke-width="1.5"/>
    <text x="202" y="174" text-anchor="middle" font-size="12" font-weight="bold" fill="#060e1e" font-family="serif" pointer-events="none">!</text>
  </g>` : ''}

  ${_showMainQuestMarker('ashen_covenant') ? `
  <!-- MAIN PROVING QUEST marker — central plaza -->
  <g class="city-quest-marker" onclick="_openAshenmireMainQuestDialogue()" role="button" aria-label="Proving quest" style="cursor:pointer">
    <circle cx="350" cy="260" r="12" fill="#e8c84c" stroke="#060e1e" stroke-width="2"/>
    <text x="350" y="265" text-anchor="middle" font-size="16" font-weight="bold" fill="#060e1e" font-family="serif" pointer-events="none">!</text>
  </g>` : ''}

</svg>`;
}

// ── Hammerveil city map ───────────────────────────────────────────────────────

function _openHammerveilCityMap() {
  if (document.getElementById("hammerveil-city-overlay")) return;
  const overlay = document.createElement("div");
  overlay.id = "hammerveil-city-overlay";
  overlay.className = "city-map-overlay";
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) _closeHammerveilCityMap();
  });
  overlay.innerHTML = `
    <div class="city-map-panel">
      <div class="city-map-header">
        <span>
          <span class="city-map-title">Hammerveil</span>
          <span class="city-map-subtitle">Click a building to enter</span>
        </span>
        <button class="city-map-close" onclick="_closeHammerveilCityMap()">✕</button>
      </div>
      <div class="city-map-svg-body">${_buildHammerveilSvg()}</div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay._keyHandler = function (e) {
    if (e.key === "Escape") _closeHammerveilCityMap();
  };
  document.addEventListener("keydown", overlay._keyHandler);
}

function _closeHammerveilCityMap() {
  const overlay = document.getElementById("hammerveil-city-overlay");
  if (!overlay) return;
  if (overlay._keyHandler)
    document.removeEventListener("keydown", overlay._keyHandler);
  overlay.remove();
}

function _buildHammerveilSvg() {
  // Top-down aerial view of Hammerveil — an Iron Dominion armament town.
  // Canvas 700×520. A palisade-walled village with a central cobblestone
  // square, four roads branching to the four districts, and five buildings.
  // No shrine. Five clickable buildings:
  //   NW district → Training (Barracks)
  //   NE district → Market  (Supply Stalls)
  //   SW district → Crafting (The Forge — largest building)
  //   SE district → Guild Hall
  //   Centre      → Quests  (Town Hall, in the main square)
  //
  // Palisade interior: (62,42) → (638,478)
  // Central square:    (264,180) → (436,316)
  // Roads connect square to palisade in all four cardinal directions.

  return `<svg viewBox="0 0 700 520" xmlns="http://www.w3.org/2000/svg">

  <!-- ── Outer fields ──────────────────────────────────────── -->
  <rect width="700" height="520" fill="#434343"/>

  <!-- ── Palisade interior (packed earth / cobblestone) ────── -->
  <rect x="62" y="42" width="576" height="436" fill="#4a4a4a"/>

  <!-- ── Roads (slightly lighter dirt tracks) ─────────────── -->
  <!-- N road: square top → N palisade -->
  <rect x="336" y="42"  width="28" height="138" fill="#545454"/>
  <!-- S road: square bottom → S palisade -->
  <rect x="336" y="316" width="28" height="164" fill="#545454"/>
  <!-- W road: W palisade → square left -->
  <rect x="62"  y="238" width="202" height="28" fill="#545454"/>
  <!-- E road: square right → E palisade -->
  <rect x="436" y="238" width="202" height="28" fill="#545454"/>

  <!-- ── Palisade wall (outline, drawn over interior) ──────── -->
  <rect x="62" y="42" width="576" height="436" fill="none" stroke="#181818" stroke-width="10"/>

  <!-- ── Corner towers ─────────────────────────────────────── -->
  <rect x="50"  y="30"  width="22" height="22" fill="#141414"/>
  <rect x="628" y="30"  width="22" height="22" fill="#141414"/>
  <rect x="50"  y="448" width="22" height="22" fill="#141414"/>
  <rect x="628" y="448" width="22" height="22" fill="#141414"/>

  <!-- ── Gate tower pairs (flanking each road opening) ─────── -->
  <!-- N gate -->
  <rect x="322" y="34"  width="14" height="18" fill="#181818"/>
  <rect x="364" y="34"  width="14" height="18" fill="#181818"/>
  <!-- S gate -->
  <rect x="322" y="448" width="14" height="18" fill="#181818"/>
  <rect x="364" y="448" width="14" height="18" fill="#181818"/>
  <!-- W gate -->
  <rect x="44"  y="228" width="18" height="14" fill="#181818"/>
  <rect x="44"  y="258" width="18" height="14" fill="#181818"/>
  <!-- E gate -->
  <rect x="638" y="228" width="18" height="14" fill="#181818"/>
  <rect x="638" y="258" width="18" height="14" fill="#181818"/>

  <!-- ── Central cobblestone square ───────────────────────── -->
  <rect x="264" y="180" width="172" height="136" fill="#565656"/>
  <!-- Square border lines (suggest individual cobblestone slabs) -->
  <rect x="264" y="180" width="172" height="136" fill="none" stroke="#4a4a4a" stroke-width="2"/>
  <line x1="264" y1="248" x2="436" y2="248" stroke="#4e4e4e" stroke-width="1.5"/>
  <line x1="350" y1="180" x2="350" y2="316" stroke="#4e4e4e" stroke-width="1.5"/>

  <!-- ── Forge yard (open work area behind crafting building) ─ -->
  <rect x="108" y="342" width="116" height="88" fill="#484848"/>
  <rect x="108" y="342" width="116" height="88" fill="none" stroke="#3e3e3e" stroke-width="1.5"/>

  <!-- ── Decorative small buildings (non-clickable houses) ─── -->
  <!-- NW district filler -->
  <rect x="118" y="90"  width="20" height="16" fill="#181818"/>
  <rect x="150" y="82"  width="16" height="14" fill="#1a1a1a"/>
  <rect x="180" y="96"  width="18" height="14" fill="#181818"/>
  <rect x="108" y="140" width="22" height="16" fill="#1a1a1a"/>
  <rect x="220" y="88"  width="14" height="14" fill="#181818"/>
  <!-- NE district filler -->
  <rect x="480" y="88"  width="20" height="16" fill="#181818"/>
  <rect x="514" y="80"  width="16" height="14" fill="#1a1a1a"/>
  <rect x="546" y="94"  width="18" height="14" fill="#181818"/>
  <rect x="500" y="140" width="22" height="16" fill="#1a1a1a"/>
  <!-- SW district filler -->
  <rect x="108" y="390" width="16" height="14" fill="#1a1a1a"/>
  <rect x="240" y="360" width="18" height="14" fill="#181818"/>
  <rect x="230" y="410" width="20" height="16" fill="#1a1a1a"/>
  <!-- SE district filler -->
  <rect x="470" y="358" width="18" height="14" fill="#181818"/>
  <rect x="556" y="376" width="16" height="16" fill="#1a1a1a"/>
  <rect x="540" y="420" width="20" height="14" fill="#181818"/>

  <!-- ══════════════════════════════════════════════════════ -->
  <!--  BUILDINGS (clickable)                                -->
  <!-- ══════════════════════════════════════════════════════ -->

  <!-- TRAINING (Barracks) — NW district -->
  <g class="city-building" onclick="_cityNavigate('skills')" role="button" aria-label="Training">
    <rect x="150" y="112" width="40" height="30" rx="1" fill="#1d1d1d"/>
    <rect x="154" y="115" width="32" height="24" fill="#111111"/>
    <line x1="154" y1="127" x2="186" y2="127" stroke="#1b1b1b" stroke-width="1.5"/>
    <text x="170" y="103" text-anchor="middle" font-size="9" fill="#939393" font-family="Cinzel,serif" class="city-bldg-label">Training</text>
  </g>

  <!-- MARKET (Supply Stalls) — NE district -->
  <g class="city-building" onclick="_cityNavigate('market')" role="button" aria-label="Market">
    <rect x="468" y="112" width="40" height="30" rx="1" fill="#1d1d1d"/>
    <rect x="472" y="115" width="32" height="24" fill="#111111"/>
    <line x1="472" y1="127" x2="504" y2="127" stroke="#1b1b1b" stroke-width="1.5"/>
    <text x="488" y="103" text-anchor="middle" font-size="9" fill="#939393" font-family="Cinzel,serif" class="city-bldg-label">Market</text>
  </g>

  <!-- CRAFTING (The Forge) — SW district, largest building -->
  <g class="city-building" onclick="_cityNavigate('crafting')" role="button" aria-label="Crafting">
    <rect x="126" y="356" width="52" height="38" rx="1" fill="#1d1d1d"/>
    <rect x="130" y="360" width="44" height="30" fill="#111111"/>
    <line x1="130" y1="375" x2="174" y2="375" stroke="#1b1b1b" stroke-width="1.5"/>
    <line x1="152" y1="360" x2="152" y2="390" stroke="#1b1b1b" stroke-width="1.5"/>
    <text x="152" y="346" text-anchor="middle" font-size="9" fill="#939393" font-family="Cinzel,serif" class="city-bldg-label">Crafting</text>
  </g>

  <!-- GUILD HALL — SE district -->
  <g class="city-building" onclick="_cityNavigate('guilds')" role="button" aria-label="Guild Hall">
    <rect x="468" y="370" width="42" height="30" rx="1" fill="#1d1d1d"/>
    <rect x="472" y="374" width="34" height="22" fill="#111111"/>
    <line x1="472" y1="385" x2="506" y2="385" stroke="#1b1b1b" stroke-width="1.5"/>
    <text x="489" y="360" text-anchor="middle" font-size="9" fill="#939393" font-family="Cinzel,serif" class="city-bldg-label">Guild Hall</text>
  </g>

  <!-- QUESTS (Town Hall) — centre of main square -->
  <g class="city-building" onclick="_cityNavigate('quests')" role="button" aria-label="Quests">
    <rect x="320" y="218" width="60" height="42" rx="1" fill="#1d1d1d"/>
    <rect x="324" y="222" width="52" height="34" fill="#111111"/>
    <line x1="324" y1="239" x2="376" y2="239" stroke="#1b1b1b" stroke-width="1.5"/>
    <line x1="350" y1="222" x2="350" y2="256" stroke="#1b1b1b" stroke-width="1.5"/>
    <text x="350" y="208" text-anchor="middle" font-size="9" fill="#939393" font-family="Cinzel,serif" class="city-bldg-label">Quests</text>
  </g>

</svg>`;
}

function _openForgecrestCityMap() {
  if (document.getElementById("forgecrest-city-overlay")) return;
  const overlay = document.createElement("div");
  overlay.id = "forgecrest-city-overlay";
  overlay.className = "city-map-overlay";
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) _closeForgecrestCityMap();
  });
  overlay.innerHTML = `
    <div class="city-map-panel">
      <div class="city-map-header">
        <span>
          <span class="city-map-title">Forgecrest</span>
          <span class="city-map-subtitle">Click a building to enter</span>
        </span>
        <button class="city-map-close" onclick="_closeForgecrestCityMap()">✕</button>
      </div>
      <div class="city-map-svg-body">${_buildForgecrestSvg()}</div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay._keyHandler = function (e) {
    if (e.key === "Escape") _closeForgecrestCityMap();
  };
  document.addEventListener("keydown", overlay._keyHandler);
}
function _closeForgecrestCityMap() {
  const overlay = document.getElementById("forgecrest-city-overlay");
  if (!overlay) return;
  if (overlay._keyHandler)
    document.removeEventListener("keydown", overlay._keyHandler);
  overlay.remove();
}
function _buildForgecrestSvg() {
  // Top-down aerial view of Forgecrest — the Dominion's second city, famed for
  // its weapon smiths. Canvas 700×520. Heavier stone walls than Hammerveil.
  // A large forge complex dominates the southern half (decorative, non-clickable).
  // Three clickable buildings:
  //   NW district → Training (Barracks)
  //   NE district → Market  (Trade Quarter)
  //   Centre      → Quests  (Command Hall, prominent, in central plaza)
  // No shrine, crafting, or guild hall.

  return `<svg viewBox="0 0 700 520" xmlns="http://www.w3.org/2000/svg">

  <!-- ── Outer ground ──────────────────────────────────────── -->
  <rect width="700" height="520" fill="#3e3e3e"/>

  <!-- ── City interior (packed stone) ─────────────────────── -->
  <rect x="50" y="28" width="600" height="464" fill="#494949"/>

  <!-- ── Roads ─────────────────────────────────────────────── -->
  <rect x="336" y="28"  width="28" height="164" fill="#525252"/>
  <rect x="336" y="312" width="28" height="180" fill="#525252"/>
  <rect x="50"  y="240" width="222" height="28" fill="#525252"/>
  <rect x="428" y="240" width="222" height="28" fill="#525252"/>

  <!-- ── Stone walls ────────────────────────────────────────── -->
  <rect x="50" y="28" width="600" height="464" fill="none" stroke="#161616" stroke-width="16"/>
  <rect x="58" y="36" width="584" height="448" fill="none" stroke="#1e1e1e" stroke-width="2"/>

  <!-- ── Corner towers ─────────────────────────────────────── -->
  <rect x="35"  y="13"  width="30" height="30" fill="#141414"/>
  <rect x="35"  y="13"  width="30" height="30" fill="none" stroke="#0e0e0e" stroke-width="2"/>
  <rect x="635" y="13"  width="30" height="30" fill="#141414"/>
  <rect x="635" y="13"  width="30" height="30" fill="none" stroke="#0e0e0e" stroke-width="2"/>
  <rect x="35"  y="477" width="30" height="30" fill="#141414"/>
  <rect x="35"  y="477" width="30" height="30" fill="none" stroke="#0e0e0e" stroke-width="2"/>
  <rect x="635" y="477" width="30" height="30" fill="#141414"/>
  <rect x="635" y="477" width="30" height="30" fill="none" stroke="#0e0e0e" stroke-width="2"/>

  <!-- ── Gate tower pairs ───────────────────────────────────── -->
  <rect x="318" y="20"  width="18" height="22" fill="#181818"/>
  <rect x="364" y="20"  width="18" height="22" fill="#181818"/>
  <rect x="318" y="458" width="18" height="22" fill="#181818"/>
  <rect x="364" y="458" width="18" height="22" fill="#181818"/>
  <rect x="40"  y="228" width="22" height="18" fill="#181818"/>
  <rect x="40"  y="258" width="22" height="18" fill="#181818"/>
  <rect x="638" y="228" width="22" height="18" fill="#181818"/>
  <rect x="638" y="258" width="22" height="18" fill="#181818"/>

  <!-- ── Central plaza ──────────────────────────────────────── -->
  <rect x="272" y="192" width="156" height="120" fill="#575757"/>
  <rect x="272" y="192" width="156" height="120" fill="none" stroke="#474747" stroke-width="2"/>
  <line x1="272" y1="252" x2="428" y2="252" stroke="#4e4e4e" stroke-width="1.5"/>
  <line x1="350" y1="192" x2="350" y2="312" stroke="#4e4e4e" stroke-width="1.5"/>

  <!-- ── Grand Forge complex (clickable → crafting) ──────── -->
  <g class="city-building" onclick="_cityNavigate('crafting')" role="button" aria-label="Crafting">
    <!-- Main forge hall -->
    <rect x="110" y="338" width="210" height="104" fill="#404040"/>
    <rect x="110" y="338" width="210" height="104" fill="none" stroke="#2a2a2a" stroke-width="2"/>
    <line x1="215" y1="338" x2="215" y2="442" stroke="#363636" stroke-width="1.5"/>
    <line x1="110" y1="390" x2="320" y2="390" stroke="#363636" stroke-width="1.5"/>
    <!-- Chimney stacks -->
    <rect x="130" y="318" width="14" height="26" fill="#1c1c1c"/>
    <rect x="165" y="318" width="14" height="26" fill="#1c1c1c"/>
    <rect x="230" y="318" width="14" height="26" fill="#1c1c1c"/>
    <rect x="265" y="318" width="14" height="26" fill="#1c1c1c"/>
    <rect x="127" y="316" width="20" height="5" fill="#151515"/>
    <rect x="162" y="316" width="20" height="5" fill="#151515"/>
    <rect x="227" y="316" width="20" height="5" fill="#151515"/>
    <rect x="262" y="316" width="20" height="5" fill="#151515"/>
    <!-- Cooling yard -->
    <rect x="330" y="348" width="96" height="78" fill="#3e3e3e"/>
    <rect x="330" y="348" width="96" height="78" fill="none" stroke="#2e2e2e" stroke-width="1.5"/>
    <text x="215" y="332" text-anchor="middle" font-size="9" fill="#939393" font-family="Cinzel,serif" class="city-bldg-label">The Grand Forge</text>
  </g>

  <!-- ── Decorative buildings (non-clickable) ──────────────── -->
  <!-- NW district -->
  <rect x="82"  y="68"  width="22" height="16" fill="#1a1a1a"/>
  <rect x="116" y="60"  width="18" height="14" fill="#181818"/>
  <rect x="152" y="72"  width="20" height="16" fill="#1a1a1a"/>
  <rect x="78"  y="118" width="24" height="16" fill="#181818"/>
  <rect x="114" y="122" width="16" height="14" fill="#1a1a1a"/>
  <rect x="214" y="68"  width="18" height="14" fill="#181818"/>
  <!-- NE district -->
  <rect x="458" y="66"  width="22" height="16" fill="#1a1a1a"/>
  <rect x="492" y="58"  width="18" height="14" fill="#181818"/>
  <rect x="528" y="70"  width="20" height="16" fill="#1a1a1a"/>
  <rect x="562" y="58"  width="24" height="16" fill="#181818"/>
  <rect x="460" y="118" width="16" height="14" fill="#1a1a1a"/>
  <rect x="534" y="114" width="22" height="16" fill="#181818"/>
  <!-- N road flanking -->
  <rect x="296" y="72"  width="28" height="20" fill="#1a1a1a"/>
  <rect x="376" y="72"  width="28" height="20" fill="#1a1a1a"/>

  <!-- ══════════════════════════════════════════════════════ -->
  <!--  BUILDINGS (clickable)                                -->
  <!-- ══════════════════════════════════════════════════════ -->

  <!-- TRAINING (Barracks) — NW district -->
  <g class="city-building" onclick="_cityNavigate('skills')" role="button" aria-label="Training">
    <rect x="130" y="152" width="46" height="32" rx="1" fill="#1d1d1d"/>
    <rect x="134" y="156" width="38" height="24" fill="#111111"/>
    <line x1="134" y1="168" x2="172" y2="168" stroke="#1b1b1b" stroke-width="1.5"/>
    <line x1="153" y1="156" x2="153" y2="180" stroke="#1b1b1b" stroke-width="1.5"/>
    <text x="153" y="142" text-anchor="middle" font-size="9" fill="#939393" font-family="Cinzel,serif" class="city-bldg-label">Training</text>
  </g>

  <!-- MARKET (Trade Quarter) — NE district -->
  <g class="city-building" onclick="_cityNavigate('market')" role="button" aria-label="Market">
    <rect x="484" y="152" width="46" height="32" rx="1" fill="#1d1d1d"/>
    <rect x="488" y="156" width="38" height="24" fill="#111111"/>
    <line x1="488" y1="168" x2="526" y2="168" stroke="#1b1b1b" stroke-width="1.5"/>
    <line x1="507" y1="156" x2="507" y2="180" stroke="#1b1b1b" stroke-width="1.5"/>
    <text x="507" y="142" text-anchor="middle" font-size="9" fill="#939393" font-family="Cinzel,serif" class="city-bldg-label">Market</text>
  </g>

  <!-- GUILD HALL — SE district -->
  <g class="city-building" onclick="_cityNavigate('guilds')" role="button" aria-label="Guild Hall">
    <rect x="472" y="362" width="46" height="32" rx="1" fill="#1d1d1d"/>
    <rect x="476" y="366" width="38" height="24" fill="#111111"/>
    <line x1="476" y1="378" x2="514" y2="378" stroke="#1b1b1b" stroke-width="1.5"/>
    <line x1="495" y1="366" x2="495" y2="390" stroke="#1b1b1b" stroke-width="1.5"/>
    <text x="495" y="352" text-anchor="middle" font-size="9" fill="#939393" font-family="Cinzel,serif" class="city-bldg-label">Guild Hall</text>
  </g>

  <!-- QUESTS (Command Hall) — central plaza, most prominent -->
  <g class="city-building" onclick="_cityNavigate('quests')" role="button" aria-label="Quests">
    <rect x="316" y="216" width="68" height="48" rx="1" fill="#1d1d1d"/>
    <rect x="320" y="220" width="60" height="40" fill="#111111"/>
    <line x1="320" y1="240" x2="380" y2="240" stroke="#1b1b1b" stroke-width="1.5"/>
    <line x1="350" y1="220" x2="350" y2="260" stroke="#1b1b1b" stroke-width="1.5"/>
    <rect x="316" y="216" width="8"  height="8"  fill="#191919"/>
    <rect x="376" y="216" width="8"  height="8"  fill="#191919"/>
    <rect x="316" y="256" width="8"  height="8"  fill="#191919"/>
    <rect x="376" y="256" width="8"  height="8"  fill="#191919"/>
    <text x="350" y="204" text-anchor="middle" font-size="9" fill="#939393" font-family="Cinzel,serif" class="city-bldg-label">Quests</text>
  </g>

</svg>`;
}

function _openSteelwardenCityMap() {
  if (document.getElementById("steelwarden-city-overlay")) return;
  const overlay = document.createElement("div");
  overlay.id = "steelwarden-city-overlay";
  overlay.className = "city-map-overlay";
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) _closeSteelwardenCityMap();
  });
  overlay.innerHTML = `
    <div class="city-map-panel">
      <div class="city-map-header">
        <span>
          <span class="city-map-title">Steelwarden</span>
          <span class="city-map-subtitle">Click a building to enter</span>
        </span>
        <button class="city-map-close" onclick="_closeSteelwardenCityMap()">✕</button>
      </div>
      <div class="city-map-svg-body">${_buildSteelwardenSvg()}</div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay._keyHandler = function (e) {
    if (e.key === "Escape") _closeSteelwardenCityMap();
  };
  document.addEventListener("keydown", overlay._keyHandler);
}
function _closeSteelwardenCityMap() {
  const overlay = document.getElementById("steelwarden-city-overlay");
  if (!overlay) return;
  if (overlay._keyHandler)
    document.removeEventListener("keydown", overlay._keyHandler);
  overlay.remove();
}
function _buildSteelwardenSvg() {
  // Top-down aerial view of Steelwarden — a hardened city-fortress at the edge
  // of the contested zone. Canvas 700×520. Two concentric curtain walls with
  // steel-banding lines suggest the layered steel-and-stone construction.
  // The outer ward holds long barracks rows and supply sheds. The inner ward
  // is tight and militaristic, centred on a decorative keep with a flag.
  // Three clickable buildings:
  //   Inner ward W → Training  (Drill Yard)
  //   Inner ward E → Market    (Quartermaster)
  //   Inner ward N → Quests    (War Council, largest)
  // No shrine, crafting, or guild hall.

  return `<svg viewBox="0 0 700 520" xmlns="http://www.w3.org/2000/svg">

  <!-- ── Blasted ground outside the walls ──────────────────── -->
  <rect width="700" height="520" fill="#383838"/>
  <ellipse cx="120" cy="80"  rx="52" ry="28" fill="#333333"/>
  <ellipse cx="580" cy="90"  rx="44" ry="22" fill="#333333"/>
  <ellipse cx="90"  cy="420" rx="48" ry="24" fill="#333333"/>
  <ellipse cx="610" cy="430" rx="40" ry="20" fill="#333333"/>
  <ellipse cx="350" cy="26"  rx="60" ry="14" fill="#333333"/>
  <ellipse cx="350" cy="496" rx="60" ry="14" fill="#333333"/>

  <!-- ── Outer ward interior ───────────────────────────────── -->
  <rect x="32" y="22" width="636" height="476" fill="#464646"/>

  <!-- ── Outer curtain wall ─────────────────────────────────── -->
  <rect x="32" y="22" width="636" height="476" fill="none" stroke="#141414" stroke-width="18"/>
  <rect x="40" y="30" width="620" height="460" fill="none" stroke="#1c1c1c" stroke-width="3"/>
  <rect x="46" y="36" width="608" height="448" fill="none" stroke="#222222" stroke-width="1.5"/>

  <!-- ── Outer wall corner bastions ────────────────────────── -->
  <rect x="14"  y="4"   width="38" height="38" fill="#111111"/>
  <rect x="14"  y="4"   width="38" height="38" fill="none" stroke="#0a0a0a" stroke-width="2"/>
  <rect x="6"   y="12"  width="22" height="22" fill="#0e0e0e"/>
  <rect x="648" y="4"   width="38" height="38" fill="#111111"/>
  <rect x="648" y="4"   width="38" height="38" fill="none" stroke="#0a0a0a" stroke-width="2"/>
  <rect x="670" y="12"  width="22" height="22" fill="#0e0e0e"/>
  <rect x="14"  y="478" width="38" height="38" fill="#111111"/>
  <rect x="14"  y="478" width="38" height="38" fill="none" stroke="#0a0a0a" stroke-width="2"/>
  <rect x="6"   y="486" width="22" height="22" fill="#0e0e0e"/>
  <rect x="648" y="478" width="38" height="38" fill="#111111"/>
  <rect x="648" y="478" width="38" height="38" fill="none" stroke="#0a0a0a" stroke-width="2"/>
  <rect x="670" y="486" width="22" height="22" fill="#0e0e0e"/>

  <!-- ── Outer wall mid-span towers ────────────────────────── -->
  <rect x="322" y="14"  width="56" height="26" fill="#131313"/>
  <rect x="326" y="18"  width="48" height="18" fill="#191919"/>
  <rect x="322" y="480" width="56" height="26" fill="#131313"/>
  <rect x="326" y="484" width="48" height="18" fill="#191919"/>
  <rect x="14"  y="241" width="26" height="38" fill="#131313"/>
  <rect x="18"  y="245" width="18" height="30" fill="#191919"/>
  <rect x="660" y="241" width="26" height="38" fill="#131313"/>
  <rect x="664" y="245" width="18" height="30" fill="#191919"/>

  <!-- ── Outer gate openings ────────────────────────────────── -->
  <rect x="320" y="480" width="60" height="18" fill="#3a3a3a"/>
  <rect x="332" y="22"  width="36" height="14" fill="#3a3a3a"/>

  <!-- ── Outer ward roads ───────────────────────────────────── -->
  <rect x="336" y="298" width="28" height="182" fill="#505050"/>
  <rect x="336" y="36"  width="28" height="92"  fill="#505050"/>
  <rect x="46"  y="246" width="122" height="28" fill="#505050"/>
  <rect x="532" y="246" width="122" height="28" fill="#505050"/>

  <!-- ── Outer ward barracks rows ───────────────────────────── -->
  <rect x="60"  y="66"  width="88" height="148" fill="#3e3e3e"/>
  <rect x="60"  y="66"  width="88" height="148" fill="none" stroke="#2c2c2c" stroke-width="1.5"/>
  <line x1="60"  y1="92"  x2="148" y2="92"  stroke="#363636" stroke-width="1"/>
  <line x1="60"  y1="118" x2="148" y2="118" stroke="#363636" stroke-width="1"/>
  <line x1="60"  y1="144" x2="148" y2="144" stroke="#363636" stroke-width="1"/>
  <line x1="60"  y1="170" x2="148" y2="170" stroke="#363636" stroke-width="1"/>
  <line x1="60"  y1="196" x2="148" y2="196" stroke="#363636" stroke-width="1"/>
  <rect x="552" y="66"  width="88" height="148" fill="#3e3e3e"/>
  <rect x="552" y="66"  width="88" height="148" fill="none" stroke="#2c2c2c" stroke-width="1.5"/>
  <line x1="552" y1="92"  x2="640" y2="92"  stroke="#363636" stroke-width="1"/>
  <line x1="552" y1="118" x2="640" y2="118" stroke="#363636" stroke-width="1"/>
  <line x1="552" y1="144" x2="640" y2="144" stroke="#363636" stroke-width="1"/>
  <line x1="552" y1="170" x2="640" y2="170" stroke="#363636" stroke-width="1"/>
  <line x1="552" y1="196" x2="640" y2="196" stroke="#363636" stroke-width="1"/>
  <!-- Supply sheds -->
  <rect x="64"  y="336" width="54" height="36" fill="#3a3a3a"/>
  <rect x="64"  y="336" width="54" height="36" fill="none" stroke="#2c2c2c" stroke-width="1.5"/>
  <rect x="64"  y="384" width="54" height="36" fill="#3a3a3a"/>
  <rect x="64"  y="384" width="54" height="36" fill="none" stroke="#2c2c2c" stroke-width="1.5"/>
  <rect x="582" y="336" width="54" height="36" fill="#3a3a3a"/>
  <rect x="582" y="336" width="54" height="36" fill="none" stroke="#2c2c2c" stroke-width="1.5"/>
  <rect x="582" y="384" width="54" height="36" fill="#3a3a3a"/>
  <rect x="582" y="384" width="54" height="36" fill="none" stroke="#2c2c2c" stroke-width="1.5"/>

  <!-- ── Inner ward wall ────────────────────────────────────── -->
  <rect x="168" y="128" width="364" height="270" fill="#424242"/>
  <rect x="168" y="128" width="364" height="270" fill="none" stroke="#111111" stroke-width="14"/>
  <rect x="175" y="135" width="350" height="256" fill="none" stroke="#1a1a1a" stroke-width="2.5"/>
  <rect x="180" y="140" width="340" height="246" fill="none" stroke="#202020" stroke-width="1"/>

  <!-- ── Inner ward corner towers ───────────────────────────── -->
  <rect x="155" y="115" width="26" height="26" fill="#0f0f0f"/>
  <rect x="155" y="115" width="26" height="26" fill="none" stroke="#090909" stroke-width="2"/>
  <rect x="519" y="115" width="26" height="26" fill="#0f0f0f"/>
  <rect x="519" y="115" width="26" height="26" fill="none" stroke="#090909" stroke-width="2"/>
  <rect x="155" y="385" width="26" height="26" fill="#0f0f0f"/>
  <rect x="155" y="385" width="26" height="26" fill="none" stroke="#090909" stroke-width="2"/>
  <rect x="519" y="385" width="26" height="26" fill="#0f0f0f"/>
  <rect x="519" y="385" width="26" height="26" fill="none" stroke="#090909" stroke-width="2"/>

  <!-- ── Inner ward gate openings ───────────────────────────── -->
  <rect x="336" y="384" width="28" height="14" fill="#3e3e3e"/>
  <rect x="336" y="128" width="28" height="14" fill="#3e3e3e"/>

  <!-- ── Inner ward roads ───────────────────────────────────── -->
  <rect x="342" y="142" width="16" height="56"  fill="#4a4a4a"/>
  <rect x="342" y="298" width="16" height="86"  fill="#4a4a4a"/>
  <rect x="182" y="252" width="90" height="16"  fill="#4a4a4a"/>
  <rect x="428" y="252" width="90" height="16"  fill="#4a4a4a"/>

  <!-- ── Central keep (decorative) ─────────────────────────── -->
  <rect x="272" y="198" width="156" height="124" fill="#1e1e1e"/>
  <rect x="272" y="198" width="156" height="124" fill="none" stroke="#0e0e0e" stroke-width="6"/>
  <rect x="278" y="204" width="144" height="112" fill="none" stroke="#161616" stroke-width="2"/>
  <rect x="264" y="190" width="18" height="18" fill="#111111"/>
  <rect x="418" y="190" width="18" height="18" fill="#111111"/>
  <rect x="264" y="312" width="18" height="18" fill="#111111"/>
  <rect x="418" y="312" width="18" height="18" fill="#111111"/>
  <!-- Flag -->
  <line x1="350" y1="210" x2="350" y2="236" stroke="#252525" stroke-width="2"/>
  <polygon points="350,210 366,218 350,226" fill="#6a0f0f"/>

  <!-- ══════════════════════════════════════════════════════ -->
  <!--  BUILDINGS (clickable)                                -->
  <!-- ══════════════════════════════════════════════════════ -->

  <!-- TRAINING (Drill Yard) — inner ward W -->
  <g class="city-building" onclick="_cityNavigate('skills')" role="button" aria-label="Training">
    <rect x="192" y="220" width="52" height="36" rx="1" fill="#1d1d1d"/>
    <rect x="196" y="224" width="44" height="28" fill="#111111"/>
    <line x1="196" y1="238" x2="240" y2="238" stroke="#1b1b1b" stroke-width="1.5"/>
    <line x1="218" y1="224" x2="218" y2="252" stroke="#1b1b1b" stroke-width="1.5"/>
    <text x="218" y="210" text-anchor="middle" font-size="9" fill="#939393" font-family="Cinzel,serif" class="city-bldg-label">Training</text>
  </g>

  <!-- MARKET (Quartermaster) — inner ward E -->
  <g class="city-building" onclick="_cityNavigate('market')" role="button" aria-label="Market">
    <rect x="456" y="220" width="52" height="36" rx="1" fill="#1d1d1d"/>
    <rect x="460" y="224" width="44" height="28" fill="#111111"/>
    <line x1="460" y1="238" x2="504" y2="238" stroke="#1b1b1b" stroke-width="1.5"/>
    <line x1="482" y1="224" x2="482" y2="252" stroke="#1b1b1b" stroke-width="1.5"/>
    <text x="482" y="210" text-anchor="middle" font-size="9" fill="#939393" font-family="Cinzel,serif" class="city-bldg-label">Market</text>
  </g>

  <!-- QUESTS (War Council) — inner ward N, most prominent -->
  <g class="city-building" onclick="_cityNavigate('quests')" role="button" aria-label="Quests">
    <rect x="314" y="148" width="72" height="52" rx="1" fill="#1d1d1d"/>
    <rect x="318" y="152" width="64" height="44" fill="#111111"/>
    <line x1="318" y1="174" x2="382" y2="174" stroke="#1b1b1b" stroke-width="1.5"/>
    <line x1="350" y1="152" x2="350" y2="196" stroke="#1b1b1b" stroke-width="1.5"/>
    <rect x="314" y="148" width="9"  height="9"  fill="#191919"/>
    <rect x="377" y="148" width="9"  height="9"  fill="#191919"/>
    <rect x="314" y="191" width="9"  height="9"  fill="#191919"/>
    <rect x="377" y="191" width="9"  height="9"  fill="#191919"/>
    <text x="350" y="138" text-anchor="middle" font-size="9" fill="#939393" font-family="Cinzel,serif" class="city-bldg-label">Quests</text>
  </g>

  <!-- CRAFTING (Armoury) — inner ward SW -->
  <g class="city-building" onclick="_cityNavigate('crafting')" role="button" aria-label="Crafting">
    <rect x="192" y="308" width="52" height="36" rx="1" fill="#1d1d1d"/>
    <rect x="196" y="312" width="44" height="28" fill="#111111"/>
    <line x1="196" y1="326" x2="240" y2="326" stroke="#1b1b1b" stroke-width="1.5"/>
    <line x1="218" y1="312" x2="218" y2="340" stroke="#1b1b1b" stroke-width="1.5"/>
    <text x="218" y="298" text-anchor="middle" font-size="9" fill="#939393" font-family="Cinzel,serif" class="city-bldg-label">Crafting</text>
  </g>

  <!-- GUILD HALL — inner ward SE -->
  <g class="city-building" onclick="_cityNavigate('guilds')" role="button" aria-label="Guild Hall">
    <rect x="456" y="308" width="52" height="36" rx="1" fill="#1d1d1d"/>
    <rect x="460" y="312" width="44" height="28" fill="#111111"/>
    <line x1="460" y1="326" x2="504" y2="326" stroke="#1b1b1b" stroke-width="1.5"/>
    <line x1="482" y1="312" x2="482" y2="340" stroke="#1b1b1b" stroke-width="1.5"/>
    <text x="482" y="298" text-anchor="middle" font-size="9" fill="#939393" font-family="Cinzel,serif" class="city-bldg-label">Guild Hall</text>
  </g>

</svg>`;
}

function _openIronfrontCityMap() {
  if (document.getElementById("ironfront-city-overlay")) return;
  const overlay = document.createElement("div");
  overlay.id = "ironfront-city-overlay";
  overlay.className = "city-map-overlay";
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) _closeIronfrontCityMap();
  });
  overlay.innerHTML = `
    <div class="city-map-panel">
      <div class="city-map-header">
        <span>
          <span class="city-map-title">Ironfront</span>
          <span class="city-map-subtitle">Click a building to enter</span>
        </span>
        <button class="city-map-close" onclick="_closeIronfrontCityMap()">✕</button>
      </div>
      <div class="city-map-svg-body">${_buildIronfrontSvg()}</div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay._keyHandler = function (e) {
    if (e.key === "Escape") _closeIronfrontCityMap();
  };
  document.addEventListener("keydown", overlay._keyHandler);
}
function _closeIronfrontCityMap() {
  const overlay = document.getElementById("ironfront-city-overlay");
  if (!overlay) return;
  if (overlay._keyHandler)
    document.removeEventListener("keydown", overlay._keyHandler);
  overlay.remove();
}
function _buildIronfrontSvg() {
  // Top-down aerial view of Ironfront — the Dominion's forward city, built by
  // necessity at the very edge of the ruins zone. Canvas 700×520.
  // Distinct from Steelwarden (concentric rings) and Forgecrest (open city).
  // Ironfront is asymmetric and improvised: a thick D-shaped curtain wall
  // faces the ruins to the north, while the southern "civilian" side is lighter.
  // A wide fighting platform runs along the N wall. The interior is densely
  // packed — functional, not elegant. Rubble scatter outside the N wall hints
  // at past incursions.
  // Five clickable buildings inside the walls:
  //   NW quadrant  → Training   (Garrison)
  //   NE quadrant  → Market     (Supply Cache)
  //   W mid        → Crafting   (Forge Pit)
  //   E mid        → Guild Hall (Mercenary Hall)
  //   Centre       → Quests     (Command Post, largest)

  return `<svg viewBox="0 0 700 520" xmlns="http://www.w3.org/2000/svg">

  <!-- ── Ruins-blasted ground ──────────────────────────────── -->
  <rect width="700" height="520" fill="#363636"/>

  <!-- ── Rubble scatter north of wall (ruin flavour) ───────── -->
  <rect x="68"  y="8"  width="28" height="12" fill="#2e2e2e" rx="2"/>
  <rect x="130" y="4"  width="18" height="10" fill="#2a2a2a" rx="1"/>
  <rect x="192" y="10" width="22" height="9"  fill="#2e2e2e" rx="1"/>
  <rect x="258" y="5"  width="14" height="8"  fill="#2a2a2a" rx="1"/>
  <rect x="410" y="6"  width="20" height="10" fill="#2e2e2e" rx="1"/>
  <rect x="476" y="4"  width="16" height="9"  fill="#2a2a2a" rx="1"/>
  <rect x="544" y="8"  width="24" height="10" fill="#2e2e2e" rx="1"/>
  <rect x="600" y="3"  width="18" height="8"  fill="#2a2a2a" rx="1"/>
  <ellipse cx="160" cy="14" rx="18" ry="7" fill="#2c2c2c"/>
  <ellipse cx="340" cy="10" rx="24" ry="8" fill="#2c2c2c"/>
  <ellipse cx="520" cy="12" rx="20" ry="7" fill="#2c2c2c"/>

  <!-- ── City interior (packed rubble-dirt) ────────────────── -->
  <rect x="44" y="28" width="612" height="464" fill="#474747"/>

  <!-- ── N fighting platform (raised, darker — faces the ruins) -->
  <rect x="44" y="28" width="612" height="56" fill="#3c3c3c"/>
  <rect x="44" y="28" width="612" height="56" fill="none" stroke="#2a2a2a" stroke-width="1.5"/>
  <!-- Platform walkway line -->
  <line x1="44" y1="74" x2="656" y2="74" stroke="#333333" stroke-width="2"/>

  <!-- ── Heavy N curtain wall ───────────────────────────────── -->
  <rect x="44" y="28" width="612" height="12" fill="none" stroke="#101010" stroke-width="22"/>
  <!-- Steel banding (layered construction) -->
  <rect x="52" y="22" width="596" height="24" fill="none" stroke="#181818" stroke-width="3"/>
  <rect x="58" y="25" width="584" height="20" fill="none" stroke="#1e1e1e" stroke-width="1.5"/>

  <!-- ── Lighter S, W, E walls ─────────────────────────────── -->
  <rect x="44" y="28" width="612" height="464" fill="none" stroke="#161616" stroke-width="12"/>
  <!-- Inner banding -->
  <rect x="50" y="34" width="600" height="452" fill="none" stroke="#1c1c1c" stroke-width="2"/>

  <!-- ── N wall bastions (large, forward-facing) ───────────── -->
  <!-- NW bastion -->
  <rect x="26"  y="10" width="42" height="42" fill="#0f0f0f"/>
  <rect x="26"  y="10" width="42" height="42" fill="none" stroke="#090909" stroke-width="2"/>
  <rect x="32"  y="16" width="30" height="30" fill="#0d0d0d"/>
  <!-- NE bastion -->
  <rect x="632" y="10" width="42" height="42" fill="#0f0f0f"/>
  <rect x="632" y="10" width="42" height="42" fill="none" stroke="#090909" stroke-width="2"/>
  <rect x="638" y="16" width="30" height="30" fill="#0d0d0d"/>
  <!-- N mid tower -->
  <rect x="322" y="16" width="56" height="30" fill="#111111"/>
  <rect x="326" y="20" width="48" height="22" fill="#181818"/>
  <!-- N quarter towers -->
  <rect x="168" y="18" width="36" height="26" fill="#121212"/>
  <rect x="172" y="22" width="28" height="18" fill="#191919"/>
  <rect x="496" y="18" width="36" height="26" fill="#121212"/>
  <rect x="500" y="22" width="28" height="18" fill="#191919"/>

  <!-- ── S, SW, SE corners (lighter, standard towers) ─────── -->
  <rect x="26"  y="474" width="36" height="36" fill="#131313"/>
  <rect x="26"  y="474" width="36" height="36" fill="none" stroke="#0a0a0a" stroke-width="2"/>
  <rect x="638" y="474" width="36" height="36" fill="#131313"/>
  <rect x="638" y="474" width="36" height="36" fill="none" stroke="#0a0a0a" stroke-width="2"/>

  <!-- ── S gate (main supply entry from the south) ─────────── -->
  <rect x="320" y="480" width="60" height="12" fill="#3e3e3e"/>
  <rect x="308" y="474" width="22" height="22" fill="#141414"/>
  <rect x="370" y="474" width="22" height="22" fill="#141414"/>

  <!-- ── W and E postern gates ─────────────────────────────── -->
  <rect x="44"  y="272" width="12" height="28" fill="#3e3e3e"/>
  <rect x="644" y="272" width="12" height="28" fill="#3e3e3e"/>

  <!-- ── Interior roads ─────────────────────────────────────── -->
  <!-- N–S spine from platform to S gate -->
  <rect x="336" y="84"  width="28" height="396" fill="#515151"/>
  <!-- W lateral -->
  <rect x="56"  y="258" width="280" height="24" fill="#515151"/>
  <!-- E lateral -->
  <rect x="364" y="258" width="280" height="24" fill="#515151"/>
  <!-- NW diagonal shortcut (angled block approximate) -->
  <rect x="180" y="142" width="156" height="18" fill="#4e4e4e"/>
  <!-- NE diagonal shortcut -->
  <rect x="364" y="142" width="156" height="18" fill="#4e4e4e"/>

  <!-- ── Dense interior district buildings (non-clickable) ─── -->
  <!-- NW district housing rows -->
  <rect x="72"  y="90"  width="72" height="22" fill="#3a3a3a"/>
  <rect x="72"  y="120" width="72" height="22" fill="#3a3a3a"/>
  <rect x="156" y="90"  width="52" height="22" fill="#3c3c3c"/>
  <rect x="156" y="120" width="52" height="22" fill="#3c3c3c"/>
  <!-- NE district housing rows -->
  <rect x="492" y="90"  width="72" height="22" fill="#3a3a3a"/>
  <rect x="492" y="120" width="72" height="22" fill="#3a3a3a"/>
  <rect x="364" y="90"  width="52" height="22" fill="#3c3c3c"/>
  <rect x="364" y="120" width="52" height="22" fill="#3c3c3c"/>
  <!-- SW district filler -->
  <rect x="68"  y="358" width="48" height="32" fill="#3a3a3a"/>
  <rect x="68"  y="402" width="48" height="32" fill="#3a3a3a"/>
  <rect x="128" y="380" width="36" height="24" fill="#3c3c3c"/>
  <!-- SE district filler -->
  <rect x="584" y="358" width="48" height="32" fill="#3a3a3a"/>
  <rect x="584" y="402" width="48" height="32" fill="#3a3a3a"/>
  <rect x="536" y="380" width="36" height="24" fill="#3c3c3c"/>

  <!-- ══════════════════════════════════════════════════════ -->
  <!--  BUILDINGS (clickable)                                -->
  <!-- ══════════════════════════════════════════════════════ -->

  <!-- TRAINING (Garrison) — NW quadrant, below platform -->
  <g class="city-building" onclick="_cityNavigate('skills')" role="button" aria-label="Training">
    <rect x="88"  y="158" width="52" height="36" rx="1" fill="#1d1d1d"/>
    <rect x="92"  y="162" width="44" height="28" fill="#111111"/>
    <line x1="92"  y1="176" x2="136" y2="176" stroke="#1b1b1b" stroke-width="1.5"/>
    <line x1="114" y1="162" x2="114" y2="190" stroke="#1b1b1b" stroke-width="1.5"/>
    <text x="114" y="148" text-anchor="middle" font-size="9" fill="#939393" font-family="Cinzel,serif" class="city-bldg-label">Training</text>
  </g>

  <!-- MARKET (Supply Cache) — NE quadrant, below platform -->
  <g class="city-building" onclick="_cityNavigate('market')" role="button" aria-label="Market">
    <rect x="560" y="158" width="52" height="36" rx="1" fill="#1d1d1d"/>
    <rect x="564" y="162" width="44" height="28" fill="#111111"/>
    <line x1="564" y1="176" x2="608" y2="176" stroke="#1b1b1b" stroke-width="1.5"/>
    <line x1="586" y1="162" x2="586" y2="190" stroke="#1b1b1b" stroke-width="1.5"/>
    <text x="586" y="148" text-anchor="middle" font-size="9" fill="#939393" font-family="Cinzel,serif" class="city-bldg-label">Market</text>
  </g>

  <!-- CRAFTING (Forge Pit) — W mid, on lateral road -->
  <g class="city-building" onclick="_cityNavigate('crafting')" role="button" aria-label="Crafting">
    <rect x="88"  y="242" width="52" height="36" rx="1" fill="#1d1d1d"/>
    <rect x="92"  y="246" width="44" height="28" fill="#111111"/>
    <line x1="92"  y1="260" x2="136" y2="260" stroke="#1b1b1b" stroke-width="1.5"/>
    <line x1="114" y1="246" x2="114" y2="274" stroke="#1b1b1b" stroke-width="1.5"/>
    <text x="114" y="232" text-anchor="middle" font-size="9" fill="#939393" font-family="Cinzel,serif" class="city-bldg-label">Crafting</text>
  </g>

  <!-- GUILD HALL (Mercenary Hall) — E mid, on lateral road -->
  <g class="city-building" onclick="_cityNavigate('guilds')" role="button" aria-label="Guild Hall">
    <rect x="560" y="242" width="52" height="36" rx="1" fill="#1d1d1d"/>
    <rect x="564" y="246" width="44" height="28" fill="#111111"/>
    <line x1="564" y1="260" x2="608" y2="260" stroke="#1b1b1b" stroke-width="1.5"/>
    <line x1="586" y1="246" x2="586" y2="274" stroke="#1b1b1b" stroke-width="1.5"/>
    <text x="586" y="232" text-anchor="middle" font-size="9" fill="#939393" font-family="Cinzel,serif" class="city-bldg-label">Guild Hall</text>
  </g>

  <!-- QUESTS (Command Post) — centre, most prominent -->
  <g class="city-building" onclick="_cityNavigate('quests')" role="button" aria-label="Quests">
    <rect x="310" y="222" width="80" height="56" rx="1" fill="#1d1d1d"/>
    <rect x="314" y="226" width="72" height="48" fill="#111111"/>
    <line x1="314" y1="250" x2="386" y2="250" stroke="#1b1b1b" stroke-width="1.5"/>
    <line x1="350" y1="226" x2="350" y2="274" stroke="#1b1b1b" stroke-width="1.5"/>
    <rect x="310" y="222" width="10" height="10" fill="#191919"/>
    <rect x="380" y="222" width="10" height="10" fill="#191919"/>
    <rect x="310" y="268" width="10" height="10" fill="#191919"/>
    <rect x="380" y="268" width="10" height="10" fill="#191919"/>
    <!-- Flag -->
    <line x1="350" y1="232" x2="350" y2="248" stroke="#252525" stroke-width="1.5"/>
    <polygon points="350,232 362,238 350,244" fill="#6a0f0f"/>
    <text x="350" y="210" text-anchor="middle" font-size="9" fill="#939393" font-family="Cinzel,serif" class="city-bldg-label">Quests</text>
  </g>

</svg>`;
}

// ── Ironhold intro quest ──────────────────────────────────────────────────────

// Returns true if the player has completed ALL tutorial intro quests for their faction.
function _tutorialComplete() {
  const player = PlayerSystem.current;
  if (!player) return false;
  const completed = player.quests?.completed || [];
  const done = id => completed.some(c => c.questId === id);
  if (player.faction === 'iron_dominion') {
    return ['ironhold_guard_intro','ironhold_intro_crafting','ironhold_intro_market',
      'ironhold_intro_training','ironhold_intro_guilds','ironhold_intro_shrine','ironhold_intro_quests']
      .every(done);
  }
  if (player.faction === 'thornwood') {
    return ['thornhaven_scout_intro','thornhaven_intro_market','thornhaven_intro_training',
      'thornhaven_intro_crafting','thornhaven_intro_guilds','thornhaven_intro_quests','thornhaven_intro_shrine']
      .every(done);
  }
  if (player.faction === 'ashen_covenant') {
    return ['ashenmire_sentinel_intro','ashenmire_intro_market','ashenmire_intro_training',
      'ashenmire_intro_crafting','ashenmire_intro_guilds','ashenmire_intro_quests','ashenmire_intro_shrine']
      .every(done);
  }
  return false;
}

// ── Main proving quest markers ────────────────────────────────────────────────
// Shows after tutorial is done, until the world is unlocked.

function _showMainQuestMarker(faction) {
  const player = PlayerSystem.current;
  if (!player || player.faction !== faction) return false;
  if (player.flags?.worldUnlocked) return false;
  return _tutorialComplete();
}

function _mainQuestAccepted() {
  const player = PlayerSystem.current;
  return player?.quests?.completed?.some(c => c.questId === 'main_proving_quest_accepted') ?? false;
}

function _boardQuestsDone() {
  const player = PlayerSystem.current;
  return (player?.flags?.boardQuestSuccesses || 0) >= 5;
}

function _showIronholdIntroMarker() {
  const player = PlayerSystem.current;
  if (!player || player.faction !== 'iron_dominion') return false;
  const completed = player.quests.completed || [];
  const ids = ['ironhold_guard_intro','ironhold_intro_crafting','ironhold_intro_market',
    'ironhold_intro_training','ironhold_intro_guilds','ironhold_intro_shrine','ironhold_intro_quests'];
  return ids.some(id => !completed.some(c => c.questId === id));
}

function _showThornhavenIntroMarker() {
  const player = PlayerSystem.current;
  if (!player || player.faction !== 'thornwood') return false;
  const completed = player.quests.completed || [];
  const ids = ['thornhaven_scout_intro','thornhaven_intro_market','thornhaven_intro_training',
    'thornhaven_intro_crafting','thornhaven_intro_guilds','thornhaven_intro_quests','thornhaven_intro_shrine'];
  return ids.some(id => !completed.some(c => c.questId === id));
}

function _showAshenmireIntroMarker() {
  const player = PlayerSystem.current;
  if (!player || player.faction !== 'ashen_covenant') return false;
  const completed = player.quests.completed || [];
  const ids = ['ashenmire_sentinel_intro','ashenmire_intro_market','ashenmire_intro_training',
    'ashenmire_intro_crafting','ashenmire_intro_guilds','ashenmire_intro_quests','ashenmire_intro_shrine'];
  return ids.some(id => !completed.some(c => c.questId === id));
}

function _openIronholdIntroDialogue() {
  if (document.getElementById('ironhold-intro-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'ironhold-intro-overlay';
  overlay.className = 'city-map-overlay';

  function render(step) {
    let body = '';
    if (step === 1) {
      body = `
        <div class="idlg-speaker">Gate Guard</div>
        <div class="idlg-line">
          "Hold. You there — stop where you are."
        </div>
        <div class="idlg-line">
          A broad-shouldered guard in iron-plate steps in front of you, one gauntleted hand raised.
          His eyes move across you with the practiced suspicion of someone who has stopped a hundred people today.
        </div>
        <div class="idlg-line">
          "Standard entry protocol. Drop your pack and open it. We check everything going into Ironhold."
        </div>
        <div class="idlg-actions">
          <button class="idlg-btn-primary" data-step="2">Comply — open your pack</button>
          <button class="idlg-btn-secondary" data-step="3">Ask why this is necessary</button>
        </div>`;
    } else if (step === 2) {
      body = `
        <div class="idlg-speaker">Gate Guard</div>
        <div class="idlg-line">
          You lower your pack to the ground and unbuckle it. The guard crouches, rifles through
          the contents with efficient hands, checks the lining, then stands.
        </div>
        <div class="idlg-line">
          "Nothing flagged. You're clear."
        </div>
        <div class="idlg-line">
          He steps aside and jerks his head toward the gate.
          "Welcome to Ironhold. Try not to be a problem."
        </div>
        <div class="idlg-actions">
          <button class="idlg-btn-primary" data-accept="1">Enter the city</button>
        </div>`;
    } else if (step === 3) {
      body = `
        <div class="idlg-speaker">Gate Guard</div>
        <div class="idlg-line">
          The guard's expression doesn't change.
        </div>
        <div class="idlg-line">
          "Because Ironhold has had three assassination attempts, two smuggled weapons caches, and
          one incident I'm not allowed to describe in the last season alone. That's why."
        </div>
        <div class="idlg-line">
          "Pack. Open it. Now."
        </div>
        <div class="idlg-actions">
          <button class="idlg-btn-primary" data-step="2">Comply — open your pack</button>
          <button class="idlg-btn-danger" data-step="4">Refuse</button>
        </div>`;
    } else if (step === 4) {
      body = `
        <div class="idlg-speaker">Gate Guard</div>
        <div class="idlg-line">
          The guard's hand moves to the hilt at his side. Two more guards step up from the
          gatehouse without being called.
        </div>
        <div class="idlg-line">
          "Last time I ask. Open the pack, or turn around and don't come back today."
        </div>
        <div class="idlg-actions">
          <button class="idlg-btn-primary" data-step="2">Comply — open your pack</button>
          <button class="idlg-btn-danger" data-dismiss="1">Turn around and leave</button>
        </div>`;
    }

    overlay.innerHTML = `
      <div class="idlg-panel">
        <div class="idlg-header">
          <span class="idlg-title">Gates of Ironhold</span>
          <button class="city-map-close" data-dismiss="1">✕</button>
        </div>
        <div class="idlg-body">${body}</div>
      </div>`;

    // Wire up buttons
    overlay.querySelectorAll('[data-step]').forEach(btn => {
      btn.addEventListener('click', () => render(parseInt(btn.dataset.step)));
    });
    overlay.querySelectorAll('[data-accept]').forEach(btn => {
      btn.addEventListener('click', () => _completeIronholdIntro());
    });
    overlay.querySelectorAll('[data-dismiss]').forEach(btn => {
      btn.addEventListener('click', () => overlay.remove());
    });
  }

  render(1);
  document.body.appendChild(overlay);

  overlay._keyHandler = function (e) {
    if (e.key === 'Escape') overlay.remove();
  };
  document.addEventListener('keydown', overlay._keyHandler);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) overlay.remove();
  });
}

function _completeIronholdIntro() {
  const overlay = document.getElementById('ironhold-intro-overlay');
  if (overlay) {
    if (overlay._keyHandler) document.removeEventListener('keydown', overlay._keyHandler);
    overlay.remove();
  }
  const player = PlayerSystem.current;
  if (!player) return;
  if (!player.quests.completed) player.quests.completed = [];
  player.quests.completed.push({ questId: 'ironhold_guard_intro', outcome: 'success', ts: Date.now() });
  SaveSystem.save();
  _renderMapPage();
}

// ── Ironhold building intro quests ────────────────────────────────────────────

function _ironholdGuardDone() {
  const player = PlayerSystem.current;
  if (!player) return false;
  return (player.quests.completed || []).some(c => c.questId === 'ironhold_guard_intro');
}

function _showIronholdBldgMarker(questId) {
  if (!_ironholdGuardDone()) return false;
  const player = PlayerSystem.current;
  if (!player || player.faction !== 'iron_dominion') return false;
  return !(player.quests.completed || []).some(c => c.questId === questId);
}

function _completeIronholdBldgQuest(questId, overlayId) {
  const overlay = document.getElementById(overlayId);
  if (overlay) {
    if (overlay._keyHandler) document.removeEventListener('keydown', overlay._keyHandler);
    overlay.remove();
  }
  // Close any open city overlay so the map re-renders cleanly
  document.querySelectorAll('.city-map-overlay').forEach(o => o.remove());
  const player = PlayerSystem.current;
  if (!player) return;
  if (!player.quests.completed) player.quests.completed = [];
  player.quests.completed.push({ questId, outcome: 'success', ts: Date.now() });
  SaveSystem.save();
  _renderMapPage();
}

const _IRONHOLD_BLDG_DIALOGUES = {
  ironhold_intro_crafting: {
    overlayId: 'ironhold-bldg-crafting-overlay',
    title: 'The Forge',
    steps: [
      {
        speaker: 'Master Smith Vrenn',
        lines: [
          '"You\'re standing in front of the best forge in the Dominion and you look lost. That\'s fixable."',
          'A heavyset woman in a scorched apron sizes you up from the doorway. Behind her, the sound of hammers and heat.',
          '"Crafting works like this: gather materials out in the field, bring them here, and I\'ll show you what can be made from them. Different professions cover different gear — blacksmithing for weapons, armorsmithing for plate, and so on."',
        ],
        actions: [{ label: 'Ask about materials', next: 2 }, { label: 'Come back later', dismiss: true }],
      },
      {
        speaker: 'Master Smith Vrenn',
        lines: [
          '"Materials drop from enemies, salvage, quests — you\'ll find them. The crafting page shows you everything available to make at your current skill level."',
          '"The higher your crafting skill, the better the gear you can produce. I\'d start with something simple, get your hands dirty, then work up."',
          '"Door\'s open. Don\'t waste my time once you\'re inside."',
        ],
        actions: [{ label: 'Understood', complete: true }],
      },
    ],
  },

  ironhold_intro_market: {
    overlayId: 'ironhold-bldg-market-overlay',
    title: 'The Armory Market',
    steps: [
      {
        speaker: 'Quartermaster Dael',
        lines: [
          '"Eyes up. You\'re browsing, or you need something specific?"',
          'A lean man behind a cluttered counter glances up from a ledger, quill still in hand.',
          '"The market covers three things: food, gear repair, and the shrine exchange. Food keeps your survival stats from degrading in the field — ignore it and your performance drops. Repair keeps your equipment from falling apart mid-fight."',
        ],
        actions: [{ label: 'Ask about the shrine exchange', next: 2 }, { label: 'Come back later', dismiss: true }],
      },
      {
        speaker: 'Quartermaster Dael',
        lines: [
          '"Shrine tab is further in — it\'s where you offload corruption. You pick that up in dangerous areas. Let it build and it starts affecting your stats in ways you won\'t enjoy."',
          '"Everything else is standard supply. Prices vary by region, so don\'t complain to me about what you paid somewhere else."',
          'He goes back to his ledger.',
          '"Buy something or move on."',
        ],
        actions: [{ label: 'Understood', complete: true }],
      },
    ],
  },

  ironhold_intro_training: {
    overlayId: 'ironhold-bldg-training-overlay',
    title: 'The Barracks',
    steps: [
      {
        speaker: 'Drill Sergeant Orath',
        lines: [
          '"You. In front of my barracks. What do you want?"',
          'He doesn\'t stop doing push-ups when he says it.',
          '"Training. That\'s what this building is for. Six combat skills and seven crafting skills — each one you can raise by spending stat points, which you earn by completing quests and levelling up."',
        ],
        actions: [{ label: 'Ask how skills affect combat', next: 2 }, { label: 'Come back later', dismiss: true }],
      },
      {
        speaker: 'Drill Sergeant Orath',
        lines: [
          '"Higher skill means better quest success rates, better crafting output, and better arena performance. Simple."',
          '"Effective skill isn\'t just raw investment — there\'s a formula. Diminishing returns kick in eventually, so spreading across complementary skills is usually smarter than stacking one."',
          'He finally stands up.',
          '"Stop standing outside and go read the board."',
        ],
        actions: [{ label: 'Understood', complete: true }],
      },
    ],
  },

  ironhold_intro_guilds: {
    overlayId: 'ironhold-bldg-guilds-overlay',
    title: 'The War Council Hall',
    steps: [
      {
        speaker: 'Guild Registrar Maren',
        lines: [
          '"Before you walk in there and make a bad impression, let me brief you."',
          'A composed woman with a wax seal on her collar intercepts you at the door.',
          '"Three guilds operate here: the Ashguard, the Black Sigil, and the Veil Syndicate. Each has its own focus — fighters, mages, and operatives respectively. You can join one. Only one."',
        ],
        actions: [{ label: 'Ask about guild benefits', next: 2 }, { label: 'Come back later', dismiss: true }],
      },
      {
        speaker: 'Guild Registrar Maren',
        lines: [
          '"Guild membership unlocks a second quest board with better rewards. You\'ll also earn reputation, which determines what contracts you can take on."',
          '"Reputation is earned slowly and lost fast. Don\'t embarrass your guild — it matters more than you think out here."',
          'She steps aside from the door.',
          '"Make your choice carefully. The guilds remember who walked away."',
        ],
        actions: [{ label: 'Understood', complete: true }],
      },
    ],
  },

  ironhold_intro_quests: {
    overlayId: 'ironhold-bldg-quests-overlay',
    title: 'The Command Post',
    steps: [
      {
        speaker: 'Operations Officer Cael',
        lines: [
          '"The board doesn\'t explain itself. I will."',
          'A young officer with ink on his fingers gestures to a wall of pinned contracts behind him.',
          '"Daily quests refresh each morning. Each one has a skill requirement — your effective skill versus the required level determines your success chance. Too far below the requirement and you\'ll fail more than you complete."',
        ],
        actions: [{ label: 'Ask about rewards', next: 2 }, { label: 'Come back later', dismiss: true }],
      },
      {
        speaker: 'Operations Officer Cael',
        lines: [
          '"Rewards are gold and loot chests. Higher tier quests pay more but demand more. You can only run one quest at a time — they take real time to complete."',
          '"Guild members get a second board with guild-specific contracts. Separate from the daily board, better rewards, harder requirements."',
          '"Check in daily. The board rotates and some contracts don\'t last."',
        ],
        actions: [{ label: 'Understood', complete: true }],
      },
    ],
  },

  ironhold_intro_shrine: {
    overlayId: 'ironhold-bldg-shrine-overlay',
    title: 'The Iron Chapel',
    steps: [
      {
        speaker: 'Iron Chaplain Sera',
        lines: [
          '"Most soldiers walk past without stopping. That\'s usually when they need it most."',
          'A quiet woman in grey iron-trimmed robes looks up from a candle she was tending.',
          '"The shrine handles corruption — a residue that accumulates when you spend time in dangerous or magically tainted areas. You might not notice it building up until it\'s affecting your stats."',
        ],
        actions: [{ label: 'Ask how to clear it', next: 2 }, { label: 'Come back later', dismiss: true }],
      },
      {
        speaker: 'Iron Chaplain Sera',
        lines: [
          '"Cleansing costs a small amount of gold and clears your corruption completely. The longer you leave it, the worse the effect — and it doesn\'t cap cleanly."',
          '"You\'ll find the shrine through the market. It\'s the third tab. I\'m here whenever you need it."',
          'She turns back to the candle.',
          '"Try not to let it accumulate. It\'s easier to maintain than to fix."',
        ],
        actions: [{ label: 'Understood', complete: true }],
      },
    ],
  },
};

function _openIronholdBldgDialogue(questId) {
  const cfg = _IRONHOLD_BLDG_DIALOGUES[questId];
  if (!cfg) return;
  if (document.getElementById(cfg.overlayId)) return;

  const overlay = document.createElement('div');
  overlay.id = cfg.overlayId;
  overlay.className = 'city-map-overlay';

  function render(stepIndex) {
    const step = cfg.steps[stepIndex - 1];
    const linesHtml = step.lines.map(l => `<div class="idlg-line">${l}</div>`).join('');
    const actionsHtml = step.actions.map(a => {
      if (a.dismiss) return `<button class="idlg-btn-secondary" data-dismiss="1">${a.label}</button>`;
      if (a.next)    return `<button class="idlg-btn-primary" data-step="${a.next}">${a.label}</button>`;
      if (a.complete) return `<button class="idlg-btn-primary" data-complete="1">${a.label}</button>`;
      return '';
    }).join('');

    overlay.innerHTML = `
      <div class="idlg-panel">
        <div class="idlg-header">
          <span class="idlg-title">${cfg.title}</span>
          <button class="city-map-close" data-dismiss="1">✕</button>
        </div>
        <div class="idlg-body">
          <div class="idlg-speaker">${step.speaker}</div>
          ${linesHtml}
          <div class="idlg-actions">${actionsHtml}</div>
        </div>
      </div>`;

    overlay.querySelectorAll('[data-step]').forEach(btn =>
      btn.addEventListener('click', () => render(parseInt(btn.dataset.step))));
    overlay.querySelectorAll('[data-dismiss]').forEach(btn =>
      btn.addEventListener('click', () => overlay.remove()));
    overlay.querySelectorAll('[data-complete]').forEach(btn =>
      btn.addEventListener('click', () =>
        _completeIronholdBldgQuest(questId, cfg.overlayId)));
  }

  render(1);
  document.body.appendChild(overlay);
  overlay._keyHandler = e => { if (e.key === 'Escape') overlay.remove(); };
  document.addEventListener('keydown', overlay._keyHandler);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

// ── Thornhaven intro quests ───────────────────────────────────────────────────

function _showThornhavenScoutMarker() {
  const player = PlayerSystem.current;
  if (!player || player.faction !== 'thornwood') return false;
  return !(player.quests.completed || []).some(c => c.questId === 'thornhaven_scout_intro');
}

function _thornhavenScoutDone() {
  const player = PlayerSystem.current;
  if (!player) return false;
  return (player.quests.completed || []).some(c => c.questId === 'thornhaven_scout_intro');
}

function _showThornhavenBldgMarker(questId) {
  if (!_thornhavenScoutDone()) return false;
  const player = PlayerSystem.current;
  if (!player || player.faction !== 'thornwood') return false;
  return !(player.quests.completed || []).some(c => c.questId === questId);
}

function _openThornhavenIntroDialogue() {
  if (document.getElementById('thornhaven-intro-overlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'thornhaven-intro-overlay';
  overlay.className = 'city-map-overlay';

  function render(step) {
    let body = '';
    if (step === 1) {
      body = `
        <div class="idlg-speaker">Scout Senna</div>
        <div class="idlg-line">"Eyes on you since the ridge."</div>
        <div class="idlg-line">A voice from somewhere above. You look up — a figure perched in the canopy twenty feet overhead, one leg hanging easy over the branch, a shortbow across her lap. Not drawn. Yet.</div>
        <div class="idlg-line">"New face. You carrying anything that burns?"</div>
        <div class="idlg-actions">
          <button class="idlg-btn-primary" data-step="2">Hold out your hands — nothing to hide</button>
          <button class="idlg-btn-secondary" data-step="3">Ask why the scrutiny</button>
        </div>`;
    } else if (step === 2) {
      body = `
        <div class="idlg-speaker">Scout Senna</div>
        <div class="idlg-line">She studies you for a moment. Then she drops — a clean fifteen-foot fall, lands like it's nothing, and straightens up to face you.</div>
        <div class="idlg-line">"Good. No torches, no iron powder, nothing wrapped in oilcloth." She glances at your pack one more time. "We've had issues."</div>
        <div class="idlg-line">"You're clear. Thornhaven's up in the canopy — follow the rope bridges and don't lean on the old ones. Welcome."</div>
        <div class="idlg-actions">
          <button class="idlg-btn-primary" data-accept="1">Climb into the canopy</button>
        </div>`;
    } else if (step === 3) {
      body = `
        <div class="idlg-speaker">Scout Senna</div>
        <div class="idlg-line">She tilts her head, still relaxed in the branch.</div>
        <div class="idlg-line">"Three months ago, a Dominion infiltrator came through with a signal torch buried under his bedroll and a full week's worth of fire-starter packed into a false canteen bottom. Burned two platforms before we got it out."</div>
        <div class="idlg-line">"So now we check. Anything else you want to debate, or can I go back to watching the ridge?"</div>
        <div class="idlg-actions">
          <button class="idlg-btn-primary" data-step="2">Hold out your hands — nothing to hide</button>
        </div>`;
    }

    overlay.innerHTML = `
      <div class="idlg-panel">
        <div class="idlg-header">
          <span class="idlg-title">Approach to Thornhaven</span>
          <button class="city-map-close" data-dismiss="1">✕</button>
        </div>
        <div class="idlg-body">${body}</div>
      </div>`;

    overlay.querySelectorAll('[data-step]').forEach(btn =>
      btn.addEventListener('click', () => render(parseInt(btn.dataset.step))));
    overlay.querySelectorAll('[data-accept]').forEach(btn =>
      btn.addEventListener('click', () => _completeThornhavenIntro()));
    overlay.querySelectorAll('[data-dismiss]').forEach(btn =>
      btn.addEventListener('click', () => overlay.remove()));
  }

  render(1);
  document.body.appendChild(overlay);
  overlay._keyHandler = e => { if (e.key === 'Escape') overlay.remove(); };
  document.addEventListener('keydown', overlay._keyHandler);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

function _completeThornhavenIntro() {
  const overlay = document.getElementById('thornhaven-intro-overlay');
  if (overlay) {
    if (overlay._keyHandler) document.removeEventListener('keydown', overlay._keyHandler);
    overlay.remove();
  }
  const player = PlayerSystem.current;
  if (!player) return;
  if (!player.quests.completed) player.quests.completed = [];
  player.quests.completed.push({ questId: 'thornhaven_scout_intro', outcome: 'success', ts: Date.now() });
  SaveSystem.save();
  _renderMapPage();
}

function _completeTWBldgQuest(questId, overlayId) {
  const overlay = document.getElementById(overlayId);
  if (overlay) {
    if (overlay._keyHandler) document.removeEventListener('keydown', overlay._keyHandler);
    overlay.remove();
  }
  document.querySelectorAll('.city-map-overlay').forEach(o => o.remove());
  const player = PlayerSystem.current;
  if (!player) return;
  if (!player.quests.completed) player.quests.completed = [];
  player.quests.completed.push({ questId, outcome: 'success', ts: Date.now() });
  SaveSystem.save();
  _renderMapPage();
}

const _THORNHAVEN_BLDG_DIALOGUES = {
  thornhaven_intro_market: {
    overlayId: 'tw-bldg-market-overlay',
    title: 'The Trading Post',
    steps: [
      {
        speaker: 'Trader Nin',
        lines: [
          '"Sit down if you want. Or don\'t. I\'m not going anywhere."',
          'A wiry man with bark-dyed sleeves leans back against a post, arms crossed, entirely unhurried.',
          '"We run three things here: provisions, gear repair, and the cleansing basin — that\'s what other factions call a shrine. Food matters out in the field. Go hungry long enough and you\'ll feel it in your hands before you feel it in your stomach."',
        ],
        actions: [{ label: 'Ask about gear repair', next: 2 }, { label: 'Come back later', dismiss: true }],
      },
      {
        speaker: 'Trader Nin',
        lines: [
          '"Repair\'s simple. Equipment degrades. Degraded equipment costs you in fights. Bring it here and we\'ll see it right."',
          '"Cleansing basin is the third tab inside — that\'s for corruption. Tainted areas leave a residue. Leave it long enough and it starts pulling at you. The basin clears it."',
          'He uncrosses his arms and picks up a mug.',
          '"No rush. Thornhaven doesn\'t work on Dominion time."',
        ],
        actions: [{ label: 'Understood', complete: true }],
      },
    ],
  },

  thornhaven_intro_training: {
    overlayId: 'tw-bldg-training-overlay',
    title: 'The Rangerpost',
    steps: [
      {
        speaker: 'Rangermaster Vaen',
        lines: [
          '"You want to improve. Good instinct — most people wait until they\'re losing."',
          'A tall, unhurried figure with a carved shortbow over one shoulder meets your eyes without ceremony.',
          '"Skills here are the same as anywhere — melee, ranged, magic, stealth, restoration, defense, and the crafting disciplines. You invest stat points to raise them. Points come from quests and levelling."',
        ],
        actions: [{ label: 'Ask how skills scale', next: 2 }, { label: 'Come back later', dismiss: true }],
      },
      {
        speaker: 'Rangermaster Vaen',
        lines: [
          '"Effective skill isn\'t a straight line from raw points. It curves. That\'s by design — the first points in a skill give the most return. After a threshold, you\'re getting less per point."',
          '"Most experienced fighters spread across a few skills rather than sinking everything into one. Think about what you\'re trying to survive out there and invest accordingly."',
          'He gestures toward the training floor.',
          '"Door\'s open."',
        ],
        actions: [{ label: 'Understood', complete: true }],
      },
    ],
  },

  thornhaven_intro_crafting: {
    overlayId: 'tw-bldg-crafting-overlay',
    title: 'The Woodwright\'s Loft',
    steps: [
      {
        speaker: 'Woodwright Lira',
        lines: [
          '"Oh good — someone who doesn\'t immediately ask where the iron is."',
          'A young woman with sawdust in her hair and a very focused expression looks up from a half-finished bow stave.',
          '"Crafting here works the same as anywhere mechanically, but our materials are different. We work with natural materials — hide, bone, wood, fibre. Lighter than plate, more flexible, and in the right hands, just as effective."',
        ],
        actions: [{ label: 'Ask about professions', next: 2 }, { label: 'Come back later', dismiss: true }],
      },
      {
        speaker: 'Woodwright Lira',
        lines: [
          '"Different professions cover different categories — woodworking, tailoring, alchemy, and so on. Each has its own skill track. The higher your skill in a profession, the better the quality of what you produce."',
          '"Materials come from the field. The crafting page will show you what you can make with what you\'ve got. I\'d suggest starting with something practical — something you\'ll actually use."',
          'She goes back to the bow stave.',
          '"Come in whenever you\'re ready."',
        ],
        actions: [{ label: 'Understood', complete: true }],
      },
    ],
  },

  thornhaven_intro_guilds: {
    overlayId: 'tw-bldg-guilds-overlay',
    title: 'The Hollow Hall',
    steps: [
      {
        speaker: 'Elder Rowan',
        lines: [
          '"The guilds don\'t advertise. You have to know to look."',
          'An older woman with a carved staff and a patient expression is sitting outside the hall, watching the canopy sway.',
          '"Three guilds operate within our network: the Ashguard, the Black Sigil, and the Veil Syndicate. Each aligns with a different kind of work — fighting, arcane, and covert. You pick one."',
        ],
        actions: [{ label: 'Ask what guild membership means', next: 2 }, { label: 'Come back later', dismiss: true }],
      },
      {
        speaker: 'Elder Rowan',
        lines: [
          '"A guild gives you a second contract board — better assignments, better pay, harder requirements. You also build reputation. Reputation opens more of that board over time."',
          '"Lose reputation and those doors close. We value reliability here, not just results."',
          'She stands slowly.',
          '"Go inside and have a look. No obligation yet."',
        ],
        actions: [{ label: 'Understood', complete: true }],
      },
    ],
  },

  thornhaven_intro_quests: {
    overlayId: 'tw-bldg-quests-overlay',
    title: 'The Assignment Board',
    steps: [
      {
        speaker: 'Coordinator Ash',
        lines: [
          '"The board is woven, not pinned. Wind takes things sometimes. Check it daily."',
          'A calm, methodical young man is running a finger along the board\'s edge, making small adjustments.',
          '"Assignments refresh each morning. Every one has a skill requirement — your effective skill versus the requirement determines your odds. We don\'t pad the numbers here. If you\'re below threshold, you\'ll feel it."',
        ],
        actions: [{ label: 'Ask about the rewards', next: 2 }, { label: 'Come back later', dismiss: true }],
      },
      {
        speaker: 'Coordinator Ash',
        lines: [
          '"Rewards are gold and loot. Higher tiers pay more. You can only hold one active assignment at a time, and they run on a real clock."',
          '"If you\'re in a guild, you\'ll have a second board separate from this one. Guild assignments are harder, pay better, and require reputation to unlock."',
          '"Come back tomorrow if the board looks thin today. Rotation matters."',
        ],
        actions: [{ label: 'Understood', complete: true }],
      },
    ],
  },

  thornhaven_intro_shrine: {
    overlayId: 'tw-bldg-shrine-overlay',
    title: 'The Canopy Shrine',
    steps: [
      {
        speaker: 'Canopy Warden Fen',
        lines: [
          '"You\'re carrying something with you. Not in your pack — in your aura. Sit down for a moment."',
          'A slight figure in grey-green cloth is perched on a curved root, eyes half-closed.',
          '"Corruption. Most people don\'t notice it until it\'s too late to ignore. It builds when you spend time in tainted areas — ruins, cursed ground, anywhere the old magic went wrong. It doesn\'t hurt at first."',
        ],
        actions: [{ label: 'Ask what happens if it builds up', next: 2 }, { label: 'Come back later', dismiss: true }],
      },
      {
        speaker: 'Canopy Warden Fen',
        lines: [
          '"Eventually it degrades your performance — your stats erode, your focus clouds. The shrine clears it. It costs a little gold, takes a moment, and the effect is immediate."',
          '"You\'ll find the cleansing basin through the market. Third tab. I tend it, and I\'m here most days."',
          'She opens her eyes fully.',
          '"Don\'t wait until you can feel it. Come before that."',
        ],
        actions: [{ label: 'Understood', complete: true }],
      },
    ],
  },
};

function _openThornhavenBldgDialogue(questId) {
  const cfg = _THORNHAVEN_BLDG_DIALOGUES[questId];
  if (!cfg) return;
  if (document.getElementById(cfg.overlayId)) return;
  const overlay = document.createElement('div');
  overlay.id = cfg.overlayId;
  overlay.className = 'city-map-overlay';

  function render(stepIndex) {
    const step = cfg.steps[stepIndex - 1];
    const linesHtml = step.lines.map(l => `<div class="idlg-line">${l}</div>`).join('');
    const actionsHtml = step.actions.map(a => {
      if (a.dismiss) return `<button class="idlg-btn-secondary" data-dismiss="1">${a.label}</button>`;
      if (a.next)    return `<button class="idlg-btn-primary" data-step="${a.next}">${a.label}</button>`;
      if (a.complete) return `<button class="idlg-btn-primary" data-complete="1">${a.label}</button>`;
      return '';
    }).join('');
    overlay.innerHTML = `
      <div class="idlg-panel">
        <div class="idlg-header">
          <span class="idlg-title">${cfg.title}</span>
          <button class="city-map-close" data-dismiss="1">✕</button>
        </div>
        <div class="idlg-body">
          <div class="idlg-speaker">${step.speaker}</div>
          ${linesHtml}
          <div class="idlg-actions">${actionsHtml}</div>
        </div>
      </div>`;
    overlay.querySelectorAll('[data-step]').forEach(btn =>
      btn.addEventListener('click', () => render(parseInt(btn.dataset.step))));
    overlay.querySelectorAll('[data-dismiss]').forEach(btn =>
      btn.addEventListener('click', () => overlay.remove()));
    overlay.querySelectorAll('[data-complete]').forEach(btn =>
      btn.addEventListener('click', () =>
        _completeTWBldgQuest(questId, cfg.overlayId)));
  }

  render(1);
  document.body.appendChild(overlay);
  overlay._keyHandler = e => { if (e.key === 'Escape') overlay.remove(); };
  document.addEventListener('keydown', overlay._keyHandler);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

// ── Ashenmire intro quests ────────────────────────────────────────────────────

function _showAshenmireSentinelMarker() {
  const player = PlayerSystem.current;
  if (!player || player.faction !== 'ashen_covenant') return false;
  return !(player.quests.completed || []).some(c => c.questId === 'ashenmire_sentinel_intro');
}

function _ashenmireSentinelDone() {
  const player = PlayerSystem.current;
  if (!player) return false;
  return (player.quests.completed || []).some(c => c.questId === 'ashenmire_sentinel_intro');
}

function _showAshenmireBldgMarker(questId) {
  if (!_ashenmireSentinelDone()) return false;
  const player = PlayerSystem.current;
  if (!player || player.faction !== 'ashen_covenant') return false;
  return !(player.quests.completed || []).some(c => c.questId === questId);
}

function _openAshenmireIntroDialogue() {
  if (document.getElementById('ashenmire-intro-overlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'ashenmire-intro-overlay';
  overlay.className = 'city-map-overlay';

  function render(step) {
    let body = '';
    if (step === 1) {
      body = `
        <div class="idlg-speaker">Ash Sentinel Thael</div>
        <div class="idlg-line">"Hold."</div>
        <div class="idlg-line">The word is quiet but the effect is immediate — a faint runic lattice shimmers across the road in front of you, translucent and geometric, like frost patterns made of pale blue light. A figure in grey-black robes steps out from the outer wall's shadow, staff lowered horizontally across the path.</div>
        <div class="idlg-line">"You've walked into a ley-line intersection. Intentionally or not, the city has already catalogued you. I need to complete the registration before you can proceed."</div>
        <div class="idlg-actions">
          <button class="idlg-btn-primary" data-step="2">Stand still and let them work</button>
          <button class="idlg-btn-secondary" data-step="3">Ask what registration means</button>
        </div>`;
    } else if (step === 2) {
      body = `
        <div class="idlg-speaker">Ash Sentinel Thael</div>
        <div class="idlg-line">The sentinel raises the staff. The runes shift and compress, moving toward you slowly, then dissolving into a brief warmth against your chest. The lattice across the road fades.</div>
        <div class="idlg-line">"Resonance class: non-hostile. Affiliation confirmed." He steps aside. "You may pass."</div>
        <div class="idlg-line">A pause. "Ashenmire is not a city that tolerates ignorance of its rules. Familiarise yourself with the districts before you wander."</div>
        <div class="idlg-actions">
          <button class="idlg-btn-primary" data-accept="1">Enter Ashenmire</button>
        </div>`;
    } else if (step === 3) {
      body = `
        <div class="idlg-speaker">Ash Sentinel Thael</div>
        <div class="idlg-line">"Every individual who enters Ashenmire carries an arcane signature — a residue from exposure to magic, intentional or ambient. Unregistered signatures have caused incidents. We do not permit repeats."</div>
        <div class="idlg-line">"The registration takes seconds. It records your resonance profile and associates it with your entry. If something goes wrong inside the city, we know who was where."</div>
        <div class="idlg-line">"Any further objections, or may we proceed?"</div>
        <div class="idlg-actions">
          <button class="idlg-btn-primary" data-step="2">Stand still and let them work</button>
          <button class="idlg-btn-danger" data-step="4">Refuse</button>
        </div>`;
    } else if (step === 4) {
      body = `
        <div class="idlg-speaker">Ash Sentinel Thael</div>
        <div class="idlg-line">The sentinel regards you with an expression that suggests he has had this conversation before and found it equally unproductive each time.</div>
        <div class="idlg-line">"The lattice remains until registration is complete. You are welcome to stand here for as long as you like."</div>
        <div class="idlg-line">The barrier hums quietly. It isn't going anywhere.</div>
        <div class="idlg-actions">
          <button class="idlg-btn-primary" data-step="2">Stand still and let them work</button>
          <button class="idlg-btn-danger" data-dismiss="1">Turn back for now</button>
        </div>`;
    }

    overlay.innerHTML = `
      <div class="idlg-panel">
        <div class="idlg-header">
          <span class="idlg-title">The Gates of Ashenmire</span>
          <button class="city-map-close" data-dismiss="1">✕</button>
        </div>
        <div class="idlg-body">${body}</div>
      </div>`;

    overlay.querySelectorAll('[data-step]').forEach(btn =>
      btn.addEventListener('click', () => render(parseInt(btn.dataset.step))));
    overlay.querySelectorAll('[data-accept]').forEach(btn =>
      btn.addEventListener('click', () => _completeAshenmireIntro()));
    overlay.querySelectorAll('[data-dismiss]').forEach(btn =>
      btn.addEventListener('click', () => overlay.remove()));
  }

  render(1);
  document.body.appendChild(overlay);
  overlay._keyHandler = e => { if (e.key === 'Escape') overlay.remove(); };
  document.addEventListener('keydown', overlay._keyHandler);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

function _completeAshenmireIntro() {
  const overlay = document.getElementById('ashenmire-intro-overlay');
  if (overlay) {
    if (overlay._keyHandler) document.removeEventListener('keydown', overlay._keyHandler);
    overlay.remove();
  }
  const player = PlayerSystem.current;
  if (!player) return;
  if (!player.quests.completed) player.quests.completed = [];
  player.quests.completed.push({ questId: 'ashenmire_sentinel_intro', outcome: 'success', ts: Date.now() });
  SaveSystem.save();
  _renderMapPage();
}

function _completeACBldgQuest(questId, overlayId) {
  const overlay = document.getElementById(overlayId);
  if (overlay) {
    if (overlay._keyHandler) document.removeEventListener('keydown', overlay._keyHandler);
    overlay.remove();
  }
  document.querySelectorAll('.city-map-overlay').forEach(o => o.remove());
  const player = PlayerSystem.current;
  if (!player) return;
  if (!player.quests.completed) player.quests.completed = [];
  player.quests.completed.push({ questId, outcome: 'success', ts: Date.now() });
  SaveSystem.save();
  _renderMapPage();
}

const _ASHENMIRE_BLDG_DIALOGUES = {
  ashenmire_intro_quests: {
    overlayId: 'ac-bldg-quests-overlay',
    title: 'The Archivum',
    steps: [
      {
        speaker: 'Senior Archivist Mael',
        lines: [
          '"You\'re looking at the assignment board as if it\'s supposed to explain itself. It won\'t."',
          'A thin man in layered ash-grey robes glances over his shoulder without turning fully around.',
          '"Assignments are research contracts and field operations — we don\'t use the word \'quest\' here, but the mechanics are identical. Each has a required skill threshold. Your effective skill against that threshold determines your probability of success. We publish the numbers. Read them."',
        ],
        actions: [{ label: 'Ask about completion rewards', next: 2 }, { label: 'Come back later', dismiss: true }],
      },
      {
        speaker: 'Senior Archivist Mael',
        lines: [
          '"Successful completion earns gold and material chests. Higher-tier assignments carry higher risk and commensurate reward. You may hold one active assignment at any time — they run on a real clock, not an abstracted one."',
          '"The board refreshes daily. Guild members receive a secondary listing with elevated requirements and better compensation."',
          'He finally turns to face you fully.',
          '"The Archivum expects results, not excuses. Now — do you intend to take an assignment, or merely study the board?"',
        ],
        actions: [{ label: 'Understood', complete: true }],
      },
    ],
  },

  ashenmire_intro_market: {
    overlayId: 'ac-bldg-market-overlay',
    title: 'The Alchemists\' Exchange',
    steps: [
      {
        speaker: 'Exchanger Velith',
        lines: [
          '"Transaction or inquiry? I have time for one."',
          'A precise woman with ink-stained fingers and a measuring scale on the counter looks at you without warmth.',
          '"The Exchange handles provisions, equipment maintenance, and corruption offloading — that last one is through the Ossuary tab. Provisions sustain your survival state in the field. Neglect them and your effective output degrades. Equipment maintenance prevents further degradation from combat wear."',
        ],
        actions: [{ label: 'Ask about corruption offloading', next: 2 }, { label: 'Come back later', dismiss: true }],
      },
      {
        speaker: 'Exchanger Velith',
        lines: [
          '"Corruption accumulates in tainted regions. The Ossuary tab allows cleansing for a fee. The Covenant doesn\'t recommend allowing it to accumulate — the degradation curves are non-linear and unpleasant."',
          '"Prices here reflect Covenant rates. They are what they are."',
          'She goes back to her scale.',
          '"Make a selection or make room for paying customers."',
        ],
        actions: [{ label: 'Understood', complete: true }],
      },
    ],
  },

  ashenmire_intro_training: {
    overlayId: 'ac-bldg-training-overlay',
    title: 'The Sanctum of Forms',
    steps: [
      {
        speaker: 'Tutor Aleth',
        lines: [
          '"Ah. Someone who actually found the Sanctum. Most wander the outer ring for twenty minutes first."',
          'A composed figure with silver-threaded robes and an expression of measured patience gestures you inside.',
          '"Skills are your foundation. Six combat disciplines, seven crafting disciplines. Each is raised with stat points — earned through quests and level advancement. The relationship between raw skill and effective skill is logarithmic, not linear. You should know that before you invest."',
        ],
        actions: [{ label: 'Ask what that means practically', next: 2 }, { label: 'Come back later', dismiss: true }],
      },
      {
        speaker: 'Tutor Aleth',
        lines: [
          '"It means your first twenty points in any skill return more value than your next twenty. The Covenant recommends spreading investment across complementary disciplines rather than over-specialising in one."',
          '"Your effective skill determines success rates on assignments, quality of crafted output, and performance in combat. It is the number that matters — not the raw value."',
          '"The training hall is yours to use. I am available for consultation."',
        ],
        actions: [{ label: 'Understood', complete: true }],
      },
    ],
  },

  ashenmire_intro_crafting: {
    overlayId: 'ac-bldg-crafting-overlay',
    title: 'The Scriptorum',
    steps: [
      {
        speaker: 'Scribe Dorn',
        lines: [
          'He doesn\'t look up when you enter. There are three open books on his desk and he\'s writing in all of them.',
          '"Crafting," he says finally. "You\'re here about crafting. Stand there, I\'ll be a moment."',
          'A long pause. He closes two of the books.',
          '"Materials — gathered in the field, from enemies, from salvage — are brought here. Different professions cover different categories of output. Blacksmithing, armorsmithing, alchemy, inscription. Each has its own skill track."',
        ],
        actions: [{ label: 'Ask how to improve crafting skill', next: 2 }, { label: 'Come back later', dismiss: true }],
      },
      {
        speaker: 'Scribe Dorn',
        lines: [
          '"Crafting skill is raised the same as combat skill — stat points, earned through quests. Higher skill unlocks better recipes and improves output quality."',
          '"The Scriptorum\'s speciality is inscription and magesmithing. If you intend to work with arcane materials, this is where you\'ll do it."',
          'He reopens one of the books.',
          '"The workbench is free. Don\'t touch anything on my desk."',
        ],
        actions: [{ label: 'Understood', complete: true }],
      },
    ],
  },

  ashenmire_intro_guilds: {
    overlayId: 'ac-bldg-guilds-overlay',
    title: 'The Covenant Conclave',
    steps: [
      {
        speaker: 'Conclave Steward Yvara',
        lines: [
          '"You\'ve been registered. That means you\'re eligible. Whether you\'re suitable is a different question."',
          'A tall woman with a layered ceremonial collar stops you at the conclave entrance, evaluating.',
          '"Three guilds hold presence within Ashenmire: the Ashguard, the Black Sigil, and the Veil Syndicate. Each represents a different operational discipline. You may affiliate with one. The choice is not reversible without significant consequence."',
        ],
        actions: [{ label: 'Ask what affiliation provides', next: 2 }, { label: 'Come back later', dismiss: true }],
      },
      {
        speaker: 'Conclave Steward Yvara',
        lines: [
          '"Affiliation grants access to a secondary assignment board — elevated difficulty, elevated compensation. You also accrue reputation within your guild, which determines what becomes available to you over time."',
          '"Reputation lost is difficult to recover. The Covenant expects consistency."',
          'She steps aside from the door with a measured gesture.',
          '"Review the options inside before you commit. We prefer informed affiliates."',
        ],
        actions: [{ label: 'Understood', complete: true }],
      },
    ],
  },

  ashenmire_intro_shrine: {
    overlayId: 'ac-bldg-shrine-overlay',
    title: 'The Ossuary Spire',
    steps: [
      {
        speaker: 'Keeper Vayne',
        lines: [
          '"You carry it already. Most people who come to Ashenmire do — the ley-lines here attract it."',
          'The Ossuary is quieter than the rest of the city. A figure in deep charcoal robes stands before a low basin filled with still grey water.',
          '"Corruption. It\'s a residue — an echo of exposure to broken magic, tainted ground, places where the world\'s fabric has frayed. The body accumulates it. Over time it erodes performance in ways that are difficult to isolate until they\'re severe."',
        ],
        actions: [{ label: 'Ask how cleansing works', next: 2 }, { label: 'Come back later', dismiss: true }],
      },
      {
        speaker: 'Keeper Vayne',
        lines: [
          '"The basin draws it out. The process costs gold — not much, but the materials are not free. The effect is immediate and complete."',
          '"You\'ll find the Ossuary through the market\'s third tab. I tend the basin. I am here consistently."',
          'She looks at the water for a moment.',
          '"The Covenant does not recommend carrying corruption indefinitely. The curve past a certain threshold becomes steep."',
        ],
        actions: [{ label: 'Understood', complete: true }],
      },
    ],
  },
};

function _openAshenmireBldgDialogue(questId) {
  const cfg = _ASHENMIRE_BLDG_DIALOGUES[questId];
  if (!cfg) return;
  if (document.getElementById(cfg.overlayId)) return;
  const overlay = document.createElement('div');
  overlay.id = cfg.overlayId;
  overlay.className = 'city-map-overlay';

  function render(stepIndex) {
    const step = cfg.steps[stepIndex - 1];
    const linesHtml = step.lines.map(l => `<div class="idlg-line">${l}</div>`).join('');
    const actionsHtml = step.actions.map(a => {
      if (a.dismiss) return `<button class="idlg-btn-secondary" data-dismiss="1">${a.label}</button>`;
      if (a.next)    return `<button class="idlg-btn-primary" data-step="${a.next}">${a.label}</button>`;
      if (a.complete) return `<button class="idlg-btn-primary" data-complete="1">${a.label}</button>`;
      return '';
    }).join('');
    overlay.innerHTML = `
      <div class="idlg-panel">
        <div class="idlg-header">
          <span class="idlg-title">${cfg.title}</span>
          <button class="city-map-close" data-dismiss="1">✕</button>
        </div>
        <div class="idlg-body">
          <div class="idlg-speaker">${step.speaker}</div>
          ${linesHtml}
          <div class="idlg-actions">${actionsHtml}</div>
        </div>
      </div>`;
    overlay.querySelectorAll('[data-step]').forEach(btn =>
      btn.addEventListener('click', () => render(parseInt(btn.dataset.step))));
    overlay.querySelectorAll('[data-dismiss]').forEach(btn =>
      btn.addEventListener('click', () => overlay.remove()));
    overlay.querySelectorAll('[data-complete]').forEach(btn =>
      btn.addEventListener('click', () =>
        _completeACBldgQuest(questId, cfg.overlayId)));
  }

  render(1);
  document.body.appendChild(overlay);
  overlay._keyHandler = e => { if (e.key === 'Escape') overlay.remove(); };
  document.addEventListener('keydown', overlay._keyHandler);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

// ── Main proving quest helpers ────────────────────────────────────────────────

function _unlockWorld() {
  const player = PlayerSystem.current;
  if (!player) return;
  if (!player.flags) player.flags = { boardQuestSuccesses: 0, worldUnlocked: false };
  player.flags.worldUnlocked = true;
  SaveSystem.save();
  _renderMapPage();
}

function _acceptProvingQuest() {
  const player = PlayerSystem.current;
  if (!player) return;
  if (!player.quests.completed) player.quests.completed = [];
  player.quests.completed.push({ questId: 'main_proving_quest_accepted', outcome: 'success', ts: Date.now() });
  SaveSystem.save();
}

function _openMainQuestOverlay(overlayId, titleHtml, renderFn) {
  if (document.getElementById(overlayId)) return;
  const overlay = document.createElement('div');
  overlay.id = overlayId;
  overlay.className = 'city-map-overlay';
  const accepted = _mainQuestAccepted();
  const ready    = _boardQuestsDone();
  const count    = Math.min(PlayerSystem.current?.flags?.boardQuestSuccesses || 0, 5);

  function render(step) {
    const html = renderFn(step, accepted, ready, count);
    overlay.innerHTML = `
      <div class="idlg-panel">
        <div class="idlg-header">
          <span class="idlg-title">${titleHtml}</span>
          <button class="city-map-close" data-dismiss="1">&#x2715;</button>
        </div>
        <div class="idlg-body">${html}</div>
      </div>`;
    overlay.querySelectorAll('[data-step]').forEach(btn =>
      btn.addEventListener('click', () => render(parseInt(btn.dataset.step))));
    overlay.querySelectorAll('[data-dismiss]').forEach(btn =>
      btn.addEventListener('click', () => overlay.remove()));
    overlay.querySelectorAll('[data-accept]').forEach(btn =>
      btn.addEventListener('click', () => {
        _acceptProvingQuest();
        overlay.remove();
        document.querySelectorAll('.city-map-overlay').forEach(o => o.remove());
        _renderMapPage();
      }));
    overlay.querySelectorAll('[data-unlock]').forEach(btn =>
      btn.addEventListener('click', () => {
        overlay.remove();
        document.querySelectorAll('.city-map-overlay').forEach(o => o.remove());
        _unlockWorld();
      }));
  }

  render(1);
  document.body.appendChild(overlay);
  overlay._keyHandler = e => { if (e.key === 'Escape') overlay.remove(); };
  document.addEventListener('keydown', overlay._keyHandler);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

// ── Iron Dominion — Commander Aldren ─────────────────────────────────────────

function _openIronholdMainQuestDialogue() {
  _openMainQuestOverlay('ironhold-main-quest-overlay', "Commander's Quarters", function(step, accepted, ready, count) {
    if (!accepted) {
      if (step === 1) return `
        <div class="idlg-speaker">Commander Aldren</div>
        <div class="idlg-line">"You've found your footing. Good. But standing in Ironhold and knowing where the forge is doesn't make you useful to the Dominion."</div>
        <div class="idlg-line">He unfolds a worn map across the table. Campaign markers and route lines cover every inch of it.</div>
        <div class="idlg-line">"The Dominion's reach extends far beyond these walls. The other factions are out there — the Thornwood to the west, the Covenant to the north. Contested ruins between all of us. We hold what we take and keep what we earn."</div>
        <div class="idlg-actions">
          <button class="idlg-btn-primary" data-step="2">Ask what is required of you</button>
          <button class="idlg-btn-secondary" data-dismiss="1">Come back later</button>
        </div>`;
      return `
        <div class="idlg-speaker">Commander Aldren</div>
        <div class="idlg-line">"The world doesn't open for free. Before you ride out, you prove you can handle it. That means real work — not drills in the yard."</div>
        <div class="idlg-line">"Five contracts from the quest board. Any tier, any type. Complete them successfully and you'll have earned the right to travel beyond our borders."</div>
        <div class="idlg-line">"Don't come back until it's done. The gate records every departure."</div>
        <div class="idlg-actions">
          <button class="idlg-btn-primary" data-accept="1">Understood. I'll return when it's done.</button>
          <button class="idlg-btn-secondary" data-step="1">Ask him to explain again</button>
        </div>`;
    }
    if (!ready) return `
      <div class="idlg-speaker">Commander Aldren</div>
      <div class="idlg-line">"You're back early. I said five contracts."</div>
      <div class="idlg-line">He taps the campaign map without looking up.</div>
      <div class="idlg-line">"Come back when you've completed five. You're at ${count} of 5."</div>
      <div class="idlg-actions">
        <button class="idlg-btn-secondary" data-dismiss="1">I'll keep working.</button>
      </div>`;
    return `
      <div class="idlg-speaker">Commander Aldren</div>
      <div class="idlg-line">Aldren sets down his quill and looks you over properly for the first time.</div>
      <div class="idlg-line">"Five contracts. All successful. You've done what I asked."</div>
      <div class="idlg-line">"The Dominion's borders are open to you now. The ruins zone, Covenant territories, the Thornwood — you'll find work, enemies, and opportunity in all of them. Watch your back out there."</div>
      <div class="idlg-line">He marks something in his ledger and nods once. <em>The gates are open.</em></div>
      <div class="idlg-actions">
        <button class="idlg-btn-primary" data-unlock="1">Thank him and go.</button>
      </div>`;
  });
}

// ── Thornwood — Elder Rowan ───────────────────────────────────────────────────

function _openThornhavenMainQuestDialogue() {
  _openMainQuestOverlay('thornhaven-main-quest-overlay', "The Elder's Platform", function(step, accepted, ready, count) {
    if (!accepted) {
      if (step === 1) return `
        <div class="idlg-speaker">Elder Rowan</div>
        <div class="idlg-line">The old woman is sitting cross-legged on the platform edge, bare feet dangling over the canopy below. She doesn't turn when you approach.</div>
        <div class="idlg-line">"You've learned where the food is and where the healers sleep. That's a start. Thornhaven teaches quickly — the forest doesn't wait for slow learners."</div>
        <div class="idlg-line">"But knowing the village isn't the same as knowing the world. Out past the treeline, things get complicated. Other factions. Old ruins. Creatures that don't care whose colours you wear."</div>
        <div class="idlg-actions">
          <button class="idlg-btn-primary" data-step="2">Ask how to earn the right to travel</button>
          <button class="idlg-btn-secondary" data-dismiss="1">Give her space</button>
        </div>`;
      return `
        <div class="idlg-speaker">Elder Rowan</div>
        <div class="idlg-line">She finally looks at you. Her eyes are the colour of deep bark.</div>
        <div class="idlg-line">"The Thornwood doesn't send untested folk beyond its borders. It's not about trust — it's about survival. Yours, mostly."</div>
        <div class="idlg-line">"Five jobs from the notice board. See them through — not partial, not abandoned, through. When it's done, come back here."</div>
        <div class="idlg-actions">
          <button class="idlg-btn-primary" data-accept="1">I'll be back when it's done.</button>
          <button class="idlg-btn-secondary" data-step="1">Ask her to say more</button>
        </div>`;
    }
    if (!ready) return `
      <div class="idlg-speaker">Elder Rowan</div>
      <div class="idlg-line">She glances over from whatever she's carving.</div>
      <div class="idlg-line">"Five jobs from the board. You've done ${count} of them. The other ${5 - count} won't finish themselves."</div>
      <div class="idlg-line">"Come back when you're done. I'll be here."</div>
      <div class="idlg-actions">
        <button class="idlg-btn-secondary" data-dismiss="1">Back to work.</button>
      </div>`;
    return `
      <div class="idlg-speaker">Elder Rowan</div>
      <div class="idlg-line">She sets her carving aside and stands — faster than someone her age has any right to.</div>
      <div class="idlg-line">"Five jobs. All finished. You've done well."</div>
      <div class="idlg-line">"The forest beyond Thornhaven is yours to walk now. The Dominion's roads, the Covenant's spires, the ruins — all of it. We don't keep people caged. We just make sure they're ready first."</div>
      <div class="idlg-line">She presses a small carved token into your hand. <em>"Safe paths."</em></div>
      <div class="idlg-actions">
        <button class="idlg-btn-primary" data-unlock="1">Thank her and go.</button>
      </div>`;
  });
}

// ── Ashen Covenant — Conclave Overseer Thann ─────────────────────────────────

function _openAshenmireMainQuestDialogue() {
  _openMainQuestOverlay('ashenmire-main-quest-overlay', "The Conclave Plaza", function(step, accepted, ready, count) {
    if (!accepted) {
      if (step === 1) return `
        <div class="idlg-speaker">Conclave Overseer Thann</div>
        <div class="idlg-line">The Overseer stands at the centre of the plaza, fingers interlaced, watching resonance patterns drift across the paving stones.</div>
        <div class="idlg-line">"You have been catalogued, oriented, and briefed. The Covenant's infrastructure is no longer a mystery to you. That is precisely as intended."</div>
        <div class="idlg-line">"What remains is demonstration. Knowledge without application is merely potential — and the Covenant does not extend travel clearance on potential alone."</div>
        <div class="idlg-actions">
          <button class="idlg-btn-primary" data-step="2">Ask what demonstration is required</button>
          <button class="idlg-btn-secondary" data-dismiss="1">Request time to consider</button>
        </div>`;
      return `
        <div class="idlg-speaker">Conclave Overseer Thann</div>
        <div class="idlg-line">"The assignment board maintains a list of open contracts. Field work. You will complete five of them — successfully, not partially — and present yourself here upon conclusion."</div>
        <div class="idlg-line">"Once verified, your travel registry will be updated to unrestricted. The ruins zone, the Dominion territories, the Thornwood — all accessible."</div>
        <div class="idlg-line">"The Covenant's reach is broad. We simply require our operatives to be capable before extending it to them."</div>
        <div class="idlg-actions">
          <button class="idlg-btn-primary" data-accept="1">I will return when the five are complete.</button>
          <button class="idlg-btn-secondary" data-step="1">Ask for clarification</button>
        </div>`;
    }
    if (!ready) return `
      <div class="idlg-speaker">Conclave Overseer Thann</div>
      <div class="idlg-line">He consults a small inscription plate without looking up.</div>
      <div class="idlg-line">"Your registry shows ${count} completed contracts of the required five. Return when the remainder are concluded."</div>
      <div class="idlg-line">"Efficiency is appreciated. Haste is not."</div>
      <div class="idlg-actions">
        <button class="idlg-btn-secondary" data-dismiss="1">Understood.</button>
      </div>`;
    return `
      <div class="idlg-speaker">Conclave Overseer Thann</div>
      <div class="idlg-line">He consults the inscription plate, then sets it aside with something approaching approval.</div>
      <div class="idlg-line">"Five contracts. All resolved successfully. Your registry has been updated."</div>
      <div class="idlg-line">"Unrestricted travel clearance is now active. The ruins zone, Dominion territories, and the Thornwood are accessible to you. Do not draw attention to the Covenant in hostile territory, and report anything of arcane significance upon your return."</div>
      <div class="idlg-line"><em>A soft chime resonates from the plaza stones as your travel registry updates.</em></div>
      <div class="idlg-actions">
        <button class="idlg-btn-primary" data-unlock="1">Acknowledged. I'll go.</button>
      </div>`;
  });
}
