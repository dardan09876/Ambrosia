// js/data/guildQuestTemplates.js
// Guild-specific quest templates for dynamic quest generation

const GUILD_QUEST_TEMPLATES = [
    // ── THE BLACK SIGIL (Mages Guild) ────────────────────────────────────────

    // Rift Caller focused quests
    {
        id: 'seal_fractured_gate',
        guild: 'the_black_sigil',
        name: 'Seal a Fractured Gate',
        category: 'ritual',
        description: 'A tear in reality threatens to expand. Seal it with arcane force.',
        preferredSkills: ['magic', 'defense'],
        classWeight: { 'rift_caller': 60, 'veil_keeper': 30 },
        locationVariants: ['ruined shrine', 'shattered archive', 'corrupted sanctum'],
        difficultyBase: 0.9,
    },
    {
        id: 'stabilize_breach',
        guild: 'the_black_sigil',
        name: 'Stabilize the Breach',
        category: 'stabilization',
        description: 'Rift-touched energy destabilizes the natural world. Restore balance.',
        preferredSkills: ['magic', 'stealth'],
        classWeight: { 'rift_caller': 70, 'veil_keeper': 35 },
        locationVariants: ['dimensional fissure', 'twisted vale', 'fractured plane'],
        difficultyBase: 0.85,
    },
    {
        id: 'recover_forbidden_tome',
        guild: 'the_black_sigil',
        name: 'Recover a Forbidden Tome',
        category: 'recovery',
        description: 'A dangerous magical text lies hidden where others fear to tread.',
        preferredSkills: ['magic', 'stealth'],
        classWeight: { 'rift_caller': 65, 'veil_keeper': 50 },
        locationVariants: ['ruined library', 'sealed vault', 'haunted archive'],
        difficultyBase: 0.95,
    },

    // Veil Keeper focused quests
    {
        id: 'cleanse_desecrated',
        guild: 'the_black_sigil',
        name: 'Cleanse a Desecrated Shrine',
        category: 'cleansing',
        description: 'A sacred place has been fouled by corruption. Restore its sanctity.',
        preferredSkills: ['restoration', 'defense'],
        classWeight: { 'veil_keeper': 70, 'rift_caller': 30 },
        locationVariants: ['forgotten chapel', 'corrupted sanctuary', 'desecrated temple'],
        difficultyBase: 0.8,
    },
    {
        id: 'ward_convergence',
        guild: 'the_black_sigil',
        name: 'Ward a Dangerous Convergence',
        category: 'warding',
        description: 'Multiple rift points converge. Create protective wards before disaster strikes.',
        preferredSkills: ['restoration', 'stealth'],
        classWeight: { 'veil_keeper': 65, 'rift_caller': 35 },
        locationVariants: ['convergence point', 'fractured crossroads', 'volatile junction'],
        difficultyBase: 1.0,
    },
    {
        id: 'purge_corruption',
        guild: 'the_black_sigil',
        name: 'Purge Lingering Corruption',
        category: 'purification',
        description: 'Rift-touched blight spreads. Cleanse the tainted earth.',
        preferredSkills: ['restoration', 'magic'],
        classWeight: { 'veil_keeper': 75, 'rift_caller': 40 },
        locationVariants: ['blighted grove', 'corrupted field', 'festering ruin'],
        difficultyBase: 0.88,
    },

    // ── THE ASHGUARD (Fighters Guild) ───────────────────────────────────────

    // Ironbound focused quests
    {
        id: 'defend_outpost',
        guild: 'the_ashguard',
        name: 'Defend an Outpost',
        category: 'defense',
        description: 'Hostile forces are closing in. Hold the line.',
        preferredSkills: ['melee', 'defense'],
        classWeight: { 'ironbound': 75, 'shade': 30 },
        locationVariants: ['border outpost', 'fortified tower', 'military bastion'],
        difficultyBase: 0.95,
    },
    {
        id: 'hunt_demonic_beast',
        guild: 'the_ashguard',
        name: 'Hunt a Demonic Beast',
        category: 'hunt',
        description: 'A powerful creature from the rifts hunts nearby settlements.',
        preferredSkills: ['melee', 'restoration'],
        classWeight: { 'ironbound': 70, 'shade': 35 },
        locationVariants: ['wilderness outskirts', 'blighted forest', 'demon-touched ruins'],
        difficultyBase: 1.1,
    },
    {
        id: 'fortify_position',
        guild: 'the_ashguard',
        name: 'Fortify a Defensive Position',
        category: 'fortification',
        description: 'Reinforce a weak defensive line before the next surge.',
        preferredSkills: ['defense', 'melee'],
        classWeight: { 'ironbound': 80, 'shade': 25 },
        locationVariants: ['strategic position', 'damaged fort', 'broken wall'],
        difficultyBase: 0.85,
    },

    // Shade focused quests (in fighters guild context)
    {
        id: 'assassinate_commander',
        guild: 'the_ashguard',
        name: 'Eliminate Enemy Command',
        category: 'assassination',
        description: 'A key enemy commander threatens our forces. Remove them.',
        preferredSkills: ['melee', 'stealth'],
        classWeight: { 'shade': 75, 'ironbound': 40 },
        locationVariants: ['enemy encampment', 'command tent', 'war room'],
        difficultyBase: 1.05,
    },
    {
        id: 'sabotage_supplies',
        guild: 'the_ashguard',
        name: 'Sabotage Enemy Supply Lines',
        category: 'sabotage',
        description: 'Disrupt hostile logistics to weaken their fighting strength.',
        preferredSkills: ['stealth', 'ranged'],
        classWeight: { 'shade': 70, 'ironbound': 35 },
        locationVariants: ['supply depot', 'transport route', 'quartermaster post'],
        difficultyBase: 0.9,
    },

    // ── THE VEIL SYNDICATE (Thieves Guild) ──────────────────────────────────

    // Shade focused quests
    {
        id: 'shadow_infiltration',
        guild: 'the_veil_syndicate',
        name: 'Infiltrate Hostile Territory',
        category: 'infiltration',
        description: 'Move unseen through dangerous lands to gather intelligence.',
        preferredSkills: ['stealth', 'ranged'],
        classWeight: { 'shade': 80, 'wilder': 50 },
        locationVariants: ['enemy territory', 'hostile fortress', 'patrol route'],
        difficultyBase: 0.95,
    },
    {
        id: 'steal_artifact',
        guild: 'the_veil_syndicate',
        name: 'Steal a Precious Artifact',
        category: 'theft',
        description: 'A valuable item is heavily guarded. Acquire it without getting caught.',
        preferredSkills: ['stealth', 'melee'],
        classWeight: { 'shade': 75, 'wilder': 40 },
        locationVariants: ['guarded vault', 'noble manor', 'merchant caravan'],
        difficultyBase: 1.0,
    },
    {
        id: 'shadow_elimination',
        guild: 'the_veil_syndicate',
        name: 'Eliminate a Target',
        category: 'assassination',
        description: 'Someone has marked a target for removal. Get it done quietly.',
        preferredSkills: ['stealth', 'ranged'],
        classWeight: { 'shade': 85, 'wilder': 45 },
        locationVariants: ['public square', 'private residence', 'secret meeting'],
        difficultyBase: 1.05,
    },

    // Wilder focused quests
    {
        id: 'precision_strike',
        guild: 'the_veil_syndicate',
        name: 'Execute a Precision Strike',
        category: 'infiltration',
        description: 'Eliminate a target with accuracy and subtlety.',
        preferredSkills: ['ranged', 'stealth'],
        classWeight: { 'wilder': 75, 'shade': 50 },
        locationVariants: ['rooftop nest', 'hidden vantage point', 'covered position'],
        difficultyBase: 0.93,
    },
    {
        id: 'cargo_heist',
        guild: 'the_veil_syndicate',
        name: 'Intercept Valuable Cargo',
        category: 'theft',
        description: 'Valuable goods are in transit. Acquire them and disappear.',
        preferredSkills: ['ranged', 'stealth'],
        classWeight: { 'wilder': 80, 'shade': 55 },
        locationVariants: ['trade road', 'merchant route', 'caravan path'],
        difficultyBase: 0.88,
    },
    {
        id: 'smuggling_run',
        guild: 'the_veil_syndicate',
        name: 'Run a Smuggling Operation',
        category: 'smuggling',
        description: 'Move forbidden goods through hostile territory without detection.',
        preferredSkills: ['stealth', 'ranged'],
        classWeight: { 'wilder': 70, 'shade': 60 },
        locationVariants: ['checkpoint', 'patrol area', 'border region'],
        difficultyBase: 0.85,
    },
];

// Helper function to get templates for a guild
function getGuildQuestTemplates(guildId) {
    return GUILD_QUEST_TEMPLATES.filter(t => t.guild === guildId);
}
