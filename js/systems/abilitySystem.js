// js/systems/abilitySystem.js
// Handles ability unlocking, equipping, and passive bonus queries.
// Other systems call getStatBonus / getQuestBonus / getFoodEfficiency
// to apply equipped ability effects without knowing which abilities are active.

const AbilitySystem = {

    MAX_EQUIPPED: 6,

    // ── Unlock (learn) an ability ─────────────────────────────────────────────
    // Returns { ok: true } or { ok: false, reason }
    learn(abilityId) {
        const player  = PlayerSystem.current;
        const ability = ABILITIES.find(a => a.id === abilityId);
        if (!ability) return { ok: false, reason: 'Unknown ability.' };

        if (player.abilities.unlocked.includes(abilityId)) {
            return { ok: false, reason: 'Already learned.' };
        }

        // Skill requirement
        const req = ability.skillReq;
        if (req && req.level > 0) {
            const ps = PlayerSystem.getSkill(req.skill);
            if (ps < req.level) {
                return { ok: false, reason: `Requires ${skillLabel(req.skill)} ${req.level}.` };
            }
        }

        // Gold cost
        if (player.gold < ability.goldCost) {
            return { ok: false, reason: `Not enough gold (need ${ability.goldCost}g).` };
        }

        player.gold -= ability.goldCost;
        player.abilities.unlocked.push(abilityId);

        Log.add(`Learned ${ability.name}.`, 'success');
        SaveSystem.save();
        return { ok: true };
    },

    // ── Equip a learned ability ───────────────────────────────────────────────
    equip(abilityId) {
        const player = PlayerSystem.current;
        if (!player.abilities.unlocked.includes(abilityId)) {
            return { ok: false, reason: 'Ability not learned yet.' };
        }
        if (player.abilities.equipped.includes(abilityId)) {
            return { ok: false, reason: 'Already equipped.' };
        }
        if (player.abilities.equipped.length >= this.MAX_EQUIPPED) {
            return { ok: false, reason: `All ${this.MAX_EQUIPPED} ability slots are full.` };
        }

        player.abilities.equipped.push(abilityId);

        // Stat bonuses take effect immediately
        PlayerSystem._recalcStatMaxes();

        Log.add(`Equipped ${ABILITIES.find(a => a.id === abilityId)?.name}.`, 'info');
        SaveSystem.save();
        return { ok: true };
    },

    // ── Unequip an ability (keep it learned) ─────────────────────────────────
    unequip(abilityId) {
        const player = PlayerSystem.current;
        const idx    = player.abilities.equipped.indexOf(abilityId);
        if (idx === -1) return { ok: false, reason: 'Not equipped.' };

        player.abilities.equipped.splice(idx, 1);
        PlayerSystem._recalcStatMaxes();

        Log.add(`Unequipped ${ABILITIES.find(a => a.id === abilityId)?.name}.`, 'info');
        SaveSystem.save();
        return { ok: true };
    },

    // ── Passive bonus queries (called by other systems) ───────────────────────

    // Sum of stat_bonus effects for a given stat name across all equipped abilities
    getStatBonus(statName) {
        const player = PlayerSystem.current;
        if (!player?.abilities?.equipped) return 0;
        return player.abilities.equipped.reduce((sum, id) => {
            const ab = ABILITIES.find(a => a.id === id);
            if (ab?.effect?.type === 'stat_bonus' && ab.effect.stat === statName) {
                return sum + ab.effect.value;
            }
            return sum;
        }, 0);
    },

    // Sum of quest success bonus (percentage points) for a given skill
    // Includes both skill-specific bonuses and global (quest_bonus_all) bonuses
    getQuestBonus(skillKey) {
        const player = PlayerSystem.current;
        if (!player?.abilities?.equipped) return 0;
        return player.abilities.equipped.reduce((sum, id) => {
            const ab = ABILITIES.find(a => a.id === id);
            if (!ab) return sum;
            if (ab.effect.type === 'quest_bonus_all') return sum + ab.effect.value;
            if (ab.effect.type === 'quest_bonus' && ab.effect.skill === skillKey) return sum + ab.effect.value;
            return sum;
        }, 0);
    },

    // Total food drain reduction fraction (0–1). 0.25 = 25% slower drain.
    getFoodEfficiency() {
        const player = PlayerSystem.current;
        if (!player?.abilities?.equipped) return 0;
        return player.abilities.equipped.reduce((sum, id) => {
            const ab = ABILITIES.find(a => a.id === id);
            if (ab?.effect?.type === 'food_efficiency') return sum + ab.effect.value;
            return sum;
        }, 0);
    },
};
