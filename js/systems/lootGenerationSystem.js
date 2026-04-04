// js/systems/lootGenerationSystem.js
// Generates loot from chest opening and quest rewards

const LootGenerationSystem = {
    // Generate a single item from loot tier
    generateItem(tierNum = 1, sourceContext = {}) {
        const tier = typeof getLootTier !== 'undefined' ? getLootTier(tierNum) : null;
        if (!tier) return null;

        // Pick rarity
        const rarity = typeof pickRarity !== 'undefined' ? pickRarity(tier) : 'common';
        const rarityDef = typeof getRarity !== 'undefined' ? getRarity(rarity) : null;

        // Pick category by weight
        const category = this._pickCategory(tier);

        // Pick base item
        const baseItem = this._pickBaseItem(category, tierNum);
        if (!baseItem) return null;

        // Roll power within the tier range
        const [minPower, maxPower] = tier.itemPowerRange;
        const basePower = baseItem.basePower || 0;
        const powerVariance = Math.max(0, maxPower - minPower);
        const rolledPower = basePower + Math.floor(Math.random() * powerVariance * 0.5);

        // Apply rarity multiplier
        const finalPower = Math.floor(rolledPower * rarityDef.multiplier);
        const finalDefense = Math.floor((baseItem.baseDefense || 0) * rarityDef.multiplier);
        const finalValue = Math.floor(baseItem.baseValue * rarityDef.multiplier);

        // Build display name
        const displayName = this._buildDisplayName(baseItem, rarity);

        // Create the item
        const item = {
            uid: `item_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
            baseItemId: baseItem.id,
            displayName,
            category: baseItem.category,
            subtype: baseItem.subtype,
            slot: baseItem.slot,
            rarity,
            scalingSkill: baseItem.scalingSkill,
            tags: [...(baseItem.tags || [])],
            rolledStats: {
                power: finalPower,
                defense: finalDefense,
                durabilityMax: Math.floor(baseItem.baseDurability * rarityDef.multiplier),
            },
            currentDurability: Math.floor(baseItem.baseDurability * rarityDef.multiplier),
            maxDurability: Math.floor(baseItem.baseDurability * rarityDef.multiplier),
            value: finalValue,
            bonuses: {
                ...((baseItem.implicitBonuses || {})),
            },
            sourceContext: {
                chestTier: tierNum,
                ...sourceContext,
            },
            isNamed: false,
        };

        return item;
    },

    // Generate multiple items from a chest
    generateChestLoot(tierNum = 1, sourceContext = {}) {
        const tier = typeof getLootTier !== 'undefined' ? getLootTier(tierNum) : null;
        if (!tier) return { gold: 0, items: [], materials: [], consumables: [] };

        const gold = typeof rollGold !== 'undefined' ? rollGold(tier) : 50;

        // Generate 1-2 items
        const itemCount = Math.random() < 0.4 ? 2 : 1;
        const items = [];
        for (let i = 0; i < itemCount; i++) {
            const item = this.generateItem(tierNum, sourceContext);
            if (item) items.push(item);
        }

        // Generate materials (rare)
        const materials = [];
        if (Math.random() < 0.3) {
            materials.push({
                id: 'crafting_scrap',
                amount: Math.floor(Math.random() * 3) + 1,
            });
        }

        // Generate consumables (uncommon)
        const consumables = [];
        if (Math.random() < 0.25) {
            consumables.push({
                id: 'minor_healing_draught',
                amount: Math.floor(Math.random() * 2) + 1,
            });
        }

        return {
            gold,
            items,
            materials,
            consumables,
            reputationGains: [],
        };
    },

    // Pick a category based on tier weights
    _pickCategory(tier) {
        const weights = tier.categoryWeights || {};
        const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
        let roll = Math.random() * totalWeight;

        for (const [category, weight] of Object.entries(weights)) {
            roll -= weight;
            if (roll <= 0) return category;
        }

        return 'weapon'; // fallback
    },

    // Pick a base item for the category and tier
    _pickBaseItem(category, tier) {
        if (typeof getBaseItemsByCategory === 'undefined') return null;

        const candidates = getBaseItemsByCategory(category).filter(
            item => item.tierMin <= tier && item.tierMax >= tier
        );

        if (candidates.length === 0) return null;

        // Random weighted selection
        return candidates[Math.floor(Math.random() * candidates.length)];
    },

    // Build a display name with rarity prefix/suffix
    _buildDisplayName(baseItem, rarity) {
        const prefixes = {
            common: '',
            uncommon: 'Fine ',
            rare: 'Enchanted ',
            epic: 'Majestic ',
            legendary: 'Legendary ',
        };

        const suffixes = {
            common: '',
            uncommon: '',
            rare: ' of Quality',
            epic: ' of Power',
            legendary: ' of Legend',
        };

        const prefix = prefixes[rarity] || '';
        const suffix = suffixes[rarity] || '';

        return `${prefix}${baseItem.name}${suffix}`;
    },
};
