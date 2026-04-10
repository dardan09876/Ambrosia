// js/pages/market.js
// Market page — two tabs: Food shop and Repair shop.

Router.register('market', function () {
    _renderMarketPage();
});

// ── State ─────────────────────────────────────────────────────────────────────
let _marketTab = 'food'; // 'food' | 'repair' | 'shrine'

function _isAtCapital() {
    const player = PlayerSystem.current;
    if (!player || typeof FACTION_CAPITALS === 'undefined') return false;
    return Object.values(FACTION_CAPITALS).includes(player.location);
}

// ── Main render ───────────────────────────────────────────────────────────────
function _renderMarketPage() {
    const el = document.getElementById('content-area');
    if (!el) return;

    const player     = PlayerSystem.current;
    if (player && typeof _tutorialComplete === 'function' && !_tutorialComplete()) {
        el.innerHTML = `<div class="page"><div class="page-header"><h1 class="page-title">Market</h1></div><div class="page-body"><p class="page-empty-state">Complete your faction's introduction in the capital city to unlock this page.</p></div></div>`;
        return;
    }
    const hasMarket  = typeof MapSystem === 'undefined' || MapSystem.hasActivity('market');
    const regionName = typeof MapSystem !== 'undefined' ? MapSystem.getCurrentRegionName() : '';

    if (!hasMarket) {
        el.innerHTML = `
            <div class="page-market">
                <div class="market-header">
                    <div class="market-header-left">
                        <h2 class="heading">Market</h2>
                    </div>
                </div>
                <div class="page-facility-blocked">
                    <p>There is no market in ${regionName}.</p><p class="muted-text">Travel to a region with a market to buy food and repair equipment.</p>
                </div>
            </div>
        `;
        return;
    }

    el.innerHTML = `
        <div class="page-market">

            <div class="market-header">
                <div class="market-header-left">
                    <h2 class="heading">${regionName} Market</h2>
                    <p class="market-subtitle">A row of stalls wedged between faction patrols. The merchants ask no questions.</p>
                </div>
                <div class="market-gold-display">
                    <span class="market-gold-icon">◈</span>
                    <span class="market-gold-val">${player.gold.toLocaleString()}</span>
                    <span class="market-gold-label">Gold</span>
                </div>
            </div>

            <div class="market-tabs">
                <button class="market-tab ${_marketTab === 'food'   ? 'active' : ''}" onclick="_marketSetTab('food')">Food</button>
                <button class="market-tab ${_marketTab === 'repair' ? 'active' : ''}" onclick="_marketSetTab('repair')">Repair</button>
                ${_isAtCapital() ? `<button class="market-tab market-tab-shrine ${_marketTab === 'shrine' ? 'active' : ''}" onclick="_marketSetTab('shrine')">Shrine</button>` : ''}
            </div>

            <div class="market-body">
                ${_marketTab === 'food' ? _marketFoodTab(player) : _marketTab === 'shrine' ? _marketShrineTab(player) : _marketRepairTab(player)}
            </div>

        </div>
    `;
}

// ── Food tab ──────────────────────────────────────────────────────────────────
function _marketFoodTab(player) {
    const shopItems = FOOD_ITEMS.filter(f => f.shopAvailable !== false);
    const rows = shopItems.map(item => {
        const canAfford = player.gold >= item.goldValue;
        const inBag     = player.inventory.find(i => i.type === 'food' && i.foodId === item.id);
        const qty       = inBag ? inBag.quantity : 0;

        let effectTag = '';
        if (item.effectDesc) {
            const warn = item.effectWarn;
            effectTag = `<span class="market-tag" style="background:rgba(${warn ? '180,80,80' : '80,158,107'},0.12);color:${warn ? '#c06060' : '#4a9e6b'};border-color:${warn ? 'rgba(180,80,80,0.3)' : 'rgba(80,158,107,0.3)'}">${item.effectDesc}</span>`;
        }

        return `
            <div class="market-item-row ${!canAfford ? 'market-row-poor' : ''}">
                <div class="market-item-body">
                    <div class="market-item-name-row">
                        <span class="market-item-name">${item.name}</span>
                        ${qty > 0 ? `<span class="market-inv-qty">×${qty} in bag</span>` : ''}
                    </div>
                    <div class="market-item-desc muted-text">${item.description}</div>
                    <div class="market-item-tags">
                        <span class="market-tag market-tag-food">+${item.foodRestore} food</span>
                        ${effectTag}
                        ${!canAfford ? '<span class="market-tag market-tag-poor">Insufficient gold</span>' : ''}
                    </div>
                </div>
                <div class="market-item-actions">
                    <span class="market-item-cost">◈ ${item.goldValue}g</span>
                    <button
                        class="market-btn market-btn-buy${!canAfford ? ' market-btn-disabled' : ''}"
                        onclick="_marketBuyFood('${item.id}')"
                        ${!canAfford ? 'disabled' : ''}
                        title="Add to inventory"
                    >Buy</button>
                </div>
            </div>
        `;
    });

    return `
        <div class="market-food-tab">
            <p class="market-food-note muted-text">Food is stored in your inventory. Open your bag to consume it whenever you like.</p>
            <div class="market-item-list">${rows.join('')}</div>
        </div>
    `;
}

// ── Shrine tab (faction capitals only) ───────────────────────────────────────
function _marketShrineTab(player) {
    const corruption = player.corruption ?? 0;
    const tier       = PlayerSystem.getCorruptionTier();
    const power      = PlayerSystem.getEffectiveCorruptionPower();
    const cost       = Math.max(50, Math.floor(50 + corruption * corruption * 0.2));
    const canAfford  = player.gold >= cost;
    const hasCorruption = corruption > 0;

    // Bar width — cap visual bar at 400 for display, beyond that it's full
    const barPct = Math.min(100, Math.round((corruption / 400) * 100));

    // Next tier info
    const nextTier = CORRUPTION_TIERS.find(t => t.min > corruption);

    // Build effects list
    const bonuses = [];
    const penalties = [];
    if (power > 0) {
        bonuses.push(`+${Math.floor(power / 7)}% quest success`);
        bonuses.push(`Effective power: ${power}`);
    }
    const rp = tier.regenPenalties;
    if (rp.health)  penalties.push(`Health regen −${Math.round(rp.health  * 100)}%`);
    if (rp.stamina) penalties.push(`Stamina regen −${Math.round(rp.stamina * 100)}%`);
    if (rp.energy)  penalties.push(`Energy regen −${Math.round(rp.energy  * 100)}%`);
    if (rp.focus)   penalties.push(`Focus regen −${Math.round(rp.focus    * 100)}%`);
    const tierIds = ['corrupted', 'fallen', 'abyssal'];
    if (tierIds.includes(tier.id)) {
        const freq = { corrupted: 'rare', fallen: 'occasional', abyssal: 'frequent' }[tier.id];
        penalties.push(`Instability events (${freq})`);
    }

    return `
        <div class="market-shrine-tab">
            <div class="shrine-header">
                <div class="shrine-title">Purification Shrine</div>
                <div class="shrine-subtitle muted-text">The priests of the old order accept gold in exchange for spiritual cleansing.</div>
            </div>

            <div class="shrine-corruption-display">
                <div class="shrine-tier-row">
                    <span class="shrine-tier-badge" style="background:${tier.color}22;color:${tier.color};border-color:${tier.color}55">${tier.label}</span>
                    <span class="shrine-corruption-raw" style="color:${tier.color}">${corruption} corruption</span>
                    ${nextTier ? `<span class="shrine-next-tier muted-text">→ ${nextTier.label} at ${nextTier.min}</span>` : ''}
                </div>
                <div class="shrine-corruption-bar-wrap">
                    <div class="shrine-corruption-track">
                        <div class="shrine-corruption-fill" style="width:${barPct}%;background:${tier.color}"></div>
                    </div>
                </div>
                <div class="shrine-eff-power">
                    Effective power: <strong style="color:${tier.color}">${power}</strong>
                    <span class="muted-text shrine-power-note">(diminishing returns — early corruption is strongest)</span>
                </div>

                ${bonuses.length ? `
                <div class="shrine-effects-col">
                    ${bonuses.map(b => `<div class="shrine-effect shrine-effect-bonus">↑ ${b}</div>`).join('')}
                </div>` : ''}

                ${penalties.length ? `
                <div class="shrine-effects-col">
                    ${penalties.map(p => `<div class="shrine-effect shrine-effect-penalty">↓ ${p}</div>`).join('')}
                </div>` : ''}

                ${corruption === 0 ? `<div class="shrine-clean-msg">Your soul is uncorrupted.</div>` : ''}
            </div>

            ${hasCorruption ? `
            <div class="shrine-cleanse-panel">
                <div class="shrine-cleanse-cost">
                    <span class="muted-text">Cleansing cost:</span>
                    <span class="shrine-cost-value gold-text">◈ ${cost.toLocaleString()}g</span>
                    <span class="muted-text">(scales with corruption²)</span>
                </div>
                <button
                    class="market-btn market-btn-shrine${!canAfford ? ' market-btn-disabled' : ''}"
                    onclick="_marketCleanse()"
                    ${!canAfford ? 'disabled' : ''}
                    title="${canAfford ? `Purify all corruption for ${cost.toLocaleString()}g` : `Need ${cost.toLocaleString()}g`}"
                >Purify Soul — ◈ ${cost.toLocaleString()}g</button>
                ${!canAfford ? `<p class="muted-text shrine-poor">You need ${(cost - player.gold).toLocaleString()}g more.</p>` : ''}
            </div>` : ''}
        </div>
    `;
}

// ── Repair tab ────────────────────────────────────────────────────────────────
function _marketRepairTab(player) {
    // Gather all damaged items from both inventory and equipped slots
    const damaged = [];

    for (const item of player.inventory) {
        if (item.durability < item.maxDurability) {
            damaged.push({ item, source: 'inventory' });
        }
    }
    for (const [slot, item] of Object.entries(player.equipment)) {
        if (item && item.durability < item.maxDurability) {
            damaged.push({ item, source: 'equipped', slot });
        }
    }

    if (damaged.length === 0) {
        return `
            <div class="market-repair-tab">
                <div class="market-empty">
                    <p>All your equipment is in perfect condition.</p>
                    <p class="muted-text">Items lose durability as you use them in quests.</p>
                </div>
            </div>
        `;
    }

    // Total cost to repair everything
    const totalCost = damaged.reduce((sum, { item }) => sum + _repairCost(item), 0);
    const canAffordAll = player.gold >= totalCost;

    const rows = damaged.map(({ item, source, slot }) => {
        const cost       = _repairCost(item);
        const canAfford  = player.gold >= cost;
        const durPct     = Math.round((item.durability / item.maxDurability) * 100);
        const durColor   = durPct > 60 ? 'var(--success)' : durPct > 25 ? 'var(--warning)' : 'var(--danger)';
        const tierColor  = (ITEM_TIER_COLORS && ITEM_TIER_COLORS[item.tier]) || '#c9a84c';
        const tierName   = (ITEM_TIER_NAMES  && ITEM_TIER_NAMES[item.tier])  || `T${item.tier}`;
        const missing    = item.maxDurability - item.durability;
        const sourceTag  = source === 'equipped'
            ? `<span class="market-tag market-tag-equipped">Equipped · ${_equipSlotLabel(slot)}</span>`
            : `<span class="market-tag market-tag-inv">In Bag</span>`;

        return `
            <div class="market-item-row ${!canAfford ? 'market-row-poor' : ''}">
                <div class="market-item-body">
                    <div class="market-item-name-row">
                        <span class="market-tier-badge" style="background:${tierColor}22;color:${tierColor};border-color:${tierColor}55">${tierName}</span>
                        <span class="market-item-name">${item.name}</span>
                    </div>
                    <div class="market-item-tags">${sourceTag}</div>
                    <div class="market-dur-row">
                        <div class="market-dur-track">
                            <div class="market-dur-fill" style="width:${durPct}%;background:${durColor}"></div>
                        </div>
                        <span class="market-dur-text">${item.durability}/${item.maxDurability}</span>
                        <span class="market-dur-missing muted-text">(${missing} damaged)</span>
                    </div>
                </div>
                <div class="market-item-actions">
                    <span class="market-item-cost">◈ ${cost}g</span>
                    <button
                        class="market-btn market-btn-repair${!canAfford ? ' market-btn-disabled' : ''}"
                        onclick="_marketRepairItem(${item.uid})"
                        ${!canAfford ? 'disabled' : ''}
                        title="Restore ${missing} durability for ${cost}g"
                    >Repair</button>
                </div>
            </div>
        `;
    });

    return `
        <div class="market-repair-tab">
            <div class="market-repair-summary">
                <span class="muted-text">${damaged.length} item${damaged.length !== 1 ? 's' : ''} need repair</span>
                <button
                    class="market-btn market-btn-repairall${!canAffordAll ? ' market-btn-disabled' : ''}"
                    onclick="_marketRepairAll()"
                    ${!canAffordAll ? 'disabled' : ''}
                    title="${canAffordAll ? `Repair all for ${totalCost}g` : 'Not enough gold'}"
                >Repair All — ◈ ${totalCost}g</button>
            </div>
            <div class="market-item-list">${rows.join('')}</div>
        </div>
    `;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Repair cost: 0.6g per durability point, scaled by tier
function _repairCost(item) {
    const missing = item.maxDurability - item.durability;
    return Math.max(1, Math.ceil(missing * item.tier * 0.6));
}

function _equipSlotLabel(slot) {
    const map = {
        weapon: 'Weapon', offhand: 'Off-Hand', head: 'Head',
        torso: 'Torso', back: 'Back', hands: 'Hands', legs: 'Legs', feet: 'Feet',
    };
    return map[slot] || slot;
}

// ── Actions ───────────────────────────────────────────────────────────────────
function _marketSetTab(tab) {
    _marketTab = tab;
    _renderMarketPage();
}

function _marketCleanse() {
    const result = PlayerSystem.cleanseCorruption();
    if (!result.ok) {
        Log.add(result.reason, 'danger');
    }
    _renderMarketPage();
}

function _marketBuyFood(foodId) {
    const player = PlayerSystem.current;
    const food   = FOOD_ITEMS.find(f => f.id === foodId);
    if (!food || food.shopAvailable === false) return;

    if (player.gold < food.goldValue) {
        Log.add('Not enough gold.', 'danger');
        return;
    }

    player.gold -= food.goldValue;

    // Stack with existing inventory entry if possible
    const existing = player.inventory.find(i => i.type === 'food' && i.foodId === food.id);
    if (existing) {
        existing.quantity++;
    } else {
        player.inventory.push({
            type:        'food',
            foodId:      food.id,
            name:        food.name,
            description: food.description,
            foodRestore: food.foodRestore,
            goldValue:   food.goldValue,
            quantity:    1,
            uid:         Date.now() + Math.random(),
        });
    }

    Log.add(`Bought ${food.name} for ${food.goldValue}g — stored in inventory.`, 'success');
    SaveSystem.save();
    _renderMarketPage();
}

function _marketRepairItem(uid) {
    const player = PlayerSystem.current;
    const item   = _marketFindItem(player, uid);
    if (!item) return;

    const cost = _repairCost(item);
    if (player.gold < cost) {
        Log.add('Not enough gold.', 'danger');
        return;
    }

    player.gold       -= cost;
    item.durability    = item.maxDurability;

    Log.add(`Repaired ${item.name} for ${cost}g.`, 'success');
    SaveSystem.save();
    _renderMarketPage();
}

function _marketRepairAll() {
    const player  = PlayerSystem.current;
    const damaged = [];

    for (const item of player.inventory) {
        if (item.durability < item.maxDurability) damaged.push(item);
    }
    for (const item of Object.values(player.equipment)) {
        if (item && item.durability < item.maxDurability) damaged.push(item);
    }

    const totalCost = damaged.reduce((sum, item) => sum + _repairCost(item), 0);
    if (player.gold < totalCost) {
        Log.add('Not enough gold to repair everything.', 'danger');
        return;
    }

    for (const item of damaged) {
        player.gold    -= _repairCost(item);
        item.durability = item.maxDurability;
    }

    Log.add(`Repaired ${damaged.length} item${damaged.length !== 1 ? 's' : ''} for ${totalCost}g.`, 'success');
    SaveSystem.save();
    _renderMarketPage();
}

// Find an item by uid in both inventory and equipment
function _marketFindItem(player, uid) {
    const fromInv = player.inventory.find(i => i.uid === uid);
    if (fromInv) return fromInv;
    return Object.values(player.equipment).find(i => i && i.uid === uid) || null;
}
