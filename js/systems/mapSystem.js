// js/systems/mapSystem.js
// Manages world map state: adjacency, access checks, instant gold-cost travel.

const MapSystem = {

    // Axial hex neighbours — pointy-top orientation
    DIRECTIONS: [[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]],

    // Gold cost per hop by destination tier — accumulates across multi-hop paths
    TRAVEL_COST_BY_TIER: {
        0:   25,   // starter zones
        1:   60,   // low-danger frontier
        2:  120,   // contested territory
        3:  250,   // dangerous front lines
        4:  500,   // high-danger ruins / war zones
        5: 1000,   // endgame — fortified regions
    },

    // ── Adjacency ─────────────────────────────────────────────────────────────
    getAdjacentIds(regionId) {
        const region = MAP_REGIONS[regionId];
        if (!region) return [];
        const { q, r } = region;
        const adj = [];
        for (const [dq, dr] of this.DIRECTIONS) {
            const nq = q + dq;
            const nr = r + dr;
            for (const [id, reg] of Object.entries(MAP_REGIONS)) {
                if (reg.q === nq && reg.r === nr) {
                    adj.push(id);
                    break;
                }
            }
        }
        return adj;
    },

    // ── Access requirement checks ─────────────────────────────────────────────
    meetsReq(player, req) {
        if (!req) return true;
        if (!player) return false;
        if (req.totalSkill != null) {
            return PlayerSystem.getTotalSkill() >= req.totalSkill;
        }
        if (req.anyOf) {
            return req.anyOf.some(r => PlayerSystem.getSkill(r.skill) >= r.level);
        }
        return PlayerSystem.getSkill(req.skill) >= req.level;
    },

    // ── Can travel check ──────────────────────────────────────────────────────
    canTravel(toId) {
        const player = PlayerSystem.current;
        if (!player) return { ok: false, reason: 'No player.' };

        if (PlayerSystem.isHospitalized()) {
            return { ok: false, reason: 'You are hospitalized and cannot travel.' };
        }

        const fromId = player.location;
        if (fromId === toId) return { ok: false, reason: 'Already here.' };

        const adj = this.getAdjacentIds(fromId);
        if (!adj.includes(toId)) {
            return { ok: false, reason: 'That region is not adjacent to your current location.' };
        }

        const dest = MAP_REGIONS[toId];
        if (!dest) return { ok: false, reason: 'Unknown region.' };

        if (!this.meetsReq(player, dest.accessReq)) {
            const req = dest.accessReq;
            if (req.totalSkill != null) {
                return { ok: false, reason: `Requires ${req.totalSkill} total skill to enter ${dest.name}.` };
            }
            if (req.anyOf) {
                const parts = req.anyOf.map(r => `${skillLabel(r.skill)} ${r.level}`).join(' or ');
                return { ok: false, reason: `Requires ${parts} to enter ${dest.name}.` };
            }
            return { ok: false, reason: `Requires ${skillLabel(req.skill)} ${req.level} to enter ${dest.name}.` };
        }

        return { ok: true };
    },

    // ── BFS pathfinding through accessible tiles ──────────────────────────────
    findPath(fromId, toId) {
        if (fromId === toId) return null;
        const player = PlayerSystem.current;
        const destRegion = MAP_REGIONS[toId];
        if (!destRegion || !this.meetsReq(player, destRegion.accessReq)) return null;

        const visited = new Set([fromId]);
        const queue   = [[fromId, []]];
        while (queue.length) {
            const [curr, path] = queue.shift();
            for (const nbrId of this.getAdjacentIds(curr)) {
                if (visited.has(nbrId)) continue;
                visited.add(nbrId);
                const newPath = [...path, nbrId];
                if (nbrId === toId) return newPath;
                const region = MAP_REGIONS[nbrId];
                if (region && this.meetsReq(player, region.accessReq)) {
                    queue.push([nbrId, newPath]);
                }
            }
        }
        return null;
    },

    // ── Travel cost helpers ───────────────────────────────────────────────────
    getTravelCost(regionId) {
        const dest = MAP_REGIONS[regionId];
        if (!dest) return 0;
        return this.TRAVEL_COST_BY_TIER[dest.tier] ?? this.TRAVEL_COST_BY_TIER[0];
    },

    // Total gold cost for a multi-hop path (array of region IDs to traverse)
    pathTravelCost(path) {
        let totalCost = 0;
        for (const id of path) {
            const dest = MAP_REGIONS[id];
            if (!dest) return { ok: false, reason: 'Unknown region in path.' };
            totalCost += this.TRAVEL_COST_BY_TIER[dest.tier] ?? this.TRAVEL_COST_BY_TIER[0];
        }
        return { ok: true, totalCost };
    },

    // ── Instant travel to adjacent region — deducts gold + energy ─────────────
    travel(toId) {
        const check = this.canTravel(toId);
        if (!check.ok) return check;

        const player = PlayerSystem.current;
        const dest   = MAP_REGIONS[toId];
        const cost   = this.getTravelCost(toId);

        if (player.gold < cost) {
            return { ok: false, reason: `Not enough gold. Travel to ${dest.name} costs ${cost.toLocaleString()}g (you have ${player.gold.toLocaleString()}g).` };
        }

        // Check energy cost based on destination terrain
        const tileType = TILE_TYPES[dest.terrain] || TILE_TYPES.plains;
        const energyCost = tileType.movementCost;
        const playerEnergy = player.stats.energy.value;
        if (playerEnergy < energyCost) {
            return { ok: false, reason: `Too tired to travel. Need ${energyCost} energy, have ${playerEnergy}.` };
        }

        player.gold    -= cost;
        player.stats.energy.value -= energyCost;
        player.location = toId;
        this.discoverAround(player, toId);
        this._rollEncounter(player, dest);
        Log.add(`Travelled to ${dest.name} for ${cost.toLocaleString()}g.`, 'info');
        SaveSystem.save();

        return { ok: true, region: dest };
    },

    // ── Instant multi-hop travel — deducts total gold + energy upfront ────────
    travelPath(path) {
        if (!path || path.length === 0) return { ok: false, reason: 'Empty path.' };

        const player = PlayerSystem.current;
        if (PlayerSystem.isHospitalized()) {
            return { ok: false, reason: 'You are hospitalized and cannot travel.' };
        }

        const costInfo = this.pathTravelCost(path);
        if (!costInfo.ok) return costInfo;

        // Calculate total energy cost for entire path
        let totalEnergyCost = 0;
        for (const regionId of path) {
            const region = MAP_REGIONS[regionId];
            if (region) {
                const tileType = TILE_TYPES[region.terrain] || TILE_TYPES.plains;
                totalEnergyCost += tileType.movementCost;
            }
        }

        const finalId   = path[path.length - 1];
        const finalDest = MAP_REGIONS[finalId];

        if (player.gold < costInfo.totalCost) {
            return {
                ok: false,
                reason: `Not enough gold. Journey to ${finalDest?.name ?? finalId} costs ${costInfo.totalCost.toLocaleString()}g (you have ${player.gold.toLocaleString()}g).`,
            };
        }

        if (player.stats.energy.value < totalEnergyCost) {
            return {
                ok: false,
                reason: `Too tired to travel. Journey costs ${totalEnergyCost} energy (you have ${player.stats.energy.value}).`,
            };
        }

        player.gold    -= costInfo.totalCost;
        player.stats.energy.value -= totalEnergyCost;
        player.location = finalId;
        this.discoverAround(player, finalId);

        const stops    = path.length - 1;
        const stopsStr = stops > 0 ? ` via ${stops} stop${stops > 1 ? 's' : ''}` : '';
        Log.add(`Travelled to ${finalDest?.name ?? finalId}${stopsStr} for ${costInfo.totalCost.toLocaleString()}g.`, 'info');
        SaveSystem.save();

        return { ok: true };
    },

    // ── Fog of War: Discover tiles within 2-tile radius on travel ─────────────
    discoverAround(player, regionId) {
        if (!player || !player.discoveredLocations) return;

        const discovered = new Set(player.discoveredLocations);
        discovered.add(regionId);

        // Ring 1 — all adjacent tiles
        const ring1 = this.getAdjacentIds(regionId);
        for (const adjId of ring1) {
            discovered.add(adjId);
            // Ring 2 — tiles adjacent to ring 1 (2-tile radius)
            for (const adj2Id of this.getAdjacentIds(adjId)) {
                discovered.add(adj2Id);
            }
        }

        player.discoveredLocations = Array.from(discovered);
    },

    // ── Encounter roll on tile entry ─────────────────────────────────────────
    _rollEncounter(player, region) {
        if (!region || !region.terrain) return;
        const tileType = (typeof TILE_TYPES !== 'undefined' ? TILE_TYPES[region.terrain] : null)
            || { encounterChance: 0, encounterTypes: [] };

        if (!tileType.encounterChance) return;
        if (Math.random() >= tileType.encounterChance) return;

        const types = tileType.encounterTypes || [];
        const name = types.length
            ? types[Math.floor(Math.random() * types.length)]
            : 'wandering enemies';

        if (typeof Log !== 'undefined') {
            Log.add(`⚔ Encounter: ${name} near ${region.name}.`, 'danger');
        }
    },

    // ── Travel state — travel is now instant; these stubs preserve compatibility
    isTraveling()       { return false; },
    getTravelInfo()     { return null;  },
    completeTravelIfDue() { /* no-op — travel is instant */ },

    // ── Quest tier range for a region ─────────────────────────────────────────
    QUEST_TIERS_BY_REGION_TIER: {
        0: [1],
        1: [1, 2],
        2: [2, 3],
        3: [2, 3, 4],
        4: [3, 4, 5],
        5: [4, 5],
    },

    getQuestTiersForRegion(regionId) {
        const region = MAP_REGIONS[regionId];
        if (!region) return [1, 2, 3, 4, 5];
        return this.QUEST_TIERS_BY_REGION_TIER[region.tier] ?? [1];
    },

    // ── Shelter cost by region tier ───────────────────────────────────────────
    SHELTER_COST_BY_TIER: {
        0:  10,
        1:  30,
        2:  75,
        3: 150,
        4: 300,
        5: 600,
    },

    getShelterCost(regionId) {
        const region = MAP_REGIONS[regionId];
        if (!region) return 0;
        return this.SHELTER_COST_BY_TIER[region.tier] ?? 10;
    },

    // ── Convenience helpers ───────────────────────────────────────────────────
    getCurrentRegionName() {
        const player = PlayerSystem.current;
        if (!player) return '';
        const region = MAP_REGIONS[player.location];
        return region ? region.name : player.location;
    },

    getCurrentActivities() {
        const player = PlayerSystem.current;
        if (!player) return [];
        const region = MAP_REGIONS[player.location];
        return region?.activities ?? [];
    },

    hasActivity(activity) {
        return this.getCurrentActivities().includes(activity);
    },
};
