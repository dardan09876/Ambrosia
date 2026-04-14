// js/delves/delveRewards.js
// Applies a completed interactive delve run's results to the live player.

const DelveRewards = {

    apply(player, runState) {
        if (!player || !runState) return;

        const result = runState.result; // 'victory' | 'death' | 'escaped'

        // ── Death ─────────────────────────────────────────────────────────────
        if (result === 'death') {
            // HP → 0 (player must rest before re-entering)
            player.stats.health.value = 0;

            // Corruption kept
            if (runState.gainedCorruption > 0 && typeof PlayerSystem !== 'undefined') {
                PlayerSystem.gainCorruption(runState.gainedCorruption);
            }

            Log.add(
                `You fell in the ${runState.delveDef?.name}. HP set to 0. +${runState.gainedCorruption} corruption. No rewards.`,
                'danger'
            );

            if (typeof SaveSystem !== 'undefined') SaveSystem.save();
            return;
        }

        // ── Victory or Escape ─────────────────────────────────────────────────

        // HP stays at current run value
        player.stats.health.value = Math.max(1, runState.playerHp);

        // Gold
        if (runState.goldFound > 0) {
            player.gold = (player.gold || 0) + runState.goldFound;
        }

        // Rift shards (stored as crafting material)
        if (runState.riftShardsFound > 0) {
            if (typeof CraftingSystem !== 'undefined') {
                CraftingSystem.addMaterial(player, 'rift_shard', runState.riftShardsFound);
            } else {
                if (!player.craftingMaterials) player.craftingMaterials = {};
                player.craftingMaterials['rift_shard'] = (player.craftingMaterials['rift_shard'] || 0) + runState.riftShardsFound;
            }
        }

        // Materials
        for (const mat of (runState.materialsFound || [])) {
            if (!mat.id || !mat.amount) continue;
            if (typeof CraftingSystem !== 'undefined') {
                CraftingSystem.addMaterial(player, mat.id, mat.amount);
            } else {
                if (!player.craftingMaterials) player.craftingMaterials = {};
                player.craftingMaterials[mat.id] = (player.craftingMaterials[mat.id] || 0) + mat.amount;
            }
        }

        // Boss chest (victory only)
        if (result === 'victory' && runState._bossChest) {
            const chest = runState._bossChest;
            const existing = player.inventory.find(i => i.type === 'chest' && i.tier === chest.tier && i.name === chest.name);
            if (existing) {
                existing.quantity = (existing.quantity || 1) + 1;
            } else {
                player.inventory.push({
                    uid:      Date.now() * 10000 + Math.floor(Math.random() * 10000),
                    type:     'chest',
                    tier:     chest.tier,
                    name:     chest.name,
                    quantity: 1,
                });
            }
        }

        // XP — distributed across active combat skills
        const totalXp = runState.xpFound || 0;
        if (totalXp > 0 && typeof PlayerSystem !== 'undefined') {
            const combatSkills = ['melee','ranged','magic','restoration','defense','stealth'];
            const trained  = combatSkills.filter(sk => (player.skills[sk] || 0) > 0);
            const targets  = trained.length > 0 ? trained : ['melee'];
            const sorted   = targets.sort((a, b) => (player.skills[b] || 0) - (player.skills[a] || 0));
            for (let i = 0; i < sorted.length; i++) {
                const share = i === 0 ? totalXp : Math.floor(totalXp * 0.4);
                PlayerSystem.gainSkillExperience(sorted[i], share);
            }
        }

        // Corruption
        if (runState.gainedCorruption > 0 && typeof PlayerSystem !== 'undefined') {
            PlayerSystem.gainCorruption(runState.gainedCorruption);
        }

        const verb = result === 'victory' ? 'cleared' : 'escaped';
        const parts = [];
        if (runState.goldFound > 0)       parts.push(`+${runState.goldFound}g`);
        if (runState.riftShardsFound > 0) parts.push(`+${runState.riftShardsFound} rift shards`);
        if (totalXp > 0)                  parts.push(`+${totalXp} XP`);

        Log.add(
            `Delve ${verb}: ${runState.delveDef?.name}.${parts.length ? ' ' + parts.join(' · ') : ''}`,
            result === 'victory' ? 'success' : 'info'
        );

        if (typeof SaveSystem !== 'undefined') SaveSystem.save();
    },
};
