// js/combat/enemyGenerator.js
// Generates scaled arena enemies by round number.
// Archetypes rotate every 3 rounds to add variety.

const ARENA_ARCHETYPES = [
    {
        id: 'brute',
        name: 'Arena Brute',
        skillBias: { melee: 1.4, defense: 1.2, ranged: 0.4, magic: 0.2, restoration: 0.1, stealth: 0.2 },
        abilities: ['heavy_blow', 'guard', 'basic_attack'],
    },
    {
        id: 'duelist',
        name: 'Arena Duelist',
        skillBias: { melee: 1.1, defense: 0.8, ranged: 0.6, magic: 0.3, restoration: 0.1, stealth: 1.3 },
        abilities: ['shadow_strike', 'aimed_shot', 'basic_attack'],
    },
    {
        id: 'mage',
        name: 'Arena Mage',
        skillBias: { melee: 0.3, defense: 0.5, ranged: 0.5, magic: 1.5, restoration: 0.8, stealth: 0.2 },
        abilities: ['fire_bolt', 'arcane_burst', 'heal', 'basic_attack'],
    },
    {
        id: 'archer',
        name: 'Arena Archer',
        skillBias: { melee: 0.5, defense: 0.7, ranged: 1.4, magic: 0.2, restoration: 0.2, stealth: 0.9 },
        abilities: ['aimed_shot', 'volley', 'evasive_step', 'basic_attack'],
    },
    {
        id: 'tank',
        name: 'Arena Guardian',
        skillBias: { melee: 0.9, defense: 1.6, ranged: 0.2, magic: 0.3, restoration: 0.6, stealth: 0.1 },
        abilities: ['guard', 'heavy_blow', 'basic_attack'],
    },
    {
        id: 'healer',
        name: 'Arena Zealot',
        skillBias: { melee: 0.6, defense: 0.7, ranged: 0.4, magic: 0.9, restoration: 1.4, stealth: 0.2 },
        abilities: ['heal', 'rejuvenate', 'fire_bolt', 'basic_attack'],
    },
];

const EnemyGenerator = {

    generate(round) {
        const archetypeIndex = (round - 1) % ARENA_ARCHETYPES.length;
        const archetype      = ARENA_ARCHETYPES[archetypeIndex];

        // Base stats scale with round
        const baseHealth    = 40 + round * 14;
        const baseMana      = 20 + round * 6;
        const baseStamina   = 20 + round * 6;
        const baseSkillUnit = 8  + round * 4;

        const skills = {};
        for (const [sk, bias] of Object.entries(archetype.skillBias)) {
            skills[sk] = Math.floor(baseSkillUnit * bias);
        }

        // Boss every 5 rounds — stronger health and skill
        const isBoss  = round % 5 === 0;
        const hpMult  = isBoss ? 1.6 : 1.0;
        const skMult  = isBoss ? 1.3 : 1.0;
        if (isBoss) {
            for (const sk in skills) skills[sk] = Math.floor(skills[sk] * skMult);
        }

        // Which abilities this archetype gets (unlocked by round)
        const availableAbilities = archetype.abilities.filter((_, i) => {
            if (i === 0) return true;
            if (i === 1) return round >= 3;
            if (i === 2) return round >= 5;
            return round >= 8;
        });

        return {
            id:           `${archetype.id}_r${round}`,
            name:         isBoss ? `${archetype.name} Champion` : `${archetype.name}`,
            level:        round,
            isBoss,
            archetype:    archetype.id,

            health:       Math.floor(baseHealth * hpMult),
            maxHealth:    Math.floor(baseHealth * hpMult),
            mana:         baseMana,
            maxMana:      baseMana,
            stamina:      baseStamina,
            maxStamina:   baseStamina,

            skills,
            effects:      [],
            cooldowns:    {},
            alive:        true,
            abilities:    availableAbilities,
        };
    },
};
