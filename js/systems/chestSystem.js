// js/systems/chestSystem.js
// Handles chest opening — generates loot using the new loot generation system

const ChestSystem = {

    // Open a chest by tier. Returns array of item objects awarded.
    open(chestTier, sourceContext = {}) {
        const player  = PlayerSystem.current;
        if (!player) return [];

        // Use loot generator to create items
        if (typeof LootGenerationSystem === 'undefined') return [];

        const loot = LootGenerationSystem.generateChestLoot(chestTier, {
            sourceType: 'chest',
            chestTier,
            ...sourceContext,
        });

        // Add items to inventory
        player.inventory.push(...loot.items);

        // Add materials
        for (const material of loot.materials) {
            // TODO: Add to crafting materials storage
        }

        // Add consumables
        for (const consumable of loot.consumables) {
            // TODO: Add to consumables storage
        }

        // Log the loot
        Log.add(`Chest opened: ${loot.gold}g · ${loot.items.length} item(s)`, 'info');

        return {
            gold: loot.gold,
            items: loot.items,
            materials: loot.materials,
            consumables: loot.consumables,
        };
    },

    // Open a chest from the player's chest array by uid.
    // Returns { items: [], chestName: '', tier: 1 } or null if not found.
    openFromInventory(uid) {
        const player = PlayerSystem.current;
        if (!player) return null;

        const idx    = player.chests.findIndex(c => c.uid === uid);
        if (idx === -1) return null;

        const chest = player.chests[idx];
        player.chests.splice(idx, 1);

        const loot = this.open(chest.tier, {
            sourceType: 'inventory_chest',
        });

        // Award any guild reputation if applicable
        if (player.guild && loot.items.length > 0) {
            // Could add small rep here if desired
        }

        SaveSystem.save();

        return {
            items: loot.items,
            chestName: chest.name,
            tier: chest.tier,
            gold: loot.gold,
            materials: loot.materials,
            consumables: loot.consumables,
        };
    },
};
