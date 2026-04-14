// js/data/warbandData.js
// Static definitions for the Warbands system.

// ── Action costs ──────────────────────────────────────────────────────────────
// Command costs: in-match tactical actions
// Influence costs: persistent meta resource (faction support only)
const WARBAND_COSTS = {
    fortify:        40,    // Command
    deployTroops:   25,    // Command
    stabilizeRift:  60,    // Command
    factionSupport: 80,    // Influence
};

// ── Per-tile income values (granted each turn) ────────────────────────────────
// Command income per controlled tile type (resource node = supply, fortress = stronghold)
const WARBAND_TILE_CMD_INCOME = {
    pathway:    0,      // empty frontline — no command
    rift:       0.20,   // chokepoint-equivalent
    supply:     1.20,   // resource node
    stronghold: 0.80,   // fortress anchor
    heart:      0,
};
// Influence income per controlled tile type
const WARBAND_TILE_INF_INCOME = {
    pathway:    0.15,
    rift:       0.35,
    supply:     0.25,
    stronghold: 0.75,
    heart:      3.0,
};

// ── Capture costs (Command + Influence deducted on tile flip) ─────────────────
const WARBAND_CAPTURE_COSTS = {
    pathway:    { cmd: 0,  inf: 8  },
    rift:       { cmd: 8,  inf: 14 },
    supply:     { cmd: 10, inf: 18 },
    stronghold: { cmd: 20, inf: 30 },
    heart:      { cmd: 30, inf: 40 },
};

// ── Capture rewards (immediate burst on successful capture) ───────────────────
const WARBAND_CAPTURE_REWARDS = {
    pathway:    { cmd: 5,  inf: 4  },
    rift:       { cmd: 8,  inf: 7  },
    supply:     { cmd: 15, inf: 10 },
    stronghold: { cmd: 20, inf: 18 },
    heart:      { cmd: 0,  inf: 0  },  // win condition — handled separately
};

// ── Control score thresholds ──────────────────────────────────────────────────
const WARBAND_CONTROL = {
    enemyFull:    -100,
    enemyThresh:  -25,
    playerThresh:  25,
    playerFull:    100,
};

// ── Map tier definitions ──────────────────────────────────────────────────────
// Tiles are assigned a tier based on distance from the map center.
// Tier affects demon starting strength, reinforcement rate, and escalation.
const WARBAND_TIERS = {
    outer:  { id: 'outer',  label: 'Outer Ring',  baseStrength: 35, reinforcementRate: 1, routeScore: 10 },
    mid:    { id: 'mid',    label: 'Mid Ring',    baseStrength: 60, reinforcementRate: 2, routeScore: 40 },
    inner:  { id: 'inner',  label: 'Inner Ring',  baseStrength: 80, reinforcementRate: 3, routeScore: 70 },
    center: { id: 'center', label: 'Center',      baseStrength: 95, reinforcementRate: 4, routeScore: 100 },
};

// ── Demon zone types ──────────────────────────────────────────────────────────
// Each demon tile gets a zone type that modifies its behavior.
const WARBAND_DEMON_ZONES = {
    blight: {
        id:          'blight',
        label:       'Blighted Marsh',
        icon:        '🌑',
        description: 'Slow creeping corruption. Hard to cleanse, spreads insidiously.',
        spreadMult:  1.5,    // spreads faster into adjacent tiles
        regenMult:   1.3,    // regens demon strength faster
        pressureMult: 0.8,   // lower direct pressure (slow and grinding)
    },
    infernal: {
        id:          'infernal',
        label:       'Infernal Riftlands',
        icon:        '🔥',
        description: 'Spawns frequent attack waves. Volatile and aggressive.',
        spreadMult:  1.0,
        regenMult:   1.0,
        pressureMult: 1.5,  // high pressure
        waveMult:    1.8,   // contributes more to wave attacks
    },
    ash: {
        id:          'ash',
        label:       'Ash Barrens',
        icon:        '💀',
        description: 'Low defense but mobile. Easy to capture but reclaimed quickly.',
        spreadMult:  1.2,
        regenMult:   0.7,   // low regen (easy to take)
        pressureMult: 0.9,
        lowStrength: true,  // starts with lower baseStrength
    },
    obsidian: {
        id:          'obsidian',
        label:       'Obsidian Gate',
        icon:        '⬛',
        description: 'Fortress-heavy chokepoint. Brutal defense, very hard to capture.',
        spreadMult:  0.7,
        regenMult:   1.5,
        pressureMult: 1.2,
        fortressBonus: 20,  // extra base strength
        isChokepoint: true,
    },
};

// ── Tile type configurations ──────────────────────────────────────────────────
const WARBAND_TILE_TYPES = {
    rift: {
        id:             'rift',
        label:          'Rift Node',
        icon:           '🌀',
        color:          { enemy: '#7a1a1a', contested: '#5a3a1a', player: '#1a4a2a', locked: '#1a1a1a', ally_iron: '#1a2a4a', ally_ashen: '#2a1a4a' },
        description:    'A tear in the veil. Generates constant enemy pressure. Stabilizing it cuts off demon spawns.',
        bonusLabel:     '+15% XP from delves per controlled rift',
        pressurePerTick: 3,
        aiRouteValue:   20,  // faction AI bonus value
    },
    stronghold: {
        id:             'stronghold',
        label:          'Stronghold',
        icon:           '⛫',
        color:          { enemy: '#7a2a1a', contested: '#5a2a1a', player: '#1a3a4a', locked: '#1a1a1a', ally_iron: '#1a2a5a', ally_ashen: '#2a1a5a' },
        description:    'A fortified ruin. Holding it grants HP and resists demon assault.',
        bonusLabel:     '+10 max HP per controlled stronghold',
        pressurePerTick: 2,
        aiRouteValue:   15,
    },
    supply: {
        id:             'supply',
        label:          'Supply Zone',
        icon:           '⊕',
        color:          { enemy: '#4a3a1a', contested: '#3a3a1a', player: '#2a4a1a', locked: '#1a1a1a', ally_iron: '#1a2a3a', ally_ashen: '#2a1a3a' },
        description:    'Logistics hub. Controlled supply zones boost gold rewards.',
        bonusLabel:     '+10% quest gold per controlled supply zone',
        pressurePerTick: 1,
        aiRouteValue:   10,
    },
    pathway: {
        id:             'pathway',
        label:          'Pathway',
        icon:           '◈',
        color:          { enemy: '#3a3a4a', contested: '#3a3a5a', player: '#2a3a4a', locked: '#1a1a1a', ally_iron: '#1a2a3a', ally_ashen: '#2a1a3a' },
        description:    'Strategic road through the ruins. Unlocks access to adjacent tiles.',
        bonusLabel:     'Unlocks adjacent tiles',
        pressurePerTick: 1,
        aiRouteValue:   5,
    },
    heart: {
        id:             'heart',
        label:          'Heart of Valdros',
        icon:           '♦',
        color:          { enemy: '#5a1a4a', contested: '#4a2a3a', player: '#1a4a2a', locked: '#1a1a1a', ally_iron: '#1a2a5a', ally_ashen: '#2a1a5a' },
        description:    'The fallen throne of Valdros. Whoever captures this wins the warfront. Demons defend it with everything they have.',
        bonusLabel:     'Victory condition — capture to win',
        pressurePerTick: 5,
        aiRouteValue:   100,
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
            troopStrength:   1.20,
            fortifyCostMod:  0.90,
        },
        supportLabel: 'Troops +20% · Fortify -10% cost',
    },
    ashen_covenant: {
        factionId:   'ashen_covenant',
        name:        'Ashen Covenant',
        icon:        '🔮',
        description: 'Cheaper rift stabilization and magic buffs.',
        effects: {
            stabilizeCostMod: 0.75,
            riftXpBonus:      1.10,
        },
        supportLabel: 'Stabilize -25% cost · Rift XP +10%',
    },
    thornwood_pact: {
        factionId:   'thornwood_pact',
        name:        'Thornwood Pact',
        icon:        '🌲',
        description: 'Faster control spread and ambush bonuses.',
        effects: {
            holdingBonus:  2,
            questInfluenceBonus: 1.15,
        },
        supportLabel: 'Hold gain +2 · Quest influence +15%',
    },
};

function getWarbandFactionSupport(factionId) {
    const map = {
        iron_dominion:  'iron_dominion',
        ashen_covenant: 'ashen_covenant',
        thornwood_pact: 'thornwood_pact',
        dominion: 'iron_dominion',
        covenant: 'ashen_covenant',
        thornwood: 'thornwood_pact',
    };
    const key = map[factionId] || factionId;
    return WARBAND_FACTION_SUPPORT[key] || null;
}

// ── Rift quest definitions ────────────────────────────────────────────────────
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
        controlGain: 15,
    },
    {
        id:          'wq_shadow_patrol',
        name:        'Shadow the Patrol',
        description: 'Slip past demon patrols in the ruins and map their positions.',
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
        description: 'Recover supplies from a corrupted depot before the demons destroy them.',
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
        description: 'Reinforce a contested stronghold against an imminent demon counter-push.',
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
        description: 'Intercept a demon resupply column pushing through the ruins.',
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

function calcQuestInfluence(quest, factionSupportActive) {
    let base = quest.difficulty * 5;
    if (factionSupportActive?.effects?.questInfluenceBonus) {
        base = Math.floor(base * factionSupportActive.effects.questInfluenceBonus);
    }
    return base;
}

// ── Ally AI faction definitions ───────────────────────────────────────────────
// Each ally faction has a doctrine that shapes their AI behavior.
const WARBAND_ALLY_FACTIONS = {
    iron_dominion: {
        id:           'iron_dominion',
        name:         'Iron Dominion',
        shortName:    'I. Dominion',
        icon:         '⚔',
        tileColor:    '#1a2a5a',
        barColor:     '#4a7ec0',
        textColor:    '#7ab0f0',
        description:  'Disciplined military. Slow methodical advances. Excels at holding territory.',
        // Doctrine: Defensive — fortifies, prefers strongholds, low risk tolerance
        doctrine:     'defensive',
        attackPerTick: 22,
        defenseRegen:  6,
        riskThreshold: 65,   // won't attack tiles with demonStrength above this
        preferredTypes: ['stronghold', 'pathway'],
        typeBonus:    { stronghold: 25, pathway: 10 },
    },
    ashen_covenant: {
        id:           'ashen_covenant',
        name:         'Ashen Covenant',
        shortName:    'A. Covenant',
        icon:         '🔮',
        tileColor:    '#2a1a5a',
        barColor:     '#8b4ac0',
        textColor:    '#b47ae0',
        description:  'Arcane strike force. Aggressive expansion, fragile positions. Races for rift nodes.',
        // Doctrine: Expansionist — fast, aggressive, targets rifts
        doctrine:     'expansionist',
        attackPerTick: 30,
        defenseRegen:  3,
        riskThreshold: 85,   // takes bigger risks
        preferredTypes: ['rift', 'supply'],
        typeBonus:    { rift: 30, supply: 15 },
    },
};

// ── Demon phase definitions ───────────────────────────────────────────────────
// Phase is determined dynamically based on demon territory percentage.
const WARBAND_DEMON_PHASES = {
    1: {
        id:          1,
        label:       'Frontier War',
        desc:        'Demons defend territory and probe weaknesses.',
        spreadMult:  0.7,
        pressureMult: 0.8,
        waveIntensity: 1,
        strengthScaleMult: 1.0,
    },
    2: {
        id:          2,
        label:       'Corruption Response',
        desc:        'Demons coordinate, targeting exposed flanks.',
        spreadMult:  1.0,
        pressureMult: 1.1,
        waveIntensity: 1.5,
        strengthScaleMult: 1.15,
    },
    3: {
        id:          3,
        label:       'Endgame Eruption',
        desc:        'Demons erupt in desperate fury near the center.',
        spreadMult:  1.3,
        pressureMult: 1.4,
        waveIntensity: 2.2,
        strengthScaleMult: 1.35,
    },
};

// ── Enemy faction display definition ─────────────────────────────────────────
const WARBAND_ENEMY_FACTION = {
    id:   'void_horde',
    name: 'Void Horde',
    icon: '☠',
    barColor: '#c04040',
    textColor: '#e07070',
};

// ── Strategic orders ──────────────────────────────────────────────────────────
const WARBAND_STRATEGIC_ORDERS = [
    {
        id:           'aggressive_push',
        name:         'Aggressive Push',
        icon:         '⚡',
        description:  'All forces surge forward. Hold gains ×2, allies push hard — but enemy pressure increases.',
        durationTurns: 3,
        cooldownTurns: 6,
        cost:          20,
        effects: { allyAttackMult: 1.5, playerHoldMult: 2.0, enemyPressureMult: 1.2 },
    },
    {
        id:           'hold_the_line',
        name:         'Hold the Line',
        icon:         '🛡',
        description:  'Fortifications doubled, demon pressure halved. Allies stop advancing but hold firm.',
        durationTurns: 3,
        cooldownTurns: 4,
        cost:          0,
        effects: { fortMult: 2.0, allyAttackMult: 0.2, allyDefMult: 2.0, enemyPressureMult: 0.5 },
    },
    {
        id:           'rally_allies',
        name:         'Rally Allies',
        icon:         '📯',
        description:  'Boost both allied factions for 2 turns. They push and hold harder.',
        durationTurns: 2,
        cooldownTurns: 5,
        cost:          30,
        effects: { allyAttackMult: 2.0, allyDefMult: 1.5 },
    },
    {
        id:           'focused_assault',
        name:         'Focused Assault',
        icon:         '🎯',
        description:  'Concentrate all allied forces on the selected tile. Massive pressure applied.',
        durationTurns: 2,
        cooldownTurns: 6,
        cost:          25,
        effects: { allyFocusMult: 3.0 },
        requiresTarget: true,
    },
];

// ── Tactical abilities ────────────────────────────────────────────────────────
const WARBAND_TACTICAL_ABILITIES = [
    {
        id:           'bombardment',
        name:         'Fire Bombardment',
        icon:         '🔥',
        description:  'Bombard a demon tile — deals −35 control and weakens demon strength.',
        cooldownTurns: 2,
        cost:          20,
        targetState:  'enemy',
        effect:       { controlDmg: 35, demonStrengthDmg: 20 },
    },
    {
        id:           'reinforcements',
        name:         'Reinforcements',
        icon:         '⚔',
        description:  'Rush troops to any tile — +25 control, +1 troop stack.',
        cooldownTurns: 3,
        cost:          15,
        targetState:  'any',
        effect:       { controlGain: 25, addTroop: true },
    },
    {
        id:           'cleanse',
        name:         'Corruption Cleanse',
        icon:         '✦',
        description:  'Purge a rift tile — −20 control, may auto-stabilize.',
        cooldownTurns: 2,
        cost:          25,
        targetState:  'enemy',
        effect:       { controlDmg: 20, demonStrengthDmg: 15, stabilizeRift: true },
    },
    {
        id:           'iron_shields',
        name:         'Iron Shields',
        icon:         '🛡',
        description:  'All player tiles gain +2 effective fort for 3 turns.',
        cooldownTurns: 3,
        cost:          30,
        targetState:  null,
        effect:       { globalFortBoost: 2, durationTurns: 3 },
    },
];

function getStrategicOrder(id)   { return WARBAND_STRATEGIC_ORDERS.find(o => o.id === id)    ?? null; }
function getTacticalAbility(id)  { return WARBAND_TACTICAL_ABILITIES.find(a => a.id === id)  ?? null; }
function getAllyFaction(id)       { return WARBAND_ALLY_FACTIONS[id] ?? null; }
function getDemonZone(id)        { return WARBAND_DEMON_ZONES[id]    ?? null; }
function getTierDef(id)          { return WARBAND_TIERS[id]          ?? WARBAND_TIERS.outer; }

// ── Map modifiers ─────────────────────────────────────────────────────────────
// One modifier is selected per campaign run via seeded RNG, applied at map generation.
// Modifiers give each run a distinct strategic flavor.
const WARBAND_MAP_MODIFIERS = {
    corruption_surge: {
        id:          'corruption_surge',
        name:        'Corruption Surge',
        icon:        '💀',
        description: 'Demon forces start 15% stronger. The corruption runs deep.',
        effect:      { demonStrengthMult: 1.15 },
    },
    supply_rich: {
        id:          'supply_rich',
        name:        'Supply Rich',
        icon:        '⊕',
        description: 'Additional supply caches dot the mid ring. Contest them for extra influence.',
        effect:      { extraSupplyTiles: 3 },
    },
    collapsed_routes: {
        id:          'collapsed_routes',
        name:        'Collapsed Routes',
        icon:        '◈',
        description: 'Several pathways have caved in. More chokepoints. Harder to push through.',
        effect:      { extraChokepoints: 4, chokepointStrengthBonus: 10 },
    },
    fortified_world: {
        id:          'fortified_world',
        name:        'Fortified World',
        icon:        '⛫',
        description: 'Allied territories begin fortified. Demon strongpoints are brutally defended.',
        effect:      { allyStartFort: 1, spStrengthBonus: 20 },
    },
};

function getMapModifier(id) { return WARBAND_MAP_MODIFIERS[id] ?? null; }
