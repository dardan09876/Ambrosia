// js/combat/combatAI.js
// AI ability selection for both player (auto) and enemy combatants.

const CombatAI = {

    // ── Choose an ability for the given combatant ────────────────────────────────
    choose(combatant, opponent) {
        const available = combatant.abilities
            .map(id => getArenaAbility(id))
            .filter(a => a && CombatResolver.canUse(combatant, a));

        // If nothing available, rest
        if (available.length === 0) return getArenaAbility('catch_breath');

        const hpRatio = combatant.health / combatant.maxHealth;

        // Priority 1: Heal if health below 35%
        if (hpRatio < 0.35) {
            const heal = available.find(a => a.type === 'heal');
            if (heal) return heal;
        }

        // Priority 2: Buff if no buff active and cooldown free
        const buff = available.find(a => a.type === 'buff');
        if (buff && hpRatio > 0.60 && Math.random() < 0.35) return buff;

        // Priority 3: Strongest available attack (by baseDamage)
        const attacks = available.filter(a => a.type === 'attack');
        if (attacks.length > 0) {
            attacks.sort((a, b) => (b.baseDamage || 0) - (a.baseDamage || 0));
            return attacks[0];
        }

        // Priority 4: Heal even outside crisis
        const heal = available.find(a => a.type === 'heal');
        if (heal) return heal;

        return getArenaAbility('catch_breath');
    },
};
