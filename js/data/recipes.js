// js/data/recipes.js
// Crafting recipes - organized by profession and tier

const RECIPES = [
    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 1: ALCHEMY
    // ══════════════════════════════════════════════════════════════════════════

    {
        id: 'weak_healing_tonic',
        name: 'Weak Healing Tonic',
        profession: 'alchemy',
        tier: 1,
        requiredSkill: 100,
        description: 'A basic healing draught for minor wounds.',
        materials: [
            { itemId: 'herbs', amount: 2 },
            { itemId: 'glass_vial', amount: 1 },
            { itemId: 'river_water', amount: 1 },
        ],
        goldCost: 6,
        output: {
            itemId: 'weak_healing_tonic',
            amount: 1,
        },
    },
    {
        id: 'weak_mana_tonic',
        name: 'Weak Mana Tonic',
        profession: 'alchemy',
        tier: 1,
        requiredSkill: 200,
        description: 'Restores a small amount of mana.',
        materials: [
            { itemId: 'herbs', amount: 2 },
            { itemId: 'veil_dust', amount: 1 },
            { itemId: 'glass_vial', amount: 1 },
        ],
        goldCost: 8,
        output: {
            itemId: 'weak_mana_tonic',
            amount: 1,
        },
    },
    {
        id: 'stamina_draught',
        name: 'Stamina Draught',
        profession: 'alchemy',
        tier: 1,
        requiredSkill: 300,
        description: 'Restores stamina for continued exertion.',
        materials: [
            { itemId: 'herbs', amount: 2 },
            { itemId: 'beast_fat', amount: 1 },
            { itemId: 'glass_vial', amount: 1 },
        ],
        goldCost: 8,
        output: {
            itemId: 'stamina_draught',
            amount: 1,
        },
    },
    {
        id: 'dried_ration_pack',
        name: 'Dried Ration Pack',
        profession: 'alchemy',
        tier: 1,
        requiredSkill: 100,
        description: 'Dried food for survival during travel.',
        materials: [
            { itemId: 'beast_fat', amount: 1 },
            { itemId: 'herbs', amount: 2 },
            { itemId: 'fiber_bundle', amount: 1 },
        ],
        goldCost: 5,
        output: {
            itemId: 'dried_ration_pack',
            amount: 1,
        },
    },
    {
        id: 'minor_rift_ward',
        name: 'Minor Rift Ward',
        profession: 'alchemy',
        tier: 2,
        requiredSkill: 500,
        description: 'Protects against minor rift corruption.',
        materials: [
            { itemId: 'veil_dust', amount: 1 },
            { itemId: 'ash_resin', amount: 1 },
            { itemId: 'glass_vial', amount: 1 },
        ],
        goldCost: 12,
        output: {
            itemId: 'minor_rift_ward',
            amount: 1,
        },
    },

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 1: BLACKSMITHING
    // ══════════════════════════════════════════════════════════════════════════

    {
        id: 'iron_dagger',
        name: 'Iron Dagger',
        profession: 'blacksmithing',
        tier: 1,
        requiredSkill: 100,
        description: 'A reliable iron dagger for close combat.',
        materials: [
            { itemId: 'iron_ingot', amount: 2 },
            { itemId: 'wood_handle', amount: 1 },
        ],
        goldCost: 10,
        output: {
            itemId: 'iron_dagger',
            amount: 1,
        },
    },
    {
        id: 'iron_sword',
        name: 'Iron Sword',
        profession: 'blacksmithing',
        tier: 1,
        requiredSkill: 300,
        description: 'A solid iron sword for melee combat.',
        materials: [
            { itemId: 'iron_ingot', amount: 3 },
            { itemId: 'wood_handle', amount: 1 },
            { itemId: 'leather_strap', amount: 1 },
        ],
        goldCost: 16,
        output: {
            itemId: 'iron_sword',
            amount: 1,
        },
    },
    {
        id: 'iron_axe',
        name: 'Iron Axe',
        profession: 'blacksmithing',
        tier: 1,
        requiredSkill: 500,
        description: 'A heavy iron axe for powerful strikes.',
        materials: [
            { itemId: 'iron_ingot', amount: 3 },
            { itemId: 'wood_handle', amount: 1 },
        ],
        goldCost: 16,
        output: {
            itemId: 'iron_axe',
            amount: 1,
        },
    },
    {
        id: 'weapon_repair_kit',
        name: 'Weapon Repair Kit',
        profession: 'blacksmithing',
        tier: 1,
        requiredSkill: 250,
        description: 'Restores durability to damaged weapons.',
        materials: [
            { itemId: 'iron_ingot', amount: 1 },
            { itemId: 'charcoal', amount: 1 },
            { itemId: 'leather_strap', amount: 1 },
        ],
        goldCost: 8,
        output: {
            itemId: 'weapon_repair_kit',
            amount: 1,
        },
    },

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 1: TAILORING
    // ══════════════════════════════════════════════════════════════════════════

    {
        id: 'padded_gloves',
        name: 'Padded Gloves',
        profession: 'tailoring',
        tier: 1,
        requiredSkill: 100,
        description: 'Simple padded gloves for protection.',
        materials: [
            { itemId: 'cloth_scraps', amount: 2 },
            { itemId: 'tattered_leather', amount: 1 },
        ],
        goldCost: 8,
        output: {
            itemId: 'padded_gloves',
            amount: 1,
        },
    },
    {
        id: 'travelers_hood',
        name: 'Traveler\'s Hood',
        profession: 'tailoring',
        tier: 1,
        requiredSkill: 250,
        description: 'A hooded cloak for travel and warmth.',
        materials: [
            { itemId: 'woven_cloth', amount: 3 },
            { itemId: 'simple_binding', amount: 1 },
        ],
        goldCost: 12,
        output: {
            itemId: 'travelers_hood',
            amount: 1,
        },
    },
    {
        id: 'ashen_cloak',
        name: 'Ashen Cloak',
        profession: 'tailoring',
        tier: 2,
        requiredSkill: 600,
        description: 'A cloak touched by ash and rift energy.',
        materials: [
            { itemId: 'woven_cloth', amount: 4 },
            { itemId: 'ash_resin', amount: 1 },
            { itemId: 'leather_strap', amount: 1 },
        ],
        goldCost: 18,
        output: {
            itemId: 'ashen_cloak',
            amount: 1,
        },
    },

    // ══════════════════════════════════════════════════════════════════════════
    // BONUS: ARMORSMITHING (for reference, Phase 2)
    // ══════════════════════════════════════════════════════════════════════════

    {
        id: 'iron_helm',
        name: 'Iron Helm',
        profession: 'armorsmithing',
        tier: 1,
        requiredSkill: 350,
        description: 'A protective iron helmet.',
        materials: [
            { itemId: 'iron_ingot', amount: 3 },
            { itemId: 'leather_strap', amount: 1 },
        ],
        goldCost: 15,
        output: {
            itemId: 'iron_helm',
            amount: 1,
        },
    },
    {
        id: 'iron_greaves',
        name: 'Iron Greaves',
        profession: 'armorsmithing',
        tier: 2,
        requiredSkill: 750,
        description: 'Iron leg protection for defense.',
        materials: [
            { itemId: 'iron_ingot', amount: 4 },
            { itemId: 'leather_strap', amount: 2 },
        ],
        goldCost: 22,
        output: {
            itemId: 'iron_greaves',
            amount: 1,
        },
    },
    {
        id: 'buckler_shield',
        name: 'Buckler Shield',
        profession: 'armorsmithing',
        tier: 1,
        requiredSkill: 400,
        description: 'A small protective shield.',
        materials: [
            { itemId: 'iron_ingot', amount: 2 },
            { itemId: 'treated_plank', amount: 1 },
            { itemId: 'leather_strap', amount: 1 },
        ],
        goldCost: 18,
        output: {
            itemId: 'buckler_shield',
            amount: 1,
        },
    },

    // ══════════════════════════════════════════════════════════════════════════
    // BONUS: WOODWORKING (for reference, Phase 2)
    // ══════════════════════════════════════════════════════════════════════════

    {
        id: 'short_bow',
        name: 'Short Bow',
        profession: 'woodworking',
        tier: 1,
        requiredSkill: 300,
        description: 'A nimble bow for ranged combat.',
        materials: [
            { itemId: 'treated_plank', amount: 2 },
            { itemId: 'fiber_bundle', amount: 2 },
            { itemId: 'leather_strap', amount: 1 },
        ],
        goldCost: 14,
        output: {
            itemId: 'short_bow',
            amount: 1,
        },
    },
    {
        id: 'quarterstaff',
        name: 'Quarterstaff',
        profession: 'woodworking',
        tier: 1,
        requiredSkill: 100,
        description: 'A sturdy wooden staff for combat.',
        materials: [
            { itemId: 'rough_wood', amount: 2 },
            { itemId: 'simple_binding', amount: 1 },
        ],
        goldCost: 8,
        output: {
            itemId: 'quarterstaff',
            amount: 1,
        },
    },
    {
        id: 'staff_core',
        name: 'Staff Core',
        profession: 'woodworking',
        tier: 2,
        requiredSkill: 500,
        description: 'A magical staff core for arcane use.',
        materials: [
            { itemId: 'treated_plank', amount: 2 },
            { itemId: 'ash_resin', amount: 1 },
        ],
        goldCost: 12,
        output: {
            itemId: 'staff_core',
            amount: 1,
        },
    },

    // ══════════════════════════════════════════════════════════════════════════
    // BONUS: MAGESMITHING (for reference, Phase 3)
    // ══════════════════════════════════════════════════════════════════════════

    {
        id: 'warded_ring',
        name: 'Warded Ring',
        profession: 'magesmithing',
        tier: 2,
        requiredSkill: 750,
        description: 'A ring that provides magical protection.',
        materials: [
            { itemId: 'iron_ingot', amount: 1 },
            { itemId: 'veil_dust', amount: 1 },
            { itemId: 'faded_sigil_wax', amount: 1 },
        ],
        goldCost: 20,
        output: {
            itemId: 'warded_ring',
            amount: 1,
        },
    },
    {
        id: 'infused_staff',
        name: 'Infused Staff',
        profession: 'magesmithing',
        tier: 2,
        requiredSkill: 900,
        description: 'A staff infused with rift energy.',
        materials: [
            { itemId: 'staff_core', amount: 1 },
            { itemId: 'rift_shard', amount: 1 },
            { itemId: 'veil_dust', amount: 1 },
        ],
        goldCost: 28,
        output: {
            itemId: 'infused_staff',
            amount: 1,
        },
    },
];

// Helper to get recipe by ID
function getRecipe(recipeId) {
    return RECIPES.find(r => r.id === recipeId);
}

// Helper to get recipes by profession
function getRecipesByProfession(profession) {
    return RECIPES.filter(r => r.profession === profession);
}

// Helper to get recipes by tier
function getRecipesByTier(tier) {
    return RECIPES.filter(r => r.tier === tier);
}

// Helper to get recipes by profession and max skill
function getAvailableRecipes(profession, skillLevel) {
    return RECIPES.filter(
        r => r.profession === profession && r.requiredSkill <= skillLevel
    );
}
