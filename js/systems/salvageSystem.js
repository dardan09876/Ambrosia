// js/systems/salvageSystem.js
// Salvage system - break down items into crafting materials

const SalvageSystem = {
    // Salvage tables by item category
    SALVAGE_TABLES: {
        metal: {
            salvageType: 'metal',
            returnRate: 0.4, // 40% return rate
            table: [
                { materialId: 'scrap_iron', min: 1, max: 2, chance: 1.0 },
                { materialId: 'iron_ingot', min: 0, max: 1, chance: 0.35 },
                { materialId: 'charcoal', min: 0, max: 1, chance: 0.1 },
            ],
        },
        wood: {
            salvageType: 'wood',
            returnRate: 0.45,
            table: [
                { materialId: 'rough_wood', min: 1, max: 2, chance: 1.0 },
                { materialId: 'treated_plank', min: 0, max: 1, chance: 0.35 },
                { materialId: 'ash_resin', min: 0, max: 1, chance: 0.1 },
            ],
        },
        cloth: {
            salvageType: 'cloth',
            returnRate: 0.5,
            table: [
                { materialId: 'cloth_scraps', min: 1, max: 2, chance: 1.0 },
                { materialId: 'woven_cloth', min: 0, max: 1, chance: 0.35 },
                { materialId: 'fiber_bundle', min: 0, max: 1, chance: 0.25 },
            ],
        },
        leather: {
            salvageType: 'leather',
            returnRate: 0.45,
            table: [
                { materialId: 'tattered_leather', min: 1, max: 2, chance: 1.0 },
                { materialId: 'leather_strap', min: 0, max: 1, chance: 0.35 },
            ],
        },
        magical: {
            salvageType: 'magical',
            returnRate: 0.35,
            table: [
                { materialId: 'veil_dust', min: 1, max: 1, chance: 0.8 },
                { materialId: 'rift_shard', min: 0, max: 1, chance: 0.15 },
                { materialId: 'faded_sigil_wax', min: 0, max: 1, chance: 0.1 },
            ],
        },
    },

    // Check if an item can be salvaged
    canSalvage(item) {
        if (!item || !item.uid) return false;
        if (item.type === 'chest') return false;
        if (item.category === 'consumable' || item.type === 'consumable') return false;
        if (item.tags && (item.tags.includes('quest') || item.tags.includes('trophy'))) return false;
        // Must be actual equipment (has a slot or category indicating gear)
        if (!item.slot && !item.category) return false;
        return true;
    },

    // Salvage an item and return materials
    salvage(player, itemUid) {
        if (!player || !player.inventory) return { ok: false, reason: 'No player or inventory.' };

        // Find item in inventory
        const itemIdx = player.inventory.findIndex(i => String(i.uid) === String(itemUid));
        if (itemIdx === -1) return { ok: false, reason: 'Item not found in inventory.' };

        const item = player.inventory[itemIdx];

        // Check if can salvage
        if (!this.canSalvage(item)) {
            return { ok: false, reason: 'This item cannot be salvaged.' };
        }

        // Determine salvage type based on item
        let salvageType = 'metal'; // default
        if (item.category === 'armor' || item.tags?.includes('cloth')) salvageType = 'cloth';
        if (item.category === 'armor' || item.tags?.includes('leather')) salvageType = 'leather';
        if (item.tags?.includes('wood') || item.category === 'weapon' && item.subtype === 'bow')
            salvageType = 'wood';
        if (item.tags?.includes('magical') || item.tags?.includes('rift')) salvageType = 'magical';

        const salvageTable = this.SALVAGE_TABLES[salvageType] || this.SALVAGE_TABLES.metal;

        // Calculate durability modifier (support both durability and currentDurability field names)
        const curDur = item.durability ?? item.currentDurability ?? item.maxDurability ?? 100;
        const maxDur = item.maxDurability ?? 100;
        const durabilityPercent = maxDur > 0 ? curDur / maxDur : 1;
        let durabilityMod = 1.0;
        if (durabilityPercent < 0.4) durabilityMod = 0.25;
        else if (durabilityPercent < 0.75) durabilityMod = 0.5;

        // Tier/rarity/upgrade multiplier from affixData.js formula
        const craftingSkill = typeof CraftingSystem !== 'undefined'
            ? CraftingSystem.getProfessionSkill(player, 'blacksmithing')
            : 0;
        const yieldScore = typeof getSalvageYield !== 'undefined'
            ? getSalvageYield(item, craftingSkill)
            : (item.tier ?? 1) * 2;
        const yieldMult = Math.max(0.5, Math.min(3.0, yieldScore / 4));

        // Roll materials
        const materials = [];
        for (const entry of salvageTable.table) {
            if (Math.random() < entry.chance * durabilityMod) {
                const rawAmount = Math.floor(Math.random() * (entry.max - entry.min + 1)) + entry.min;
                const amount    = Math.max(0, Math.floor(rawAmount * yieldMult));
                if (amount > 0) {
                    materials.push({
                        materialId: entry.materialId,
                        amount,
                    });
                }
            }
        }

        // High-rarity or affixed items also yield rune_dust
        if ((item.affixes?.length > 0 || ['epic','legendary','named'].includes(item.rarity)) &&
            typeof CraftingSystem !== 'undefined') {
            const dustYield = (item.affixes?.length || 0) + (['legendary','named'].includes(item.rarity) ? 2 : 1);
            materials.push({ materialId: 'veil_dust', amount: dustYield });
        }

        // Add materials to player
        if (typeof CraftingSystem !== 'undefined') {
            for (const mat of materials) {
                CraftingSystem.addMaterial(player, mat.materialId, mat.amount);
            }
        }

        // Remove item from inventory
        player.inventory.splice(itemIdx, 1);

        if (typeof Log !== 'undefined') {
            const itemName = item.name || item.displayName || item.id || 'item';
            const materialStr = materials.map(m => `${m.amount}× ${m.materialId.replace(/_/g,' ')}`).join(', ');
            Log.add(`Salvaged ${itemName}: ${materialStr || 'nothing of value'}.`, 'info');
        }

        if (typeof SaveSystem !== 'undefined') {
            SaveSystem.save();
        }

        return {
            ok: true,
            item,
            materials,
            message: `Successfully salvaged ${item.name || item.displayName || 'item'}.`,
        };
    },

    // Get estimated salvage for an item (preview)
    getEstimatedSalvage(item) {
        if (!this.canSalvage(item)) return null;

        let salvageType = 'metal';
        if (item.tags?.includes('cloth')) salvageType = 'cloth';
        if (item.tags?.includes('leather')) salvageType = 'leather';
        if (item.tags?.includes('wood')) salvageType = 'wood';
        if (item.tags?.includes('magical')) salvageType = 'magical';

        const salvageTable = this.SALVAGE_TABLES[salvageType] || this.SALVAGE_TABLES.metal;

        const estimate = [];
        for (const entry of salvageTable.table) {
            if (entry.chance > 0) {
                const avgAmount = (entry.min + entry.max) / 2;
                estimate.push({
                    materialId: entry.materialId,
                    average: (avgAmount * entry.chance).toFixed(1),
                    chance: (entry.chance * 100).toFixed(0),
                });
            }
        }

        return estimate;
    },
};
