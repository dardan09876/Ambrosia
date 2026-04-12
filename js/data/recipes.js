// js/data/recipes.js
// Crafting recipes organised by profession and tier.
// Skill thresholds:  T1 ≤ 500  |  T2 500–1000  |  T3 1000–2000  |  T4 2000–3500  |  T5 3500–5000
//
// Material key (from craftingMaterials.js):
//  Common:   scrap_iron  rough_wood  cloth_scraps  tattered_leather  herbs  beast_fat  ash_resin  fiber_bundle  beast_bone
//  Refined:  iron_ingot  wood_handle  treated_plank  leather_strap  woven_cloth  glass_vial  charcoal  simple_binding  bone_dust  ground_herbs
//  Rare:     rift_shard  veil_dust  emberglass_fragment  faded_sigil_wax
//  Component: staff_core

const RECIPES = [

    // ══════════════════════════════════════════════════════════════════════════
    // BLACKSMITHING — melee weapons (swords, maces, hammers, spears, greatswords, daggers)
    // ══════════════════════════════════════════════════════════════════════════

    // ── T1 (skill 0–499) ──────────────────────────────────────────────────────
    { id: 'bronze_sword',      name: 'Bronze Sword',      profession: 'blacksmithing', tier: 1, requiredSkill: 0,
      description: 'A basic bronze blade.',
      materials: [{ itemId: 'scrap_iron', amount: 3 }, { itemId: 'wood_handle', amount: 1 }],
      goldCost: 6,  output: { itemId: 'bronze_sword', amount: 1 } },

    { id: 'bronze_mace',       name: 'Bronze Mace',       profession: 'blacksmithing', tier: 1, requiredSkill: 50,
      description: 'A flanged club of dull bronze.',
      materials: [{ itemId: 'scrap_iron', amount: 3 }, { itemId: 'wood_handle', amount: 1 }],
      goldCost: 6,  output: { itemId: 'bronze_mace', amount: 1 } },

    { id: 'bronze_hammer',     name: 'Bronze Hammer',     profession: 'blacksmithing', tier: 1, requiredSkill: 100,
      description: "A blacksmith's hammer repurposed for combat.",
      materials: [{ itemId: 'scrap_iron', amount: 4 }, { itemId: 'wood_handle', amount: 1 }],
      goldCost: 8,  output: { itemId: 'bronze_hammer', amount: 1 } },

    { id: 'wooden_spear',      name: 'Wooden Spear',      profession: 'blacksmithing', tier: 1, requiredSkill: 150,
      description: 'Fire-hardened spear tip on a long shaft.',
      materials: [{ itemId: 'scrap_iron', amount: 2 }, { itemId: 'rough_wood', amount: 3 }],
      goldCost: 6,  output: { itemId: 'wooden_spear', amount: 1 } },

    { id: 'crude_greatsword',  name: 'Crude Greatsword',  profession: 'blacksmithing', tier: 1, requiredSkill: 250,
      description: 'Barely more than a sharpened iron bar.',
      materials: [{ itemId: 'scrap_iron', amount: 5 }, { itemId: 'wood_handle', amount: 1 }, { itemId: 'leather_strap', amount: 1 }],
      goldCost: 10, output: { itemId: 'crude_greatsword', amount: 1 } },

    { id: 'rusty_dagger',      name: 'Rusty Dagger',      profession: 'blacksmithing', tier: 1, requiredSkill: 0,
      description: 'Light and concealable. The rust adds character.',
      materials: [{ itemId: 'scrap_iron', amount: 2 }, { itemId: 'leather_strap', amount: 1 }],
      goldCost: 4,  output: { itemId: 'rusty_dagger', amount: 1 } },

    // ── T2 (skill 500–999) ────────────────────────────────────────────────────
    { id: 'iron_sword',        name: 'Iron Sword',        profession: 'blacksmithing', tier: 2, requiredSkill: 500,
      description: 'A solid iron blade for melee combat.',
      materials: [{ itemId: 'iron_ingot', amount: 3 }, { itemId: 'wood_handle', amount: 1 }, { itemId: 'leather_strap', amount: 1 }],
      goldCost: 16, output: { itemId: 'iron_sword', amount: 1 } },

    { id: 'iron_mace',         name: 'Iron Mace',         profession: 'blacksmithing', tier: 2, requiredSkill: 550,
      description: 'Heavy iron flanges that punish armoured foes.',
      materials: [{ itemId: 'iron_ingot', amount: 3 }, { itemId: 'wood_handle', amount: 1 }],
      goldCost: 16, output: { itemId: 'iron_mace', amount: 1 } },

    { id: 'iron_hammer',       name: 'Iron Hammer',       profession: 'blacksmithing', tier: 2, requiredSkill: 600,
      description: 'Dense iron head on an ash shaft.',
      materials: [{ itemId: 'iron_ingot', amount: 4 }, { itemId: 'wood_handle', amount: 1 }],
      goldCost: 18, output: { itemId: 'iron_hammer', amount: 1 } },

    { id: 'iron_spear',        name: 'Iron Spear',        profession: 'blacksmithing', tier: 2, requiredSkill: 500,
      description: 'A leaf-bladed spear built for soldiers.',
      materials: [{ itemId: 'iron_ingot', amount: 3 }, { itemId: 'treated_plank', amount: 2 }],
      goldCost: 16, output: { itemId: 'iron_spear', amount: 1 } },

    { id: 'iron_greatsword',   name: 'Iron Greatsword',   profession: 'blacksmithing', tier: 2, requiredSkill: 700,
      description: 'Takes two hands and serious shoulders.',
      materials: [{ itemId: 'iron_ingot', amount: 5 }, { itemId: 'wood_handle', amount: 1 }, { itemId: 'leather_strap', amount: 2 }],
      goldCost: 22, output: { itemId: 'iron_greatsword', amount: 1 } },

    { id: 'iron_dagger',       name: 'Iron Dagger',       profession: 'blacksmithing', tier: 2, requiredSkill: 500,
      description: 'Slim and double-edged. Preferred by scouts.',
      materials: [{ itemId: 'iron_ingot', amount: 2 }, { itemId: 'wood_handle', amount: 1 }],
      goldCost: 10, output: { itemId: 'iron_dagger', amount: 1 } },

    { id: 'iron_axe',          name: 'Iron Axe',          profession: 'blacksmithing', tier: 2, requiredSkill: 650,
      description: 'A heavy iron axe for powerful strikes.',
      materials: [{ itemId: 'iron_ingot', amount: 3 }, { itemId: 'wood_handle', amount: 1 }],
      goldCost: 16, output: { itemId: 'iron_axe', amount: 1 } },

    // ── T3 (skill 1000–1999) ──────────────────────────────────────────────────
    { id: 'steel_sword',       name: 'Steel Sword',       profession: 'blacksmithing', tier: 3, requiredSkill: 1000,
      description: 'Forged by a master, balanced to perfection.',
      materials: [{ itemId: 'iron_ingot', amount: 5 }, { itemId: 'charcoal', amount: 2 }, { itemId: 'leather_strap', amount: 2 }],
      goldCost: 35, output: { itemId: 'steel_sword', amount: 1 } },

    { id: 'steel_mace',        name: 'Steel Mace',        profession: 'blacksmithing', tier: 3, requiredSkill: 1000,
      description: 'Polished flanges that never lose their edge.',
      materials: [{ itemId: 'iron_ingot', amount: 5 }, { itemId: 'charcoal', amount: 2 }, { itemId: 'wood_handle', amount: 1 }],
      goldCost: 35, output: { itemId: 'steel_mace', amount: 1 } },

    { id: 'steel_hammer',      name: 'Steel Warhammer',   profession: 'blacksmithing', tier: 3, requiredSkill: 1100,
      description: 'A weapon designed to end battles quickly.',
      materials: [{ itemId: 'iron_ingot', amount: 6 }, { itemId: 'charcoal', amount: 2 }, { itemId: 'wood_handle', amount: 2 }],
      goldCost: 40, output: { itemId: 'steel_hammer', amount: 1 } },

    { id: 'steel_spear',       name: 'Steel Spear',       profession: 'blacksmithing', tier: 3, requiredSkill: 1000,
      description: 'The choice of phalanx formations and elite guards.',
      materials: [{ itemId: 'iron_ingot', amount: 4 }, { itemId: 'charcoal', amount: 2 }, { itemId: 'treated_plank', amount: 3 }],
      goldCost: 38, output: { itemId: 'steel_spear', amount: 1 } },

    { id: 'steel_greatsword',  name: 'Steel Greatsword',  profession: 'blacksmithing', tier: 3, requiredSkill: 1200,
      description: 'A claymore that cleaves through light armour.',
      materials: [{ itemId: 'iron_ingot', amount: 7 }, { itemId: 'charcoal', amount: 3 }, { itemId: 'leather_strap', amount: 2 }],
      goldCost: 48, output: { itemId: 'steel_greatsword', amount: 1 } },

    { id: 'steel_dagger',      name: 'Steel Dagger',      profession: 'blacksmithing', tier: 3, requiredSkill: 1000,
      description: 'A stiletto fine enough to thread between armour plates.',
      materials: [{ itemId: 'iron_ingot', amount: 3 }, { itemId: 'charcoal', amount: 2 }, { itemId: 'leather_strap', amount: 1 }],
      goldCost: 28, output: { itemId: 'steel_dagger', amount: 1 } },

    // ── T4 (skill 2000–3499) ──────────────────────────────────────────────────
    { id: 'gold_sword',        name: 'Gilded Blade',      profession: 'blacksmithing', tier: 4, requiredSkill: 2000,
      description: 'Gold-threaded steel. As beautiful as it is deadly.',
      materials: [{ itemId: 'iron_ingot', amount: 6 }, { itemId: 'rift_shard', amount: 1 }, { itemId: 'leather_strap', amount: 2 }, { itemId: 'charcoal', amount: 2 }],
      goldCost: 80, output: { itemId: 'gold_sword', amount: 1 } },

    { id: 'gilded_mace',       name: 'Gilded Mace',       profession: 'blacksmithing', tier: 4, requiredSkill: 2000,
      description: 'A ceremonial weapon that still kills.',
      materials: [{ itemId: 'iron_ingot', amount: 6 }, { itemId: 'rift_shard', amount: 1 }, { itemId: 'wood_handle', amount: 2 }, { itemId: 'charcoal', amount: 2 }],
      goldCost: 80, output: { itemId: 'gilded_mace', amount: 1 } },

    { id: 'war_hammer',        name: 'Gilded Warhammer',  profession: 'blacksmithing', tier: 4, requiredSkill: 2200,
      description: 'Carried by champions of the Golden Order.',
      materials: [{ itemId: 'iron_ingot', amount: 7 }, { itemId: 'rift_shard', amount: 1 }, { itemId: 'charcoal', amount: 3 }, { itemId: 'wood_handle', amount: 2 }],
      goldCost: 90, output: { itemId: 'war_hammer', amount: 1 } },

    { id: 'gilded_spear',      name: 'Gilded Spear',      profession: 'blacksmithing', tier: 4, requiredSkill: 2000,
      description: "A war-lance befitting a knight of the Golden Order.",
      materials: [{ itemId: 'iron_ingot', amount: 5 }, { itemId: 'rift_shard', amount: 1 }, { itemId: 'treated_plank', amount: 3 }, { itemId: 'charcoal', amount: 2 }],
      goldCost: 85, output: { itemId: 'gilded_spear', amount: 1 } },

    { id: 'gilded_greatsword', name: 'Gilded Greatsword', profession: 'blacksmithing', tier: 4, requiredSkill: 2500,
      description: 'Longer than a man is tall.',
      materials: [{ itemId: 'iron_ingot', amount: 8 }, { itemId: 'rift_shard', amount: 2 }, { itemId: 'leather_strap', amount: 2 }, { itemId: 'charcoal', amount: 3 }],
      goldCost: 100, output: { itemId: 'gilded_greatsword', amount: 1 } },

    { id: 'shadow_blade',      name: 'Shadow Blade',      profession: 'blacksmithing', tier: 4, requiredSkill: 2000,
      description: 'The blade absorbs light.',
      materials: [{ itemId: 'iron_ingot', amount: 4 }, { itemId: 'veil_dust', amount: 1 }, { itemId: 'leather_strap', amount: 2 }, { itemId: 'charcoal', amount: 2 }],
      goldCost: 75, output: { itemId: 'shadow_blade', amount: 1 } },

    // ── T5 (skill 3500+) ──────────────────────────────────────────────────────
    { id: 'alaium_sword',      name: 'Alaium Blade',      profession: 'blacksmithing', tier: 5, requiredSkill: 3500,
      description: "A blade forged from a metal that shouldn't exist.",
      materials: [{ itemId: 'iron_ingot', amount: 8 }, { itemId: 'rift_shard', amount: 2 }, { itemId: 'emberglass_fragment', amount: 1 }, { itemId: 'charcoal', amount: 4 }],
      goldCost: 200, output: { itemId: 'alaium_sword', amount: 1 } },

    { id: 'alaium_mace',       name: 'Alaium Mace',       profession: 'blacksmithing', tier: 5, requiredSkill: 3500,
      description: 'Resonates with each strike.',
      materials: [{ itemId: 'iron_ingot', amount: 8 }, { itemId: 'rift_shard', amount: 2 }, { itemId: 'emberglass_fragment', amount: 1 }, { itemId: 'charcoal', amount: 4 }],
      goldCost: 200, output: { itemId: 'alaium_mace', amount: 1 } },

    { id: 'alaium_hammer',     name: 'Alaium Warhammer',  profession: 'blacksmithing', tier: 5, requiredSkill: 3700,
      description: 'Each blow shakes the air itself.',
      materials: [{ itemId: 'iron_ingot', amount: 10 }, { itemId: 'rift_shard', amount: 2 }, { itemId: 'emberglass_fragment', amount: 2 }, { itemId: 'charcoal', amount: 4 }],
      goldCost: 220, output: { itemId: 'alaium_hammer', amount: 1 } },

    { id: 'alaium_spear',      name: 'Alaium Lance',      profession: 'blacksmithing', tier: 5, requiredSkill: 3500,
      description: 'The tip hums with a frequency that unsettles the living.',
      materials: [{ itemId: 'iron_ingot', amount: 7 }, { itemId: 'rift_shard', amount: 2 }, { itemId: 'treated_plank', amount: 3 }, { itemId: 'emberglass_fragment', amount: 1 }],
      goldCost: 200, output: { itemId: 'alaium_spear', amount: 1 } },

    { id: 'alaium_greatsword', name: 'Alaium Greatsword', profession: 'blacksmithing', tier: 5, requiredSkill: 4000,
      description: 'Leaves a faint trail of cold light.',
      materials: [{ itemId: 'iron_ingot', amount: 12 }, { itemId: 'rift_shard', amount: 3 }, { itemId: 'emberglass_fragment', amount: 2 }, { itemId: 'charcoal', amount: 5 }],
      goldCost: 260, output: { itemId: 'alaium_greatsword', amount: 1 } },

    { id: 'phantom_dagger',    name: 'Phantom Dagger',    profession: 'blacksmithing', tier: 5, requiredSkill: 3500,
      description: 'So sharp it barely feels like a strike at all.',
      materials: [{ itemId: 'iron_ingot', amount: 5 }, { itemId: 'veil_dust', amount: 2 }, { itemId: 'faded_sigil_wax', amount: 1 }, { itemId: 'charcoal', amount: 3 }],
      goldCost: 190, output: { itemId: 'phantom_dagger', amount: 1 } },

    // ── Utility ───────────────────────────────────────────────────────────────
    { id: 'weapon_repair_kit', name: 'Weapon Repair Kit', profession: 'blacksmithing', tier: 1, requiredSkill: 250,
      description: 'Restores durability to damaged weapons.',
      materials: [{ itemId: 'iron_ingot', amount: 1 }, { itemId: 'charcoal', amount: 1 }, { itemId: 'leather_strap', amount: 1 }],
      goldCost: 8, output: { itemId: 'weapon_repair_kit', amount: 1 } },


    // ══════════════════════════════════════════════════════════════════════════
    // ARMORSMITHING — heavy armor + shields
    // ══════════════════════════════════════════════════════════════════════════

    // ── T1 ────────────────────────────────────────────────────────────────────
    { id: 'bronze_helm',       name: 'Bronze Helm',       profession: 'armorsmithing', tier: 1, requiredSkill: 0,
      description: 'A heavy bronze skullcap.',
      materials: [{ itemId: 'scrap_iron', amount: 3 }, { itemId: 'leather_strap', amount: 1 }],
      goldCost: 8,  output: { itemId: 'bronze_helm', amount: 1 } },

    { id: 'bronze_breastplate', name: 'Bronze Breastplate', profession: 'armorsmithing', tier: 1, requiredSkill: 100,
      description: 'Solid cast bronze covering neck to hip.',
      materials: [{ itemId: 'scrap_iron', amount: 5 }, { itemId: 'leather_strap', amount: 2 }],
      goldCost: 12, output: { itemId: 'bronze_breastplate', amount: 1 } },

    { id: 'bronze_pauldrons',  name: 'Bronze Pauldrons',  profession: 'armorsmithing', tier: 1, requiredSkill: 50,
      description: 'Heavy shoulder guards that protect the upper back.',
      materials: [{ itemId: 'scrap_iron', amount: 4 }, { itemId: 'leather_strap', amount: 1 }],
      goldCost: 10, output: { itemId: 'bronze_pauldrons', amount: 1 } },

    { id: 'bronze_gauntlets',  name: 'Bronze Gauntlets',  profession: 'armorsmithing', tier: 1, requiredSkill: 50,
      description: 'Articulated bronze fingers.',
      materials: [{ itemId: 'scrap_iron', amount: 3 }, { itemId: 'leather_strap', amount: 1 }],
      goldCost: 8,  output: { itemId: 'bronze_gauntlets', amount: 1 } },

    { id: 'bronze_greaves',    name: 'Bronze Greaves',    profession: 'armorsmithing', tier: 1, requiredSkill: 100,
      description: 'Shin and thigh guards cast from a single mould.',
      materials: [{ itemId: 'scrap_iron', amount: 4 }, { itemId: 'leather_strap', amount: 1 }],
      goldCost: 10, output: { itemId: 'bronze_greaves', amount: 1 } },

    { id: 'bronze_sabatons',   name: 'Bronze Sabatons',   profession: 'armorsmithing', tier: 1, requiredSkill: 50,
      description: 'Plated boot covers. Noisy on cobblestones.',
      materials: [{ itemId: 'scrap_iron', amount: 3 }, { itemId: 'leather_strap', amount: 1 }],
      goldCost: 8,  output: { itemId: 'bronze_sabatons', amount: 1 } },

    { id: 'bronze_shield',     name: 'Bronze Shield',     profession: 'armorsmithing', tier: 1, requiredSkill: 200,
      description: 'Battered bronze, but better than nothing.',
      materials: [{ itemId: 'scrap_iron', amount: 4 }, { itemId: 'treated_plank', amount: 1 }, { itemId: 'leather_strap', amount: 1 }],
      goldCost: 12, output: { itemId: 'bronze_shield', amount: 1 } },

    // ── T2 ────────────────────────────────────────────────────────────────────
    { id: 'iron_helm',         name: 'Iron Helm',         profession: 'armorsmithing', tier: 2, requiredSkill: 500,
      description: 'Solid iron, well-fitted.',
      materials: [{ itemId: 'iron_ingot', amount: 3 }, { itemId: 'leather_strap', amount: 1 }],
      goldCost: 15, output: { itemId: 'iron_helm', amount: 1 } },

    { id: 'iron_chestplate',   name: 'Iron Chestplate',   profession: 'armorsmithing', tier: 2, requiredSkill: 600,
      description: 'Heavy, but the weight is reassuring.',
      materials: [{ itemId: 'iron_ingot', amount: 5 }, { itemId: 'leather_strap', amount: 2 }],
      goldCost: 22, output: { itemId: 'iron_chestplate', amount: 1 } },

    { id: 'iron_pauldrons',    name: 'Iron Pauldrons',    profession: 'armorsmithing', tier: 2, requiredSkill: 500,
      description: 'Solid shoulder plates riveted to backplate straps.',
      materials: [{ itemId: 'iron_ingot', amount: 3 }, { itemId: 'leather_strap', amount: 2 }],
      goldCost: 16, output: { itemId: 'iron_pauldrons', amount: 1 } },

    { id: 'iron_gauntlets',    name: 'Iron Gauntlets',    profession: 'armorsmithing', tier: 2, requiredSkill: 500,
      description: 'Full plate gloves.',
      materials: [{ itemId: 'iron_ingot', amount: 3 }, { itemId: 'leather_strap', amount: 1 }],
      goldCost: 14, output: { itemId: 'iron_gauntlets', amount: 1 } },

    { id: 'iron_greaves',      name: 'Iron Greaves',      profession: 'armorsmithing', tier: 2, requiredSkill: 600,
      description: 'Articulated knee protection built for long marches.',
      materials: [{ itemId: 'iron_ingot', amount: 4 }, { itemId: 'leather_strap', amount: 2 }],
      goldCost: 18, output: { itemId: 'iron_greaves', amount: 1 } },

    { id: 'iron_sabatons',     name: 'Iron Sabatons',     profession: 'armorsmithing', tier: 2, requiredSkill: 500,
      description: 'Heavy iron boots with sabaton toe-caps.',
      materials: [{ itemId: 'iron_ingot', amount: 3 }, { itemId: 'leather_strap', amount: 1 }],
      goldCost: 14, output: { itemId: 'iron_sabatons', amount: 1 } },

    { id: 'iron_shield',       name: 'Iron Shield',       profession: 'armorsmithing', tier: 2, requiredSkill: 650,
      description: 'A kite shield that can stop a cavalry charge.',
      materials: [{ itemId: 'iron_ingot', amount: 4 }, { itemId: 'treated_plank', amount: 2 }, { itemId: 'leather_strap', amount: 1 }],
      goldCost: 24, output: { itemId: 'iron_shield', amount: 1 } },

    { id: 'buckler_shield',    name: 'Buckler Shield',    profession: 'armorsmithing', tier: 1, requiredSkill: 300,
      description: 'A small, quick shield.',
      materials: [{ itemId: 'iron_ingot', amount: 2 }, { itemId: 'treated_plank', amount: 1 }, { itemId: 'leather_strap', amount: 1 }],
      goldCost: 16, output: { itemId: 'buckler_shield', amount: 1 } },

    // ── T3 ────────────────────────────────────────────────────────────────────
    { id: 'steel_helm',        name: 'Steel Helm',        profession: 'armorsmithing', tier: 3, requiredSkill: 1000,
      description: 'Polished steel engraved with a ward.',
      materials: [{ itemId: 'iron_ingot', amount: 4 }, { itemId: 'charcoal', amount: 2 }, { itemId: 'leather_strap', amount: 1 }],
      goldCost: 30, output: { itemId: 'steel_helm', amount: 1 } },

    { id: 'steel_breastplate', name: 'Steel Breastplate', profession: 'armorsmithing', tier: 3, requiredSkill: 1100,
      description: 'Full plate that has turned aside both blade and arrow.',
      materials: [{ itemId: 'iron_ingot', amount: 7 }, { itemId: 'charcoal', amount: 3 }, { itemId: 'leather_strap', amount: 2 }],
      goldCost: 50, output: { itemId: 'steel_breastplate', amount: 1 } },

    { id: 'steel_pauldrons',   name: 'Steel Pauldrons',   profession: 'armorsmithing', tier: 3, requiredSkill: 1000,
      description: 'Full-coverage shoulder plates.',
      materials: [{ itemId: 'iron_ingot', amount: 5 }, { itemId: 'charcoal', amount: 2 }, { itemId: 'leather_strap', amount: 2 }],
      goldCost: 36, output: { itemId: 'steel_pauldrons', amount: 1 } },

    { id: 'steel_gauntlets',   name: 'Steel Gauntlets',   profession: 'armorsmithing', tier: 3, requiredSkill: 1000,
      description: 'Finger-articulated plate with reinforced knuckles.',
      materials: [{ itemId: 'iron_ingot', amount: 4 }, { itemId: 'charcoal', amount: 2 }, { itemId: 'leather_strap', amount: 1 }],
      goldCost: 28, output: { itemId: 'steel_gauntlets', amount: 1 } },

    { id: 'steel_greaves',     name: 'Steel Greaves',     profession: 'armorsmithing', tier: 3, requiredSkill: 1100,
      description: 'Full leg coverage.',
      materials: [{ itemId: 'iron_ingot', amount: 5 }, { itemId: 'charcoal', amount: 2 }, { itemId: 'leather_strap', amount: 2 }],
      goldCost: 36, output: { itemId: 'steel_greaves', amount: 1 } },

    { id: 'steel_sabatons',    name: 'Steel Sabatons',    profession: 'armorsmithing', tier: 3, requiredSkill: 1000,
      description: 'Articulated steel boot covers.',
      materials: [{ itemId: 'iron_ingot', amount: 4 }, { itemId: 'charcoal', amount: 2 }, { itemId: 'leather_strap', amount: 1 }],
      goldCost: 28, output: { itemId: 'steel_sabatons', amount: 1 } },

    { id: 'steel_shield',      name: 'Steel Shield',      profession: 'armorsmithing', tier: 3, requiredSkill: 1200,
      description: 'Tower shield — heavy but near-impenetrable.',
      materials: [{ itemId: 'iron_ingot', amount: 6 }, { itemId: 'charcoal', amount: 2 }, { itemId: 'treated_plank', amount: 2 }],
      goldCost: 44, output: { itemId: 'steel_shield', amount: 1 } },

    // ── T4 ────────────────────────────────────────────────────────────────────
    { id: 'gilded_helm',       name: 'Gilded Helm',       profession: 'armorsmithing', tier: 4, requiredSkill: 2000,
      description: 'A great helm with gold-leaf crest.',
      materials: [{ itemId: 'iron_ingot', amount: 5 }, { itemId: 'rift_shard', amount: 1 }, { itemId: 'leather_strap', amount: 2 }, { itemId: 'charcoal', amount: 2 }],
      goldCost: 70, output: { itemId: 'gilded_helm', amount: 1 } },

    { id: 'gilded_breastplate', name: 'Gilded Breastplate', profession: 'armorsmithing', tier: 4, requiredSkill: 2200,
      description: 'Master-forged plate inlaid with gold runes.',
      materials: [{ itemId: 'iron_ingot', amount: 9 }, { itemId: 'rift_shard', amount: 2 }, { itemId: 'leather_strap', amount: 2 }, { itemId: 'charcoal', amount: 3 }],
      goldCost: 110, output: { itemId: 'gilded_breastplate', amount: 1 } },

    { id: 'gilded_pauldrons',  name: 'Gilded Pauldrons',  profession: 'armorsmithing', tier: 4, requiredSkill: 2000,
      description: 'Winged shoulder guards befitting a paladin.',
      materials: [{ itemId: 'iron_ingot', amount: 6 }, { itemId: 'rift_shard', amount: 1 }, { itemId: 'leather_strap', amount: 2 }, { itemId: 'charcoal', amount: 2 }],
      goldCost: 80, output: { itemId: 'gilded_pauldrons', amount: 1 } },

    { id: 'gilded_gauntlets',  name: 'Gilded Gauntlets',  profession: 'armorsmithing', tier: 4, requiredSkill: 2000,
      description: 'Plated gauntlets with gold-etched knuckle guards.',
      materials: [{ itemId: 'iron_ingot', amount: 5 }, { itemId: 'rift_shard', amount: 1 }, { itemId: 'leather_strap', amount: 1 }, { itemId: 'charcoal', amount: 2 }],
      goldCost: 65, output: { itemId: 'gilded_gauntlets', amount: 1 } },

    { id: 'gilded_greaves',    name: 'Gilded Greaves',    profession: 'armorsmithing', tier: 4, requiredSkill: 2100,
      description: 'Full plate legwear with ornate kneecaps.',
      materials: [{ itemId: 'iron_ingot', amount: 6 }, { itemId: 'rift_shard', amount: 1 }, { itemId: 'leather_strap', amount: 2 }, { itemId: 'charcoal', amount: 2 }],
      goldCost: 80, output: { itemId: 'gilded_greaves', amount: 1 } },

    { id: 'gilded_sabatons',   name: 'Gilded Sabatons',   profession: 'armorsmithing', tier: 4, requiredSkill: 2000,
      description: 'Gilded plate boots with ankle articulation.',
      materials: [{ itemId: 'iron_ingot', amount: 5 }, { itemId: 'rift_shard', amount: 1 }, { itemId: 'leather_strap', amount: 1 }, { itemId: 'charcoal', amount: 2 }],
      goldCost: 65, output: { itemId: 'gilded_sabatons', amount: 1 } },

    { id: 'gilded_shield',     name: 'Gilded Shield',     profession: 'armorsmithing', tier: 4, requiredSkill: 2200,
      description: 'The golden crest has stopped blades cold.',
      materials: [{ itemId: 'iron_ingot', amount: 7 }, { itemId: 'rift_shard', amount: 2 }, { itemId: 'treated_plank', amount: 2 }, { itemId: 'charcoal', amount: 2 }],
      goldCost: 95, output: { itemId: 'gilded_shield', amount: 1 } },

    // ── T5 ────────────────────────────────────────────────────────────────────
    { id: 'alaium_helm',       name: 'Alaium Helm',       profession: 'armorsmithing', tier: 5, requiredSkill: 3500,
      description: 'The visor shows what lies beyond sight.',
      materials: [{ itemId: 'iron_ingot', amount: 6 }, { itemId: 'rift_shard', amount: 2 }, { itemId: 'emberglass_fragment', amount: 1 }, { itemId: 'charcoal', amount: 3 }],
      goldCost: 180, output: { itemId: 'alaium_helm', amount: 1 } },

    { id: 'alaium_breastplate', name: 'Alaium Breastplate', profession: 'armorsmithing', tier: 5, requiredSkill: 4000,
      description: 'Stops everything short of a siege engine.',
      materials: [{ itemId: 'iron_ingot', amount: 10 }, { itemId: 'rift_shard', amount: 3 }, { itemId: 'emberglass_fragment', amount: 2 }, { itemId: 'charcoal', amount: 5 }],
      goldCost: 280, output: { itemId: 'alaium_breastplate', amount: 1 } },

    { id: 'alaium_pauldrons',  name: 'Alaium Pauldrons',  profession: 'armorsmithing', tier: 5, requiredSkill: 3500,
      description: 'Shoulder plates that turn glancing blows.',
      materials: [{ itemId: 'iron_ingot', amount: 7 }, { itemId: 'rift_shard', amount: 2 }, { itemId: 'emberglass_fragment', amount: 1 }, { itemId: 'charcoal', amount: 3 }],
      goldCost: 200, output: { itemId: 'alaium_pauldrons', amount: 1 } },

    { id: 'alaium_gauntlets',  name: 'Alaium Gauntlets',  profession: 'armorsmithing', tier: 5, requiredSkill: 3500,
      description: 'Perfectly articulated. Never fatigues the hand.',
      materials: [{ itemId: 'iron_ingot', amount: 6 }, { itemId: 'rift_shard', amount: 2 }, { itemId: 'emberglass_fragment', amount: 1 }, { itemId: 'charcoal', amount: 3 }],
      goldCost: 180, output: { itemId: 'alaium_gauntlets', amount: 1 } },

    { id: 'alaium_greaves',    name: 'Alaium Greaves',    profession: 'armorsmithing', tier: 5, requiredSkill: 3700,
      description: 'Leg armour that moves with you.',
      materials: [{ itemId: 'iron_ingot', amount: 7 }, { itemId: 'rift_shard', amount: 2 }, { itemId: 'emberglass_fragment', amount: 1 }, { itemId: 'charcoal', amount: 3 }],
      goldCost: 200, output: { itemId: 'alaium_greaves', amount: 1 } },

    { id: 'alaium_sabatons',   name: 'Alaium Sabatons',   profession: 'armorsmithing', tier: 5, requiredSkill: 3500,
      description: 'Silent despite their construction.',
      materials: [{ itemId: 'iron_ingot', amount: 6 }, { itemId: 'rift_shard', amount: 2 }, { itemId: 'emberglass_fragment', amount: 1 }, { itemId: 'charcoal', amount: 3 }],
      goldCost: 180, output: { itemId: 'alaium_sabatons', amount: 1 } },

    { id: 'alaium_shield',     name: 'Alaium Shield',     profession: 'armorsmithing', tier: 5, requiredSkill: 4000,
      description: 'Absorbs energy on impact.',
      materials: [{ itemId: 'iron_ingot', amount: 9 }, { itemId: 'rift_shard', amount: 3 }, { itemId: 'emberglass_fragment', amount: 2 }, { itemId: 'treated_plank', amount: 2 }],
      goldCost: 260, output: { itemId: 'alaium_shield', amount: 1 } },


    // ══════════════════════════════════════════════════════════════════════════
    // WOODWORKING — bows, quivers, staves, spear shafts
    // ══════════════════════════════════════════════════════════════════════════

    // ── T1 ────────────────────────────────────────────────────────────────────
    { id: 'quarterstaff',      name: 'Quarterstaff',      profession: 'woodworking', tier: 1, requiredSkill: 0,
      description: 'A sturdy wooden staff.',
      materials: [{ itemId: 'rough_wood', amount: 2 }, { itemId: 'simple_binding', amount: 1 }],
      goldCost: 6,  output: { itemId: 'quarterstaff', amount: 1 } },

    { id: 'wooden_bow',        name: 'Wooden Bow',        profession: 'woodworking', tier: 1, requiredSkill: 0,
      description: 'Carved from a yew branch.',
      materials: [{ itemId: 'rough_wood', amount: 3 }, { itemId: 'fiber_bundle', amount: 1 }],
      goldCost: 6,  output: { itemId: 'wooden_bow', amount: 1 } },

    { id: 'crude_quiver',      name: 'Crude Quiver',      profession: 'woodworking', tier: 1, requiredSkill: 50,
      description: 'A bundle of crudely fletched arrows.',
      materials: [{ itemId: 'rough_wood', amount: 2 }, { itemId: 'beast_bone', amount: 1 }, { itemId: 'fiber_bundle', amount: 1 }],
      goldCost: 5,  output: { itemId: 'crude_quiver', amount: 1 } },

    { id: 'short_bow',         name: 'Short Bow',         profession: 'woodworking', tier: 1, requiredSkill: 200,
      description: 'A nimble bow favoured for speed.',
      materials: [{ itemId: 'treated_plank', amount: 2 }, { itemId: 'fiber_bundle', amount: 2 }, { itemId: 'leather_strap', amount: 1 }],
      goldCost: 12, output: { itemId: 'short_bow', amount: 1 } },

    // ── T2 ────────────────────────────────────────────────────────────────────
    { id: 'staff_core',        name: 'Staff Core',        profession: 'woodworking', tier: 2, requiredSkill: 500,
      description: 'A magical staff core for arcane use.',
      materials: [{ itemId: 'treated_plank', amount: 2 }, { itemId: 'ash_resin', amount: 1 }],
      goldCost: 12, output: { itemId: 'staff_core', amount: 1 } },

    { id: 'iron_bow',          name: 'Reinforced Bow',    profession: 'woodworking', tier: 2, requiredSkill: 500,
      description: 'Iron-tipped limbs and a gut string.',
      materials: [{ itemId: 'treated_plank', amount: 3 }, { itemId: 'iron_ingot', amount: 1 }, { itemId: 'fiber_bundle', amount: 2 }],
      goldCost: 18, output: { itemId: 'iron_bow', amount: 1 } },

    { id: 'iron_quiver',       name: 'Iron-Tipped Quiver', profession: 'woodworking', tier: 2, requiredSkill: 500,
      description: 'Iron bodkin heads that punch through light armour.',
      materials: [{ itemId: 'treated_plank', amount: 2 }, { itemId: 'iron_ingot', amount: 1 }, { itemId: 'bone_dust', amount: 1 }],
      goldCost: 14, output: { itemId: 'iron_quiver', amount: 1 } },

    // ── T3 ────────────────────────────────────────────────────────────────────
    { id: 'apprentice_staff',  name: "Apprentice's Staff", profession: 'woodworking', tier: 1, requiredSkill: 100,
      description: 'Etched with runes that glow faintly.',
      materials: [{ itemId: 'rough_wood', amount: 3 }, { itemId: 'simple_binding', amount: 1 }, { itemId: 'ash_resin', amount: 1 }],
      goldCost: 8,  output: { itemId: 'apprentice_staff', amount: 1 } },

    { id: 'steel_bow',         name: 'Steel Recurve',     profession: 'woodworking', tier: 3, requiredSkill: 1000,
      description: 'A laminated recurve with frightening draw weight.',
      materials: [{ itemId: 'treated_plank', amount: 4 }, { itemId: 'iron_ingot', amount: 2 }, { itemId: 'leather_strap', amount: 1 }, { itemId: 'charcoal', amount: 1 }],
      goldCost: 38, output: { itemId: 'steel_bow', amount: 1 } },

    { id: 'steel_quiver',      name: 'Steel Broadhead Quiver', profession: 'woodworking', tier: 3, requiredSkill: 1000,
      description: 'Broadhead tips that cut clean and bleed deep.',
      materials: [{ itemId: 'treated_plank', amount: 3 }, { itemId: 'iron_ingot', amount: 2 }, { itemId: 'charcoal', amount: 1 }],
      goldCost: 28, output: { itemId: 'steel_quiver', amount: 1 } },

    // ── T4 ────────────────────────────────────────────────────────────────────
    { id: 'gilded_bow',        name: 'Gilded Longbow',    profession: 'woodworking', tier: 4, requiredSkill: 2000,
      description: 'An elven longbow repurposed with gilded inlay.',
      materials: [{ itemId: 'treated_plank', amount: 5 }, { itemId: 'iron_ingot', amount: 2 }, { itemId: 'rift_shard', amount: 1 }, { itemId: 'fiber_bundle', amount: 2 }],
      goldCost: 80, output: { itemId: 'gilded_bow', amount: 1 } },

    { id: 'gilded_quiver',     name: 'Gilded Quiver',     profession: 'woodworking', tier: 4, requiredSkill: 2000,
      description: 'Fletched with hawk feathers. Flies true at any range.',
      materials: [{ itemId: 'treated_plank', amount: 3 }, { itemId: 'iron_ingot', amount: 1 }, { itemId: 'rift_shard', amount: 1 }, { itemId: 'beast_bone', amount: 2 }],
      goldCost: 60, output: { itemId: 'gilded_quiver', amount: 1 } },

    // ── T5 ────────────────────────────────────────────────────────────────────
    { id: 'alaium_bow',        name: 'Alaium Warbow',     profession: 'woodworking', tier: 5, requiredSkill: 3500,
      description: 'The arrows never quite miss.',
      materials: [{ itemId: 'treated_plank', amount: 6 }, { itemId: 'rift_shard', amount: 2 }, { itemId: 'emberglass_fragment', amount: 1 }, { itemId: 'fiber_bundle', amount: 3 }],
      goldCost: 200, output: { itemId: 'alaium_bow', amount: 1 } },

    { id: 'alaium_quiver',     name: 'Alaium Quiver',     profession: 'woodworking', tier: 5, requiredSkill: 3500,
      description: 'The quiver never empties.',
      materials: [{ itemId: 'treated_plank', amount: 4 }, { itemId: 'rift_shard', amount: 2 }, { itemId: 'faded_sigil_wax', amount: 1 }, { itemId: 'beast_bone', amount: 3 }],
      goldCost: 170, output: { itemId: 'alaium_quiver', amount: 1 } },


    // ══════════════════════════════════════════════════════════════════════════
    // TAILORING — light armor (leather/stealth) and mage clothing
    // ══════════════════════════════════════════════════════════════════════════

    // ── T1 Light armor ────────────────────────────────────────────────────────
    { id: 'leather_cap',       name: 'Leather Cap',       profession: 'tailoring', tier: 1, requiredSkill: 0,
      description: 'A simple cap of hardened leather.',
      materials: [{ itemId: 'tattered_leather', amount: 2 }, { itemId: 'fiber_bundle', amount: 1 }],
      goldCost: 5,  output: { itemId: 'leather_cap', amount: 1 } },

    { id: 'leather_tunic',     name: 'Leather Tunic',     profession: 'tailoring', tier: 1, requiredSkill: 50,
      description: 'Hardened leather stitched together.',
      materials: [{ itemId: 'tattered_leather', amount: 3 }, { itemId: 'fiber_bundle', amount: 2 }],
      goldCost: 8,  output: { itemId: 'leather_tunic', amount: 1 } },

    { id: 'rough_cloak',       name: 'Rough Cloak',       profession: 'tailoring', tier: 1, requiredSkill: 0,
      description: 'Wool and hide. Keeps the wind off.',
      materials: [{ itemId: 'cloth_scraps', amount: 2 }, { itemId: 'tattered_leather', amount: 1 }],
      goldCost: 5,  output: { itemId: 'rough_cloak', amount: 1 } },

    { id: 'leather_gloves',    name: 'Leather Gloves',    profession: 'tailoring', tier: 1, requiredSkill: 0,
      description: "Soft leather that won't creak.",
      materials: [{ itemId: 'tattered_leather', amount: 2 }, { itemId: 'simple_binding', amount: 1 }],
      goldCost: 4,  output: { itemId: 'leather_gloves', amount: 1 } },

    { id: 'leather_trousers',  name: 'Leather Trousers',  profession: 'tailoring', tier: 1, requiredSkill: 50,
      description: 'Sturdy leather breeches with padded knees.',
      materials: [{ itemId: 'tattered_leather', amount: 3 }, { itemId: 'fiber_bundle', amount: 1 }],
      goldCost: 6,  output: { itemId: 'leather_trousers', amount: 1 } },

    { id: 'leather_boots',     name: 'Leather Boots',     profession: 'tailoring', tier: 1, requiredSkill: 0,
      description: 'Worn soles, but they hold another mile.',
      materials: [{ itemId: 'tattered_leather', amount: 2 }, { itemId: 'fiber_bundle', amount: 1 }],
      goldCost: 5,  output: { itemId: 'leather_boots', amount: 1 } },

    { id: 'padded_gloves',     name: 'Padded Gloves',     profession: 'tailoring', tier: 1, requiredSkill: 100,
      description: 'Simple padded gloves for protection.',
      materials: [{ itemId: 'cloth_scraps', amount: 2 }, { itemId: 'tattered_leather', amount: 1 }],
      goldCost: 6,  output: { itemId: 'padded_gloves', amount: 1 } },

    { id: 'travelers_hood',    name: "Traveler's Hood",   profession: 'tailoring', tier: 1, requiredSkill: 150,
      description: 'A hooded cloak for travel.',
      materials: [{ itemId: 'woven_cloth', amount: 3 }, { itemId: 'simple_binding', amount: 1 }],
      goldCost: 10, output: { itemId: 'travelers_hood', amount: 1 } },

    // ── T1 Mage clothing ──────────────────────────────────────────────────────
    { id: 'linen_hood',        name: 'Linen Hood',        profession: 'tailoring', tier: 1, requiredSkill: 0,
      description: 'Simple cloth hood stitched with minor focusing glyphs.',
      materials: [{ itemId: 'cloth_scraps', amount: 2 }, { itemId: 'simple_binding', amount: 1 }],
      goldCost: 5,  output: { itemId: 'linen_hood', amount: 1 } },

    { id: 'linen_robe',        name: 'Linen Robe',        profession: 'tailoring', tier: 1, requiredSkill: 50,
      description: 'Loose-fitting linen inscribed with basic glyphs.',
      materials: [{ itemId: 'cloth_scraps', amount: 3 }, { itemId: 'simple_binding', amount: 1 }],
      goldCost: 8,  output: { itemId: 'linen_robe', amount: 1 } },

    { id: 'linen_cloak',       name: 'Linen Cloak',       profession: 'tailoring', tier: 1, requiredSkill: 0,
      description: 'A lightweight cloak that channels ambient magic.',
      materials: [{ itemId: 'cloth_scraps', amount: 2 }, { itemId: 'fiber_bundle', amount: 1 }],
      goldCost: 5,  output: { itemId: 'linen_cloak', amount: 1 } },

    { id: 'linen_bracers',     name: 'Linen Bracers',     profession: 'tailoring', tier: 1, requiredSkill: 0,
      description: 'Cloth wraps that steady the wrist during casting.',
      materials: [{ itemId: 'cloth_scraps', amount: 2 }, { itemId: 'fiber_bundle', amount: 1 }],
      goldCost: 4,  output: { itemId: 'linen_bracers', amount: 1 } },

    { id: 'linen_leggings',    name: 'Linen Leggings',    profession: 'tailoring', tier: 1, requiredSkill: 50,
      description: 'Loose linen trousers embroidered with focus glyphs.',
      materials: [{ itemId: 'cloth_scraps', amount: 3 }, { itemId: 'simple_binding', amount: 1 }],
      goldCost: 6,  output: { itemId: 'linen_leggings', amount: 1 } },

    { id: 'linen_slippers',    name: 'Linen Slippers',    profession: 'tailoring', tier: 1, requiredSkill: 0,
      description: 'Soft-soled slippers stitched with grounding sigils.',
      materials: [{ itemId: 'cloth_scraps', amount: 2 }, { itemId: 'simple_binding', amount: 1 }],
      goldCost: 4,  output: { itemId: 'linen_slippers', amount: 1 } },

    // ── T2 Light armor ────────────────────────────────────────────────────────
    { id: 'studded_cap',       name: 'Studded Cap',       profession: 'tailoring', tier: 2, requiredSkill: 500,
      description: 'Leather reinforced with iron rivets.',
      materials: [{ itemId: 'tattered_leather', amount: 2 }, { itemId: 'iron_ingot', amount: 1 }, { itemId: 'simple_binding', amount: 1 }],
      goldCost: 12, output: { itemId: 'studded_cap', amount: 1 } },

    { id: 'studded_vest',      name: 'Studded Vest',      profession: 'tailoring', tier: 2, requiredSkill: 600,
      description: 'Iron studs across hardened leather.',
      materials: [{ itemId: 'tattered_leather', amount: 4 }, { itemId: 'iron_ingot', amount: 2 }, { itemId: 'leather_strap', amount: 1 }],
      goldCost: 20, output: { itemId: 'studded_vest', amount: 1 } },

    { id: 'studded_mantle',    name: 'Studded Mantle',    profession: 'tailoring', tier: 2, requiredSkill: 500,
      description: 'A short mantle with reinforced shoulder pads.',
      materials: [{ itemId: 'tattered_leather', amount: 3 }, { itemId: 'iron_ingot', amount: 1 }, { itemId: 'simple_binding', amount: 1 }],
      goldCost: 14, output: { itemId: 'studded_mantle', amount: 1 } },

    { id: 'studded_gloves',    name: 'Studded Gloves',    profession: 'tailoring', tier: 2, requiredSkill: 500,
      description: 'Riveted leather gloves that protect the knuckles.',
      materials: [{ itemId: 'tattered_leather', amount: 2 }, { itemId: 'iron_ingot', amount: 1 }, { itemId: 'simple_binding', amount: 1 }],
      goldCost: 10, output: { itemId: 'studded_gloves', amount: 1 } },

    { id: 'studded_trousers',  name: 'Studded Trousers',  profession: 'tailoring', tier: 2, requiredSkill: 550,
      description: 'Reinforced leggings with studded outer thighs.',
      materials: [{ itemId: 'tattered_leather', amount: 3 }, { itemId: 'iron_ingot', amount: 1 }, { itemId: 'leather_strap', amount: 1 }],
      goldCost: 14, output: { itemId: 'studded_trousers', amount: 1 } },

    { id: 'studded_boots',     name: 'Studded Boots',     profession: 'tailoring', tier: 2, requiredSkill: 500,
      description: 'Hard-soled boots with studded shin guards.',
      materials: [{ itemId: 'tattered_leather', amount: 2 }, { itemId: 'iron_ingot', amount: 1 }, { itemId: 'simple_binding', amount: 1 }],
      goldCost: 10, output: { itemId: 'studded_boots', amount: 1 } },

    { id: 'ashen_cloak',       name: 'Ashen Cloak',       profession: 'tailoring', tier: 2, requiredSkill: 600,
      description: 'A cloak touched by ash and rift energy.',
      materials: [{ itemId: 'woven_cloth', amount: 4 }, { itemId: 'ash_resin', amount: 1 }, { itemId: 'leather_strap', amount: 1 }],
      goldCost: 18, output: { itemId: 'ashen_cloak', amount: 1 } },

    // ── T2 Mage clothing ──────────────────────────────────────────────────────
    { id: 'wool_hood',         name: 'Wool Hood',         profession: 'tailoring', tier: 2, requiredSkill: 500,
      description: 'Thick wool woven with channelling threads.',
      materials: [{ itemId: 'woven_cloth', amount: 2 }, { itemId: 'simple_binding', amount: 1 }, { itemId: 'ash_resin', amount: 1 }],
      goldCost: 12, output: { itemId: 'wool_hood', amount: 1 } },

    { id: 'wool_robe',         name: 'Wool Robe',         profession: 'tailoring', tier: 2, requiredSkill: 600,
      description: "A journeyman's robe with expanded mana-weave stitching.",
      materials: [{ itemId: 'woven_cloth', amount: 4 }, { itemId: 'simple_binding', amount: 2 }, { itemId: 'ash_resin', amount: 1 }],
      goldCost: 20, output: { itemId: 'wool_robe', amount: 1 } },

    { id: 'wool_cloak',        name: 'Wool Cloak',        profession: 'tailoring', tier: 2, requiredSkill: 500,
      description: 'Heavy wool, dyed deep blue.',
      materials: [{ itemId: 'woven_cloth', amount: 3 }, { itemId: 'simple_binding', amount: 1 }],
      goldCost: 12, output: { itemId: 'wool_cloak', amount: 1 } },

    { id: 'wool_bracers',      name: 'Wool Bracers',      profession: 'tailoring', tier: 2, requiredSkill: 500,
      description: 'Padded wool wraps that reduce casting tremor.',
      materials: [{ itemId: 'woven_cloth', amount: 2 }, { itemId: 'simple_binding', amount: 1 }],
      goldCost: 8,  output: { itemId: 'wool_bracers', amount: 1 } },

    { id: 'wool_leggings',     name: 'Wool Leggings',     profession: 'tailoring', tier: 2, requiredSkill: 550,
      description: 'Warm leggings with stitched focusing lines.',
      materials: [{ itemId: 'woven_cloth', amount: 3 }, { itemId: 'simple_binding', amount: 1 }, { itemId: 'ash_resin', amount: 1 }],
      goldCost: 14, output: { itemId: 'wool_leggings', amount: 1 } },

    { id: 'wool_slippers',     name: 'Wool Slippers',     profession: 'tailoring', tier: 2, requiredSkill: 500,
      description: 'Soft-soled wool shoes.',
      materials: [{ itemId: 'woven_cloth', amount: 2 }, { itemId: 'simple_binding', amount: 1 }],
      goldCost: 8,  output: { itemId: 'wool_slippers', amount: 1 } },

    // ── T3 Light armor ────────────────────────────────────────────────────────
    { id: 'rangers_hood',      name: "Ranger's Hood",     profession: 'tailoring', tier: 3, requiredSkill: 1000,
      description: 'A deep hood in forest-brown. Hard to spot at range.',
      materials: [{ itemId: 'leather_strap', amount: 2 }, { itemId: 'woven_cloth', amount: 2 }, { itemId: 'beast_fat', amount: 1 }],
      goldCost: 28, output: { itemId: 'rangers_hood', amount: 1 } },

    { id: 'rangers_vest',      name: "Ranger's Vest",     profession: 'tailoring', tier: 3, requiredSkill: 1100,
      description: 'Layered oiled leather with concealed pockets.',
      materials: [{ itemId: 'leather_strap', amount: 4 }, { itemId: 'woven_cloth', amount: 2 }, { itemId: 'beast_fat', amount: 1 }],
      goldCost: 42, output: { itemId: 'rangers_vest', amount: 1 } },

    { id: 'rangers_mantle',    name: "Ranger's Mantle",   profession: 'tailoring', tier: 3, requiredSkill: 1000,
      description: 'A forest cloak that blends with undergrowth.',
      materials: [{ itemId: 'leather_strap', amount: 3 }, { itemId: 'woven_cloth', amount: 2 }, { itemId: 'ash_resin', amount: 1 }],
      goldCost: 30, output: { itemId: 'rangers_mantle', amount: 1 } },

    { id: 'rangers_gloves',    name: "Ranger's Gloves",   profession: 'tailoring', tier: 3, requiredSkill: 1000,
      description: 'Thin leather archery gloves.',
      materials: [{ itemId: 'leather_strap', amount: 2 }, { itemId: 'woven_cloth', amount: 1 }],
      goldCost: 22, output: { itemId: 'rangers_gloves', amount: 1 } },

    { id: 'rangers_trousers',  name: "Ranger's Trousers", profession: 'tailoring', tier: 3, requiredSkill: 1000,
      description: "Treated leather that doesn't rustle.",
      materials: [{ itemId: 'leather_strap', amount: 3 }, { itemId: 'woven_cloth', amount: 2 }, { itemId: 'beast_fat', amount: 1 }],
      goldCost: 28, output: { itemId: 'rangers_trousers', amount: 1 } },

    { id: 'rangers_boots',     name: "Ranger's Boots",    profession: 'tailoring', tier: 3, requiredSkill: 1000,
      description: 'Soft-soled and silent.',
      materials: [{ itemId: 'leather_strap', amount: 2 }, { itemId: 'woven_cloth', amount: 1 }, { itemId: 'ash_resin', amount: 1 }],
      goldCost: 22, output: { itemId: 'rangers_boots', amount: 1 } },

    // ── T3 Mage clothing ──────────────────────────────────────────────────────
    { id: 'scholars_hood',     name: "Scholar's Hood",    profession: 'tailoring', tier: 3, requiredSkill: 1000,
      description: 'A deep hood inlaid with memory-weave script.',
      materials: [{ itemId: 'woven_cloth', amount: 3 }, { itemId: 'veil_dust', amount: 1 }, { itemId: 'simple_binding', amount: 2 }],
      goldCost: 30, output: { itemId: 'scholars_hood', amount: 1 } },

    { id: 'scholars_robe',     name: "Scholar's Robe",    profession: 'tailoring', tier: 3, requiredSkill: 1100,
      description: 'Heavy silk reinforced with enchanted thread.',
      materials: [{ itemId: 'woven_cloth', amount: 5 }, { itemId: 'veil_dust', amount: 1 }, { itemId: 'simple_binding', amount: 2 }],
      goldCost: 46, output: { itemId: 'scholars_robe', amount: 1 } },

    { id: 'scholars_cloak',    name: "Scholar's Cloak",   profession: 'tailoring', tier: 3, requiredSkill: 1000,
      description: 'The trim shifts colour with the ambient magical field.',
      materials: [{ itemId: 'woven_cloth', amount: 3 }, { itemId: 'ash_resin', amount: 1 }, { itemId: 'simple_binding', amount: 1 }],
      goldCost: 28, output: { itemId: 'scholars_cloak', amount: 1 } },

    { id: 'scholars_bracers',  name: "Scholar's Bracers", profession: 'tailoring', tier: 3, requiredSkill: 1000,
      description: 'Inscribed with fifty-two binding formulae.',
      materials: [{ itemId: 'woven_cloth', amount: 2 }, { itemId: 'veil_dust', amount: 1 }, { itemId: 'simple_binding', amount: 1 }],
      goldCost: 22, output: { itemId: 'scholars_bracers', amount: 1 } },

    { id: 'scholars_leggings', name: "Scholar's Leggings", profession: 'tailoring', tier: 3, requiredSkill: 1000,
      description: 'Long flowing robes divided into walking trousers.',
      materials: [{ itemId: 'woven_cloth', amount: 4 }, { itemId: 'veil_dust', amount: 1 }, { itemId: 'simple_binding', amount: 1 }],
      goldCost: 30, output: { itemId: 'scholars_leggings', amount: 1 } },

    { id: 'scholars_slippers', name: "Scholar's Slippers", profession: 'tailoring', tier: 3, requiredSkill: 1000,
      description: 'Silent and grounded.',
      materials: [{ itemId: 'woven_cloth', amount: 2 }, { itemId: 'simple_binding', amount: 1 }, { itemId: 'ash_resin', amount: 1 }],
      goldCost: 20, output: { itemId: 'scholars_slippers', amount: 1 } },

    // ── T4 Light armor ────────────────────────────────────────────────────────
    { id: 'shadow_hood',       name: 'Shadow Hood',       profession: 'tailoring', tier: 4, requiredSkill: 2000,
      description: 'Absorbs light.',
      materials: [{ itemId: 'leather_strap', amount: 3 }, { itemId: 'veil_dust', amount: 1 }, { itemId: 'faded_sigil_wax', amount: 1 }],
      goldCost: 65, output: { itemId: 'shadow_hood', amount: 1 } },

    { id: 'shadow_vest',       name: 'Shadow Vest',       profession: 'tailoring', tier: 4, requiredSkill: 2200,
      description: 'Shade-woven leather that dampens all sound.',
      materials: [{ itemId: 'leather_strap', amount: 5 }, { itemId: 'veil_dust', amount: 2 }, { itemId: 'faded_sigil_wax', amount: 1 }],
      goldCost: 95, output: { itemId: 'shadow_vest', amount: 1 } },

    { id: 'shadow_mantle',     name: 'Shadow Mantle',     profession: 'tailoring', tier: 4, requiredSkill: 2000,
      description: 'A cloak with no distinct edge.',
      materials: [{ itemId: 'leather_strap', amount: 3 }, { itemId: 'veil_dust', amount: 1 }, { itemId: 'ash_resin', amount: 1 }],
      goldCost: 62, output: { itemId: 'shadow_mantle', amount: 1 } },

    { id: 'shadow_gloves',     name: 'Shadow Gloves',     profession: 'tailoring', tier: 4, requiredSkill: 2000,
      description: 'Fingerless at the tips for precise work.',
      materials: [{ itemId: 'leather_strap', amount: 2 }, { itemId: 'veil_dust', amount: 1 }, { itemId: 'faded_sigil_wax', amount: 1 }],
      goldCost: 52, output: { itemId: 'shadow_gloves', amount: 1 } },

    { id: 'shadow_trousers',   name: 'Shadow Trousers',   profession: 'tailoring', tier: 4, requiredSkill: 2000,
      description: 'Silent fabric that moves like smoke.',
      materials: [{ itemId: 'leather_strap', amount: 4 }, { itemId: 'veil_dust', amount: 1 }, { itemId: 'faded_sigil_wax', amount: 1 }],
      goldCost: 70, output: { itemId: 'shadow_trousers', amount: 1 } },

    { id: 'shadow_boots',      name: 'Shadow Boots',      profession: 'tailoring', tier: 4, requiredSkill: 2000,
      description: 'Leave no print on any surface.',
      materials: [{ itemId: 'leather_strap', amount: 2 }, { itemId: 'veil_dust', amount: 1 }, { itemId: 'ash_resin', amount: 1 }],
      goldCost: 52, output: { itemId: 'shadow_boots', amount: 1 } },

    // ── T4 Mage clothing ──────────────────────────────────────────────────────
    { id: 'arcane_hood',       name: 'Arcane Hood',       profession: 'tailoring', tier: 4, requiredSkill: 2000,
      description: 'Constellations shift across its deep black surface.',
      materials: [{ itemId: 'woven_cloth', amount: 3 }, { itemId: 'rift_shard', amount: 1 }, { itemId: 'veil_dust', amount: 1 }],
      goldCost: 70, output: { itemId: 'arcane_hood', amount: 1 } },

    { id: 'arcane_robe',       name: 'Arcane Robe',       profession: 'tailoring', tier: 4, requiredSkill: 2200,
      description: 'Weaves spells into the air around the body.',
      materials: [{ itemId: 'woven_cloth', amount: 5 }, { itemId: 'rift_shard', amount: 2 }, { itemId: 'veil_dust', amount: 1 }],
      goldCost: 100, output: { itemId: 'arcane_robe', amount: 1 } },

    { id: 'arcane_cloak',      name: 'Arcane Cloak',      profession: 'tailoring', tier: 4, requiredSkill: 2000,
      description: 'Folds through space slightly.',
      materials: [{ itemId: 'woven_cloth', amount: 3 }, { itemId: 'rift_shard', amount: 1 }, { itemId: 'ash_resin', amount: 1 }],
      goldCost: 65, output: { itemId: 'arcane_cloak', amount: 1 } },

    { id: 'arcane_bracers',    name: 'Arcane Bracers',    profession: 'tailoring', tier: 4, requiredSkill: 2000,
      description: 'Amplify spells at the cost of controlled casting.',
      materials: [{ itemId: 'woven_cloth', amount: 2 }, { itemId: 'rift_shard', amount: 1 }, { itemId: 'veil_dust', amount: 1 }],
      goldCost: 58, output: { itemId: 'arcane_bracers', amount: 1 } },

    { id: 'arcane_leggings',   name: 'Arcane Leggings',   profession: 'tailoring', tier: 4, requiredSkill: 2000,
      description: 'Covered in circuit-like runic patterns.',
      materials: [{ itemId: 'woven_cloth', amount: 4 }, { itemId: 'rift_shard', amount: 1 }, { itemId: 'veil_dust', amount: 1 }],
      goldCost: 75, output: { itemId: 'arcane_leggings', amount: 1 } },

    { id: 'arcane_slippers',   name: 'Arcane Slippers',   profession: 'tailoring', tier: 4, requiredSkill: 2000,
      description: 'Hover just barely above the ground.',
      materials: [{ itemId: 'woven_cloth', amount: 2 }, { itemId: 'rift_shard', amount: 1 }, { itemId: 'ash_resin', amount: 1 }],
      goldCost: 55, output: { itemId: 'arcane_slippers', amount: 1 } },

    // ── T5 Light armor ────────────────────────────────────────────────────────
    { id: 'phantom_hood',      name: 'Phantom Hood',      profession: 'tailoring', tier: 5, requiredSkill: 3500,
      description: "The wearer's face becomes a rumour.",
      materials: [{ itemId: 'leather_strap', amount: 4 }, { itemId: 'veil_dust', amount: 2 }, { itemId: 'faded_sigil_wax', amount: 2 }],
      goldCost: 170, output: { itemId: 'phantom_hood', amount: 1 } },

    { id: 'phantom_vest',      name: 'Phantom Vest',      profession: 'tailoring', tier: 5, requiredSkill: 4000,
      description: 'Vanishes when the wearer is still.',
      materials: [{ itemId: 'leather_strap', amount: 6 }, { itemId: 'veil_dust', amount: 3 }, { itemId: 'faded_sigil_wax', amount: 2 }],
      goldCost: 250, output: { itemId: 'phantom_vest', amount: 1 } },

    { id: 'phantom_mantle',    name: 'Phantom Mantle',    profession: 'tailoring', tier: 5, requiredSkill: 3500,
      description: 'A cloak woven from night-threads.',
      materials: [{ itemId: 'leather_strap', amount: 4 }, { itemId: 'veil_dust', amount: 2 }, { itemId: 'faded_sigil_wax', amount: 1 }],
      goldCost: 160, output: { itemId: 'phantom_mantle', amount: 1 } },

    { id: 'phantom_gloves',    name: 'Phantom Gloves',    profession: 'tailoring', tier: 5, requiredSkill: 3500,
      description: 'Whatever the hand touches, it leaves no evidence.',
      materials: [{ itemId: 'leather_strap', amount: 3 }, { itemId: 'veil_dust', amount: 2 }, { itemId: 'faded_sigil_wax', amount: 1 }],
      goldCost: 145, output: { itemId: 'phantom_gloves', amount: 1 } },

    { id: 'phantom_trousers',  name: 'Phantom Trousers',  profession: 'tailoring', tier: 5, requiredSkill: 3500,
      description: 'The legs beneath them cannot be seen.',
      materials: [{ itemId: 'leather_strap', amount: 5 }, { itemId: 'veil_dust', amount: 2 }, { itemId: 'faded_sigil_wax', amount: 2 }],
      goldCost: 175, output: { itemId: 'phantom_trousers', amount: 1 } },

    { id: 'phantom_boots',     name: 'Phantom Boots',     profession: 'tailoring', tier: 5, requiredSkill: 3500,
      description: 'Silent even on broken glass.',
      materials: [{ itemId: 'leather_strap', amount: 3 }, { itemId: 'veil_dust', amount: 2 }, { itemId: 'faded_sigil_wax', amount: 1 }],
      goldCost: 145, output: { itemId: 'phantom_boots', amount: 1 } },

    // ── T5 Mage clothing ──────────────────────────────────────────────────────
    { id: 'ethereal_hood',     name: 'Ethereal Hood',     profession: 'tailoring', tier: 5, requiredSkill: 3500,
      description: 'The hood exists partially outside of physical space.',
      materials: [{ itemId: 'woven_cloth', amount: 4 }, { itemId: 'rift_shard', amount: 2 }, { itemId: 'veil_dust', amount: 2 }],
      goldCost: 180, output: { itemId: 'ethereal_hood', amount: 1 } },

    { id: 'ethereal_robe',     name: 'Ethereal Robe',     profession: 'tailoring', tier: 5, requiredSkill: 4000,
      description: 'Woven from solidified magic.',
      materials: [{ itemId: 'woven_cloth', amount: 6 }, { itemId: 'rift_shard', amount: 3 }, { itemId: 'veil_dust', amount: 2 }],
      goldCost: 270, output: { itemId: 'ethereal_robe', amount: 1 } },

    { id: 'ethereal_cloak',    name: 'Ethereal Cloak',    profession: 'tailoring', tier: 5, requiredSkill: 3500,
      description: 'Billows even in still air.',
      materials: [{ itemId: 'woven_cloth', amount: 4 }, { itemId: 'rift_shard', amount: 2 }, { itemId: 'ash_resin', amount: 2 }],
      goldCost: 165, output: { itemId: 'ethereal_cloak', amount: 1 } },

    { id: 'ethereal_bracers',  name: 'Ethereal Bracers',  profession: 'tailoring', tier: 5, requiredSkill: 3500,
      description: 'Extend the effective range of every spell cast.',
      materials: [{ itemId: 'woven_cloth', amount: 3 }, { itemId: 'rift_shard', amount: 2 }, { itemId: 'veil_dust', amount: 1 }],
      goldCost: 150, output: { itemId: 'ethereal_bracers', amount: 1 } },

    { id: 'ethereal_leggings', name: 'Ethereal Leggings', profession: 'tailoring', tier: 5, requiredSkill: 3500,
      description: 'Half-phase between worlds.',
      materials: [{ itemId: 'woven_cloth', amount: 5 }, { itemId: 'rift_shard', amount: 2 }, { itemId: 'veil_dust', amount: 2 }],
      goldCost: 185, output: { itemId: 'ethereal_leggings', amount: 1 } },

    { id: 'ethereal_slippers', name: 'Ethereal Slippers', profession: 'tailoring', tier: 5, requiredSkill: 3500,
      description: 'Walk on air, water, or the memory of a surface.',
      materials: [{ itemId: 'woven_cloth', amount: 3 }, { itemId: 'rift_shard', amount: 2 }, { itemId: 'ash_resin', amount: 1 }],
      goldCost: 145, output: { itemId: 'ethereal_slippers', amount: 1 } },


    // ══════════════════════════════════════════════════════════════════════════
    // MAGESMITHING — magic staves, restoration staves, jewelry
    // ══════════════════════════════════════════════════════════════════════════

    // ── T1 ────────────────────────────────────────────────────────────────────
    { id: 'arcane_staff',      name: 'Arcane Staff',      profession: 'magesmithing', tier: 2, requiredSkill: 500,
      description: 'Carved from ironwood, capped with arcane crystal.',
      materials: [{ itemId: 'staff_core', amount: 1 }, { itemId: 'ash_resin', amount: 1 }, { itemId: 'simple_binding', amount: 1 }],
      goldCost: 18, output: { itemId: 'arcane_staff', amount: 1 } },

    { id: 'healing_branch',    name: 'Healing Branch',    profession: 'magesmithing', tier: 1, requiredSkill: 0,
      description: 'A branch from a living healer tree.',
      materials: [{ itemId: 'rough_wood', amount: 3 }, { itemId: 'herbs', amount: 2 }, { itemId: 'simple_binding', amount: 1 }],
      goldCost: 8,  output: { itemId: 'healing_branch', amount: 1 } },

    { id: 'warded_ring',       name: 'Warded Ring',       profession: 'magesmithing', tier: 2, requiredSkill: 750,
      description: 'A ring that provides magical protection.',
      materials: [{ itemId: 'iron_ingot', amount: 1 }, { itemId: 'veil_dust', amount: 1 }, { itemId: 'faded_sigil_wax', amount: 1 }],
      goldCost: 20, output: { itemId: 'warded_ring', amount: 1 } },

    // ── T2 ────────────────────────────────────────────────────────────────────
    { id: 'infused_staff',     name: 'Infused Staff',     profession: 'magesmithing', tier: 2, requiredSkill: 900,
      description: 'A staff core saturated with rift energy.',
      materials: [{ itemId: 'staff_core', amount: 1 }, { itemId: 'rift_shard', amount: 1 }, { itemId: 'veil_dust', amount: 1 }],
      goldCost: 28, output: { itemId: 'infused_staff', amount: 1 } },

    { id: 'blessed_staff',     name: 'Blessed Staff',     profession: 'magesmithing', tier: 2, requiredSkill: 500,
      description: 'Inscribed with prayers that ease wounds.',
      materials: [{ itemId: 'staff_core', amount: 1 }, { itemId: 'herbs', amount: 3 }, { itemId: 'veil_dust', amount: 1 }],
      goldCost: 20, output: { itemId: 'blessed_staff', amount: 1 } },

    // ── T3 ────────────────────────────────────────────────────────────────────
    { id: 'mages_staff',       name: "Mage's Staff",      profession: 'magesmithing', tier: 3, requiredSkill: 1000,
      description: "A journeyman's staff that channels spells with minimal loss.",
      materials: [{ itemId: 'staff_core', amount: 2 }, { itemId: 'rift_shard', amount: 1 }, { itemId: 'emberglass_fragment', amount: 1 }, { itemId: 'ash_resin', amount: 1 }],
      goldCost: 48, output: { itemId: 'mages_staff', amount: 1 } },

    { id: 'sanctified_staff',  name: 'Sanctified Staff',  profession: 'magesmithing', tier: 3, requiredSkill: 1000,
      description: 'Consecrated at the Shrine of the Still Flame.',
      materials: [{ itemId: 'staff_core', amount: 2 }, { itemId: 'veil_dust', amount: 2 }, { itemId: 'herbs', amount: 4 }, { itemId: 'ash_resin', amount: 1 }],
      goldCost: 45, output: { itemId: 'sanctified_staff', amount: 1 } },

    // ── T4 ────────────────────────────────────────────────────────────────────
    { id: 'gilded_staff',      name: 'Gilded Spellstaff', profession: 'magesmithing', tier: 4, requiredSkill: 2000,
      description: 'Threaded with gold to enhance resonance.',
      materials: [{ itemId: 'staff_core', amount: 2 }, { itemId: 'rift_shard', amount: 2 }, { itemId: 'emberglass_fragment', amount: 1 }, { itemId: 'faded_sigil_wax', amount: 1 }],
      goldCost: 100, output: { itemId: 'gilded_staff', amount: 1 } },

    { id: 'radiant_staff',     name: 'Radiant Staff',     profession: 'magesmithing', tier: 4, requiredSkill: 2000,
      description: 'Glows softly even in pitch darkness.',
      materials: [{ itemId: 'staff_core', amount: 2 }, { itemId: 'veil_dust', amount: 2 }, { itemId: 'rift_shard', amount: 1 }, { itemId: 'faded_sigil_wax', amount: 1 }],
      goldCost: 95, output: { itemId: 'radiant_staff', amount: 1 } },

    // ── T5 ────────────────────────────────────────────────────────────────────
    { id: 'alaium_staff',      name: 'Alaium Spellstaff', profession: 'magesmithing', tier: 5, requiredSkill: 3500,
      description: 'Vibrates at a frequency that bends the air around it.',
      materials: [{ itemId: 'staff_core', amount: 3 }, { itemId: 'rift_shard', amount: 3 }, { itemId: 'emberglass_fragment', amount: 2 }, { itemId: 'faded_sigil_wax', amount: 2 }],
      goldCost: 260, output: { itemId: 'alaium_staff', amount: 1 } },

    { id: 'divine_staff',      name: 'Divine Staff',      profession: 'magesmithing', tier: 5, requiredSkill: 3500,
      description: 'A conduit of pure divine energy. Wounds close at its touch.',
      materials: [{ itemId: 'staff_core', amount: 3 }, { itemId: 'veil_dust', amount: 3 }, { itemId: 'rift_shard', amount: 2 }, { itemId: 'faded_sigil_wax', amount: 2 }],
      goldCost: 250, output: { itemId: 'divine_staff', amount: 1 } },


    // ══════════════════════════════════════════════════════════════════════════
    // ALCHEMY — consumables
    // ══════════════════════════════════════════════════════════════════════════

    { id: 'weak_healing_tonic', name: 'Weak Healing Tonic', profession: 'alchemy', tier: 1, requiredSkill: 0,
      description: 'A basic healing draught for minor wounds.',
      materials: [{ itemId: 'herbs', amount: 2 }, { itemId: 'glass_vial', amount: 1 }, { itemId: 'river_water', amount: 1 }],
      goldCost: 6,  output: { itemId: 'weak_healing_tonic', amount: 1 } },

    { id: 'dried_ration_pack', name: 'Dried Ration Pack', profession: 'alchemy', tier: 1, requiredSkill: 0,
      description: 'Dried food for survival during travel.',
      materials: [{ itemId: 'beast_fat', amount: 1 }, { itemId: 'herbs', amount: 2 }, { itemId: 'fiber_bundle', amount: 1 }],
      goldCost: 5,  output: { itemId: 'dried_ration_pack', amount: 1 } },

    { id: 'weak_mana_tonic',   name: 'Weak Mana Tonic',   profession: 'alchemy', tier: 1, requiredSkill: 200,
      description: 'Restores a small amount of mana.',
      materials: [{ itemId: 'herbs', amount: 2 }, { itemId: 'veil_dust', amount: 1 }, { itemId: 'glass_vial', amount: 1 }],
      goldCost: 8,  output: { itemId: 'weak_mana_tonic', amount: 1 } },

    { id: 'stamina_draught',   name: 'Stamina Draught',   profession: 'alchemy', tier: 1, requiredSkill: 300,
      description: 'Restores stamina for continued exertion.',
      materials: [{ itemId: 'herbs', amount: 2 }, { itemId: 'beast_fat', amount: 1 }, { itemId: 'glass_vial', amount: 1 }],
      goldCost: 8,  output: { itemId: 'stamina_draught', amount: 1 } },

    { id: 'minor_rift_ward',   name: 'Minor Rift Ward',   profession: 'alchemy', tier: 2, requiredSkill: 500,
      description: 'Protects against minor rift corruption.',
      materials: [{ itemId: 'veil_dust', amount: 1 }, { itemId: 'ash_resin', amount: 1 }, { itemId: 'glass_vial', amount: 1 }],
      goldCost: 12, output: { itemId: 'minor_rift_ward', amount: 1 } },

    { id: 'weapon_repair_kit_alch', name: 'Weapon Repair Kit', profession: 'alchemy', tier: 1, requiredSkill: 400,
      description: 'Oil, whetstone, and scraps. Repairs weapon durability.',
      materials: [{ itemId: 'beast_fat', amount: 1 }, { itemId: 'ash_resin', amount: 1 }, { itemId: 'charcoal', amount: 1 }],
      goldCost: 8,  output: { itemId: 'weapon_repair_kit', amount: 1 } },

    // ══════════════════════════════════════════════════════════════════════════
    //  WARBAND SUPPLY ITEMS — consumables and kits used in warband operations
    // ══════════════════════════════════════════════════════════════════════════

    // ── Alchemy: consumables & field medicine ─────────────────────────────────
    { id: 'ration_pack', name: 'Ration Pack', profession: 'alchemy', tier: 1, requiredSkill: 0,
      description: 'Compact field rations. Reduces supply drain during long warband operations.',
      materials: [{ itemId: 'herbs', amount: 2 }, { itemId: 'beast_fat', amount: 1 }],
      goldCost: 5,  output: { itemId: 'ration_pack', amount: 3 } },

    { id: 'field_medicine_kit', name: 'Field Medicine Kit', profession: 'alchemy', tier: 1, requiredSkill: 100,
      description: 'Bandages, poultices, and tonics. Reduces casualty rate in warband missions.',
      materials: [{ itemId: 'herbs', amount: 3 }, { itemId: 'cloth_scraps', amount: 2 }, { itemId: 'glass_vial', amount: 1 }],
      goldCost: 12, output: { itemId: 'field_medicine_kit', amount: 1 } },

    { id: 'endurance_tonic', name: 'Endurance Tonic', profession: 'alchemy', tier: 1, requiredSkill: 200,
      description: 'Improves troop stamina for long marches. Boosts march efficiency for one operation.',
      materials: [{ itemId: 'herbs', amount: 2 }, { itemId: 'beast_fat', amount: 1 }, { itemId: 'ground_herbs', amount: 1 }],
      goldCost: 10, output: { itemId: 'endurance_tonic', amount: 2 } },

    { id: 'corruption_antidote', name: 'Corruption Antidote', profession: 'alchemy', tier: 2, requiredSkill: 500,
      description: 'Reduces corruption buildup during rift missions. Critical for rift-zone operations.',
      materials: [{ itemId: 'veil_dust', amount: 2 }, { itemId: 'ground_herbs', amount: 2 }, { itemId: 'glass_vial', amount: 1 }],
      goldCost: 20, output: { itemId: 'corruption_antidote', amount: 2 } },

    { id: 'fire_oil_flask', name: 'Fire Oil Flask', profession: 'alchemy', tier: 2, requiredSkill: 600,
      description: 'Incendiary flask. Improves siege effectiveness against fortified positions.',
      materials: [{ itemId: 'beast_fat', amount: 2 }, { itemId: 'ash_resin', amount: 2 }, { itemId: 'glass_vial', amount: 1 }],
      goldCost: 18, output: { itemId: 'fire_oil_flask', amount: 2 } },

    // ── Blacksmithing: troop weapon kits & siege tools ────────────────────────
    { id: 'troop_weapon_kit', name: 'Troop Weapon Kit', profession: 'blacksmithing', tier: 1, requiredSkill: 200,
      description: 'Sharpened blades, replacement parts, and edge oil for a warband unit.',
      materials: [{ itemId: 'scrap_iron', amount: 4 }, { itemId: 'wood_handle', amount: 2 }],
      goldCost: 15, output: { itemId: 'troop_weapon_kit', amount: 1 } },

    { id: 'breach_tools', name: 'Breach Tools', profession: 'blacksmithing', tier: 2, requiredSkill: 600,
      description: 'Crowbars, chisels, and charge frames. Required for fort breach operations.',
      materials: [{ itemId: 'iron_ingot', amount: 3 }, { itemId: 'rough_wood', amount: 2 }, { itemId: 'charcoal', amount: 1 }],
      goldCost: 30, output: { itemId: 'breach_tools', amount: 1 } },

    { id: 'iron_weapon_crate', name: 'Iron Weapon Crate', profession: 'blacksmithing', tier: 3, requiredSkill: 1000,
      description: 'Full weapons crate for a warband company. Significantly improves troop attack power.',
      materials: [{ itemId: 'iron_ingot', amount: 6 }, { itemId: 'wood_handle', amount: 3 }, { itemId: 'leather_strap', amount: 2 }],
      goldCost: 60, output: { itemId: 'iron_weapon_crate', amount: 1 } },

    // ── Armorsmithing: troop armor kits ───────────────────────────────────────
    { id: 'troop_armor_kit', name: 'Troop Armor Kit', profession: 'armorsmithing', tier: 1, requiredSkill: 200,
      description: 'Plate patches and padding for a warband unit. Improves defense in tile battles.',
      materials: [{ itemId: 'scrap_iron', amount: 3 }, { itemId: 'tattered_leather', amount: 2 }],
      goldCost: 14, output: { itemId: 'troop_armor_kit', amount: 1 } },

    { id: 'shield_kit', name: 'Shield Kit', profession: 'armorsmithing', tier: 1, requiredSkill: 300,
      description: 'Replacement shield straps and rim bracing. Reduces casualty rate in defense.',
      materials: [{ itemId: 'scrap_iron', amount: 2 }, { itemId: 'rough_wood', amount: 2 }, { itemId: 'leather_strap', amount: 2 }],
      goldCost: 16, output: { itemId: 'shield_kit', amount: 1 } },

    { id: 'heavy_armor_plates', name: 'Heavy Armor Plates', profession: 'armorsmithing', tier: 2, requiredSkill: 700,
      description: 'Iron reinforcement plates for elite warband units.',
      materials: [{ itemId: 'iron_ingot', amount: 4 }, { itemId: 'leather_strap', amount: 2 }],
      goldCost: 35, output: { itemId: 'heavy_armor_plates', amount: 1 } },

    // ── Woodworking: camp structures, barricades, scout kits ──────────────────
    { id: 'field_barricade', name: 'Field Barricade', profession: 'woodworking', tier: 1, requiredSkill: 100,
      description: 'Portable wood barricade frame. Improves hold chance after tile capture.',
      materials: [{ itemId: 'rough_wood', amount: 4 }, { itemId: 'fiber_bundle', amount: 1 }],
      goldCost: 10, output: { itemId: 'field_barricade', amount: 2 } },

    { id: 'scout_marker_kit', name: 'Scout Marker Kit', profession: 'woodworking', tier: 1, requiredSkill: 200,
      description: 'Stakes, flags, and map inserts for scouting teams. Improves scout range.',
      materials: [{ itemId: 'rough_wood', amount: 2 }, { itemId: 'cloth_scraps', amount: 1 }],
      goldCost: 8,  output: { itemId: 'scout_marker_kit', amount: 2 } },

    { id: 'fort_timber_bundle', name: 'Fort Timber Bundle', profession: 'woodworking', tier: 2, requiredSkill: 500,
      description: 'Pre-cut timber for fortification construction on controlled tiles.',
      materials: [{ itemId: 'treated_plank', amount: 4 }, { itemId: 'rough_wood', amount: 3 }],
      goldCost: 25, output: { itemId: 'fort_timber_bundle', amount: 1 } },

    // ── Tailoring: banners, travel gear, light field kits ────────────────────
    { id: 'morale_banner', name: 'Morale Banner', profession: 'tailoring', tier: 1, requiredSkill: 150,
      description: 'Faction banner for a warband unit. Improves morale and reduces retreat chance.',
      materials: [{ itemId: 'woven_cloth', amount: 2 }, { itemId: 'fiber_bundle', amount: 1 }],
      goldCost: 12, output: { itemId: 'morale_banner', amount: 1 } },

    { id: 'field_bandages', name: 'Field Bandages', profession: 'tailoring', tier: 1, requiredSkill: 0,
      description: 'Quick wound dressing for troops. Reduces immediate casualty count.',
      materials: [{ itemId: 'cloth_scraps', amount: 3 }],
      goldCost: 4,  output: { itemId: 'field_bandages', amount: 4 } },

    { id: 'supply_pack', name: 'Supply Pack', profession: 'tailoring', tier: 2, requiredSkill: 400,
      description: 'Heavy-duty carrier frame and pouches. Increases supply capacity for one operation.',
      materials: [{ itemId: 'woven_cloth', amount: 2 }, { itemId: 'leather_strap', amount: 2 }, { itemId: 'fiber_bundle', amount: 2 }],
      goldCost: 20, output: { itemId: 'supply_pack', amount: 1 } },

    // ── Magesmithing: ward stones, rift tools ─────────────────────────────────
    { id: 'ward_pylon', name: 'Ward Pylon', profession: 'magesmithing', tier: 2, requiredSkill: 500,
      description: 'Magical warding post for controlled tiles. Reduces enemy rift pressure.',
      materials: [{ itemId: 'veil_dust', amount: 2 }, { itemId: 'iron_ingot', amount: 1 }, { itemId: 'staff_core', amount: 1 }],
      goldCost: 40, output: { itemId: 'ward_pylon', amount: 1 } },

    { id: 'rift_anchor', name: 'Rift Anchor', profession: 'magesmithing', tier: 3, requiredSkill: 1000,
      description: 'Stabilizes rift energies on a controlled tile. Reduces corruption growth for 24 hours.',
      materials: [{ itemId: 'veil_dust', amount: 3 }, { itemId: 'rift_shard', amount: 1 }, { itemId: 'faded_sigil_wax', amount: 1 }],
      goldCost: 75, output: { itemId: 'rift_anchor', amount: 1 } },

    { id: 'signal_banner_mage', name: 'Arcane Signal Banner', profession: 'magesmithing', tier: 2, requiredSkill: 700,
      description: 'Enchanted banner visible across multiple tiles. Coordinates multi-warband operations.',
      materials: [{ itemId: 'veil_dust', amount: 1 }, { itemId: 'woven_cloth', amount: 2 }, { itemId: 'faded_sigil_wax', amount: 1 }],
      goldCost: 35, output: { itemId: 'signal_banner_mage', amount: 1 } },

];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getRecipe(recipeId) {
    return RECIPES.find(r => r.id === recipeId);
}

function getRecipesByProfession(profession) {
    return RECIPES.filter(r => r.profession === profession);
}

function getRecipesByTier(tier) {
    return RECIPES.filter(r => r.tier === tier);
}

function getAvailableRecipes(profession, skillLevel) {
    return RECIPES.filter(
        r => r.profession === profession && r.requiredSkill <= skillLevel
    );
}
