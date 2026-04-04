// js/data/lootTiers.js
// Loot tier definitions - controls power bands and rarity distribution

const LOOT_TIERS = {
    1: {
        name: 'Common Cache',
        goldRange: [10, 25],
        itemPowerRange: [1, 10],
        allowedRarities: ['common', 'uncommon'],
        enchantChance: 0.03,
        namedItemChance: 0.0005,
        maxAffixes: 0,
        materialTierRange: [1, 1],
        categoryWeights: {
            weapon: 35,
            armor: 30,
            jewelry: 5,
            consumable: 15,
            crafting_material: 12,
            recipe: 2,
            relic_fragment: 1,
            currency_bundle: 0,
        },
    },
    2: {
        name: 'Sturdy Chest',
        goldRange: [25, 60],
        itemPowerRange: [8, 20],
        allowedRarities: ['common', 'uncommon', 'rare'],
        enchantChance: 0.08,
        namedItemChance: 0.001,
        maxAffixes: 1,
        materialTierRange: [1, 2],
        categoryWeights: {
            weapon: 32,
            armor: 32,
            jewelry: 8,
            consumable: 12,
            crafting_material: 12,
            recipe: 3,
            relic_fragment: 1,
            currency_bundle: 0,
        },
    },
    3: {
        name: 'Riftbound Cache',
        goldRange: [60, 120],
        itemPowerRange: [18, 35],
        allowedRarities: ['uncommon', 'rare', 'epic'],
        enchantChance: 0.16,
        namedItemChance: 0.003,
        maxAffixes: 2,
        materialTierRange: [2, 3],
        categoryWeights: {
            weapon: 28,
            armor: 28,
            jewelry: 12,
            consumable: 10,
            crafting_material: 16,
            recipe: 4,
            relic_fragment: 2,
            currency_bundle: 0,
        },
    },
    4: {
        name: 'Relic Chest',
        goldRange: [120, 250],
        itemPowerRange: [30, 50],
        allowedRarities: ['rare', 'epic', 'legendary'],
        enchantChance: 0.28,
        namedItemChance: 0.008,
        maxAffixes: 2,
        materialTierRange: [3, 4],
        categoryWeights: {
            weapon: 25,
            armor: 25,
            jewelry: 16,
            consumable: 8,
            crafting_material: 18,
            recipe: 5,
            relic_fragment: 3,
            currency_bundle: 0,
        },
    },
    5: {
        name: 'Mythic Reliquary',
        goldRange: [250, 500],
        itemPowerRange: [45, 70],
        allowedRarities: ['epic', 'legendary'],
        enchantChance: 0.4,
        namedItemChance: 0.02,
        maxAffixes: 3,
        materialTierRange: [4, 5],
        categoryWeights: {
            weapon: 22,
            armor: 22,
            jewelry: 20,
            consumable: 6,
            crafting_material: 20,
            recipe: 7,
            relic_fragment: 3,
            currency_bundle: 0,
        },
    },
};

// Helper to get tier by number
function getLootTier(tierNum) {
    return LOOT_TIERS[Math.max(1, Math.min(5, tierNum))] || LOOT_TIERS[1];
}

// Helper to pick a rarity from allowed list
function pickRarity(tier) {
    const rarities = tier.allowedRarities;
    return rarities[Math.floor(Math.random() * rarities.length)];
}

// Helper to roll gold from a tier
function rollGold(tier) {
    const [min, max] = tier.goldRange;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
