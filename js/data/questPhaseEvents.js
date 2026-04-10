// js/data/questPhaseEvents.js
// Narrative events that fire at the end of each quest phase.
// Each event: id, title, logIntro, logSuccess[], logFailure[],
//   difficultyMod (factor applied to quest.skillCheck.required),
//   successEffect/failureEffect: { rewardMod } (additive to rewardMultiplier).

// ── Phase name sets by skill ──────────────────────────────────────────────────
const QUEST_PHASE_NAMES = {
    melee:       ['March',     'Engage',    'Clash',     'Withdraw'],
    stealth:     ['Approach',  'Infiltrate','Objective', 'Extract'],
    ranged:      ['Scout',     'Position',  'Engage',    'Fall Back'],
    magic:       ['Commune',   'Channel',   'Manifest',  'Seal'],
    defense:     ['Deploy',    'Hold',      'Endure',    'Secure'],
    restoration: ['Reach',     'Assess',    'Treat',     'Return'],
};

// ── Event pools by skill ──────────────────────────────────────────────────────
const QUEST_PHASE_EVENTS = {

    melee: [
        {
            id: 'skirmish',
            title: 'Skirmish',
            logIntro: 'A small enemy patrol intercepts your approach.',
            logSuccess: [
                'You cut through the patrol with efficient aggression.',
                'The path clears. You press on without losing pace.',
            ],
            logFailure: [
                'The skirmish drags longer than expected.',
                'You take a hit but push through. Progress delayed.',
            ],
            difficultyMod: 0.9,
            successEffect: { rewardMod: 0.10 },
            failureEffect:  { rewardMod: -0.10 },
        },
        {
            id: 'ambush',
            title: 'Ambush',
            logIntro: 'Enemies strike from the flanks without warning.',
            logSuccess: [
                'Your instincts snap into place. The ambush breaks against your blade.',
                'Two down. The rest scatter.',
            ],
            logFailure: [
                'The ambush catches you off-guard.',
                'You fight clear of it, but the damage is done.',
            ],
            difficultyMod: 1.10,
            successEffect: { rewardMod: 0.15 },
            failureEffect:  { rewardMod: -0.15 },
        },
        {
            id: 'duel',
            title: "Champion's Challenge",
            logIntro: 'An enemy commander steps forward and demands single combat.',
            logSuccess: [
                'Steel meets steel. You read their footwork and find the opening.',
                'The commander falls. Their soldiers break.',
            ],
            logFailure: [
                'A punishing fight. You survive, but barely.',
                'The objective is still reachable — it will just cost more.',
            ],
            difficultyMod: 1.20,
            successEffect: { rewardMod: 0.20 },
            failureEffect:  { rewardMod: -0.20 },
        },
        {
            id: 'defensive_push',
            title: 'Fortified Position',
            logIntro: 'A hardened position blocks the route. You need to push through.',
            logSuccess: [
                'Disciplined aggression. The position collapses under sustained pressure.',
            ],
            logFailure: [
                'The push costs more than expected. You breach it, but slowly.',
            ],
            difficultyMod: 1.0,
            successEffect: { rewardMod: 0.10 },
            failureEffect:  { rewardMod: -0.10 },
        },
        {
            id: 'rearguard',
            title: 'Rearguard Action',
            logIntro: 'Pursuit forces close in on your withdrawal.',
            logSuccess: [
                'You hold the rearguard long enough for a clean break.',
                'No losses.',
            ],
            logFailure: [
                'The withdrawal turns messy.',
                'You lose time covering the gap.',
            ],
            difficultyMod: 0.95,
            successEffect: { rewardMod: 0.05 },
            failureEffect:  { rewardMod: -0.10 },
        },
    ],

    stealth: [
        {
            id: 'patrol_dodge',
            title: 'Patrol Route',
            logIntro: 'A guard rotation crosses your path at the worst moment.',
            logSuccess: [
                'You read the timing and slip past without a sound.',
            ],
            logFailure: [
                'A near miss. You abort the route and find another way around.',
                'It costs time.',
            ],
            difficultyMod: 0.9,
            successEffect: { rewardMod: 0.10 },
            failureEffect:  { rewardMod: -0.10 },
        },
        {
            id: 'watchdog',
            title: 'Trained Hound',
            logIntro: "A trained hound patrols the area. It's harder to fool than a soldier.",
            logSuccess: [
                'You move with the wind. The hound passes without reacting.',
            ],
            logFailure: [
                'The hound picks up something. The patrol doubles back.',
                'You buy time, but the window narrows.',
            ],
            difficultyMod: 1.10,
            successEffect: { rewardMod: 0.10 },
            failureEffect:  { rewardMod: -0.15 },
        },
        {
            id: 'eyes_on_target',
            title: 'Eyes on Target',
            logIntro: 'You have a clear line of sight. The question is whether they sense you watching.',
            logSuccess: [
                'You hold still and patient. The mark moves. You follow.',
            ],
            logFailure: [
                'A flicker of awareness. The target looks your direction.',
                'You pull back and wait.',
            ],
            difficultyMod: 1.0,
            successEffect: { rewardMod: 0.15 },
            failureEffect:  { rewardMod: -0.10 },
        },
        {
            id: 'extraction',
            title: 'Unseen Exit',
            logIntro: 'Getting out clean is as important as getting in.',
            logSuccess: [
                'You vanish before the alarm can be raised.',
            ],
            logFailure: [
                'Close. The alarm goes up behind you as you clear the perimeter.',
            ],
            difficultyMod: 0.95,
            successEffect: { rewardMod: 0.10 },
            failureEffect:  { rewardMod: -0.10 },
        },
        {
            id: 'shadow_passage',
            title: 'Shadow Passage',
            logIntro: 'A narrow corridor with no cover — just timing and nerve.',
            logSuccess: [
                'You time it perfectly. Four guards and none of them see you.',
            ],
            logFailure: [
                'One guard glances back at the wrong moment.',
                'You freeze and wait it out. Progress stalls.',
            ],
            difficultyMod: 1.15,
            successEffect: { rewardMod: 0.20 },
            failureEffect:  { rewardMod: -0.10 },
        },
    ],

    ranged: [
        {
            id: 'moving_target',
            title: 'Moving Target',
            logIntro: 'The objective is moving faster than expected.',
            logSuccess: [
                'You lead the target and release.',
                'Clean hit.',
            ],
            logFailure: [
                'The shot goes wide.',
                'You adjust position and track again.',
            ],
            difficultyMod: 1.10,
            successEffect: { rewardMod: 0.10 },
            failureEffect:  { rewardMod: -0.10 },
        },
        {
            id: 'cover_fire',
            title: 'Cover Fire',
            logIntro: 'Your allies are pinned. Suppress the enemy long enough for them to move.',
            logSuccess: [
                'Precise, controlled fire. The enemy breaks from position.',
                'The line advances.',
            ],
            logFailure: [
                'Not enough suppression to shift them.',
                'Progress stalls until another angle opens.',
            ],
            difficultyMod: 1.0,
            successEffect: { rewardMod: 0.10 },
            failureEffect:  { rewardMod: -0.10 },
        },
        {
            id: 'long_range',
            title: 'Extreme Range',
            logIntro: 'A priority target presents itself at the edge of effective range.',
            logSuccess: [
                'Wind. Breath. Release.',
                'The shot finds its mark.',
            ],
            logFailure: [
                'The distance defeats the attempt.',
                'You mark the position and adjust your approach.',
            ],
            difficultyMod: 1.30,
            successEffect: { rewardMod: 0.25 },
            failureEffect:  { rewardMod: 0.0 },
        },
        {
            id: 'counter_sniper',
            title: 'Counter-Sniper',
            logIntro: 'Someone out there has a bead on your position.',
            logSuccess: [
                'You spot the glint before they fire.',
                'One accurate shot and the threat ends.',
            ],
            logFailure: [
                'They pin you down.',
                'You relocate under fire. Lost ground, nothing worse.',
            ],
            difficultyMod: 1.20,
            successEffect: { rewardMod: 0.15 },
            failureEffect:  { rewardMod: -0.15 },
        },
        {
            id: 'signal_flare',
            title: 'Signal Flare',
            logIntro: 'An enemy is about to fire a signal flare and call reinforcements.',
            logSuccess: [
                'One shot. The flare drops before it lights.',
                'No alarm raised.',
            ],
            logFailure: [
                'The flare launches. Reinforcements are inbound.',
                'You complete the objective under pressure.',
            ],
            difficultyMod: 1.05,
            successEffect: { rewardMod: 0.15 },
            failureEffect:  { rewardMod: -0.15 },
        },
    ],

    magic: [
        {
            id: 'ward_disruption',
            title: 'Active Ward',
            logIntro: 'The area is shielded by an active ward that needs neutralising.',
            logSuccess: [
                'You trace the architecture of the ward and unravel it cleanly.',
            ],
            logFailure: [
                'The ward resists. You force a partial breach — enough to proceed, but not without cost.',
            ],
            difficultyMod: 1.0,
            successEffect: { rewardMod: 0.10 },
            failureEffect:  { rewardMod: -0.10 },
        },
        {
            id: 'rift_surge',
            title: 'Rift Surge',
            logIntro: 'A pocket of rift energy destabilises nearby — you need to contain it.',
            logSuccess: [
                'You redirect the surge through a controlled channel.',
                'Stable.',
            ],
            logFailure: [
                'The surge expands before you can contain it.',
                'You absorb the worst of it and push on.',
            ],
            difficultyMod: 1.15,
            successEffect: { rewardMod: 0.15 },
            failureEffect:  { rewardMod: -0.20 },
        },
        {
            id: 'counterspell',
            title: 'Enemy Caster',
            logIntro: 'An enemy practitioner intercepts you with an aggressive casting.',
            logSuccess: [
                'You read the structure of their spell and unmake it.',
                'They have nothing left.',
            ],
            logFailure: [
                'The spell hits. You weather it and respond.',
                'Costly, but they will not try again.',
            ],
            difficultyMod: 1.10,
            successEffect: { rewardMod: 0.15 },
            failureEffect:  { rewardMod: -0.15 },
        },
        {
            id: 'inscription',
            title: 'Difficult Inscription',
            logIntro: 'The objective requires precise arcane inscription under pressure.',
            logSuccess: [
                'Steady hands. The inscription holds.',
            ],
            logFailure: [
                'A flaw in the first attempt. You rework it — slower, but it sets.',
            ],
            difficultyMod: 0.9,
            successEffect: { rewardMod: 0.10 },
            failureEffect:  { rewardMod: -0.05 },
        },
        {
            id: 'corrupted_node',
            title: 'Corrupted Node',
            logIntro: 'A node of corrupted rift energy pulses at the heart of the problem.',
            logSuccess: [
                'You purge the corruption with a precise application of counter-energy.',
                'The node collapses cleanly.',
            ],
            logFailure: [
                'The corruption resists purging.',
                'You suppress it instead. Not elegant, but it holds.',
            ],
            difficultyMod: 1.20,
            successEffect: { rewardMod: 0.20 },
            failureEffect:  { rewardMod: -0.10 },
        },
    ],

    defense: [
        {
            id: 'wave_assault',
            title: 'Wave Assault',
            logIntro: 'A coordinated assault hits your position.',
            logSuccess: [
                'You weather the first wave. The second never comes.',
            ],
            logFailure: [
                'The assault breaks through on the second push.',
                'You fall back to a secondary position and hold.',
            ],
            difficultyMod: 1.10,
            successEffect: { rewardMod: 0.10 },
            failureEffect:  { rewardMod: -0.15 },
        },
        {
            id: 'flank_threat',
            title: 'Flank Threat',
            logIntro: 'A force attempts to roll around your position.',
            logSuccess: [
                'You reorient in time.',
                'The flank holds.',
            ],
            logFailure: [
                'The flank is compromised.',
                'You consolidate and hold the centre.',
            ],
            difficultyMod: 1.05,
            successEffect: { rewardMod: 0.10 },
            failureEffect:  { rewardMod: -0.10 },
        },
        {
            id: 'siege_point',
            title: 'Siege Point',
            logIntro: 'You need to hold a choke point against sustained pressure.',
            logSuccess: [
                'Inch by inch, you refuse to yield.',
                'The line holds.',
            ],
            logFailure: [
                'The pressure is relentless.',
                'You give ground but deny the objective.',
            ],
            difficultyMod: 1.20,
            successEffect: { rewardMod: 0.20 },
            failureEffect:  { rewardMod: -0.10 },
        },
        {
            id: 'escort_under_fire',
            title: 'Escort Under Fire',
            logIntro: 'You need to move someone through a contested zone.',
            logSuccess: [
                'Your body between them and the threat the whole way.',
                'Delivered safely.',
            ],
            logFailure: [
                'They take a graze.',
                'You complete the escort, but not cleanly.',
            ],
            difficultyMod: 1.0,
            successEffect: { rewardMod: 0.10 },
            failureEffect:  { rewardMod: -0.10 },
        },
        {
            id: 'last_stand',
            title: 'Last Stand',
            logIntro: 'Outnumbered and cut off. You hold until relief arrives — or you do not.',
            logSuccess: [
                'You hold.',
                'They come in waves and you turn all of them.',
                'Relief arrives to find the position intact.',
            ],
            logFailure: [
                'The numbers are too great.',
                'You break the encirclement but the position is lost.',
            ],
            difficultyMod: 1.30,
            successEffect: { rewardMod: 0.25 },
            failureEffect:  { rewardMod: -0.20 },
        },
    ],

    restoration: [
        {
            id: 'critical_wound',
            title: 'Critical Wound',
            logIntro: 'Someone has a wound that needs immediate attention or they will not last the hour.',
            logSuccess: [
                'You stabilise the worst of it.',
                'They will live.',
            ],
            logFailure: [
                'You do what you can.',
                'They stabilise, but not cleanly.',
            ],
            difficultyMod: 1.10,
            successEffect: { rewardMod: 0.15 },
            failureEffect:  { rewardMod: -0.10 },
        },
        {
            id: 'rift_infection',
            title: 'Rift Contamination',
            logIntro: 'Rift energy has entered the bloodstream. This is not a normal wound.',
            logSuccess: [
                'You draw the contamination out cleanly.',
                'Rare skill. They are stable.',
            ],
            logFailure: [
                'You slow the spread but cannot purge it entirely.',
                'Further treatment will be needed.',
            ],
            difficultyMod: 1.20,
            successEffect: { rewardMod: 0.20 },
            failureEffect:  { rewardMod: -0.15 },
        },
        {
            id: 'field_triage',
            title: 'Multiple Casualties',
            logIntro: 'More injured than expected. Hard choices about who to prioritise.',
            logSuccess: [
                'You work fast and triage correctly.',
                'All critical cases stabilised.',
            ],
            logFailure: [
                'One case slips past your reach.',
                'You save the others.',
            ],
            difficultyMod: 1.0,
            successEffect: { rewardMod: 0.10 },
            failureEffect:  { rewardMod: -0.10 },
        },
        {
            id: 'hostile_environment',
            title: 'Under Fire',
            logIntro: 'You need to work under active fire. The wound will not wait.',
            logSuccess: [
                'Calm hands despite the chaos.',
                'You get it done.',
            ],
            logFailure: [
                'The chaos makes precision impossible.',
                'Adequate, not optimal.',
            ],
            difficultyMod: 1.05,
            successEffect: { rewardMod: 0.10 },
            failureEffect:  { rewardMod: -0.05 },
        },
        {
            id: 'quarantine',
            title: 'Rift Quarantine',
            logIntro: 'Rift contamination has spread to a cluster of civilians. Contain it before it propagates.',
            logSuccess: [
                'You seal the affected area and treat every case.',
                'The spread stops here.',
            ],
            logFailure: [
                'You contain most of it.',
                'One vector slips through. The damage is limited.',
            ],
            difficultyMod: 1.15,
            successEffect: { rewardMod: 0.15 },
            failureEffect:  { rewardMod: -0.15 },
        },
    ],
};
