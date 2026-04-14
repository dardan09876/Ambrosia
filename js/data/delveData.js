// js/data/delveData.js
// Static data for the Rift Delve grid system.
// Enemy stats are tuned for interactive turn-based combat at each tier's minLevel.
// Player attack ≈ 20-45 / defense ≈ 10-28 / HP ≈ 100-160 at tier 1 entry.

// ── Delve types ───────────────────────────────────────────────────────────────

const DELVE_TYPES = {
    shattered_rift: {
        id:           'shattered_rift',
        name:         'Shattered Rift',
        subtitle:     'A fractured scar in the veil. Weak demons pour through.',
        tier:         1,
        minLevel:     5,
        dangerRating: 2,
        rewardRating: 2,
        bossId:       'rift_wanderer',
        enemyPool:    ['rift_hound', 'veil_wraith', 'shard_imp'],
        elitePool:    ['rift_sentinel'],
        lootTier:     2,
        riftShardBonus: 1,
        description:  'Manageable danger. Good source of rift shards and basic reagents.',
        theme:        'rift',
    },
    voidstone_caverns: {
        id:           'voidstone_caverns',
        name:         'Voidstone Caverns',
        subtitle:     'Deep mineral veins cracked open to the void.',
        tier:         2,
        minLevel:     15,
        dangerRating: 4,
        rewardRating: 4,
        bossId:       'void_stalker',
        enemyPool:    ['corrupted_knight', 'void_crawler', 'echo_shade'],
        elitePool:    ['voidbound_executioner'],
        lootTier:     3,
        riftShardBonus: 2,
        description:  'Significant threat. Rewards include rare reagents and mid-tier gear.',
        theme:        'void',
    },
    ashen_depths: {
        id:           'ashen_depths',
        name:         'Ashen Depths',
        subtitle:     'A collapsed sanctum drowning in demon-fire and ruin.',
        tier:         3,
        minLevel:     25,
        dangerRating: 7,
        rewardRating: 7,
        bossId:       'hollow_seer',
        enemyPool:    ['ashbound_horror', 'fleshwarped_sentinel', 'lost_cultist'],
        elitePool:    ['ashen_champion'],
        lootTier:     5,
        riftShardBonus: 4,
        description:  'Lethal without preparation. Drops rare relics and high-tier gear.',
        theme:        'ashen',
    },
};

// ── Enemy definitions ─────────────────────────────────────────────────────────
// Roles: bruiser | tank | skirmisher | corruptor | leech
//   bruiser    — high attack, low defense (role stats applied by engine)
//   tank       — high health/defense, lower attack
//   skirmisher — retreat chance reduced by 0.2
//   corruptor  — each hit applies +3 corruption to the player
//   leech      — heals 30% of damage it deals

const DELVE_ENEMIES = {
    // ── Tier 1 ────────────────────────────────────────────────────────────────
    rift_hound: {
        id: 'rift_hound', name: 'Rift Hound',
        tier: 1, level: 1, role: 'skirmisher',
        health: 130, attack: 18, defense: 7, xp: 40,
        flavor: 'A pack predator that has slipped through a rift tear, slick with ichor.',
    },
    veil_wraith: {
        id: 'veil_wraith', name: 'Veil Wraith',
        tier: 1, level: 1, role: 'corruptor',
        health: 100, attack: 22, defense: 5, xp: 50,
        flavor: 'Spectral. Each blow it lands leaves a taint in the air around you.',
    },
    shard_imp: {
        id: 'shard_imp', name: 'Shard Imp',
        tier: 1, level: 1, role: 'bruiser',
        health: 90, attack: 26, defense: 4, xp: 45,
        flavor: 'Small, frantic, and hits harder than its size suggests.',
    },
    rift_sentinel: {
        id: 'rift_sentinel', name: 'Rift Sentinel',
        tier: 1, level: 2, role: 'tank', isElite: true,
        health: 280, attack: 25, defense: 15, xp: 110,
        flavor: 'An elite guardian that refuses to yield ground.',
    },

    // ── Tier 2 ────────────────────────────────────────────────────────────────
    corrupted_knight: {
        id: 'corrupted_knight', name: 'Corrupted Knight',
        tier: 2, level: 3, role: 'bruiser',
        health: 230, attack: 30, defense: 12, xp: 90,
        flavor: 'A warrior whose mind and flesh have both been claimed by the void.',
    },
    void_crawler: {
        id: 'void_crawler', name: 'Void Crawler',
        tier: 2, level: 3, role: 'skirmisher',
        health: 195, attack: 34, defense: 8, xp: 80,
        flavor: 'Multi-limbed, fast, and relentlessly aggressive.',
    },
    echo_shade: {
        id: 'echo_shade', name: 'Echo Shade',
        tier: 2, level: 3, role: 'corruptor',
        health: 180, attack: 36, defense: 7, xp: 85,
        flavor: 'It whispers your own failures back at you as it strikes.',
    },
    voidbound_executioner: {
        id: 'voidbound_executioner', name: 'Voidbound Executioner',
        tier: 2, level: 4, role: 'tank', isElite: true,
        health: 470, attack: 42, defense: 24, xp: 220,
        flavor: 'Massive. Every blow from it is deliberate and punishing.',
    },

    // ── Tier 3 ────────────────────────────────────────────────────────────────
    ashbound_horror: {
        id: 'ashbound_horror', name: 'Ashbound Horror',
        tier: 3, level: 6, role: 'leech',
        health: 440, attack: 46, defense: 18, xp: 160,
        flavor: 'It heals from the wounds it inflicts. Kill it fast or it will outlast you.',
    },
    fleshwarped_sentinel: {
        id: 'fleshwarped_sentinel', name: 'Fleshwarped Sentinel',
        tier: 3, level: 6, role: 'tank',
        health: 540, attack: 42, defense: 28, xp: 175,
        flavor: 'Its body has been rebuilt by rift energy into something almost indestructible.',
    },
    lost_cultist: {
        id: 'lost_cultist', name: 'Lost Cultist',
        tier: 3, level: 6, role: 'corruptor',
        health: 370, attack: 54, defense: 14, xp: 140,
        flavor: 'A mage-worshipper who went too deep. Now they carry the void inside them.',
    },
    ashen_champion: {
        id: 'ashen_champion', name: 'Ashen Champion',
        tier: 3, level: 7, role: 'bruiser', isElite: true,
        health: 920, attack: 66, defense: 34, xp: 360,
        flavor: 'The strongest thing left in the sanctum. It has not been weakened by age.',
    },
};

// ── Boss definitions ──────────────────────────────────────────────────────────
// Bosses don't have roles — they fight as fixed, powerful encounters.

const DELVE_BOSSES = {
    rift_wanderer: {
        id:      'rift_wanderer',
        name:    'Rift Wanderer',
        tier:    1,
        level:   3,
        health:  500,
        attack:  36,
        defense: 16,
        xp:      400,
        intro:   'A towering shape bleeds through the rift — all angles and hunger.',
        hitLines: [
            'The Wanderer opens with a pulse of rift energy.',
            'Its form shifts; your strikes pass through shadow.',
            'A lucky blow finds the core — it staggers.',
            'The creature\'s silence shakes the stone.',
        ],
        bossLoot: ['rift_core_shard', 'veil_dust'],
        riftShards: 4,
    },
    void_stalker: {
        id:      'void_stalker',
        name:    'Void Stalker',
        tier:    2,
        level:   5,
        health:  880,
        attack:  60,
        defense: 28,
        xp:      800,
        intro:   'From the deep dark, eight eyes open. The Void Stalker has found you.',
        hitLines: [
            'The Stalker moves faster than shadow.',
            'Its claws rake deep — the pain is real.',
            'You bait it into a narrow passage and hold.',
            'A critical strike buckles one of its legs.',
        ],
        bossLoot: ['void_essence', 'obsidian_claw', 'rift_shard'],
        riftShards: 8,
    },
    hollow_seer: {
        id:      'hollow_seer',
        name:    'The Hollow Seer',
        tier:    3,
        level:   8,
        health:  1700,
        attack:  92,
        defense: 44,
        xp:      1500,
        intro:   'A robed figure at the sanctum\'s heart — it has no face, only light where eyes should be.',
        hitLines: [
            'The Seer speaks and the words are blades.',
            'It summons Ashen Echoes to flank you.',
            'You cut through the echoes and charge directly.',
            'Reality peels back — you fight through it.',
            'The Seer\'s form flickers. You see the wound beneath the void.',
        ],
        bossLoot: ['faded_sigil_wax', 'emberglass_fragment', 'hollow_relic'],
        riftShards: 16,
    },
};

// ── Tile events (triggered on 'event' tiles) ──────────────────────────────────
// Resolved against player skill checks.

const DELVE_TILE_EVENTS = [
    {
        id:       'whispering_shrine',
        name:     'Whispering Shrine',
        icon:     '✦',
        desc:     'A cracked altar pulses with faint restorative energy.',
        check:    { skill: 'restoration', threshold: 200 },
        onSuccess: { type: 'heal',    amount: 0.20, log: 'The altar knits your wounds. You feel restored.' },
        onFail:    { type: 'none',                  log: 'You cannot channel the altar. You move on.' },
    },
    {
        id:       'rift_fissure',
        name:     'Rift Fissure',
        icon:     '◈',
        desc:     'A thin tear in reality hums with raw arcane energy.',
        check:    { skill: 'magic', threshold: 250 },
        onSuccess: { type: 'shards', amount: 2, log: 'You reach into the fissure and draw out rift shards.' },
        onFail:    { type: 'damage', amount: 0.08, log: 'The fissure crackles and scorches you as you pass.' },
    },
    {
        id:       'echo_hall',
        name:     'Echo Hall',
        icon:     '?',
        desc:     'Your footsteps return from walls that shouldn\'t reflect sound.',
        check:    { skill: 'stealth', threshold: 200 },
        onSuccess: { type: 'gold',   amount: 30, log: 'You exploit the disorienting echoes and find a hidden alcove.' },
        onFail:    { type: 'corruption', amount: 3, log: 'The echoes disorient you. The rift takes hold a little more.' },
    },
    {
        id:       'collapsed_passage',
        name:     'Collapsed Passage',
        icon:     '⚠',
        desc:     'A partially caved-in corridor blocks the way.',
        check:    { skill: 'defense', threshold: 150 },
        onSuccess: { type: 'none',              log: 'You shoulder through the debris. Nothing slows you.' },
        onFail:    { type: 'damage', amount: 0.10, log: 'A chunk of stone clips you hard as you force through.' },
    },
    {
        id:       'blood_sigil',
        name:     'Blood Sigil',
        icon:     '⚠',
        desc:     'A glowing rune carved into the floor — a demon trap.',
        check:    { skill: 'magic', threshold: 350 },
        onSuccess: { type: 'none',                    log: 'You recognise the sigil and unravel it harmlessly.' },
        onFail:    { type: 'damageAndCorruption', damage: 0.15, corruption: 4,
                    log: 'The trap detonates. Pain and black smoke. Something inside you feels wrong.' },
    },
    {
        id:       'buried_cache',
        name:     'Buried Cache',
        icon:     '◈',
        desc:     'Rubble conceals what might be salvage from an earlier expedition.',
        check:    { skill: 'melee', threshold: 150 },
        onSuccess: { type: 'gold', amount: 40, log: 'You pry open the buried chest. Someone left valuables behind.' },
        onFail:    { type: 'none',              log: 'The rubble shifts but reveals nothing useful.' },
    },
];

// ── Hazard definitions ────────────────────────────────────────────────────────

const DELVE_HAZARDS = [
    {
        id:   'arcane_surge',
        name: 'Arcane Surge',
        icon: '⚡',
        desc: 'A wave of rift energy detonates through the corridor.',
        damage: 0.12,
        corruption: 2,
        log: 'Rift energy tears through your defences before you can react.',
    },
    {
        id:   'toxic_mist',
        name: 'Toxic Mist',
        icon: '☁',
        desc: 'A bilious green mist fills the passage.',
        damage: 0.10,
        corruption: 1,
        log: 'The mist finds every gap in your armour. You emerge weakened.',
    },
    {
        id:   'gravity_distortion',
        name: 'Gravity Distortion',
        icon: '⚠',
        desc: 'The air warps. Your feet leave the floor without warning.',
        damage: 0.08,
        corruption: 0,
        log: 'You are thrown into a wall before gravity snaps back. Painful.',
    },
    {
        id:   'void_pulse',
        name: 'Void Pulse',
        icon: '◉',
        desc: 'A sphere of void energy expands from a cracked node.',
        damage: 0.06,
        corruption: 4,
        log: 'The pulse passes through you. The corruption in your veins spikes.',
    },
];

// ── Loot tables ───────────────────────────────────────────────────────────────

const DELVE_MATERIAL_DROPS = {
    1: [
        { id: 'iron_ore',   weight: 30, amount: [2, 4] },
        { id: 'leather',    weight: 25, amount: [2, 3] },
        { id: 'veil_dust',  weight: 20, amount: [1, 2] },
        { id: 'rift_shard', weight: 15, amount: [1, 2] },
        { id: 'charcoal',   weight: 10, amount: [1, 3] },
    ],
    2: [
        { id: 'refined_steel', weight: 25, amount: [1, 3] },
        { id: 'rift_shard',    weight: 25, amount: [2, 4] },
        { id: 'veil_dust',     weight: 20, amount: [2, 3] },
        { id: 'shadow_silk',   weight: 15, amount: [1, 2] },
        { id: 'mana_crystal',  weight: 15, amount: [1, 2] },
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

function pickDelveTileEvent() {
    return DELVE_TILE_EVENTS[Math.floor(Math.random() * DELVE_TILE_EVENTS.length)];
}

function pickDelveHazard() {
    return DELVE_HAZARDS[Math.floor(Math.random() * DELVE_HAZARDS.length)];
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
    return { id: table[0].id, amount: table[0].amount[0] };
}
