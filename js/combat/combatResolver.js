// js/combat/combatResolver.js
// Resolves a single ability use: damage, healing, buffs, effects, costs.

const CombatResolver = {

    // ── Can the combatant use this ability? ──────────────────────────────────────
    canUse(user, ability) {
        if ((user.cooldowns[ability.id] || 0) > 0) return false;
        if ((user.mana    || 0) < (ability.manaCost    || 0)) return false;
        if ((user.stamina || 0) < (ability.staminaCost || 0)) return false;
        return true;
    },

    // ── Spend resources ──────────────────────────────────────────────────────────
    _spend(user, ability) {
        user.mana    = Math.max(0, user.mana    - (ability.manaCost    || 0));
        user.stamina = Math.max(0, user.stamina - (ability.staminaCost || 0));
        if (ability.cooldown > 0) user.cooldowns[ability.id] = ability.cooldown;
    },

    // ── Tick cooldowns and effect durations ──────────────────────────────────────
    tickCombatant(c) {
        for (const key in c.cooldowns) {
            if (c.cooldowns[key] > 0) c.cooldowns[key]--;
        }
        // Apply regen effects
        for (const eff of c.effects) {
            if (eff.id === 'regen' && eff.healPerTurn) {
                const healed = Math.min(eff.healPerTurn, c.maxHealth - c.health);
                c.health += healed;
                if (healed > 0) ArenaState.log(`${c.name} regenerates ${healed} health.`);
            }
            if (eff.id === 'bleed' && eff.damage) {
                c.health = Math.max(0, c.health - eff.damage);
                ArenaState.log(`${c.name} bleeds for ${eff.damage} damage.`);
            }
        }
        // Reduce effect durations
        c.effects = c.effects
            .map(e => ({ ...e, duration: e.duration - 1 }))
            .filter(e => e.duration > 0);
    },

    // ── Compute effective defense multiplier ─────────────────────────────────────
    _defMult(target) {
        let mult = 1.0;
        for (const eff of target.effects) {
            if (eff.id === 'defense_up') mult -= eff.defenseBonus;
            if (eff.id === 'mana_shield') mult -= eff.manaAbsorb;
        }
        return Math.max(0.1, mult);
    },

    // ── Check dodge ─────────────────────────────────────────────────────────────
    _tryDodge(target) {
        for (const eff of target.effects) {
            if ((eff.id === 'dodge_up') && Math.random() < eff.dodgeChance) return true;
        }
        return false;
    },

    // ── Damage formula ───────────────────────────────────────────────────────────
    _calcDamage(user, target, ability) {
        const skillVal   = (user.skills[ability.scalingSkill] || 0);
        const defenseVal = (target.skills.defense            || 0);
        const hitCount   = ability.hits || 1;

        const attackPower = ability.baseDamage + Math.floor(skillVal * 0.55);
        const mitigation  = Math.floor(defenseVal * 0.28);
        let   damage      = Math.max(1, attackPower - mitigation);

        // Crit check
        const critChance = (ability.critBonus || 0);
        if (critChance > 0 && Math.random() < critChance) {
            damage = Math.floor(damage * 1.5);
            ArenaState.log(`Critical hit!`);
        }

        // Defense reduction effects on target
        damage = Math.round(damage * this._defMult(target));

        return damage * hitCount;
    },

    // ── Heal formula ────────────────────────────────────────────────────────────
    _calcHeal(user, ability) {
        const skillVal = (user.skills[ability.scalingSkill] || 0);
        return ability.baseHeal + Math.floor(skillVal * 0.45);
    },

    // ── Resolve ─────────────────────────────────────────────────────────────────
    resolve(user, target, ability) {
        // Rest
        if (ability.type === 'rest') {
            user.stamina = Math.min(user.maxStamina, user.stamina + (ability.staminaRestore || 0));
            user.mana    = Math.min(user.maxMana,    user.mana    + (ability.manaRestore    || 0));
            ArenaState.log(`${user.name} catches breath (+${ability.staminaRestore || 0} stamina, +${ability.manaRestore || 0} mana).`);
            return;
        }

        // Check affordability — fall back to catch_breath if not
        if (!this.canUse(user, ability)) {
            const rest = getArenaAbility('catch_breath');
            this.resolve(user, target, rest);
            return;
        }

        this._spend(user, ability);

        // Attack
        if (ability.type === 'attack') {
            if (this._tryDodge(target)) {
                ArenaState.log(`${target.name} dodges ${user.name}'s ${ability.name}!`);
            } else {
                const dmg = this._calcDamage(user, target, ability);
                target.health = Math.max(0, target.health - dmg);
                const hitStr = (ability.hits || 1) > 1 ? ` (${ability.hits} hits)` : '';
                ArenaState.log(`${user.name} uses ${ability.name}${hitStr} — ${dmg} damage to ${target.name}.`);
            }
        }

        // Heal
        if (ability.type === 'heal') {
            const healed = Math.min(this._calcHeal(user, ability), user.maxHealth - user.health);
            user.health += healed;
            ArenaState.log(`${user.name} uses ${ability.name} — heals ${healed} health.`);
        }

        // Buff
        if (ability.type === 'buff') {
            if (ability.applyEffect) {
                // Replace existing effect of same id
                user.effects = user.effects.filter(e => e.id !== ability.applyEffect.id);
                user.effects.push({ ...ability.applyEffect });
                ArenaState.log(`${user.name} uses ${ability.name}.`);
            }
        }

        // Apply on-hit effect (e.g. bleed from rend)
        if (ability.type === 'attack' && ability.applyEffect) {
            target.effects = target.effects.filter(e => e.id !== ability.applyEffect.id);
            target.effects.push({ ...ability.applyEffect });
        }

        // Mark dead
        if (target.health <= 0) {
            target.health = 0;
            target.alive  = false;
        }
    },
};
