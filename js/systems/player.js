// js/systems/player.js
// Manages the current player object. Single source of truth for player state.

// ── Corruption tier definitions ────────────────────────────────────────────────
// Tiers determine penalty severity and instability event frequency.
// Corruption is unbounded — it can grow past 180 indefinitely.
const CORRUPTION_TIERS = [
    {
        id: 'clean',     min: 0,   label: 'Clean',     color: '#4a9e6b',
        regenPenalties: {},
        desc: 'No corruption.',
    },
    {
        id: 'tainted',   min: 20,  label: 'Tainted',   color: '#c9a84c',
        regenPenalties: { health: 0.20 },
        desc: 'Minor instability. Health regen slightly slowed.',
    },
    {
        id: 'corrupted', min: 50,  label: 'Corrupted', color: '#c07830',
        regenPenalties: { health: 0.35, stamina: 0.10 },
        desc: 'Instability events begin. Health and stamina regen impaired.',
    },
    {
        id: 'fallen',    min: 100, label: 'Fallen',    color: '#c04040',
        regenPenalties: { health: 0.55, stamina: 0.20, energy: 0.10 },
        desc: 'Frequent flare events. Significant regen penalties across stats.',
    },
    {
        id: 'abyssal',   min: 180, label: 'Abyssal',   color: '#9b1a1a',
        regenPenalties: { health: 0.75, stamina: 0.35, energy: 0.20, focus: 0.15 },
        desc: 'Extreme instability. Very dangerous to maintain.',
    },
];

// ── Effective-skill conflict table ─────────────────────────────────────────────
// High investment in an opposing skill reduces this skill's effective value.
// Separate from training-gain conflicts in skills.js (those affect gain rate;
// these affect the compressed power value used for quest/content checks).
const _EFF_CONFLICTS = {
    magic:   [{ skill: 'melee',   threshold: 300, factor: 0.85 }],
    stealth: [{ skill: 'melee',   threshold: 300, factor: 0.82 }],
    melee:   [{ skill: 'magic',   threshold: 300, factor: 0.88 }],
};

const PlayerSystem = {
    current: null,

    // ── Create a brand-new character ──────────────────────────
    createNew(name, factionId, originId) {
        const faction = FACTIONS.find(f => f.id === factionId);
        const origin  = ORIGINS.find(o => o.id === originId);

        const skills = {
            melee: 0, ranged: 0, magic: 0,
            restoration: 0, defense: 0, stealth: 0,
            blacksmithing: 0, armorsmithing: 0, woodworking: 0,
            tailoring: 0, magesmithing: 0, alchemy: 0, jewelryCraft: 0,
        };

        // Apply faction bonuses
        if (faction) {
            for (const [skill, val] of Object.entries(faction.skillBonuses)) {
                if (Object.prototype.hasOwnProperty.call(skills, skill)) skills[skill] += val;
            }
        }

        // Apply origin bonuses
        if (origin) {
            for (const [skill, val] of Object.entries(origin.skillBonuses)) {
                if (Object.prototype.hasOwnProperty.call(skills, skill)) skills[skill] += val;
            }
        }

        this.current = {
            name,
            faction: factionId,
            origin: originId,
            location: (typeof FACTION_CAPITALS !== 'undefined' && FACTION_CAPITALS[factionId])
                ? FACTION_CAPITALS[factionId]
                : Object.values(typeof FACTION_CAPITALS !== 'undefined' ? FACTION_CAPITALS : {})[0] ?? 'ironhold',
            gold: origin ? origin.startingGold : 100,

            // ── Stats (each regenerates on a tick) ───────────
            // regenInterval is in seconds
            stats: {
                health:  { value: 100, max: 100, baseMax: 100, regenAmount: 1, regenInterval: 30, _timer: 0 },
                energy:  { value: 100, max: 100, baseMax: 100, regenAmount: 1, regenInterval: 60, _timer: 0 },
                focus:   { value: 100, max: 100, baseMax: 100, regenAmount: 1, regenInterval: 45, _timer: 0 },
                stamina: { value: 100, max: 100, baseMax: 100, regenAmount: 2, regenInterval: 20, _timer: 0 },
                mana:    { value: 100, max: 100, baseMax: 100, regenAmount: 1, regenInterval: 60, _timer: 0 },
            },

            // ── Survival ──────────────────────────────────────
            survival: {
                food: 75,
                foodMax: 100,
                state: 'well-fed',      // 'well-fed' | 'hungry' | 'starving'
                starvationStarted: null, // timestamp (ms) when starvation began
                penalty: 1.0,           // survivalMultiplier (0.7 – 1.0)
            },

            skills,

            abilities: {
                unlocked: [],
                equipped: [],
            },

            inventory: [],
            chests: [],

            equipment: {
                head: null, torso: null, back: null,
                hands: null, legs: null, feet: null,
                weapon: null, offhand: null,
            },

            quests: {
                active: null,
                completed: [],
                // Daily quest board — regenerated each calendar day
                board: { date: '', questIds: [] },
                // Daily completion counter — resets each calendar day
                daily: { date: '', count: 0 },
            },

            travel: { active: false, fromId: null, toId: null, startTime: null, arrivalTime: null },

            // ── Hospitalization ───────────────────────────────
            // Set when corruption overwhelms the player. Blocks most actions.
            hospitalized: null, // { until: timestamp } or null

            // ── Shelter ───────────────────────────────────────
            // date of last shelter charge; empty = not yet charged (first day free)
            shelter: { date: '' },

            // ── Corruption ────────────────────────────────────
            // 0–100. Gained from rift activities. Cleansed at faction shrines.
            corruption: 0,

            // ── Active temporary effects ──────────────────────
            // [{ type, stat, amount, label, expiresAt }]
            activeEffects: [],

            createdAt: Date.now(),
        };

        return this.current;
    },

    // ── Restore from a save file ──────────────────────────────
    load(saveData) {
        this.current = saveData.player;
        // Backfill fields added after initial release
        if (!this.current.chests) this.current.chests = [];
        if (!this.current.inventory) this.current.inventory = [];
        if (!this.current.quests) this.current.quests = { active: null, completed: [], board: { date: '', questIds: [] }, daily: { date: '', count: 0 } };
        if (!this.current.quests.board) this.current.quests.board = { date: '', regionId: '', questIds: [] };
        // Force board regeneration if regionId field is missing (old save format)
        if (!('regionId' in this.current.quests.board)) this.current.quests.board.regionId = '';
        if (!this.current.quests.daily) this.current.quests.daily = { date: '', count: 0 };
        if (!this.current.abilities) this.current.abilities = { unlocked: [], equipped: [] };
        if (!this.current.abilities.unlocked) this.current.abilities.unlocked = [];
        if (!this.current.abilities.equipped) this.current.abilities.equipped = [];
        // Migrate string location to region ID
        if (!this.current.location || !MAP_REGIONS[this.current.location]) {
            this.current.location = (typeof FACTION_CAPITALS !== 'undefined' && FACTION_CAPITALS[this.current.faction])
                ? FACTION_CAPITALS[this.current.faction]
                : 'ironhold';
        }
        // Backfill travel state
        if (!this.current.travel) {
            this.current.travel = { active: false, fromId: null, toId: null, startTime: null, arrivalTime: null };
        }
        // Backfill shelter tracking
        if (!this.current.shelter) this.current.shelter = { date: '' };
        // Backfill corruption + active effects
        if (this.current.corruption == null) this.current.corruption = 0;
        if (!this.current.activeEffects) this.current.activeEffects = [];
        if (this.current.hospitalized === undefined) this.current.hospitalized = null;
        // Recalculate derived maxes in case design values changed
        this._recalcStatMaxes();
    },

    // ── Stat helpers ──────────────────────────────────────────
    getStat(statName) {
        return this.current ? this.current.stats[statName] : null;
    },

    getStatMax(statName) {
        const stat = this.getStat(statName);
        if (!stat) return 0;
        return stat.max;
    },

    getSurvivalMultiplier() {
        const state = this.current ? this.current.survival.state : 'well-fed';
        if (state === 'well-fed') return 1.0;
        if (state === 'hungry')   return 0.9;
        if (state === 'starving') return 0.7;
        return 1.0;
    },

    // ── Skill helpers ─────────────────────────────────────────
    getSkill(skillName) {
        return this.current ? (this.current.skills[skillName] ?? 0) : 0;
    },

    getTotalSkill() {
        if (!this.current) return 0;
        return Object.values(this.current.skills).reduce((sum, v) => sum + v, 0);
    },

    // ── Effective skill (compressed for content checks) ───────
    // Formula: floor(raw × 0.35 + √raw × 6)
    // Early growth stays strong; late-game values grow slower.
    // Specialization conflicts reduce effective value when opposing
    // skills are highly trained (see _EFF_CONFLICTS table).
    getEffectiveSkill(skillName) {
        const raw  = this.getSkill(skillName);
        const base = Math.floor(raw * 0.35 + Math.sqrt(raw) * 6);
        const conflicts = _EFF_CONFLICTS[skillName] || [];
        let mult = 1.0;
        for (const c of conflicts) {
            if (this.getSkill(c.skill) >= c.threshold) {
                mult = Math.min(mult, c.factor);
            }
        }
        return Math.floor(base * mult);
    },

    // ── Survival state update (called by game loop) ───────────
    updateSurvivalState() {
        const sv = this.current.survival;
        const now = Date.now();

        if (sv.food <= 0) {
            if (!sv.starvationStarted) sv.starvationStarted = now;
            const hoursStarving = (now - sv.starvationStarted) / 3600000;
            if (hoursStarving >= 24) {
                sv.state = 'starving';
                sv.penalty = 0.7;
            } else {
                sv.state = 'hungry';
                sv.penalty = 0.9;
            }
        } else if (sv.food < sv.foodMax * 0.25) {
            sv.state = 'hungry';
            sv.penalty = 0.9;
            sv.starvationStarted = null;
        } else {
            sv.state = 'well-fed';
            sv.penalty = 1.0;
            sv.starvationStarted = null;
        }

        this._recalcStatMaxes();
    },

    // ── Clamp stat values to their current max ────────────────
    _recalcStatMaxes() {
        if (!this.current) return;
        for (const statName of Object.keys(this.current.stats)) {
            const stat         = this.current.stats[statName];
            const abilityBonus = (typeof AbilitySystem !== 'undefined')
                ? AbilitySystem.getStatBonus(statName)
                : 0;
            const equipBonus   = (typeof EquipSystem !== 'undefined')
                ? EquipSystem.getStatBonuses(statName)
                : 0;
            const skillBonus   = this.getSkillStatBonus(statName);
            stat.max = Math.floor((stat.baseMax + abilityBonus + equipBonus + skillBonus) * this.getSurvivalMultiplier());
            if (stat.value > stat.max) stat.value = stat.max;
        }
    },

    // ── Skill synergy: high skills passively boost related stats ──
    // melee→stamina, ranged→energy, magic→mana, restoration→health, alchemy→focus
    getSkillStatBonus(statName) {
        const skills = this.current?.skills ?? {};
        const bonuses = {
            stamina: Math.floor((skills.melee    ?? 0) / 100),
            energy:  Math.floor((skills.ranged   ?? 0) / 100),
            mana:    Math.floor((skills.magic    ?? 0) / 100),
            health:  Math.floor((skills.restoration ?? 0) / 100),
            focus:   Math.floor((skills.alchemy  ?? 0) / 100),
        };
        return bonuses[statName] ?? 0;
    },

    // ── Effective regen interval accounting for active effects + corruption ────
    getEffectiveRegenInterval(statName) {
        const stat = this.getStat(statName);
        if (!stat) return 60;
        let interval = stat.regenInterval;

        const now = Date.now();
        for (const effect of (this.current.activeEffects || [])) {
            if (effect.expiresAt && now > effect.expiresAt) continue;
            if (effect.type === 'fatigue') {
                interval = Math.round(interval * (1 + effect.amount));
            } else if (effect.type === 'regen_reduction' && (effect.stat === statName || effect.stat === null)) {
                interval = Math.round(interval * (1 + effect.amount));
            } else if (effect.type === 'regen_boost' && (effect.stat === statName || effect.stat === null)) {
                interval = Math.round(interval * Math.max(0.1, 1 - effect.amount));
            }
        }

        // Corruption regen penalty — tier-based, affects multiple stats
        const tierPenalties = this.getCorruptionTier().regenPenalties;
        if (tierPenalties[statName]) {
            interval = Math.round(interval * (1 + tierPenalties[statName]));
        }

        return Math.max(5, interval);
    },

    // ── Quest bonus from corruption power + starvation desperation ────────────
    getQuestBonus() {
        let bonus = 0;
        // Corruption power grants scaled quest bonus (aggressive/combat bias)
        const power = this.getEffectiveCorruptionPower();
        if (power > 0) bonus += Math.floor(power / 7);
        // Starvation desperation: risky but potent
        if (this.current?.survival?.food <= 0) bonus += 15;
        return bonus;
    },

    // ── Corruption — tier and effective power ─────────────────────────────────
    getCorruptionTier() {
        const raw = this.current?.corruption ?? 0;
        for (let i = CORRUPTION_TIERS.length - 1; i >= 0; i--) {
            if (raw >= CORRUPTION_TIERS[i].min) return CORRUPTION_TIERS[i];
        }
        return CORRUPTION_TIERS[0];
    },

    // Effective corruption power: logarithmic — early gains are huge, late gains taper.
    // Values: raw 25→56, raw 100→79, raw 200→91, raw 400→103
    getEffectiveCorruptionPower() {
        const raw = this.current?.corruption ?? 0;
        if (raw <= 0) return 0;
        return Math.floor(17.3 * Math.log(raw + 1));
    },

    // ── Hospitalization ───────────────────────────────────────────────────────
    isHospitalized() {
        if (!this.current?.hospitalized) return false;
        if (Date.now() >= this.current.hospitalized.until) {
            this.current.hospitalized = null;
            return false;
        }
        return true;
    },

    hospitalize(durationMs) {
        if (!this.current) return;
        const capitalId = (typeof FACTION_CAPITALS !== 'undefined')
            ? FACTION_CAPITALS[this.current.faction]
            : null;
        if (!capitalId) return;

        // Cancel travel and active quest
        if (this.current.travel?.active) {
            this.current.travel.active = false;
        }
        if (this.current.quests?.active) {
            const lostQuest = QUESTS?.find(q => q.id === this.current.quests.active.questId);
            this.current.quests.active = null;
            if (lostQuest) Log.add(`"${lostQuest.name}" was abandoned — you were incapacitated.`, 'warning');
        }

        this.current.location     = capitalId;
        this.current.hospitalized = { until: Date.now() + durationMs };

        const capitalName = (typeof MAP_REGIONS !== 'undefined' && MAP_REGIONS[capitalId])
            ? MAP_REGIONS[capitalId].name
            : capitalId;
        const mins = Math.round(durationMs / 60000);
        Log.add(`Corruption overwhelms you. You collapse and wake in ${capitalName} — hospitalized for ${mins} minutes.`, 'danger');
        SaveSystem.save();
    },

    // ── Corruption management ─────────────────────────────────────────────────
    gainCorruption(amount) {
        if (!this.current) return;
        const before     = this.current.corruption;
        const tierBefore = this.getCorruptionTier();
        this.current.corruption = before + amount; // no cap — unbounded
        const after     = this.current.corruption;
        const tierAfter = this.getCorruptionTier();
        if (after !== before) {
            Log.add(`Corruption: ${after} (${tierAfter.label}).`, 'danger');
            // Log tier transition messages
            if (tierAfter.id !== tierBefore.id) {
                const msgs = {
                    tainted:   'You feel tainted. Minor instability begins.',
                    corrupted: 'Corruption deepens. Instability events may now occur.',
                    fallen:    'You have fallen. Regen penalties are severe. Cleanse at a shrine.',
                    abyssal:   'You are Abyssal. You are very dangerous — and very hard to keep alive.',
                };
                if (msgs[tierAfter.id]) Log.add(msgs[tierAfter.id], 'danger');
            }
        }
    },

    cleanseCorruption() {
        if (!this.current) return { ok: false, reason: 'No player.' };
        const corruption = this.current.corruption ?? 0;
        if (corruption === 0) return { ok: false, reason: 'You carry no corruption.' };
        // Quadratic cost — high corruption is very expensive to cleanse
        const cost = Math.max(50, Math.floor(50 + corruption * corruption * 0.2));
        if (this.current.gold < cost) {
            return { ok: false, reason: `Insufficient gold. Need ${cost.toLocaleString()}g to cleanse ${corruption} corruption.` };
        }
        this.current.gold -= cost;
        this.current.corruption = 0;
        Log.add(`Corruption purified at the shrine for ${cost.toLocaleString()}g.`, 'success');
        SaveSystem.save();
        return { ok: true, cost };
    },

    // ── Active effects ─────────────────────────────────────────────────────────
    applyActiveEffect(effect) {
        if (!this.current || !effect) return;
        if (effect.type === 'corruption_gain') {
            this.gainCorruption(effect.amount);
            return;
        }
        const now        = Date.now();
        const expiresAt  = now + effect.durationMin * 60 * 1000;
        const effectStat = effect.stat ?? null;
        // Replace any existing effect of same type + stat combo
        const idx = this.current.activeEffects.findIndex(
            e => e.type === effect.type && (e.stat ?? null) === effectStat
        );
        const newEffect = { type: effect.type, stat: effectStat, amount: effect.amount, expiresAt };
        if (idx >= 0) {
            this.current.activeEffects[idx] = newEffect;
        } else {
            this.current.activeEffects.push(newEffect);
        }
    },

    cleanActiveEffects() {
        if (!this.current) return;
        const now = Date.now();
        this.current.activeEffects = (this.current.activeEffects || [])
            .filter(e => !e.expiresAt || e.expiresAt > now);
    },
};

// Shared skill label helper (used by creation wizard and home page)
function skillLabel(key) {
    const labels = {
        melee: 'Melee', ranged: 'Ranged', magic: 'Magic',
        restoration: 'Restoration', defense: 'Defense', stealth: 'Stealth',
        blacksmithing: 'Blacksmithing', armorsmithing: 'Armorsmithing',
        woodworking: 'Woodworking', tailoring: 'Tailoring',
        magesmithing: 'Magesmithing', alchemy: 'Alchemy',
        jewelryCraft: 'Jewelry Craft',
    };
    return labels[key] || key;
}
