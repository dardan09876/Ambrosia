// js/pages/map.js
// World map page — SVG hex grid + region info panel.

let _mapInitialized = false;

Router.register("map", function () {
  _renderMapPage();
});

// ── Region art ────────────────────────────────────────────────────────────────
const _MAP_REGION_ART = {
  valdros_heart: "img/Ruins under a cosmic sky.png",
  ironfront: "img/Fortress in the foggy wasteland.png",
  steelwarden: "img/Dark fortress on a war-torn horizon.png",
  forgecrest: "img/The grand forge of Alaia.png",
  hammerveil: "img/Twilight at the blacksmiths forge.png",
  ironhold: "img/Iron Dominion under fiery skies.png",
  ashenmire: "img/City of spires and shadows.png",
  thornhaven: "img/Enchanted village in the forest.png",
  veilspire: "img/Twilight market in a gothic city.png",
  ashfall_city: "img/Volcanic ash over a gothic city.png",
  dusk_citadel: "img/Citadel at twilight with gathering forces.png",
  ashenveil: "img/Frontier city beneath the gas giant.png",
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
        <!--
            Shore haze: dilate the land silhouette, then blur heavily.
            The blur creates an alpha gradient that fades from opaque near the
            coast to transparent far out in open water.  Compositing a
            coastal-blue flood colour through that alpha gives a smooth
            gradient from shore → deep ocean.
        -->
        <filter id="shore-haze" x="-100%" y="-100%" width="300%" height="300%"
                color-interpolation-filters="sRGB">
            <feMorphology in="SourceAlpha" operator="dilate" radius="120" result="dilated"/>
            <feGaussianBlur in="dilated" stdDeviation="80" result="blurred"/>
            <feFlood flood-color="#2a6a9a" result="col"/>
            <feComposite in="col" in2="blurred" operator="in"/>
        </filter>
    </defs>

    <!-- Deep ocean -->
    <rect width="100%" height="100%" fill="#0d1e32"/>
    <!-- Soft shore gradient radiating out from all landmasses -->
    <g filter="url(#shore-haze)">${land}</g>
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
