// js/pages/arena.js
// Arena page — lobby (with vendor/upgrades tabs), active combat, and results.

let _arenaTab = 'arena'; // 'arena' | 'shop' | 'upgrades'

Router.register('arena', function renderArena(container) {
    const player = PlayerSystem.current;
    if (!player) return;

    if (!ArenaState.inRun) {
        _renderArenaLobby(container, player);
    } else {
        _renderArenaCombat(container, player);
    }
});

// ── Tab switch (called from inline onclick) ───────────────────────────────────

function arenaSetTab(tab) {
    _arenaTab = tab;
    const container = document.getElementById('content-area');
    if (container) Router._load('arena');
}

// ── Lobby ─────────────────────────────────────────────────────────────────────

function _renderArenaLobby(container, player) {
    const tokens = player.arenaTokens || 0;

    const tabBar = `
        <div class="arena-tab-bar">
            <button class="arena-tab-btn ${_arenaTab === 'arena'    ? 'active' : ''}" onclick="arenaSetTab('arena')">⚔ Arena</button>
            <button class="arena-tab-btn ${_arenaTab === 'shop'     ? 'active' : ''}" onclick="arenaSetTab('shop')">🏪 Vendor</button>
            <button class="arena-tab-btn ${_arenaTab === 'upgrades' ? 'active' : ''}" onclick="arenaSetTab('upgrades')">📈 Upgrades</button>
        </div>
    `;

    let body = '';
    if (_arenaTab === 'arena')    body = _arenaLobbyMain(player, tokens);
    if (_arenaTab === 'shop')     body = _arenaVendorTab(player, tokens);
    if (_arenaTab === 'upgrades') body = _arenaUpgradesTab(player, tokens);

    container.innerHTML = `
        <div class="page">
            <div class="page-header">
                <h1 class="page-title">Arena</h1>
                <p class="page-subtitle">
                    <span class="arena-token-inline">⚔ ${tokens} Token${tokens !== 1 ? 's' : ''}</span>
                </p>
            </div>
            ${tabBar}
            ${body}
        </div>
    `;
}

// ── Tab: Arena (main lobby) ───────────────────────────────────────────────────

function _arenaLobbyMain(player, tokens) {
    const loadout = buildPlayerLoadout(player.skills);
    const loadoutHtml = loadout.map(id => {
        const a = getArenaAbility(id);
        return a ? `<span class="arena-ability-tag">${a.name}</span>` : '';
    }).join('');

    const prevRounds = Math.max(0, ArenaState.round - 1);
    const prevGold   = ArenaState.totalGold;
    const prevTokens = ArenaState.totalTokens;
    const hasPrevRun = prevRounds > 0 || ArenaState.round > 0;
    const prevSummary = hasPrevRun
        ? `<div class="arena-last-run">
               Last run: <strong>${prevRounds}</strong> round${prevRounds !== 1 ? 's' : ''} cleared
               · <strong>${prevGold}g</strong> · <strong>${prevTokens}</strong> token${prevTokens !== 1 ? 's' : ''}.
           </div>`
        : '';

    // Active pending buffs
    const pending = player.pendingArenaBuffs || [];
    const pendingHtml = pending.length > 0
        ? `<div class="arena-pending-buffs">
               <span class="arena-buff-label">Staged for next run:</span>
               ${pending.map(id => {
                   const def = (typeof getArenaConsumable !== 'undefined') ? getArenaConsumable(id) : null;
                   return def ? `<span class="arena-buff-tag">${def.icon} ${def.name}</span>` : '';
               }).join('')}
           </div>`
        : '';

    // Active equipped arena items
    const arenaGear = Object.values(player.equipment).filter(i => i && i.tags?.includes('arena_exclusive'));
    const gearHtml  = arenaGear.length > 0
        ? `<div class="arena-active-gear">
               <span class="arena-buff-label">Arena gear equipped:</span>
               ${arenaGear.map(i => `<span class="arena-gear-tag">⚔ ${i.name}</span>`).join('')}
           </div>`
        : '';

    return `
        ${prevSummary}
        <div class="arena-grid">
            <div class="card">
                <div class="card-header">Combat Loadout</div>
                <div class="card-body">
                    <p class="arena-hint">Abilities assigned automatically from your strongest skills.</p>
                    <div class="arena-ability-list">${loadoutHtml || '<em>No skills trained — basic attack only.</em>'}</div>
                    ${gearHtml}
                    ${pendingHtml}
                </div>
            </div>

            <div class="card arena-start-card">
                <div class="card-header">Enter the Arena</div>
                <div class="card-body">
                    <p>Your stats carry into the run. Mana and stamina are spent during combat.
                       Health persists across rounds until the run ends.</p>
                    <p class="arena-warn">You cannot pause once you start.</p>
                    ${(() => {
                        const hp    = player.stats.health.value;
                        const maxHp = PlayerSystem.getStatMax('health');
                        if (hp < maxHp) {
                            return `<p class="arena-warn">You must be at full health to enter the arena. (${hp} / ${maxHp} HP)</p>
                                    <button class="btn btn-disabled arena-start-btn" disabled>Start Arena Run</button>`;
                        }
                        return `<button class="btn btn-primary arena-start-btn" onclick="CombatEngine.startRun()">Start Arena Run</button>`;
                    })()}
                </div>
            </div>
        </div>
    `;
}

// ── Tab: Vendor ───────────────────────────────────────────────────────────────

function _arenaVendorTab(player, tokens) {
    const equipment   = typeof ARENA_SHOP_ITEMS    !== 'undefined' ? ARENA_SHOP_ITEMS    : [];
    const consumables = typeof ARENA_CONSUMABLES   !== 'undefined' ? ARENA_CONSUMABLES   : [];
    const chests      = typeof ARENA_CHEST_SHOP    !== 'undefined' ? ARENA_CHEST_SHOP    : [];

    const equipRows = equipment.map(item => {
        const canAfford = tokens >= item.cost;
        const owned = Object.values(player.equipment).some(e => e && e.id === item.id)
                   || player.inventory.some(i => i.id === item.id);
        const btnLabel = owned ? 'Owned' : `${item.cost} ⚔`;
        const btnClass = owned ? 'btn-disabled' : (canAfford ? 'btn-primary' : 'btn-disabled');
        const onclick  = (!owned && canAfford) ? `onclick="arenaBuyItem('${item.id}')"` : '';

        const statLine = [
            item.damage  > 0 ? `⚔ ${item.damage} ATK`  : '',
            item.defense > 0 ? `◈ ${item.defense} DEF`  : '',
        ].filter(Boolean).join('  ');

        return `
            <div class="vendor-item-row">
                <div class="vendor-item-info">
                    <span class="vendor-item-name">${item.name}</span>
                    <span class="vendor-item-slot">${item.slot} · T${item.tier}</span>
                    ${statLine ? `<span class="vendor-item-stats">${statLine}</span>` : ''}
                    <span class="vendor-item-desc">${item.description}</span>
                </div>
                <button class="btn btn-sm ${btnClass}" ${onclick}>${btnLabel}</button>
            </div>
        `;
    }).join('');

    const consumableRows = consumables.map(c => {
        const stock    = (player.arenaConsumables || {})[c.id] || 0;
        const pending  = (player.pendingArenaBuffs || []).filter(id => id === c.id).length;
        const canAfford = tokens >= c.cost;
        const useDisabled = stock <= 0 || pending > 0;
        return `
            <div class="vendor-item-row">
                <div class="vendor-item-info">
                    <span class="vendor-item-name">${c.icon} ${c.name}</span>
                    <span class="vendor-item-desc">${c.description}</span>
                    <span class="vendor-item-slot">Owned: ${stock}${pending > 0 ? ' · <em>staged</em>' : ''}</span>
                </div>
                <div class="vendor-consumable-btns">
                    <button class="btn btn-sm ${canAfford ? 'btn-secondary' : 'btn-disabled'}"
                        ${canAfford ? `onclick="arenaBuyConsumable('${c.id}')"` : ''}>
                        Buy ${c.cost}⚔
                    </button>
                    <button class="btn btn-sm ${useDisabled ? 'btn-disabled' : 'btn-primary'}"
                        ${!useDisabled ? `onclick="arenaUseConsumable('${c.id}')"` : ''}>
                        Use
                    </button>
                </div>
            </div>
        `;
    }).join('');

    const chestRows = chests.map(ch => {
        const canAfford = tokens >= ch.cost;
        return `
            <div class="vendor-item-row">
                <div class="vendor-item-info">
                    <span class="vendor-item-name">📦 ${ch.name}</span>
                    <span class="vendor-item-desc">Tier ${ch.tier} chest added to inventory</span>
                </div>
                <button class="btn btn-sm ${canAfford ? 'btn-secondary' : 'btn-disabled'}"
                    ${canAfford ? `onclick="arenaBuyChest(${ch.tier})"` : ''}>
                    ${ch.cost} ⚔
                </button>
            </div>
        `;
    }).join('');

    return `
        <div class="vendor-section">
            <div class="vendor-section-header">⚔ Exclusive Gear</div>
            <p class="vendor-hint">Arena-exclusive items not found anywhere else.</p>
            <div class="vendor-list">${equipRows || '<p class="arena-hint">No items available.</p>'}</div>
        </div>
        <div class="vendor-section">
            <div class="vendor-section-header">🧪 Run Consumables</div>
            <p class="vendor-hint">Stage consumables before a run via "Use". Consumed on run start.</p>
            <div class="vendor-list">${consumableRows}</div>
        </div>
        <div class="vendor-section">
            <div class="vendor-section-header">📦 Chest Shop</div>
            <p class="vendor-hint">Spend tokens for guaranteed chest loot.</p>
            <div class="vendor-list">${chestRows}</div>
        </div>
    `;
}

// ── Tab: Upgrades ─────────────────────────────────────────────────────────────

function _arenaUpgradesTab(player, tokens) {
    if (typeof ARENA_UPGRADE_DEFS === 'undefined') return '<p class="arena-hint">Upgrade data not loaded.</p>';

    const upgrades = player.arenaUpgrades || {};

    // Group by category
    const categories = {};
    for (const [key, def] of Object.entries(ARENA_UPGRADE_DEFS)) {
        if (!categories[def.category]) categories[def.category] = [];
        categories[def.category].push({ key, def, level: upgrades[key] || 0 });
    }

    const categoryHtml = Object.entries(categories).map(([cat, items]) => {
        const upgradeCards = items.map(({ key, def, level }) => {
            const maxed      = level >= def.maxLevel;
            const cost       = def.costPerLevel * (level + 1);
            const canAfford  = tokens >= cost;
            const btnLabel   = maxed ? 'MAX' : `${cost} ⚔`;
            const btnClass   = maxed ? 'btn-disabled' : (canAfford ? 'btn-primary' : 'btn-disabled');
            const onclick    = (!maxed && canAfford) ? `onclick="arenaBuyUpgrade('${key}')"` : '';
            const progressPct = Math.round((level / def.maxLevel) * 100);

            return `
                <div class="upgrade-card">
                    <div class="upgrade-card-header">
                        <span class="upgrade-name">${def.name}</span>
                        <span class="upgrade-level">${level} / ${def.maxLevel}</span>
                    </div>
                    <div class="upgrade-desc">${def.description}</div>
                    <div class="upgrade-progress-track">
                        <div class="upgrade-progress-fill" style="width:${progressPct}%"></div>
                    </div>
                    <button class="btn btn-sm ${btnClass}" ${onclick}>${btnLabel}</button>
                </div>
            `;
        }).join('');

        return `
            <div class="upgrade-category">
                <div class="upgrade-category-label">${cat}</div>
                <div class="upgrade-category-grid">${upgradeCards}</div>
            </div>
        `;
    }).join('');

    return `
        <div class="upgrades-container">
            <p class="vendor-hint">Permanent upgrades that apply to every arena run.</p>
            ${categoryHtml}
        </div>
    `;
}

// ── Active combat ─────────────────────────────────────────────────────────────

function _renderArenaCombat(container) {
    const p = ArenaState.player;
    const e = ArenaState.enemy;
    const round = ArenaState.round;

    const combatantHtml = (c) => {
        if (!c) return '';
        const hpPct  = Math.round((c.health  / c.maxHealth)  * 100);
        const mpPct  = Math.round((c.mana    / c.maxMana)    * 100);
        const spPct  = Math.round((c.stamina / c.maxStamina) * 100);
        const hpCol  = hpPct > 50 ? 'var(--stat-health)' : hpPct > 25 ? 'var(--warning)' : 'var(--danger)';

        const effs = c.effects.length > 0
            ? `<div class="arena-effects">${c.effects.map(ef =>
                `<span class="arena-effect-tag" title="${ef.id}">${_arenaEffectIcon(ef)} ${ef.duration}t</span>`
              ).join('')}</div>`
            : '';

        const cds = c.abilities
            ? c.abilities.filter(id => (c.cooldowns[id] || 0) > 0)
                .map(id => {
                    const a = getArenaAbility(id);
                    return a ? `<span class="arena-cd-tag">${a.name} (${c.cooldowns[id]})</span>` : '';
                }).join('')
            : '';

        const momentumLine = (c.id === 'player' && c.arenaDamageFlat > 0)
            ? `<div class="arena-momentum">⚡ Momentum +${c.arenaDamageFlat} ATK</div>` : '';

        return `
            <div class="arena-combatant ${c.id === 'player' ? 'arena-player' : 'arena-enemy'}">
                <div class="arena-comb-name">${c.name}${c.isBoss ? ' 👑' : ''}</div>
                ${effs}
                ${momentumLine}
                <div class="arena-stat-row">
                    <span class="arena-stat-label">HP</span>
                    <div class="arena-bar-track">
                        <div class="arena-bar-fill" style="width:${hpPct}%;background:${hpCol}"></div>
                    </div>
                    <span class="arena-stat-val">${c.health}/${c.maxHealth}</span>
                </div>
                <div class="arena-stat-row">
                    <span class="arena-stat-label">MP</span>
                    <div class="arena-bar-track">
                        <div class="arena-bar-fill" style="width:${mpPct}%;background:var(--stat-mana)"></div>
                    </div>
                    <span class="arena-stat-val">${c.mana}/${c.maxMana}</span>
                </div>
                <div class="arena-stat-row">
                    <span class="arena-stat-label">SP</span>
                    <div class="arena-bar-track">
                        <div class="arena-bar-fill" style="width:${spPct}%;background:var(--stat-stamina)"></div>
                    </div>
                    <span class="arena-stat-val">${c.stamina}/${c.maxStamina}</span>
                </div>
                ${cds ? `<div class="arena-cooldowns">Cooldowns: ${cds}</div>` : ''}
            </div>
        `;
    };

    const statusLine = ArenaState.inCombat
        ? `<div class="arena-status arena-status-active">⚔ Round ${round} — Turn ${ArenaState.turn}</div>`
        : ArenaState.winner === 'player'
            ? `<div class="arena-status arena-status-win">✔ Round ${round - 1} cleared — preparing next round…</div>`
            : `<div class="arena-status arena-status-loss">✘ Run ended after ${Math.max(0, round - 1)} round${round > 2 ? 's' : ''}.</div>`;

    const logHtml = ArenaState.combatLog.slice(0, 20).map(msg =>
        `<div class="arena-log-line">${msg}</div>`
    ).join('');

    container.innerHTML = `
        <div class="page">
            <div class="page-header">
                <h1 class="page-title">Arena — Round ${round}</h1>
            </div>

            ${statusLine}

            <div class="arena-fight-grid">
                ${combatantHtml(p)}
                <div class="arena-vs">VS</div>
                ${combatantHtml(e)}
            </div>

            <div class="arena-log">
                <div class="card-header">Combat Log</div>
                <div class="arena-log-entries">${logHtml}</div>
            </div>

            ${ArenaState.inRun ? `
                <div class="arena-actions">
                    <button class="btn btn-danger" onclick="CombatEngine.withdraw()">Withdraw</button>
                </div>
            ` : `
                <div class="arena-actions">
                    <button class="btn btn-primary" onclick="CombatEngine.startRun()">New Run</button>
                </div>
            `}
        </div>
    `;
}

function _arenaEffectIcon(eff) {
    const icons = {
        bleed:       '🩸',
        defense_up:  '🛡',
        dodge_up:    '💨',
        mana_shield: '✦',
        regen:       '✚',
    };
    return icons[eff.id] || '◈';
}

// ── Vendor action handlers (global, called from inline onclick) ───────────────

function arenaBuyItem(id) {
    const player = PlayerSystem.current;
    const item   = (typeof getArenaShopItem !== 'undefined') ? getArenaShopItem(id) : null;
    if (!item || !player) return;

    const tokens = player.arenaTokens || 0;
    if (tokens < item.cost) { Log.add('Not enough arena tokens.', 'danger'); return; }

    // Already owned?
    const alreadyOwned = Object.values(player.equipment).some(e => e && e.id === id)
                      || player.inventory.some(i => i.id === id);
    if (alreadyOwned) { Log.add(`You already own ${item.name}.`, 'warning'); return; }

    player.arenaTokens -= item.cost;

    // Create instance with UID
    const instance = Object.assign({}, item, {
        uid: Date.now() * 10000 + Math.floor(Math.random() * 10000),
    });
    player.inventory.push(instance);

    Log.add(`Purchased ${item.name} for ${item.cost} tokens.`, 'success');
    SaveSystem.save();
    arenaSetTab('shop');
}

function arenaBuyConsumable(id) {
    const player = PlayerSystem.current;
    const def    = (typeof getArenaConsumable !== 'undefined') ? getArenaConsumable(id) : null;
    if (!def || !player) return;

    const tokens = player.arenaTokens || 0;
    if (tokens < def.cost) { Log.add('Not enough arena tokens.', 'danger'); return; }

    player.arenaTokens -= def.cost;
    if (!player.arenaConsumables) player.arenaConsumables = {};
    player.arenaConsumables[id] = (player.arenaConsumables[id] || 0) + 1;

    Log.add(`Purchased ${def.name}.`, 'success');
    SaveSystem.save();
    arenaSetTab('shop');
}

function arenaUseConsumable(id) {
    const player = PlayerSystem.current;
    if (!player) return;
    const stock = (player.arenaConsumables || {})[id] || 0;
    if (stock <= 0) return;

    // Don't allow duplicates in pending
    if ((player.pendingArenaBuffs || []).includes(id)) {
        Log.add('This consumable is already staged.', 'warning');
        return;
    }

    player.arenaConsumables[id]--;
    if (!player.pendingArenaBuffs) player.pendingArenaBuffs = [];
    player.pendingArenaBuffs.push(id);

    const def = (typeof getArenaConsumable !== 'undefined') ? getArenaConsumable(id) : null;
    Log.add(`${def?.name || id} staged for next run.`, 'info');
    SaveSystem.save();
    arenaSetTab('shop');
}

function arenaBuyUpgrade(key) {
    const player = PlayerSystem.current;
    const def    = (typeof ARENA_UPGRADE_DEFS !== 'undefined') ? ARENA_UPGRADE_DEFS[key] : null;
    if (!def || !player) return;

    const upg    = player.arenaUpgrades || {};
    const level  = upg[key] || 0;
    if (level >= def.maxLevel) { Log.add('Already at max level.', 'warning'); return; }

    const cost   = def.costPerLevel * (level + 1);
    const tokens = player.arenaTokens || 0;
    if (tokens < cost) { Log.add('Not enough arena tokens.', 'danger'); return; }

    player.arenaTokens       -= cost;
    player.arenaUpgrades[key] = level + 1;

    Log.add(`${def.name} upgraded to level ${level + 1}.`, 'success');
    SaveSystem.save();
    arenaSetTab('upgrades');
}

function arenaBuyChest(tier) {
    const player = PlayerSystem.current;
    const shopDef = (typeof ARENA_CHEST_SHOP !== 'undefined') ? ARENA_CHEST_SHOP.find(c => c.tier === tier) : null;
    if (!shopDef || !player) return;

    const tokens = player.arenaTokens || 0;
    if (tokens < shopDef.cost) { Log.add('Not enough arena tokens.', 'danger'); return; }

    player.arenaTokens -= shopDef.cost;

    const existing = player.inventory.find(i => i.type === 'chest' && i.tier === tier);
    if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
    } else {
        player.inventory.push({
            uid:      Date.now() * 10000 + Math.floor(Math.random() * 10000),
            type:     'chest',
            tier,
            name:     shopDef.name,
            quantity: 1,
        });
    }

    Log.add(`Purchased ${shopDef.name} for ${shopDef.cost} tokens.`, 'success');
    SaveSystem.save();
    arenaSetTab('shop');
}
