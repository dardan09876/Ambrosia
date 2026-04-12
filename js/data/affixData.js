// js/data/affixData.js
// Affix tables for generated loot. Affixes make loot interesting and crafting
// powerful — high rarity items roll prefixes + suffixes; crafting can reroll them.
//
// Stat keys match the fields used by quest checks and warband system.

// ── Weapon Prefixes ────────────────────────────────────────────────────────────
const WEAPON_PREFIXES = [
    { id: 'jagged',       name: 'Jagged',       stat: 'bleedChance',     value: 0.06, weight: 12, desc: '+6% bleed chance' },
    { id: 'tempered',     name: 'Tempered',      stat: 'power',           value: 4,    weight: 14, desc: '+4 power' },
    { id: 'balanced',     name: 'Balanced',      stat: 'accuracy',        value: 0.05, weight: 10, desc: '+5% accuracy' },
    { id: 'swift',        name: 'Swift',         stat: 'speed',           value: 0.05, weight: 8,  desc: '+5% attack speed' },
    { id: 'brutal',       name: 'Brutal',        stat: 'power',           value: 7,    weight: 6,  desc: '+7 power, heavy-hit feel' },
    { id: 'rift_touched', name: 'Rift-Touched',  stat: 'demonDamage',     value: 0.10, weight: 4,  desc: '+10% damage to rift enemies' },
    { id: 'siegebreaker', name: 'Siegebreaker',  stat: 'fortDamage',      value: 0.12, weight: 3,  desc: '+12% fort & structure damage' },
    { id: 'venomous',     name: 'Venomous',      stat: 'poisonChance',    value: 0.08, weight: 7,  desc: '+8% poison on hit' },
];

// ── Armor Prefixes ─────────────────────────────────────────────────────────────
const ARMOR_PREFIXES = [
    { id: 'reinforced',      name: 'Reinforced',      stat: 'armor',                   value: 5,    weight: 15, desc: '+5 armor' },
    { id: 'stalwart',        name: 'Stalwart',         stat: 'maxHealth',               value: 12,   weight: 10, desc: '+12 max health' },
    { id: 'wardwoven',       name: 'Wardwoven',        stat: 'magicResist',             value: 0.08, weight: 8,  desc: '+8% magic resistance' },
    { id: 'silent',          name: 'Silent',           stat: 'stealth',                 value: 0.06, weight: 6,  desc: '+6% stealth effectiveness' },
    { id: 'durable',         name: 'Durable',          stat: 'durabilityLossReduction', value: 0.10, weight: 8,  desc: '-10% durability loss' },
    { id: 'padded',          name: 'Padded',           stat: 'injuryResist',            value: 0.08, weight: 8,  desc: '+8% injury resistance' },
    { id: 'quartermaster',   name: "Quartermaster's",  stat: 'supplyEfficiency',        value: 0.08, weight: 4,  desc: '+8% supply efficiency' },
    { id: 'ironhide',        name: 'Ironhide',         stat: 'armor',                   value: 8,    weight: 6,  desc: '+8 armor' },
];

// ── Focus / Mage Gear Prefixes ─────────────────────────────────────────────────
const FOCUS_PREFIXES = [
    { id: 'lucent',     name: 'Lucent',     stat: 'maxFocus',    value: 10,   weight: 10, desc: '+10 max focus' },
    { id: 'hollowglass',name: 'Hollowglass', stat: 'magicPower', value: 0.08, weight: 8,  desc: '+8% spell power' },
    { id: 'soothing',   name: 'Soothing',   stat: 'restoration', value: 0.07, weight: 8,  desc: '+7% restoration effectiveness' },
    { id: 'warded',     name: 'Warded',     stat: 'riftResist',  value: 0.10, weight: 6,  desc: '+10% rift corruption resistance' },
    { id: 'resonant',   name: 'Resonant',   stat: 'spellRange',  value: 0.05, weight: 5,  desc: '+5% spell range' },
];

// ── Suffixes (apply to any equipment slot) ────────────────────────────────────
const SUFFIXES = [
    { id: 'of_precision',   name: 'of Precision',   stat: 'critChance',          value: 0.05, weight: 10, desc: '+5% crit chance' },
    { id: 'of_resolve',     name: 'of Resolve',     stat: 'focusRecovery',       value: 0.08, weight: 8,  desc: '+8% focus recovery' },
    { id: 'of_the_fox',     name: 'of the Fox',     stat: 'stealth',             value: 0.07, weight: 8,  desc: '+7% stealth' },
    { id: 'of_the_bastion', name: 'of the Bastion', stat: 'defense',             value: 6,    weight: 9,  desc: '+6 defense' },
    { id: 'of_embers',      name: 'of Embers',      stat: 'fireDamage',          value: 0.08, weight: 7,  desc: '+8% fire damage' },
    { id: 'of_frost',       name: 'of Frost',       stat: 'slowChance',          value: 0.07, weight: 7,  desc: '+7% slow on hit' },
    { id: 'of_supply',      name: 'of Supply',      stat: 'operationSupplyCost', value:-0.08, weight: 4,  desc: '-8% operation supply cost' },
    { id: 'of_the_vanguard',name: 'of the Vanguard',stat: 'warbandAttack',       value: 0.10, weight: 5,  desc: '+10% warband attack power' },
    { id: 'of_the_watch',   name: 'of the Watch',   stat: 'scouting',            value: 0.10, weight: 5,  desc: '+10% scouting efficiency' },
    { id: 'of_the_rift',    name: 'of the Rift',    stat: 'riftSuccess',         value: 0.10, weight: 3,  desc: '+10% rift delve success' },
    { id: 'of_endurance',   name: 'of Endurance',   stat: 'maxStamina',          value: 12,   weight: 7,  desc: '+12 max stamina' },
    { id: 'of_the_wilds',   name: 'of the Wilds',   stat: 'survivalBonus',       value: 0.06, weight: 5,  desc: '+6% survival checks' },
];

// ── Affix count by rarity ──────────────────────────────────────────────────────
function getAffixCount(rarity) {
    switch (rarity) {
        case 'common':    return 0;
        case 'uncommon':  return 1;
        case 'rare':      return Math.random() < 0.5 ? 1 : 2;
        case 'epic':      return 2;
        case 'legendary': return Math.random() < 0.5 ? 2 : 3;
        case 'named':     return 2; // fixed signature affixes
        default:          return 0;
    }
}

// ── Quality table ──────────────────────────────────────────────────────────────
const QUALITY_LEVELS = {
    crude:       { label: 'Crude',      color: '#8b6355', multiplier: 0.85 },
    standard:    { label: 'Standard',   color: '#a0a0a0', multiplier: 1.00 },
    fine:        { label: 'Fine',       color: '#4a9e6b', multiplier: 1.10 },
    superior:    { label: 'Superior',   color: '#4a9edb', multiplier: 1.22 },
    masterwork:  { label: 'Masterwork', color: '#c9a84c', multiplier: 1.38 },
};

const QUALITY_ORDER = ['crude', 'standard', 'fine', 'superior', 'masterwork'];

function getQuality(key) {
    return QUALITY_LEVELS[key] || QUALITY_LEVELS.standard;
}

function getNextQuality(current) {
    const idx = QUALITY_ORDER.indexOf(current);
    if (idx < 0 || idx >= QUALITY_ORDER.length - 1) return null;
    return QUALITY_ORDER[idx + 1];
}

// ── Item score formula ─────────────────────────────────────────────────────────
function getItemScore(item) {
    const tier         = item.baseTier ?? item.tier ?? 1;
    const tierValue    = [0, 10, 22, 40, 65, 100][Math.min(5, tier)] ?? 10;
    const rarityMulti  = { common:1, uncommon:1.1, rare:1.25, epic:1.45, legendary:1.7, named:2.0 }[item.rarity] ?? 1;
    const qualityMulti = (QUALITY_LEVELS[item.quality]?.multiplier) ?? 1.0;
    const upgradeBonus = 1 + (item.upgradeLevel || 0) * 0.06;
    const affixCount   = (item.affixes?.length || 0);
    const modCount     = (item.craftedMods?.length || 0);
    const affixBonus   = 1 + affixCount * 0.08;
    const craftedBonus = 1 + modCount * 0.05;
    return Math.floor(tierValue * rarityMulti * qualityMulti * upgradeBonus * affixBonus * craftedBonus);
}

// ── Roll a prefix pool for an item category ───────────────────────────────────
function _getPrefixPool(category, subtype) {
    if (category === 'weapon') return WEAPON_PREFIXES;
    if (subtype === 'focus_staff' || subtype === 'staff') return FOCUS_PREFIXES;
    return ARMOR_PREFIXES;
}

// ── Weighted random pick from an affix pool ───────────────────────────────────
function _pickWeighted(pool) {
    const total = pool.reduce((s, a) => s + a.weight, 0);
    let roll = Math.random() * total;
    for (const a of pool) {
        roll -= a.weight;
        if (roll <= 0) return a;
    }
    return pool[pool.length - 1];
}

// ── Roll affixes for an item ───────────────────────────────────────────────────
// Returns array of affix objects from the data tables
function rollAffixes(category, subtype, rarity) {
    const count       = getAffixCount(rarity);
    if (count === 0) return [];

    const prefixPool  = _getPrefixPool(category, subtype);
    const suffixPool  = SUFFIXES;
    const affixes     = [];
    const usedIds     = new Set();

    // First affix is always a prefix if count = 1; otherwise prefix + suffix
    if (count >= 1) {
        const p = _pickWeighted(prefixPool);
        if (!usedIds.has(p.id)) { affixes.push({ ...p, kind: 'prefix' }); usedIds.add(p.id); }
    }
    if (count >= 2) {
        const s = _pickWeighted(suffixPool);
        if (!usedIds.has(s.id)) { affixes.push({ ...s, kind: 'suffix' }); usedIds.add(s.id); }
    }
    if (count >= 3) {
        // Third affix: 50% prefix, 50% suffix from whichever pool has unused options
        const extraPool = Math.random() < 0.5 ? prefixPool : suffixPool;
        const filtered  = extraPool.filter(a => !usedIds.has(a.id));
        if (filtered.length > 0) {
            const e = _pickWeighted(filtered);
            affixes.push({ ...e, kind: filtered === prefixPool ? 'prefix' : 'suffix' });
        }
    }

    return affixes;
}

// ── Assign quality based on tier and a random roll ────────────────────────────
function rollQuality(tier = 1) {
    // Higher tier items trend toward better base quality
    const r = Math.random();
    if (tier >= 5) {
        if (r < 0.05) return 'crude';
        if (r < 0.30) return 'standard';
        if (r < 0.65) return 'fine';
        return 'superior';
    }
    if (tier >= 3) {
        if (r < 0.10) return 'crude';
        if (r < 0.60) return 'standard';
        return 'fine';
    }
    // Tier 1–2: mostly standard, small crude chance
    if (r < 0.20) return 'crude';
    if (r < 0.85) return 'standard';
    return 'fine';
}

// ── Repair cost formula ────────────────────────────────────────────────────────
function getRepairCost(item) {
    const tier    = item.baseTier ?? item.tier ?? 1;
    const missing = (item.maxDurability || 100) - (item.durability || item.maxDurability || 100);
    if (missing <= 0) return 0;
    const baseCost = tier * 3 + missing * 0.5;
    const qualMult = { crude:0.8, standard:1.0, fine:1.1, superior:1.2, masterwork:1.4 }[item.quality] ?? 1;
    return Math.max(1, Math.ceil(baseCost * qualMult));
}

// ── Reinforcement success chance ───────────────────────────────────────────────
function getRefineChance(skillLevel, itemTier, facilityBonus = 0) {
    const chance = 0.45 + skillLevel * 0.003 + facilityBonus - itemTier * 0.08;
    return Math.max(0.10, Math.min(0.95, chance));
}

// ── Upgrade success chance ─────────────────────────────────────────────────────
function getUpgradeChance(skillLevel, upgradeLevel, itemTier) {
    const chance = 0.75 + skillLevel * 0.002 - upgradeLevel * 0.12 - itemTier * 0.06;
    return Math.max(0.15, Math.min(0.95, chance));
}

// ── Salvage yield formula ──────────────────────────────────────────────────────
function getSalvageYield(item, craftingSkill = 0) {
    const tier        = item.baseTier ?? item.tier ?? 1;
    const base        = tier * 2 + (item.upgradeLevel || 0);
    const rarityBonus = { common:0, uncommon:1, rare:2, epic:4, legendary:6, named:8 }[item.rarity] ?? 0;
    const skillBonus  = Math.floor(craftingSkill / 50);
    return base + rarityBonus + skillBonus;
}

// ── Affix display label ────────────────────────────────────────────────────────
function affixLabel(affix) {
    if (!affix) return '';
    const sign = typeof affix.value === 'number' && affix.value < 0 ? '' : '+';
    const val  = typeof affix.value === 'number'
        ? (Math.abs(affix.value) < 1 ? `${sign}${Math.round(affix.value * 100)}%` : `${sign}${affix.value}`)
        : '';
    return `${affix.name} <span class="affix-stat">${val} ${affix.stat ? affix.stat.replace(/([A-Z])/g,' $1').toLowerCase() : ''}</span>`;
}
