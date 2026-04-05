// js/data/items.js
// All item definitions. Fresh copies created via getItem(id) — never mutate ITEMS directly.
//
// Extra fields vs original:
//   weaponType  — 'sword'|'mace'|'hammer'|'spear'|'greatsword'|'dagger'|'bow'|'quiver'|'staff_magic'|'staff_restoration'|'shield'
//   armorClass  — 'heavy' | 'light' | 'mage'
//   twoHanded   — true for spears and greatswords (blocks offhand slot)
//   statBonuses — { statName: flatBonus } applied to stat.baseMax while equipped

// ITEM_TIER_COLORS and ITEM_TIER_NAMES are defined in chests.js (loaded after this file)

const ARMOR_CLASS_COLORS = {
    heavy: '#9a7c5b',
    light: '#7faa58',
    mage:  '#7b72c9',
};

const ARMOR_CLASS_LABELS = {
    heavy: 'Heavy',
    light: 'Light',
    mage:  'Mage',
};

const WEAPON_TYPE_LABELS = {
    sword:              'Sword',
    mace:               'Mace',
    hammer:             'Hammer',
    axe:                'Axe',
    spear:              'Spear',
    greatsword:         'Greatsword',
    dagger:             'Dagger',
    bow:                'Bow',
    quiver:             'Quiver',
    staff_magic:        'Magic Staff',
    staff_restoration:  'Resto Staff',
    shield:             'Shield',
};

const ITEMS = {

    // ═══════════════════════════════════════════════════════════════
    //  WEAPONS
    // ═══════════════════════════════════════════════════════════════

    // ── Swords (melee, 1H) ────────────────────────────────────────
    bronze_sword: {
        id: 'bronze_sword', name: 'Bronze Sword',
        slot: 'weapon', category: 'weapon', weaponType: 'sword',
        damage: 8, defense: 0, tier: 1, durability: 100, maxDurability: 100,
        requiredSkill: { skill: 'melee', level: 0 },
        description: 'A crude but serviceable blade cast in dull bronze.',
    },
    iron_sword: {
        id: 'iron_sword', name: 'Iron Sword',
        slot: 'weapon', category: 'weapon', weaponType: 'sword',
        damage: 18, defense: 0, tier: 2, durability: 150, maxDurability: 150,
        requiredSkill: { skill: 'melee', level: 100 },
        description: 'Heavier than bronze. Hits harder, too.',
    },
    steel_sword: {
        id: 'steel_sword', name: 'Steel Sword',
        slot: 'weapon', category: 'weapon', weaponType: 'sword',
        damage: 32, defense: 0, tier: 3, durability: 220, maxDurability: 220,
        requiredSkill: { skill: 'melee', level: 500 },
        description: 'Forged by a master, balanced to perfection.',
    },
    gold_sword: {
        id: 'gold_sword', name: 'Gilded Blade',
        slot: 'weapon', category: 'weapon', weaponType: 'sword',
        damage: 52, defense: 0, tier: 4, durability: 300, maxDurability: 300,
        requiredSkill: { skill: 'melee', level: 2000 },
        description: 'Gold-threaded steel. As beautiful as it is deadly.',
    },
    alaium_sword: {
        id: 'alaium_sword', name: 'Alaium Blade',
        slot: 'weapon', category: 'weapon', weaponType: 'sword',
        damage: 90, defense: 0, tier: 5, durability: 500, maxDurability: 500,
        requiredSkill: { skill: 'melee', level: 5000 },
        description: "A blade forged from a metal that shouldn't exist.",
    },

    // ── Maces (melee, 1H) ─────────────────────────────────────────
    bronze_mace: {
        id: 'bronze_mace', name: 'Bronze Mace',
        slot: 'weapon', category: 'weapon', weaponType: 'mace',
        damage: 9, defense: 0, tier: 1, durability: 110, maxDurability: 110,
        requiredSkill: { skill: 'melee', level: 0 },
        description: 'A flanged club cast in bronze. Cracks bone efficiently.',
    },
    iron_mace: {
        id: 'iron_mace', name: 'Iron Mace',
        slot: 'weapon', category: 'weapon', weaponType: 'mace',
        damage: 20, defense: 0, tier: 2, durability: 160, maxDurability: 160,
        requiredSkill: { skill: 'melee', level: 100 },
        description: 'Heavy flanges that punish even armoured foes.',
    },
    steel_mace: {
        id: 'steel_mace', name: 'Steel Mace',
        slot: 'weapon', category: 'weapon', weaponType: 'mace',
        damage: 35, defense: 0, tier: 3, durability: 240, maxDurability: 240,
        requiredSkill: { skill: 'melee', level: 500 },
        description: 'Polished flanges that never lose their edge.',
    },
    gilded_mace: {
        id: 'gilded_mace', name: 'Gilded Mace',
        slot: 'weapon', category: 'weapon', weaponType: 'mace',
        damage: 56, defense: 0, tier: 4, durability: 320, maxDurability: 320,
        requiredSkill: { skill: 'melee', level: 2000 },
        description: 'Inlaid with gold filigree — a ceremonial weapon that still kills.',
    },
    alaium_mace: {
        id: 'alaium_mace', name: 'Alaium Mace',
        slot: 'weapon', category: 'weapon', weaponType: 'mace',
        damage: 95, defense: 0, tier: 5, durability: 520, maxDurability: 520,
        requiredSkill: { skill: 'melee', level: 5000 },
        description: 'Resonates with each strike, shattering shields and will alike.',
    },

    // ── Hammers (melee, 1H) ───────────────────────────────────────
    bronze_hammer: {
        id: 'bronze_hammer', name: 'Bronze Hammer',
        slot: 'weapon', category: 'weapon', weaponType: 'hammer',
        damage: 10, defense: 0, tier: 1, durability: 110, maxDurability: 110,
        requiredSkill: { skill: 'melee', level: 0 },
        description: "A blacksmith's hammer repurposed for combat.",
    },
    iron_hammer: {
        id: 'iron_hammer', name: 'Iron Hammer',
        slot: 'weapon', category: 'weapon', weaponType: 'hammer',
        damage: 22, defense: 0, tier: 2, durability: 170, maxDurability: 170,
        requiredSkill: { skill: 'melee', level: 100 },
        description: 'Dense iron head on an ash shaft. Slow but devastating.',
    },
    steel_hammer: {
        id: 'steel_hammer', name: 'Steel Warhammer',
        slot: 'weapon', category: 'weapon', weaponType: 'hammer',
        damage: 38, defense: 0, tier: 3, durability: 250, maxDurability: 250,
        requiredSkill: { skill: 'melee', level: 500 },
        description: 'A weapon designed to end battles quickly.',
    },
    war_hammer: {
        id: 'war_hammer', name: 'Gilded Warhammer',
        slot: 'weapon', category: 'weapon', weaponType: 'hammer',
        damage: 60, defense: 0, tier: 4, durability: 340, maxDurability: 340,
        requiredSkill: { skill: 'melee', level: 2000 },
        description: 'Carried by champions. The gold inlay marks it as a weapon of office.',
    },
    alaium_hammer: {
        id: 'alaium_hammer', name: 'Alaium Warhammer',
        slot: 'weapon', category: 'weapon', weaponType: 'hammer',
        damage: 100, defense: 0, tier: 5, durability: 540, maxDurability: 540,
        requiredSkill: { skill: 'melee', level: 5000 },
        description: 'Each blow shakes the air itself.',
    },

    // ── Spears (melee, 2H) ────────────────────────────────────────
    wooden_spear: {
        id: 'wooden_spear', name: 'Wooden Spear',
        slot: 'weapon', category: 'weapon', weaponType: 'spear', twoHanded: true,
        damage: 12, defense: 0, tier: 1, durability: 90, maxDurability: 90,
        requiredSkill: { skill: 'melee', level: 0 },
        description: 'Fire-hardened tip on a long ash shaft. Reach is its virtue.',
    },
    iron_spear: {
        id: 'iron_spear', name: 'Iron Spear',
        slot: 'weapon', category: 'weapon', weaponType: 'spear', twoHanded: true,
        damage: 26, defense: 0, tier: 2, durability: 160, maxDurability: 160,
        requiredSkill: { skill: 'melee', level: 100 },
        description: 'A leaf-bladed spear built for soldiers who need reach.',
    },
    steel_spear: {
        id: 'steel_spear', name: 'Steel Spear',
        slot: 'weapon', category: 'weapon', weaponType: 'spear', twoHanded: true,
        damage: 44, defense: 0, tier: 3, durability: 230, maxDurability: 230,
        requiredSkill: { skill: 'melee', level: 500 },
        description: 'The choice of phalanx formations and elite guards.',
    },
    gilded_spear: {
        id: 'gilded_spear', name: 'Gilded Spear',
        slot: 'weapon', category: 'weapon', weaponType: 'spear', twoHanded: true,
        damage: 70, defense: 0, tier: 4, durability: 320, maxDurability: 320,
        requiredSkill: { skill: 'melee', level: 2000 },
        description: "A war-lance befitting a knight of the Golden Order.",
    },
    alaium_spear: {
        id: 'alaium_spear', name: 'Alaium Lance',
        slot: 'weapon', category: 'weapon', weaponType: 'spear', twoHanded: true,
        damage: 115, defense: 0, tier: 5, durability: 510, maxDurability: 510,
        requiredSkill: { skill: 'melee', level: 5000 },
        description: 'The tip hums with a frequency that unsettles the living.',
    },

    // ── Greatswords (melee, 2H) ───────────────────────────────────
    crude_greatsword: {
        id: 'crude_greatsword', name: 'Crude Greatsword',
        slot: 'weapon', category: 'weapon', weaponType: 'greatsword', twoHanded: true,
        damage: 14, defense: 0, tier: 1, durability: 100, maxDurability: 100,
        requiredSkill: { skill: 'melee', level: 0 },
        description: 'Barely more than a sharpened iron bar. Heavy enough to work.',
    },
    iron_greatsword: {
        id: 'iron_greatsword', name: 'Iron Greatsword',
        slot: 'weapon', category: 'weapon', weaponType: 'greatsword', twoHanded: true,
        damage: 28, defense: 0, tier: 2, durability: 180, maxDurability: 180,
        requiredSkill: { skill: 'melee', level: 100 },
        description: 'Takes two hands and serious shoulders to swing effectively.',
    },
    steel_greatsword: {
        id: 'steel_greatsword', name: 'Steel Greatsword',
        slot: 'weapon', category: 'weapon', weaponType: 'greatsword', twoHanded: true,
        damage: 48, defense: 0, tier: 3, durability: 260, maxDurability: 260,
        requiredSkill: { skill: 'melee', level: 500 },
        description: 'A claymore that can cleave through light armour in a single stroke.',
    },
    gilded_greatsword: {
        id: 'gilded_greatsword', name: 'Gilded Greatsword',
        slot: 'weapon', category: 'weapon', weaponType: 'greatsword', twoHanded: true,
        damage: 76, defense: 0, tier: 4, durability: 360, maxDurability: 360,
        requiredSkill: { skill: 'melee', level: 2000 },
        description: 'Longer than a man is tall. Legends are made with blades like this.',
    },
    alaium_greatsword: {
        id: 'alaium_greatsword', name: 'Alaium Greatsword',
        slot: 'weapon', category: 'weapon', weaponType: 'greatsword', twoHanded: true,
        damage: 120, defense: 0, tier: 5, durability: 530, maxDurability: 530,
        requiredSkill: { skill: 'melee', level: 5000 },
        description: 'Leaves a faint trail of cold light with every swing.',
    },

    // ── Daggers (stealth, 1H) ─────────────────────────────────────
    rusty_dagger: {
        id: 'rusty_dagger', name: 'Rusty Dagger',
        slot: 'weapon', category: 'weapon', weaponType: 'dagger',
        damage: 5, defense: 0, tier: 1, durability: 60, maxDurability: 60,
        requiredSkill: { skill: 'stealth', level: 0 },
        description: 'Light and concealable. The rust adds character.',
    },
    iron_dagger: {
        id: 'iron_dagger', name: 'Iron Dagger',
        slot: 'weapon', category: 'weapon', weaponType: 'dagger',
        damage: 14, defense: 0, tier: 2, durability: 120, maxDurability: 120,
        requiredSkill: { skill: 'stealth', level: 100 },
        description: 'Slim and double-edged. Preferred by scouts.',
    },
    steel_dagger: {
        id: 'steel_dagger', name: 'Steel Dagger',
        slot: 'weapon', category: 'weapon', weaponType: 'dagger',
        damage: 26, defense: 0, tier: 3, durability: 190, maxDurability: 190,
        requiredSkill: { skill: 'stealth', level: 500 },
        description: 'A stiletto fine enough to thread between armour plates.',
    },
    shadow_blade: {
        id: 'shadow_blade', name: 'Shadow Blade',
        slot: 'weapon', category: 'weapon', weaponType: 'dagger',
        damage: 42, defense: 0, tier: 4, durability: 280, maxDurability: 280,
        requiredSkill: { skill: 'stealth', level: 2000 },
        description: "The blade absorbs light. Easy to miss until it's too late.",
    },
    phantom_dagger: {
        id: 'phantom_dagger', name: 'Phantom Dagger',
        slot: 'weapon', category: 'weapon', weaponType: 'dagger',
        damage: 72, defense: 0, tier: 5, durability: 450, maxDurability: 450,
        requiredSkill: { skill: 'stealth', level: 5000 },
        description: 'So sharp it barely feels like a strike at all.',
    },

    // ── Bows (ranged, weapon slot) ────────────────────────────────
    wooden_bow: {
        id: 'wooden_bow', name: 'Wooden Bow',
        slot: 'weapon', category: 'weapon', weaponType: 'bow',
        damage: 10, defense: 0, tier: 1, durability: 70, maxDurability: 70,
        requiredSkill: { skill: 'ranged', level: 0 },
        description: 'Carved from a yew branch. Reliable at short range.',
    },
    iron_bow: {
        id: 'iron_bow', name: 'Reinforced Bow',
        slot: 'weapon', category: 'weapon', weaponType: 'bow',
        damage: 22, defense: 0, tier: 2, durability: 130, maxDurability: 130,
        requiredSkill: { skill: 'ranged', level: 100 },
        description: 'Iron-tipped limbs and a gut string. Accurate at distance.',
    },
    steel_bow: {
        id: 'steel_bow', name: 'Steel Recurve',
        slot: 'weapon', category: 'weapon', weaponType: 'bow',
        damage: 36, defense: 0, tier: 3, durability: 200, maxDurability: 200,
        requiredSkill: { skill: 'ranged', level: 500 },
        description: 'A laminated recurve with frightening draw weight.',
    },
    gilded_bow: {
        id: 'gilded_bow', name: 'Gilded Longbow',
        slot: 'weapon', category: 'weapon', weaponType: 'bow',
        damage: 58, defense: 0, tier: 4, durability: 290, maxDurability: 290,
        requiredSkill: { skill: 'ranged', level: 2000 },
        description: 'An elven longbow repurposed with gilded inlay.',
    },
    alaium_bow: {
        id: 'alaium_bow', name: 'Alaium Warbow',
        slot: 'weapon', category: 'weapon', weaponType: 'bow',
        damage: 95, defense: 0, tier: 5, durability: 480, maxDurability: 480,
        requiredSkill: { skill: 'ranged', level: 5000 },
        description: "The arrows never quite miss.",
    },

    // ── Quivers (ranged, off-hand) ────────────────────────────────
    crude_quiver: {
        id: 'crude_quiver', name: 'Crude Quiver',
        slot: 'offhand', category: 'weapon', weaponType: 'quiver',
        damage: 4, defense: 0, tier: 1, durability: 50, maxDurability: 50,
        requiredSkill: { skill: 'ranged', level: 0 },
        description: 'A bundle of crudely fletched arrows. Gets the job done.',
    },
    iron_quiver: {
        id: 'iron_quiver', name: 'Iron-Tipped Quiver',
        slot: 'offhand', category: 'weapon', weaponType: 'quiver',
        damage: 10, defense: 0, tier: 2, durability: 90, maxDurability: 90,
        requiredSkill: { skill: 'ranged', level: 100 },
        description: 'Iron bodkin heads that punch through light armour.',
    },
    steel_quiver: {
        id: 'steel_quiver', name: 'Steel Broadhead Quiver',
        slot: 'offhand', category: 'weapon', weaponType: 'quiver',
        damage: 18, defense: 0, tier: 3, durability: 150, maxDurability: 150,
        requiredSkill: { skill: 'ranged', level: 500 },
        description: 'Broadhead tips that cut clean and bleed deep.',
    },
    gilded_quiver: {
        id: 'gilded_quiver', name: 'Gilded Quiver',
        slot: 'offhand', category: 'weapon', weaponType: 'quiver',
        damage: 28, defense: 0, tier: 4, durability: 220, maxDurability: 220,
        requiredSkill: { skill: 'ranged', level: 2000 },
        description: 'Fletched with hawk feathers. Flies true at any range.',
    },
    alaium_quiver: {
        id: 'alaium_quiver', name: 'Alaium Quiver',
        slot: 'offhand', category: 'weapon', weaponType: 'quiver',
        damage: 48, defense: 0, tier: 5, durability: 400, maxDurability: 400,
        requiredSkill: { skill: 'ranged', level: 5000 },
        description: 'The arrows reform after each shot. The quiver never empties.',
    },

    // ── Magic Staves (magic, weapon slot) ─────────────────────────
    apprentice_staff: {
        id: 'apprentice_staff', name: "Apprentice's Staff",
        slot: 'weapon', category: 'weapon', weaponType: 'staff_magic',
        damage: 7, defense: 2, tier: 1, durability: 80, maxDurability: 80,
        requiredSkill: { skill: 'magic', level: 0 },
        description: 'Etched with runes that glow faintly in the dark.',
    },
    arcane_staff: {
        id: 'arcane_staff', name: 'Arcane Staff',
        slot: 'weapon', category: 'weapon', weaponType: 'staff_magic',
        damage: 16, defense: 4, tier: 2, durability: 140, maxDurability: 140,
        requiredSkill: { skill: 'magic', level: 100 },
        description: 'Carved from ironwood, capped with a shard of arcane crystal.',
    },
    mages_staff: {
        id: 'mages_staff', name: "Mage's Staff",
        slot: 'weapon', category: 'weapon', weaponType: 'staff_magic',
        damage: 28, defense: 7, tier: 3, durability: 210, maxDurability: 210,
        requiredSkill: { skill: 'magic', level: 500 },
        description: "A journeyman's staff that channels spells with minimal loss.",
    },
    gilded_staff: {
        id: 'gilded_staff', name: 'Gilded Spellstaff',
        slot: 'weapon', category: 'weapon', weaponType: 'staff_magic',
        damage: 48, defense: 12, tier: 4, durability: 300, maxDurability: 300,
        requiredSkill: { skill: 'magic', level: 2000 },
        description: 'Threaded with gold to enhance resonance. Spells crackle louder here.',
    },
    alaium_staff: {
        id: 'alaium_staff', name: 'Alaium Spellstaff',
        slot: 'weapon', category: 'weapon', weaponType: 'staff_magic',
        damage: 82, defense: 20, tier: 5, durability: 490, maxDurability: 490,
        requiredSkill: { skill: 'magic', level: 5000 },
        description: 'Vibrates at a frequency that bends the air around it.',
    },

    // ── Restoration Staves (restoration, weapon slot) ─────────────
    healing_branch: {
        id: 'healing_branch', name: 'Healing Branch',
        slot: 'weapon', category: 'weapon', weaponType: 'staff_restoration',
        damage: 5, defense: 5, tier: 1, durability: 70, maxDurability: 70,
        requiredSkill: { skill: 'restoration', level: 0 },
        description: "A branch from a living healer's tree. Still warm.",
    },
    blessed_staff: {
        id: 'blessed_staff', name: 'Blessed Staff',
        slot: 'weapon', category: 'weapon', weaponType: 'staff_restoration',
        damage: 12, defense: 10, tier: 2, durability: 130, maxDurability: 130,
        requiredSkill: { skill: 'restoration', level: 100 },
        description: "Inscribed with prayers that ease the wielder's wounds.",
    },
    sanctified_staff: {
        id: 'sanctified_staff', name: 'Sanctified Staff',
        slot: 'weapon', category: 'weapon', weaponType: 'staff_restoration',
        damage: 22, defense: 17, tier: 3, durability: 200, maxDurability: 200,
        requiredSkill: { skill: 'restoration', level: 500 },
        description: 'Consecrated at the Shrine of the Still Flame.',
    },
    radiant_staff: {
        id: 'radiant_staff', name: 'Radiant Staff',
        slot: 'weapon', category: 'weapon', weaponType: 'staff_restoration',
        damage: 36, defense: 27, tier: 4, durability: 290, maxDurability: 290,
        requiredSkill: { skill: 'restoration', level: 2000 },
        description: 'Glows softly even in pitch darkness. Allies relax near it.',
    },
    divine_staff: {
        id: 'divine_staff', name: 'Divine Staff',
        slot: 'weapon', category: 'weapon', weaponType: 'staff_restoration',
        damage: 60, defense: 44, tier: 5, durability: 470, maxDurability: 470,
        requiredSkill: { skill: 'restoration', level: 5000 },
        description: 'A conduit of pure divine energy. Wounds close at its touch.',
    },

    // ── Shields (defense, off-hand) ───────────────────────────────
    bronze_shield: {
        id: 'bronze_shield', name: 'Bronze Shield',
        slot: 'offhand', category: 'armor', weaponType: 'shield',
        damage: 0, defense: 8, tier: 1, durability: 120, maxDurability: 120,
        requiredSkill: { skill: 'defense', level: 0 },
        description: 'Battered bronze, but better than nothing.',
    },
    iron_shield: {
        id: 'iron_shield', name: 'Iron Shield',
        slot: 'offhand', category: 'armor', weaponType: 'shield',
        damage: 0, defense: 16, tier: 2, durability: 200, maxDurability: 200,
        requiredSkill: { skill: 'defense', level: 100 },
        description: 'A kite shield that can stop a cavalry charge.',
    },
    steel_shield: {
        id: 'steel_shield', name: 'Steel Shield',
        slot: 'offhand', category: 'armor', weaponType: 'shield',
        damage: 0, defense: 28, tier: 3, durability: 280, maxDurability: 280,
        requiredSkill: { skill: 'defense', level: 500 },
        description: 'Tower shield — heavy but near-impenetrable when braced.',
    },
    gilded_shield: {
        id: 'gilded_shield', name: 'Gilded Shield',
        slot: 'offhand', category: 'armor', weaponType: 'shield',
        damage: 0, defense: 44, tier: 4, durability: 380, maxDurability: 380,
        requiredSkill: { skill: 'defense', level: 2000 },
        description: 'The golden crest has stopped blades cold.',
    },
    alaium_shield: {
        id: 'alaium_shield', name: 'Alaium Shield',
        slot: 'offhand', category: 'armor', weaponType: 'shield',
        damage: 0, defense: 72, tier: 5, durability: 560, maxDurability: 560,
        requiredSkill: { skill: 'defense', level: 5000 },
        description: 'Absorbs energy on impact, distributing it harmlessly.',
    },

    // ═══════════════════════════════════════════════════════════════
    //  HEAVY ARMOUR — high defence, +Stamina & +Health per piece
    //  Required skill: Defense
    // ═══════════════════════════════════════════════════════════════

    // T1 — Bronze
    bronze_helm: {
        id: 'bronze_helm', name: 'Bronze Helm',
        slot: 'head', category: 'armor', armorClass: 'heavy',
        damage: 0, defense: 5, tier: 1, durability: 90, maxDurability: 90,
        requiredSkill: { skill: 'defense', level: 0 },
        statBonuses: { stamina: 3, health: 2 },
        description: 'A heavy bronze skullcap. Dents but does not break.',
    },
    bronze_breastplate: {
        id: 'bronze_breastplate', name: 'Bronze Breastplate',
        slot: 'torso', category: 'armor', armorClass: 'heavy',
        damage: 0, defense: 8, tier: 1, durability: 120, maxDurability: 120,
        requiredSkill: { skill: 'defense', level: 0 },
        statBonuses: { stamina: 3, health: 2 },
        description: 'Solid cast bronze covering neck to hip.',
    },
    bronze_pauldrons: {
        id: 'bronze_pauldrons', name: 'Bronze Pauldrons',
        slot: 'back', category: 'armor', armorClass: 'heavy',
        damage: 0, defense: 4, tier: 1, durability: 85, maxDurability: 85,
        requiredSkill: { skill: 'defense', level: 0 },
        statBonuses: { stamina: 3, health: 2 },
        description: 'Heavy shoulder guards that protect the upper back.',
    },
    bronze_gauntlets: {
        id: 'bronze_gauntlets', name: 'Bronze Gauntlets',
        slot: 'hands', category: 'armor', armorClass: 'heavy',
        damage: 0, defense: 3, tier: 1, durability: 80, maxDurability: 80,
        requiredSkill: { skill: 'defense', level: 0 },
        statBonuses: { stamina: 3, health: 2 },
        description: 'Articulated bronze fingers. Awkward but protective.',
    },
    bronze_greaves: {
        id: 'bronze_greaves', name: 'Bronze Greaves',
        slot: 'legs', category: 'armor', armorClass: 'heavy',
        damage: 0, defense: 4, tier: 1, durability: 85, maxDurability: 85,
        requiredSkill: { skill: 'defense', level: 0 },
        statBonuses: { stamina: 3, health: 2 },
        description: 'Shin and thigh guards cast from a single mould.',
    },
    bronze_sabatons: {
        id: 'bronze_sabatons', name: 'Bronze Sabatons',
        slot: 'feet', category: 'armor', armorClass: 'heavy',
        damage: 0, defense: 3, tier: 1, durability: 80, maxDurability: 80,
        requiredSkill: { skill: 'defense', level: 0 },
        statBonuses: { stamina: 3, health: 2 },
        description: 'Plated boot covers. Noisy on cobblestones.',
    },

    // T2 — Iron
    iron_helm: {
        id: 'iron_helm', name: 'Iron Helm',
        slot: 'head', category: 'armor', armorClass: 'heavy',
        damage: 0, defense: 11, tier: 2, durability: 160, maxDurability: 160,
        requiredSkill: { skill: 'defense', level: 100 },
        statBonuses: { stamina: 8, health: 5 },
        description: 'Solid iron, well-fitted. Stopped more than one blade.',
    },
    iron_chestplate: {
        id: 'iron_chestplate', name: 'Iron Chestplate',
        slot: 'torso', category: 'armor', armorClass: 'heavy',
        damage: 0, defense: 17, tier: 2, durability: 200, maxDurability: 200,
        requiredSkill: { skill: 'defense', level: 100 },
        statBonuses: { stamina: 8, health: 5 },
        description: 'Heavy, but the weight is reassuring.',
    },
    iron_pauldrons: {
        id: 'iron_pauldrons', name: 'Iron Pauldrons',
        slot: 'back', category: 'armor', armorClass: 'heavy',
        damage: 0, defense: 9, tier: 2, durability: 160, maxDurability: 160,
        requiredSkill: { skill: 'defense', level: 100 },
        statBonuses: { stamina: 8, health: 5 },
        description: 'Solid shoulder plates riveted to backplate straps.',
    },
    iron_gauntlets: {
        id: 'iron_gauntlets', name: 'Iron Gauntlets',
        slot: 'hands', category: 'armor', armorClass: 'heavy',
        damage: 0, defense: 7, tier: 2, durability: 150, maxDurability: 150,
        requiredSkill: { skill: 'defense', level: 100 },
        statBonuses: { stamina: 8, health: 5 },
        description: 'Full plate gloves. Leave bruises even in a handshake.',
    },
    iron_greaves: {
        id: 'iron_greaves', name: 'Iron Greaves',
        slot: 'legs', category: 'armor', armorClass: 'heavy',
        damage: 0, defense: 9, tier: 2, durability: 160, maxDurability: 160,
        requiredSkill: { skill: 'defense', level: 100 },
        statBonuses: { stamina: 8, health: 5 },
        description: 'Articulated knee protection built for long marches.',
    },
    iron_sabatons: {
        id: 'iron_sabatons', name: 'Iron Sabatons',
        slot: 'feet', category: 'armor', armorClass: 'heavy',
        damage: 0, defense: 7, tier: 2, durability: 150, maxDurability: 150,
        requiredSkill: { skill: 'defense', level: 100 },
        statBonuses: { stamina: 8, health: 5 },
        description: 'Heavy iron boots with sabaton toe-caps.',
    },

    // T3 — Steel
    steel_helm: {
        id: 'steel_helm', name: 'Steel Helm',
        slot: 'head', category: 'armor', armorClass: 'heavy',
        damage: 0, defense: 19, tier: 3, durability: 220, maxDurability: 220,
        requiredSkill: { skill: 'defense', level: 500 },
        statBonuses: { stamina: 16, health: 10 },
        description: 'Polished steel, engraved with a ward against ill fortune.',
    },
    steel_breastplate: {
        id: 'steel_breastplate', name: 'Steel Breastplate',
        slot: 'torso', category: 'armor', armorClass: 'heavy',
        damage: 0, defense: 29, tier: 3, durability: 270, maxDurability: 270,
        requiredSkill: { skill: 'defense', level: 500 },
        statBonuses: { stamina: 16, health: 10 },
        description: 'Full plate that has turned aside both blade and arrow.',
    },
    steel_pauldrons: {
        id: 'steel_pauldrons', name: 'Steel Pauldrons',
        slot: 'back', category: 'armor', armorClass: 'heavy',
        damage: 0, defense: 15, tier: 3, durability: 220, maxDurability: 220,
        requiredSkill: { skill: 'defense', level: 500 },
        statBonuses: { stamina: 16, health: 10 },
        description: 'Full-coverage shoulder plates with attached backguard.',
    },
    steel_gauntlets: {
        id: 'steel_gauntlets', name: 'Steel Gauntlets',
        slot: 'hands', category: 'armor', armorClass: 'heavy',
        damage: 0, defense: 12, tier: 3, durability: 200, maxDurability: 200,
        requiredSkill: { skill: 'defense', level: 500 },
        statBonuses: { stamina: 16, health: 10 },
        description: 'Finger-articulated plate with reinforced knuckles.',
    },
    steel_greaves: {
        id: 'steel_greaves', name: 'Steel Greaves',
        slot: 'legs', category: 'armor', armorClass: 'heavy',
        damage: 0, defense: 15, tier: 3, durability: 220, maxDurability: 220,
        requiredSkill: { skill: 'defense', level: 500 },
        statBonuses: { stamina: 16, health: 10 },
        description: 'Full leg coverage. Weighs enough to slow a sprint.',
    },
    steel_sabatons: {
        id: 'steel_sabatons', name: 'Steel Sabatons',
        slot: 'feet', category: 'armor', armorClass: 'heavy',
        damage: 0, defense: 12, tier: 3, durability: 200, maxDurability: 200,
        requiredSkill: { skill: 'defense', level: 500 },
        statBonuses: { stamina: 16, health: 10 },
        description: 'Articulated steel boot covers that protect every joint.',
    },

    // T4 — Gilded
    gilded_helm: {
        id: 'gilded_helm', name: 'Gilded Helm',
        slot: 'head', category: 'armor', armorClass: 'heavy',
        damage: 0, defense: 30, tier: 4, durability: 320, maxDurability: 320,
        requiredSkill: { skill: 'defense', level: 2000 },
        statBonuses: { stamina: 28, health: 18 },
        description: 'A great helm with gold-leaf crest. Commands respect on sight.',
    },
    gilded_breastplate: {
        id: 'gilded_breastplate', name: 'Gilded Breastplate',
        slot: 'torso', category: 'armor', armorClass: 'heavy',
        damage: 0, defense: 46, tier: 4, durability: 400, maxDurability: 400,
        requiredSkill: { skill: 'defense', level: 2000 },
        statBonuses: { stamina: 28, health: 18 },
        description: 'Master-forged plate inlaid with gold runes of warding.',
    },
    gilded_pauldrons: {
        id: 'gilded_pauldrons', name: 'Gilded Pauldrons',
        slot: 'back', category: 'armor', armorClass: 'heavy',
        damage: 0, defense: 24, tier: 4, durability: 300, maxDurability: 300,
        requiredSkill: { skill: 'defense', level: 2000 },
        statBonuses: { stamina: 28, health: 18 },
        description: 'Winged shoulder guards befitting a paladin.',
    },
    gilded_gauntlets: {
        id: 'gilded_gauntlets', name: 'Gilded Gauntlets',
        slot: 'hands', category: 'armor', armorClass: 'heavy',
        damage: 0, defense: 19, tier: 4, durability: 280, maxDurability: 280,
        requiredSkill: { skill: 'defense', level: 2000 },
        statBonuses: { stamina: 28, health: 18 },
        description: 'Plated gauntlets with gold-etched knuckle guards.',
    },
    gilded_greaves: {
        id: 'gilded_greaves', name: 'Gilded Greaves',
        slot: 'legs', category: 'armor', armorClass: 'heavy',
        damage: 0, defense: 24, tier: 4, durability: 300, maxDurability: 300,
        requiredSkill: { skill: 'defense', level: 2000 },
        statBonuses: { stamina: 28, health: 18 },
        description: 'Full plate legwear with ornate kneecaps.',
    },
    gilded_sabatons: {
        id: 'gilded_sabatons', name: 'Gilded Sabatons',
        slot: 'feet', category: 'armor', armorClass: 'heavy',
        damage: 0, defense: 19, tier: 4, durability: 280, maxDurability: 280,
        requiredSkill: { skill: 'defense', level: 2000 },
        statBonuses: { stamina: 28, health: 18 },
        description: 'Gilded plate boots with ankle articulation.',
    },

    // T5 — Alaium
    alaium_helm: {
        id: 'alaium_helm', name: 'Alaium Helm',
        slot: 'head', category: 'armor', armorClass: 'heavy',
        damage: 0, defense: 52, tier: 5, durability: 480, maxDurability: 480,
        requiredSkill: { skill: 'defense', level: 5000 },
        statBonuses: { stamina: 45, health: 30 },
        description: 'Gleams with cold blue light. The visor shows what lies beyond sight.',
    },
    alaium_breastplate: {
        id: 'alaium_breastplate', name: 'Alaium Breastplate',
        slot: 'torso', category: 'armor', armorClass: 'heavy',
        damage: 0, defense: 78, tier: 5, durability: 560, maxDurability: 560,
        requiredSkill: { skill: 'defense', level: 5000 },
        statBonuses: { stamina: 45, health: 30 },
        description: 'Weighs no more than cloth but stops everything short of a siege engine.',
    },
    alaium_pauldrons: {
        id: 'alaium_pauldrons', name: 'Alaium Pauldrons',
        slot: 'back', category: 'armor', armorClass: 'heavy',
        damage: 0, defense: 42, tier: 5, durability: 420, maxDurability: 420,
        requiredSkill: { skill: 'defense', level: 5000 },
        statBonuses: { stamina: 45, health: 30 },
        description: 'Shoulder plates that hum with a frequency that turns glancing blows.',
    },
    alaium_gauntlets: {
        id: 'alaium_gauntlets', name: 'Alaium Gauntlets',
        slot: 'hands', category: 'armor', armorClass: 'heavy',
        damage: 0, defense: 33, tier: 5, durability: 380, maxDurability: 380,
        requiredSkill: { skill: 'defense', level: 5000 },
        statBonuses: { stamina: 45, health: 30 },
        description: 'Perfectly articulated. Never fatigues the hand.',
    },
    alaium_greaves: {
        id: 'alaium_greaves', name: 'Alaium Greaves',
        slot: 'legs', category: 'armor', armorClass: 'heavy',
        damage: 0, defense: 42, tier: 5, durability: 420, maxDurability: 420,
        requiredSkill: { skill: 'defense', level: 5000 },
        statBonuses: { stamina: 45, health: 30 },
        description: 'Leg armour that moves with you, not against you.',
    },
    alaium_sabatons: {
        id: 'alaium_sabatons', name: 'Alaium Sabatons',
        slot: 'feet', category: 'armor', armorClass: 'heavy',
        damage: 0, defense: 33, tier: 5, durability: 380, maxDurability: 380,
        requiredSkill: { skill: 'defense', level: 5000 },
        statBonuses: { stamina: 45, health: 30 },
        description: 'Silent despite their construction. Leave no tracks.',
    },

    // ═══════════════════════════════════════════════════════════════
    //  LIGHT ARMOUR — balanced defence, +Energy & +Focus per piece
    //  Required skill: Stealth
    // ═══════════════════════════════════════════════════════════════

    // T1 — Leather
    leather_cap: {
        id: 'leather_cap', name: 'Leather Cap',
        slot: 'head', category: 'armor', armorClass: 'light',
        damage: 0, defense: 3, tier: 1, durability: 70, maxDurability: 70,
        requiredSkill: { skill: 'stealth', level: 0 },
        statBonuses: { energy: 3, focus: 2 },
        description: 'A simple cap of hardened leather. Keeps the sun off.',
    },
    leather_tunic: {
        id: 'leather_tunic', name: 'Leather Tunic',
        slot: 'torso', category: 'armor', armorClass: 'light',
        damage: 0, defense: 5, tier: 1, durability: 90, maxDurability: 90,
        requiredSkill: { skill: 'stealth', level: 0 },
        statBonuses: { energy: 3, focus: 2 },
        description: 'Hardened leather stitched together with gut thread.',
    },
    rough_cloak: {
        id: 'rough_cloak', name: 'Rough Cloak',
        slot: 'back', category: 'armor', armorClass: 'light',
        damage: 0, defense: 3, tier: 1, durability: 60, maxDurability: 60,
        requiredSkill: { skill: 'stealth', level: 0 },
        statBonuses: { energy: 3, focus: 2 },
        description: 'Wool and hide. Keeps the wind off, mostly.',
    },
    leather_gloves: {
        id: 'leather_gloves', name: 'Leather Gloves',
        slot: 'hands', category: 'armor', armorClass: 'light',
        damage: 0, defense: 2, tier: 1, durability: 65, maxDurability: 65,
        requiredSkill: { skill: 'stealth', level: 0 },
        statBonuses: { energy: 3, focus: 2 },
        description: "Soft leather that won't creak when gripping a weapon.",
    },
    leather_trousers: {
        id: 'leather_trousers', name: 'Leather Trousers',
        slot: 'legs', category: 'armor', armorClass: 'light',
        damage: 0, defense: 3, tier: 1, durability: 70, maxDurability: 70,
        requiredSkill: { skill: 'stealth', level: 0 },
        statBonuses: { energy: 3, focus: 2 },
        description: 'Sturdy leather breeches with padded knees.',
    },
    leather_boots: {
        id: 'leather_boots', name: 'Leather Boots',
        slot: 'feet', category: 'armor', armorClass: 'light',
        damage: 0, defense: 2, tier: 1, durability: 70, maxDurability: 70,
        requiredSkill: { skill: 'stealth', level: 0 },
        statBonuses: { energy: 3, focus: 2 },
        description: "Worn soles, but they'll hold another mile.",
    },

    // T2 — Studded
    studded_cap: {
        id: 'studded_cap', name: 'Studded Cap',
        slot: 'head', category: 'armor', armorClass: 'light',
        damage: 0, defense: 7, tier: 2, durability: 120, maxDurability: 120,
        requiredSkill: { skill: 'stealth', level: 100 },
        statBonuses: { energy: 8, focus: 5 },
        description: 'Leather reinforced with iron rivets across the crown.',
    },
    studded_vest: {
        id: 'studded_vest', name: 'Studded Vest',
        slot: 'torso', category: 'armor', armorClass: 'light',
        damage: 0, defense: 11, tier: 2, durability: 150, maxDurability: 150,
        requiredSkill: { skill: 'stealth', level: 100 },
        statBonuses: { energy: 8, focus: 5 },
        description: 'Iron studs across hardened leather. Protection without the bulk.',
    },
    studded_mantle: {
        id: 'studded_mantle', name: 'Studded Mantle',
        slot: 'back', category: 'armor', armorClass: 'light',
        damage: 0, defense: 6, tier: 2, durability: 110, maxDurability: 110,
        requiredSkill: { skill: 'stealth', level: 100 },
        statBonuses: { energy: 8, focus: 5 },
        description: 'A short mantle with reinforced shoulder pads.',
    },
    studded_gloves: {
        id: 'studded_gloves', name: 'Studded Gloves',
        slot: 'hands', category: 'armor', armorClass: 'light',
        damage: 0, defense: 5, tier: 2, durability: 100, maxDurability: 100,
        requiredSkill: { skill: 'stealth', level: 100 },
        statBonuses: { energy: 8, focus: 5 },
        description: 'Riveted leather gloves that protect the knuckles.',
    },
    studded_trousers: {
        id: 'studded_trousers', name: 'Studded Trousers',
        slot: 'legs', category: 'armor', armorClass: 'light',
        damage: 0, defense: 7, tier: 2, durability: 120, maxDurability: 120,
        requiredSkill: { skill: 'stealth', level: 100 },
        statBonuses: { energy: 8, focus: 5 },
        description: 'Reinforced leggings with studded outer thighs.',
    },
    studded_boots: {
        id: 'studded_boots', name: 'Studded Boots',
        slot: 'feet', category: 'armor', armorClass: 'light',
        damage: 0, defense: 5, tier: 2, durability: 110, maxDurability: 110,
        requiredSkill: { skill: 'stealth', level: 100 },
        statBonuses: { energy: 8, focus: 5 },
        description: 'Hard-soled boots with studded shin guards.',
    },

    // T3 — Ranger's
    rangers_hood: {
        id: 'rangers_hood', name: "Ranger's Hood",
        slot: 'head', category: 'armor', armorClass: 'light',
        damage: 0, defense: 13, tier: 3, durability: 175, maxDurability: 175,
        requiredSkill: { skill: 'stealth', level: 500 },
        statBonuses: { energy: 16, focus: 10 },
        description: 'A deep hood in forest-brown. Hard to spot at range.',
    },
    rangers_vest: {
        id: 'rangers_vest', name: "Ranger's Vest",
        slot: 'torso', category: 'armor', armorClass: 'light',
        damage: 0, defense: 19, tier: 3, durability: 220, maxDurability: 220,
        requiredSkill: { skill: 'stealth', level: 500 },
        statBonuses: { energy: 16, focus: 10 },
        description: 'Layered oiled leather with concealed pockets.',
    },
    rangers_mantle: {
        id: 'rangers_mantle', name: "Ranger's Mantle",
        slot: 'back', category: 'armor', armorClass: 'light',
        damage: 0, defense: 11, tier: 3, durability: 175, maxDurability: 175,
        requiredSkill: { skill: 'stealth', level: 500 },
        statBonuses: { energy: 16, focus: 10 },
        description: 'A forest cloak that blends with undergrowth.',
    },
    rangers_gloves: {
        id: 'rangers_gloves', name: "Ranger's Gloves",
        slot: 'hands', category: 'armor', armorClass: 'light',
        damage: 0, defense: 9, tier: 3, durability: 160, maxDurability: 160,
        requiredSkill: { skill: 'stealth', level: 500 },
        statBonuses: { energy: 16, focus: 10 },
        description: 'Thin leather archery gloves with reinforced fingertips.',
    },
    rangers_trousers: {
        id: 'rangers_trousers', name: "Ranger's Trousers",
        slot: 'legs', category: 'armor', armorClass: 'light',
        damage: 0, defense: 12, tier: 3, durability: 180, maxDurability: 180,
        requiredSkill: { skill: 'stealth', level: 500 },
        statBonuses: { energy: 16, focus: 10 },
        description: "Treated leather that doesn't rustle in the brush.",
    },
    rangers_boots: {
        id: 'rangers_boots', name: "Ranger's Boots",
        slot: 'feet', category: 'armor', armorClass: 'light',
        damage: 0, defense: 9, tier: 3, durability: 165, maxDurability: 165,
        requiredSkill: { skill: 'stealth', level: 500 },
        statBonuses: { energy: 16, focus: 10 },
        description: 'Soft-soled and silent. No trail left behind.',
    },

    // T4 — Shadow
    shadow_hood: {
        id: 'shadow_hood', name: 'Shadow Hood',
        slot: 'head', category: 'armor', armorClass: 'light',
        damage: 0, defense: 21, tier: 4, durability: 240, maxDurability: 240,
        requiredSkill: { skill: 'stealth', level: 2000 },
        statBonuses: { energy: 28, focus: 18 },
        description: 'Absorbs light. The face beneath is never clearly seen.',
    },
    shadow_vest: {
        id: 'shadow_vest', name: 'Shadow Vest',
        slot: 'torso', category: 'armor', armorClass: 'light',
        damage: 0, defense: 30, tier: 4, durability: 300, maxDurability: 300,
        requiredSkill: { skill: 'stealth', level: 2000 },
        statBonuses: { energy: 28, focus: 18 },
        description: 'Shade-woven leather that dampens all sound the wearer makes.',
    },
    shadow_mantle: {
        id: 'shadow_mantle', name: 'Shadow Mantle',
        slot: 'back', category: 'armor', armorClass: 'light',
        damage: 0, defense: 17, tier: 4, durability: 240, maxDurability: 240,
        requiredSkill: { skill: 'stealth', level: 2000 },
        statBonuses: { energy: 28, focus: 18 },
        description: 'A cloak with no distinct edge. It trails into shadow.',
    },
    shadow_gloves: {
        id: 'shadow_gloves', name: 'Shadow Gloves',
        slot: 'hands', category: 'armor', armorClass: 'light',
        damage: 0, defense: 14, tier: 4, durability: 220, maxDurability: 220,
        requiredSkill: { skill: 'stealth', level: 2000 },
        statBonuses: { energy: 28, focus: 18 },
        description: 'Fingerless at the tips for precise work.',
    },
    shadow_trousers: {
        id: 'shadow_trousers', name: 'Shadow Trousers',
        slot: 'legs', category: 'armor', armorClass: 'light',
        damage: 0, defense: 19, tier: 4, durability: 250, maxDurability: 250,
        requiredSkill: { skill: 'stealth', level: 2000 },
        statBonuses: { energy: 28, focus: 18 },
        description: 'Silent fabric that moves like smoke.',
    },
    shadow_boots: {
        id: 'shadow_boots', name: 'Shadow Boots',
        slot: 'feet', category: 'armor', armorClass: 'light',
        damage: 0, defense: 14, tier: 4, durability: 220, maxDurability: 220,
        requiredSkill: { skill: 'stealth', level: 2000 },
        statBonuses: { energy: 28, focus: 18 },
        description: 'Leave no print on any surface.',
    },

    // T5 — Phantom
    phantom_hood: {
        id: 'phantom_hood', name: 'Phantom Hood',
        slot: 'head', category: 'armor', armorClass: 'light',
        damage: 0, defense: 36, tier: 5, durability: 380, maxDurability: 380,
        requiredSkill: { skill: 'stealth', level: 5000 },
        statBonuses: { energy: 45, focus: 30 },
        description: "The wearer's face becomes a rumour.",
    },
    phantom_vest: {
        id: 'phantom_vest', name: 'Phantom Vest',
        slot: 'torso', category: 'armor', armorClass: 'light',
        damage: 0, defense: 52, tier: 5, durability: 460, maxDurability: 460,
        requiredSkill: { skill: 'stealth', level: 5000 },
        statBonuses: { energy: 45, focus: 30 },
        description: 'Vanishes when the wearer is still.',
    },
    phantom_mantle: {
        id: 'phantom_mantle', name: 'Phantom Mantle',
        slot: 'back', category: 'armor', armorClass: 'light',
        damage: 0, defense: 30, tier: 5, durability: 380, maxDurability: 380,
        requiredSkill: { skill: 'stealth', level: 5000 },
        statBonuses: { energy: 45, focus: 30 },
        description: 'A cloak woven from night-threads. Cannot be tracked.',
    },
    phantom_gloves: {
        id: 'phantom_gloves', name: 'Phantom Gloves',
        slot: 'hands', category: 'armor', armorClass: 'light',
        damage: 0, defense: 25, tier: 5, durability: 340, maxDurability: 340,
        requiredSkill: { skill: 'stealth', level: 5000 },
        statBonuses: { energy: 45, focus: 30 },
        description: 'Whatever the hand touches, it leaves no evidence behind.',
    },
    phantom_trousers: {
        id: 'phantom_trousers', name: 'Phantom Trousers',
        slot: 'legs', category: 'armor', armorClass: 'light',
        damage: 0, defense: 33, tier: 5, durability: 400, maxDurability: 400,
        requiredSkill: { skill: 'stealth', level: 5000 },
        statBonuses: { energy: 45, focus: 30 },
        description: 'The legs beneath them cannot be seen.',
    },
    phantom_boots: {
        id: 'phantom_boots', name: 'Phantom Boots',
        slot: 'feet', category: 'armor', armorClass: 'light',
        damage: 0, defense: 25, tier: 5, durability: 350, maxDurability: 350,
        requiredSkill: { skill: 'stealth', level: 5000 },
        statBonuses: { energy: 45, focus: 30 },
        description: 'Silent even on broken glass.',
    },

    // ═══════════════════════════════════════════════════════════════
    //  MAGE CLOTHING — low defence, major +Mana & +Energy per piece
    //  Required skill: Magic
    // ═══════════════════════════════════════════════════════════════

    // T1 — Linen
    linen_hood: {
        id: 'linen_hood', name: 'Linen Hood',
        slot: 'head', category: 'armor', armorClass: 'mage',
        damage: 0, defense: 2, tier: 1, durability: 55, maxDurability: 55,
        requiredSkill: { skill: 'magic', level: 0 },
        statBonuses: { mana: 5, energy: 2 },
        description: 'A simple cloth hood stitched with minor focusing glyphs.',
    },
    linen_robe: {
        id: 'linen_robe', name: 'Linen Robe',
        slot: 'torso', category: 'armor', armorClass: 'mage',
        damage: 0, defense: 3, tier: 1, durability: 70, maxDurability: 70,
        requiredSkill: { skill: 'magic', level: 0 },
        statBonuses: { mana: 5, energy: 2 },
        description: 'Loose-fitting linen inscribed with the first glyphs every apprentice learns.',
    },
    linen_cloak: {
        id: 'linen_cloak', name: 'Linen Cloak',
        slot: 'back', category: 'armor', armorClass: 'mage',
        damage: 0, defense: 2, tier: 1, durability: 50, maxDurability: 50,
        requiredSkill: { skill: 'magic', level: 0 },
        statBonuses: { mana: 5, energy: 2 },
        description: 'A lightweight cloak that channels ambient magic.',
    },
    linen_bracers: {
        id: 'linen_bracers', name: 'Linen Bracers',
        slot: 'hands', category: 'armor', armorClass: 'mage',
        damage: 0, defense: 1, tier: 1, durability: 45, maxDurability: 45,
        requiredSkill: { skill: 'magic', level: 0 },
        statBonuses: { mana: 5, energy: 2 },
        description: 'Cloth wraps that steady the wrist during casting.',
    },
    linen_leggings: {
        id: 'linen_leggings', name: 'Linen Leggings',
        slot: 'legs', category: 'armor', armorClass: 'mage',
        damage: 0, defense: 2, tier: 1, durability: 55, maxDurability: 55,
        requiredSkill: { skill: 'magic', level: 0 },
        statBonuses: { mana: 5, energy: 2 },
        description: 'Loose linen trousers embroidered with focus glyphs.',
    },
    linen_slippers: {
        id: 'linen_slippers', name: 'Linen Slippers',
        slot: 'feet', category: 'armor', armorClass: 'mage',
        damage: 0, defense: 1, tier: 1, durability: 45, maxDurability: 45,
        requiredSkill: { skill: 'magic', level: 0 },
        statBonuses: { mana: 5, energy: 2 },
        description: 'Soft-soled slippers stitched with grounding sigils.',
    },

    // T2 — Wool
    wool_hood: {
        id: 'wool_hood', name: 'Wool Hood',
        slot: 'head', category: 'armor', armorClass: 'mage',
        damage: 0, defense: 5, tier: 2, durability: 95, maxDurability: 95,
        requiredSkill: { skill: 'magic', level: 100 },
        statBonuses: { mana: 12, energy: 5 },
        description: 'Thick wool woven with channelling threads.',
    },
    wool_robe: {
        id: 'wool_robe', name: 'Wool Robe',
        slot: 'torso', category: 'armor', armorClass: 'mage',
        damage: 0, defense: 7, tier: 2, durability: 120, maxDurability: 120,
        requiredSkill: { skill: 'magic', level: 100 },
        statBonuses: { mana: 12, energy: 5 },
        description: "A journeyman's robe with expanded mana-weave stitching.",
    },
    wool_cloak: {
        id: 'wool_cloak', name: 'Wool Cloak',
        slot: 'back', category: 'armor', armorClass: 'mage',
        damage: 0, defense: 4, tier: 2, durability: 90, maxDurability: 90,
        requiredSkill: { skill: 'magic', level: 100 },
        statBonuses: { mana: 12, energy: 5 },
        description: 'Heavy wool, dyed deep blue to hide ink stains.',
    },
    wool_bracers: {
        id: 'wool_bracers', name: 'Wool Bracers',
        slot: 'hands', category: 'armor', armorClass: 'mage',
        damage: 0, defense: 3, tier: 2, durability: 80, maxDurability: 80,
        requiredSkill: { skill: 'magic', level: 100 },
        statBonuses: { mana: 12, energy: 5 },
        description: 'Padded wool wraps that reduce casting tremor.',
    },
    wool_leggings: {
        id: 'wool_leggings', name: 'Wool Leggings',
        slot: 'legs', category: 'armor', armorClass: 'mage',
        damage: 0, defense: 5, tier: 2, durability: 95, maxDurability: 95,
        requiredSkill: { skill: 'magic', level: 100 },
        statBonuses: { mana: 12, energy: 5 },
        description: 'Warm leggings with stitched focusing lines down each leg.',
    },
    wool_slippers: {
        id: 'wool_slippers', name: 'Wool Slippers',
        slot: 'feet', category: 'armor', armorClass: 'mage',
        damage: 0, defense: 3, tier: 2, durability: 80, maxDurability: 80,
        requiredSkill: { skill: 'magic', level: 100 },
        statBonuses: { mana: 12, energy: 5 },
        description: 'Soft-soled wool shoes good for pacing study halls.',
    },

    // T3 — Scholar's
    scholars_hood: {
        id: 'scholars_hood', name: "Scholar's Hood",
        slot: 'head', category: 'armor', armorClass: 'mage',
        damage: 0, defense: 9, tier: 3, durability: 140, maxDurability: 140,
        requiredSkill: { skill: 'magic', level: 500 },
        statBonuses: { mana: 24, energy: 10 },
        description: 'A deep hood inlaid with memory-weave script.',
    },
    scholars_robe: {
        id: 'scholars_robe', name: "Scholar's Robe",
        slot: 'torso', category: 'armor', armorClass: 'mage',
        damage: 0, defense: 13, tier: 3, durability: 170, maxDurability: 170,
        requiredSkill: { skill: 'magic', level: 500 },
        statBonuses: { mana: 24, energy: 10 },
        description: 'Heavy silk reinforced with enchanted thread. Used by senior mages.',
    },
    scholars_cloak: {
        id: 'scholars_cloak', name: "Scholar's Cloak",
        slot: 'back', category: 'armor', armorClass: 'mage',
        damage: 0, defense: 7, tier: 3, durability: 140, maxDurability: 140,
        requiredSkill: { skill: 'magic', level: 500 },
        statBonuses: { mana: 24, energy: 10 },
        description: 'The trim shifts colour with the ambient magical field.',
    },
    scholars_bracers: {
        id: 'scholars_bracers', name: "Scholar's Bracers",
        slot: 'hands', category: 'armor', armorClass: 'mage',
        damage: 0, defense: 6, tier: 3, durability: 130, maxDurability: 130,
        requiredSkill: { skill: 'magic', level: 500 },
        statBonuses: { mana: 24, energy: 10 },
        description: 'Inscribed with fifty-two binding formulae.',
    },
    scholars_leggings: {
        id: 'scholars_leggings', name: "Scholar's Leggings",
        slot: 'legs', category: 'armor', armorClass: 'mage',
        damage: 0, defense: 9, tier: 3, durability: 145, maxDurability: 145,
        requiredSkill: { skill: 'magic', level: 500 },
        statBonuses: { mana: 24, energy: 10 },
        description: 'Long flowing robes divided into walking trousers.',
    },
    scholars_slippers: {
        id: 'scholars_slippers', name: "Scholar's Slippers",
        slot: 'feet', category: 'armor', armorClass: 'mage',
        damage: 0, defense: 6, tier: 3, durability: 130, maxDurability: 130,
        requiredSkill: { skill: 'magic', level: 500 },
        statBonuses: { mana: 24, energy: 10 },
        description: 'Silent and grounded. The sole is embossed with ward-glyphs.',
    },

    // T4 — Arcane
    arcane_hood: {
        id: 'arcane_hood', name: 'Arcane Hood',
        slot: 'head', category: 'armor', armorClass: 'mage',
        damage: 0, defense: 14, tier: 4, durability: 200, maxDurability: 200,
        requiredSkill: { skill: 'magic', level: 2000 },
        statBonuses: { mana: 40, energy: 18 },
        description: 'Constellations shift across its deep black surface.',
    },
    arcane_robe: {
        id: 'arcane_robe', name: 'Arcane Robe',
        slot: 'torso', category: 'armor', armorClass: 'mage',
        damage: 0, defense: 21, tier: 4, durability: 240, maxDurability: 240,
        requiredSkill: { skill: 'magic', level: 2000 },
        statBonuses: { mana: 40, energy: 18 },
        description: 'Weaves spells into the air around the body as ambient shields.',
    },
    arcane_cloak: {
        id: 'arcane_cloak', name: 'Arcane Cloak',
        slot: 'back', category: 'armor', armorClass: 'mage',
        damage: 0, defense: 11, tier: 4, durability: 195, maxDurability: 195,
        requiredSkill: { skill: 'magic', level: 2000 },
        statBonuses: { mana: 40, energy: 18 },
        description: 'Folds through space slightly. Wider on the inside.',
    },
    arcane_bracers: {
        id: 'arcane_bracers', name: 'Arcane Bracers',
        slot: 'hands', category: 'armor', armorClass: 'mage',
        damage: 0, defense: 9, tier: 4, durability: 185, maxDurability: 185,
        requiredSkill: { skill: 'magic', level: 2000 },
        statBonuses: { mana: 40, energy: 18 },
        description: 'Amplify spells at the cost of more controlled casting.',
    },
    arcane_leggings: {
        id: 'arcane_leggings', name: 'Arcane Leggings',
        slot: 'legs', category: 'armor', armorClass: 'mage',
        damage: 0, defense: 14, tier: 4, durability: 200, maxDurability: 200,
        requiredSkill: { skill: 'magic', level: 2000 },
        statBonuses: { mana: 40, energy: 18 },
        description: 'Covered in circuit-like runic patterns that glow faintly under stress.',
    },
    arcane_slippers: {
        id: 'arcane_slippers', name: 'Arcane Slippers',
        slot: 'feet', category: 'armor', armorClass: 'mage',
        damage: 0, defense: 9, tier: 4, durability: 185, maxDurability: 185,
        requiredSkill: { skill: 'magic', level: 2000 },
        statBonuses: { mana: 40, energy: 18 },
        description: 'Hover just barely above the ground.',
    },

    // T5 — Ethereal
    ethereal_hood: {
        id: 'ethereal_hood', name: 'Ethereal Hood',
        slot: 'head', category: 'armor', armorClass: 'mage',
        damage: 0, defense: 24, tier: 5, durability: 300, maxDurability: 300,
        requiredSkill: { skill: 'magic', level: 5000 },
        statBonuses: { mana: 65, energy: 30 },
        description: 'The hood exists partially outside of physical space.',
    },
    ethereal_robe: {
        id: 'ethereal_robe', name: 'Ethereal Robe',
        slot: 'torso', category: 'armor', armorClass: 'mage',
        damage: 0, defense: 36, tier: 5, durability: 360, maxDurability: 360,
        requiredSkill: { skill: 'magic', level: 5000 },
        statBonuses: { mana: 65, energy: 30 },
        description: 'Woven from solidified magic. Normal weapons pass through harmlessly.',
    },
    ethereal_cloak: {
        id: 'ethereal_cloak', name: 'Ethereal Cloak',
        slot: 'back', category: 'armor', armorClass: 'mage',
        damage: 0, defense: 20, tier: 5, durability: 300, maxDurability: 300,
        requiredSkill: { skill: 'magic', level: 5000 },
        statBonuses: { mana: 65, energy: 30 },
        description: 'Billows even in still air. Spells cast from beneath it travel faster.',
    },
    ethereal_bracers: {
        id: 'ethereal_bracers', name: 'Ethereal Bracers',
        slot: 'hands', category: 'armor', armorClass: 'mage',
        damage: 0, defense: 16, tier: 5, durability: 270, maxDurability: 270,
        requiredSkill: { skill: 'magic', level: 5000 },
        statBonuses: { mana: 65, energy: 30 },
        description: 'Extend the effective range of every spell cast.',
    },
    ethereal_leggings: {
        id: 'ethereal_leggings', name: 'Ethereal Leggings',
        slot: 'legs', category: 'armor', armorClass: 'mage',
        damage: 0, defense: 24, tier: 5, durability: 300, maxDurability: 300,
        requiredSkill: { skill: 'magic', level: 5000 },
        statBonuses: { mana: 65, energy: 30 },
        description: 'Half-phase between worlds. Steps leave no mark.',
    },
    ethereal_slippers: {
        id: 'ethereal_slippers', name: 'Ethereal Slippers',
        slot: 'feet', category: 'armor', armorClass: 'mage',
        damage: 0, defense: 16, tier: 5, durability: 270, maxDurability: 270,
        requiredSkill: { skill: 'magic', level: 5000 },
        statBonuses: { mana: 65, energy: 30 },
        description: 'Walk on air, water, or the memory of a surface.',
    },

    // ═══════════════════════════════════════════════════════════════
    //  CRAFTED ITEMS — produced by professions from gathered materials
    // ═══════════════════════════════════════════════════════════════

    // ── Crafted weapons ───────────────────────────────────────────
    iron_axe: {
        id: 'iron_axe', name: 'Iron Axe',
        slot: 'weapon', category: 'weapon', weaponType: 'axe',
        damage: 20, defense: 0, tier: 2, durability: 170, maxDurability: 170,
        requiredSkill: { skill: 'melee', level: 100 },
        description: 'A heavy iron axe forged for powerful strikes.',
    },
    short_bow: {
        id: 'short_bow', name: 'Short Bow',
        slot: 'weapon', category: 'weapon', weaponType: 'bow', twoHanded: true,
        damage: 12, defense: 0, tier: 1, durability: 85, maxDurability: 85,
        requiredSkill: { skill: 'ranged', level: 0 },
        description: 'A nimble crafted bow favoured for speed over range.',
    },
    quarterstaff: {
        id: 'quarterstaff', name: 'Quarterstaff',
        slot: 'weapon', category: 'weapon', weaponType: 'staff_magic', twoHanded: true,
        damage: 8, defense: 2, tier: 1, durability: 100, maxDurability: 100,
        requiredSkill: { skill: 'magic', level: 0 },
        statBonuses: { mana: 5 },
        description: 'A sturdy wooden staff for combat and cantrips.',
    },
    infused_staff: {
        id: 'infused_staff', name: 'Infused Staff',
        slot: 'weapon', category: 'weapon', weaponType: 'staff_magic', twoHanded: true,
        damage: 28, defense: 0, tier: 2, durability: 140, maxDurability: 140,
        requiredSkill: { skill: 'magic', level: 100 },
        statBonuses: { mana: 12, focus: 6 },
        description: 'A staff core saturated with rift energy. Amplifies arcane output considerably.',
    },

    // ── Crafted armor ─────────────────────────────────────────────
    padded_gloves: {
        id: 'padded_gloves', name: 'Padded Gloves',
        slot: 'hands', category: 'armor', armorClass: 'light',
        damage: 0, defense: 2, tier: 1, durability: 60, maxDurability: 60,
        requiredSkill: { skill: 'stealth', level: 0 },
        statBonuses: { energy: 2, focus: 1 },
        description: 'Simple padded gloves stitched from cloth and leather.',
    },
    travelers_hood: {
        id: 'travelers_hood', name: "Traveler's Hood",
        slot: 'head', category: 'armor', armorClass: 'light',
        damage: 0, defense: 3, tier: 1, durability: 65, maxDurability: 65,
        requiredSkill: { skill: 'stealth', level: 0 },
        statBonuses: { energy: 2, focus: 1 },
        description: 'A hooded garment that keeps the weather off and the wearer anonymous.',
    },
    ashen_cloak: {
        id: 'ashen_cloak', name: 'Ashen Cloak',
        slot: 'back', category: 'armor', armorClass: 'light',
        damage: 0, defense: 6, tier: 2, durability: 110, maxDurability: 110,
        requiredSkill: { skill: 'stealth', level: 100 },
        statBonuses: { energy: 6, focus: 4 },
        description: 'Woven from ash-bleached cloth and stiffened with resin. Resists corruption.',
    },
    buckler_shield: {
        id: 'buckler_shield', name: 'Buckler Shield',
        slot: 'offhand', category: 'armor', weaponType: 'shield',
        damage: 0, defense: 6, tier: 1, durability: 100, maxDurability: 100,
        requiredSkill: { skill: 'defense', level: 0 },
        statBonuses: { stamina: 3, health: 2 },
        description: 'A small round shield. Light enough to use alongside most weapons.',
    },

    // ── Crafted jewelry ───────────────────────────────────────────
    warded_ring: {
        id: 'warded_ring', name: 'Warded Ring',
        slot: 'ring', category: 'jewelry',
        damage: 0, defense: 0, tier: 2, durability: 50, maxDurability: 50,
        requiredSkill: null,
        statBonuses: { mana: 15, focus: 5 },
        description: 'An iron band set with a warding sigil. Dampens minor magical disruption.',
    },

    // ── Crafted consumables ───────────────────────────────────────
    // These are usable items produced by Alchemy and other professions.
    // They do not have slots, damage, or durability — use _invConsumableCard to render.
    weak_healing_tonic: {
        id: 'weak_healing_tonic', name: 'Weak Healing Tonic',
        type: 'consumable', category: 'consumable',
        tier: 1, value: 8,
        effect: { stat: 'health', amount: 25 },
        description: 'A basic healing draught. Restores 25 health.',
    },
    weak_mana_tonic: {
        id: 'weak_mana_tonic', name: 'Weak Mana Tonic',
        type: 'consumable', category: 'consumable',
        tier: 1, value: 10,
        effect: { stat: 'mana', amount: 25 },
        description: 'A crystalline blue draught. Restores 25 mana.',
    },
    stamina_draught: {
        id: 'stamina_draught', name: 'Stamina Draught',
        type: 'consumable', category: 'consumable',
        tier: 1, value: 10,
        effect: { stat: 'stamina', amount: 30 },
        description: 'A thick amber liquid. Restores 30 stamina.',
    },
    dried_ration_pack: {
        id: 'dried_ration_pack', name: 'Dried Ration Pack',
        type: 'consumable', category: 'consumable',
        tier: 1, value: 7,
        effect: { stat: 'food', amount: 20 },
        description: 'Compact dried food. Restores 20 food.',
    },
    minor_rift_ward: {
        id: 'minor_rift_ward', name: 'Minor Rift Ward',
        type: 'consumable', category: 'consumable',
        tier: 2, value: 18,
        effect: { stat: 'ward', duration: 300 },
        description: 'A warding draught that briefly suppresses rift corruption effects.',
    },
    weapon_repair_kit: {
        id: 'weapon_repair_kit', name: 'Weapon Repair Kit',
        type: 'consumable', category: 'consumable',
        tier: 1, value: 12,
        effect: { stat: 'repair', amount: 60 },
        description: 'Oil, whetstone, and scraps. Repairs 60 durability on your equipped weapon.',
    },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getItemValue(item) {
    if (item.value != null) return item.value;
    return Math.floor(((item.damage || 0) + (item.defense || 0) + 5) * (item.tier || 1) * 4);
}

// Returns a fresh shallow copy (with statBonuses deep-copied) from base definitions
function getItem(id) {
    const base = ITEMS[id];
    if (!base) return null;
    const copy = Object.assign({}, base);
    if (copy.statBonuses) copy.statBonuses = Object.assign({}, copy.statBonuses);
    return copy;
}

// Returns all equippable (non-consumable) item definitions at the given tier.
// Used by loot generation to pick tier-appropriate named items from chests.
function getItemsByTier(tier) {
    return Object.values(ITEMS).filter(item =>
        item.tier === tier &&
        item.type !== 'consumable' &&
        item.category !== 'consumable' &&
        item.slot != null
    );
}
