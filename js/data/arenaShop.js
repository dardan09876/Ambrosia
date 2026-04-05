// js/data/arenaShop.js
// Arena vendor data — exclusive gear, consumables, upgrades, and chest purchases.

// ── Arena-Exclusive Equipment ─────────────────────────────────────────────────
// These items cannot be crafted or found in chests. Arena vendor only.
// arenaEffect key maps to special behaviors applied by combatEngine._applyArenaItemEffects().

const ARENA_SHOP_ITEMS = [

    // ── Weapons ──────────────────────────────────────────────────────────────
    {
        id: 'bloodforged_blade',
        name: 'Bloodforged Blade',
        type: 'equipment',
        category: 'weapon',
        slot: 'weapon',
        tier: 3,
        damage: 58,
        defense: 0,
        durability: 100,
        maxDurability: 100,
        value: 0,
        scalingSkill: 'melee',
        tags: ['arena_exclusive'],
        description: 'High melee damage · drains 5 HP from wielder each turn',
        arenaEffect: 'selfBleed',
        cost: 150,
    },
    {
        id: 'gladiators_spear',
        name: "Gladiator's Spear",
        type: 'equipment',
        category: 'weapon',
        slot: 'weapon',
        tier: 3,
        damage: 45,
        defense: 0,
        durability: 100,
        maxDurability: 100,
        value: 0,
        scalingSkill: 'melee',
        tags: ['arena_exclusive'],
        description: '+30% damage bonus in the arena',
        arenaEffect: 'spearBonus',
        cost: 120,
    },
    {
        id: 'executioners_axe',
        name: "Executioner's Axe",
        type: 'equipment',
        category: 'weapon',
        slot: 'weapon',
        tier: 4,
        damage: 65,
        defense: 0,
        durability: 100,
        maxDurability: 100,
        value: 0,
        scalingSkill: 'melee',
        tags: ['arena_exclusive'],
        description: '+50% damage vs enemies below 30% HP',
        arenaEffect: 'executioner',
        cost: 200,
    },

    // ── Armor ─────────────────────────────────────────────────────────────────
    {
        id: 'arena_champion_plate',
        name: 'Arena Champion Plate',
        type: 'equipment',
        category: 'armor',
        slot: 'torso',
        tier: 3,
        damage: 0,
        defense: 62,
        durability: 120,
        maxDurability: 120,
        value: 0,
        tags: ['arena_exclusive'],
        description: 'Very high defense · -20% stamina regen between rounds',
        arenaEffect: 'reducedStaminaRegen',
        cost: 180,
    },
    {
        id: 'survivors_cloak',
        name: "Survivor's Cloak",
        type: 'equipment',
        category: 'armor',
        slot: 'back',
        tier: 2,
        damage: 0,
        defense: 18,
        durability: 80,
        maxDurability: 80,
        value: 0,
        tags: ['arena_exclusive'],
        description: '+20% dodge chance in arena · -10% max HP',
        arenaEffect: 'survivorsDodge',
        cost: 100,
    },

    // ── Accessories ──────────────────────────────────────────────────────────
    {
        id: 'ring_of_endurance',
        name: 'Ring of Endurance',
        type: 'equipment',
        category: 'accessory',
        slot: 'ring',
        tier: 2,
        damage: 0,
        defense: 5,
        durability: 60,
        maxDurability: 60,
        value: 0,
        tags: ['arena_exclusive'],
        description: '+25 stamina restored between every round',
        arenaEffect: 'staminaRegen',
        cost: 80,
    },
    {
        id: 'amulet_of_momentum',
        name: 'Amulet of Momentum',
        type: 'equipment',
        category: 'accessory',
        slot: 'ring',
        tier: 3,
        damage: 4,
        defense: 0,
        durability: 60,
        maxDurability: 60,
        value: 0,
        tags: ['arena_exclusive'],
        description: '+4 flat attack damage per round survived (stacks, resets each run)',
        arenaEffect: 'momentum',
        cost: 160,
    },
    {
        id: 'token_charm',
        name: 'Token Charm',
        type: 'equipment',
        category: 'accessory',
        slot: 'ring',
        tier: 1,
        damage: 0,
        defense: 2,
        durability: 60,
        maxDurability: 60,
        value: 0,
        tags: ['arena_exclusive'],
        description: '+1 extra arena token every 3 rounds',
        arenaEffect: 'tokenBonus',
        cost: 200,
    },
];

// ── Run Consumables ───────────────────────────────────────────────────────────
// Purchased from vendor. Stored as counts on player.arenaConsumables.
// Activated via "Use" button before a run → staged in player.pendingArenaBuffs.

const ARENA_CONSUMABLES = [
    {
        id: 'gladiators_ration',
        name: "Gladiator's Ration",
        icon: '🍖',
        description: '+20% max HP for the next run',
        cost: 30,
        buff: { type: 'maxHealthPct', value: 0.20 },
    },
    {
        id: 'adrenaline_draft',
        name: 'Adrenaline Draft',
        icon: '⚡',
        description: 'Start the run with full stamina',
        cost: 20,
        buff: { type: 'fullStamina', value: true },
    },
    {
        id: 'mana_surge_potion',
        name: 'Mana Surge Potion',
        icon: '🔮',
        description: '+50% max mana for the next run',
        cost: 40,
        buff: { type: 'maxManaPct', value: 0.50 },
    },
    {
        id: 'second_wind_elixir',
        name: 'Second Wind Elixir',
        icon: '💚',
        description: 'Auto-revive once at 30% HP when you would be defeated',
        cost: 200,
        buff: { type: 'revive', value: 0.30 },
    },
];

// ── Permanent Arena Upgrades ──────────────────────────────────────────────────
// Levels stored on player.arenaUpgrades[key]. Applied each run via snapshot.

const ARENA_UPGRADE_DEFS = {
    healthBoost: {
        name: 'Iron Constitution',
        description: '+5% max HP in arena',
        maxLevel: 10,
        costPerLevel: 30,
        category: 'Survivability',
    },
    roundRecovery: {
        name: 'Battle Hardened',
        description: '+5% HP recovered between rounds',
        maxLevel: 5,
        costPerLevel: 45,
        category: 'Survivability',
    },
    manaRegen: {
        name: 'Arcane Focus',
        description: '+10 mana restored between rounds',
        maxLevel: 5,
        costPerLevel: 40,
        category: 'Resource',
    },
    staminaBonus: {
        name: 'Endurance Training',
        description: '+10 stamina restored between rounds',
        maxLevel: 5,
        costPerLevel: 40,
        category: 'Resource',
    },
    combatDamage: {
        name: 'Arena Mastery',
        description: '+5% damage in arena per level',
        maxLevel: 10,
        costPerLevel: 50,
        category: 'Combat',
    },
    tokenGain: {
        name: 'Crowd Favorite',
        description: '+1 bonus token per 5 rounds (stacks per level)',
        maxLevel: 5,
        costPerLevel: 60,
        category: 'Economy',
    },
    goldBonus: {
        name: 'War Profiteer',
        description: '+10% gold earned from arena per level',
        maxLevel: 5,
        costPerLevel: 35,
        category: 'Economy',
    },
};

// ── Chest Shop ────────────────────────────────────────────────────────────────
const ARENA_CHEST_SHOP = [
    { tier: 2, cost: 50,  name: 'Silver Chest'    },
    { tier: 3, cost: 150, name: 'Gold Chest'       },
    { tier: 5, cost: 500, name: 'Legendary Chest'  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getArenaShopItem(id) {
    return ARENA_SHOP_ITEMS.find(i => i.id === id) || null;
}

function getArenaConsumable(id) {
    return ARENA_CONSUMABLES.find(c => c.id === id) || null;
}
