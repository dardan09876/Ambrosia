// js/data/synergies.js
// Talent synergies — passive bonuses unlocked by training two complementary skills together.
// Synergy value = min(skill1, skill2). Tiers at: 50, 150, 300, 600, 1000.
// Each tier grants stronger bonuses and new effects.

const SYNERGIES = [
    // ── IRONBOUND (Melee) ─────────────────────────────────────────────────
    {
        id: 'bastion-of-ash',
        name: 'Bastion of Ash',
        talent: 'ironbound',
        skills: ['melee', 'defense'],
        description: 'Master the fusion of offense and defense.',
        icon: '⚔️',
        tiers: [
            {
                tier: 1,
                threshold: 50,
                bonuses: {
                    damageReduction: 0.05,
                },
                effects: ['Incoming damage reduced by 5%'],
            },
            {
                tier: 2,
                threshold: 150,
                bonuses: {
                    damageReduction: 0.1,
                    meleeDamage: 0.05,
                },
                effects: ['Incoming damage reduced by 10%', 'Melee damage increased by 5%'],
            },
            {
                tier: 3,
                threshold: 300,
                bonuses: {
                    damageReduction: 0.15,
                    meleeDamage: 0.1,
                    durabilityLossReduction: 0.1,
                },
                effects: ['Incoming damage reduced by 15%', 'Melee damage increased by 10%', 'Equipment durability loss reduced by 10%'],
            },
            {
                tier: 4,
                threshold: 600,
                bonuses: {
                    damageReduction: 0.2,
                    meleeDamage: 0.14,
                    durabilityLossReduction: 0.2,
                    defenseBonus: 0.1,
                },
                effects: ['Incoming damage reduced by 20%', 'Melee damage increased by 14%', 'Equipment durability loss reduced by 20%', 'Defense skill gain increased by 10%'],
            },
            {
                tier: 5,
                threshold: 1000,
                bonuses: {
                    damageReduction: 0.25,
                    meleeDamage: 0.18,
                    durabilityLossReduction: 0.25,
                    defenseBonus: 0.2,
                    lastStandChance: 0.05,
                },
                effects: ['Incoming damage reduced by 25%', 'Melee damage increased by 18%', 'Equipment durability loss reduced by 25%', 'Defense skill gain increased by 20%', '5% chance to survive a killing blow'],
            },
        ],
    },
    {
        id: 'dawnsworn',
        name: 'Dawnsworn',
        talent: 'ironbound',
        skills: ['melee', 'restoration'],
        description: 'Heal through the clash of battle.',
        icon: '⚔️',
        tiers: [
            {
                tier: 1,
                threshold: 50,
                bonuses: {
                    healthRegen: 0.05,
                },
                effects: ['Health regeneration increased by 5%'],
            },
            {
                tier: 2,
                threshold: 150,
                bonuses: {
                    healthRegen: 0.1,
                    meleeDamage: 0.05,
                },
                effects: ['Health regeneration increased by 10%', 'Melee damage increased by 5%'],
            },
            {
                tier: 3,
                threshold: 300,
                bonuses: {
                    healthRegen: 0.15,
                    meleeDamage: 0.1,
                    staminaRegen: 0.1,
                },
                effects: ['Health regeneration increased by 15%', 'Melee damage increased by 10%', 'Stamina regeneration increased by 10%'],
            },
            {
                tier: 4,
                threshold: 600,
                bonuses: {
                    healthRegen: 0.2,
                    meleeDamage: 0.14,
                    staminaRegen: 0.15,
                    restorationBonus: 0.1,
                },
                effects: ['Health regeneration increased by 20%', 'Melee damage increased by 14%', 'Stamina regeneration increased by 15%', 'Restoration skill gain increased by 10%'],
            },
            {
                tier: 5,
                threshold: 1000,
                bonuses: {
                    healthRegen: 0.25,
                    meleeDamage: 0.18,
                    staminaRegen: 0.2,
                    restorationBonus: 0.2,
                    lifeSteal: 0.08,
                },
                effects: ['Health regeneration increased by 25%', 'Melee damage increased by 18%', 'Stamina regeneration increased by 20%', 'Restoration skill gain increased by 20%', 'Heal 8% of damage dealt'],
            },
        ],
    },

    // ── SHADE (Stealth) ───────────────────────────────────────────────────
    {
        id: 'bloodshade',
        name: 'Bloodshade',
        talent: 'shade',
        skills: ['stealth', 'melee'],
        description: 'Strike from the darkness with precision and fury.',
        icon: '🌑',
        tiers: [
            {
                tier: 1,
                threshold: 50,
                bonuses: {
                    criticalChance: 0.05,
                },
                effects: ['Critical strike chance increased by 5%'],
            },
            {
                tier: 2,
                threshold: 150,
                bonuses: {
                    criticalChance: 0.1,
                    meleeDamage: 0.05,
                },
                effects: ['Critical strike chance increased by 10%', 'Melee damage increased by 5%'],
            },
            {
                tier: 3,
                threshold: 300,
                bonuses: {
                    criticalChance: 0.15,
                    meleeDamage: 0.1,
                    criticalDamage: 0.3,
                },
                effects: ['Critical strike chance increased by 15%', 'Melee damage increased by 10%', 'Critical damage multiplier increased by 30%'],
            },
            {
                tier: 4,
                threshold: 600,
                bonuses: {
                    criticalChance: 0.2,
                    meleeDamage: 0.14,
                    criticalDamage: 0.5,
                    stealthBonus: 0.1,
                },
                effects: ['Critical strike chance increased by 20%', 'Melee damage increased by 14%', 'Critical damage multiplier increased by 50%', 'Stealth skill gain increased by 10%'],
            },
            {
                tier: 5,
                threshold: 1000,
                bonuses: {
                    criticalChance: 0.25,
                    meleeDamage: 0.18,
                    criticalDamage: 0.75,
                    stealthBonus: 0.2,
                    deathFromAbove: 0.1,
                },
                effects: ['Critical strike chance increased by 25%', 'Melee damage increased by 18%', 'Critical damage multiplier increased by 75%', 'Stealth skill gain increased by 20%', 'Critical hits reduce quest cooldown by 10%'],
            },
        ],
    },
    {
        id: 'shade-ranger',
        name: 'Shade Ranger',
        talent: 'shade',
        skills: ['stealth', 'ranged'],
        description: 'Hunt from the shadows with arrows that never miss.',
        icon: '🌑',
        tiers: [
            {
                tier: 1,
                threshold: 50,
                bonuses: {
                    rangedDamage: 0.05,
                },
                effects: ['Ranged damage increased by 5%'],
            },
            {
                tier: 2,
                threshold: 150,
                bonuses: {
                    rangedDamage: 0.1,
                    accuracyBonus: 0.05,
                },
                effects: ['Ranged damage increased by 10%', 'Quest success chance increased by 5%'],
            },
            {
                tier: 3,
                threshold: 300,
                bonuses: {
                    rangedDamage: 0.15,
                    accuracyBonus: 0.1,
                    criticalChance: 0.1,
                },
                effects: ['Ranged damage increased by 15%', 'Quest success chance increased by 10%', 'Critical strike chance increased by 10%'],
            },
            {
                tier: 4,
                threshold: 600,
                bonuses: {
                    rangedDamage: 0.2,
                    accuracyBonus: 0.15,
                    criticalChance: 0.15,
                    rangedBonus: 0.1,
                },
                effects: ['Ranged damage increased by 20%', 'Quest success chance increased by 15%', 'Critical strike chance increased by 15%', 'Ranged skill gain increased by 10%'],
            },
            {
                tier: 5,
                threshold: 1000,
                bonuses: {
                    rangedDamage: 0.25,
                    accuracyBonus: 0.2,
                    criticalChance: 0.2,
                    rangedBonus: 0.2,
                    pierceShot: 0.1,
                },
                effects: ['Ranged damage increased by 25%', 'Quest success chance increased by 20%', 'Critical strike chance increased by 20%', 'Ranged skill gain increased by 20%', 'All ranged quests reward 10% bonus XP'],
            },
        ],
    },

    // ── RIFT CALLER (Magic) ───────────────────────────────────────────────
    {
        id: 'void-sentinel',
        name: 'Void Sentinel',
        talent: 'rift_caller',
        skills: ['magic', 'defense'],
        description: 'Weave protective wards through arcane discipline.',
        icon: '⚡',
        tiers: [
            {
                tier: 1,
                threshold: 50,
                bonuses: {
                    magicDefense: 0.05,
                },
                effects: ['Magic defense increased by 5%'],
            },
            {
                tier: 2,
                threshold: 150,
                bonuses: {
                    magicDefense: 0.1,
                    magicDamage: 0.05,
                },
                effects: ['Magic defense increased by 10%', 'Magic damage increased by 5%'],
            },
            {
                tier: 3,
                threshold: 300,
                bonuses: {
                    magicDefense: 0.15,
                    magicDamage: 0.1,
                    damageReduction: 0.08,
                },
                effects: ['Magic defense increased by 15%', 'Magic damage increased by 10%', 'All incoming damage reduced by 8%'],
            },
            {
                tier: 4,
                threshold: 600,
                bonuses: {
                    magicDefense: 0.2,
                    magicDamage: 0.14,
                    damageReduction: 0.12,
                    magicBonus: 0.1,
                },
                effects: ['Magic defense increased by 20%', 'Magic damage increased by 14%', 'All incoming damage reduced by 12%', 'Magic skill gain increased by 10%'],
            },
            {
                tier: 5,
                threshold: 1000,
                bonuses: {
                    magicDefense: 0.25,
                    magicDamage: 0.18,
                    damageReduction: 0.15,
                    magicBonus: 0.2,
                    arcaneBarrier: 0.1,
                },
                effects: ['Magic defense increased by 25%', 'Magic damage increased by 18%', 'All incoming damage reduced by 15%', 'Magic skill gain increased by 20%', '10% of damage taken heals your mana'],
            },
        ],
    },
    {
        id: 'veil-hexer',
        name: 'Veil Hexer',
        talent: 'rift_caller',
        skills: ['magic', 'stealth'],
        description: 'Curse enemies while remaining unseen.',
        icon: '⚡',
        tiers: [
            {
                tier: 1,
                threshold: 50,
                bonuses: {
                    magicDamage: 0.05,
                },
                effects: ['Magic damage increased by 5%'],
            },
            {
                tier: 2,
                threshold: 150,
                bonuses: {
                    magicDamage: 0.1,
                    curseEffectiveness: 0.1,
                },
                effects: ['Magic damage increased by 10%', 'Magic quests 10% more effective'],
            },
            {
                tier: 3,
                threshold: 300,
                bonuses: {
                    magicDamage: 0.15,
                    curseEffectiveness: 0.15,
                    manaRegen: 0.1,
                },
                effects: ['Magic damage increased by 15%', 'Magic quests 15% more effective', 'Mana regeneration increased by 10%'],
            },
            {
                tier: 4,
                threshold: 600,
                bonuses: {
                    magicDamage: 0.2,
                    curseEffectiveness: 0.2,
                    manaRegen: 0.15,
                    magicBonus: 0.1,
                },
                effects: ['Magic damage increased by 20%', 'Magic quests 20% more effective', 'Mana regeneration increased by 15%', 'Magic skill gain increased by 10%'],
            },
            {
                tier: 5,
                threshold: 1000,
                bonuses: {
                    magicDamage: 0.25,
                    curseEffectiveness: 0.3,
                    manaRegen: 0.2,
                    magicBonus: 0.2,
                    curseOverflow: 0.1,
                },
                effects: ['Magic damage increased by 25%', 'Magic quests 30% more effective', 'Mana regeneration increased by 20%', 'Magic skill gain increased by 20%', 'Failed magic quests still restore 10% XP'],
            },
        ],
    },

    // ── VEIL KEEPER (Restoration) ─────────────────────────────────────────
    {
        id: 'sanctified',
        name: 'Sanctified',
        talent: 'veil_keeper',
        skills: ['restoration', 'defense'],
        description: 'Healing and protection intertwined.',
        icon: '✨',
        tiers: [
            {
                tier: 1,
                threshold: 50,
                bonuses: {
                    healingPower: 0.05,
                },
                effects: ['Healing power increased by 5%'],
            },
            {
                tier: 2,
                threshold: 150,
                bonuses: {
                    healingPower: 0.1,
                    damageReduction: 0.05,
                },
                effects: ['Healing power increased by 10%', 'Incoming damage reduced by 5%'],
            },
            {
                tier: 3,
                threshold: 300,
                bonuses: {
                    healingPower: 0.15,
                    damageReduction: 0.1,
                    healthRegen: 0.1,
                },
                effects: ['Healing power increased by 15%', 'Incoming damage reduced by 10%', 'Health regeneration increased by 10%'],
            },
            {
                tier: 4,
                threshold: 600,
                bonuses: {
                    healingPower: 0.2,
                    damageReduction: 0.15,
                    healthRegen: 0.15,
                    restorationBonus: 0.1,
                },
                effects: ['Healing power increased by 20%', 'Incoming damage reduced by 15%', 'Health regeneration increased by 15%', 'Restoration skill gain increased by 10%'],
            },
            {
                tier: 5,
                threshold: 1000,
                bonuses: {
                    healingPower: 0.25,
                    damageReduction: 0.2,
                    healthRegen: 0.2,
                    restorationBonus: 0.2,
                    guardianShield: 0.1,
                },
                effects: ['Healing power increased by 25%', 'Incoming damage reduced by 20%', 'Health regeneration increased by 20%', 'Restoration skill gain increased by 20%', 'Restoration quests heal 10% health on success'],
            },
        ],
    },
    {
        id: 'gravespeaker',
        name: 'Gravespeaker',
        talent: 'veil_keeper',
        skills: ['restoration', 'stealth'],
        description: 'Life and death, whispered in shadow.',
        icon: '✨',
        tiers: [
            {
                tier: 1,
                threshold: 50,
                bonuses: {
                    restorationDamage: 0.05,
                },
                effects: ['Restoration damage increased by 5%'],
            },
            {
                tier: 2,
                threshold: 150,
                bonuses: {
                    restorationDamage: 0.1,
                    focusRegen: 0.05,
                },
                effects: ['Restoration damage increased by 10%', 'Focus regeneration increased by 5%'],
            },
            {
                tier: 3,
                threshold: 300,
                bonuses: {
                    restorationDamage: 0.15,
                    focusRegen: 0.1,
                    healthRegen: 0.08,
                },
                effects: ['Restoration damage increased by 15%', 'Focus regeneration increased by 10%', 'Health regeneration increased by 8%'],
            },
            {
                tier: 4,
                threshold: 600,
                bonuses: {
                    restorationDamage: 0.2,
                    focusRegen: 0.15,
                    healthRegen: 0.12,
                    restorationBonus: 0.1,
                },
                effects: ['Restoration damage increased by 20%', 'Focus regeneration increased by 15%', 'Health regeneration increased by 12%', 'Restoration skill gain increased by 10%'],
            },
            {
                tier: 5,
                threshold: 1000,
                bonuses: {
                    restorationDamage: 0.25,
                    focusRegen: 0.2,
                    healthRegen: 0.15,
                    restorationBonus: 0.2,
                    deathblooming: 0.1,
                },
                effects: ['Restoration damage increased by 25%', 'Focus regeneration increased by 20%', 'Health regeneration increased by 15%', 'Restoration skill gain increased by 20%', 'Failed restoration quests still grant 10% bonus XP'],
            },
        ],
    },

    // ── WILDER (Ranged) ───────────────────────────────────────────────────
    {
        id: 'ironwood-guardian',
        name: 'Ironwood Guardian',
        talent: 'wilder',
        skills: ['ranged', 'defense'],
        description: 'Stand firm like an ancient tree, strike like an arrow.',
        icon: '🏹',
        tiers: [
            {
                tier: 1,
                threshold: 50,
                bonuses: {
                    rangedDamage: 0.05,
                },
                effects: ['Ranged damage increased by 5%'],
            },
            {
                tier: 2,
                threshold: 150,
                bonuses: {
                    rangedDamage: 0.1,
                    damageReduction: 0.05,
                },
                effects: ['Ranged damage increased by 10%', 'Incoming damage reduced by 5%'],
            },
            {
                tier: 3,
                threshold: 300,
                bonuses: {
                    rangedDamage: 0.15,
                    damageReduction: 0.1,
                    staminaRegen: 0.1,
                },
                effects: ['Ranged damage increased by 15%', 'Incoming damage reduced by 10%', 'Stamina regeneration increased by 10%'],
            },
            {
                tier: 4,
                threshold: 600,
                bonuses: {
                    rangedDamage: 0.2,
                    damageReduction: 0.15,
                    staminaRegen: 0.15,
                    rangedBonus: 0.1,
                },
                effects: ['Ranged damage increased by 20%', 'Incoming damage reduced by 15%', 'Stamina regeneration increased by 15%', 'Ranged skill gain increased by 10%'],
            },
            {
                tier: 5,
                threshold: 1000,
                bonuses: {
                    rangedDamage: 0.25,
                    damageReduction: 0.2,
                    staminaRegen: 0.2,
                    rangedBonus: 0.2,
                    steadyAim: 0.1,
                },
                effects: ['Ranged damage increased by 25%', 'Incoming damage reduced by 20%', 'Stamina regeneration increased by 20%', 'Ranged skill gain increased by 20%', 'Ranged quests give 10% bonus critical chance'],
            },
        ],
    },
    {
        id: 'night-strider',
        name: 'Night Strider',
        talent: 'wilder',
        skills: ['ranged', 'stealth'],
        description: 'Swift as the wind, silent as starlight.',
        icon: '🏹',
        tiers: [
            {
                tier: 1,
                threshold: 50,
                bonuses: {
                    rangedDamage: 0.05,
                },
                effects: ['Ranged damage increased by 5%'],
            },
            {
                tier: 2,
                threshold: 150,
                bonuses: {
                    rangedDamage: 0.1,
                    energyRegen: 0.05,
                },
                effects: ['Ranged damage increased by 10%', 'Energy regeneration increased by 5%'],
            },
            {
                tier: 3,
                threshold: 300,
                bonuses: {
                    rangedDamage: 0.15,
                    energyRegen: 0.1,
                    criticalChance: 0.1,
                },
                effects: ['Ranged damage increased by 15%', 'Energy regeneration increased by 10%', 'Critical strike chance increased by 10%'],
            },
            {
                tier: 4,
                threshold: 600,
                bonuses: {
                    rangedDamage: 0.2,
                    energyRegen: 0.15,
                    criticalChance: 0.15,
                    rangedBonus: 0.1,
                },
                effects: ['Ranged damage increased by 20%', 'Energy regeneration increased by 15%', 'Critical strike chance increased by 15%', 'Ranged skill gain increased by 10%'],
            },
            {
                tier: 5,
                threshold: 1000,
                bonuses: {
                    rangedDamage: 0.25,
                    energyRegen: 0.2,
                    criticalChance: 0.2,
                    rangedBonus: 0.2,
                    ghostArrow: 0.1,
                },
                effects: ['Ranged damage increased by 25%', 'Energy regeneration increased by 20%', 'Critical strike chance increased by 20%', 'Ranged skill gain increased by 20%', 'Each critical hit restores 10% energy'],
            },
        ],
    },
];

// Helper to get synergy by ID
function getSynergy(syneryId) {
    return SYNERGIES.find(s => s.id === syneryId);
}

// Get all synergies for a specific talent
function getSynergiesForTalent(talentId) {
    return SYNERGIES.filter(s => s.talent === talentId);
}
