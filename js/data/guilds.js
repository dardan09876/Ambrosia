// js/data/guilds.js
// Guild definitions, ranks, perks, and specializations

const GUILDS = [
    {
        id: 'the_black_sigil',
        name: 'The Black Sigil',
        icon: '◆',
        description: 'An arcane order devoted to magical knowledge and rift manipulation.',
        flavor: 'Where spellcraft shapes reality itself.',
        requiredSkills: [
            { skill: 'magic', threshold: 500 },
            { skill: 'restoration', threshold: 500 },
        ],
        category: 'mages',
        color: '#5b8fd4',
    },
    {
        id: 'the_ashguard',
        name: 'The Ashguard',
        icon: '⚔️',
        description: 'A warrior order defending the realm through martial prowess and discipline.',
        flavor: 'Steel tempered by duty and honor.',
        requiredSkills: [
            { skill: 'melee', threshold: 500 },
            { skill: 'defense', threshold: 500 },
        ],
        category: 'fighters',
        color: '#c06060',
    },
    {
        id: 'the_veil_syndicate',
        name: 'The Veil Syndicate',
        icon: '🌑',
        description: 'A shadow network of skilled operatives working in the margins.',
        flavor: 'Unseen, unheard, unforgotten.',
        requiredSkills: [
            { skill: 'ranged', threshold: 500 },
            { skill: 'stealth', threshold: 500 },
        ],
        category: 'thieves',
        color: '#9b6bd4',
    },
];

// Guild rank progression
const GUILD_RANKS = [
    { rank: 0, title: 'Initiate',  minRep: 0,    maxRep: 99,   color: '#444', icon: '○' },
    { rank: 1, title: 'Adept',     minRep: 100,  maxRep: 299,  color: '#4a9e6b', icon: '◐' },
    { rank: 2, title: 'Disciple',  minRep: 300,  maxRep: 699,  color: '#4a9edb', icon: '◑' },
    { rank: 3, title: 'Veteran',   minRep: 700,  maxRep: 1499, color: '#c9a84c', icon: '◕' },
    { rank: 4, title: 'Elite',     minRep: 1500, maxRep: 2999, color: '#c06060', icon: '◔' },
    { rank: 5, title: 'Master',    minRep: 3000, maxRep: Infinity, color: '#9b6bd4', icon: '●' },
];

// Core perks that unlock by rank (all guild members get these)
const GUILD_CORE_PERKS = {
    the_black_sigil: [
        // Rank 0: Initiate
        { rank: 0, bonusType: 'xpMultiplier', skill: 'magic', amount: 0.1, label: '+10% Magic XP' },
        { rank: 0, bonusType: 'questSuccessChance', amount: 0.05, label: '+5% Quest Success' },
        // Rank 1: Adept
        { rank: 1, bonusType: 'xpMultiplier', skill: 'magic', amount: 0.15, label: '+15% Magic XP' },
        { rank: 1, bonusType: 'questSuccessChance', amount: 0.1, label: '+10% Quest Success' },
        { rank: 1, bonusType: 'manaRegen', amount: 0.1, label: '+10% Mana Regen' },
        // Rank 2: Disciple
        { rank: 2, bonusType: 'xpMultiplier', skill: 'magic', amount: 0.2, label: '+20% Magic XP' },
        { rank: 2, bonusType: 'questSuccessChance', amount: 0.15, label: '+15% Quest Success' },
        { rank: 2, bonusType: 'manaRegen', amount: 0.15, label: '+15% Mana Regen' },
        { rank: 2, bonusType: 'guildQuestRarity', amount: 1, label: 'Access to Rare Quests' },
        // Rank 3: Veteran
        { rank: 3, bonusType: 'xpMultiplier', skill: 'magic', amount: 0.25, label: '+25% Magic XP' },
        { rank: 3, bonusType: 'questSuccessChance', amount: 0.2, label: '+20% Quest Success' },
        { rank: 3, bonusType: 'manaRegen', amount: 0.2, label: '+20% Mana Regen' },
        { rank: 3, bonusType: 'chestTierBonus', amount: 1, label: '+1 Chest Tier' },
        // Rank 4: Elite
        { rank: 4, bonusType: 'xpMultiplier', skill: 'magic', amount: 0.3, label: '+30% Magic XP' },
        { rank: 4, bonusType: 'questSuccessChance', amount: 0.25, label: '+25% Quest Success' },
        { rank: 4, bonusType: 'manaRegen', amount: 0.25, label: '+25% Mana Regen' },
        { rank: 4, bonusType: 'chestTierBonus', amount: 1, label: '+1 Chest Tier' },
        // Rank 5: Master
        { rank: 5, bonusType: 'xpMultiplier', skill: 'magic', amount: 0.4, label: '+40% Magic XP' },
        { rank: 5, bonusType: 'questSuccessChance', amount: 0.3, label: '+30% Quest Success' },
        { rank: 5, bonusType: 'manaRegen', amount: 0.3, label: '+30% Mana Regen' },
        { rank: 5, bonusType: 'chestTierBonus', amount: 2, label: '+2 Chest Tier' },
    ],
    the_ashguard: [
        // Rank 0: Initiate
        { rank: 0, bonusType: 'xpMultiplier', skill: 'melee', amount: 0.1, label: '+10% Melee XP' },
        { rank: 0, bonusType: 'questSuccessChance', amount: 0.05, label: '+5% Quest Success' },
        // Rank 1: Adept
        { rank: 1, bonusType: 'xpMultiplier', skill: 'melee', amount: 0.15, label: '+15% Melee XP' },
        { rank: 1, bonusType: 'questSuccessChance', amount: 0.1, label: '+10% Quest Success' },
        { rank: 1, bonusType: 'staminaRegen', amount: 0.1, label: '+10% Stamina Regen' },
        // Rank 2: Disciple
        { rank: 2, bonusType: 'xpMultiplier', skill: 'melee', amount: 0.2, label: '+20% Melee XP' },
        { rank: 2, bonusType: 'questSuccessChance', amount: 0.15, label: '+15% Quest Success' },
        { rank: 2, bonusType: 'staminaRegen', amount: 0.15, label: '+15% Stamina Regen' },
        { rank: 2, bonusType: 'guildQuestRarity', amount: 1, label: 'Access to Rare Quests' },
        // Rank 3: Veteran
        { rank: 3, bonusType: 'xpMultiplier', skill: 'melee', amount: 0.25, label: '+25% Melee XP' },
        { rank: 3, bonusType: 'questSuccessChance', amount: 0.2, label: '+20% Quest Success' },
        { rank: 3, bonusType: 'staminaRegen', amount: 0.2, label: '+20% Stamina Regen' },
        { rank: 3, bonusType: 'chestTierBonus', amount: 1, label: '+1 Chest Tier' },
        // Rank 4: Elite
        { rank: 4, bonusType: 'xpMultiplier', skill: 'melee', amount: 0.3, label: '+30% Melee XP' },
        { rank: 4, bonusType: 'questSuccessChance', amount: 0.25, label: '+25% Quest Success' },
        { rank: 4, bonusType: 'staminaRegen', amount: 0.25, label: '+25% Stamina Regen' },
        { rank: 4, bonusType: 'chestTierBonus', amount: 1, label: '+1 Chest Tier' },
        // Rank 5: Master
        { rank: 5, bonusType: 'xpMultiplier', skill: 'melee', amount: 0.4, label: '+40% Melee XP' },
        { rank: 5, bonusType: 'questSuccessChance', amount: 0.3, label: '+30% Quest Success' },
        { rank: 5, bonusType: 'staminaRegen', amount: 0.3, label: '+30% Stamina Regen' },
        { rank: 5, bonusType: 'chestTierBonus', amount: 2, label: '+2 Chest Tier' },
    ],
    the_veil_syndicate: [
        // Rank 0: Initiate
        { rank: 0, bonusType: 'xpMultiplier', skill: 'stealth', amount: 0.1, label: '+10% Stealth XP' },
        { rank: 0, bonusType: 'questSuccessChance', amount: 0.05, label: '+5% Quest Success' },
        // Rank 1: Adept
        { rank: 1, bonusType: 'xpMultiplier', skill: 'stealth', amount: 0.15, label: '+15% Stealth XP' },
        { rank: 1, bonusType: 'questSuccessChance', amount: 0.1, label: '+10% Quest Success' },
        { rank: 1, bonusType: 'energyRegen', amount: 0.1, label: '+10% Energy Regen' },
        // Rank 2: Disciple
        { rank: 2, bonusType: 'xpMultiplier', skill: 'stealth', amount: 0.2, label: '+20% Stealth XP' },
        { rank: 2, bonusType: 'questSuccessChance', amount: 0.15, label: '+15% Quest Success' },
        { rank: 2, bonusType: 'energyRegen', amount: 0.15, label: '+15% Energy Regen' },
        { rank: 2, bonusType: 'guildQuestRarity', amount: 1, label: 'Access to Rare Quests' },
        // Rank 3: Veteran
        { rank: 3, bonusType: 'xpMultiplier', skill: 'stealth', amount: 0.25, label: '+25% Stealth XP' },
        { rank: 3, bonusType: 'questSuccessChance', amount: 0.2, label: '+20% Quest Success' },
        { rank: 3, bonusType: 'energyRegen', amount: 0.2, label: '+20% Energy Regen' },
        { rank: 3, bonusType: 'chestTierBonus', amount: 1, label: '+1 Chest Tier' },
        // Rank 4: Elite
        { rank: 4, bonusType: 'xpMultiplier', skill: 'stealth', amount: 0.3, label: '+30% Stealth XP' },
        { rank: 4, bonusType: 'questSuccessChance', amount: 0.25, label: '+25% Quest Success' },
        { rank: 4, bonusType: 'energyRegen', amount: 0.25, label: '+25% Energy Regen' },
        { rank: 4, bonusType: 'chestTierBonus', amount: 1, label: '+1 Chest Tier' },
        // Rank 5: Master
        { rank: 5, bonusType: 'xpMultiplier', skill: 'stealth', amount: 0.4, label: '+40% Stealth XP' },
        { rank: 5, bonusType: 'questSuccessChance', amount: 0.3, label: '+30% Quest Success' },
        { rank: 5, bonusType: 'energyRegen', amount: 0.3, label: '+30% Energy Regen' },
        { rank: 5, bonusType: 'chestTierBonus', amount: 2, label: '+2 Chest Tier' },
    ],
};

// Helper functions
function getGuild(guildId) {
    return GUILDS.find(g => g.id === guildId);
}

function getGuildByCategory(category) {
    return GUILDS.find(g => g.category === category);
}

function getGuildRank(reputation) {
    return GUILD_RANKS.find(r => reputation >= r.minRep && reputation <= r.maxRep) || GUILD_RANKS[0];
}

function getNextGuildRank(currentRank) {
    const nextIdx = currentRank.rank + 1;
    return GUILD_RANKS[nextIdx] || null;
}

function getGuildCorePerks(guildId, rank) {
    const perks = GUILD_CORE_PERKS[guildId] || [];
    return perks.filter(p => p.rank <= rank);
}

function canJoinGuild(guildId, playerSkills) {
    const guild = getGuild(guildId);
    if (!guild) return false;

    return guild.requiredSkills.every(req => {
        const skillValue = playerSkills[req.skill] || 0;
        return skillValue >= req.threshold;
    });
}
