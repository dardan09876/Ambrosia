// js/data/factions.js
// Three rival factions that rose from the ashes of the Golden Ambrosia empire.
// Each controls a distant corner of Alaia and now pushes into the shattered central region.

const FACTIONS = [
    {
        id: 'iron_dominion',
        name: 'The Iron Dominion',
        tagline: 'The empire fell. We will raise it again.',
        description: 'The eastern remnants of the imperial military — generals, warlords, and loyalists who refused to let the empire die. When the capital was destroyed and the rifts tore open, they retreated east and rebuilt under iron law. Now they march back toward the ruins, believing only a restored empire can hold the demon tide.',
        lore: 'Their camps are disciplined. Their justice is brutal. But of the three factions, only the Dominion has faced the demons in open battle — and held the line.',
        skillBonuses: { melee: 5, defense: 5 },
        color: '#6b1a1a',
        accentColor: '#c04040',
        icon: '⚔',
        territory: 'The Eastern Reaches',
    },
    {
        id: 'ashen_covenant',
        name: 'The Ashen Covenant',
        tagline: 'We study what others fear to name.',
        description: 'Scholars and mages who trained alongside Aidia — but refused his final act. When the ritual consumed the capital and split Alaia\'s crust open, the Covenant retreated to the ash-choked towers of the north to study what had been unleashed. They believe the rifts can be understood. Perhaps controlled.',
        lore: 'They do not worship the demons. But some within their order have begun to sound dangerously like they do.',
        skillBonuses: { magic: 5, alchemy: 5 },
        color: '#3a1560',
        accentColor: '#9b6bd4',
        icon: '✦',
        territory: 'The Northern Ashlands',
    },
    {
        id: 'thornwood',
        name: 'The Thornwood',
        tagline: 'No emperor. No mages. Just land and the right to hold it.',
        description: 'The survivors — farmers, hunters, laborers, and soldiers who abandoned the cities when the empire collapsed. They fled west into the deep forests and built something the empire never had: a society of free people. Now they push east toward the ruined capital, not to restore an empire, but to make sure no one else does.',
        lore: 'They have no throne and no towers. What they have is memory — of what the empire cost them — and the will to make sure it is never paid again.',
        skillBonuses: { ranged: 5, stealth: 5 },
        color: '#1a3d20',
        accentColor: '#4a9e6b',
        icon: '◈',
        territory: 'The Western Forests',
    },
];
