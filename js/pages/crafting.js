// js/pages/crafting.js
// Crafting page - ties together recipes, materials, and profession progression

Router.register('crafting', function renderCrafting(container) {
    _renderCraftingPage(container);
});

// Current active profession tab
let _activeProfession = 'alchemy';

function _renderCraftingPage(container) {
    const player = PlayerSystem.current;
    if (!player) return;

    const professions = CraftingSystem.getAllProfessions(player);
    const activeProfessionSkill = professions[_activeProfession] || 0;
    const availableRecipes = CraftingSystem.getAvailableRecipes(player, _activeProfession);

    container.innerHTML = `
        <div class="page">
            <div class="page-header">
                <h1 class="page-title">Crafting</h1>
                <p class="page-subtitle">Gather materials, craft supplies, and upgrade your gear.</p>
            </div>

            <div class="crafting-layout">
                <!-- Left: Profession tabs and recipes -->
                <div class="crafting-main">
                    <!-- Profession tabs -->
                    <div class="profession-tabs">
                        ${Object.entries(professions).map(([profession, skill]) => `
                            <button class="profession-tab ${_activeProfession === profession ? 'active' : ''}"
                                    data-profession="${profession}"
                                    title="${profession}: Level ${skill}">
                                <span class="prof-name">${_formatProfessionName(profession)}</span>
                                <span class="prof-level">${skill}</span>
                            </button>
                        `).join('')}
                    </div>

                    <!-- Recipes list -->
                    <div class="recipes-section">
                        <div class="recipes-header">
                            <h3>${_formatProfessionName(_activeProfession)}</h3>
                            <span class="skill-badge">Skill ${activeProfessionSkill}</span>
                        </div>

                        ${availableRecipes.length > 0 ? `
                            <div class="recipes-list">
                                ${availableRecipes.map(recipe => _buildRecipeCard(player, recipe)).join('')}
                            </div>
                        ` : `
                            <div class="no-recipes">
                                <p>No recipes available yet.</p>
                                <p class="muted-text">Increase your ${_activeProfession} skill to unlock more recipes.</p>
                            </div>
                        `}
                    </div>
                </div>

                <!-- Right: Materials inventory and info -->
                <div class="crafting-sidebar">
                    <!-- Materials inventory -->
                    <div class="card materials-card">
                        <div class="card-header">Materials</div>
                        <div class="card-body">
                            ${_buildMaterialsInventory(player)}
                        </div>
                    </div>

                    <!-- Salvage info -->
                    <div class="card salvage-card">
                        <div class="card-header">Salvage</div>
                        <div class="card-body">
                            <p class="muted-text" style="font-size:12px;line-height:1.6">
                                Break down unwanted gear into materials. Items in poor condition return less.
                            </p>
                            <button class="btn-secondary" style="width:100%;margin-top:8px" id="open-salvage-btn">
                                Open Salvage
                            </button>
                        </div>
                    </div>

                    <!-- Quick tips -->
                    <div class="card tips-card">
                        <div class="card-header">Tips</div>
                        <div class="card-body">
                            <div class="tip">
                                <span class="tip-bullet">◆</span>
                                <span>Gather materials from quests and salvage</span>
                            </div>
                            <div class="tip">
                                <span class="tip-bullet">◆</span>
                                <span>Craft consumables for survival prep</span>
                            </div>
                            <div class="tip">
                                <span class="tip-bullet">◆</span>
                                <span>Each craft increases profession skill</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    _bindCraftingEvents(container, player);
}

function _buildRecipeCard(player, recipe) {
    const canCraft = CraftingSystem.canCraft(player, recipe.id);
    const missingMaterials = !canCraft.ok;

    return `
        <div class="recipe-card ${missingMaterials ? 'locked' : ''}">
            <div class="recipe-header">
                <div class="recipe-title">${recipe.name}</div>
                <div class="recipe-skill">Skill ${recipe.requiredSkill}</div>
            </div>

            <p class="recipe-desc">${recipe.description}</p>

            <div class="recipe-materials">
                <div class="materials-label">Materials:</div>
                <div class="materials-list">
                    ${recipe.materials.map(mat => {
                        const playerHas = CraftingSystem.getMaterialCount(player, mat.itemId);
                        const hasMaterial = playerHas >= mat.amount;
                        const matDef = typeof getMaterial !== 'undefined' ? getMaterial(mat.itemId) : null;
                        const matName = matDef ? matDef.name : mat.itemId;
                        return `
                            <div class="material-req ${hasMaterial ? 'have' : 'missing'}">
                                <span class="mat-icon">${hasMaterial ? '✓' : '✗'}</span>
                                <span class="mat-name">${matName}</span>
                                <span class="mat-count">${playerHas}/${mat.amount}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <div class="recipe-footer">
                <div class="recipe-cost">
                    <span class="gold-icon">◈</span>
                    <span>${recipe.goldCost}g</span>
                </div>
                <button class="btn-craft ${missingMaterials ? 'btn-craft-disabled' : ''}"
                        data-recipe-id="${recipe.id}"
                        ${missingMaterials ? 'disabled title="' + canCraft.reason + '"' : ''}>
                    Craft
                </button>
            </div>
        </div>
    `;
}

function _buildMaterialsInventory(player) {
    const materials = CraftingSystem.getAllMaterials(player);
    const materialIds = Object.keys(materials).filter(id => materials[id] > 0);

    if (materialIds.length === 0) {
        return `
            <p class="muted-text" style="text-align:center;padding:20px 0">
                No materials collected yet.<br/>
                <span style="font-size:11px">Complete quests and salvage items to gather materials.</span>
            </p>
        `;
    }

    // Group materials by tier
    const byTier = {};
    for (const matId of materialIds) {
        const count = materials[matId];
        const matDef = typeof getMaterial !== 'undefined' ? getMaterial(matId) : null;
        if (matDef) {
            if (!byTier[matDef.tier]) byTier[matDef.tier] = [];
            byTier[matDef.tier].push({ id: matId, name: matDef.name, count });
        }
    }

    return `
        <div class="materials-inventory">
            ${Object.keys(byTier).sort().map(tier => `
                <div class="material-tier">
                    <div class="tier-label">Tier ${tier}</div>
                    <div class="tier-materials">
                        ${byTier[tier].map(mat => `
                            <div class="material-item">
                                <span class="mat-name">${mat.name}</span>
                                <span class="mat-amount">×${mat.count}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function _formatProfessionName(profession) {
    const names = {
        blacksmithing: 'Blacksmithing',
        armorsmithing: 'Armorsmithing',
        woodworking: 'Woodworking',
        tailoring: 'Tailoring',
        alchemy: 'Alchemy',
        magesmithing: 'Magesmithing',
    };
    return names[profession] || profession;
}

function _bindCraftingEvents(container, player) {
    // Profession tab clicks
    container.querySelectorAll('.profession-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            _activeProfession = btn.dataset.profession;
            Router._load('crafting');
        });
    });

    // Craft buttons
    container.querySelectorAll('.btn-craft:not(.btn-craft-disabled)').forEach(btn => {
        btn.addEventListener('click', () => {
            const recipeId = btn.dataset.recipeId;
            const result = CraftingSystem.craft(player, recipeId);

            if (result.ok) {
                Router._load('crafting');
            } else {
                Log.add(result.reason, 'danger');
            }
        });
    });

    // Salvage button
    const salvageBtn = container.querySelector('#open-salvage-btn');
    if (salvageBtn) {
        salvageBtn.addEventListener('click', () => {
            _showSalvageModal(player);
        });
    }
}

// Simple salvage modal
function _showSalvageModal(player) {
    if (!player.inventory || player.inventory.length === 0) {
        Log.add('You have no items to salvage.', 'warning');
        return;
    }

    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'salvage-modal-overlay';
    modal.innerHTML = `
        <div class="salvage-modal">
            <div class="modal-header">
                <h2>Salvage Equipment</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="salvage-items">
                    ${player.inventory.map((item, idx) => {
                        if (!item.uid) return ''; // Skip non-items
                        const canSalvage = typeof SalvageSystem !== 'undefined' ? SalvageSystem.canSalvage(item) : false;
                        return `
                            <div class="salvage-item ${canSalvage ? 'salvageable' : 'locked'}">
                                <div class="salvage-item-info">
                                    <div class="salvage-item-name">${item.displayName || item.itemId}</div>
                                    <div class="salvage-item-rarity" style="color:${item.rarity ? _rarityColor(item.rarity) : '#999'}">
                                        ${item.rarity || 'common'}
                                    </div>
                                </div>
                                ${canSalvage ? `
                                    <button class="btn-salvage" data-item-uid="${item.uid}">Salvage</button>
                                ` : `
                                    <span class="cant-salvage">Can't salvage</span>
                                `}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close button
    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.remove();
    });

    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    // Salvage buttons
    modal.querySelectorAll('.btn-salvage').forEach(btn => {
        btn.addEventListener('click', () => {
            const uid = btn.dataset.itemUid;
            if (typeof SalvageSystem !== 'undefined') {
                const result = SalvageSystem.salvage(player, uid);
                if (result.ok) {
                    // Remove item from modal
                    btn.closest('.salvage-item').remove();
                    Log.add(result.message, 'success');
                    Router._load('crafting'); // Refresh materials
                } else {
                    Log.add(result.reason, 'danger');
                }
            }
        });
    });
}

function _rarityColor(rarity) {
    const colors = {
        common: '#a0a0a0',
        uncommon: '#4a9e6b',
        rare: '#4a9edb',
        epic: '#9b6bd4',
        legendary: '#c9a84c',
    };
    return colors[rarity] || '#999';
}
