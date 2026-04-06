// js/systems/warbandSystem.js
// Warband system: map generation, tile control (score-based), rift quests,
// enemy response, faction support, influence economy.

const WarbandSystem = {

    // ── Seeded RNG ────────────────────────────────────────────────────────────
    _rng(seed) {
        let s = seed >>> 0;
        return () => {
            s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
            return (s >>> 0) / 0xffffffff;
        };
    },

    _mapSeed(player) {
        let h = 0;
        for (const ch of (player.name + player.faction)) {
            h = Math.imul(31, h) + ch.charCodeAt(0) | 0;
        }
        return h >>> 0;
    },

    // ── Control state from score ──────────────────────────────────────────────
    controlState(score) {
        if (score >= WARBAND_CONTROL.playerThresh)  return 'player';
        if (score <= WARBAND_CONTROL.enemyThresh)   return 'enemy';
        return 'contested';
    },

    // ── Map generation ────────────────────────────────────────────────────────
    generateMap(player) {
        const rng   = this._rng(this._mapSeed(player));
        const COLS  = 5;
        const ROWS  = 4;

        const typePool = [
            'rift','rift','rift','rift',
            'stronghold','stronghold','stronghold',
            'supply','supply','supply',
            'pathway','pathway','pathway','pathway',
            'pathway',
        ];
        // Shuffle
        for (let i = typePool.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [typePool[i], typePool[j]] = [typePool[j], typePool[i]];
        }

        // Build all cells, drop 3–4 edge cells for irregular shape
        const cells = [];
        for (let r = 0; r < ROWS; r++)
            for (let c = 0; c < COLS; c++)
                cells.push({ x: c, y: r });

        const edgeCells = cells.filter(c => c.x === 0 || c.x === COLS-1 || c.y === 0 || c.y === ROWS-1);
        const dropCount = 3 + Math.floor(rng() * 2);
        for (let i = 0; i < dropCount && edgeCells.length > 0; i++) {
            const idx  = Math.floor(rng() * edgeCells.length);
            const cell = edgeCells.splice(idx, 1)[0];
            const ci   = cells.findIndex(c => c.x === cell.x && c.y === cell.y);
            if (ci !== -1) cells.splice(ci, 1);
        }

        const tiles = cells.map((cell, i) => ({
            id:           `tile_${String(i).padStart(2,'0')}`,
            type:         typePool[i % typePool.length],
            difficulty:   1 + Math.floor(rng() * 4),
            controlScore: WARBAND_CONTROL.enemyFull,  // all start fully enemy
            stabilized:   false,    // rift tiles: disables enemy spawns
            fortLevel:    0,        // 0–2: each level halves remaining enemy pressure
            troopCount:   0,        // 0–3: each troop stack adds control gain per tick
            x:            cell.x,
            y:            cell.y,
            adjacentIds:  [],
            unlocked:     false,
        }));

        // Adjacency (4-directional)
        for (const t of tiles) {
            t.adjacentIds = tiles
                .filter(o => o.id !== t.id && Math.abs(o.x - t.x) + Math.abs(o.y - t.y) === 1)
                .map(o => o.id);
        }

        // Starting access: 2 central pathway tiles start contested + unlocked
        const cx = (COLS - 1) / 2;
        const cy = (ROWS - 1) / 2;
        const pathways = tiles
            .filter(t => t.type === 'pathway')
            .sort((a, b) => (Math.abs(a.x-cx)+Math.abs(a.y-cy)) - (Math.abs(b.x-cx)+Math.abs(b.y-cy)));

        if (pathways[0]) { pathways[0].controlScore = 0; pathways[0].unlocked = true; pathways[0].troopCount = 1; }
        if (pathways[1]) { pathways[1].controlScore = 0; pathways[1].unlocked = true; }

        this._propagateUnlocks(tiles);
        return tiles;
    },

    _propagateUnlocks(tiles) {
        const byId = Object.fromEntries(tiles.map(t => [t.id, t]));
        let changed = true;
        while (changed) {
            changed = false;
            for (const t of tiles) {
                if (!t.unlocked) continue;
                if (this.controlState(t.controlScore) === 'enemy') continue;
                for (const adjId of t.adjacentIds) {
                    const adj = byId[adjId];
                    if (adj && !adj.unlocked) { adj.unlocked = true; changed = true; }
                }
            }
        }
    },

    // ── Tile helpers ──────────────────────────────────────────────────────────
    getMap(player)           { return player?.warbandMap ?? []; },
    getTile(player, id)      { return this.getMap(player).find(t => t.id === id) ?? null; },
    getTilesByState(player, state) {
        return this.getMap(player).filter(t => this.controlState(t.controlScore) === state);
    },

    // ── Faction support ───────────────────────────────────────────────────────
    getActiveFactionSupport(player) {
        if (!player.warbandStats?.factionSupportActive) return null;
        return getWarbandFactionSupport(player.warbandStats.factionSupportActive);
    },

    requestFactionSupport(player) {
        const cost    = WARBAND_COSTS.factionSupport;
        if ((player.warbandInfluence || 0) < cost) {
            return { ok: false, reason: `Need ${cost} influence (have ${player.warbandInfluence || 0}).` };
        }
        const support = getWarbandFactionSupport(player.faction);
        if (!support) return { ok: false, reason: 'Your faction has no warband support available.' };

        player.warbandInfluence -= cost;
        player.warbandStats.factionSupportActive = player.faction;
        player.warbandStats.factionSupportExpires = Date.now() + 30 * 60 * 1000; // 30 min
        Log.add(`${support.name} support activated for 30 minutes. ${support.supportLabel}.`, 'success');
        SaveSystem.save();
        return { ok: true };
    },

    _checkFactionSupportExpiry(player) {
        const ws = player.warbandStats;
        if (!ws.factionSupportActive) return;
        if (Date.now() >= (ws.factionSupportExpires || 0)) {
            ws.factionSupportActive  = null;
            ws.factionSupportExpires = null;
            Log.add('Faction support has expired.', 'warning');
        }
    },

    // ── Player actions ────────────────────────────────────────────────────────

    // Deploy Troops: costs 30 influence per stack, up to 3 stacks per tile.
    // Each stack grants +20 control on deploy and adds +4 control/holding-tick.
    deployTroops(player, tileId) {
        const tile = this.getTile(player, tileId);
        if (!tile)          return { ok: false, reason: 'Tile not found.' };
        if (!tile.unlocked) return { ok: false, reason: 'Tile is not accessible yet.' };

        // Migrate old boolean field
        if (tile.troops !== undefined && tile.troopCount === undefined) {
            tile.troopCount = tile.troops ? 1 : 0;
            delete tile.troops;
        }
        tile.troopCount = tile.troopCount ?? 0;

        const MAX_TROOPS = 3;
        if (tile.troopCount >= MAX_TROOPS) {
            return { ok: false, reason: `Maximum troop stacks (${MAX_TROOPS}) already deployed.` };
        }

        const cost = WARBAND_COSTS.deployTroops;
        if ((player.warbandInfluence || 0) < cost) {
            return { ok: false, reason: `Need ${cost} influence (have ${player.warbandInfluence || 0}).` };
        }

        player.warbandInfluence -= cost;
        tile.troopCount++;
        tile.controlScore = Math.min(WARBAND_CONTROL.playerFull, tile.controlScore + 20);
        this._propagateUnlocks(this.getMap(player));
        PlayerSystem._recalcStatMaxes();

        const stackLabel = tile.troopCount > 1 ? ` (${tile.troopCount}/${MAX_TROOPS} stacks)` : '';
        Log.add(`Troops deployed to ${WARBAND_TILE_TYPES[tile.type]?.label ?? tile.type}. Control +20${stackLabel}.`, 'success');
        SaveSystem.save();
        return { ok: true };
    },

    // Fortify: costs 50 influence per level, up to 2 levels.
    // Level 1 → enemy pressure ×0.5. Level 2 → enemy pressure ×0.25.
    fortifyTile(player, tileId) {
        const tile = this.getTile(player, tileId);
        if (!tile)          return { ok: false, reason: 'Tile not found.' };
        if (!tile.unlocked) return { ok: false, reason: 'Tile is not accessible.' };

        // Migrate old boolean field
        if (tile.fortified !== undefined && tile.fortLevel === undefined) {
            tile.fortLevel = tile.fortified ? 1 : 0;
            delete tile.fortified;
        }
        tile.fortLevel = tile.fortLevel ?? 0;

        const MAX_FORT = 2;
        if (tile.fortLevel >= MAX_FORT) {
            return { ok: false, reason: 'Maximum fortification level reached.' };
        }

        const support = this.getActiveFactionSupport(player);
        let cost = WARBAND_COSTS.fortify;
        if (support?.effects?.fortifyCostMod) cost = Math.ceil(cost * support.effects.fortifyCostMod);

        if ((player.warbandInfluence || 0) < cost) {
            return { ok: false, reason: `Need ${cost} influence (have ${player.warbandInfluence || 0}).` };
        }

        player.warbandInfluence -= cost;
        tile.fortLevel++;
        const reductionLabel = tile.fortLevel === 1 ? '50%' : '75%';
        Log.add(`${WARBAND_TILE_TYPES[tile.type]?.label ?? tile.type} fortified (level ${tile.fortLevel}) — enemy pressure reduced to ${reductionLabel}.`, 'success');
        SaveSystem.save();
        return { ok: true };
    },

    // Stabilize Rift: costs 70 influence, disables enemy spawns on rift tile
    stabilizeRift(player, tileId) {
        const tile = this.getTile(player, tileId);
        if (!tile)                return { ok: false, reason: 'Tile not found.' };
        if (tile.type !== 'rift') return { ok: false, reason: 'Only rift nodes can be stabilized.' };
        if (!tile.unlocked)       return { ok: false, reason: 'Tile is not accessible.' };
        if (tile.stabilized)      return { ok: false, reason: 'Rift is already stabilized.' };

        const support = this.getActiveFactionSupport(player);
        let cost = WARBAND_COSTS.stabilizeRift;
        if (support?.effects?.stabilizeCostMod) cost = Math.ceil(cost * support.effects.stabilizeCostMod);

        if ((player.warbandInfluence || 0) < cost) {
            return { ok: false, reason: `Need ${cost} influence (have ${player.warbandInfluence || 0}).` };
        }

        player.warbandInfluence -= cost;
        tile.stabilized = true;
        Log.add(`Rift stabilized — enemy spawns from this node are suppressed.`, 'success');
        SaveSystem.save();
        return { ok: true };
    },

    // ── Influence gain ────────────────────────────────────────────────────────

    // Called by delveRewards on successful delve
    gainInfluenceFromDelve(player, delveTier) {
        const gain = delveTier * 8;
        player.warbandInfluence = (player.warbandInfluence || 0) + gain;
        player.warbandStats.totalInfluenceEarned = (player.warbandStats.totalInfluenceEarned || 0) + gain;
        Log.add(`+${gain} warband influence from delve.`, 'info');
    },

    // ── Rift quest management ─────────────────────────────────────────────────

    canStartRiftQuest(player, questId) {
        const quest = getWarbandRiftQuest(questId);
        if (!quest) return { ok: false, reason: 'Unknown quest.' };

        if (player.warbandStats?.activeRiftQuest) {
            return { ok: false, reason: 'A rift quest is already in progress.' };
        }

        const cooldowns = player.warbandStats?.questCooldowns || {};
        const lastRun   = cooldowns[questId] || 0;
        const remaining = Math.max(0, (lastRun + quest.cooldownSec * 1000) - Date.now());
        if (remaining > 0) {
            const mins = Math.ceil(remaining / 60000);
            return { ok: false, reason: `On cooldown — ${mins} min remaining.` };
        }

        const hasTile = this.getMap(player).some(t => t.type === quest.tileType && t.unlocked);
        if (!hasTile) {
            return { ok: false, reason: `Unlock a ${WARBAND_TILE_TYPES[quest.tileType]?.label ?? quest.tileType} tile first.` };
        }

        return { ok: true };
    },

    startRiftQuest(player, questId) {
        const check = this.canStartRiftQuest(player, questId);
        if (!check.ok) { Log.add(check.reason, 'warning'); return check; }

        const quest = getWarbandRiftQuest(questId);
        player.warbandStats.activeRiftQuest = { questId, endsAt: Date.now() + quest.duration * 1000 };
        Log.add(`Rift quest started: "${quest.name}". Returns in ${quest.duration}s.`, 'info');
        SaveSystem.save();
        return { ok: true };
    },

    resolveRiftQuest(player) {
        const active = player.warbandStats?.activeRiftQuest;
        if (!active) return;

        const quest = getWarbandRiftQuest(active.questId);
        player.warbandStats.activeRiftQuest = null;

        if (!quest) { SaveSystem.save(); return; }

        if (!player.warbandStats.questCooldowns) player.warbandStats.questCooldowns = {};
        player.warbandStats.questCooldowns[quest.id] = Date.now();

        const chance   = 70;   // flat 70% success (30% fail)
        const success  = Math.random() * 100 < chance;

        if (success) {
            const support    = this.getActiveFactionSupport(player);
            const influence  = calcQuestInfluence(quest, support);
            const gold       = quest.goldReward.min + Math.floor(Math.random() * (quest.goldReward.max - quest.goldReward.min + 1));

            player.gold                += gold;
            player.warbandInfluence     = (player.warbandInfluence || 0) + influence;
            player.warbandStats.totalInfluenceEarned = (player.warbandStats.totalInfluenceEarned || 0) + influence;
            player.warbandStats.questsCompleted       = (player.warbandStats.questsCompleted || 0) + 1;

            // Apply control gain to a relevant tile of matching type
            const targets = this.getMap(player).filter(t => t.type === quest.tileType && t.unlocked
                && this.controlState(t.controlScore) !== 'player');
            if (targets.length > 0) {
                // Pick the tile closest to player control
                const target = targets.sort((a, b) => b.controlScore - a.controlScore)[0];
                target.controlScore = Math.min(WARBAND_CONTROL.playerFull, target.controlScore + (quest.controlGain || 10));
                this._propagateUnlocks(this.getMap(player));
                PlayerSystem._recalcStatMaxes();
            }

            Log.add(`"${quest.name}" complete — +${influence} influence, +${gold}g.`, 'success');
        } else {
            // Failure: enemy gains ground on a tile
            const enemyTargets = this.getMap(player).filter(t => t.unlocked
                && this.controlState(t.controlScore) !== 'enemy');
            if (enemyTargets.length > 0) {
                const target = enemyTargets[Math.floor(Math.random() * enemyTargets.length)];
                target.controlScore = Math.max(WARBAND_CONTROL.enemyFull, target.controlScore - 10);
                PlayerSystem._recalcStatMaxes();
            }
            Log.add(`"${quest.name}" failed. Enemy gains ground.`, 'warning');
        }

        SaveSystem.save();
        if (typeof Router !== 'undefined' && Router._current === 'warbands') Router._load('warbands');
    },

    // ── Win / Loss condition check ────────────────────────────────────────────
    checkWinLoss(player) {
        const tiles     = this.getMap(player);
        const majorTypes = ['rift','stronghold','supply'];
        const majorTiles = tiles.filter(t => majorTypes.includes(t.type));
        const riftTiles  = tiles.filter(t => t.type === 'rift');

        // Win: control all major tiles
        const allMajorControlled = majorTiles.length > 0
            && majorTiles.every(t => this.controlState(t.controlScore) === 'player');

        // Win: all rifts stabilized
        const allRiftsStabilized = riftTiles.length > 0 && riftTiles.every(t => t.stabilized);

        // Loss: all player + contested tiles lost
        const playerTiles = tiles.filter(t => {
            const s = this.controlState(t.controlScore);
            return s === 'player' || s === 'contested';
        });
        const totallyLost = playerTiles.length === 0;

        return {
            win:   allMajorControlled || allRiftsStabilized,
            loss:  totallyLost,
            winReason: allMajorControlled ? 'All major tiles secured.'
                     : allRiftsStabilized  ? 'All rifts stabilized.' : null,
        };
    },

    // ── Game loop tick ────────────────────────────────────────────────────────
    _pressureTimer:  0,
    _holdingTimer:   0,
    PRESSURE_INTERVAL: 60,  // enemy turn every 60 seconds
    HOLDING_INTERVAL:  30,  // holding bonus every 30 seconds

    tick() {
        const player = PlayerSystem.current;
        if (!player?.warbandStats) return;

        this._checkFactionSupportExpiry(player);

        // Resolve completed rift quest
        const active = player.warbandStats.activeRiftQuest;
        if (active && Date.now() >= active.endsAt) this.resolveRiftQuest(player);

        // Holding bonus: player tiles slowly build control over time
        this._holdingTimer++;
        if (this._holdingTimer >= this.HOLDING_INTERVAL) {
            this._holdingTimer = 0;
            this._applyHoldingBonus(player);
        }

        // Enemy turn
        this._pressureTimer++;
        if (this._pressureTimer >= this.PRESSURE_INTERVAL) {
            this._pressureTimer = 0;
            this._enemyTurn(player);
        }
    },

    // Holding tiles over time increases control score
    _applyHoldingBonus(player) {
        const support   = this.getActiveFactionSupport(player);
        const extraHold = support?.effects?.holdingBonus || 0;
        const tiles     = this.getMap(player);
        let changed     = false;

        for (const tile of tiles) {
            const troops = tile.troopCount ?? (tile.troops ? 1 : 0);
            const state  = this.controlState(tile.controlScore);

            if (state === 'player') {
                // Base hold gain + faction bonus + troop reinforcement
                const gain = 2 + extraHold + troops * 2;
                tile.controlScore = Math.min(WARBAND_CONTROL.playerFull, tile.controlScore + gain);
                changed = true;
            } else if (state === 'contested' && troops > 0) {
                // Troops actively push contested tiles toward player
                const gain = troops * 4 + extraHold;
                tile.controlScore = Math.min(WARBAND_CONTROL.playerFull, tile.controlScore + gain);
                changed = true;
            }
        }

        if (changed) {
            this._propagateUnlocks(tiles);
            PlayerSystem._recalcStatMaxes();
        }
    },

    // Enemy response: spread influence and attack player tiles
    _enemyTurn(player) {
        const tiles  = this.getMap(player);
        const byId   = Object.fromEntries(tiles.map(t => [t.id, t]));
        let   changed = false;

        for (const tile of tiles) {
            const state   = this.controlState(tile.controlScore);
            const typeDef = WARBAND_TILE_TYPES[tile.type] || {};
            const basePressure = typeDef.pressurePerTick ?? 1;
            const troops  = tile.troopCount ?? (tile.troops ? 1 : 0);
            const fortLv  = tile.fortLevel  ?? (tile.fortified ? 1 : 0);

            // Fortification reduction: lv1 → ×0.50, lv2 → ×0.25
            const fortMult = fortLv >= 2 ? 0.25 : fortLv === 1 ? 0.50 : 1.0;
            // Troops reduce incoming pressure (each stack = 15% reduction, max 45%)
            const troopDefMult = Math.max(0.55, 1.0 - troops * 0.15);

            // ── Enemy-controlled: spread into ONE weakest adjacent non-enemy tile ──
            if (state === 'enemy') {
                // Limit spread to one target per tile per tick to slow enemy advance
                const adjTargets = tile.adjacentIds
                    .map(id => byId[id])
                    .filter(adj => adj && this.controlState(adj.controlScore) !== 'enemy')
                    .sort((a, b) => a.controlScore - b.controlScore);

                if (adjTargets.length > 0) {
                    const adj = adjTargets[0];
                    const spread = Math.ceil(tile.difficulty * 1.5); // reduced from *2
                    const adjFort = adj.fortLevel ?? (adj.fortified ? 1 : 0);
                    const adjFortMult = adjFort >= 2 ? 0.25 : adjFort === 1 ? 0.50 : 1.0;
                    const adjTroops  = adj.troopCount ?? (adj.troops ? 1 : 0);
                    const adjDefMult = Math.max(0.55, 1.0 - adjTroops * 0.15);
                    const effectiveSpread = Math.max(1, Math.ceil(spread * adjFortMult * adjDefMult));
                    adj.controlScore = Math.max(WARBAND_CONTROL.enemyFull, adj.controlScore - effectiveSpread);
                    changed = true;
                }
            }

            // ── Player-controlled: enemy applies pressure ────────────────────
            if (state === 'player') {
                let pressure = basePressure + tile.difficulty; // reduced base: was basePressure * difficulty
                if (tile.type === 'rift' && !tile.stabilized) pressure += 2; // was +3
                pressure = Math.ceil(pressure * fortMult * troopDefMult);

                tile.controlScore = Math.max(WARBAND_CONTROL.enemyFull, tile.controlScore - pressure);
                if (pressure > 0) changed = true;

                if (this.controlState(tile.controlScore) === 'enemy') {
                    tile.troopCount = 0;
                    tile.fortLevel  = 0;
                    delete tile.troops;
                    delete tile.fortified;
                    Log.add(`Enemy reclaimed ${typeDef.label ?? tile.type}!`, 'danger');
                }
            }

            // ── Contested: enemy nudges, but troops can offset it ─────────────
            if (state === 'contested') {
                const push = Math.max(0, tile.difficulty - troops); // troops cancel difficulty push
                if (push > 0) {
                    tile.controlScore = Math.max(WARBAND_CONTROL.enemyFull, tile.controlScore - push);
                    changed = true;
                }
            }
        }

        if (changed) {
            this._propagateUnlocks(tiles);
            PlayerSystem._recalcStatMaxes();
            SaveSystem.save();
        }
    },

    // ── Bonus queries ─────────────────────────────────────────────────────────
    _countByState(player, type, state = 'player') {
        return this.getMap(player).filter(t => t.type === type && this.controlState(t.controlScore) === state).length;
    },

    getStrongholdHealthBonus(player) {
        player = player || PlayerSystem.current;
        if (!player) return 0;
        return this._countByState(player, 'stronghold') * 10;
    },

    getXpBonus(player) {
        player = player || PlayerSystem.current;
        if (!player) return 1.0;
        const count   = this._countByState(player, 'rift');
        const support = this.getActiveFactionSupport(player);
        const extra   = support?.effects?.riftXpBonus ? (support.effects.riftXpBonus - 1) : 0;
        return count > 0 ? 1 + count * 0.15 + extra : 1.0;
    },

    getGoldRewardBonus(player) {
        player = player || PlayerSystem.current;
        if (!player) return 1.0;
        const count = this._countByState(player, 'supply');
        return count > 0 ? 1 + count * 0.10 : 1.0;
    },

    getRiftQuestCooldownRemaining(player, questId) {
        const quest = getWarbandRiftQuest(questId);
        if (!quest) return 0;
        const last = player.warbandStats?.questCooldowns?.[questId] || 0;
        return Math.max(0, (last + quest.cooldownSec * 1000) - Date.now());
    },
};
