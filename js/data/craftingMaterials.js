// js/data/craftingMaterials.js
// Crafting materials - organized by rarity and use

const CRAFTING_MATERIALS = {
    // ── COMMON RAW MATERIALS ──────────────────────────────────────────────────
    // These drop often from quests, salvage, and monsters

    scrap_iron: {
        id: 'scrap_iron',
        name: 'Scrap Iron',
        category: 'raw_metal',
        tier: 1,
        value: 3,
        tags: ['metal', 'blacksmithing'],
    },
    rough_wood: {
        id: 'rough_wood',
        name: 'Rough Wood',
        category: 'raw_wood',
        tier: 1,
        value: 3,
        tags: ['wood', 'woodworking'],
    },
    cloth_scraps: {
        id: 'cloth_scraps',
        name: 'Cloth Scraps',
        category: 'raw_cloth',
        tier: 1,
        value: 3,
        tags: ['cloth', 'tailoring'],
    },
    tattered_leather: {
        id: 'tattered_leather',
        name: 'Tattered Leather',
        category: 'raw_leather',
        tier: 1,
        value: 3,
        tags: ['leather', 'armor'],
    },
    herbs: {
        id: 'herbs',
        name: 'Herbs',
        category: 'raw_alchemy',
        tier: 1,
        value: 2,
        tags: ['alchemy', 'consumable'],
    },
    beast_bone: {
        id: 'beast_bone',
        name: 'Beast Bone',
        category: 'raw_bone',
        tier: 1,
        value: 3,
        tags: ['bone', 'crafting'],
    },
    beast_fat: {
        id: 'beast_fat',
        name: 'Beast Fat',
        category: 'raw_fat',
        tier: 1,
        value: 2,
        tags: ['animal', 'alchemy'],
    },
    ash_resin: {
        id: 'ash_resin',
        name: 'Ash Resin',
        category: 'raw_resin',
        tier: 1,
        value: 4,
        tags: ['resin', 'alchemy'],
    },
    river_water: {
        id: 'river_water',
        name: 'River Water',
        category: 'raw_water',
        tier: 1,
        value: 1,
        tags: ['water', 'alchemy'],
    },
    fiber_bundle: {
        id: 'fiber_bundle',
        name: 'Fiber Bundle',
        category: 'raw_fiber',
        tier: 1,
        value: 2,
        tags: ['fiber', 'tailoring'],
    },

    // ── REFINED MATERIALS ─────────────────────────────────────────────────────
    // Crafted from raw materials or bought at market

    iron_ingot: {
        id: 'iron_ingot',
        name: 'Iron Ingot',
        category: 'refined_metal',
        tier: 2,
        value: 8,
        tags: ['metal', 'blacksmithing', 'refined'],
    },
    wood_handle: {
        id: 'wood_handle',
        name: 'Wood Handle',
        category: 'refined_wood',
        tier: 2,
        value: 8,
        tags: ['wood', 'weapon_part'],
    },
    treated_plank: {
        id: 'treated_plank',
        name: 'Treated Plank',
        category: 'refined_wood',
        tier: 2,
        value: 8,
        tags: ['wood', 'woodworking'],
    },
    leather_strap: {
        id: 'leather_strap',
        name: 'Leather Strap',
        category: 'refined_leather',
        tier: 2,
        value: 8,
        tags: ['leather', 'armor_part'],
    },
    woven_cloth: {
        id: 'woven_cloth',
        name: 'Woven Cloth',
        category: 'refined_cloth',
        tier: 2,
        value: 8,
        tags: ['cloth', 'tailoring'],
    },
    glass_vial: {
        id: 'glass_vial',
        name: 'Glass Vial',
        category: 'refined_container',
        tier: 2,
        value: 6,
        tags: ['container', 'alchemy'],
    },
    ground_herbs: {
        id: 'ground_herbs',
        name: 'Ground Herbs',
        category: 'refined_alchemy',
        tier: 2,
        value: 5,
        tags: ['alchemy', 'ingredient'],
    },
    bone_dust: {
        id: 'bone_dust',
        name: 'Bone Dust',
        category: 'refined_bone',
        tier: 2,
        value: 5,
        tags: ['bone', 'ingredient'],
    },
    charcoal: {
        id: 'charcoal',
        name: 'Charcoal',
        category: 'refined_carbon',
        tier: 2,
        value: 5,
        tags: ['carbon', 'crafting'],
    },
    simple_binding: {
        id: 'simple_binding',
        name: 'Simple Binding',
        category: 'refined_binding',
        tier: 2,
        value: 4,
        tags: ['binding', 'crafting'],
    },

    // ── RARE MAGICAL MATERIALS ────────────────────────────────────────────────
    // Uncommon, from rift content or special drops

    rift_shard: {
        id: 'rift_shard',
        name: 'Rift Shard',
        category: 'rare_magical',
        tier: 3,
        value: 25,
        tags: ['rift', 'magical', 'rare'],
    },
    veil_dust: {
        id: 'veil_dust',
        name: 'Veil Dust',
        category: 'rare_magical',
        tier: 3,
        value: 20,
        tags: ['magical', 'restoration', 'rare'],
    },
    emberglass_fragment: {
        id: 'emberglass_fragment',
        name: 'Emberglass Fragment',
        category: 'rare_magical',
        tier: 3,
        value: 22,
        tags: ['magical', 'fire', 'rare'],
    },
    faded_sigil_wax: {
        id: 'faded_sigil_wax',
        name: 'Faded Sigil Wax',
        category: 'rare_magical',
        tier: 3,
        value: 18,
        tags: ['magical', 'arcane', 'rare'],
    },

    // ── CRAFTED COMPONENTS ────────────────────────────────────────────────────
    // Produced by professions and used as inputs for higher-tier recipes

    staff_core: {
        id: 'staff_core',
        name: 'Staff Core',
        category: 'crafted_component',
        tier: 2,
        value: 15,
        tags: ['wood', 'magic', 'crafted'],
    },
};

// Helper to get material by ID
function getMaterial(materialId) {
    return CRAFTING_MATERIALS[materialId];
}

// Helper to get materials by tier
function getMaterialsByTier(tier) {
    return Object.values(CRAFTING_MATERIALS).filter(m => m.tier === tier);
}

// Helper to get materials by category
function getMaterialsByCategory(category) {
    return Object.values(CRAFTING_MATERIALS).filter(m => m.category === category);
}

// Helper to get materials by tags
function getMaterialsByTags(tags) {
    return Object.values(CRAFTING_MATERIALS).filter(m =>
        tags.some(tag => m.tags.includes(tag))
    );
}
