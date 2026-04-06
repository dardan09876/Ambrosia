// js/data/warbandData.js
// Static definitions for the Warbands system.

// ── Action costs ──────────────────────────────────────────────────────────────
const WARBAND_COSTS = {
    fortify:        50,
    deployTroops:   30,
    stabilizeRift:  70,
    factionSupport: 40,
};

// ── Control score thresholds ──────────────────────────────────────────────────
// controlScore: -100 (full enemy) → 0 (contested) → +100 (full player)
const WARBAND_CONTROL = {
    enemyFull:    -100,
    enemyThresh:  -25,   // below this = enemy controlled
    playerThresh:  25,   // above this = player controlled
    playerFull:    100,
};

// ── Tile type configurations ──────────────────────────────────────────────────
const WARBAND_TILE_TYPES = {
    rift: {
        id:             'rift',
        label:          'Rift Node',
        icon:           '🌀',
        color:          { enemy: '#7a1a1a', contested: '#5a3a1a', player: '#1a4a2a', locked: '#1a1a1a' },
        description:    'A tear in the veil. Generates constant enemy pressure. Stabilizing it cuts off enemy spawns.',
        bonusLabel:     '+15% XP from delves per controlled rift',
        pressurePerTick: 3,   // enemy pressure applied every enemy turn
    },
    stronghold: {
        id:             'stronghold',
        label:          'Stronghold',
        icon:           '⛫',
        color:          { enemy: '#7a2a1a', contested: '#5a2a1a', player: '#1a3a4a', locked: '#1a1a1a' },
        description:    'A fortified ruin. Holding it grants HP and resists enemy attack.',
        bonusLabel:     '+10 max HP per controlled stronghold',
        pressurePerTick: 2,
    },
    supply: {
        id:             'supply',
        label:          'Supply Zone',
        icon:           '⊕',
        color:          { enemy: '#4a3a1a', contested: '#3a3a1a', player: '#2a4a1a', locked: '#1a1a1a' },
        description:    'Logistics hub. Controlled supply zones boost gold rewards.',
        bonusLabel:     '+10% quest gold per controlled supply zone',
        pressurePerTick: 1,
    },
    pathway: {
        id:             'pathway',
        label:          'Pathway',
        icon:           '◈',
        color:          { enemy: '#3a3a4a', contested: '#3a3a5a', player: '#2a3a4a', locked: '#1a1a1a' },
        description:    'Strategic road through the ruins. Unlocks access to adjacent tiles.',
        bonusLabel:     'Unlocks adjacent tiles',
        pressurePerTick: 1,
    },
};

// ── Faction support definitions ───────────────────────────────────────────────
const WARBAND_FACTION_SUPPORT = {
    iron_dominion: {
        factionId:   'iron_dominion',
        name:        'Iron Dominion',
        icon:        '⚔',
        description: 'Stronger troops and fortifications.',
        effects: {
            troopStrength:   1.20,   // deploy troops +20% control gain
            fortifyCostMod:  0.90,   // fortify -10% cost
        },
        supportLabel: 'Troops +20% · Fortify -10% cost',
    },
    ashen_covenant: {
        factionId:   'ashen_covenant',
        name:        'Ashen Covenant',
        icon:        '🔮',
        description: 'Cheaper rift stabilization and magic buffs.',
        effects: {
            stabilizeCostMod: 0.75,  // stabilize rift -25% cost
            riftXpBonus:      1.10,  // +10% additional rift XP
        },
        supportLabel: 'Stabilize -25% cost · Rift XP +10%',
    },
    thornwood_pact: {
        factionId:   'thornwood_pact',
        name:        'Thornwood Pact',
        icon:        '🌲',
        description: 'Faster control spread and ambush bonuses.',
        effects: {
            holdingBonus:  2,        // extra control per holding tick
            questInfluenceBonus: 1.15, // +15% influence from quests
        },
        supportLabel: 'Hold gain +2 · Quest influence +15%',
    },
};

function getWarbandFactionSupport(factionId) {
    // Map player faction IDs to warband faction support
    const map = {
        iron_dominion:  'iron_dominion',
        ashen_covenant: 'ashen_covenant',
        thornwood_pact: 'thornwood_pact',
        // Fallback aliases
        dominion: 'iron_dominion',
        covenant: 'ashen_covenant',
        thornwood: 'thornwood_pact',
    };
    const key = map[factionId] || factionId;
    return WARBAND_FACTION_SUPPORT[key] || null;
}

// ── Rift quest definitions ────────────────────────────────────────────────────
// difficulty drives influence reward: influence += difficulty * 5
const WARBAND_RIFT_QUESTS = [
    {
        id:          'wq_breach_outer',
        name:        'Breach the Outer Rift',
        description: 'Push through demon lines near a minor rift node and establish a foothold.',
        tileType:    'rift',
        skillCheck:  { skill: 'melee', required: 80 },
        difficulty:  4,
        duration:    180,
        goldReward:  { min: 15, max: 40 },
        cooldownSec: 600,
        controlGain: 15,   // applied to a rift tile on success
    },
    {
        id:          'wq_shadow_patrol',
        name:        'Shadow the Patrol',
        description: 'Slip past enemy patrols in the ruins and map their positions.',
        tileType:    'pathway',
        skillCheck:  { skill: 'stealth', required: 70 },
        difficulty:  3,
        duration:    150,
        goldReward:  { min: 10, max: 30 },
        cooldownSec: 480,
        controlGain: 12,
    },
    {
        id:          'wq_secure_supply',
        name:        'Secure the Supply Cache',
        description: 'Recover supplies from a ruined depot before the enemy burns them.',
        tileType:    'supply',
        skillCheck:  { skill: 'defense', required: 75 },
        difficulty:  3,
        duration:    200,
        goldReward:  { min: 20, max: 50 },
        cooldownSec: 540,
        controlGain: 12,
    },
    {
        id:          'wq_arcane_survey',
        name:        'Arcane Survey',
        description: 'Map the rift energies bleeding through the capital ruins.',
        tileType:    'rift',
        skillCheck:  { skill: 'magic', required: 90 },
        difficulty:  5,
        duration:    240,
        goldReward:  { min: 20, max: 45 },
        cooldownSec: 720,
        controlGain: 20,
    },
    {
        id:          'wq_fortify_position',
        name:        'Fortify the Position',
        description: 'Reinforce a contested stronghold against an imminent counter-push.',
        tileType:    'stronghold',
        skillCheck:  { skill: 'defense', required: 110 },
        difficulty:  6,
        duration:    300,
        goldReward:  { min: 25, max: 60 },
        cooldownSec: 900,
        controlGain: 25,
    },
    {
        id:          'wq_ambush_vanguard',
        name:        'Ambush the Vanguard',
        description: 'Intercept an enemy resupply column pushing through the ruins.',
        tileType:    'pathway',
        skillCheck:  { skill: 'ranged', required: 95 },
        difficulty:  4,
        duration:    220,
        goldReward:  { min: 18, max: 45 },
        cooldownSec: 660,
        controlGain: 15,
    },
];

function getWarbandRiftQuest(id) {
    return WARBAND_RIFT_QUESTS.find(q => q.id === id) ?? null;
}

// Influence earned per quest: difficulty * 5
function calcQuestInfluence(quest, factionSupportActive) {
    let base = quest.difficulty * 5;
    if (factionSupportActive?.effects?.questInfluenceBonus) {
        base = Math.floor(base * factionSupportActive.effects.questInfluenceBonus);
    }
    return base;
}
