// js/pages/equipment.js
// Equipment page — shows all 8 gear slots with equipped items,
// combat stat summary, and per-slot unequip actions.

Router.register('equipment', function () {
    _renderEquipmentPage();
});

// ── Main render ───────────────────────────────────────────────────────────────
function _renderEquipmentPage() {
    const el = document.getElementById('content-area');
    if (!el) return;

    const player = PlayerSystem.current;
    const { totalDamage, totalDefense } = EquipSystem.getTotalStats();
    const equipped = EquipSystem.getEquippedCount();

    el.innerHTML = `
        <div class="page-equipment">

            <div class="equip-header">
                <h2 class="heading">Equipment</h2>
                <div class="equip-header-meta">
                    <span class="equip-slot-count">${equipped} / ${EquipSystem.SLOTS.length} slots filled</span>
                </div>
            </div>

            <div class="equip-layout">

                <!-- Combat stat summary -->
                <div class="equip-stats-bar">
                    <div class="equip-stat-chip equip-stat-dmg">
                        <span class="equip-stat-icon">⚔</span>
                        <span class="equip-stat-label">Attack</span>
                        <span class="equip-stat-val">${totalDamage}</span>
                    </div>
                    <div class="equip-stat-chip equip-stat-def">
                        <span class="equip-stat-icon">◈</span>
                        <span class="equip-stat-label">Defence</span>
                        <span class="equip-stat-val">${totalDefense}</span>
                    </div>
                    <div class="equip-stat-chip equip-stat-score">
                        <span class="equip-stat-icon">✦</span>
                        <span class="equip-stat-label">Power</span>
                        <span class="equip-stat-val">${totalDamage + totalDefense}</span>
                    </div>
                </div>

                <!-- Slot grid -->
                <div class="equip-slot-grid">
                    ${EquipSystem.SLOTS.map(s => _equipSlotCard(s, player.equipment[s.key], player)).join('')}
                </div>

                <!-- Inventory quick-equip panel -->
                ${_equipInventoryPanel(player)}

            </div>
        </div>
    `;
}

// ── Slot card ─────────────────────────────────────────────────────────────────
function _equipSlotCard(slotDef, item, player) {
    if (!item) {
        // Show blocked state when offhand is locked by a two-handed weapon
        const blocked = slotDef.key === 'offhand'
            && player && player.equipment.weapon && player.equipment.weapon.twoHanded;
        return `
            <div class="equip-slot-card ${blocked ? 'equip-slot-blocked' : 'equip-slot-empty'}" data-slot="${slotDef.key}">
                <span class="equip-slot-name">${slotDef.label}</span>
                <span class="equip-slot-hint">${blocked ? '⊘ Two-Handed' : '— empty —'}</span>
            </div>
        `;
    }

    const tierColor = (ITEM_TIER_COLORS && ITEM_TIER_COLORS[item.tier]) || '#c9a84c';
    const tierName  = (ITEM_TIER_NAMES  && ITEM_TIER_NAMES[item.tier])  || `T${item.tier}`;
    const durPct    = Math.round((item.durability / item.maxDurability) * 100);
    const durColor  = durPct > 60 ? 'var(--success)' : durPct > 25 ? 'var(--warning)' : 'var(--danger)';

    // Type label (weapon type or armor class)
    let typeLabel = '';
    if (item.weaponType && WEAPON_TYPE_LABELS) {
        const wLabel = WEAPON_TYPE_LABELS[item.weaponType] || item.weaponType;
        typeLabel = item.twoHanded ? `${wLabel} · 2H` : wLabel;
    } else if (item.armorClass && ARMOR_CLASS_LABELS) {
        typeLabel = ARMOR_CLASS_LABELS[item.armorClass] || item.armorClass;
    }

    const statParts = [];
    if (item.damage  > 0) statParts.push(`<span class="equip-item-stat equip-item-dmg">ATK ${item.damage}</span>`);
    if (item.defense > 0) statParts.push(`<span class="equip-item-stat equip-item-def">DEF ${item.defense}</span>`);

    // Stat bonus chips
    let bonusHtml = '';
    if (item.statBonuses) {
        const chips = Object.entries(item.statBonuses).map(([stat, val]) =>
            `<span class="equip-bonus-chip">+${val} ${stat.charAt(0).toUpperCase() + stat.slice(1)}</span>`
        );
        if (chips.length) bonusHtml = `<div class="equip-bonus-row">${chips.join('')}</div>`;
    }

    return `
        <div class="equip-slot-card equip-slot-filled" data-slot="${slotDef.key}">
            <div class="equip-slot-top">
                <span class="equip-slot-name">${slotDef.label}</span>
                <span class="equip-tier-badge" style="background:${tierColor}22;color:${tierColor};border-color:${tierColor}55">${tierName}</span>
            </div>
            <div class="equip-item-name-row">
                <span class="equip-item-name">${item.name}</span>
                ${typeLabel ? `<span class="equip-type-label">${typeLabel}</span>` : ''}
            </div>
            ${statParts.length ? `<div class="equip-item-stats">${statParts.join('')}</div>` : ''}
            ${bonusHtml}
            <div class="equip-dur-row">
                <div class="equip-dur-track">
                    <div class="equip-dur-fill" style="width:${durPct}%;background:${durColor}"></div>
                </div>
                <span class="equip-dur-text">${item.durability}/${item.maxDurability}</span>
            </div>
            ${item.description
                ? `<div class="equip-item-desc">${item.description}</div>`
                : ''
            }
            <div class="equip-slot-actions">
                <button class="equip-btn equip-btn-unequip" onclick="_equipUnequip('${slotDef.key}')">Unequip</button>
            </div>
        </div>
    `;
}

// ── Inventory quick-equip panel ───────────────────────────────────────────────
function _equipInventoryPanel(player) {
    const inv = player.inventory;
    if (inv.length === 0) return '';

    // Only show items that can go into a valid slot (rings use 'ring' slot key)
    const equippable = inv.filter(i =>
        i.slot === 'ring' || EquipSystem.SLOTS.some(s => s.key === i.slot)
    );
    if (equippable.length === 0) return '';

    const rows = equippable.map(item => {
        const tierColor = (ITEM_TIER_COLORS && ITEM_TIER_COLORS[item.tier]) || '#c9a84c';
        const tierName  = (ITEM_TIER_NAMES  && ITEM_TIER_NAMES[item.tier])  || `T${item.tier}`;

        const req      = item.requiredSkill;
        const meetsReq = !req || req.level === 0 || PlayerSystem.getSkill(req.skill) >= req.level;

        const statParts = [];
        if (item.damage  > 0) statParts.push(`ATK ${item.damage}`);
        if (item.defense > 0) statParts.push(`DEF ${item.defense}`);

        // For rings, compare against the slot that would be replaced
        const compareSlot = item.slot === 'ring'
            ? (!player.equipment.ring_1 ? 'ring_1' : !player.equipment.ring_2 ? 'ring_2' : 'ring_1')
            : item.slot;
        const current = player.equipment[compareSlot];
        const diffHtml = current ? _equipStatDiff(item, current) : '';

        return `
            <div class="equip-inv-row">
                <span class="equip-inv-tier" style="color:${tierColor}">${tierName}</span>
                <span class="equip-inv-name">${item.name}</span>
                <span class="equip-inv-slot muted-text">${_equipSlotLabel(item.slot)}</span>
                <span class="equip-inv-stats muted-text">${statParts.join(' · ')}</span>
                ${diffHtml}
                <button
                    class="equip-btn equip-btn-quick${!meetsReq ? ' equip-btn-disabled' : ''}"
                    onclick="_equipFromInventory(${item.uid})"
                    ${!meetsReq ? 'disabled' : ''}
                    title="${!meetsReq ? `Requires ${skillLabel(req.skill)} ${req.level}` : 'Equip'}"
                >Equip</button>
            </div>
        `;
    });

    return `
        <div class="equip-inv-panel">
            <div class="equip-inv-panel-title">Available to Equip</div>
            <div class="equip-inv-list">${rows.join('')}</div>
        </div>
    `;
}

// Show +/- diff vs currently equipped item in the same slot
function _equipStatDiff(candidate, current) {
    const dmgDiff = (candidate.damage  || 0) - (current.damage  || 0);
    const defDiff = (candidate.defense || 0) - (current.defense || 0);

    const parts = [];
    if (dmgDiff !== 0) parts.push(_diffSpan('ATK', dmgDiff));
    if (defDiff !== 0) parts.push(_diffSpan('DEF', defDiff));
    if (parts.length === 0) return '';
    return `<span class="equip-inv-diff">${parts.join(' ')}</span>`;
}

function _diffSpan(label, val) {
    const sign  = val > 0 ? '+' : '';
    const cls   = val > 0 ? 'diff-up' : 'diff-down';
    return `<span class="equip-diff-chip ${cls}">${sign}${val} ${label}</span>`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function _equipSlotLabel(slot) {
    if (slot === 'ring') return 'Ring';
    const s = EquipSystem.SLOTS.find(s => s.key === slot);
    return s ? s.label : slot;
}

// ── Actions ───────────────────────────────────────────────────────────────────
function _equipUnequip(slot) {
    const result = EquipSystem.unequip(slot);
    if (!result.ok) Log.add(result.reason, 'danger');
    _renderEquipmentPage();
}

function _equipFromInventory(uid) {
    const result = EquipSystem.equip(uid);
    if (!result.ok) Log.add(result.reason, 'danger');
    _renderEquipmentPage();
}
