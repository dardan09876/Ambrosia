// js/data/abilities.js
// 18 passive abilities — 3 per combat skill, unlocked at Apprentice / Journeyman / Expert thresholds.
//
// Effect types:
//   { type: 'stat_bonus',      stat: 'health', value: 20  }  → flat addition to stat baseMax
//   { type: 'quest_bonus',     skill: 'melee', value: 5   }  → +5pp to that skill's quest success
//   { type: 'quest_bonus_all',                 value: 3   }  → +3pp to ALL quest success
//   { type: 'food_efficiency',                 value: 0.25}  → 25% slower food drain

const ABILITIES = [

    // ── Melee ────────────────────────────────────────────────────────────────────
    {
        id: 'hardened_stance',
        name: 'Hardened Stance',
        category: 'melee',
        skillReq: { skill: 'melee', level: 100 },
        goldCost: 50,
        description: 'Seasons at the training post have toughened your body beyond ordinary limits.',
        effect: { type: 'stat_bonus', stat: 'stamina', value: 10 },
        effectLabel: '+10 Stamina max',
    },
    {
        id: 'power_strike',
        name: 'Power Strike',
        category: 'melee',
        skillReq: { skill: 'melee', level: 500 },
        goldCost: 150,
        description: 'You know exactly where to land blows that matter. Precision over force.',
        effect: { type: 'quest_bonus', skill: 'melee', value: 5 },
        effectLabel: '+5% Melee quest success',
    },
    {
        id: 'warriors_resolve',
        name: "Warrior's Resolve",
        category: 'melee',
        skillReq: { skill: 'melee', level: 2000 },
        goldCost: 500,
        description: 'Nothing short of death will stop you. Your body has learned to keep moving.',
        effect: { type: 'stat_bonus', stat: 'health', value: 20 },
        effectLabel: '+20 Health max',
    },

    // ── Ranged ───────────────────────────────────────────────────────────────────
    {
        id: 'eagle_eye',
        name: 'Eagle Eye',
        category: 'ranged',
        skillReq: { skill: 'ranged', level: 100 },
        goldCost: 50,
        description: 'You spot vulnerabilities others miss. Distance becomes an advantage.',
        effect: { type: 'quest_bonus', skill: 'ranged', value: 5 },
        effectLabel: '+5% Ranged quest success',
    },
    {
        id: 'steady_draw',
        name: 'Steady Draw',
        category: 'ranged',
        skillReq: { skill: 'ranged', level: 500 },
        goldCost: 150,
        description: 'Your lungs slow before each release. Calm has become second nature.',
        effect: { type: 'stat_bonus', stat: 'energy', value: 15 },
        effectLabel: '+15 Energy max',
    },
    {
        id: 'hunters_instinct',
        name: "Hunter's Instinct",
        category: 'ranged',
        skillReq: { skill: 'ranged', level: 2000 },
        goldCost: 500,
        description: 'You read terrain, prey, and circumstance with unnatural ease. Nothing surprises you.',
        effect: { type: 'quest_bonus_all', value: 3 },
        effectLabel: '+3% all quest success',
    },

    // ── Magic ────────────────────────────────────────────────────────────────────
    {
        id: 'arcane_reserves',
        name: 'Arcane Reserves',
        category: 'magic',
        skillReq: { skill: 'magic', level: 100 },
        goldCost: 50,
        description: 'Your arcane channels have deepened. The well runs further than before.',
        effect: { type: 'stat_bonus', stat: 'mana', value: 15 },
        effectLabel: '+15 Mana max',
    },
    {
        id: 'spell_focus',
        name: 'Spell Focus',
        category: 'magic',
        skillReq: { skill: 'magic', level: 500 },
        goldCost: 150,
        description: 'You channel arcane energy with surgical precision. Less is wasted, more is done.',
        effect: { type: 'quest_bonus', skill: 'magic', value: 5 },
        effectLabel: '+5% Magic quest success',
    },
    {
        id: 'rift_attuned',
        name: 'Rift Attuned',
        category: 'magic',
        skillReq: { skill: 'magic', level: 2000 },
        goldCost: 500,
        description: 'Time near the rifts has permanently altered your senses. Reality bends to your will.',
        effect: { type: 'quest_bonus_all', value: 4 },
        effectLabel: '+4% all quest success',
    },

    // ── Restoration ──────────────────────────────────────────────────────────────
    {
        id: 'mending_aura',
        name: 'Mending Aura',
        category: 'restoration',
        skillReq: { skill: 'restoration', level: 100 },
        goldCost: 50,
        description: 'A faint warmth follows in your wake, knitting minor wounds without thought.',
        effect: { type: 'stat_bonus', stat: 'health', value: 15 },
        effectLabel: '+15 Health max',
    },
    {
        id: 'sustaining_light',
        name: 'Sustaining Light',
        category: 'restoration',
        skillReq: { skill: 'restoration', level: 500 },
        goldCost: 150,
        description: 'Your body metabolises food with unnatural efficiency. You need less to stay whole.',
        effect: { type: 'food_efficiency', value: 0.25 },
        effectLabel: '−25% food drain rate',
    },
    {
        id: 'lifebond',
        name: 'Lifebond',
        category: 'restoration',
        skillReq: { skill: 'restoration', level: 2000 },
        goldCost: 500,
        description: "You have forged a bond with Alaia's living core. The moon sustains you.",
        effect: { type: 'stat_bonus', stat: 'health', value: 30 },
        effectLabel: '+30 Health max',
    },

    // ── Defense ──────────────────────────────────────────────────────────────────
    {
        id: 'iron_will',
        name: 'Iron Will',
        category: 'defense',
        skillReq: { skill: 'defense', level: 100 },
        goldCost: 50,
        description: 'You endure what would break others. Pain has become a familiar companion.',
        effect: { type: 'stat_bonus', stat: 'stamina', value: 15 },
        effectLabel: '+15 Stamina max',
    },
    {
        id: 'shield_mastery',
        name: 'Shield Mastery',
        category: 'defense',
        skillReq: { skill: 'defense', level: 500 },
        goldCost: 150,
        description: 'You read incoming blows before they land. The shield becomes an extension of thought.',
        effect: { type: 'quest_bonus', skill: 'defense', value: 5 },
        effectLabel: '+5% Defense quest success',
    },
    {
        id: 'fortify',
        name: 'Fortify',
        category: 'defense',
        skillReq: { skill: 'defense', level: 2000 },
        goldCost: 500,
        description: 'Your body has become a fortress. Steel fears you more than you fear it.',
        effect: { type: 'stat_bonus', stat: 'health', value: 25 },
        effectLabel: '+25 Health max',
    },

    // ── Stealth ──────────────────────────────────────────────────────────────────
    {
        id: 'shadow_step',
        name: 'Shadow Step',
        category: 'stealth',
        skillReq: { skill: 'stealth', level: 100 },
        goldCost: 50,
        description: 'You move without leaving a trace. Crowds part without noticing you passed.',
        effect: { type: 'stat_bonus', stat: 'energy', value: 10 },
        effectLabel: '+10 Energy max',
    },
    {
        id: 'assassins_mark',
        name: "Assassin's Mark",
        category: 'stealth',
        skillReq: { skill: 'stealth', level: 500 },
        goldCost: 150,
        description: 'You identify every weakness before committing. No action is wasted.',
        effect: { type: 'quest_bonus', skill: 'stealth', value: 5 },
        effectLabel: '+5% Stealth quest success',
    },
    {
        id: 'vanish',
        name: 'Vanish',
        category: 'stealth',
        skillReq: { skill: 'stealth', level: 2000 },
        goldCost: 500,
        description: 'When failure seems certain, you simply disappear. Not even fate can track you.',
        effect: { type: 'quest_bonus_all', value: 5 },
        effectLabel: '+5% all quest success',
    },
];
