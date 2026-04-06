// js/delves/delveGenerator.js
// Builds the node sequence for a delve run.

const DelveGenerator = {

    generate(delveId) {
        const def = getDelveType(delveId);
        if (!def) return [];

        // Templates per delve — vary slightly each run for replayability
        const template = this._template(def);

        // Inject specific enemies and events into combat/event slots
        return template.map((node, i) => this._instantiate(node, def, i));
    },

    _template(def) {
        switch (def.tier) {
            case 1: return [
                { type: 'entrance' },
                { type: 'event',  pool: 'minor' },
                { type: 'combat', elite: false },
                { type: 'loot' },
                { type: 'event',  pool: Math.random() < 0.5 ? 'minor' : 'hazard' },
                { type: 'combat', elite: true },
                { type: 'boss' },
                { type: 'reward' },
            ];
            case 2: return [
                { type: 'entrance' },
                { type: 'combat', elite: false },
                { type: 'event',  pool: 'minor' },
                { type: 'loot' },
                { type: 'event',  pool: 'hazard' },
                { type: 'combat', elite: false },
                { type: 'combat', elite: true },
                { type: 'boss' },
                { type: 'reward' },
            ];
            case 3: return [
                { type: 'entrance' },
                { type: 'event',  pool: 'minor' },
                { type: 'combat', elite: false },
                { type: 'event',  pool: 'hazard' },
                { type: 'loot' },
                { type: 'combat', elite: false },
                { type: 'event',  pool: 'hazard' },
                { type: 'combat', elite: true },
                { type: 'boss' },
                { type: 'reward' },
            ];
            default: return [
                { type: 'entrance' },
                { type: 'combat', elite: false },
                { type: 'loot' },
                { type: 'boss' },
                { type: 'reward' },
            ];
        }
    },

    _instantiate(node, def, index) {
        const base = { index, ...node };

        if (node.type === 'entrance') {
            return { ...base, title: `${def.name} — Entrance`, depth: 0 };
        }

        if (node.type === 'event') {
            const ev = pickDelveEvent(node.pool);
            return { ...base, eventId: ev?.id || null, title: ev?.name || 'Strange Occurrence' };
        }

        if (node.type === 'combat') {
            const pool  = node.elite ? def.elitePool : def.enemyPool;
            const enemy = pool[Math.floor(Math.random() * pool.length)];
            return { ...base, enemyId: enemy, tier: def.tier, title: DELVE_ENEMIES[enemy]?.name || 'Unknown Enemy' };
        }

        if (node.type === 'loot') {
            return { ...base, chestTier: def.lootTier, title: 'Hidden Cache' };
        }

        if (node.type === 'boss') {
            return { ...base, bossId: def.bossId, title: DELVE_BOSSES[def.bossId]?.name || 'Boss' };
        }

        if (node.type === 'reward') {
            return { ...base, title: 'Reward Chamber' };
        }

        return base;
    },
};
