// js/data/arenaAbilities.js
// Combat abilities used in arena auto-battle.
// Each ability has costs, a type, scaling skill, and cooldown (in turns).

const ARENA_ABILITIES = {

    // ── Universal fallbacks ──────────────────────────────────────────────────────
    basic_attack: {
        id: 'basic_attack',
        name: 'Basic Attack',
        type: 'attack',
        scalingSkill: 'melee',
        baseDamage: 5,
        staminaCost: 0,
        manaCost: 0,
        cooldown: 0,
        target: 'enemy',
        description: 'A straightforward strike.',
    },
    catch_breath: {
        id: 'catch_breath',
        name: 'Catch Breath',
        type: 'rest',
        staminaRestore: 10,
        manaRestore: 6,
        staminaCost: 0,
        manaCost: 0,
        cooldown: 0,
        target: 'self',
        description: 'Recover resources for one turn.',
    },

    // ── Melee abilities ──────────────────────────────────────────────────────────
    heavy_blow: {
        id: 'heavy_blow',
        name: 'Heavy Blow',
        type: 'attack',
        scalingSkill: 'melee',
        baseDamage: 18,
        staminaCost: 20,
        manaCost: 0,
        cooldown: 1,
        target: 'enemy',
        description: 'A powerful strike that hits hard.',
    },
    rend: {
        id: 'rend',
        name: 'Rend',
        type: 'attack',
        scalingSkill: 'melee',
        baseDamage: 12,
        staminaCost: 16,
        manaCost: 0,
        cooldown: 2,
        applyEffect: { id: 'bleed', damage: 5, duration: 3 },
        target: 'enemy',
        description: 'Tears through armor, causing bleeding.',
    },
    guard: {
        id: 'guard',
        name: 'Guard',
        type: 'buff',
        applyEffect: { id: 'defense_up', defenseBonus: 0.30, duration: 2 },
        staminaCost: 18,
        manaCost: 0,
        cooldown: 3,
        target: 'self',
        description: 'Brace for impact — reduce incoming damage by 30% for 2 turns.',
    },

    // ── Ranged abilities ─────────────────────────────────────────────────────────
    aimed_shot: {
        id: 'aimed_shot',
        name: 'Aimed Shot',
        type: 'attack',
        scalingSkill: 'ranged',
        baseDamage: 16,
        staminaCost: 18,
        manaCost: 0,
        cooldown: 1,
        target: 'enemy',
        description: 'A precise shot that deals reliable damage.',
    },
    volley: {
        id: 'volley',
        name: 'Volley',
        type: 'attack',
        scalingSkill: 'ranged',
        baseDamage: 9,
        hits: 2,
        staminaCost: 26,
        manaCost: 0,
        cooldown: 2,
        target: 'enemy',
        description: 'Fire two arrows in quick succession.',
    },
    evasive_step: {
        id: 'evasive_step',
        name: 'Evasive Step',
        type: 'buff',
        applyEffect: { id: 'dodge_up', dodgeChance: 0.25, duration: 2 },
        staminaCost: 20,
        manaCost: 0,
        cooldown: 3,
        target: 'self',
        description: 'Sidestep to avoid the next attack with 25% chance.',
    },

    // ── Magic abilities ──────────────────────────────────────────────────────────
    fire_bolt: {
        id: 'fire_bolt',
        name: 'Fire Bolt',
        type: 'attack',
        scalingSkill: 'magic',
        baseDamage: 16,
        staminaCost: 0,
        manaCost: 16,
        cooldown: 1,
        target: 'enemy',
        description: 'Hurl a bolt of arcane fire.',
    },
    arcane_burst: {
        id: 'arcane_burst',
        name: 'Arcane Burst',
        type: 'attack',
        scalingSkill: 'magic',
        baseDamage: 26,
        staminaCost: 0,
        manaCost: 28,
        cooldown: 2,
        target: 'enemy',
        description: 'An overwhelming surge of arcane energy.',
    },
    mana_shield: {
        id: 'mana_shield',
        name: 'Mana Shield',
        type: 'buff',
        applyEffect: { id: 'mana_shield', manaAbsorb: 0.40, duration: 3 },
        staminaCost: 0,
        manaCost: 22,
        cooldown: 4,
        target: 'self',
        description: 'Convert mana into a shield that absorbs 40% of damage.',
    },

    // ── Restoration abilities ────────────────────────────────────────────────────
    heal: {
        id: 'heal',
        name: 'Heal',
        type: 'heal',
        scalingSkill: 'restoration',
        baseHeal: 18,
        staminaCost: 0,
        manaCost: 20,
        cooldown: 2,
        target: 'self',
        description: 'Mend wounds with restorative energy.',
    },
    rejuvenate: {
        id: 'rejuvenate',
        name: 'Rejuvenate',
        type: 'heal',
        scalingSkill: 'restoration',
        baseHeal: 10,
        applyEffect: { id: 'regen', healPerTurn: 4, duration: 3 },
        staminaCost: 0,
        manaCost: 26,
        cooldown: 3,
        target: 'self',
        description: 'Heal now and continue recovering over 3 turns.',
    },

    // ── Stealth / finesse ────────────────────────────────────────────────────────
    shadow_strike: {
        id: 'shadow_strike',
        name: 'Shadow Strike',
        type: 'attack',
        scalingSkill: 'stealth',
        baseDamage: 20,
        critBonus: 0.30,    // flat crit chance added when used
        staminaCost: 22,
        manaCost: 0,
        cooldown: 2,
        target: 'enemy',
        description: 'Strike from a blind spot for high damage with crit chance.',
    },
    vanish: {
        id: 'vanish',
        name: 'Vanish',
        type: 'buff',
        applyEffect: { id: 'dodge_up', dodgeChance: 0.50, duration: 1 },
        staminaCost: 24,
        manaCost: 0,
        cooldown: 4,
        target: 'self',
        description: 'Disappear for one turn — 50% chance to dodge incoming attack.',
    },
};

// Returns a fresh copy of an ability
function getArenaAbility(id) {
    const a = ARENA_ABILITIES[id];
    return a ? Object.assign({}, a) : null;
}

// Build a player combat loadout from their skill spread.
// Returns up to 4 ability IDs best suited to their top skills.
function buildPlayerLoadout(skills) {
    const ordered = Object.entries({
        melee:       skills.melee       || 0,
        ranged:      skills.ranged      || 0,
        magic:       skills.magic       || 0,
        restoration: skills.restoration || 0,
        stealth:     skills.stealth     || 0,
    }).sort(([, a], [, b]) => b - a);

    const loadout = [];

    for (const [skill] of ordered) {
        if (loadout.length >= 4) break;
        if (skill === 'melee'       && skills.melee       > 0) { loadout.push('heavy_blow',  'guard');       }
        if (skill === 'ranged'      && skills.ranged      > 0) { loadout.push('aimed_shot',  'volley');      }
        if (skill === 'magic'       && skills.magic       > 0) { loadout.push('fire_bolt',   'arcane_burst');}
        if (skill === 'restoration' && skills.restoration > 0) { loadout.push('heal');                       }
        if (skill === 'stealth'     && skills.stealth     > 0) { loadout.push('shadow_strike');              }
    }

    // Deduplicate and cap at 4
    const unique = [...new Set(loadout)].slice(0, 4);

    // Always ensure a heal if player has any restoration
    if (skills.restoration > 0 && !unique.includes('heal') && unique.length < 4) {
        unique.push('heal');
    }

    return unique.length > 0 ? unique : ['basic_attack'];
}
