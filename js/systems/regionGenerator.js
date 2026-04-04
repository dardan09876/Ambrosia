// js/systems/regionGenerator.js
// Procedurally generates 8x8 tile grids for world hex zones.
// Used for neutral/transitional areas that don't have handcrafted MAP_REGIONS tiles.
// Faction world hexes skip this — they use filtered MAP_REGIONS instead.

const RegionGenerator = {

    // Biome → weighted terrain distribution
    // Format: [['terrainType', weight], ...]
    BIOME_WEIGHTS: {
        plains:   [['plains',50], ['hills',20], ['forest',15], ['town',8],  ['camp',7]],
        forest:   [['forest',50], ['plains',20], ['hills',15], ['camp',10], ['tower',5]],
        fortress: [['plains',30], ['hills',20],  ['camp',20],  ['wasteland',15], ['fortress',8], ['town',7]],
        rift:     [['wasteland',30], ['ruins',20], ['plains',20], ['hills',20],  ['tower',10]],
        ruins:    [['ruins',50],  ['wasteland',30], ['tower',10], ['plains',10]],
        hills:    [['hills',50],  ['plains',25],  ['camp',15],  ['fortress',5],  ['tower',5]],
    },

    // ── Deterministic pseudo-random from string seed + index ─────────────────
    // Uses a simple LCG so the same worldHexId always generates the same map.
    _seededVal(seed, index) {
        let h = 0;
        for (let i = 0; i < seed.length; i++) {
            h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
        }
        h = (Math.imul(h ^ (h >>> 16), 0x45d9f3b)) | 0;
        h = (Math.imul(h ^ index, 0xbf58476d)) | 0;
        h = h ^ (h >>> 16);
        return (h >>> 0) / 0xffffffff; // 0..1
    },

    // ── Weighted terrain picker ───────────────────────────────────────────────
    _pickTerrain(weights, seed, index) {
        const total = weights.reduce((s, [, w]) => s + w, 0);
        let roll = this._seededVal(seed, index) * total;
        for (const [terrain, w] of weights) {
            roll -= w;
            if (roll <= 0) return terrain;
        }
        return weights[0][0];
    },

    // ── Generate an 8x8 hex grid for a world hex ─────────────────────────────
    // Returns { [tileId]: tile } — lightweight, terrain-only tiles.
    generate(worldHexId) {
        const hex = MAP_WORLD[worldHexId];
        if (!hex) return {};

        const weights = this.BIOME_WEIGHTS[hex.biome] || this.BIOME_WEIGHTS.plains;
        const SIZE = 8;
        const grid = {};

        let idx = 0;
        for (let q = 0; q < SIZE; q++) {
            for (let r = 0; r < SIZE; r++) {
                const id = `${worldHexId}__${q}_${r}`;
                const terrain = this._pickTerrain(weights, worldHexId, idx++);

                grid[id] = {
                    id,
                    q, r,
                    worldHexId,
                    // Use world hex label as region display name
                    name: `${hex.name} (${q},${r})`,
                    label: terrain,
                    terrain,
                    tier: hex.tier,
                    danger: hex.danger,
                    type: hex.type,
                    mapView: `gen_${worldHexId}`,
                    activities: [],
                    accessReq: null,
                };
            }
        }

        // Place a few special tiles based on biome
        this._placeSpecialTiles(grid, hex, worldHexId, SIZE);

        return grid;
    },

    // ── Sprinkle special tiles across the grid ────────────────────────────────
    _placeSpecialTiles(grid, hex, worldHexId, size) {
        // Always put a "town" near the center for navigation
        const midId = `${worldHexId}__${Math.floor(size / 2)}_${Math.floor(size / 2)}`;
        if (grid[midId]) {
            grid[midId].terrain = hex.biome === 'ruins' ? 'ruins' : (hex.biome === 'forest' ? 'camp' : 'town');
            grid[midId].label = 'Hub';
            grid[midId].name = `${hex.name} Hub`;
            grid[midId].activities = ['quests'];
        }
    },

    // ── Get or generate (cached in player state) ─────────────────────────────
    getOrGenerate(worldHexId) {
        const player = typeof PlayerSystem !== 'undefined' ? PlayerSystem.current : null;
        if (!player) return this.generate(worldHexId);

        if (!player.generatedRegions) player.generatedRegions = {};
        if (!player.generatedRegions[worldHexId]) {
            player.generatedRegions[worldHexId] = this.generate(worldHexId);
        }
        return player.generatedRegions[worldHexId];
    },
};
