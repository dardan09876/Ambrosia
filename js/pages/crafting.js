// js/pages/crafting.js
// Crafting page — 6 tabs: Repair | Reinforce | Modify | Supply | Salvage | Enchant

Router.register('crafting', function renderCrafting(container) {
    _renderCraftingPage(container);
});

// ── Page state ─────────────────────────────────────────────────────────────────
let _craftTab        = 'repair';     // 'repair'|'reinforce'|'modify'|'supply'|'salvage'
let _supplyProfession = 'alchemy';   // active profession sub-tab in Supply

// ── Main render ────────────────────────────────────────────────────────────────
function _renderCraftingPage(container) {
    const player = PlayerSystem.current;
    if (!player) return;

    if (typeof _tutorialComplete === 'function' && !_tutorialComplete()) {
        container.innerHTML = `<div class="page"><div class="page-header"><h1 class="page-title">Crafting</h1></div><div class="page-body"><p class="page-empty-state">Complete your faction's introduction to unlock Crafting.</p></div></div>`;
        return;
    }

    const inCity     = typeof MapSystem !== 'undefined' ? MapSystem.isInCity() : true;
    const regionName = typeof MapSystem !== 'undefined' ? MapSystem.getCurrentRegionName() : '';

    if (!inCity) {
        container.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <h1 class="page-title">Crafting</h1>
                    <p class="page-subtitle">Repair, upgrade, and modify your equipment.</p>
                </div>
                <div class="page-body">
                    <p class="page-empty-state">
                        Crafting requires a city workshop.<br>
                        Travel to a city (a settlement with a market and training grounds) to access crafting services.<br>
                        <span class="muted-text" style="font-size:12px">Current location: ${regionName}</span>
                    </p>
                </div>
            </div>
        `;
        return;
    }

    const gear = CraftingSystem.getGearInventory(player);

    container.innerHTML = `
        <div class="page">
            <div class="page-header">
                <h1 class="page-title">Crafting</h1>
                <p class="page-subtitle">Repair, upgrade, and modify your equipment. Craft consumables and warband supplies.</p>
            </div>
            <div class="skills-tabs">
                <button class="skill-tab ${_craftTab==='repair'   ?'active':''}" data-ctab="repair">Repair</button>
                <button class="skill-tab ${_craftTab==='reinforce'?'active':''}" data-ctab="reinforce">Reinforce</button>
                <button class="skill-tab ${_craftTab==='modify'   ?'active':''}" data-ctab="modify">Modify</button>
                <button class="skill-tab ${_craftTab==='supply'   ?'active':''}" data-ctab="supply">Supply</button>
                <button class="skill-tab ${_craftTab==='salvage'  ?'active':''}" data-ctab="salvage">Salvage</button>
            </div>
            <div class="crafting-body-grid">
                <div id="crafting-main-panel">
                    ${_buildCraftTab(player, gear, true)}
                </div>
                <div class="crafting-sidebar">
                    <div class="crafting-sidebar-card">
                        <div class="crafting-sidebar-title">Materials</div>
                        ${_buildMaterialsPanel(player)}
                    </div>
                </div>
            </div>
        </div>
    `;

    container.querySelectorAll('.skill-tab[data-ctab]').forEach(btn => {
        btn.addEventListener('click', () => {
            _craftTab = btn.dataset.ctab;
            container.querySelectorAll('.skill-tab[data-ctab]').forEach(b =>
                b.classList.toggle('active', b === btn)
            );
            document.getElementById('crafting-main-panel').innerHTML =
                _buildCraftTab(PlayerSystem.current, CraftingSystem.getGearInventory(PlayerSystem.current), true);
            _bindCraftActions();
        });
    });

    _bindCraftActions();
}

// ── Tab dispatcher ─────────────────────────────────────────────────────────────
function _buildCraftTab(player, gear, hasFacility) {
    switch (_craftTab) {
        case 'repair':    return _buildRepairTab(player, gear);
        case 'reinforce': return _buildReinforceTab(player, gear);
        case 'modify':    return _buildModifyTab(player, gear);
        case 'supply':    return _buildSupplyTab(player, hasFacility);
        case 'salvage':   return _buildSalvageTab(player);
    }
    return '';
}

// ── REPAIR TAB ─────────────────────────────────────────────────────────────────
function _buildRepairTab(player, gear) {
    const damaged = gear.filter(i => (i.durability ?? i.maxDurability ?? 100) < (i.maxDurability ?? 100));

    const desc = `<div class="craft-tab-desc">Restore durability on damaged equipment. Cost scales with tier and quality.</div>`;

    if (!damaged.length) {
        return desc + `<div class="craft-empty">All equipment is in good condition.</div>`;
    }

    const totalCost    = damaged.reduce((sum, i) => sum + (typeof getRepairCost !== 'undefined' ? getRepairCost(i) : 20), 0);
    const canAffordAll = player.gold >= totalCost;

    const repairAllBtn = `
        <div class="repair-all-bar">
            <span class="muted-text" style="font-size:12px">${damaged.length} item${damaged.length !== 1 ? 's' : ''} need repair</span>
            <div style="display:flex;align-items:center;gap:8px">
                <span class="craft-cost-label">${totalCost}g total</span>
                <button class="btn-craft-action ${canAffordAll?'':'btn-craft-off'}"
                    data-action="repair-all"
                    ${canAffordAll?'':'disabled'}
                >Repair All</button>
            </div>
        </div>
    `;

    return desc + repairAllBtn + `<div class="craft-item-list">` + damaged.map(item => {
        const cost    = typeof getRepairCost !== 'undefined' ? getRepairCost(item) : 20;
        const canAfford = player.gold >= cost;
        const durPct  = Math.round(((item.durability ?? 0) / (item.maxDurability ?? 100)) * 100);
        const durColor = durPct > 60 ? 'var(--success)' : durPct > 25 ? '#c07830' : 'var(--danger)';
        const score   = typeof getItemScore !== 'undefined' ? getItemScore(item) : 0;

        const equippedTag = item._equipped
            ? `<span class="inv-equipped-badge" title="Slot: ${item._equippedSlot}">Equipped</span>`
            : '';
        return `
            <div class="craft-item-row">
                ${_buildItemBrief(item, score)}${equippedTag}
                <div class="craft-item-dur">
                    <div class="cid-track"><div class="cid-fill" style="width:${durPct}%;background:${durColor}"></div></div>
                    <span class="cid-text">${item.durability}/${item.maxDurability}</span>
                </div>
                <div class="craft-item-action">
                    <span class="craft-cost-label">${cost}g</span>
                    <button class="btn-craft-action ${canAfford?'':'btn-craft-off'}"
                        data-action="repair" data-uid="${item.uid}"
                        ${canAfford?'':'disabled'}
                    >Repair</button>
                </div>
            </div>
        `;
    }).join('') + `</div>`;
}

// ── REINFORCE TAB ──────────────────────────────────────────────────────────────
function _buildReinforceTab(player, gear) {
    const upgradeable = gear.filter(i => (i.upgradeLevel ?? 0) < 10);
    const desc = `<div class="craft-tab-desc">Increase an item's power and upgrade level (+1 to +10). Success chance depends on blacksmithing/armorsmithing skill and current upgrade level.</div>`;

    if (!upgradeable.length) {
        return desc + `<div class="craft-empty">No upgradeable items in inventory.</div>`;
    }

    return desc + `<div class="craft-item-list">` + upgradeable.map(item => {
        const tier     = item.baseTier ?? item.tier ?? 1;
        const uLevel   = item.upgradeLevel ?? 0;
        const prof     = item.category === 'armor' ? 'armorsmithing' : 'blacksmithing';
        const skill    = CraftingSystem.getProfessionSkill(player, prof);
        const chance   = typeof getUpgradeChance !== 'undefined'
            ? Math.round(getUpgradeChance(skill, uLevel, tier) * 100)
            : 50;
        const matId    = item.tags?.includes('wood') ? 'rough_wood' : 'scrap_iron';
        const matAmt   = tier + uLevel;
        const goldCost = tier * 8 + uLevel * 5;
        const hasMat   = CraftingSystem.getMaterialCount(player, matId) >= matAmt;
        const hasGold  = player.gold >= goldCost;
        const canDo    = hasMat && hasGold;
        const matName  = typeof getMaterial !== 'undefined' ? (getMaterial(matId)?.name ?? matId) : matId;
        const score    = typeof getItemScore !== 'undefined' ? getItemScore(item) : 0;

        return `
            <div class="craft-item-row">
                ${_buildItemBrief(item, score)}
                <div class="craft-reinforce-meta">
                    <span class="craft-upgrade-level">+${uLevel}</span>
                    <span class="craft-chance-tag" style="color:${chance>70?'var(--success)':chance>40?'#c07830':'var(--danger)'}">${chance}%</span>
                </div>
                <div class="craft-item-action">
                    <span class="craft-cost-label">${matAmt}× ${matName}<br>${goldCost}g</span>
                    <button class="btn-craft-action ${canDo?'':'btn-craft-off'}"
                        data-action="reinforce" data-uid="${item.uid}"
                        ${canDo?'':('disabled title="'+(hasMat?`Need ${goldCost}g`:`Need ${matAmt}× ${matName}`)+'"')}
                    >Reinforce</button>
                </div>
            </div>
        `;
    }).join('') + `</div>`;
}

// ── MODIFY TAB ─────────────────────────────────────────────────────────────────
function _buildModifyTab(player, gear) {
    const affixed = gear.filter(i => i.affixes?.length > 0 || ['uncommon','rare','epic','legendary','named'].includes(i.rarity));

    // Also show quality refinement
    const refinable = gear.filter(i => {
        const nq = typeof getNextQuality !== 'undefined' ? getNextQuality(i.quality ?? 'standard') : null;
        return nq !== null;
    });

    const desc = `<div class="craft-tab-desc">Reroll individual affixes (costs Veil Dust). Refine quality from Standard → Fine → Superior → Masterwork.</div>`;

    if (!affixed.length && !refinable.length) {
        return desc + `<div class="craft-empty">No items available for modification. Earn rare or higher items first.</div>`;
    }

    let html = desc;

    if (refinable.length) {
        html += `<div class="craft-section-title">Quality Refinement</div><div class="craft-item-list">`;
        html += refinable.map(item => {
            const tier       = item.baseTier ?? item.tier ?? 1;
            const nextQ      = typeof getNextQuality !== 'undefined' ? getNextQuality(item.quality ?? 'standard') : null;
            const qual       = typeof getQuality     !== 'undefined' ? getQuality(item.quality ?? 'standard')     : { label: item.quality };
            const nextQDef   = nextQ && typeof getQuality !== 'undefined' ? getQuality(nextQ) : { label: nextQ };
            const prof       = item.category === 'armor' ? 'armorsmithing' : 'blacksmithing';
            const skill      = CraftingSystem.getProfessionSkill(player, prof);
            const chance     = typeof getRefineChance !== 'undefined' ? Math.round(getRefineChance(skill, tier) * 100) : 40;
            const goldCost   = tier * 15;
            const matAmt     = tier;
            const hasMat     = CraftingSystem.getMaterialCount(player, 'veil_dust') >= matAmt;
            const hasGold    = player.gold >= goldCost;
            const canDo      = hasMat && hasGold;
            const score      = typeof getItemScore !== 'undefined' ? getItemScore(item) : 0;

            return `
                <div class="craft-item-row">
                    ${_buildItemBrief(item, score)}
                    <div class="craft-reinforce-meta">
                        <span class="craft-quality-tag" style="color:${qual.color ?? '#a0a0a0'}">${qual.label}</span>
                        <span class="craft-arrow">→</span>
                        <span class="craft-quality-tag" style="color:${nextQDef?.color ?? '#4a9e6b'}">${nextQDef?.label ?? nextQ}</span>
                        <span class="craft-chance-tag" style="color:${chance>70?'var(--success)':chance>40?'#c07830':'var(--danger)'}">${chance}%</span>
                    </div>
                    <div class="craft-item-action">
                        <span class="craft-cost-label">${matAmt}× Veil Dust<br>${goldCost}g</span>
                        <button class="btn-craft-action ${canDo?'':'btn-craft-off'}"
                            data-action="refine" data-uid="${item.uid}"
                            ${canDo?'':'disabled'}
                        >Refine</button>
                    </div>
                </div>
            `;
        }).join('');
        html += `</div>`;
    }

    if (affixed.length) {
        html += `<div class="craft-section-title">Affix Reroll</div><div class="craft-item-list">`;
        html += affixed.map(item => {
            const tier    = item.baseTier ?? item.tier ?? 1;
            const matAmt  = tier + 1;
            const goldCost= tier * 20;
            const hasMat  = CraftingSystem.getMaterialCount(player, 'veil_dust') >= matAmt;
            const hasGold = player.gold >= goldCost;
            const score   = typeof getItemScore !== 'undefined' ? getItemScore(item) : 0;

            const affixRows = (item.affixes ?? []).map((affix, idx) => {
                const canDo = hasMat && hasGold;
                return `
                    <div class="craft-affix-row">
                        <span class="craft-affix-name">${affix.name}</span>
                        <span class="craft-affix-desc muted-text">${affix.desc ?? ''}</span>
                        <button class="btn-craft-action btn-craft-sm ${canDo?'':'btn-craft-off'}"
                            data-action="modify" data-uid="${item.uid}" data-affix-idx="${idx}"
                            ${canDo?'':'disabled'}
                            title="${canDo?`${matAmt}× Veil Dust + ${goldCost}g`:'Insufficient resources'}"
                        >Reroll</button>
                    </div>
                `;
            }).join('');

            if (!affixRows) return '';

            return `
                <div class="craft-item-row craft-item-row-tall">
                    ${_buildItemBrief(item, score)}
                    <div class="craft-affixes-block">${affixRows}</div>
                    <div class="craft-item-action craft-action-small">
                        <span class="craft-cost-label">${matAmt}× Veil Dust<br>${goldCost}g each</span>
                    </div>
                </div>
            `;
        }).filter(Boolean).join('');
        html += `</div>`;
    }

    return html;
}

// ── SUPPLY TAB ─────────────────────────────────────────────────────────────────
function _buildSupplyTab(player, hasFacility) {
    const professions  = CraftingSystem.getAllProfessions(player);
    const profNames    = Object.keys(professions);

    const tabs = profNames.map(p => `
        <button class="skill-tab skill-tab-sm ${_supplyProfession===p?'active':''}" data-sprof="${p}">
            ${_profLabel(p)} <span class="prof-level-tag">${professions[p]}</span>
        </button>
    `).join('');

    const skillLevel      = professions[_supplyProfession] || 0;
    const availableRecipes = CraftingSystem.getAvailableRecipes(player, _supplyProfession);

    const recipeHtml = availableRecipes.length
        ? `<div class="supply-recipes-grid">${availableRecipes.map(r => _buildRecipeCard(player, r)).join('')}</div>`
        : `<div class="craft-empty">No recipes available for ${_profLabel(_supplyProfession)} yet. Skill: ${skillLevel}.</div>`;

    return `
        <div class="craft-tab-desc">Craft consumables, supply kits, and warband materials.</div>
        <div class="supply-prof-tabs">${tabs}</div>
        ${recipeHtml}
    `;
}

// ── SALVAGE TAB ────────────────────────────────────────────────────────────────
function _buildSalvageTab(player) {
    const salvageable = player.inventory.filter(i => SalvageSystem.canSalvage(i));
    const desc = `<div class="craft-tab-desc">Break down unwanted gear into crafting materials. Rarity and upgrade level increase yield.</div>`;

    if (!salvageable.length) {
        return desc + `<div class="craft-empty">No salvageable items in inventory.</div>`;
    }

    return desc + `<div class="craft-item-list">` + salvageable.map(item => {
        const estimate = SalvageSystem.getEstimatedSalvage(item);
        const score    = typeof getItemScore !== 'undefined' ? getItemScore(item) : 0;
        const yieldStr = estimate?.map(e => `${e.average}× ${e.materialId.replace(/_/g,' ')}`).join(', ') || '—';

        return `
            <div class="craft-item-row">
                ${_buildItemBrief(item, score)}
                <div class="craft-salvage-yield muted-text">${yieldStr}</div>
                <div class="craft-item-action">
                    <button class="btn-craft-action btn-craft-danger"
                        data-action="salvage" data-uid="${item.uid}"
                    >Salvage</button>
                </div>
            </div>
        `;
    }).join('') + `</div>`;
}

// ── Item brief block ───────────────────────────────────────────────────────────
function _buildItemBrief(item, score) {
    const rarityDef  = typeof getRarity !== 'undefined' ? getRarity(item.rarity ?? 'common') : { color:'#a0a0a0', name:'Common' };
    const qualDef    = typeof getQuality !== 'undefined' ? getQuality(item.quality ?? 'standard') : { color:'#a0a0a0', label:'Standard' };
    const uLevel     = item.upgradeLevel ?? 0;

    return `
        <div class="cib-block">
            <div class="cib-name-row">
                <span class="cib-name">${item.name}</span>
                ${uLevel > 0 ? `<span class="cib-upgrade">+${uLevel}</span>` : ''}
            </div>
            <div class="cib-tags">
                <span class="cib-rarity" style="color:${rarityDef.color}">${rarityDef.name}</span>
                <span class="cib-quality" style="color:${qualDef.color}">${qualDef.label}</span>
                ${score > 0 ? `<span class="cib-score">Score ${score}</span>` : ''}
            </div>
        </div>
    `;
}

// ── Recipe card (for Supply tab) ───────────────────────────────────────────────
function _buildRecipeCard(player, recipe) {
    const check    = CraftingSystem.canCraft(player, recipe.id);
    const canCraft = check.ok;

    return `
        <div class="recipe-card ${canCraft ? '' : 'locked'}">
            <div class="recipe-header">
                <div class="recipe-title">${recipe.name}</div>
                <div class="recipe-skill">Skill ${recipe.requiredSkill}</div>
            </div>
            <p class="recipe-desc">${recipe.description}</p>
            <div class="recipe-materials">
                ${recipe.materials.map(mat => {
                    const have    = CraftingSystem.getMaterialCount(player, mat.itemId);
                    const ok      = have >= mat.amount;
                    const matName = typeof getMaterial !== 'undefined' ? (getMaterial(mat.itemId)?.name ?? mat.itemId) : mat.itemId;
                    return `<div class="material-req ${ok?'have':'missing'}">
                        <span class="mat-icon">${ok?'✓':'✗'}</span>
                        <span class="mat-name">${matName}</span>
                        <span class="mat-count">${have}/${mat.amount}</span>
                    </div>`;
                }).join('')}
            </div>
            <div class="recipe-footer">
                <div class="recipe-cost"><span class="gold-icon">◈</span> ${recipe.goldCost}g</div>
                <button class="btn-craft ${canCraft?'':'btn-craft-disabled'}"
                    data-action="craft" data-recipe-id="${recipe.id}"
                    ${canCraft?'':('disabled title="'+check.reason+'"')}
                >Craft</button>
            </div>
        </div>
    `;
}

// ── Materials sidebar ──────────────────────────────────────────────────────────
function _buildMaterialsPanel(player) {
    const mats    = CraftingSystem.getAllMaterials(player);
    const entries = Object.entries(mats).filter(([, v]) => v > 0);
    if (!entries.length) {
        return `<p class="muted-text" style="font-size:12px">No materials yet. Salvage gear or complete quests.</p>`;
    }

    // Group by tier
    const byTier = {};
    for (const [matId, count] of entries) {
        const def  = typeof getMaterial !== 'undefined' ? getMaterial(matId) : null;
        const tier = def?.tier ?? 0;
        const name = def?.name ?? matId.replace(/_/g,' ');
        if (!byTier[tier]) byTier[tier] = [];
        byTier[tier].push({ name, count });
    }

    return Object.keys(byTier).sort((a,b) => Number(a)-Number(b)).map(t => `
        <div class="mat-tier-group">
            ${t > 0 ? `<div class="mat-tier-label">Tier ${t}</div>` : ''}
            ${byTier[t].map(m => `
                <div class="mat-row">
                    <span class="mat-row-name">${m.name}</span>
                    <span class="mat-row-count">×${m.count}</span>
                </div>
            `).join('')}
        </div>
    `).join('');
}

// ── Event binding ──────────────────────────────────────────────────────────────
function _bindCraftActions() {
    const panel  = document.getElementById('crafting-main-panel');
    if (!panel) return;
    const player = PlayerSystem.current;

    // Supply tab profession tabs
    panel.querySelectorAll('[data-sprof]').forEach(btn => {
        btn.addEventListener('click', () => {
            _supplyProfession = btn.dataset.sprof;
            panel.innerHTML   = _buildCraftTab(player, CraftingSystem.getGearInventory(player), true);
            _bindCraftActions();
        });
    });

    panel.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
            const action  = btn.dataset.action;
            const uid     = btn.dataset.uid;
            const result  = _dispatchAction(player, action, uid, btn);
            if (result && !result.ok) {
                Log.add(result.reason, 'warning');
            }
            // Re-render the current tab
            panel.innerHTML = _buildCraftTab(PlayerSystem.current, CraftingSystem.getGearInventory(PlayerSystem.current), true);
            _bindCraftActions();
            // Refresh materials sidebar
            const sidebar = document.querySelector('.crafting-sidebar-card');
            if (sidebar) sidebar.innerHTML = `<div class="crafting-sidebar-title">Materials</div>${_buildMaterialsPanel(PlayerSystem.current)}`;
        });
    });
}

function _dispatchAction(player, action, uid, btn) {
    switch (action) {
        case 'repair-all': return CraftingSystem.repairAll(player);
        case 'repair':     return CraftingSystem.repairItem(player, uid);
        case 'reinforce': return CraftingSystem.reinforceItem(player, uid);
        case 'refine':    return CraftingSystem.refineItem(player, uid);
        case 'modify': {
            const idx = parseInt(btn.dataset.affixIdx ?? '0', 10);
            return CraftingSystem.modifyAffix(player, uid, idx);
        }
        case 'salvage':   return SalvageSystem.salvage(player, uid);
        case 'craft': {
            const recipeId = btn.dataset.recipeId;
            return CraftingSystem.craft(player, recipeId);
        }
    }
    return null;
}

// ── Small helpers ──────────────────────────────────────────────────────────────
function _profLabel(key) {
    const map = {
        blacksmithing: 'Blacksmithing',
        armorsmithing: 'Armorsmithing',
        woodworking:   'Woodworking',
        tailoring:     'Tailoring',
        alchemy:       'Alchemy',
        magesmithing:  'Magesmithing',
    };
    return map[key] || key;
}

function _formatProfessionName(name) { return _profLabel(name); }
