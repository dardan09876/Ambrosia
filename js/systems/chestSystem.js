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

        // Add materials to craftingMaterials
        if (typeof CraftingSystem !== 'undefined') {
            for (const material of loot.materials) {
                CraftingSystem.addMaterial(player, material.id, material.amount);
            }
        }

        // Consumables land in inventory as stacked items
        for (const consumable of loot.consumables) {
            const existing = player.inventory.find(
                i => i.type === 'consumable' && i.id === consumable.id
            );
            if (existing) {
                existing.quantity = (existing.quantity || 1) + (consumable.amount || 1);
            } else {
                const template = (typeof getItem !== 'undefined') ? getItem(consumable.id) : null;
                const entry = template
                    ? Object.assign({}, template, { uid: Date.now() * 10000 + Math.floor(Math.random() * 10000), quantity: consumable.amount || 1 })
                    : { uid: Date.now() * 10000 + Math.floor(Math.random() * 10000), id: consumable.id, type: 'consumable', name: consumable.id, quantity: consumable.amount || 1 };
                player.inventory.push(entry);
            }
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

    // Open a chest from player.inventory by uid (stacked chest items).
    // Returns { items, chestName, tier, gold } or null if not found.
    openFromInventory(uid) {
        const player = PlayerSystem.current;
        if (!player) return null;

        const stack = player.inventory.find(i => i.type === 'chest' && i.uid === uid);
        if (!stack) return null;

        const { tier, name: chestName } = stack;

        if ((stack.quantity || 1) <= 1) {
            player.inventory.splice(player.inventory.indexOf(stack), 1);
        } else {
            stack.quantity--;
        }

        const loot = this.open(tier, { sourceType: 'inventory_chest' });

        SaveSystem.save();

        return {
            items:     loot.items,
            chestName,
            tier,
            gold:      loot.gold,
            materials: loot.materials,
        };
    },
};
