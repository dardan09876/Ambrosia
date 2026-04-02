// js/data/chests.js
// Chest tier definitions. Each chest rolls 1–3 items from a weighted item-tier table.
// Higher chest tiers weight toward higher item tiers (Bronze → Alaium).

const CHEST_DEFS = {

    1: {
        name: 'Battered Chest',
        description: 'Weathered wood and a broken lock. Something inside rattles.',
        rolls: 1,
        // Item tier weights — higher weight = more likely
        tierWeights: [
            { itemTier: 1, weight: 80 },
            { itemTier: 2, weight: 20 },
        ],
    },

    2: {
        name: 'Iron Chest',
        description: 'Heavy iron-reinforced chest. A faction sigil has been scratched off the lid.',
        rolls: 1,
        tierWeights: [
            { itemTier: 1, weight: 40 },
            { itemTier: 2, weight: 50 },
            { itemTier: 3, weight: 10 },
        ],
    },

    3: {
        name: 'Steel Chest',
        description: 'Well-crafted steel chest bearing an old imperial seal.',
        rolls: 2,
        tierWeights: [
            { itemTier: 2, weight: 30 },
            { itemTier: 3, weight: 55 },
            { itemTier: 4, weight: 15 },
        ],
    },

    4: {
        name: 'Gilded Chest',
        description: 'Gold-inlaid and heavier than it looks. Whatever is inside was meant to stay hidden.',
        rolls: 2,
        tierWeights: [
            { itemTier: 3, weight: 25 },
            { itemTier: 4, weight: 55 },
            { itemTier: 5, weight: 20 },
        ],
    },

    5: {
        name: 'Alaium Chest',
        description: 'Forged from a metal that should not exist. It hums faintly when the rifts flare.',
        rolls: 3,
        tierWeights: [
            { itemTier: 4, weight: 40 },
            { itemTier: 5, weight: 60 },
        ],
    },

};

// Tier display names (for item drop messages)
const ITEM_TIER_NAMES = {
    1: 'Bronze',
    2: 'Iron',
    3: 'Steel',
    4: 'Gold',
    5: 'Alaium',
};

// Tier colour accents for UI badges
const ITEM_TIER_COLORS = {
    1: '#8a6e2e',   // dim bronze
    2: '#7a8090',   // iron grey
    3: '#6a9ac4',   // steel blue
    4: '#c9a84c',   // gold
    5: '#9b6bd4',   // alaium purple
};
