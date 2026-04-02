// js/systems/chestSystem.js
// Handles chest opening — rolls item tiers from weighted tables,
// picks a random item of that tier from ITEMS, and delivers it to inventory.

const ChestSystem = {

    // Open a chest by tier. Returns array of item objects awarded.
    open(chestTier) {
        const def = CHEST_DEFS[chestTier];
        if (!def) return [];

        const player  = PlayerSystem.current;
        const rewards = [];

        for (let i = 0; i < def.rolls; i++) {
            const itemTier = this._rollTier(def.tierWeights);
            const item     = this._rollItem(itemTier);
            if (item) {
                rewards.push(item);
                player.inventory.push(item);
            }
        }

        return rewards;
    },

    // Open a chest from the player's chest array by uid.
    // Returns { items: [], chestName: '' } or null if not found.
    openFromInventory(uid) {
        const player = PlayerSystem.current;
        const idx    = player.chests.findIndex(c => c.uid === uid);
        if (idx === -1) return null;

        const chest = player.chests[idx];
        player.chests.splice(idx, 1);

        const items = this.open(chest.tier);

        SaveSystem.save();

        return { items, chestName: chest.name, tier: chest.tier };
    },

    // ── Weighted tier roll ────────────────────────────────────────────────────
    _rollTier(weights) {
        const total = weights.reduce((sum, w) => sum + w.weight, 0);
        let roll    = Math.random() * total;
        for (const entry of weights) {
            roll -= entry.weight;
            if (roll <= 0) return entry.itemTier;
        }
        return weights[weights.length - 1].itemTier;
    },

    // ── Random item from a given tier ─────────────────────────────────────────
    _rollItem(tier) {
        const pool = Object.values(ITEMS).filter(item => item.tier === tier);
        if (pool.length === 0) return null;
        const base = pool[Math.floor(Math.random() * pool.length)];
        // Clone so inventory entries are independent
        return Object.assign({}, base, {
            uid: Date.now() + Math.random(),
            durability: base.maxDurability, // start at full durability
        });
    },
};
