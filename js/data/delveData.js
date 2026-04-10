// js/data/delveData.js
// Static data for the Rift Delve system.

// ── Delve types ───────────────────────────────────────────────────────────────

const DELVE_TYPES = {
    shattered_rift: {
        id:          'shattered_rift',
        name:        'Shattered Rift',
        subtitle:    'A fractured scar in the veil. Weak demons pour through.',
        tier:        1,
        minLevel:    5,
        depthLabel:  'Rift Depth',
        nodeCount:   7,
        dangerRating: 2,
        rewardRating: 2,
        bossId:      'rift_wanderer',
        enemyPool:   ['rift_hound', 'veil_wraith', 'shard_imp'],
        elitePool:   ['rift_sentinel'],
        lootTier:    2,
        description: 'Manageable danger. Good source of rift essence and basic reagents.',
        theme:       'rift',
    },
    voidstone_caverns: {
        id:          'voidstone_caverns',
        name:        'Voidstone Caverns',
        subtitle:    'Deep mineral veins cracked open to the void.',
        tier:        2,
        minLevel:    15,
        depthLabel:  'Cavern Depth',
        nodeCount:   8,
        dangerRating: 4,
        rewardRating: 4,
        bossId:      'void_stalker',
        enemyPool:   ['corrupted_knight', 'void_crawler', 'echo_shade'],
        elitePool:   ['voidbound_executioner'],
        lootTier:    3,
        description: 'Significant threat. Rewards include rare reagents and mid-tier gear.',
        theme:       'void',
    },
    ashen_depths: {
        id:          'ashen_depths',
        name:        'Ashen Depths',
        subtitle:    'A collapsed sanctum drowning in demon-fire and ruin.',
        tier:        3,
        minLevel:    25,
        depthLabel:  'Sanctum Floor',
        nodeCount:   9,
        dangerRating: 7,
        rewardRating: 7,
        bossId:      'hollow_seer',
        enemyPool:   ['ashbound_horror', 'fleshwarped_sentinel', 'lost_cultist'],
        elitePool:   ['ashen_champion'],
        lootTier:    5,
        description: 'Lethal without preparation. Drops rare relics and high-tier gear.',
        theme:       'ashen',
    },
};

// ── Enemy definitions ─────────────────────────────────────────────────────────

const DELVE_ENEMIES = {
    rift_hound:             { name: 'Rift Hound',             tier: 1, health: 60,  attack: 10, defense: 2,  xp: 30  },
    veil_wraith:            { name: 'Veil Wraith',            tier: 1, health: 45,  attack: 14, defense: 1,  xp: 35  },
    shard_imp:              { name: 'Shard Imp',              tier: 1, health: 35,  attack: 8,  defense: 3,  xp: 25  },
    rift_sentinel:          { name: 'Rift Sentinel',          tier: 1, health: 90,  attack: 16, defense: 6,  xp: 80,  isElite: true },
    corrupted_knight:       { name: 'Corrupted Knight',       tier: 2, health: 110, attack: 22, defense: 10, xp: 70  },
    void_crawler:           { name: 'Void Crawler',           tier: 2, health: 80,  attack: 26, defense: 5,  xp: 60  },
    echo_shade:             { name: 'Echo Shade',             tier: 2, health: 70,  attack: 30, defense: 3,  xp: 65  },
    voidbound_executioner:  { name: 'Voidbound Executioner',  tier: 2, health: 150, attack: 32, defense: 12, xp: 160, isElite: true },
    ashbound_horror:        { name: 'Ashbound Horror',        tier: 3, health: 160, attack: 38, defense: 14, xp: 120 },
    fleshwarped_sentinel:   { name: 'Fleshwarped Sentinel',   tier: 3, health: 140, attack: 42, defense: 18, xp: 130 },
    lost_cultist:           { name: 'Lost Cultist',           tier: 3, health: 100, attack: 46, defense: 8,  xp: 100 },
    ashen_champion:         { name: 'Ashen Champion',         tier: 3, health: 220, attack: 48, defense: 20, xp: 260, isElite: true },
};

// ── Boss definitions ──────────────────────────────────────────────────────────

const DELVE_BOSSES = {
    rift_wanderer: {
        id:       'rift_wanderer',
        name:     'Rift Wanderer',
        tier:     1,
        health:   180,
        attack:   22,
        defense:  8,
        xp:       300,
        intro:    'A towering shape bleeds through the rift — all angles and hunger.',
        beats: [
            'The Wanderer opens with a sweeping pulse of rift energy.',
            'Its form shifts; your strikes pass through shadow.',
            'A lucky blow finds the core — it staggers.',
            'The creature lets out a silence that shakes the stone.',
            'You drive the killing blow into its dissolving mass.',
        ],
        loot: ['rift_core_shard', 'veil_dust'],
    },
    void_stalker: {
        id:       'void_stalker',
        name:     'Void Stalker',
        tier:     2,
        health:   320,
        attack:   38,
        defense:  15,
        xp:       600,
        intro:    'From the deep dark, eight eyes open. The Void Stalker has found you.',
        beats: [
            'The Stalker moves faster than shadow.',
            'Its claws rake deep — the pain is real.',
            'You bait it into a narrow passage and hold your ground.',
            'A critical strike buckles one of its legs.',
            'The creature screams in a frequency that shakes your bones.',
            'You press every advantage until it goes still.',
        ],
        loot: ['void_essence', 'obsidian_claw', 'rift_shard'],
    },
    hollow_seer: {
        id:       'hollow_seer',
        name:     'The Hollow Seer',
        tier:     3,
        health:   520,
        attack:   56,
        defense:  22,
        xp:       1100,
        intro:    'A robed figure stands at the sanctum\'s heart — it has no face, only light where eyes should be.',
        beats: [
            'The Seer speaks and the words are blades.',
            'It summons Ashen Echoes to flank you.',
            'You cut through the echoes and charge the Seer directly.',
            'Reality peels back — you fight through it.',
            'The Seer\'s form flickers. You see the wound beneath the void.',
            'One final strike. The light in its face goes out.',
            'The sanctum shudders as the Seer dissolves.',
        ],
        loot: ['faded_sigil_wax', 'emberglass_fragment', 'hollow_relic'],
    },
};

// ── Events ────────────────────────────────────────────────────────────────────

const DELVE_EVENTS = {
    // Minor events (generally beneficial or neutral)
    whispering_shrine: {
        id:          'whispering_shrine',
        name:        'Whispering Shrine',
        type:        'minor',
        description: 'A cracked altar pulses with faint restorative energy.',
        skillCheck:  'restoration',
        threshold:   300,
        successLog:  [
            'You place your hands on the altar.',
            'Warmth surges through — wounds knit, reserves fill.',
            'You leave the shrine restored.',
        ],
        failureLog:  [
            'The altar hums but you cannot channel it.',
            'You move on, unchanged.',
        ],
        successEffect: { type: 'heal', amount: 0.25 },
        failureEffect: null,
    },
    collapsed_corridor: {
        id:          'collapsed_corridor',
        name:        'Collapsed Corridor',
        type:        'minor',
        description: 'The passage ahead has partially caved in.',
        skillCheck:  'defense',
        threshold:   400,
        successLog:  [
            'You shoulder through the debris with practiced effort.',
            'The stone groans but holds long enough.',
        ],
        failureLog:  [
            'A chunk of stone clips your shoulder as you force through.',
            'You emerge dusty and bruised on the other side.',
        ],
        successEffect: null,
        failureEffect: { type: 'damage', amount: 0.08 },
    },
    rift_fissure: {
        id:          'rift_fissure',
        name:        'Rift Fissure',
        type:        'minor',
        description: 'A thin tear in reality hums with raw arcane energy.',
        skillCheck:  'magic',
        threshold:   400,
        successLog:  [
            'You reach into the fissure and draw out a thread of power.',
            'Rift essence crystallises in your palm.',
            'A rare find — this will be useful.',
        ],
        failureLog:  [
            'The fissure crackles. You cannot safely reach in.',
            'You mark the location and move on.',
        ],
        successEffect: { type: 'material', id: 'rift_shard', amount: 2 },
        failureEffect: null,
    },
    echo_hall: {
        id:          'echo_hall',
        name:        'Echo Hall',
        type:        'minor',
        description: 'Your footsteps return from walls that should not reflect sound.',
        skillCheck:  'stealth',
        threshold:   300,
        successLog:  [
            'You recognise the pattern — a concealment echo.',
            'You use it to move unseen past a distant patrol.',
        ],
        failureLog:  [
            'The echoes disorient you.',
            'You lose several minutes reorienting.',
        ],
        successEffect: { type: 'skipNextCombat' },
        failureEffect: { type: 'stamina', amount: -0.15 },
    },

    // Hazard events
    arcane_surge: {
        id:          'arcane_surge',
        name:        'Arcane Surge',
        type:        'hazard',
        description: 'A wave of rift energy detonates through the corridor.',
        skillCheck:  'magic',
        threshold:   500,
        successLog:  [
            'You feel the surge building and brace your will against it.',
            'The energy washes over you — you absorb rather than resist.',
            'Your reserves spike with channelled power.',
        ],
        failureLog:  [
            'The surge hits without warning.',
            'Raw rift energy tears through your defences.',
            'You recover, but the damage stings.',
        ],
        successEffect: { type: 'mana', amount: 0.30 },
        failureEffect: { type: 'damage', amount: 0.18 },
    },
    toxic_mist: {
        id:          'toxic_mist',
        name:        'Toxic Mist',
        type:        'hazard',
        description: 'A bilious green mist fills the passage ahead.',
        skillCheck:  'endurance',
        threshold:   400,
        successLog:  [
            'You hold your breath and move quickly.',
            'Your eyes water but you reach clean air before the worst of it hits.',
        ],
        failureLog:  [
            'The mist finds every gap in your armour.',
            'You emerge coughing and weakened.',
        ],
        successEffect: null,
        failureEffect: { type: 'damage', amount: 0.14 },
    },
    blood_sigil_trap: {
        id:          'blood_sigil_trap',
        name:        'Blood Sigil',
        type:        'hazard',
        description: 'A glowing rune carved into the floor — a demon trap.',
        skillCheck:  'magic',
        threshold:   600,
        successLog:  [
            'You recognise the sigil configuration.',
            'A precise counter-inscription unravels it harmlessly.',
            'Dark power dissipates into the stone.',
        ],
        failureLog:  [
            'The trap detonates as your boot crosses the threshold.',
            'Pain and black smoke. Something inside you feels wrong.',
            'You shake it off and press on.',
        ],
        successEffect: null,
        failureEffect: { type: 'damageAndCorruption', damage: 0.20, corruption: 5 },
    },
    gravity_distortion: {
        id:          'gravity_distortion',
        name:        'Gravity Distortion',
        type:        'hazard',
        description: 'The air warps. Your feet leave the floor without warning.',
        skillCheck:  'melee',
        threshold:   400,
        successLog:  [
            'Combat instincts take over. You redirect the pull and find footing in mid-air.',
            'You land clean and keep moving.',
        ],
        failureLog:  [
            'You are thrown into a wall before gravity snaps back.',
            'Bruised and disoriented, you take a moment to collect yourself.',
        ],
        successEffect: null,
        failureEffect: { type: 'stamina', amount: -0.25 },
    },
};

// ── Loot tables ───────────────────────────────────────────────────────────────
// Keys map to craftingMaterials ids.

const DELVE_MATERIAL_DROPS = {
    1: [
        { id: 'iron_ore',     weight: 30, amount: [2, 4] },
        { id: 'leather',      weight: 25, amount: [2, 3] },
        { id: 'veil_dust',    weight: 20, amount: [1, 2] },
        { id: 'rift_shard',   weight: 15, amount: [1, 2] },
        { id: 'charcoal',     weight: 10, amount: [1, 3] },
    ],
    2: [
        { id: 'refined_steel',   weight: 25, amount: [1, 3] },
        { id: 'rift_shard',      weight: 25, amount: [2, 4] },
        { id: 'veil_dust',       weight: 20, amount: [2, 3] },
        { id: 'shadow_silk',     weight: 15, amount: [1, 2] },
        { id: 'mana_crystal',    weight: 15, amount: [1, 2] },
    ],
    3: [
        { id: 'emberglass_fragment', weight: 30, amount: [1, 2] },
        { id: 'faded_sigil_wax',     weight: 25, amount: [1, 2] },
        { id: 'void_essence',        weight: 25, amount: [1, 3] },
        { id: 'rift_shard',          weight: 20, amount: [3, 5] },
    ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDelveType(id)  { return DELVE_TYPES[id]   || null; }
function getDelveEnemy(id) { return DELVE_ENEMIES[id]  || null; }
function getDelveBoss(id)  { return DELVE_BOSSES[id]   || null; }
function getDelveEvent(id) { return DELVE_EVENTS[id]   || null; }

function pickDelveEvent(type) {
    const pool = Object.values(DELVE_EVENTS).filter(e => e.type === type);
    return pool[Math.floor(Math.random() * pool.length)] || null;
}

function pickDelveMaterial(tier) {
    const table = DELVE_MATERIAL_DROPS[Math.max(1, Math.min(3, tier))] || DELVE_MATERIAL_DROPS[1];
    const total = table.reduce((s, e) => s + e.weight, 0);
    let roll = Math.random() * total;
    for (const entry of table) {
        roll -= entry.weight;
        if (roll <= 0) {
            const [min, max] = entry.amount;
            return { id: entry.id, amount: min + Math.floor(Math.random() * (max - min + 1)) };
        }
    }
    return table[0];
}
