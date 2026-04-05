// js/pages/skills.js
// Skills training page.
// Each skill uses a specific resource per train. Gains diminish at higher skill levels.
// Tier-ups are celebrated in the activity log.

// ── Skill definitions ─────────────────────────────────────────────────────────
// Each combat skill draws from a different resource, creating trade-offs between
// what you can train in a single session.

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

const TRAIN_COST = 5; // resource points per train action

// ── Training modes ─────────────────────────────────────────────────────────────
const TRAIN_MODES = {
    focused: {
        label: 'Focused',
        desc: '+2× skill gain. Reduces trained resource regen by 30% for 10 min.',
        gainMultiplier: 2,
        sideEffect: { type: 'regen_reduction', stat: null, amount: 0.30, durationMin: 10 },
    },
    balanced: {
        label: 'Balanced',
        desc: 'Normal gain on trained skill. No side effects.',
        gainMultiplier: 1,
        sideEffect: null,
    },
    overtraining: {
        label: 'Overtraining',
        desc: '+3× skill gain. Causes fatigue: all regen slowed 20% for 20 min.',
        gainMultiplier: 3,
        sideEffect: { type: 'fatigue', stat: null, amount: 0.20, durationMin: 20 },
    },
};

// ── Skill conflicts ────────────────────────────────────────────────────────────
// High investment in a conflicting skill reduces gain on the trained skill.
const SKILL_CONFLICTS = {
    stealth: [{ skill: 'melee',   threshold: 200, label: 'hindered by Melee',   factor: 0.6 }],
    magic:   [{ skill: 'defense', threshold: 200, label: 'hindered by Defense',  factor: 0.7 }],
    melee:   [{ skill: 'magic',   threshold: 200, label: 'hindered by Magic',    factor: 0.8 }],
};

function _getConflictFactor(skillKey, player) {
    const conflicts = SKILL_CONFLICTS[skillKey] || [];
    let factor = 1.0;
    let label  = null;
    for (const c of conflicts) {
        if ((player.skills[c.skill] ?? 0) >= c.threshold) {
            factor = Math.min(factor, c.factor);
            label  = c.label;
        }
    }
    return { factor, label };
}

// Sibling skills (same category) for Balanced mode bonus
const SKILL_GROUPS = {
    combat:   ['melee','ranged','magic','restoration','defense','stealth'],
    crafting: ['blacksmithing','armorsmithing','woodworking','tailoring','magesmithing','alchemy','jewelryCraft'],
};

// ── Helper functions ───────────────────────────────────────────────────────────
function getSkillTier(val) {
    return SKILL_TIERS.find(t => val >= t.min && val < t.max) || SKILL_TIERS[SKILL_TIERS.length - 1];
}

// Diminishing returns: faster early, slower late
// Early (0–99):    +3 per train
// Mid (100–999):   +2 per train
// Late (1000+):    +1 per train
function getTrainGain(val) {
    if (val < 100)  return 3;
    if (val < 1000) return 2;
    return 1;
}

function getNextTierName(tier) {
    const idx = SKILL_TIERS.indexOf(tier);
    return idx < SKILL_TIERS.length - 1 ? SKILL_TIERS[idx + 1].name : null;
}

// ── Page state ─────────────────────────────────────────────────────────────────
let _activeTab  = 'combat';  // 'combat' | 'crafting' | 'talents' | 'synergies'
let _trainMode  = 'balanced'; // 'focused' | 'balanced' | 'overtraining'

// ── Facility helper ────────────────────────────────────────────────────────────
function _skillsHasTraining() {
    if (typeof MapSystem === 'undefined') return true;
    if (PlayerSystem.isHospitalized()) return false;
    return MapSystem.hasActivity('training');
}

// ── Router registration ────────────────────────────────────────────────────────
Router.register('skills', function renderSkills(container) {
    _renderSkillsPage(container);
});

// ── Page render ────────────────────────────────────────────────────────────────
function _renderSkillsPage(container) {
    const canTrain   = _skillsHasTraining();
    const regionName = typeof MapSystem !== 'undefined' ? MapSystem.getCurrentRegionName() : '';

    const hospitalized = PlayerSystem.isHospitalized();
    const facilityNotice = !canTrain ? `
        <div class="page-facility-blocked">
            ${hospitalized
                ? `<p>You are hospitalized.</p><p class="muted-text">You must recover before you can train.</p>`
                : `<p>There is no training facility in ${regionName}.</p><p class="muted-text">Travel to a region with a training facility to train your skills.</p>`
            }
        </div>` : '';

    const player  = PlayerSystem.current;

    container.innerHTML = `
        <div class="page">
            <div class="page-header">
                <h1 class="page-title">Skills</h1>
                <p class="page-subtitle">Train skills, choose a talent, and unlock synergies.</p>
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
                ${_buildTabContent(canTrain, facilityNotice)}
            </div>
        </div>
    `;

    container.querySelectorAll('.skill-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            _activeTab = btn.dataset.tab;
            container.querySelectorAll('.skill-tab').forEach(b =>
                b.classList.toggle('active', b === btn)
            );
            document.getElementById('skills-tab-content').innerHTML =
                _buildTabContent(_skillsHasTraining(), facilityNotice);
            _bindTrainButtons();
        });
    });

    _bindTalentButtons(container);
    _bindTrainButtons();
}

// ── Tab content dispatcher ─────────────────────────────────────────────────────
function _buildTabContent(canTrain, facilityNotice) {
    if (_activeTab === 'talents')   return _buildTalentsTab();
    if (_activeTab === 'synergies') return _buildSynergiesTab();
    // combat or crafting
    return `
        ${facilityNotice}
        <div class="skills-resource-bar" id="skills-resource-bar">
            ${_buildResourceBar()}
        </div>
        ${canTrain ? `
        <div class="train-mode-panel">
            <div class="train-mode-label">Training Mode</div>
            <div class="train-mode-btns">
                ${Object.entries(TRAIN_MODES).map(([key, mode]) => `
                    <button
                        class="train-mode-btn ${_trainMode === key ? 'active' : ''}"
                        data-mode="${key}"
                        onclick="_setTrainMode('${key}')"
                        title="${mode.desc}"
                    >${mode.label}<span class="train-mode-mult">${key === 'focused' ? '×2' : key === 'overtraining' ? '×3' : '×1'}</span></button>
                `).join('')}
            </div>
            <div class="train-mode-desc muted-text">${TRAIN_MODES[_trainMode].desc}</div>
        </div>` : ''}
        <div class="skills-list" id="skills-list">
            ${_buildSkillList(canTrain)}
        </div>
    `;
}

// ── Resource bar ───────────────────────────────────────────────────────────────
function _buildResourceBar() {
    const player = PlayerSystem.current;
    return Object.entries(RESOURCE_META).map(([key, meta]) => {
        const stat = player.stats[key];
        const cap  = PlayerSystem.getStatMax(key);
        const pct  = cap > 0 ? Math.round((stat.value / cap) * 100) : 0;
        const low  = stat.value < TRAIN_COST;
        return `
            <div class="skills-res-item ${low ? 'skills-res-low' : ''}">
                <span class="skills-res-label" style="color:${meta.color}">${meta.label}</span>
                <div class="stat-bar-track skills-res-track">
                    <div class="stat-bar-fill" style="width:${pct}%;background:${meta.color}"></div>
                </div>
                <span class="skills-res-value">${stat.value}<span class="skills-res-max">/${cap}</span></span>
            </div>
        `;
    }).join('');
}

// ── Skill list ─────────────────────────────────────────────────────────────────
function _buildSkillList(facilityAvailable = true) {
    const player = PlayerSystem.current;
    const defs   = SKILL_DEFS[_activeTab];

    return `<div class="skill-rows">` + defs.map(def => {
        const val      = player.skills[def.key] || 0;
        const effVal   = PlayerSystem.getEffectiveSkill(def.key);
        const tier     = getSkillTier(val);
        const gain     = getTrainGain(val);
        const resMeta  = RESOURCE_META[def.resource];
        const resVal   = player.stats[def.resource].value;
        const canTrain = facilityAvailable && resVal >= TRAIN_COST;
        const nextTier = getNextTierName(tier);

        // Progress within the current tier
        const tierProg  = val - tier.min;
        const tierRange = tier.max === Infinity ? 10000 - tier.min : tier.max - tier.min;
        const pct       = tier.max === Infinity ? 100 : Math.round((tierProg / tierRange) * 100);

        // Conflict indicator
        const conflicts = _EFF_CONFLICTS[def.key] || [];
        const activeConflict = conflicts.find(c => PlayerSystem.getSkill(c.skill) >= c.threshold);
        const conflictHint   = activeConflict
            ? `<span class="skill-eff-conflict" title="Reduced by high ${skillLabel(activeConflict.skill)}">⬇ ${skillLabel(activeConflict.skill)}</span>`
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

                <div class="skill-row-action">
                    <div class="skill-gain-tag" title="Skill points gained per train">+${gain}</div>
                    <button
                        class="btn-train ${canTrain ? '' : 'btn-train-off'}"
                        data-skill="${def.key}"
                        data-resource="${def.resource}"
                        ${canTrain ? '' : 'disabled'}
                        title="${canTrain ? `Train ${def.label} (+${gain})` : (!facilityAvailable ? 'No training facility here' : `Not enough ${resMeta.label} (need ${TRAIN_COST})`)}"
                    >
                        Train
                        <span class="train-cost-tag" style="color:${resMeta.color}">
                            −${TRAIN_COST} ${resMeta.abbr}
                        </span>
                    </button>
                </div>

            </div>
        `;
    }).join('') + `</div>`;
}

// ── Mode selection ─────────────────────────────────────────────────────────────
function _setTrainMode(mode) {
    _trainMode = mode;
    document.querySelectorAll('.train-mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    const descEl = document.querySelector('.train-mode-desc');
    if (descEl) descEl.textContent = TRAIN_MODES[mode].desc;
}

// ── Event binding ──────────────────────────────────────────────────────────────
function _bindTrainButtons() {
    document.querySelectorAll('.btn-train:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () =>
            _executeTrain(btn.dataset.skill, btn.dataset.resource)
        );
    });
}

// ── Training action ────────────────────────────────────────────────────────────
function _executeTrain(skillKey, resource) {
    const player = PlayerSystem.current;
    const stat   = player.stats[resource];

    if (stat.value < TRAIN_COST) return;

    const mode         = TRAIN_MODES[_trainMode];
    const before       = player.skills[skillKey];
    const baseGain     = getTrainGain(before);

    // Skill conflict penalty
    const { factor: conflictFactor, label: conflictLabel } = _getConflictFactor(skillKey, player);

    // Final gain = base × mode multiplier × conflict factor (min 1)
    const gain = Math.max(1, Math.floor(baseGain * mode.gainMultiplier * conflictFactor));

    // Deduct resource and apply skill gain
    stat.value              = Math.max(0, stat.value - TRAIN_COST);
    player.skills[skillKey] = before + gain;
    const after             = player.skills[skillKey];

    // Award character XP: gain × 5, scaled down by mode multiplier so focused mode
    // doesn't give disproportionate XP (its higher skill gain already compensates)
    PlayerSystem.gainSkillExperience(skillKey, Math.ceil(gain * 5 / mode.gainMultiplier));

    // Recalc stat maxes (skill synergy bonuses may have changed)
    PlayerSystem._recalcStatMaxes();

    // Apply training mode side effect
    if (mode.sideEffect) {
        const effect = { ...mode.sideEffect };
        // Focused: reduction targets the trained resource specifically
        if (_trainMode === 'focused') effect.stat = resource;
        PlayerSystem.applyActiveEffect(effect);
    }

    // Log
    const tierBefore = getSkillTier(before);
    const tierAfter  = getSkillTier(after);
    const modeTag    = _trainMode !== 'balanced' ? ` [${mode.label}]` : '';
    const conflictTag = conflictLabel ? ` (${conflictLabel})` : '';
    if (tierAfter.name !== tierBefore.name) {
        Log.add(`${skillLabel(skillKey)} reached ${tierAfter.name}! (${after.toLocaleString()})`, 'success');
    } else {
        Log.add(`Trained ${skillLabel(skillKey)}: +${gain}${modeTag}${conflictTag} (${after.toLocaleString()})`, 'info');
    }
    if (_trainMode === 'overtraining') Log.add('Fatigue applied — all regen slowed for 20 min.', 'warning');
    if (_trainMode === 'focused') Log.add(`${skillLabel(resource)} regen reduced for 10 min.`, 'warning');

    // Patch DOM
    const rowEl = document.querySelector(`.skill-row[data-skill="${skillKey}"]`);
    if (rowEl) {
        const scratch = document.createElement('div');
        scratch.innerHTML = _buildSkillList(_skillsHasTraining());
        const updated = scratch.querySelector(`.skill-row[data-skill="${skillKey}"]`);
        if (updated) rowEl.replaceWith(updated);
    }
    document.getElementById('skills-resource-bar').innerHTML = _buildResourceBar();

    _bindTrainButtons();
    Layout.updateStatBars();
    SaveSystem.save();
}

// ── Talents tab ────────────────────────────────────────────────────────────────
function _buildTalentsTab() {
    const player = PlayerSystem.current;

    if (player.level < 15) {
        return `
            <div class="page-facility-blocked">
                <p>Talents unlock at level 15.</p>
                <p class="muted-text">You are level ${player.level}. Keep training and completing quests to level up.</p>
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

    const talentName  = TALENTS.find(t => t.id === player.talent)?.name || 'Unknown';
    const allSynergies = PlayerSystem.getAllTalentSynergies();

    return `
        <p class="muted-text" style="margin-bottom:16px">${talentName} — passive bonuses from complementary skill combinations.</p>
        <div class="synergies-grid">
            ${allSynergies.map(s => _buildSynergyCard(s)).join('')}
        </div>
    `;
}

// ── Talent helpers (moved from talents.js, used here) ─────────────────────────
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
            document.getElementById('skills-tab-content').innerHTML =
                _buildTabContent(_skillsHasTraining(), '');
            _bindTalentButtons(document.querySelector('.page'));
        });
    });
}
