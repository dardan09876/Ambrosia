// js/pages/abilities.js
// Abilities page — learn and equip passive abilities unlocked by skill milestones.

Router.register('abilities', function () {
    _renderAbilitiesPage();
});

// ── State ─────────────────────────────────────────────────────────────────────
let _abFilter = 'all'; // 'all' | skill category key

const _AB_FILTERS = [
    { key: 'all',         label: 'All'         },
    { key: 'melee',       label: 'Melee'       },
    { key: 'ranged',      label: 'Ranged'      },
    { key: 'magic',       label: 'Magic'       },
    { key: 'restoration', label: 'Restoration' },
    { key: 'defense',     label: 'Defense'     },
    { key: 'stealth',     label: 'Stealth'     },
];

// Category display colours (matches skill resource colours)
const _AB_CATEGORY_COLORS = {
    melee:       '#c04040',
    ranged:      '#4a9edb',
    magic:       '#5b8fd4',
    restoration: '#9b6bd4',
    defense:     '#4a9e6b',
    stealth:     '#c9a84c',
};

// ── Main render ───────────────────────────────────────────────────────────────
function _renderAbilitiesPage() {
    const el = document.getElementById('content-area');
    if (!el) return;

    const player   = PlayerSystem.current;
    const unlocked = player.abilities.unlocked;
    const equipped = player.abilities.equipped;
    const slots    = AbilitySystem.MAX_EQUIPPED;

    // Filter abilities
    const visible = _abFilter === 'all'
        ? ABILITIES
        : ABILITIES.filter(a => a.category === _abFilter);

    el.innerHTML = `
        <div class="page-abilities">

            <div class="ab-header">
                <h2 class="heading">Abilities</h2>
                <div class="ab-header-meta">
                    <span class="ab-slot-count">${equipped.length} / ${slots} slots equipped</span>
                    <span class="ab-divider">·</span>
                    <span class="ab-learned-count gold-text">${unlocked.length} learned</span>
                </div>
            </div>

            <!-- Equipped ability slots -->
            <div class="ab-equipped-panel">
                <div class="ab-equipped-title">Equipped</div>
                <div class="ab-equipped-slots">
                    ${_renderEquippedSlots(player)}
                </div>
            </div>

            <!-- Active bonuses summary -->
            ${_renderBonusSummary(player)}

            <!-- Filter tabs -->
            <div class="ab-filter-tabs">
                ${_AB_FILTERS.map(f => `
                    <button
                        class="ab-filter-tab ${_abFilter === f.key ? 'active' : ''}"
                        onclick="_abSetFilter('${f.key}')"
                    >${f.label}</button>
                `).join('')}
            </div>

            <!-- Ability cards grouped by category -->
            <div class="ab-list">
                ${_renderAbilityGroups(visible, player)}
            </div>

        </div>
    `;
}

// ── Equipped slots bar ────────────────────────────────────────────────────────
function _renderEquippedSlots(player) {
    const equipped = player.abilities.equipped;
    const slots    = AbilitySystem.MAX_EQUIPPED;
    const html     = [];

    for (let i = 0; i < slots; i++) {
        const abilityId = equipped[i];
        const ability   = abilityId ? ABILITIES.find(a => a.id === abilityId) : null;

        if (ability) {
            const color = _AB_CATEGORY_COLORS[ability.category] || 'var(--gold)';
            html.push(`
                <div class="ab-slot ab-slot-filled" title="${ability.name}: ${ability.effectLabel}">
                    <span class="ab-slot-name" style="color:${color}">${ability.name}</span>
                    <span class="ab-slot-effect">${ability.effectLabel}</span>
                    <button class="ab-slot-unequip" onclick="_abUnequip('${ability.id}')" title="Unequip">×</button>
                </div>
            `);
        } else {
            html.push(`<div class="ab-slot ab-slot-empty"><span class="ab-slot-empty-label">— empty —</span></div>`);
        }
    }

    return html.join('');
}

// ── Active bonuses summary ────────────────────────────────────────────────────
function _renderBonusSummary(player) {
    if (player.abilities.equipped.length === 0) return '';

    const bonuses = [];

    // Stat bonuses
    for (const stat of ['health', 'energy', 'stamina', 'mana', 'focus']) {
        const val = AbilitySystem.getStatBonus(stat);
        if (val > 0) bonuses.push(`+${val} ${_abStatLabel(stat)} max`);
    }

    // Quest bonuses
    const skills = ['melee', 'ranged', 'magic', 'restoration', 'defense', 'stealth'];
    for (const sk of skills) {
        // Only show skill-specific bonus here (global ones shown separately)
        const val = player.abilities.equipped.reduce((sum, id) => {
            const ab = ABILITIES.find(a => a.id === id);
            if (ab?.effect?.type === 'quest_bonus' && ab.effect.skill === sk) return sum + ab.effect.value;
            return sum;
        }, 0);
        if (val > 0) bonuses.push(`+${val}% ${skillLabel(sk)} quests`);
    }

    // Global quest bonus
    const globalQ = player.abilities.equipped.reduce((sum, id) => {
        const ab = ABILITIES.find(a => a.id === id);
        if (ab?.effect?.type === 'quest_bonus_all') return sum + ab.effect.value;
        return sum;
    }, 0);
    if (globalQ > 0) bonuses.push(`+${globalQ}% all quests`);

    // Food efficiency
    const fe = AbilitySystem.getFoodEfficiency();
    if (fe > 0) bonuses.push(`−${Math.round(fe * 100)}% food drain`);

    if (bonuses.length === 0) return '';

    return `
        <div class="ab-bonus-summary">
            <span class="ab-bonus-label">Active Bonuses:</span>
            ${bonuses.map(b => `<span class="ab-bonus-chip">${b}</span>`).join('')}
        </div>
    `;
}

// ── Ability groups ────────────────────────────────────────────────────────────
function _renderAbilityGroups(abilities, player) {
    if (abilities.length === 0) return '<div class="ab-empty muted-text">No abilities match this filter.</div>';

    // Group by category in a fixed order
    const categoryOrder = ['melee', 'ranged', 'magic', 'restoration', 'defense', 'stealth'];
    const grouped = {};
    for (const ab of abilities) {
        if (!grouped[ab.category]) grouped[ab.category] = [];
        grouped[ab.category].push(ab);
    }

    return categoryOrder
        .filter(cat => grouped[cat])
        .map(cat => {
            const color = _AB_CATEGORY_COLORS[cat] || 'var(--gold)';
            return `
                <div class="ab-group">
                    <div class="ab-group-header" style="color:${color}">
                        ${skillLabel(cat)}
                    </div>
                    <div class="ab-group-cards">
                        ${grouped[cat].map(ab => _renderAbilityCard(ab, player)).join('')}
                    </div>
                </div>
            `;
        }).join('');
}

// ── Single ability card ───────────────────────────────────────────────────────
function _renderAbilityCard(ability, player) {
    const isUnlocked = player.abilities.unlocked.includes(ability.id);
    const isEquipped = player.abilities.equipped.includes(ability.id);

    const req         = ability.skillReq;
    const playerSkill = req ? PlayerSystem.getSkill(req.skill) : 0;
    const meetsReq    = !req || req.level === 0 || playerSkill >= req.level;
    const color       = _AB_CATEGORY_COLORS[ability.category] || 'var(--gold)';

    // Skill progress toward requirement
    const skillPct = req && req.level > 0
        ? Math.min(100, Math.round((playerSkill / req.level) * 100))
        : 100;

    // Determine card state class
    let stateClass = '';
    if (isEquipped)       stateClass = 'ab-card-equipped';
    else if (isUnlocked)  stateClass = 'ab-card-learned';
    else if (!meetsReq)   stateClass = 'ab-card-locked';
    else                  stateClass = 'ab-card-available';

    // Status badge
    let statusBadge = '';
    if (isEquipped)      statusBadge = `<span class="ab-badge ab-badge-equipped">Equipped</span>`;
    else if (isUnlocked) statusBadge = `<span class="ab-badge ab-badge-learned">Learned</span>`;
    else if (!meetsReq)  statusBadge = `<span class="ab-badge ab-badge-locked">Locked</span>`;
    else                 statusBadge = `<span class="ab-badge ab-badge-available">Available</span>`;

    // Action button
    let actionBtn = '';
    const slotsLeft = AbilitySystem.MAX_EQUIPPED - player.abilities.equipped.length;
    if (isEquipped) {
        actionBtn = `<button class="ab-btn ab-btn-unequip" onclick="_abUnequip('${ability.id}')">Unequip</button>`;
    } else if (isUnlocked) {
        const canEquip = slotsLeft > 0;
        actionBtn = `
            <button
                class="ab-btn ab-btn-equip${!canEquip ? ' ab-btn-disabled' : ''}"
                onclick="_abEquip('${ability.id}')"
                ${!canEquip ? 'disabled' : ''}
                title="${!canEquip ? 'No ability slots free' : 'Equip this ability'}"
            >Equip</button>
        `;
    } else if (meetsReq) {
        const canAfford = player.gold >= ability.goldCost;
        actionBtn = `
            <button
                class="ab-btn ab-btn-learn${!canAfford ? ' ab-btn-disabled' : ''}"
                onclick="_abLearn('${ability.id}')"
                ${!canAfford ? 'disabled' : ''}
                title="${!canAfford ? `Need ${ability.goldCost}g` : `Learn for ${ability.goldCost}g`}"
            >Learn — ◈ ${ability.goldCost}g</button>
        `;
    }

    // Skill requirement row
    let reqRow = '';
    if (req && req.level > 0) {
        const tierName = _abSkillTierAtLevel(req.level);
        if (!meetsReq) {
            reqRow = `
                <div class="ab-req-row">
                    <span class="ab-req-label">Requires ${skillLabel(req.skill)} ${req.level} (${tierName})</span>
                    <div class="ab-req-progress">
                        <div class="ab-req-fill" style="width:${skillPct}%;background:${color}"></div>
                    </div>
                    <span class="ab-req-pct">${playerSkill} / ${req.level}</span>
                </div>
            `;
        } else {
            reqRow = `<div class="ab-req-row ab-req-met">✓ ${skillLabel(req.skill)} ${req.level}</div>`;
        }
    }

    return `
        <div class="ab-card ${stateClass}">
            <div class="ab-card-top">
                <div class="ab-card-name-row">
                    <span class="ab-card-name" style="color:${isEquipped ? color : ''}">${ability.name}</span>
                    ${statusBadge}
                </div>
                <div class="ab-card-desc">${ability.description}</div>
            </div>
            <div class="ab-card-effect">
                <span class="ab-effect-chip" style="color:${color}">${ability.effectLabel}</span>
            </div>
            ${reqRow}
            ${actionBtn ? `<div class="ab-card-actions">${actionBtn}</div>` : ''}
        </div>
    `;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function _abSetFilter(filter) {
    _abFilter = filter;
    _renderAbilitiesPage();
}

function _abStatLabel(stat) {
    return { health: 'Health', energy: 'Energy', stamina: 'Stamina', mana: 'Mana', focus: 'Focus' }[stat] || stat;
}

// Returns the tier name at a given skill level threshold
function _abSkillTierAtLevel(level) {
    if (level >= 5000) return 'Expert';
    if (level >= 2000) return 'Expert';
    if (level >= 500)  return 'Journeyman';
    if (level >= 100)  return 'Apprentice';
    return 'Novice';
}

// ── Actions ───────────────────────────────────────────────────────────────────
function _abLearn(abilityId) {
    const result = AbilitySystem.learn(abilityId);
    if (!result.ok) Log.add(result.reason, 'danger');
    _renderAbilitiesPage();
}

function _abEquip(abilityId) {
    const result = AbilitySystem.equip(abilityId);
    if (!result.ok) Log.add(result.reason, 'danger');
    _renderAbilitiesPage();
}

function _abUnequip(abilityId) {
    const result = AbilitySystem.unequip(abilityId);
    if (!result.ok) Log.add(result.reason, 'danger');
    _renderAbilitiesPage();
}
