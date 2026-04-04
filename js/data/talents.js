// js/data/talents.js
// Talent definitions. Available at level 15.
// XP modifiers are applied to skill experience gains from quests.
// Base XP rates start at 100 XP per quest point (variable by quest tier).

const TALENTS = [
    {
        id: 'ironbound',
        name: 'Ironbound',
        icon: '⚔️',
        description: 'Master of melee combat and defense. You wear heavy armor and hit hard.',
        lore: 'The path of the warrior. Steel your body and your will.',
        primarySkill: 'melee',
        xpModifiers: {
            melee: 1.5,      // +50% XP
            defense: 1.3,    // +30% XP
            restoration: 1.3, // +30% XP
            stealth: 0.7,    // -30% XP
            ranged: 0.7,     // -30% XP
            magic: 0.7,      // -30% XP
        },
    },
    {
        id: 'shade',
        name: 'Shade',
        icon: '🌑',
        description: 'Silent killer. Shadows are your home. Strike from darkness.',
        lore: 'The path of the rogue. Become one with the shadows.',
        primarySkill: 'stealth',
        xpModifiers: {
            stealth: 1.5,    // +50% XP
            melee: 1.3,      // +30% XP
            ranged: 1.3,     // +30% XP
            defense: 0.7,    // -30% XP
            restoration: 0.7, // -30% XP
            magic: 0.7,      // -30% XP
        },
    },
    {
        id: 'rift_caller',
        name: 'Rift Caller',
        icon: '⚡',
        description: 'Command the arcane. Bend reality itself to your will.',
        lore: 'The path of the mage. Embrace the power of the rifts.',
        primarySkill: 'magic',
        xpModifiers: {
            magic: 1.5,      // +50% XP
            defense: 1.3,    // +30% XP
            stealth: 1.3,    // +30% XP (evasion/illusion magic)
            melee: 0.7,      // -30% XP
            ranged: 0.7,     // -30% XP
            restoration: 0.7, // -30% XP (spec had typo listing Stealth twice, using Restoration instead)
        },
    },
    {
        id: 'veil_keeper',
        name: 'Veil Keeper',
        icon: '✨',
        description: 'Guardian of life and warding magic. Protect and restore.',
        lore: 'The path of the healer. Mend what is broken.',
        primarySkill: 'restoration',
        xpModifiers: {
            restoration: 1.5, // +50% XP
            defense: 1.3,    // +30% XP
            stealth: 1.3,    // +30% XP
            melee: 0.7,      // -30% XP
            ranged: 0.7,     // -30% XP
            magic: 0.7,      // -30% XP
        },
    },
    {
        id: 'wilder',
        name: 'Wilder',
        icon: '🏹',
        description: 'Master of ranged weapons and evasion. Keep your distance.',
        lore: 'The path of the archer. Command distance and precision.',
        primarySkill: 'ranged',
        xpModifiers: {
            ranged: 1.5,     // +50% XP
            defense: 1.3,    // +30% XP
            stealth: 1.3,    // +30% XP
            melee: 0.7,      // -30% XP
            magic: 0.7,      // -30% XP
            restoration: 0.7, // -30% XP
        },
    },
];

// XP thresholds for each level
const LEVEL_THRESHOLDS = {
    1: 0,
    2: 500,
    3: 1200,
    4: 2000,
    5: 3000,
    6: 4200,
    7: 5600,
    8: 7200,
    9: 9000,
    10: 11000,
    11: 13200,
    12: 15600,
    13: 18200,
    14: 21000,
    15: 24000,  // Talent unlock at this level
    16: 27200,
    17: 30600,
    18: 34200,
    19: 38000,
    20: 42000,
};

// Calculate XP for next level (interpolate if beyond defined levels)
function getXpForLevel(level) {
    if (LEVEL_THRESHOLDS[level]) return LEVEL_THRESHOLDS[level];
    // For levels beyond 20, scale up by ~10% per level
    const base = LEVEL_THRESHOLDS[20] || 42000;
    const diff = level - 20;
    return Math.floor(base * Math.pow(1.10, diff));
}
