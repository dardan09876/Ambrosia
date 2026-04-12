// js/pages/inventory.js
// Player inventory: view, equip, and sell items from the inventory array.

Router.register('inventory', function () {
    _renderInventoryPage();
});

// ── State ─────────────────────────────────────────────────────────────────────
let _invFilter = 'all';  // 'all' | 'weapon' | 'armor' | 'food' | 'chests'
let _invSort   = 'tier'; // 'tier' | 'name' | 'value'

// ── Main render ───────────────────────────────────────────────────────────────
function _renderInventoryPage() {
    const el = document.getElementById('content-area');
    if (!el) return;

    const player = PlayerSystem.current;
    const inv    = player.inventory;

    // Filter
    let items = inv.slice();
    if (_invFilter === 'weapon')     items = items.filter(i => i.category === 'weapon');
    if (_invFilter === 'armor')      items = items.filter(i => i.category === 'armor');
    if (_invFilter === 'food')       items = items.filter(i => i.type === 'food');
    if (_invFilter === 'chests')     items = items.filter(i => i.type === 'chest');
    if (_invFilter === 'consumable') items = items.filter(i => i.type === 'consumable');

    // Sort
    if (_invSort === 'tier')  items.sort((a, b) => (b.tier ?? -1) - (a.tier ?? -1) || (a.name ?? '').localeCompare(b.name ?? ''));
    if (_invSort === 'name')  items.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    if (_invSort === 'value') items.sort((a, b) => {
        const valOf = i => i.type === 'food' ? (i.goldValue ?? 0) * (i.quantity ?? 1)
                         : i.type === 'chest' ? 0
                         : getItemValue(i);
        return valOf(b) - valOf(a);
    });

    const gearItems  = inv.filter(i => i.type !== 'food' && i.type !== 'chest');
    const totalValue = gearItems.reduce((sum, i) => sum + getItemValue(i), 0);
    const consumableCount = inv.filter(i => i.type === 'consumable').length;

    el.innerHTML = `
        <div class="page-inventory">

            <div class="inv-header">
                <h2 class="heading">Inventory</h2>
                <div class="inv-header-meta">
                    <span class="inv-count">${inv.length} item${inv.length !== 1 ? 's' : ''}</span>
                    <span class="inv-divider">·</span>
                    <span class="inv-total-value gold-text">◈ ${totalValue.toLocaleString()}g total value</span>
                </div>
            </div>

            <div class="inv-controls">
                <div class="inv-filter-tabs">
                    <button class="inv-tab ${_invFilter === 'all'        ? 'active' : ''}" onclick="_invSetFilter('all')">All <span class="inv-tab-count">${inv.length}</span></button>
                    <button class="inv-tab ${_invFilter === 'weapon'     ? 'active' : ''}" onclick="_invSetFilter('weapon')">Weapons <span class="inv-tab-count">${inv.filter(i => i.category === 'weapon').length}</span></button>
                    <button class="inv-tab ${_invFilter === 'armor'      ? 'active' : ''}" onclick="_invSetFilter('armor')">Armor <span class="inv-tab-count">${inv.filter(i => i.category === 'armor').length}</span></button>
                    <button class="inv-tab ${_invFilter === 'food'       ? 'active' : ''}" onclick="_invSetFilter('food')">Food <span class="inv-tab-count">${inv.filter(i => i.type === 'food').length}</span></button>
                    <button class="inv-tab ${_invFilter === 'consumable' ? 'active' : ''}" onclick="_invSetFilter('consumable')">Consumables <span class="inv-tab-count">${consumableCount}</span></button>
                    <button class="inv-tab ${_invFilter === 'chests'     ? 'active' : ''}" onclick="_invSetFilter('chests')">Chests <span class="inv-tab-count">${inv.filter(i => i.type === 'chest').length}</span></button>
                </div>
                <div class="inv-sort-row">
                    <span class="inv-sort-label">Sort:</span>
                    <button class="inv-sort-btn ${_invSort === 'tier'  ? 'active' : ''}" onclick="_invSetSort('tier')">Tier</button>
                    <button class="inv-sort-btn ${_invSort === 'value' ? 'active' : ''}" onclick="_invSetSort('value')">Value</button>
                    <button class="inv-sort-btn ${_invSort === 'name'  ? 'active' : ''}" onclick="_invSetSort('name')">Name</button>
                </div>
            </div>

            ${items.length === 0
                ? `<div class="inv-empty">
                       ${inv.length === 0
                           ? '<p>Your inventory is empty.</p><p class="muted-text">Complete quests to earn chests.</p>'
                           : '<p class="muted-text">No items match this filter.</p>'
                       }
                   </div>`
                : `<div class="inv-list">${items.map(i =>
                    i.type === 'food'       ? _invFoodCard(i)        :
                    i.type === 'chest'      ? _invChestCard(i)       :
                    i.type === 'consumable' ? _invConsumableCard(i)  :
                    _invItemCard(i)
                ).join('')}</div>`
            }
        </div>
    `;
}

// ── Item card HTML ────────────────────────────────────────────────────────────
function _invItemCard(item) {
    const tierColor = (ITEM_TIER_COLORS && ITEM_TIER_COLORS[item.tier]) || '#c9a84c';
    const tierName  = (ITEM_TIER_NAMES  && ITEM_TIER_NAMES[item.tier])  || `T${item.tier}`;
    const value     = getItemValue(item);
    const durPct    = Math.round((item.durability / item.maxDurability) * 100);
    const durColor  = durPct > 60 ? 'var(--success)' : durPct > 25 ? 'var(--warning)' : 'var(--danger)';

    // Skill requirement
    const req         = item.requiredSkill;
    const playerSkill = req ? PlayerSystem.getSkill(req.skill) : 0;
    const meetsReq    = !req || req.level === 0 || playerSkill >= req.level;

    // Type / class badge
    let typeBadge = '';
    if (item.weaponType && WEAPON_TYPE_LABELS) {
        const label = WEAPON_TYPE_LABELS[item.weaponType] || item.weaponType;
        const suffix = item.twoHanded ? ' <span class="inv-2h-tag">2H</span>' : '';
        typeBadge = `<span class="inv-type-badge">${label}${suffix}</span>`;
    } else if (item.armorClass && ARMOR_CLASS_COLORS) {
        const color = ARMOR_CLASS_COLORS[item.armorClass] || 'var(--gold)';
        const label = (ARMOR_CLASS_LABELS && ARMOR_CLASS_LABELS[item.armorClass]) || item.armorClass;
        typeBadge = `<span class="inv-type-badge inv-armor-class" style="color:${color};border-color:${color}44">${label}</span>`;
    }

    // Stat tags
    const statTags = [];
    if (item.damage  > 0) statTags.push(`<span class="inv-stat-tag inv-stat-dmg">ATK ${item.damage}</span>`);
    if (item.defense > 0) statTags.push(`<span class="inv-stat-tag inv-stat-def">DEF ${item.defense}</span>`);

    // Stat bonus chips (from armorClass statBonuses)
    let bonusChips = '';
    if (item.statBonuses) {
        const chips = Object.entries(item.statBonuses).map(([stat, val]) =>
            `<span class="inv-bonus-chip">+${val} ${stat.charAt(0).toUpperCase() + stat.slice(1)}</span>`
        );
        if (chips.length) bonusChips = `<div class="inv-bonus-row">${chips.join('')}</div>`;
    }

    // Quality badge
    const qualDef   = (typeof getQuality !== 'undefined') ? getQuality(item.quality ?? 'standard') : null;
    const qualBadge = qualDef && item.quality && item.quality !== 'standard'
        ? `<span class="inv-quality-badge" style="color:${qualDef.color};border-color:${qualDef.color}44">${qualDef.label}</span>`
        : '';

    // Upgrade level
    const uLvl      = item.upgradeLevel ?? 0;
    const upgradeBadge = uLvl > 0
        ? `<span class="inv-upgrade-badge">+${uLvl}</span>`
        : '';

    // Rarity badge
    const rarityDef  = typeof getRarity !== 'undefined' ? getRarity(item.rarity ?? 'common') : null;
    const rarityBadge = rarityDef && item.rarity && item.rarity !== 'common'
        ? `<span class="inv-rarity-badge" style="color:${rarityDef.color}">${rarityDef.name}</span>`
        : '';

    // Affix chips
    let affixChips = '';
    if (item.affixes?.length) {
        const chips = item.affixes.map(a =>
            `<span class="inv-affix-chip" title="${a.desc ?? ''}">${a.name}</span>`
        );
        affixChips = `<div class="inv-affix-row">${chips.join('')}</div>`;
    }

    return `
        <div class="inv-item-card">
            <div class="inv-item-left">
                <span class="inv-tier-badge" style="background:${tierColor}22;color:${tierColor};border-color:${tierColor}55">${tierName}</span>
            </div>
            <div class="inv-item-body">
                <div class="inv-item-name-row">
                    <span class="inv-item-name">${item.name}</span>
                    ${upgradeBadge}
                    ${typeBadge}
                    ${rarityBadge}
                    <span class="inv-item-slot-label">${_invSlotLabel(item.slot)}</span>
                </div>
                ${qualBadge ? `<div class="inv-qual-row">${qualBadge}</div>` : ''}
                ${statTags.length ? `<div class="inv-item-stats">${statTags.join('')}</div>` : ''}
                ${affixChips}
                ${bonusChips}
                <div class="inv-item-dur-row">
                    <div class="inv-dur-track">
                        <div class="inv-dur-fill" style="width:${durPct}%;background:${durColor}"></div>
                    </div>
                    <span class="inv-dur-text">${item.durability}/${item.maxDurability}</span>
                </div>
                ${req && req.level > 0 && !meetsReq
                    ? `<div class="inv-req-warn">Requires ${skillLabel(req.skill)} ${req.level}</div>`
                    : ''
                }
            </div>
            <div class="inv-item-actions">
                <span class="inv-item-value">◈ ${value}g</span>
                <button
                    class="inv-btn inv-btn-equip${!meetsReq ? ' inv-btn-disabled' : ''}"
                    onclick="_invEquip(${item.uid})"
                    ${!meetsReq ? 'disabled' : ''}
                    title="${!meetsReq ? `Requires ${skillLabel(req.skill)} ${req.level}` : 'Equip this item'}"
                >Equip</button>
                <button
                    class="inv-btn inv-btn-sell"
                    onclick="_invSell(${item.uid})"
                    title="Sell for ${value}g"
                >Sell</button>
            </div>
        </div>
    `;
}

// ── Food item card ────────────────────────────────────────────────────────────
function _invFoodCard(item) {
    const sv       = PlayerSystem.current.survival;
    const isFull   = sv.food >= sv.foodMax;
    const foodPct  = Math.round((sv.food / sv.foodMax) * 100);

    return `
        <div class="inv-item-card inv-food-card">
            <div class="inv-item-left">
                <span class="inv-food-qty-badge">×${item.quantity}</span>
            </div>
            <div class="inv-item-body">
                <div class="inv-item-name-row">
                    <span class="inv-item-name">${item.name}</span>
                    <span class="inv-item-slot-label">Food</span>
                </div>
                <div class="inv-item-desc muted-text">${item.description}</div>
                <div class="inv-item-tags">
                    <span class="market-tag market-tag-food">+${item.foodRestore} food</span>
                    ${(() => {
                        const def = (typeof FOOD_ITEMS !== 'undefined') ? FOOD_ITEMS.find(f => f.id === item.foodId) : null;
                        if (def?.effectDesc) {
                            const warn = def.effectWarn;
                            return `<span class="market-tag" style="background:rgba(${warn ? '180,80,80' : '80,158,107'},0.12);color:${warn ? '#c06060' : '#4a9e6b'};border-color:${warn ? 'rgba(180,80,80,0.3)' : 'rgba(80,158,107,0.3)'}">${def.effectDesc}</span>`;
                        }
                        return '';
                    })()}
                    ${isFull
                        ? `<span class="market-tag" style="background:rgba(201,168,76,0.1);color:var(--gold-dim);border-color:rgba(201,168,76,0.2)">Food full (${foodPct}%)</span>`
                        : `<span class="inv-food-status-text muted-text">${sv.food}/${sv.foodMax} food</span>`
                    }
                </div>
            </div>
            <div class="inv-item-actions">
                <button
                    class="inv-btn inv-btn-consume"
                    onclick="_invConsumeFood(${item.uid})"
                    title="${isFull ? 'Food is already full' : `Restore +${item.foodRestore} food`}"
                >Consume</button>
                <button
                    class="inv-btn inv-btn-drop"
                    onclick="_invDropFood(${item.uid})"
                    title="Discard this food item"
                >Drop</button>
            </div>
        </div>
    `;
}

// ── Chest item card ───────────────────────────────────────────────────────────
function _invChestCard(item) {
    const tierColor = (ITEM_TIER_COLORS && ITEM_TIER_COLORS[item.tier]) || '#c9a84c';
    const def       = CHEST_DEFS && CHEST_DEFS[item.tier];
    const rolls     = def?.rolls ?? 1;

    return `
        <div class="inv-item-card inv-chest-card">
            <div class="inv-item-left">
                <span class="inv-food-qty-badge">×${item.quantity || 1}</span>
            </div>
            <div class="inv-item-body">
                <div class="inv-item-name-row">
                    <span class="inv-item-name">${item.name}</span>
                    <span class="inv-item-slot-label" style="color:${tierColor}">Tier ${item.tier}</span>
                </div>
                <div class="inv-item-desc muted-text">${def?.description ?? ''}</div>
                <div class="inv-item-tags">
                    <span class="market-tag" style="background:rgba(201,168,76,0.12);color:var(--gold);border-color:rgba(201,168,76,0.3)">
                        ⬡ ${rolls} item roll${rolls > 1 ? 's' : ''}
                    </span>
                </div>
            </div>
            <div class="inv-item-actions">
                <button
                    class="inv-btn inv-btn-equip"
                    onclick="_invOpenChest(${item.uid})"
                    title="Open this chest to receive loot"
                >Open</button>
            </div>
        </div>
    `;
}

// ── Consumable item card ──────────────────────────────────────────────────────
function _invConsumableCard(item) {
    const tierColor = (ITEM_TIER_COLORS && ITEM_TIER_COLORS[item.tier]) || '#c9a84c';
    const tierName  = (ITEM_TIER_NAMES  && ITEM_TIER_NAMES[item.tier])  || `T${item.tier}`;
    const qty       = item.quantity || 1;

    const effectLabel = _invConsumableEffectLabel(item.effect);

    return `
        <div class="inv-item-card inv-food-card">
            <div class="inv-item-left">
                <span class="inv-food-qty-badge">×${qty}</span>
            </div>
            <div class="inv-item-body">
                <div class="inv-item-name-row">
                    <span class="inv-item-name">${item.name}</span>
                    <span class="inv-item-slot-label" style="color:${tierColor}">${tierName} Consumable</span>
                </div>
                <div class="inv-item-desc muted-text">${item.description || ''}</div>
                ${effectLabel
                    ? `<div class="inv-item-tags"><span class="market-tag" style="background:rgba(80,158,107,0.12);color:#4a9e6b;border-color:rgba(80,158,107,0.3)">${effectLabel}</span></div>`
                    : ''}
            </div>
            <div class="inv-item-actions">
                <span class="inv-item-value">◈ ${item.value || 0}g</span>
                <button class="inv-btn inv-btn-consume" onclick="_invUseConsumable(${item.uid})" title="Use this item">Use</button>
                <button class="inv-btn inv-btn-sell"    onclick="_invSellConsumable(${item.uid})" title="Sell for ${item.value || 0}g">Sell</button>
            </div>
        </div>
    `;
}

function _invConsumableEffectLabel(effect) {
    if (!effect) return '';
    switch (effect.stat) {
        case 'health':  return `+${effect.amount} Health`;
        case 'mana':    return `+${effect.amount} Mana`;
        case 'stamina': return `+${effect.amount} Stamina`;
        case 'food':    return `+${effect.amount} Food`;
        case 'repair':  return `+${effect.amount} Weapon Durability`;
        case 'ward':    return `Rift Ward (${effect.duration}s)`;
        default:        return '';
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function _invSlotLabel(slot) {
    const map = {
        weapon: 'Weapon', offhand: 'Off-Hand',
        head: 'Head', torso: 'Torso', back: 'Back',
        hands: 'Hands', legs: 'Legs', feet: 'Feet',
        ring: 'Ring', ring_1: 'Ring 1', ring_2: 'Ring 2',
        neck: 'Neck',
    };
    return map[slot] || slot;
}

function _invSetFilter(filter) {
    _invFilter = filter;
    _renderInventoryPage();
}

function _invSetSort(sort) {
    _invSort = sort;
    _renderInventoryPage();
}

// ── Actions ───────────────────────────────────────────────────────────────────
function _invEquip(uid) {
    const result = EquipSystem.equip(uid);
    if (!result.ok) Log.add(result.reason, 'danger');
    _renderInventoryPage();
}

function _invSell(uid) {
    const player = PlayerSystem.current;
    const idx    = player.inventory.findIndex(i => i.uid === uid);
    if (idx === -1) return;

    const item  = player.inventory[idx];
    const value = getItemValue(item);

    player.inventory.splice(idx, 1);
    player.gold += value;

    Log.add(`Sold ${item.name} for ${value}g.`, 'success');
    SaveSystem.save();
    _renderInventoryPage();
}

function _invConsumeFood(uid) {
    const player = PlayerSystem.current;
    const stack  = player.inventory.find(i => i.uid === uid && i.type === 'food');
    if (!stack) return;

    const sv     = player.survival;
    const before = sv.food;
    sv.food      = Math.min(sv.foodMax, sv.food + stack.foodRestore);
    const gained = sv.food - before;

    if (stack.quantity <= 1) {
        player.inventory.splice(player.inventory.indexOf(stack), 1);
    } else {
        stack.quantity--;
    }

    PlayerSystem.updateSurvivalState();

    // Apply food effect if any
    const foodDef = (typeof FOOD_ITEMS !== 'undefined')
        ? FOOD_ITEMS.find(f => f.id === stack.foodId)
        : null;
    if (foodDef?.effect) {
        PlayerSystem.applyActiveEffect(foodDef.effect);
        if (foodDef.effectDesc) {
            Log.add(`Effect: ${foodDef.effectDesc}`, foodDef.effectWarn ? 'warning' : 'info');
        }
    }

    if (gained > 0) {
        Log.add(`Consumed ${stack.name} — +${gained} food (${sv.food}/${sv.foodMax}).`, 'success');
    } else {
        Log.add(`Consumed ${stack.name} — food already full.`, 'warning');
    }

    SaveSystem.save();
    _renderInventoryPage();
}

function _invOpenChest(uid) {
    const result = ChestSystem.openFromInventory(uid);
    if (!result) return;

    if (result.items.length > 0) {
        result.items.forEach(item => {
            const tierName = (ITEM_TIER_NAMES && ITEM_TIER_NAMES[item.tier]) || `T${item.tier}`;
            Log.add(`${result.chestName}: ${item.name} (${tierName})`, 'success');
        });
    } else {
        Log.add(`Opened ${result.chestName} — nothing inside.`, 'warning');
    }

    _renderInventoryPage();
}

function _invDropFood(uid) {
    const player = PlayerSystem.current;
    const idx    = player.inventory.findIndex(i => i.uid === uid && i.type === 'food');
    if (idx === -1) return;

    const stack = player.inventory[idx];
    player.inventory.splice(idx, 1);

    Log.add(`Dropped ${stack.quantity}× ${stack.name}.`, 'warning');
    SaveSystem.save();
    _renderInventoryPage();
}

function _invUseConsumable(uid) {
    const player = PlayerSystem.current;
    const stack  = player.inventory.find(i => i.uid === uid && i.type === 'consumable');
    if (!stack) return;

    const effect = stack.effect;
    if (effect) {
        const stats = player.stats;
        if (effect.stat === 'health' && stats?.health) {
            stats.health.value = Math.min(stats.health.max, stats.health.value + effect.amount);
            Log.add(`Used ${stack.name}: +${effect.amount} health.`, 'success');
        } else if (effect.stat === 'mana' && stats?.mana) {
            stats.mana.value = Math.min(stats.mana.max, stats.mana.value + effect.amount);
            Log.add(`Used ${stack.name}: +${effect.amount} mana.`, 'success');
        } else if (effect.stat === 'stamina' && stats?.stamina) {
            stats.stamina.value = Math.min(stats.stamina.max, stats.stamina.value + effect.amount);
            Log.add(`Used ${stack.name}: +${effect.amount} stamina.`, 'success');
        } else if (effect.stat === 'food' && player.survival) {
            player.survival.food = Math.min(player.survival.foodMax, player.survival.food + effect.amount);
            PlayerSystem.updateSurvivalState();
            Log.add(`Used ${stack.name}: +${effect.amount} food.`, 'success');
        } else if (effect.stat === 'repair') {
            const weapon = player.equipment?.weapon;
            if (weapon && weapon.durability != null) {
                const before = weapon.durability;
                weapon.durability = Math.min(weapon.maxDurability, weapon.durability + effect.amount);
                Log.add(`Used ${stack.name}: weapon repaired +${weapon.durability - before} durability.`, 'success');
            } else {
                Log.add(`No weapon equipped to repair.`, 'warning');
                return;
            }
        } else if (effect.stat === 'ward') {
            Log.add(`Used ${stack.name}: rift ward active for ${effect.duration}s.`, 'success');
        } else {
            Log.add(`Used ${stack.name}.`, 'info');
        }
    }

    if ((stack.quantity || 1) <= 1) {
        player.inventory.splice(player.inventory.indexOf(stack), 1);
    } else {
        stack.quantity--;
    }

    SaveSystem.save();
    _renderInventoryPage();
}

function _invSellConsumable(uid) {
    const player = PlayerSystem.current;
    const idx    = player.inventory.findIndex(i => i.uid === uid && i.type === 'consumable');
    if (idx === -1) return;

    const stack = player.inventory[idx];
    const value = (stack.value || 0) * (stack.quantity || 1);

    player.inventory.splice(idx, 1);
    player.gold += value;

    Log.add(`Sold ${stack.quantity || 1}× ${stack.name} for ${value}g.`, 'success');
    SaveSystem.save();
    _renderInventoryPage();
}
