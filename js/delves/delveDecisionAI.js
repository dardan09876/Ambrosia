// js/delves/delveDecisionAI.js
// Determines autonomous decisions during a delve run.

const DelveDecisionAI = {

    // Derive doctrine from the player's top combat skill.
    getDoctrine(player) {
        const sk = player.skills || {};
        const combatSkills = {
            melee:       sk.melee       || 0,
            ranged:      sk.ranged      || 0,
            magic:       sk.magic       || 0,
            restoration: sk.restoration || 0,
            defense:     sk.defense     || 0,
            stealth:     sk.stealth     || 0,
        };

        const top = Object.entries(combatSkills).sort((a, b) => b[1] - a[1])[0][0];

        switch (top) {
            case 'melee':       return 'aggressive';
            case 'ranged':      return 'tactical';
            case 'magic':       return 'balanced';
            case 'restoration': return 'cautious';
            case 'defense':     return 'cautious';
            case 'stealth':     return 'tactical';
            default:            return 'balanced';
        }
    },

    // Should the warband retreat given current state?
    shouldRetreat(snapshot, doctrine) {
        const hpPct = snapshot.health / snapshot.maxHealth;

        if (doctrine === 'cautious'   && hpPct < 0.20) return true;
        if (doctrine === 'balanced'   && hpPct < 0.10) return true;
        if (doctrine === 'aggressive' && hpPct < 0.05) return true;
        if (doctrine === 'tactical'   && hpPct < 0.15) return true;

        return false;
    },

    // Flavour description of the doctrine
    doctrineLabel(doctrine) {
        return {
            aggressive: 'Aggressive — press every advantage, accept risk',
            tactical:   'Tactical — pick battles, preserve stamina',
            balanced:   'Balanced — adapt to the situation',
            cautious:   'Cautious — survive at all costs',
        }[doctrine] || 'Balanced';
    },

    // Combat: choose which ability to lead with (used in log generation)
    leadAbility(snapshot) {
        const sk = snapshot.skills;
        if ((sk.magic       || 0) >= (sk.melee  || 0) && (sk.magic       || 0) >= (sk.ranged || 0)) return 'magic';
        if ((sk.ranged      || 0) >= (sk.melee  || 0))                                               return 'ranged';
        if ((sk.restoration || 0) >= (sk.melee  || 0) * 0.8)                                        return 'support';
        return 'melee';
    },
};
