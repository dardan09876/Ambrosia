// js/data/rarities.js
// Rarity definitions - controls stat multipliers and affix capacity.
// Tier tells you base strength. Rarity tells you affix budget and roll quality.

const RARITIES = {
    common: {
        name: 'Common',
        multiplier: 1.0,
        maxAffixes: 0,      // no affixes — straight base stats
        color: '#a0a0a0',
        weight: 5000,
    },
    uncommon: {
        name: 'Uncommon',
        multiplier: 1.10,
        maxAffixes: 1,      // 1 prefix
        color: '#4a9e6b',
        weight: 3000,
    },
    rare: {
        name: 'Rare',
        multiplier: 1.25,
        maxAffixes: 2,      // 1–2 affixes
        color: '#4a9edb',
        weight: 1000,
    },
    epic: {
        name: 'Epic',
        multiplier: 1.45,
        maxAffixes: 2,      // always 2 affixes
        color: '#9b6bd4',
        weight: 200,
    },
    legendary: {
        name: 'Legendary',
        multiplier: 1.70,
        maxAffixes: 3,      // 2–3 affixes
        color: '#c9a84c',
        weight: 20,
    },
    named: {
        name: 'Named',
        multiplier: 2.00,
        maxAffixes: 2,      // fixed signature affixes
        color: '#e84040',
        weight: 2,          // extremely rare
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
