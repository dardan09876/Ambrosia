// js/systems/craftingSystem.js
// Handles crafting logic, material management, and profession progression

const CraftingSystem = {
    // Initialize player crafting skills
    initProfessions(player) {
        if (!player.professions) {
            player.professions = {
                blacksmithing: 0,
                armorsmithing: 0,
                woodworking: 0,
                tailoring: 0,
                alchemy: 0,
                magesmithing: 0,
            };
        }
        if (!player.craftingMaterials) {
            player.craftingMaterials = {};
        }
    },

    // Crafting profession keys that live in player.skills
    PROFESSION_KEYS: ['blacksmithing', 'armorsmithing', 'woodworking', 'tailoring', 'alchemy', 'magesmithing'],

    // Get skill level for a profession — reads from player.skills (unified skill store)
    getProfessionSkill(player, profession) {
        if (player.skills && profession in player.skills) return player.skills[profession] || 0;
        this.initProfessions(player);
        return player.professions[profession] || 0;
    },

    // Get all professions and their skill levels (from player.skills)
    getAllProfessions(player) {
        if (player.skills) {
            const result = {};
            for (const key of this.PROFESSION_KEYS) {
                result[key] = player.skills[key] || 0;
            }
            return result;
        }
        this.initProfessions(player);
        return player.professions;
    },

    // Check if player can craft a recipe
    canCraft(player, recipeId) {
        const recipe = typeof getRecipe !== 'undefined' ? getRecipe(recipeId) : null;
        if (!recipe) return { ok: false, reason: 'Recipe not found.' };

        this.initProfessions(player);

        // Check skill level
        const skillLevel = this.getProfessionSkill(player, recipe.profession);
        if (skillLevel < recipe.requiredSkill) {
            return {
                ok: false,
                reason: `${recipe.profession} skill too low. Need ${recipe.requiredSkill}, have ${skillLevel}.`,
            };
        }

        // Check gold
        if (player.gold < recipe.goldCost) {
            return {
                ok: false,
                reason: `Not enough gold. Need ${recipe.goldCost}g, have ${player.gold}g.`,
            };
        }

        // Check materials
        for (const matReq of recipe.materials) {
            const amount = this.getMaterialCount(player, matReq.itemId);
            if (amount < matReq.amount) {
                const matName = typeof getMaterial !== 'undefined'
                    ? getMaterial(matReq.itemId)?.name || matReq.itemId
                    : matReq.itemId;
                return {
                    ok: false,
                    reason: `Missing ${matReq.amount} ${matName} (have ${amount}).`,
                };
            }
        }

        return { ok: true };
    },

    // Craft an item
    craft(player, recipeId) {
        const recipe = typeof getRecipe !== 'undefined' ? getRecipe(recipeId) : null;
        if (!recipe) return { ok: false, reason: 'Recipe not found.' };

        // Check if can craft
        const check = this.canCraft(player, recipeId);
        if (!check.ok) return check;

        // Consume materials
        for (const matReq of recipe.materials) {
            this.removeMaterial(player, matReq.itemId, matReq.amount);
        }

        // Consume gold
        player.gold -= recipe.goldCost;

        // Add output to inventory or crafting materials
        if (recipe.output.itemId) {
            const outputItemId = recipe.output.itemId;
            const outputAmount = recipe.output.amount || 1;

            if (typeof CRAFTING_MATERIALS !== 'undefined' && CRAFTING_MATERIALS[outputItemId]) {
                // It's a crafting component — add to materials storage
                this.addMaterial(player, outputItemId, outputAmount);
            } else if (typeof getItem !== 'undefined') {
                const template = getItem(outputItemId);
                if (template) {
                    if (template.type === 'consumable') {
                        // Stack consumables in inventory by itemId
                        const existing = player.inventory.find(
                            i => i.type === 'consumable' && i.id === outputItemId
                        );
                        if (existing) {
                            existing.quantity = (existing.quantity || 1) + outputAmount;
                        } else {
                            const instance = Object.assign({}, template);
                            instance.uid = Date.now() * 10000 + Math.floor(Math.random() * 10000);
                            instance.quantity = outputAmount;
                            player.inventory.push(instance);
                        }
                    } else {
                        // Equipment — instantiate each copy with its own uid
                        for (let i = 0; i < outputAmount; i++) {
                            const instance = Object.assign({}, template);
                            if (instance.statBonuses) {
                                instance.statBonuses = Object.assign({}, instance.statBonuses);
                            }
                            instance.uid = Date.now() * 10000 + Math.floor(Math.random() * 10000) + i;
                            player.inventory.push(instance);
                        }
                    }
                } else {
                    // Fallback: item definition not found — push a minimal placeholder
                    Log.add(`Warning: no item definition for "${outputItemId}".`, 'warning');
                }
            }
        }

        // Gain profession skill
        this.gainProfessionXp(player, recipe.profession, recipe.requiredSkill, recipe.tier || 1);

        if (typeof Log !== 'undefined') {
            const newSkill = this.getProfessionSkill(player, recipe.profession);
            Log.add(`Crafted: ${recipe.name} · ${recipe.profession} ${newSkill}`, 'success');
        }
        if (typeof SaveSystem !== 'undefined') {
            SaveSystem.save();
        }

        return {
            ok: true,
            recipe,
            message: `Successfully crafted ${recipe.name}.`,
        };
    },

    // Add material to inventory
    addMaterial(player, materialId, amount = 1) {
        this.initProfessions(player);
        if (!player.craftingMaterials[materialId]) {
            player.craftingMaterials[materialId] = 0;
        }
        player.craftingMaterials[materialId] += amount;
    },

    // Remove material from inventory
    removeMaterial(player, materialId, amount = 1) {
        this.initProfessions(player);
        if (!player.craftingMaterials[materialId]) {
            player.craftingMaterials[materialId] = 0;
        }
        player.craftingMaterials[materialId] = Math.max(0, player.craftingMaterials[materialId] - amount);
    },

    // Get material count
    getMaterialCount(player, materialId) {
        this.initProfessions(player);
        return player.craftingMaterials[materialId] || 0;
    },

    // Get all materials and their counts
    getAllMaterials(player) {
        this.initProfessions(player);
        return player.craftingMaterials;
    },

    // Gain skill in a profession — writes to player.skills, gain = recipe tier
    gainProfessionXp(player, profession, baseSkillRequired, recipeTier = 1) {
        // Determine gain with diminishing returns matching combat skills
        const current = this.getProfessionSkill(player, profession);
        const gain = current < 100 ? recipeTier * 3
                   : current < 1000 ? recipeTier * 2
                   : recipeTier;

        const before = current;
        if (player.skills && profession in player.skills) {
            player.skills[profession] = (player.skills[profession] || 0) + gain;
        } else {
            this.initProfessions(player);
            player.professions[profession] = (player.professions[profession] || 0) + gain;
        }

        const after = this.getProfessionSkill(player, profession);
        if (typeof Log !== 'undefined' && Math.floor(before / 10) < Math.floor(after / 10)) {
            Log.add(`${profession.charAt(0).toUpperCase() + profession.slice(1)} skill reached ${after}.`, 'info');
        }
    },

    // ── Repair ────────────────────────────────────────────────────────────────
    // Restores durability to max. Costs gold (see getRepairCost in affixData.js).
    repairItem(player, itemUid) {
        // Search inventory first, then equipped slots
        let item = player.inventory.find(i => String(i.uid) === String(itemUid));
        if (!item && player.equipment) {
            item = Object.values(player.equipment).find(i => i && String(i.uid) === String(itemUid));
        }
        if (!item) return { ok: false, reason: 'Item not found.' };

        const missing = (item.maxDurability || 100) - (item.durability ?? item.maxDurability ?? 100);
        if (missing <= 0) return { ok: false, reason: 'Item is already at full durability.' };

        const cost = typeof getRepairCost !== 'undefined' ? getRepairCost(item) : missing * 2;
        if (player.gold < cost) return { ok: false, reason: `Not enough gold (need ${cost}g).` };

        player.gold        -= cost;
        item.durability     = item.maxDurability;
        Log.add(`Repaired ${item.name} to full durability. (−${cost}g)`, 'success');
        SaveSystem.save();
        return { ok: true, cost };
    },

    // ── Repair All ────────────────────────────────────────────────────────────
    // Repairs every damaged item (inventory + equipped) in one action.
    repairAll(player) {
        const allGear = this.getGearInventory(player);
        const damaged = allGear.filter(i => (i.durability ?? i.maxDurability ?? 100) < (i.maxDurability ?? 100));
        if (!damaged.length) return { ok: false, reason: 'All equipment is already at full durability.' };

        let totalCost = 0;
        for (const ghost of damaged) {
            totalCost += typeof getRepairCost !== 'undefined' ? getRepairCost(ghost) : 20;
        }
        if (player.gold < totalCost) {
            return { ok: false, reason: `Not enough gold to repair everything (need ${totalCost}g, have ${player.gold}g).` };
        }

        // Mutate originals (search inventory + equipment by uid)
        let count = 0;
        for (const ghost of damaged) {
            let real = player.inventory.find(i => String(i.uid) === String(ghost.uid));
            if (!real && player.equipment) {
                real = Object.values(player.equipment).find(i => i && String(i.uid) === String(ghost.uid));
            }
            if (real) { real.durability = real.maxDurability; count++; }
        }

        player.gold -= totalCost;
        Log.add(`Repaired ${count} item${count !== 1 ? 's' : ''} for ${totalCost}g.`, 'success');
        SaveSystem.save();
        return { ok: true, totalCost, count };
    },

    // ── Reinforce (upgrade level +1) ──────────────────────────────────────────
    // Increases power/defense and adds to upgradeLevel. Uses relevant skill.
    reinforceItem(player, itemUid) {
        const item = player.inventory.find(i => String(i.uid) === String(itemUid));
        if (!item) return { ok: false, reason: 'Item not found.' };

        const tier    = item.baseTier ?? item.tier ?? 1;
        const uLevel  = item.upgradeLevel ?? 0;
        if (uLevel >= 10) return { ok: false, reason: 'Item is at maximum upgrade level (+10).' };

        // Skill for reinforcement: blacksmithing for weapons, armorsmithing for armor
        const profession = (item.category === 'armor') ? 'armorsmithing' : 'blacksmithing';
        const skillLevel = this.getProfessionSkill(player, profession);
        const chance     = typeof getUpgradeChance !== 'undefined'
            ? getUpgradeChance(skillLevel, uLevel, tier)
            : Math.max(0.15, 0.75 - uLevel * 0.12 - tier * 0.06);

        // Material cost: iron ingots for metal, rough_wood for bows/staves
        const matId  = (item.tags?.includes('wood')) ? 'rough_wood' : 'scrap_iron';
        const matAmt = tier + uLevel;
        if (this.getMaterialCount(player, matId) < matAmt) {
            const matName = typeof getMaterial !== 'undefined' ? (getMaterial(matId)?.name ?? matId) : matId;
            return { ok: false, reason: `Need ${matAmt}× ${matName}.` };
        }
        const goldCost = tier * 8 + uLevel * 5;
        if (player.gold < goldCost) return { ok: false, reason: `Need ${goldCost}g.` };

        this.removeMaterial(player, matId, matAmt);
        player.gold -= goldCost;
        this.gainProfessionXp(player, profession, skillLevel, tier);

        const roll = Math.random();
        if (roll < chance) {
            item.upgradeLevel = uLevel + 1;
            const bonusFlat   = Math.ceil(tier * 1.5);
            if (item.damage  > 0) item.damage  += bonusFlat;
            if (item.defense > 0) item.defense += Math.ceil(bonusFlat * 0.5);
            Log.add(`Reinforced ${item.name} to +${item.upgradeLevel}! (+${bonusFlat} power)`, 'success');
            SaveSystem.save();
            return { ok: true, success: true, newLevel: item.upgradeLevel };
        } else if (roll < chance + 0.20) {
            // Partial — small durability hit, no level gain
            const loss      = Math.ceil(item.maxDurability * 0.08);
            item.durability = Math.max(1, (item.durability ?? item.maxDurability) - loss);
            Log.add(`Reinforcement of ${item.name} partially failed. No upgrade, small durability loss.`, 'warning');
            SaveSystem.save();
            return { ok: true, success: false, partial: true };
        } else {
            // Fail — material and gold lost, durability loss
            const loss      = Math.ceil(item.maxDurability * 0.15);
            item.durability = Math.max(1, (item.durability ?? item.maxDurability) - loss);
            Log.add(`Reinforcement of ${item.name} failed. Materials consumed.`, 'danger');
            SaveSystem.save();
            return { ok: true, success: false, partial: false };
        }
    },

    // ── Refine (quality upgrade) ──────────────────────────────────────────────
    // Attempts to raise quality by one tier (standard → fine → superior → masterwork).
    refineItem(player, itemUid) {
        const item = player.inventory.find(i => String(i.uid) === String(itemUid));
        if (!item) return { ok: false, reason: 'Item not found.' };

        const nextQuality = typeof getNextQuality !== 'undefined' ? getNextQuality(item.quality ?? 'standard') : null;
        if (!nextQuality) return { ok: false, reason: 'Item is already at maximum quality.' };

        const tier       = item.baseTier ?? item.tier ?? 1;
        const profession = (item.category === 'armor') ? 'armorsmithing' : 'blacksmithing';
        const skillLevel = this.getProfessionSkill(player, profession);
        const chance     = typeof getRefineChance !== 'undefined'
            ? getRefineChance(skillLevel, tier)
            : Math.max(0.10, 0.45 + skillLevel * 0.003 - tier * 0.08);

        const matId  = 'veil_dust'; // refining requires magical reagent
        const matAmt = tier;
        if (this.getMaterialCount(player, matId) < matAmt) {
            return { ok: false, reason: `Need ${matAmt}× Veil Dust to refine.` };
        }
        const goldCost = tier * 15;
        if (player.gold < goldCost) return { ok: false, reason: `Need ${goldCost}g.` };

        this.removeMaterial(player, matId, matAmt);
        player.gold -= goldCost;
        this.gainProfessionXp(player, profession, skillLevel, tier);

        if (Math.random() < chance) {
            const oldQuality  = item.quality;
            item.quality      = nextQuality;
            const qualDef     = typeof getQuality !== 'undefined' ? getQuality(nextQuality) : { label: nextQuality };
            Log.add(`Refined ${item.name}: ${oldQuality} → ${qualDef.label || nextQuality}.`, 'success');
            SaveSystem.save();
            return { ok: true, success: true, newQuality: nextQuality };
        } else {
            Log.add(`Refinement of ${item.name} failed. Veil Dust consumed.`, 'warning');
            SaveSystem.save();
            return { ok: true, success: false };
        }
    },

    // ── Modify (reroll one affix) ─────────────────────────────────────────────
    // Rerolls one affix on an item. Requires veil_dust + magesmithing skill.
    modifyAffix(player, itemUid, affixIndex) {
        const item = player.inventory.find(i => String(i.uid) === String(itemUid));
        if (!item) return { ok: false, reason: 'Item not found.' };
        if (!item.affixes?.length) return { ok: false, reason: 'Item has no affixes to reroll.' };
        if (affixIndex < 0 || affixIndex >= item.affixes.length) return { ok: false, reason: 'Invalid affix index.' };

        const tier     = item.baseTier ?? item.tier ?? 1;
        const matAmt   = tier + 1;
        if (this.getMaterialCount(player, 'veil_dust') < matAmt) {
            return { ok: false, reason: `Need ${matAmt}× Veil Dust to modify affix.` };
        }
        const goldCost = tier * 20;
        if (player.gold < goldCost) return { ok: false, reason: `Need ${goldCost}g.` };

        this.removeMaterial(player, 'veil_dust', matAmt);
        player.gold -= goldCost;

        const oldAffix = item.affixes[affixIndex];
        // Roll a new affix of the same kind
        const newAffixes = typeof rollAffixes !== 'undefined'
            ? rollAffixes(item.category, item.subtype, 'uncommon') // roll as uncommon (1 affix)
            : [];
        const newAffix = newAffixes[0] ?? oldAffix;
        // Preserve kind (prefix/suffix) if available
        newAffix.kind = oldAffix.kind ?? newAffix.kind;
        item.affixes[affixIndex] = newAffix;

        this.gainProfessionXp(player, 'magesmithing', this.getProfessionSkill(player, 'magesmithing'), tier);
        Log.add(`Modified ${item.name}: replaced ${oldAffix.name} with ${newAffix.name}.`, 'success');
        SaveSystem.save();
        return { ok: true, oldAffix, newAffix };
    },

    // ── Get equippable items in inventory (for repair/reinforce/refine targets) ──
    // Includes equipped items flagged with _equipped:true and _equippedSlot.
    getGearInventory(player) {
        const results = [];
        if (player?.inventory) {
            for (const i of player.inventory) {
                if (i.slot && i.category !== 'consumable' && i.type !== 'food' && i.type !== 'chest') {
                    results.push(i);
                }
            }
        }
        if (player?.equipment) {
            for (const [slot, item] of Object.entries(player.equipment)) {
                if (item && item.uid) {
                    results.push({ ...item, _equipped: true, _equippedSlot: slot });
                }
            }
        }
        return results;
    },

    // ── Get available recipes for a profession
    getAvailableRecipes(player, profession) {
        this.initProfessions(player);
        if (typeof getAvailableRecipes === 'undefined') return [];

        const skillLevel = this.getProfessionSkill(player, profession);
        return getAvailableRecipes(profession, skillLevel);
    },

    // Get recipes that player can currently craft (has materials for)
    getCraftableRecipes(player, profession) {
        const available = this.getAvailableRecipes(player, profession);
        return available.filter(recipe => {
            const check = this.canCraft(player, recipe.id);
            return check.ok;
        });
    },
};
