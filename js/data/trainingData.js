// js/data/trainingData.js
// Training action definitions for the Training page.
// Each action belongs to one of three categories:
//   'drills'  – temporary buffs + readiness (10–15 min)
//   'study'   – slow permanent skill XP + mastery (20 min)
//   'warband' – warband operation buffs (15 min)

const TRAINING_ACTIONS = {

    // ═══════════════════════════════════════════════════════════════════════
    //  FIELD DRILLS — short prep actions, temporary buffs
    // ═══════════════════════════════════════════════════════════════════════

    blade_forms: {
        id: 'blade_forms',
        category: 'drills',
        label: 'Blade Forms',
        linkedSkill: 'melee',
        tier: 1,
        durationSec: 600,
        cost: { energy: 15, focus: 5 },
        desc: 'Run through sword forms and footwork patterns under weight.',
        rewards: {
            tempBuff: { type: 'success_chance', label: '+melee encounter success' },
            readiness: true,
            xpBase: true,
        },
    },

    shield_discipline: {
        id: 'shield_discipline',
        category: 'drills',
        label: 'Shield Discipline',
        linkedSkill: 'defense',
        tier: 1,
        durationSec: 600,
        cost: { energy: 12, focus: 4 },
        desc: 'Shield raises, blocks, and stance transitions against a drill partner.',
        rewards: {
            tempBuff: { type: 'damage_mitigation', label: 'reduced damage taken in quests' },
            readiness: true,
            xpBase: true,
        },
    },

    target_practice: {
        id: 'target_practice',
        category: 'drills',
        label: 'Target Practice',
        linkedSkill: 'ranged',
        tier: 1,
        durationSec: 600,
        cost: { energy: 14, focus: 5 },
        desc: 'Focus accuracy against moving targets at varied distances.',
        rewards: {
            tempBuff: { type: 'success_chance', label: '+ambush & first-strike success' },
            readiness: true,
            xpBase: true,
        },
    },

    spell_rehearsal: {
        id: 'spell_rehearsal',
        category: 'drills',
        label: 'Spell Rehearsal',
        linkedSkill: 'magic',
        tier: 1,
        durationSec: 600,
        cost: { focus: 15, energy: 5 },
        desc: 'Rehearse spell patterns to reduce casting variance under pressure.',
        rewards: {
            tempBuff: { type: 'success_chance', label: '+spell event success, -focus loss in encounters' },
            readiness: true,
            xpBase: true,
        },
    },

    restoration_focus: {
        id: 'restoration_focus',
        category: 'drills',
        label: 'Restoration Focus',
        linkedSkill: 'restoration',
        tier: 1,
        durationSec: 600,
        cost: { focus: 12, energy: 4 },
        desc: 'Channel restorative flows and practice ward patterns.',
        rewards: {
            tempBuff: { type: 'damage_mitigation', label: '+sustain, reduced injury outcomes' },
            readiness: true,
            xpBase: true,
        },
    },

    silent_route_practice: {
        id: 'silent_route_practice',
        category: 'drills',
        label: 'Silent Route Practice',
        linkedSkill: 'stealth',
        tier: 1,
        durationSec: 600,
        cost: { energy: 14, focus: 5 },
        desc: 'Move through simulated patrol routes without disturbing sentinels.',
        rewards: {
            tempBuff: { type: 'success_chance', label: 'reduced patrol detection, +scouting' },
            readiness: true,
            xpBase: true,
        },
    },

    endurance_run: {
        id: 'endurance_run',
        category: 'drills',
        label: 'Endurance Run',
        linkedSkill: 'defense',
        tier: 1,
        durationSec: 600,
        cost: { energy: 18, focus: 3 },
        desc: 'Push physical limits under full gear weight across rough terrain.',
        rewards: {
            tempBuff: { type: 'success_chance', label: '+stamina checks and escape odds' },
            readiness: true,
            xpBase: true,
        },
    },

    recon_exercises: {
        id: 'recon_exercises',
        category: 'drills',
        label: 'Recon Exercises',
        linkedSkill: 'stealth',
        tier: 1,
        durationSec: 600,
        cost: { energy: 12, focus: 8 },
        desc: 'Scout mock terrain to sharpen environmental awareness.',
        rewards: {
            tempBuff: { type: 'scouting', label: '+scouting efficiency' },
            readiness: true,
            xpBase: true,
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  STUDY & PRACTICE — longer personal training, permanent XP + mastery
    // ═══════════════════════════════════════════════════════════════════════

    sparring: {
        id: 'sparring',
        category: 'study',
        label: 'Sparring',
        linkedSkill: 'melee',
        tier: 1,
        durationSec: 1200,
        cost: { energy: 20, focus: 8 },
        desc: 'Controlled bouts against a willing sparring partner.',
        rewards: { xp: true, mastery: true },
    },

    arcane_study: {
        id: 'arcane_study',
        category: 'study',
        label: 'Arcane Study',
        linkedSkill: 'magic',
        tier: 1,
        durationSec: 1200,
        cost: { focus: 20, energy: 8 },
        desc: 'Theoretical study of arcane patterns, resonance, and glyph structure.',
        rewards: { xp: true, mastery: true },
    },

    tactical_reading: {
        id: 'tactical_reading',
        category: 'study',
        label: 'Tactical Reading',
        linkedSkill: 'defense',
        tier: 1,
        durationSec: 1200,
        cost: { focus: 18, energy: 6 },
        desc: 'Study formation manuals and defensive doctrine from veteran accounts.',
        rewards: { xp: true, mastery: true },
    },

    survival_conditioning: {
        id: 'survival_conditioning',
        category: 'study',
        label: 'Survival Conditioning',
        linkedSkill: 'stealth',
        tier: 1,
        durationSec: 1200,
        cost: { energy: 16, focus: 8 },
        desc: 'Practice field concealment, silent movement, and low-visibility navigation.',
        rewards: { xp: true, mastery: true },
    },

    restoration_meditation: {
        id: 'restoration_meditation',
        category: 'study',
        label: 'Restoration Meditation',
        linkedSkill: 'restoration',
        tier: 1,
        durationSec: 1200,
        cost: { focus: 18, energy: 6 },
        desc: 'Deep focus exercises to sharpen restorative channels and ward endurance.',
        rewards: { xp: true, mastery: true },
    },

    bowman_stance: {
        id: 'bowman_stance',
        category: 'study',
        label: 'Bowman Stance',
        linkedSkill: 'ranged',
        tier: 1,
        durationSec: 1200,
        cost: { energy: 14, focus: 10 },
        desc: 'Drill draw speed, stance consistency, and breath control under fatigue.',
        rewards: { xp: true, mastery: true },
    },

    // Crafting study
    hammer_repetition: {
        id: 'hammer_repetition',
        category: 'study',
        label: 'Hammer Repetition',
        linkedSkill: 'blacksmithing',
        tier: 1,
        durationSec: 1200,
        cost: { energy: 14, focus: 10, gold: 10 },
        desc: 'Methodical hammer strikes to build muscle memory for weapon shaping.',
        rewards: { xp: true, mastery: true },
    },

    fitting_practice: {
        id: 'fitting_practice',
        category: 'study',
        label: 'Fitting Practice',
        linkedSkill: 'armorsmithing',
        tier: 1,
        durationSec: 1200,
        cost: { energy: 12, focus: 12, gold: 10 },
        desc: 'Practice armor plate alignment, riveting, and joint reinforcement.',
        rewards: { xp: true, mastery: true },
    },

    grain_selection: {
        id: 'grain_selection',
        category: 'study',
        label: 'Grain Selection',
        linkedSkill: 'woodworking',
        tier: 1,
        durationSec: 1200,
        cost: { focus: 14, energy: 8, gold: 8 },
        desc: 'Study wood grain patterns for stress resistance and bow flex optimization.',
        rewards: { xp: true, mastery: true },
    },

    stitchwork: {
        id: 'stitchwork',
        category: 'study',
        label: 'Stitchwork',
        linkedSkill: 'tailoring',
        tier: 1,
        durationSec: 1200,
        cost: { focus: 14, energy: 6, gold: 8 },
        desc: 'Practice needle technique for reinforced seams and armor weave tension.',
        rewards: { xp: true, mastery: true },
    },

    solvent_distillation: {
        id: 'solvent_distillation',
        category: 'study',
        label: 'Solvent Distillation',
        linkedSkill: 'alchemy',
        tier: 1,
        durationSec: 1200,
        cost: { focus: 16, energy: 6, gold: 12 },
        desc: 'Refine base solvents and study reagent concentration curves.',
        rewards: { xp: true, mastery: true },
    },

    rune_tracing: {
        id: 'rune_tracing',
        category: 'study',
        label: 'Rune Tracing',
        linkedSkill: 'magesmithing',
        tier: 1,
        durationSec: 1200,
        cost: { focus: 18, energy: 6, gold: 15 },
        desc: 'Trace enchantment glyphs repeatedly to improve stabilization and flow control.',
        rewards: { xp: true, mastery: true },
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  WARBAND PREPARATION — troop and operation buffs
    // ═══════════════════════════════════════════════════════════════════════

    march_discipline: {
        id: 'march_discipline',
        category: 'warband',
        label: 'March Discipline',
        linkedSkill: 'defense',
        tier: 1,
        durationSec: 900,
        cost: { energy: 20, gold: 20 },
        desc: 'Drill troop formation movement and march endurance under field conditions.',
        rewards: {
            warbandBuff: { type: 'march_speed', label: '+troop march efficiency' },
            readiness: true,
        },
    },

    shield_wall_practice: {
        id: 'shield_wall_practice',
        category: 'warband',
        label: 'Shield Wall Practice',
        linkedSkill: 'defense',
        tier: 1,
        durationSec: 900,
        cost: { energy: 18, focus: 8, gold: 25 },
        desc: 'Synchronize front-line shield positioning and mutual coverage angles.',
        rewards: {
            warbandBuff: { type: 'defense_boost', label: '+warband damage resistance' },
            readiness: true,
        },
    },

    vanguard_assault: {
        id: 'vanguard_assault',
        category: 'warband',
        label: 'Vanguard Assault',
        linkedSkill: 'melee',
        tier: 1,
        durationSec: 900,
        cost: { energy: 20, focus: 8, gold: 25 },
        desc: 'Coordinate aggressive forward pushes and breakthrough timing.',
        rewards: {
            warbandBuff: { type: 'attack_boost', label: '+warband offensive power' },
            readiness: true,
        },
    },

    scout_mapping: {
        id: 'scout_mapping',
        category: 'warband',
        label: 'Scout Mapping',
        linkedSkill: 'stealth',
        tier: 1,
        durationSec: 900,
        cost: { focus: 16, energy: 8, gold: 20 },
        desc: 'Train scouts to chart enemy positions, patrol patterns, and terrain hazards.',
        rewards: {
            warbandBuff: { type: 'scouting', label: '+scout mission success rate' },
            readiness: true,
        },
    },

    rift_exposure_conditioning: {
        id: 'rift_exposure_conditioning',
        category: 'warband',
        label: 'Rift Conditioning',
        linkedSkill: 'magic',
        tier: 2,
        durationSec: 1200,
        cost: { focus: 20, energy: 10, gold: 40 },
        desc: 'Expose troops to controlled rift emanations to build corruption tolerance.',
        rewards: {
            warbandBuff: { type: 'rift_resistance', label: '+rift mission corruption resistance' },
            readiness: true,
        },
    },

    supply_routing: {
        id: 'supply_routing',
        category: 'warband',
        label: 'Supply Routing',
        linkedSkill: 'defense',
        tier: 1,
        durationSec: 600,
        cost: { focus: 12, gold: 30 },
        desc: 'Optimize supply line logistics and cache positioning for extended operations.',
        rewards: {
            warbandBuff: { type: 'supply_efficiency', label: '+supply crew effectiveness' },
            readiness: true,
        },
    },
};

// Grouped for easy iteration
const TRAINING_BY_CATEGORY = {
    drills:  Object.values(TRAINING_ACTIONS).filter(a => a.category === 'drills'),
    study:   Object.values(TRAINING_ACTIONS).filter(a => a.category === 'study'),
    warband: Object.values(TRAINING_ACTIONS).filter(a => a.category === 'warband'),
};
