// js/pages/skills.js
// Skills overview page: shows skill levels, tiers, effective values, and mastery
// bonuses. Talent and Synergy tabs also live here.
// Actual training (XP gain, buffs, drills) is handled by the Training page.

// ── Skill definitions ─────────────────────────────────────────────────────────
const SKILL_DEFS = {
    combat: [
        {
            key: 'melee',
            label: 'Melee',
            resource: 'energy',
            desc: 'Close-range weapons. Required for heavy armaments and melee abilities.',
        },
        {
            key: 'ranged',
            label: 'Ranged',
            resource: 'energy',
            desc: 'Bows and thrown weapons. Required for ranged gear and stealth builds.',
        },
        {
            key: 'magic',
            label: 'Magic',
            resource: 'energy',
            desc: 'Arcane spells and staves. Scales spell power in quests.',
        },
        {
            key: 'restoration',
            label: 'Restoration',
            resource: 'energy',
            desc: 'Healing and ward magic. Unlocks recovery and support abilities.',
        },
        {
            key: 'defense',
            label: 'Defense',
            resource: 'energy',
            desc: 'Armour proficiency. Required to equip heavier protection.',
        },
        {
            key: 'stealth',
            label: 'Stealth',
            resource: 'energy',
            desc: 'Silent movement and evasion. Unlocks critical strike abilities.',
        },
    ],
    crafting: [
        {
            key: 'blacksmithing',
            label: 'Blacksmithing',
            resource: 'focus',
            desc: 'Forging metal weapons and tools.',
        },
        {
            key: 'armorsmithing',
            label: 'Armorsmithing',
            resource: 'focus',
            desc: 'Crafting metal armour and shields.',
        },
        {
            key: 'woodworking',
            label: 'Woodworking',
            resource: 'focus',
            desc: 'Bows, staves, and wooden equipment.',
        },
        {
            key: 'tailoring',
            label: 'Tailoring',
            resource: 'focus',
            desc: 'Cloth armour, cloaks, and woven gear.',
        },
        {
            key: 'magesmithing',
            label: 'Magesmithing',
            resource: 'focus',
            desc: 'Enchanted weapons and arcane implements.',
        },
        {
            key: 'alchemy',
            label: 'Alchemy',
            resource: 'focus',
            desc: 'Potions, poisons, and consumable reagents.',
        },
        {
            key: 'jewelryCraft',
            label: 'Jewelry Craft',
            resource: 'focus',
            desc: 'Rings, amulets, and gemstone adornments.',
        },
    ],
};

// ── Resource display metadata ──────────────────────────────────────────────────
const RESOURCE_META = {
    stamina: { label: 'Stamina', abbr: 'ST', color: '#4a9e6b' },
    energy:  { label: 'Energy',  abbr: 'EN', color: '#4a9edb' },
    mana:    { label: 'Mana',    abbr: 'MN', color: '#5b8fd4' },
    focus:   { label: 'Focus',   abbr: 'FC', color: '#9b6bd4' },
};

// ── Skill tiers ────────────────────────────────────────────────────────────────
const SKILL_TIERS = [
    { name: 'Novice',     min: 0,    max: 100   },
    { name: 'Apprentice', min: 100,  max: 500   },
    { name: 'Journeyman', min: 500,  max: 2000  },
    { name: 'Expert',     min: 2000, max: 5000  },
    { name: 'Master',     min: 5000, max: Infinity },
];

// ── Skill tier helpers ─────────────────────────────────────────────────────────
function getSkillTier(val) {
    return SKILL_TIERS.find(t => val >= t.min && val < t.max) || SKILL_TIERS[SKILL_TIERS.length - 1];
}

function getNextTierName(tier) {
    const idx = SKILL_TIERS.indexOf(tier);
    return idx < SKILL_TIERS.length - 1 ? SKILL_TIERS[idx + 1].name : null;
}

// ── Page state ─────────────────────────────────────────────────────────────────
let _activeTab = 'combat'; // 'combat' | 'crafting' | 'talents' | 'synergies'

// ── Router registration ────────────────────────────────────────────────────────
Router.register('skills', function renderSkills(container) {
    _renderSkillsPage(container);
});

// ── Page render ────────────────────────────────────────────────────────────────
function _renderSkillsPage(container) {
    if (typeof _tutorialComplete === 'function' && !_tutorialComplete()) {
        container.innerHTML = `<div class="page"><div class="page-header"><h1 class="page-title">Skills</h1></div><div class="page-body"><p class="page-empty-state">Complete your faction's introduction in the capital city to unlock this page.</p></div></div>`;
        return;
    }

    const player = PlayerSystem.current;

    container.innerHTML = `
        <div class="page">
            <div class="page-header">
                <h1 class="page-title">Skills</h1>
                <p class="page-subtitle">Your skill levels, tiers, talent, and synergies.</p>
            </div>

            <div class="skills-training-link">
                To train skills, earn mastery, or prepare for quests, visit the
                <a href="#training" onclick="Router.navigate('training'); return false;">Training</a> page.
            </div>

            <div class="skills-tabs">
                <button class="skill-tab ${_activeTab === 'combat'    ? 'active' : ''}" data-tab="combat">Combat</button>
                <button class="skill-tab ${_activeTab === 'crafting'  ? 'active' : ''}" data-tab="crafting">Crafting</button>
                <button class="skill-tab ${_activeTab === 'talents'   ? 'active' : ''}" data-tab="talents">
                    Talents${player.level < 15 ? ' <span class="tab-lock">🔒</span>' : ''}
                </button>
                <button class="skill-tab ${_activeTab === 'synergies' ? 'active' : ''}" data-tab="synergies">
                    Synergies${!player.talent ? ' <span class="tab-lock">🔒</span>' : ''}
                </button>
            </div>

            <div id="skills-tab-content">
                ${_buildTabContent()}
            </div>
        </div>
    `;

    container.querySelectorAll('.skill-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            _activeTab = btn.dataset.tab;
            container.querySelectorAll('.skill-tab').forEach(b =>
                b.classList.toggle('active', b === btn)
            );
            document.getElementById('skills-tab-content').innerHTML = _buildTabContent();
            _bindTalentButtons(container);
        });
    });

    _bindTalentButtons(container);
}

// ── Tab content dispatcher ─────────────────────────────────────────────────────
function _buildTabContent() {
    if (_activeTab === 'talents')   return _buildTalentsTab();
    if (_activeTab === 'synergies') return _buildSynergiesTab();
    return _buildSkillList();
}

// ── Skill list ─────────────────────────────────────────────────────────────────
function _buildSkillList() {
    const player = PlayerSystem.current;
    const defs   = SKILL_DEFS[_activeTab];

    return `<div class="skill-rows">` + defs.map(def => {
        const val      = player.skills[def.key] || 0;
        const effVal   = PlayerSystem.getEffectiveSkill(def.key);
        const tier     = getSkillTier(val);
        const nextTier = getNextTierName(tier);

        // Progress within the current tier
        const tierProg  = val - tier.min;
        const tierRange = tier.max === Infinity ? 10000 - tier.min : tier.max - tier.min;
        const pct       = tier.max === Infinity ? 100 : Math.round((tierProg / tierRange) * 100);

        // Conflict indicator (from _EFF_CONFLICTS in player.js)
        const conflicts     = _EFF_CONFLICTS[def.key] || [];
        const activeConflict = conflicts.find(c => PlayerSystem.getSkill(c.skill) >= c.threshold);
        const conflictHint   = activeConflict
            ? `<span class="skill-eff-conflict" title="Reduced by high ${skillLabel(activeConflict.skill)}">⬇ ${skillLabel(activeConflict.skill)}</span>`
            : '';

        // Mastery bonus badge
        const masteryPct = player.training?.masteryBonuses?.[def.key]
            ? Math.round(player.training.masteryBonuses[def.key] * 100)
            : 0;
        const masteryTag = masteryPct > 0
            ? `<span class="skill-mastery-badge" title="Mastery bond: +${masteryPct}% effective ${def.label}">M+${masteryPct}%</span>`
            : '';

        // Active training buff
        const activeBuff = (typeof TrainingSystem !== 'undefined')
            ? TrainingSystem.getActiveBuff(def.key, null)
            : 0;
        const buffTag = activeBuff > 0
            ? `<span class="skill-drill-buff" title="Active drill buff">+${Math.round(activeBuff * 100)}% drill</span>`
            : '';

        return `
            <div class="skill-row" data-skill="${def.key}">

                <div class="skill-row-info">
                    <div class="skill-row-name">${def.label}</div>
                    <div class="skill-row-desc">${def.desc}</div>
                </div>

                <div class="skill-row-progress">
                    <div class="skill-row-topline">
                        <span class="skill-value">${val.toLocaleString()}</span>
                        <span class="skill-tier-badge tier-${tier.name.toLowerCase()}">${tier.name}</span>
                        ${masteryTag}${buffTag}
                    </div>
                    <div class="skill-eff-line">
                        Effective: <span class="skill-eff-value">${effVal.toLocaleString()}</span>${conflictHint}
                    </div>
                    <div class="skill-progress-wrap" title="${tier.name}: ${tierProg} / ${tierRange}">
                        <div class="skill-progress-fill" style="width:${pct}%"></div>
                    </div>
                    <div class="skill-progress-label">
                        ${tierProg.toLocaleString()} / ${tierRange.toLocaleString()}
                        ${nextTier ? `<span class="skill-next-tier">→ ${nextTier}</span>` : '<span class="skill-next-tier">Max Tier</span>'}
                    </div>
                </div>

            </div>
        `;
    }).join('') + `</div>`;
}

// ── Talents tab ────────────────────────────────────────────────────────────────
function _buildTalentsTab() {
    const player = PlayerSystem.current;

    if (player.level < 15) {
        return `
            <div class="page-facility-blocked">
                <p>Talents unlock at level 15.</p>
                <p class="muted-text">You are level ${player.level}. Keep completing quests to level up.</p>
            </div>
        `;
    }

    if (player.talent) {
        const t = TALENTS.find(t => t.id === player.talent);
        return `
            <div class="talent-committed">
                <div class="talent-card committed" style="--talent-accent:${_getTalentColor(t.id)}">
                    <div class="talent-icon">${t.icon}</div>
                    <div class="talent-name">${t.name}</div>
                    <div class="talent-desc">${t.description}</div>
                    <div class="talent-lore">"${t.lore}"</div>
                    <div class="talent-modifiers">
                        <div class="talent-mod-title">Experience Modifiers</div>
                        ${_buildModifiersList(t.xpModifiers)}
                    </div>
                </div>
            </div>
        `;
    }

    return `
        <p class="muted-text" style="margin-bottom:16px">Choose a talent to commit to a path. Your choice is permanent.</p>
        <div class="talent-selection">
            ${TALENTS.map(t => `
                <div class="talent-card" style="--talent-accent:${_getTalentColor(t.id)}">
                    <div class="talent-icon">${t.icon}</div>
                    <div class="talent-name">${t.name}</div>
                    <div class="talent-desc">${t.description}</div>
                    <div class="talent-lore">"${t.lore}"</div>
                    <div class="talent-modifiers">
                        <div class="talent-mod-title">Experience Modifiers</div>
                        ${_buildModifiersList(t.xpModifiers)}
                    </div>
                    <div class="talent-synergies">
                        <div class="talent-syn-title">Synergies</div>
                        ${_buildSynergyPreview(t.id)}
                    </div>
                    <button class="btn-primary talent-select-btn" data-talent-id="${t.id}">
                        Commit to ${t.name}
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

// ── Synergies tab ──────────────────────────────────────────────────────────────
function _buildSynergiesTab() {
    const player = PlayerSystem.current;

    if (!player.talent) {
        return `
            <div class="page-facility-blocked">
                <p>Choose a talent to unlock synergies.</p>
                <p class="muted-text">Synergies become available once you have committed to a talent on the Talents tab.</p>
            </div>
        `;
    }

    const talentName   = TALENTS.find(t => t.id === player.talent)?.name || 'Unknown';
    const allSynergies = PlayerSystem.getAllTalentSynergies();

    return `
        <p class="muted-text" style="margin-bottom:16px">${talentName} — passive bonuses from complementary skill combinations.</p>
        <div class="synergies-grid">
            ${allSynergies.map(s => _buildSynergyCard(s)).join('')}
        </div>
    `;
}

// ── Talent helpers ─────────────────────────────────────────────────────────────
function _getTalentColor(talentId) {
    const colors = {
        ironbound:   '#d4511e',
        shade:       '#4a3f8f',
        rift_caller: '#5b8fd4',
        veil_keeper: '#6b4fa3',
        wilder:      '#4a8f3e',
    };
    return colors[talentId] || '#666';
}

function _buildModifiersList(modifiers) {
    return Object.entries(modifiers).map(([skill, mult]) => {
        const pct   = Math.round((mult - 1) * 100);
        const sign  = pct > 0 ? '+' : '';
        const color = pct > 0 ? 'var(--success)' : 'var(--danger)';
        return `
            <div class="talent-mod-item">
                <span class="talent-mod-skill">${skillLabel(skill)}</span>
                <span class="talent-mod-value" style="color:${color}">${sign}${pct}%</span>
            </div>
        `;
    }).join('');
}

function _buildSynergyPreview(talentId) {
    if (typeof getSynergiesForTalent === 'undefined') return '';
    const synergies = getSynergiesForTalent(talentId);
    if (!synergies?.length) return '<p class="muted-text" style="font-size:12px">No synergies</p>';
    return synergies.map(syn => `
        <div class="talent-synergy-item">
            <span class="syn-name">${syn.name}</span>
            <span class="syn-skills">${skillLabel(syn.skills[0])} + ${skillLabel(syn.skills[1])}</span>
        </div>
    `).join('');
}

function _bindTalentButtons(container) {
    container.querySelectorAll('.talent-select-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const result = PlayerSystem.setTalent(btn.dataset.talentId);
            if (!result.ok) { Log.add(result.reason, 'danger'); return; }
            SaveSystem.save();
            document.getElementById('skills-tab-content').innerHTML = _buildTabContent();
            _bindTalentButtons(document.querySelector('.page'));
        });
    });
}
