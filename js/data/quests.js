// js/data/quests.js
// Quest definitions across 5 tiers. Each quest has a single primary skill check.
// All 'required' values are EFFECTIVE skill (not raw) — see PlayerSystem.getEffectiveSkill().
// At exactly the required effective skill → 75% success chance.
// At ~1.3× required effective skill → 95% cap.
//
// Effective skill formula: floor(raw × 0.35 + √raw × 6)
//   Raw 15   → eff ~28    (Tier 1 content)
//   Raw 100  → eff ~95    (Tier 2 content)
//   Raw 400  → eff ~259   (Tier 3 content)
//   Raw 1500 → eff ~757   (Tier 4 content)
//   Raw 4000 → eff ~1779  (Tier 5 content)
//
// Gold rewards are [min, max] — a random value in range is awarded on success.
// Duration is in seconds (real-time idle-MMO scale).
//
// Tier 1 — 5–10 minutes
// Tier 2 — 15–30 minutes
// Tier 3 — 45–75 minutes
// Tier 4 — 2–3.5 hours
// Tier 5 — 6–12 hours

const QUESTS = [

    // ── TIER 1 — Novice (0–100 skill) ─────────────────────────────────────────

    {
        id: 'bandit_ambush',
        tier: 1,
        name: 'Bandit Ambush',
        description: 'Outlaws have been hitting trade caravans on the eastern road. A merchant is offering coin to clear them out.',
        lore: 'The road east has been cut for three weeks. The nearest settlement is starting to feel it.',
        skillCheck: { skill: 'melee', required: 28 },
        duration: 360,          // 6 minutes
        goldReward: { min: 10, max: 30 },
        chestReward: { tier: 1, count: 1 },
    },
    {
        id: 'shadow_informant',
        tier: 1,
        name: 'Shadow the Informant',
        description: 'Someone is feeding troop positions to the Iron Dominion. Follow them without being seen and confirm their identity.',
        lore: 'Every faction capital has more eyes in it than most people realise.',
        skillCheck: { skill: 'stealth', required: 28 },
        duration: 480,          // 8 minutes
        goldReward: { min: 12, max: 35 },
        chestReward: { tier: 1, count: 1 },
    },
    {
        id: 'rift_edge_recon',
        tier: 1,
        name: 'Rift Edge Recon',
        description: 'A Covenant observer wants fresh eyes on a small rift south of the city. Get close, note its size, and come back.',
        lore: 'The rifts have been expanding. Slowly, but steadily.',
        skillCheck: { skill: 'ranged', required: 28 },
        duration: 420,          // 7 minutes
        goldReward: { min: 12, max: 32 },
        chestReward: { tier: 1, count: 1 },
    },
    {
        id: 'gather_reagents',
        tier: 1,
        name: 'Gather Reagents',
        description: 'An alchemist needs rare herbs from the outskirts of the city. They grow near the rift boundaries — handle with care.',
        lore: 'Rift-touched plants are dangerous. They\'re also valuable.',
        skillCheck: { skill: 'alchemy', required: 22 },
        duration: 300,          // 5 minutes
        goldReward: { min: 8, max: 22 },
        chestReward: { tier: 1, count: 1 },
    },
    {
        id: 'patrol_wall',
        tier: 1,
        name: 'Patrol the Wall',
        description: 'The city watch is short-handed. Walk the southern wall for a shift and report anything unusual.',
        lore: 'Three guards quit last week after seeing something near the rift. The watch doesn\'t talk about what.',
        skillCheck: { skill: 'defense', required: 24 },
        duration: 360,          // 6 minutes
        goldReward: { min: 10, max: 25 },
        chestReward: { tier: 1, count: 1 },
    },

    // ── TIER 2 — Apprentice (100–500 skill) ───────────────────────────────────

    {
        id: 'dominion_deserters',
        tier: 2,
        name: 'Dominion Deserters',
        description: 'A squad of Iron Dominion soldiers has gone rogue. They\'ve barricaded themselves in a farmhouse and won\'t leave alive.',
        lore: 'The Dominion\'s discipline slips the further from command you get.',
        skillCheck: { skill: 'melee', required: 95 },
        duration: 900,          // 15 minutes
        goldReward: { min: 50, max: 100 },
        chestReward: { tier: 2, count: 1 },
    },
    {
        id: 'intercept_message',
        tier: 2,
        name: 'Intercept the Message',
        description: 'A courier is carrying sealed orders between two faction officers. Take the message without anyone knowing it\'s gone.',
        lore: 'What gets written down tends to be more honest than what gets said aloud.',
        skillCheck: { skill: 'stealth', required: 95 },
        duration: 1350,         // 22.5 minutes
        goldReward: { min: 60, max: 120 },
        chestReward: { tier: 2, count: 1 },
    },
    {
        id: 'covenant_errand',
        tier: 2,
        name: 'The Covenant\'s Errand',
        description: 'Retrieve a spellbound container from a site near a rift. The Covenant won\'t say what\'s inside. They\'ll pay well not to be asked.',
        lore: 'Ashen Covenant researchers are careful people. If they\'re paying someone else to collect it, it\'s probably cursed.',
        skillCheck: { skill: 'magic', required: 95 },
        duration: 1800,         // 30 minutes
        goldReward: { min: 70, max: 130 },
        chestReward: { tier: 2, count: 1 },
    },
    {
        id: 'fortify_outpost',
        tier: 2,
        name: 'Fortify the Outpost',
        description: 'An outpost on the border of the central ruins needs reinforcing before the next demon surge hits. Get it done.',
        lore: 'The outpost has been overrun twice already. Third time, someone decided to hire competent people.',
        skillCheck: { skill: 'defense', required: 95 },
        duration: 1200,         // 20 minutes
        goldReward: { min: 55, max: 110 },
        chestReward: { tier: 2, count: 1 },
    },
    {
        id: 'heal_the_wounded',
        tier: 2,
        name: 'Treat the Wounded',
        description: 'A field camp near the ruins is overwhelmed. Work through the night stabilising the badly injured before more fighting begins.',
        lore: 'Restoration magic is rare enough that people beg for it. The pay reflects that.',
        skillCheck: { skill: 'restoration', required: 88 },
        duration: 1350,         // 22.5 minutes
        goldReward: { min: 60, max: 115 },
        chestReward: { tier: 2, count: 1 },
    },

    // ── TIER 3 — Journeyman (500–2000 skill) ──────────────────────────────────

    {
        id: 'demon_breach',
        tier: 3,
        name: 'Demon Breach',
        description: 'A rift has cracked open near the old granary. Demons are pouring through in numbers. Push them back and hold the line.',
        lore: 'This is what most of the early war looked like. It\'s no easier the second time.',
        skillCheck: { skill: 'melee', required: 260 },
        duration: 2700,         // 45 minutes
        goldReward: { min: 150, max: 300 },
        chestReward: { tier: 3, count: 1 },
    },
    {
        id: 'behind_enemy_lines',
        tier: 3,
        name: 'Behind Enemy Lines',
        description: 'Slip through Thornwood territory, reach the central ruins, and retrieve a specific object from a guarded location.',
        lore: 'The Thornwood don\'t take trespassing lightly. They\'ve hanged people for less.',
        skillCheck: { skill: 'stealth', required: 260 },
        duration: 3600,         // 60 minutes
        goldReward: { min: 175, max: 350 },
        chestReward: { tier: 3, count: 1 },
    },
    {
        id: 'rift_research',
        tier: 3,
        name: 'Rift Research',
        description: 'Enter the rift boundary and observe what the Covenant\'s instruments can\'t measure from the outside. Do not let anything follow you back.',
        lore: 'The Ashen Covenant has lost three researchers this way. They keep sending more.',
        skillCheck: { skill: 'magic', required: 285 },
        duration: 4500,         // 75 minutes
        goldReward: { min: 200, max: 400 },
        chestReward: { tier: 3, count: 1 },
    },
    {
        id: 'wounded_district',
        tier: 3,
        name: 'The Wounded District',
        description: 'An entire district near the ruins has been contaminated by rift energy. Clear the corruption before it spreads.',
        lore: 'Rift corruption is slow, patient, and thorough. Like everything from the underworld.',
        skillCheck: { skill: 'restoration', required: 270 },
        duration: 3600,         // 60 minutes
        goldReward: { min: 180, max: 360 },
        chestReward: { tier: 3, count: 1 },
    },

    // ── TIER 4 — Expert (2000–5000 skill) ─────────────────────────────────────

    {
        id: 'rift_walker',
        tier: 4,
        name: 'The Rift Walker',
        description: 'A greater demon has been slipping through a rift and hunting inside the city walls. Track it. Kill it. Do not let it reach the market district.',
        lore: 'It has already killed six. The watch doesn\'t know what it\'s fighting.',
        skillCheck: { skill: 'melee', required: 757 },
        duration: 7200,         // 2 hours
        goldReward: { min: 400, max: 700 },
        chestReward: { tier: 4, count: 1 },
    },
    {
        id: 'war_council',
        tier: 4,
        name: 'Silence the War Council',
        description: 'The Iron Dominion\'s generals are meeting to finalise an offensive push into the ruins. Stop the order before it\'s signed. No witnesses.',
        lore: 'A Dominion offensive would destabilise everything. All three factions know it. Only one is paying to stop it.',
        skillCheck: { skill: 'stealth', required: 757 },
        duration: 9600,         // 2h 40m
        goldReward: { min: 450, max: 800 },
        chestReward: { tier: 4, count: 1 },
    },
    {
        id: 'seal_minor_rift',
        tier: 4,
        name: 'Seal the Minor Rift',
        description: 'A minor rift on the eastern edge can still be closed — the tear is fresh enough. Use everything you know to seal it before it widens.',
        lore: 'Aidia\'s ritual opened a hundred rifts. This is the only one anyone\'s managed to close.',
        skillCheck: { skill: 'magic', required: 884 },
        duration: 12000,        // 3h 20m
        goldReward: { min: 500, max: 900 },
        chestReward: { tier: 4, count: 1 },
    },
    {
        id: 'hold_the_gate',
        tier: 4,
        name: 'Hold the Gate',
        description: 'A major demon surge is incoming. Hold the city gate for the night with whatever force you can muster.',
        lore: 'Six hours. Every time someone says they\'ll hold for six hours, the survivors stop counting at four.',
        skillCheck: { skill: 'defense', required: 884 },
        duration: 10800,        // 3 hours
        goldReward: { min: 475, max: 850 },
        chestReward: { tier: 4, count: 1 },
    },

    // ── TIER 5 — Master (5000+ skill) ─────────────────────────────────────────

    {
        id: 'aidias_echo',
        tier: 5,
        name: 'Aidia\'s Echo',
        description: 'Something wearing Aidia\'s face has been seen in the ruins of the capital. It is not Aidia — Aidia died with the ritual. Whatever it is, it needs to be ended.',
        lore: 'The ritual consumed him. But something learned from him first.',
        skillCheck: { skill: 'melee', required: 1779 },
        duration: 21600,        // 6 hours
        goldReward: { min: 800, max: 1500 },
        chestReward: { tier: 5, count: 1 },
    },
    {
        id: 'grand_rift',
        tier: 5,
        name: 'The Grand Rift',
        description: 'The main rift — the one Aidia\'s ritual tore open — can be sealed. The process will unmake anything standing inside it when it closes. Go anyway.',
        lore: 'Closing it won\'t bring the empire back. But it will stop the bleeding.',
        skillCheck: { skill: 'magic', required: 1977 },
        duration: 43200,        // 12 hours
        goldReward: { min: 1000, max: 2000 },
        chestReward: { tier: 5, count: 1 },
    },
    {
        id: 'purge_ruins',
        tier: 5,
        name: 'Purge the Capital Ruins',
        description: 'The ruins of Golden Ambrosia\'s capital are overrun. Clear every demon from every corridor. Reclaim what the empire lost.',
        lore: 'The capital was the most beautiful city on Alaia. It is now the worst place on it.',
        skillCheck: { skill: 'defense', required: 1779 },
        duration: 43200,        // 12 hours
        goldReward: { min: 900, max: 1800 },
        chestReward: { tier: 5, count: 1 },
    },
];
