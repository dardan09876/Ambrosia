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

    // Get skill level for a profession
    getProfessionSkill(player, profession) {
        this.initProfessions(player);
        return player.professions[profession] || 0;
    },

    // Get all professions and their skill levels
    getAllProfessions(player) {
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

        // Add output to inventory
        if (recipe.output.itemId) {
            player.inventory.push({
                uid: `item_${Date.now()}_${Math.random()}`,
                itemId: recipe.output.itemId,
                amount: recipe.output.amount || 1,
            });
        }

        // Gain profession XP
        this.gainProfessionXp(player, recipe.profession, recipe.requiredSkill);

        if (typeof Log !== 'undefined') {
            Log.add(`Crafted: ${recipe.name}`, 'success');
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

    // Gain XP in a profession (simplified)
    gainProfessionXp(player, profession, baseSkillRequired) {
        this.initProfessions(player);

        // XP based on recipe difficulty
        const xpGain = Math.max(1, Math.floor(baseSkillRequired * 0.5));
        const oldSkill = player.professions[profession];
        player.professions[profession] = Math.min(100, oldSkill + xpGain);

        // Check for level up (every 10 levels)
        const oldLevel = Math.floor(oldSkill / 10);
        const newLevel = Math.floor(player.professions[profession] / 10);

        if (newLevel > oldLevel && typeof Log !== 'undefined') {
            Log.add(`${profession} skill increased to ${player.professions[profession]}.`, 'info');
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
