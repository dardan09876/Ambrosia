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

    // Get available recipes for a profession
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
