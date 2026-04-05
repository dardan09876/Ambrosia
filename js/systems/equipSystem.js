// js/systems/equipSystem.js
// Centralised equip / unequip logic.
// Both the Inventory page and the Equipment page delegate to this system.

const EquipSystem = {

    SLOTS: [
        { key: 'weapon',  label: 'Weapon'   },
        { key: 'offhand', label: 'Off-Hand'  },
        { key: 'head',    label: 'Head'      },
        { key: 'torso',   label: 'Torso'     },
        { key: 'back',    label: 'Back'      },
        { key: 'hands',   label: 'Hands'     },
        { key: 'legs',    label: 'Legs'      },
        { key: 'feet',    label: 'Feet'      },
        { key: 'ring_1',  label: 'Ring 1'    },
        { key: 'ring_2',  label: 'Ring 2'    },
    ],

    // ── Equip an item from inventory by uid ───────────────────────
    equip(uid) {
        const player = PlayerSystem.current;
        const idx    = player.inventory.findIndex(i => i.uid === uid);
        if (idx === -1) return { ok: false, reason: 'Item not found in inventory.' };

        const item = player.inventory[idx];
        // Rings: fill ring_1 first, then ring_2; if both full, replace ring_1
        let slot = item.slot;
        if (slot === 'ring') {
            slot = !player.equipment.ring_1 ? 'ring_1'
                 : !player.equipment.ring_2 ? 'ring_2'
                 : 'ring_1';
        }

        if (!Object.prototype.hasOwnProperty.call(player.equipment, slot)) {
            return { ok: false, reason: `Unknown equipment slot: ${slot}.` };
        }

        // Skill requirement check
        if (item.requiredSkill && item.requiredSkill.level > 0) {
            const ps = PlayerSystem.getSkill(item.requiredSkill.skill);
            if (ps < item.requiredSkill.level) {
                return {
                    ok: false,
                    reason: `Requires ${skillLabel(item.requiredSkill.skill)} ${item.requiredSkill.level}.`,
                };
            }
        }

        // Block offhand if weapon slot holds a two-handed weapon
        if (slot === 'offhand' && player.equipment.weapon && player.equipment.weapon.twoHanded) {
            return { ok: false, reason: 'Cannot equip an off-hand item while wielding a two-handed weapon.' };
        }

        // Two-handed weapon: auto-clear offhand first
        if (item.twoHanded && player.equipment.offhand) {
            player.inventory.push(player.equipment.offhand);
            player.equipment.offhand = null;
        }

        // Swap existing item in slot back to inventory
        if (player.equipment[slot]) {
            player.inventory.push(player.equipment[slot]);
        }

        player.equipment[slot] = item;
        player.inventory.splice(idx, 1);

        PlayerSystem._recalcStatMaxes();
        Log.add(`Equipped ${item.name}.`, 'success');
        SaveSystem.save();
        return { ok: true };
    },

    // ── Unequip an item from a slot back to inventory ─────────────
    unequip(slot) {
        const player = PlayerSystem.current;
        const item   = player.equipment[slot];
        if (!item) return { ok: false, reason: 'Nothing equipped in that slot.' };

        player.equipment[slot] = null;
        player.inventory.push(item);

        PlayerSystem._recalcStatMaxes();
        Log.add(`Unequipped ${item.name}.`, 'info');
        SaveSystem.save();
        return { ok: true };
    },

    // ── Sum damage + defense across all equipped items ────────────
    getTotalStats() {
        const player = PlayerSystem.current;
        let totalDamage  = 0;
        let totalDefense = 0;
        for (const item of Object.values(player.equipment)) {
            if (!item) continue;
            totalDamage  += item.damage  || 0;
            totalDefense += item.defense || 0;
        }
        return { totalDamage, totalDefense };
    },

    // ── Sum a specific stat bonus across all equipped items ────────
    getStatBonuses(statName) {
        const player = PlayerSystem.current;
        if (!player) return 0;
        let total = 0;
        for (const item of Object.values(player.equipment)) {
            if (!item || !item.statBonuses) continue;
            total += item.statBonuses[statName] || 0;
        }
        return total;
    },

    // ── Count how many slots are filled ───────────────────────────
    getEquippedCount() {
        const player = PlayerSystem.current;
        return Object.values(player.equipment).filter(Boolean).length;
    },
};
