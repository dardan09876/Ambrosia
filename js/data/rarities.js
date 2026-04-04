// js/data/rarities.js
// Rarity definitions - controls stat multipliers and affix capacity

const RARITIES = {
    common: {
        name: 'Common',
        multiplier: 1.0,
        maxAffixes: 0,
        color: '#a0a0a0',
        weight: 5000,
    },
    uncommon: {
        name: 'Uncommon',
        multiplier: 1.08,
        maxAffixes: 0,
        color: '#4a9e6b',
        weight: 3000,
    },
    rare: {
        name: 'Rare',
        multiplier: 1.18,
        maxAffixes: 1,
        color: '#4a9edb',
        weight: 1000,
    },
    epic: {
        name: 'Epic',
        multiplier: 1.32,
        maxAffixes: 2,
        color: '#9b6bd4',
        weight: 200,
    },
    legendary: {
        name: 'Legendary',
        multiplier: 1.5,
        maxAffixes: 3,
        color: '#c9a84c',
        weight: 20,
    },
};

// Helper to get rarity definition
function getRarity(rarityKey) {
    return RARITIES[rarityKey] || RARITIES.common;
}

// Helper to pick rarity by weight
function pickRarityByWeight(availableRarities) {
    const rarityEntries = availableRarities
        .map(key => [key, RARITIES[key]])
        .filter(([, r]) => r);

    const totalWeight = rarityEntries.reduce((sum, [, r]) => sum + r.weight, 0);
    let roll = Math.random() * totalWeight;

    for (const [key, rarity] of rarityEntries) {
        roll -= rarity.weight;
        if (roll <= 0) return key;
    }

    return availableRarities[0] || 'common';
}
