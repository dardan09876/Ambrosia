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
        const durMax = Math.floor(baseItem.baseDurability * rarityDef.multiplier);

        // Create the item using canonical field names expected by inventory/equip systems
        const item = {
            uid: Date.now() * 10000 + Math.floor(Math.random() * 10000),
            baseItemId: baseItem.id,
            name: displayName,
            displayName,           // keep for salvage system compatibility
            category: baseItem.category,
            subtype: baseItem.subtype,
            slot: baseItem.slot,
            tier: tierNum,
            rarity,
            scalingSkill: baseItem.scalingSkill,
            tags: [...(baseItem.tags || [])],
            damage: finalPower,
            defense: finalDefense,
            durability: durMax,
            maxDurability: durMax,
            value: finalValue,
            twoHanded: baseItem.handedness === 'two_handed',
            requiredSkill: baseItem.requirement
                ? { skill: baseItem.requirement.skill, level: baseItem.requirement.amount }
                : null,
            statBonuses: { ...(baseItem.implicitBonuses || {}) },
            sourceContext: {
                chestTier: tierNum,
                ...sourceContext,
            },
            isNamed: false,
        };

        return item;
    },

    // Generate multiple items from a chest — draws from named ITEMS pool by tier
    generateChestLoot(tierNum = 1, sourceContext = {}) {
        const tier = typeof getLootTier !== 'undefined' ? getLootTier(tierNum) : null;
        const gold = (tier && typeof rollGold !== 'undefined') ? rollGold(tier) : tierNum * 30 + 20;

        // 40% chance for 2 items, otherwise 1
        const itemCount = Math.random() < 0.4 ? 2 : 1;
        const items = [];
        for (let i = 0; i < itemCount; i++) {
            const item = this._pickNamedItem(tierNum);
            if (item) items.push(item);
        }

        return { gold, items, materials: [], consumables: [], reputationGains: [] };
    },

    // Pick a random named item from ITEMS at the given tier.
    // Falls back one tier down if nothing is found at the exact tier.
    _pickNamedItem(tierNum) {
        if (typeof getItemsByTier === 'undefined') return null;

        let pool = getItemsByTier(tierNum);

        // Fallback: if tier has no entries (shouldn't happen but safety net), try tier-1
        if (pool.length === 0 && tierNum > 1) pool = getItemsByTier(tierNum - 1);
        if (pool.length === 0) return null;

        const base = pool[Math.floor(Math.random() * pool.length)];
        const item = getItem(base.id);
        if (!item) return null;

        // Assign a unique instance id
        item.uid = Date.now() * 10000 + Math.floor(Math.random() * 10000);
        return item;
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
