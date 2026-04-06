// js/delves/delveRewards.js
// Applies the resolved run's rewards to the live player.

const DelveRewards = {

    apply(player, runSnapshot, playbackRecords) {
        if (!player || !runSnapshot) return;

        const died = runSnapshot.result === 'death';

        // Always write final health back to the live player
        if (player.stats?.health != null) {
            player.stats.health.value = died ? 1 : Math.max(1, runSnapshot.finalHealth ?? player.stats.health.value);
        }

        // Death: no rewards, heavy corruption
        if (died) {
            const tier       = (typeof DELVE_TYPES !== 'undefined' && DELVE_TYPES[runSnapshot.delveId]?.tier) || 1;
            const corruption = tier * 20; // T1: 20  T2: 40  T3: 60
            if (typeof PlayerSystem !== 'undefined') PlayerSystem.gainCorruption(corruption);
            Log.add(`Delve failed — you fell in the ${runSnapshot.delveName}. +${corruption} corruption. No rewards.`, 'danger');
            if (typeof SaveSystem !== 'undefined') SaveSystem.save();
            return;
        }

        let totalGold      = runSnapshot.goldFound || 0;
        let totalXp        = runSnapshot.xpFound   || 0;
        const allMaterials = [...(runSnapshot.materialsFound || [])];
        const allItems     = [...(runSnapshot.itemsFound     || [])];

        // Give gold
        player.gold = (player.gold || 0) + totalGold;

        // Give materials
        for (const mat of allMaterials) {
            if (!mat.id || !mat.amount) continue;
            if (typeof CraftingSystem !== 'undefined') {
                CraftingSystem.addMaterial(player, mat.id, mat.amount);
            } else {
                if (!player.craftingMaterials) player.craftingMaterials = {};
                player.craftingMaterials[mat.id] = (player.craftingMaterials[mat.id] || 0) + mat.amount;
            }
        }

        // Give items and chests
        for (const item of allItems) {
            if (item._isChest) {
                const existing = player.inventory.find(i => i.type === 'chest' && i.tier === item.tier);
                if (existing) {
                    existing.quantity = (existing.quantity || 1) + 1;
                } else {
                    player.inventory.push({
                        uid:      Date.now() * 10000 + Math.floor(Math.random() * 10000),
                        type:     'chest',
                        tier:     item.tier,
                        name:     item.name || `Tier ${item.tier} Chest`,
                        quantity: 1,
                    });
                }
            } else {
                player.inventory.push(item);
            }
        }

        // Apply warband rift node XP bonus
        if (totalXp > 0 && typeof WarbandSystem !== 'undefined') {
            totalXp = Math.floor(totalXp * WarbandSystem.getXpBonus(player));
        }

        // Give XP — split across active combat skills
        if (totalXp > 0 && typeof PlayerSystem !== 'undefined') {
            const combatSkills = ['melee','ranged','magic','restoration','defense','stealth'];
            const trained = combatSkills.filter(sk => (player.skills[sk] || 0) > 0);
            const targets = trained.length > 0 ? trained : ['melee'];
            const sorted  = targets.sort((a, b) => (player.skills[b] || 0) - (player.skills[a] || 0));
            for (let i = 0; i < sorted.length; i++) {
                const share = i === 0 ? totalXp : Math.floor(totalXp * 0.4);
                PlayerSystem.gainSkillExperience(sorted[i], share);
            }
        }

        // Apply any pending corruption from traps
        const lastRecord = playbackRecords?.[playbackRecords.length - 1];
        const snapshot   = lastRecord?.playerAfter;
        if (snapshot?._pendingCorruption && typeof PlayerSystem !== 'undefined') {
            PlayerSystem.gainCorruption(snapshot._pendingCorruption);
        }

        if (typeof SaveSystem !== 'undefined') SaveSystem.save();
    },

    // Summary lines for the results screen
    summarize(runSnapshot) {
        if (runSnapshot.result === 'death') {
            const tier = (typeof DELVE_TYPES !== 'undefined' && DELVE_TYPES[runSnapshot.delveId]?.tier) || 1;
            return [`You fell in the ${runSnapshot.delveName}.`, `No rewards. +${tier * 20} corruption.`];
        }
        const lines = [];
        if (runSnapshot.goldFound > 0)            lines.push(`${runSnapshot.goldFound}g collected`);
        if ((runSnapshot.materialsFound || []).length > 0) {
            const unique = {};
            for (const m of runSnapshot.materialsFound) unique[m.id] = (unique[m.id] || 0) + m.amount;
            for (const [id, amt] of Object.entries(unique)) lines.push(`${amt}× ${id.replace(/_/g,' ')}`);
        }
        if ((runSnapshot.itemsFound || []).length > 0) {
            for (const it of runSnapshot.itemsFound) {
                lines.push(it._isChest ? `📦 ${it.name}` : `⚔ ${it.name}`);
            }
        }
        if (runSnapshot.xpFound > 0) lines.push(`+${runSnapshot.xpFound} XP`);
        return lines;
    },
};
