// js/data/origins.js
// Six starting backgrounds. Origins grant skill bonuses and starting gold.
// They suggest a playstyle without locking one in — this is a classless system.

const ORIGINS = [
    {
        id: 'sellsword',
        name: 'Sellsword',
        description: 'You spent years selling your blade to whoever paid the most. Combat is your native tongue.',
        skillBonuses: { melee: 10, defense: 5 },
        startingGold: 80,
        flavor: 'The roads have made you hard. Your sword has kept you alive.',
    },
    {
        id: 'hedge_mage',
        name: 'Hedge Mage',
        description: 'Self-taught in the arcane arts, your spells are crude but effective. You\'ve barely scratched the surface of what\'s possible.',
        skillBonuses: { magic: 10, restoration: 5 },
        startingGold: 60,
        flavor: 'Words of power whisper in your sleep. You just haven\'t learned to answer yet.',
    },
    {
        id: 'forest_scout',
        name: 'Forest Scout',
        description: 'Raised at the edge of the wilderness, you learned to track, hunt, and disappear before you learned to read.',
        skillBonuses: { ranged: 10, stealth: 5 },
        startingGold: 70,
        flavor: 'The dark is not your enemy. It\'s your home.',
    },
    {
        id: 'shadow_thief',
        name: 'Shadow Thief',
        description: 'You grew up in gutters and alleyways. You took what you needed, and you were never caught.',
        skillBonuses: { stealth: 10, ranged: 5 },
        startingGold: 100,
        flavor: 'The best lie is the one you told three weeks before you needed it.',
    },
    {
        id: 'battle_priest',
        name: 'Battle Priest',
        description: 'You served a god — or something that called itself one. You learned to heal and to punish in equal measure.',
        skillBonuses: { restoration: 10, defense: 5 },
        startingGold: 65,
        flavor: 'The holy texts never mentioned how much blood there would be.',
    },
    {
        id: 'wandering_smith',
        name: 'Wandering Smith',
        description: 'Forge-calloused hands and a keen eye for metal. You know how weapons are made — and how they break.',
        skillBonuses: { blacksmithing: 10, armorsmithing: 10 },
        startingGold: 90,
        flavor: 'Everything can be improved. You just need the right tools.',
    },
];
