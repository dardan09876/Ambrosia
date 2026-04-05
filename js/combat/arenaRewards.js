// js/combat/arenaRewards.js
// Computes and awards rewards per round and for a full run.

const ArenaRewards = {

    // Gold and tokens for completing a round
    roundReward(round) {
        const isBoss   = round % 5 === 0;
        const gold     = round * 18 + (isBoss ? 60 : 0);
        const tokens   = Math.floor(round / 3) + (isBoss ? 2 : 0);
        return { gold, tokens };
    },

    // Chest reward at milestone rounds
    milestoneChest(round) {
        if (round % 10 === 0) return { tier: Math.min(5, Math.floor(round / 10) + 1), count: 1 };
        if (round % 5  === 0) return { tier: Math.min(3, Math.floor(round / 5)),       count: 1 };
        return null;
    },

    // XP awarded for clearing a round — scales with round number
    // Round 1: ~80 xp  Round 5 (boss): ~600 xp  Round 10 (boss): ~1400 xp
    roundXp(round) {
        const isBoss = round % 5 === 0;
        return Math.floor(round * 60 * (isBoss ? 2 : 1));
    },

    // Apply round rewards to the player and ArenaState totals
    applyRound(round) {
        const player  = PlayerSystem.current;
        const { gold, tokens } = this.roundReward(round);

        player.gold          += gold;
        player.arenaTokens    = (player.arenaTokens || 0) + tokens;

        ArenaState.totalGold   += gold;
        ArenaState.totalTokens += tokens;

        // Award XP — distributed across the player's top combat skills
        const xp = this.roundXp(round);
        this._awardCombatXp(player, xp);

        const parts = [`+${gold}g`, `+${xp} XP`];
        if (tokens > 0) parts.push(`+${tokens} token${tokens > 1 ? 's' : ''}`);

        const chest = this.milestoneChest(round);
        if (chest) {
            const chestName = (typeof CHEST_DEFS !== 'undefined' && CHEST_DEFS[chest.tier])
                ? CHEST_DEFS[chest.tier].name
                : `Tier ${chest.tier} Chest`;
            for (let i = 0; i < chest.count; i++) {
                player.inventory.push({
                    uid:      Date.now() * 10000 + Math.floor(Math.random() * 10000) + i,
                    type:     'chest',
                    tier:     chest.tier,
                    name:     chestName,
                    quantity: 1,
                });
                ArenaState.chestsEarned.push({ tier: chest.tier, name: chestName });
            }
            parts.push(`1× ${chestName}`);
        }

        Log.add(`Round ${round} complete — ${parts.join(' · ')}.`, 'success');
        if (typeof SaveSystem !== 'undefined') SaveSystem.save();
    },

    // Split XP across whichever combat skills the player has trained
    _awardCombatXp(player, xp) {
        const combatSkills = ['melee', 'ranged', 'magic', 'restoration', 'defense', 'stealth'];
        const trained = combatSkills.filter(sk => (player.skills[sk] || 0) > 0);

        // If no combat skills yet, award to melee as a default
        const targets = trained.length > 0 ? trained : ['melee'];

        // Give full XP to the highest skill; halve it for the rest
        const sorted = targets.sort((a, b) => (player.skills[b] || 0) - (player.skills[a] || 0));
        for (let i = 0; i < sorted.length; i++) {
            const share = i === 0 ? xp : Math.floor(xp * 0.5);
            PlayerSystem.gainSkillExperience(sorted[i], share);
        }
    },
};
