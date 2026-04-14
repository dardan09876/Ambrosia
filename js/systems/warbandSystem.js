// js/systems/warbandSystem.js
// Warband system: ring-based war map, three-faction RTS simulation.
// Demons = territorial environmental pressure (5 behaviors + waves + phase escalation)
// Rival factions = doctrine-driven strategic AI
// Player = guided strategic force with orders and abilities

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

    // ── Control state ─────────────────────────────────────────────────────────
    controlState(tileOrScore) {
        if (typeof tileOrScore === 'object' && tileOrScore !== null) {
            if (tileOrScore.allyFaction === 'iron_dominion') return 'ally_iron';
            if (tileOrScore.allyFaction === 'ashen_covenant') return 'ally_ashen';
            return this._scoreState(tileOrScore.controlScore ?? 0);
        }
        return this._scoreState(tileOrScore);
    },
    _scoreState(score) {
        if (score >= WARBAND_CONTROL.playerThresh) return 'player';
        if (score <= WARBAND_CONTROL.enemyThresh)  return 'enemy';
        return 'contested';
    },

    // ── Map generation (triangular convergence, ~92 tiles) ───────────────────
    // 13×10 grid. Three faction corners converge toward Heart of Valdros (center).
    // Tier: rank-based distance from center → 5 center / 20 inner / 37 mid / 30 outer.
    // Lane: angle from center → 'iron' (top-left) / 'ashen' (top-right) / 'player' (bottom).
    generateMap(player) {
        const rng  = this._rng(this._mapSeed(player));
        const COLS = 13, ROWS = 10;
        const CX   = 6,  CY   = 3;   // Heart of Valdros anchor

        // ── Triangular shape filter ───────────────────────────────────────────
        // Triangle vertices: Iron=(0,0) top-left, Ashen=(12,0) top-right, Player=(6,9) bottom.
        // Barycentric coordinates with +0.14 expansion → ~92 active tiles.
        const inShape = (x, y) => {
            const u = y / 9;
            const v = (3 * x - 2 * y) / 36;
            return u >= -0.14 && v >= -0.14 && (u + v) <= 1.14;
        };

        const cells = [];
        for (let r = 0; r < ROWS; r++)
            for (let c = 0; c < COLS; c++)
                if (inShape(c, r)) cells.push({ x: c, y: r });

        // ── Map modifier ──────────────────────────────────────────────────────
        const modKeys = Object.keys(WARBAND_MAP_MODIFIERS);
        const modId   = modKeys[Math.floor(rng() * modKeys.length)];
        if (player.warbandStats) player.warbandStats.mapModifier = modId;

        // ── Tile type pool ────────────────────────────────────────────────────
        // 7 rifts, 9 strongholds, 11 supply, rest = pathway (out of ~91 non-heart tiles)
        const typePool = [];
        for (let i = 0; i < 7;  i++) typePool.push('rift');
        for (let i = 0; i < 9;  i++) typePool.push('stronghold');
        for (let i = 0; i < 11; i++) typePool.push('supply');
        while (typePool.length < cells.length - 1) typePool.push('pathway');
        for (let i = typePool.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [typePool[i], typePool[j]] = [typePool[j], typePool[i]];
        }

        // ── Demon zone rotation ───────────────────────────────────────────────
        const zoneRot = ['blight','infernal','ash','obsidian','infernal','blight','ash','blight'];

        // ── Build tile objects ────────────────────────────────────────────────
        const tiles = cells.map((cell, i) => ({
            id:               `tile_${String(i).padStart(2, '0')}`,
            type:             typePool[i % typePool.length],
            tier:             'outer',  // overwritten below
            lane:             null,     // overwritten below
            difficulty:       1 + Math.floor(rng() * 4),
            controlScore:     WARBAND_CONTROL.enemyFull,
            demonStrength:    0,        // overwritten after tier
            baseStrength:     0,
            demonZone:        null,
            isStrongpoint:    false,
            isChokepoint:     false,
            reinforcementRate: 0,
            allyFaction:      null,
            allyStrength:     0,
            battleIntensity:  0,
            stabilized:       false,
            fortLevel:        0,
            troopCount:       0,
            x:                cell.x,
            y:                cell.y,
            adjacentIds:      [],
            unlocked:         false,
        }));

        // ── Rank-based tier assignment ────────────────────────────────────────
        // Sort ascending distance from center → assign bands: 5 center, 20 inner, 37 mid, rest outer.
        const ranked = tiles.slice().sort((a, b) =>
            ((a.x-CX)**2 + (a.y-CY)**2) - ((b.x-CX)**2 + (b.y-CY)**2)
        );
        for (let i = 0; i < ranked.length; i++) {
            const t = ranked[i];
            t.tier = i < 5 ? 'center' : i < 25 ? 'inner' : i < 62 ? 'mid' : 'outer';
            const tDef          = getTierDef(t.tier);
            t.demonStrength     = tDef.baseStrength;
            t.baseStrength      = tDef.baseStrength;
            t.reinforcementRate = tDef.reinforcementRate;
        }

        // ── Lane assignment by angle from center ──────────────────────────────
        // Sector boundaries: 31.5° (Ashen/Player), 148.5° (Player/Iron), 270° (Iron/Ashen)
        const laneFor = (x, y) => {
            const deg = (Math.atan2(y - CY, x - CX) * 180 / Math.PI + 360) % 360;
            if (deg >= 31.5 && deg < 148.5) return 'player';
            if (deg >= 148.5 && deg < 270)  return 'iron';
            return 'ashen';
        };
        for (const t of tiles) {
            t.lane = (t.tier === 'center') ? null : laneFor(t.x, t.y);
        }

        // ── Adjacency (Manhattan distance = 1) ───────────────────────────────
        for (const t of tiles) {
            t.adjacentIds = tiles
                .filter(o => o.id !== t.id && Math.abs(o.x - t.x) + Math.abs(o.y - t.y) === 1)
                .map(o => o.id);
        }

        // ── Heart of Valdros ──────────────────────────────────────────────────
        const heart = ranked[0];
        heart.type              = 'heart';
        heart.tier              = 'center';
        heart.difficulty        = 5;
        heart.baseStrength      = 95;
        heart.demonStrength     = 95;
        heart.reinforcementRate = 4;
        heart.isStrongpoint     = true;
        heart.demonZone         = 'obsidian';
        heart.lane              = null;

        // ── Strongpoints (inner + mid, non-pathway, non-heart) ────────────────
        const spCandidates = tiles.filter(t =>
            (t.tier === 'inner' || t.tier === 'mid') && t.type !== 'pathway' && !t.isStrongpoint
        );
        const spCount = 4 + Math.floor(rng() * 3);
        for (let i = 0; i < spCount && spCandidates.length > 0; i++) {
            const idx = Math.floor(rng() * spCandidates.length);
            const sp  = spCandidates.splice(idx, 1)[0];
            sp.isStrongpoint     = true;
            sp.baseStrength     += 15;
            sp.demonStrength    += 15;
            sp.reinforcementRate += 1;
        }

        // ── Chokepoints ───────────────────────────────────────────────────────
        // Tile at a tier boundary with exactly 1 inward connection and ≤3 total adjacencies.
        const byId    = Object.fromEntries(tiles.map(t => [t.id, t]));
        const tierOrd = { outer: 0, mid: 1, inner: 2, center: 3 };
        for (const t of tiles) {
            if (t.isStrongpoint || t.type === 'heart') continue;
            const tOrd    = tierOrd[t.tier] ?? 0;
            const adjList = t.adjacentIds.map(id => byId[id]).filter(Boolean);
            const inward  = adjList.filter(adj => (tierOrd[adj.tier] ?? 0) === tOrd + 1);
            if (inward.length === 1 && adjList.length <= 3 && tOrd < 3) {
                t.isChokepoint = true;
            }
        }

        // ── Faction starting territories ──────────────────────────────────────
        // Each faction claims ~10 outer-ring tiles in their lane corner.
        const outerTiles = tiles.filter(t => t.tier === 'outer' && t.type !== 'heart');

        const playerStart = outerTiles
            .filter(t => t.lane === 'player')
            .sort((a, b) => (b.y - a.y) || (Math.abs(a.x - 6) - Math.abs(b.x - 6)))
            .slice(0, 10);

        const ironStart = outerTiles
            .filter(t => t.lane === 'iron')
            .sort((a, b) => (a.x + a.y) - (b.x + b.y))
            .slice(0, 10);

        const ashenStart = outerTiles
            .filter(t => t.lane === 'ashen')
            .sort((a, b) => (a.y - b.y) || (b.x - a.x))
            .slice(0, 10);

        for (const t of playerStart) {
            t.controlScore  = 60;
            t.demonStrength = 0;
            t.troopCount    = playerStart.indexOf(t) === 0 ? 1 : 0;
            t.unlocked      = true;
        }
        for (const t of ironStart) {
            t.allyFaction   = 'iron_dominion';
            t.allyStrength  = 85;
            t.controlScore  = 0;
            t.demonStrength = 0;
            t.unlocked      = true;
            if (modId === 'fortified_world') t.fortLevel = 1;
        }
        for (const t of ashenStart) {
            t.allyFaction   = 'ashen_covenant';
            t.allyStrength  = 85;
            t.controlScore  = 0;
            t.demonStrength = 0;
            t.unlocked      = true;
        }

        // ── Demon zone assignment ─────────────────────────────────────────────
        let zIdx = 0;
        for (const t of tiles) {
            if (t.allyFaction || this._scoreState(t.controlScore) !== 'enemy') continue;
            t.demonZone = zoneRot[zIdx++ % zoneRot.length];
            const zd = getDemonZone(t.demonZone);
            if (zd?.lowStrength)   t.demonStrength = Math.max(10, t.demonStrength - 15);
            if (zd?.fortressBonus) t.demonStrength = Math.min(100, t.demonStrength + zd.fortressBonus);
        }

        // ── Apply map modifier ────────────────────────────────────────────────
        if (modId === 'corruption_surge') {
            for (const t of tiles) {
                if (t.allyFaction || this._scoreState(t.controlScore) !== 'enemy') continue;
                t.demonStrength = Math.min(100, Math.round(t.demonStrength * 1.15));
                t.baseStrength  = Math.min(100, Math.round(t.baseStrength  * 1.15));
            }
        }
        if (modId === 'supply_rich') {
            const midPaths = tiles.filter(t => t.type === 'pathway' && t.tier === 'mid');
            for (let i = 0; i < Math.min(3, midPaths.length); i++) {
                const idx = Math.floor(rng() * (midPaths.length - i));
                midPaths.splice(idx, 1)[0].type = 'supply';
            }
        }
        if (modId === 'collapsed_routes') {
            // Convert extra mid pathway tiles into chokepoints
            const midPaths = tiles.filter(t => t.type === 'pathway' && t.tier === 'mid' && !t.isChokepoint);
            for (let i = 0; i < Math.min(4, midPaths.length); i++) {
                const idx = Math.floor(rng() * (midPaths.length - i));
                const t   = midPaths.splice(idx, 1)[0];
                t.isChokepoint  = true;
                t.baseStrength  = Math.min(100, t.baseStrength  + 10);
                t.demonStrength = Math.min(100, t.demonStrength + 10);
            }
        }
        if (modId === 'fortified_world') {
            // Demon strongpoints become brutally defended
            for (const t of tiles.filter(t => t.isStrongpoint && !t.allyFaction)) {
                t.baseStrength  = Math.min(100, t.baseStrength  + 20);
                t.demonStrength = Math.min(100, t.demonStrength + 20);
            }
        }

        // ── Neutral contested mid-ring tiles (~15% of mid) ────────────────────
        const neutralPool = tiles.filter(t =>
            t.tier === 'mid' && !t.allyFaction && !t.isStrongpoint && t.type !== 'heart' &&
            this._scoreState(t.controlScore) === 'enemy'
        );
        const neutralCount = Math.min(Math.floor(neutralPool.length * 0.15), 6);
        for (let i = 0; i < neutralCount && neutralPool.length > i; i++) {
            const idx = Math.floor(rng() * (neutralPool.length - i));
            const t   = neutralPool.splice(idx, 1)[0];
            t.controlScore  = -15;
            t.demonStrength = Math.max(0, t.demonStrength - 25);
        }

        this._propagateUnlocks(tiles);
        return tiles;
    },

    _propagateUnlocks(tiles) {
        const byId    = Object.fromEntries(tiles.map(t => [t.id, t]));
        let   changed = true;
        while (changed) {
            changed = false;
            for (const t of tiles) {
                if (!t.unlocked) continue;
                const state = this.controlState(t);
                if (state === 'enemy') continue;
                for (const adjId of t.adjacentIds) {
                    const adj = byId[adjId];
                    if (adj && !adj.unlocked) { adj.unlocked = true; changed = true; }
                }
            }
        }
    },

    // ── Tile helpers ──────────────────────────────────────────────────────────
    getMap(player)      { return player?.warbandMap ?? []; },
    getTile(player, id) { return this.getMap(player).find(t => t.id === id) ?? null; },

    // ── Campaign / stat init + migration ─────────────────────────────────────
    _ensureCampaign(player) {
        const ws = player.warbandStats;
        if (!ws.warLog)            ws.warLog            = [];
        if (!ws.orderCooldowns)    ws.orderCooldowns    = {};
        if (!ws.abilityCooldowns)  ws.abilityCooldowns  = {};
        if (!ws.activeOrder)       ws.activeOrder       = null;
        if (!ws.globalFortBoost)   ws.globalFortBoost   = null;
        if (!ws.aiIntents)         ws.aiIntents = { iron_dominion: null, ashen_covenant: null, void_horde: null };
        if (ws.minorWaveTimer  === undefined) ws.minorWaveTimer  = 0;
        if (ws.majorWaveTimer  === undefined) ws.majorWaveTimer  = 0;
        if (ws.demonPhase      === undefined) ws.demonPhase      = 1;
        if (ws.mapModifier     === undefined) ws.mapModifier     = null;
        if (ws.gameState       === undefined) ws.gameState       = 'idle';
        if (ws.countdownEndsAt === undefined) ws.countdownEndsAt = null;
        if (ws.gameEndsAt      === undefined) ws.gameEndsAt      = null;
        if (ws.gameDuration    === undefined) ws.gameDuration    = 1800;
        if (ws.gameResult      === undefined) ws.gameResult      = null;
        if (ws.command         === undefined) ws.command         = 0;
        if (ws.commandCap      === undefined) ws.commandCap      = 300;
        if (ws.turn            === undefined) ws.turn            = 0;
        if (ws.turnLimit       === undefined) ws.turnLimit       = 60;

        // ── v2 map migration: upgrade small (5×4) maps to the new 13×10 layout ──
        if (!ws._mapV2) {
            ws._mapV2 = true;
            const mapLen = player.warbandMap?.length ?? 0;
            if (mapLen > 0 && mapLen < 50) {
                // Old format detected — regenerate with new triangular map
                player.warbandMap = this.generateMap(player);
                return;   // generateMap sets all tile fields; migration loop not needed
            }
        }

        // Migrate tile fields added in later releases
        for (const t of this.getMap(player)) {
            if (t.tier          === undefined) t.tier            = this._inferTier(t.x, t.y);
            if (t.lane          === undefined) t.lane            = null;
            if (t.isChokepoint  === undefined) t.isChokepoint    = false;
            if (t.demonStrength === undefined) {
                const tDef  = getTierDef(t.tier);
                const state = this.controlState(t);
                t.demonStrength = (state === 'player' || t.allyFaction) ? 0 : tDef.baseStrength;
            }
            if (t.baseStrength      === undefined) t.baseStrength      = getTierDef(t.tier).baseStrength;
            if (t.isStrongpoint     === undefined) t.isStrongpoint      = (t.type === 'heart');
            if (t.demonZone         === undefined) t.demonZone          = null;
            if (t.reinforcementRate === undefined) t.reinforcementRate  = getTierDef(t.tier).reinforcementRate;
            if (t.battleIntensity   === undefined) t.battleIntensity    = 0;
        }
    },

    _inferTier(x, y) {
        // Large map (13×10): center at (6, 3)
        const d = Math.sqrt((x - 6) ** 2 + (y - 3) ** 2);
        if (d <= 1.2) return 'center';
        if (d <= 3.0) return 'inner';
        if (d <= 5.5) return 'mid';
        return 'outer';
    },

    // ── War log ───────────────────────────────────────────────────────────────
    addWarLog(player, msg, type = 'info') {
        const ws = player.warbandStats;
        if (!ws.warLog) ws.warLog = [];
        ws.warLog.unshift({ msg, type, ts: Date.now() });
        if (ws.warLog.length > 30) ws.warLog.length = 30;
    },
    getWarLog(player) { return player?.warbandStats?.warLog ?? []; },

    // ── Phase system ─────────────────────────────────────────────────────────
    // Phase is driven by demon territory percentage.
    // Phase 1 (>60% demon) → Phase 2 (40-60%) → Phase 3 (<40%)
    computePhase(player) {
        const tiles     = this.getMap(player);
        if (tiles.length === 0) return 1;
        const demonCount = tiles.filter(t => this.controlState(t) === 'enemy').length;
        const pct        = demonCount / tiles.length;
        return pct > 0.60 ? 1 : pct > 0.40 ? 2 : 3;
    },

    getPhase(player) {
        return WARBAND_DEMON_PHASES[player?.warbandStats?.demonPhase ?? 1] ?? WARBAND_DEMON_PHASES[1];
    },

    _checkPhaseTransition(player) {
        const ws       = player.warbandStats;
        const newPhase = this.computePhase(player);
        if (newPhase !== ws.demonPhase) {
            const phaseDef = WARBAND_DEMON_PHASES[newPhase];
            ws.demonPhase  = newPhase;
            const labels = ['', '📍 Frontier War', '⚠ Corruption Response', '🔥 Endgame Eruption'];
            this.addWarLog(player, `— Phase ${newPhase}: ${phaseDef?.label} — ${phaseDef?.desc}`, 'warning');
        }
    },

    // ── Faction support ───────────────────────────────────────────────────────
    getActiveFactionSupport(player) {
        if (!player.warbandStats?.factionSupportActive) return null;
        return getWarbandFactionSupport(player.warbandStats.factionSupportActive);
    },

    requestFactionSupport(player) {
        const cost = WARBAND_COSTS.factionSupport;
        if ((player.warbandInfluence || 0) < cost)
            return { ok: false, reason: `Need ${cost} Influence.` };
        const support = getWarbandFactionSupport(player.faction);
        if (!support) return { ok: false, reason: 'No support available.' };

        player.warbandInfluence -= cost;
        player.warbandStats.factionSupportActive      = player.faction;
        player.warbandStats.factionSupportExpiresTurn = (player.warbandStats.turn ?? 0) + 8;
        Log.add(`${support.name} support activated for 8 turns.`, 'success');
        SaveSystem.save();
        return { ok: true };
    },

    _checkFactionSupportExpiry(player) {
        const ws = player.warbandStats;
        if (!ws.factionSupportActive) return;
        if ((ws.turn ?? 0) >= (ws.factionSupportExpiresTurn ?? 0)) {
            ws.factionSupportActive       = null;
            ws.factionSupportExpiresTurn  = null;
        }
    },

    // ── Strategic orders ──────────────────────────────────────────────────────
    getActiveOrder(player) {
        const ws = player.warbandStats;
        if (!ws?.activeOrder) return null;
        if ((ws.turn ?? 0) >= ws.activeOrder.expiresTurn) { ws.activeOrder = null; return null; }
        return ws.activeOrder;
    },

    getOrderCooldownRemaining(player, orderId) {
        const lastTurn = player.warbandStats?.orderCooldowns?.[orderId] || 0;
        const def      = getStrategicOrder(orderId);
        if (!def || !lastTurn) return 0;
        const curTurn  = player.warbandStats?.turn ?? 0;
        return Math.max(0, (lastTurn + def.cooldownTurns) - curTurn);
    },

    canApplyOrder(player, orderId) {
        const def = getStrategicOrder(orderId);
        if (!def) return { ok: false, reason: 'Unknown order.' };
        if (this.getActiveOrder(player)) return { ok: false, reason: 'An order is already active.' };
        const cd = this.getOrderCooldownRemaining(player, orderId);
        if (cd > 0) return { ok: false, reason: `On cooldown.` };
        if (def.cost && (player.warbandStats?.command ?? 0) < def.cost)
            return { ok: false, reason: `Need ${def.cost} Command.` };
        return { ok: true };
    },

    applyStrategicOrder(player, orderId, targetTileId = null) {
        const check = this.canApplyOrder(player, orderId);
        if (!check.ok) { Log.add(check.reason, 'warning'); return check; }

        const def = getStrategicOrder(orderId);
        const ws  = player.warbandStats;
        if (def.cost) ws.command -= def.cost;

        ws.activeOrder = { orderId, expiresTurn: (ws.turn ?? 0) + def.durationTurns, targetTileId: targetTileId || null };
        ws.orderCooldowns[orderId] = ws.turn ?? 0;

        const tileLabel = targetTileId ? ` → ${WARBAND_TILE_TYPES[this.getTile(player, targetTileId)?.type]?.label ?? targetTileId}` : '';
        this.addWarLog(player, `${def.icon} Order: ${def.name}${tileLabel}`, 'success');
        Log.add(`Strategic order: ${def.name}.`, 'success');
        SaveSystem.save();
        return { ok: true };
    },

    _checkOrderExpiry(player) {
        const ws = player.warbandStats;
        if (!ws?.activeOrder) return;
        if ((ws.turn ?? 0) >= ws.activeOrder.expiresTurn) {
            const def = getStrategicOrder(ws.activeOrder.orderId);
            this.addWarLog(player, `Order expired: ${def?.name ?? ws.activeOrder.orderId}`, 'info');
            ws.activeOrder = null;
        }
    },

    _getOrderEffects(player) {
        const active = this.getActiveOrder(player);
        if (!active) return {};
        return getStrategicOrder(active.orderId)?.effects ?? {};
    },

    // ── Tactical abilities ────────────────────────────────────────────────────
    getAbilityCooldownRemaining(player, abilityId) {
        const lastTurn = player.warbandStats?.abilityCooldowns?.[abilityId] || 0;
        const def      = getTacticalAbility(abilityId);
        if (!def || !lastTurn) return 0;
        const curTurn  = player.warbandStats?.turn ?? 0;
        return Math.max(0, (lastTurn + def.cooldownTurns) - curTurn);
    },

    canUseAbility(player, abilityId, tileId = null) {
        const def = getTacticalAbility(abilityId);
        if (!def) return { ok: false, reason: 'Unknown ability.' };
        const cd = this.getAbilityCooldownRemaining(player, abilityId);
        if (cd > 0) return { ok: false, reason: `On cooldown.` };
        if (def.cost && (player.warbandStats?.command ?? 0) < def.cost)
            return { ok: false, reason: `Need ${def.cost} Command.` };
        if (def.targetState && def.targetState !== 'any' && tileId) {
            const tile  = this.getTile(player, tileId);
            const state = tile ? this.controlState(tile) : null;
            if (def.targetState === 'enemy' && state !== 'enemy' && state !== 'contested')
                return { ok: false, reason: 'Must target enemy/contested tile.' };
        }
        return { ok: true };
    },

    useTacticalAbility(player, abilityId, tileId = null) {
        const check = this.canUseAbility(player, abilityId, tileId);
        if (!check.ok) { Log.add(check.reason, 'warning'); return check; }

        const def = getTacticalAbility(abilityId);
        const ws  = player.warbandStats;
        if (!ws.abilityCooldowns) ws.abilityCooldowns = {};
        if (def.cost) ws.command -= def.cost;
        ws.abilityCooldowns[abilityId] = ws.turn ?? 0;

        const tile     = tileId ? this.getTile(player, tileId) : null;
        const typeName = WARBAND_TILE_TYPES[tile?.type]?.label ?? (tile?.type ?? 'area');

        if (def.effect.controlDmg && tile) {
            tile.controlScore   = Math.max(WARBAND_CONTROL.enemyFull, tile.controlScore - def.effect.controlDmg);
            tile.demonStrength  = Math.max(0, (tile.demonStrength || 0) - (def.effect.demonStrengthDmg || 0));
            this.addWarLog(player, `${def.icon} ${def.name} — ${typeName} hit (−${def.effect.controlDmg} ctrl).`, 'danger');
        }
        if (def.effect.controlGain && tile) {
            tile.controlScore = Math.min(WARBAND_CONTROL.playerFull, tile.controlScore + def.effect.controlGain);
            if (def.effect.addTroop) tile.troopCount = Math.min(3, (tile.troopCount || 0) + 1);
            this.addWarLog(player, `${def.icon} ${def.name} — ${typeName} reinforced.`, 'success');
        }
        if (def.effect.stabilizeRift && tile?.type === 'rift' && !tile.stabilized) {
            tile.stabilized = true;
            this.addWarLog(player, `✦ ${typeName} stabilized via ${def.name}.`, 'success');
        }
        if (def.effect.globalFortBoost) {
            ws.globalFortBoost = { level: def.effect.globalFortBoost, expiresTurn: (ws.turn ?? 0) + (def.effect.durationTurns || 3) };
            this.addWarLog(player, `🛡 Iron Shields active — all tiles +${def.effect.globalFortBoost} fort.`, 'success');
        }

        this._propagateUnlocks(this.getMap(player));
        PlayerSystem._recalcStatMaxes();
        Log.add(`Ability: ${def.name}.`, 'success');
        SaveSystem.save();
        return { ok: true };
    },

    _checkGlobalFortBoostExpiry(player) {
        const ws = player.warbandStats;
        if (!ws?.globalFortBoost) return;
        if ((ws.turn ?? 0) >= ws.globalFortBoost.expiresTurn) ws.globalFortBoost = null;
    },

    _getEffectiveFortLevel(player, tile) {
        const base  = tile.fortLevel ?? (tile.fortified ? 1 : 0);
        const boost = player.warbandStats?.globalFortBoost ? player.warbandStats.globalFortBoost.level : 0;
        return Math.min(4, base + boost);
    },

    // ── Player actions ────────────────────────────────────────────────────────
    deployTroops(player, tileId) {
        const tile = this.getTile(player, tileId);
        if (!tile || !tile.unlocked) return { ok: false, reason: 'Tile not accessible.' };
        if (tile.troops !== undefined && tile.troopCount === undefined) { tile.troopCount = tile.troops ? 1 : 0; delete tile.troops; }
        tile.troopCount = tile.troopCount ?? 0;
        const MAX = 3;
        if (tile.troopCount >= MAX) return { ok: false, reason: 'Max troops deployed.' };
        const cost = WARBAND_COSTS.deployTroops;
        const _ws  = player.warbandStats;
        if ((_ws.command ?? 0) < cost) return { ok: false, reason: `Need ${cost} Command.` };
        _ws.command -= cost;
        tile.troopCount++;
        tile.controlScore   = Math.min(WARBAND_CONTROL.playerFull, tile.controlScore + 20);
        tile.demonStrength  = Math.max(0, (tile.demonStrength || 0) - 10);
        this._propagateUnlocks(this.getMap(player));
        PlayerSystem._recalcStatMaxes();
        Log.add(`Troops deployed — control +20.`, 'success');
        SaveSystem.save();
        return { ok: true };
    },

    fortifyTile(player, tileId) {
        const tile = this.getTile(player, tileId);
        if (!tile || !tile.unlocked) return { ok: false, reason: 'Tile not accessible.' };
        if (tile.fortified !== undefined && tile.fortLevel === undefined) { tile.fortLevel = tile.fortified ? 1 : 0; delete tile.fortified; }
        tile.fortLevel = tile.fortLevel ?? 0;
        const MAX = 2;
        if (tile.fortLevel >= MAX) return { ok: false, reason: 'Max fort level.' };
        const support = this.getActiveFactionSupport(player);
        let cost = WARBAND_COSTS.fortify;
        if (support?.effects?.fortifyCostMod) cost = Math.ceil(cost * support.effects.fortifyCostMod);
        const _wsF = player.warbandStats;
        if ((_wsF.command ?? 0) < cost) return { ok: false, reason: `Need ${cost} Command.` };
        _wsF.command -= cost;
        tile.fortLevel++;
        const reductionLabel = tile.fortLevel === 1 ? '50%' : '75%';
        Log.add(`${WARBAND_TILE_TYPES[tile.type]?.label ?? tile.type} fortified lv${tile.fortLevel} — pressure −${reductionLabel}.`, 'success');
        SaveSystem.save();
        return { ok: true };
    },

    stabilizeRift(player, tileId) {
        const tile = this.getTile(player, tileId);
        if (!tile || tile.type !== 'rift' || !tile.unlocked || tile.stabilized)
            return { ok: false, reason: 'Cannot stabilize.' };
        const support = this.getActiveFactionSupport(player);
        let cost = WARBAND_COSTS.stabilizeRift;
        if (support?.effects?.stabilizeCostMod) cost = Math.ceil(cost * support.effects.stabilizeCostMod);
        const _wsS = player.warbandStats;
        if ((_wsS.command ?? 0) < cost) return { ok: false, reason: `Need ${cost} Command.` };
        _wsS.command -= cost;
        tile.stabilized    = true;
        tile.demonStrength = 0;
        Log.add(`Rift stabilized — demon spawns suppressed.`, 'success');
        SaveSystem.save();
        return { ok: true };
    },

    gainInfluenceFromDelve(player, delveTier) {
        const gain = delveTier * 8;
        this._gainInfluence(player, gain);
        Log.add(`+${gain} Influence from delve.`, 'info');
    },

    _gainInfluence(player, amount) {
        if (!amount || amount <= 0) return;
        player.warbandInfluence = (player.warbandInfluence || 0) + amount;
        player.warbandStats.totalInfluenceEarned = (player.warbandStats.totalInfluenceEarned || 0) + amount;
    },

    // ── Rift quests ───────────────────────────────────────────────────────────
    canStartRiftQuest(player, questId) {
        const quest = getWarbandRiftQuest(questId);
        if (!quest) return { ok: false, reason: 'Unknown quest.' };
        if (player.warbandStats?.activeRiftQuest) return { ok: false, reason: 'Quest already active.' };
        const cd = this.getRiftQuestCooldownRemaining(player, questId);
        if (cd > 0) return { ok: false, reason: `Cooldown — ${Math.ceil(cd/60000)}m.` };
        const hasTile = this.getMap(player).some(t => t.type === quest.tileType && t.unlocked);
        if (!hasTile) return { ok: false, reason: `Unlock a ${WARBAND_TILE_TYPES[quest.tileType]?.label} tile first.` };
        return { ok: true };
    },

    startRiftQuest(player, questId) {
        const check = this.canStartRiftQuest(player, questId);
        if (!check.ok) { Log.add(check.reason, 'warning'); return check; }
        const quest = getWarbandRiftQuest(questId);
        player.warbandStats.activeRiftQuest = { questId, endsAt: Date.now() + quest.duration * 1000 };
        Log.add(`Quest started: "${quest.name}".`, 'info');
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

        const success = Math.random() * 100 < 70;
        if (success) {
            const support   = this.getActiveFactionSupport(player);
            const influence = calcQuestInfluence(quest, support);
            const gold      = quest.goldReward.min + Math.floor(Math.random() * (quest.goldReward.max - quest.goldReward.min + 1));
            player.gold += gold;
            player.warbandInfluence = (player.warbandInfluence || 0) + influence;
            player.warbandStats.totalInfluenceEarned = (player.warbandStats.totalInfluenceEarned || 0) + influence;
            player.warbandStats.questsCompleted = (player.warbandStats.questsCompleted || 0) + 1;

            const targets = this.getMap(player).filter(t =>
                t.type === quest.tileType && t.unlocked && this.controlState(t) !== 'player');
            if (targets.length > 0) {
                const target = targets.sort((a,b) => b.controlScore - a.controlScore)[0];
                target.controlScore  = Math.min(WARBAND_CONTROL.playerFull, target.controlScore + (quest.controlGain || 10));
                target.demonStrength = Math.max(0, (target.demonStrength || 0) - 20);
                this._propagateUnlocks(this.getMap(player));
                PlayerSystem._recalcStatMaxes();
            }
            this.addWarLog(player, `Quest complete: "${quest.name}" +${influence} inf +${gold}g.`, 'success');
        } else {
            this.addWarLog(player, `Quest failed: "${quest.name}" — demons gain ground.`, 'warning');
        }
        SaveSystem.save();
        if (typeof Router !== 'undefined' && Router._current === 'warbands') Router._load('warbands');
    },

    // ── Win / Loss ────────────────────────────────────────────────────────────
    checkWinLoss(player) {
        const tiles    = this.getMap(player);
        const heart    = tiles.find(t => t.type === 'heart');
        const rifts    = tiles.filter(t => t.type === 'rift');
        const majors   = tiles.filter(t => ['rift','stronghold','supply'].includes(t.type));

        const heartWin   = heart && this.controlState(heart) === 'player';
        const allMajors  = majors.length > 0 && majors.every(t => this.controlState(t) === 'player');
        const allRifts   = rifts.length > 0  && rifts.every(t => t.stabilized);

        const playerAlive = tiles.some(t => {
            const s = this.controlState(t);
            return s === 'player' || s === 'contested' || s === 'ally_iron' || s === 'ally_ashen';
        });

        return {
            win:  heartWin || allMajors || allRifts,
            loss: !playerAlive && tiles.length > 0,
            winReason: heartWin   ? '♦ Heart of Valdros captured!'
                     : allMajors  ? 'All major tiles secured.'
                     : allRifts   ? 'All rifts stabilized.' : null,
        };
    },

    // ── AI intents ────────────────────────────────────────────────────────────
    getAIIntents(player) { return player?.warbandStats?.aiIntents ?? {}; },

    _setIntent(player, factionId, text) {
        if (!player.warbandStats.aiIntents) player.warbandStats.aiIntents = {};
        player.warbandStats.aiIntents[factionId] = text;
    },

    // ── Territory counts ──────────────────────────────────────────────────────
    getTerritoryStats(player) {
        const tiles = this.getMap(player);
        const s = { player: 0, ally_iron: 0, ally_ashen: 0, enemy: 0, contested: 0 };
        for (const t of tiles) { const k = this.controlState(t); if (k in s) s[k]++; }
        s.total = tiles.length;
        return s;
    },

    // ── Campaign game state ───────────────────────────────────────────────────

    startCountdown(player, durationSec = 900) {
        const ws = player.warbandStats;
        // Generate a fresh map for this run
        player.warbandMap       = this.generateMap(player);
        ws._mapV2               = true;
        ws.gameState            = 'countdown';
        ws.countdownEndsAt      = Date.now() + 15000;
        ws.gameDuration         = durationSec;
        ws.gameEndsAt           = null;
        ws.gameResult           = null;
        ws.warLog               = [];
        ws.demonPhase           = 1;
        ws.activeOrder          = null;
        ws.globalFortBoost      = null;
        ws.orderCooldowns       = {};
        ws.abilityCooldowns     = {};
        ws.aiIntents            = { iron_dominion: null, ashen_covenant: null, void_horde: null };
        ws.totalInfluenceEarned  = 0;
        ws.questsCompleted       = 0;
        ws.command               = 0;
        ws.commandCap            = 300;
        ws.turn                  = 0;
        ws.turnLimit             = 60;
        this.addWarLog(player, '⏳ Campaign begins in 15 seconds. Prepare your forces.', 'info');
        SaveSystem.save();
        return { ok: true };
    },

    beginGame(player) {
        const ws      = player.warbandStats;
        ws.gameState  = 'active';
        ws.gameEndsAt = null;
        ws.turn       = 1;
        // Starting resources — enough for an opening move, not enough to spam
        ws.command    = 80;
        player.warbandInfluence = (player.warbandInfluence || 0) + 30;
        this.addWarLog(player, '⚔ The campaign has begun — capture the Heart of Valdros!', 'success');
        SaveSystem.save();
    },

    endGame(player, result) {
        const ws      = player.warbandStats;
        ws.gameState  = 'ended';
        ws.gameResult = { win: result.win, loss: result.loss, winReason: result.winReason ?? null };
        ws.gameEndsAt = null;
        const endInf  = result.win ? 50 : 10;
        this._gainInfluence(player, endInf);
        const msg = result.win
            ? `⚑ Victory — ${result.winReason || 'Campaign won!'} (+${endInf} Influence)`
            : `☠ Campaign ended. (+${endInf} Influence consolation)`;
        this.addWarLog(player, msg, result.win ? 'success' : 'danger');
        SaveSystem.save();
    },

    resetCampaign(player) {
        const ws              = player.warbandStats;
        ws.gameState          = 'idle';
        ws.countdownEndsAt    = null;
        ws.gameEndsAt         = null;
        ws.gameDuration       = 900;
        ws.gameResult         = null;
        ws.warLog             = [];
        ws.demonPhase         = 1;
        ws.minorWaveTimer     = 0;
        ws.majorWaveTimer     = 0;
        ws.activeOrder        = null;
        ws.globalFortBoost    = null;
        ws.orderCooldowns     = {};
        ws.abilityCooldowns   = {};
        player.warbandMap     = [];
        SaveSystem.save();
    },

    // ── Game loop tick (countdown only — active advances via endPlayerTurn) ──────
    tick() {
        const player = PlayerSystem.current;
        if (!player?.warbandStats) return;
        this._ensureCampaign(player);
        const gs = player.warbandStats.gameState ?? 'idle';
        if (gs === 'idle' || gs === 'ended') return;
        if (gs === 'countdown') {
            if (Date.now() >= (player.warbandStats.countdownEndsAt || 0)) {
                this.beginGame(player);
                if (typeof Router !== 'undefined' && Router._current === 'warbands')
                    Router._load('warbands');
            }
        }
        // gs === 'active': state advances only when player clicks End Turn
    },

    // ── Supply network BFS ────────────────────────────────────────────────────
    // Returns a Set of tile IDs that are supply-connected to the player's anchors.
    // Anchors: outer player-lane tiles (faction base), strongholds, supply nodes.
    _computeSupplyNetwork(player) {
        const tiles   = this.getMap(player);
        const byId    = Object.fromEntries(tiles.map(t => [t.id, t]));
        const anchors = tiles
            .filter(t => {
                if (this.controlState(t) !== 'player') return false;
                return (t.tier === 'outer' && t.lane === 'player') ||
                       t.type === 'stronghold' ||
                       t.type === 'supply';
            })
            .map(t => t.id);

        const connected = new Set(anchors);
        const queue     = [...anchors];
        while (queue.length > 0) {
            const id   = queue.shift();
            const tile = byId[id];
            if (!tile) continue;
            for (const adjId of tile.adjacentIds) {
                if (connected.has(adjId)) continue;
                const adj = byId[adjId];
                if (adj && this.controlState(adj) === 'player') {
                    connected.add(adjId);
                    queue.push(adjId);
                }
            }
        }
        return connected;
    },

    // ── Resource grant at turn start ──────────────────────────────────────────
    // Grants Command (capped) and Influence (persistent) for the coming turn.
    // Formula: base + sqrt-scaled tile income + frontline bonus − upkeep
    _grantTurnResources(player) {
        const tiles       = this.getMap(player);
        const byId        = Object.fromEntries(tiles.map(t => [t.id, t]));
        const ws          = player.warbandStats;
        const playerTiles = tiles.filter(t => this.controlState(t) === 'player');
        const connected   = this._computeSupplyNetwork(player);

        // ── Per-tile income ───────────────────────────────────────────────────
        let rawCmd = 0, rawInf = 0;
        for (const t of playerTiles) {
            let tCmd = WARBAND_TILE_CMD_INCOME[t.type] ?? 0;
            let tInf = WARBAND_TILE_INF_INCOME[t.type] ?? 0.15;
            if (t.isChokepoint) { tCmd += 0.2; tInf += 0.2; }          // chokepoint bonus
            if (t.tier === 'inner') { tCmd += 0.2; tInf += 0.35; }     // center-approach bonus
            if (!connected.has(t.id)) { tCmd *= 0.25; tInf *= 0.5; }   // isolation penalty
            rawCmd += tCmd;
            rawInf += tInf;
        }

        // ── Diminishing returns (sqrt scaling) ────────────────────────────────
        const scaledCmd = rawCmd <= 10 ? rawCmd : 10 + Math.sqrt(rawCmd - 10) * 2.4;
        const scaledInf = rawInf <= 6  ? rawInf  : 6  + Math.sqrt(rawInf  - 6)  * 1.8;

        // ── Base passive income ───────────────────────────────────────────────
        let totalCmd = 1.5 + scaledCmd;
        let totalInf = 0.35 + scaledInf;

        // ── Frontline bonus ───────────────────────────────────────────────────
        const frontlineCount = playerTiles.filter(t =>
            t.adjacentIds.some(id => {
                const nb = byId[id];
                return nb && this.controlState(nb) === 'enemy';
            })
        ).length;
        totalCmd += Math.min(2.5, frontlineCount * 0.15);
        totalInf += Math.min(1.0, frontlineCount * 0.05);

        // ── Upkeep drain ──────────────────────────────────────────────────────
        let upkeep = 0;
        for (const t of playerTiles) {
            upkeep += (t.troopCount ?? 0) * 0.8;   // warband upkeep
            upkeep += (t.fortLevel  ?? 0) * 0.2;   // structure upkeep
        }
        // Overextension penalty: >35% isolated tiles costs extra command
        const isolatedCount = playerTiles.filter(t => !connected.has(t.id)).length;
        if (playerTiles.length > 0 && isolatedCount / playerTiles.length > 0.35) {
            upkeep += isolatedCount * 0.08;
        }

        // ── Apply ─────────────────────────────────────────────────────────────
        const cmdGain = Math.max(1, Math.floor(totalCmd - upkeep));
        const infGain = Math.max(0, Math.floor(totalInf));
        ws.command  = Math.min(ws.commandCap ?? 300, (ws.command ?? 0) + cmdGain);
        ws._lastTurnCommandGain   = cmdGain;
        ws._lastTurnInfluenceGain = infGain;
        if (infGain > 0) this._gainInfluence(player, infGain);
    },

    // ── End player turn → AI acts → new turn begins ───────────────────────────
    endPlayerTurn(player) {
        const ws = player.warbandStats;
        if (ws.gameState !== 'active') return;

        // Advance turn counter
        ws.turn = (ws.turn || 0) + 1;

        // Turn limit check
        if (ws.turn > (ws.turnLimit || 60)) {
            this.endGame(player, { win: false, loss: true, winReason: 'Turn limit reached.' });
            if (typeof Router !== 'undefined' && Router._current === 'warbands') Router._load('warbands');
            return;
        }

        // Expire time-limited effects
        this._checkOrderExpiry(player);
        this._checkGlobalFortBoostExpiry(player);
        this._checkFactionSupportExpiry(player);

        // Run all AI systems
        this._checkPhaseTransition(player);
        this._demonStrongpointEffect(player);
        this._demonTurn(player);
        this._allyTurn(player);
        this._applyHoldingBonus(player);
        this._waveSystem(player);

        // Check win / loss
        const wl = this.checkWinLoss(player);
        if (wl.win || wl.loss) {
            this.endGame(player, wl);
            if (typeof Router !== 'undefined' && Router._current === 'warbands') Router._load('warbands');
            return;
        }

        // Grant command + influence for next player turn
        this._grantTurnResources(player);
        this.addWarLog(player, `— Turn ${ws.turn} —`, 'info');

        SaveSystem.save();
        if (typeof Router !== 'undefined' && Router._current === 'warbands') Router._load('warbands');
    },

    // ── Player holding + attack ───────────────────────────────────────────────
    _applyHoldingBonus(player) {
        const support  = this.getActiveFactionSupport(player);
        const extra    = support?.effects?.holdingBonus || 0;
        const fx       = this._getOrderEffects(player);
        const mult     = fx.playerHoldMult ?? 1.0;
        const tiles    = this.getMap(player);
        const byId     = Object.fromEntries(tiles.map(t => [t.id, t]));
        let changed    = false;

        for (const tile of tiles) {
            const troops = tile.troopCount ?? 0;
            const state  = this.controlState(tile);

            if (state === 'player') {
                // Consolidate: push already-held tiles toward full control
                tile.controlScore = Math.min(WARBAND_CONTROL.playerFull,
                    tile.controlScore + Math.round((2 + extra + troops * 2) * mult));

                // Attack: push into adjacent enemy / contested tiles
                for (const adjId of tile.adjacentIds) {
                    const adj = byId[adjId];
                    if (!adj) continue;
                    const adjState = this.controlState(adj);
                    if (adjState !== 'enemy' && adjState !== 'contested') continue;

                    const push = Math.round((14 + troops * 6 + extra) * mult);
                    adj.controlScore  = Math.min(WARBAND_CONTROL.playerFull, adj.controlScore + push);
                    adj.demonStrength = Math.max(0, (adj.demonStrength || 0) - Math.ceil(push * 0.5));
                    adj.unlocked      = true;

                    if (this.controlState(adj) === 'player') {
                        adj.demonStrength = 0;
                        const typeName  = WARBAND_TILE_TYPES[adj.type]?.label ?? adj.type;
                        const capCost   = WARBAND_CAPTURE_COSTS[adj.type]   ?? { cmd: 0,  inf: 8  };
                        const capRewd   = WARBAND_CAPTURE_REWARDS[adj.type] ?? { cmd: 5,  inf: 4  };
                        const _ws       = player.warbandStats;
                        const cmdNet    = capRewd.cmd - capCost.cmd;
                        const infNet    = capRewd.inf - capCost.inf;
                        _ws.command = Math.min(_ws.commandCap ?? 300,
                            Math.max(0, (_ws.command ?? 0) + cmdNet));
                        if (infNet > 0) this._gainInfluence(player, infNet);
                        else if (infNet < 0)
                            player.warbandInfluence = Math.max(0, (player.warbandInfluence || 0) + infNet);
                        const cmdLbl = cmdNet !== 0 ? ` ${cmdNet > 0 ? '+' : ''}${cmdNet} Cmd` : '';
                        const infLbl = infNet !== 0 ? ` ${infNet > 0 ? '+' : ''}${infNet} Inf` : '';
                        this.addWarLog(player, `⚑ Captured ${typeName} (${adj.tier})${cmdLbl}${infLbl}`, 'success');
                    }
                    changed = true;
                }
            } else if (state === 'contested') {
                // Hold contested tiles even without troops; troops accelerate reclaim
                tile.controlScore = Math.min(WARBAND_CONTROL.playerFull,
                    tile.controlScore + Math.round((3 + extra + troops * 4) * mult));
                changed = true;
            }
        }

        if (changed) { this._propagateUnlocks(tiles); PlayerSystem._recalcStatMaxes(); }
    },

    // ══════════════════════════════════════════════════════════════════════════
    // DEMON AI — 5 behaviors
    // ══════════════════════════════════════════════════════════════════════════

    // Behavior 1: Strongpoints reinforce adjacent demon tiles
    _demonStrongpointEffect(player) {
        const tiles = this.getMap(player);
        const byId  = Object.fromEntries(tiles.map(t => [t.id, t]));
        for (const t of tiles) {
            if (!t.isStrongpoint) continue;
            if (this.controlState(t) !== 'enemy') continue;
            // Regen own strength
            t.demonStrength = Math.min(100, t.demonStrength + t.reinforcementRate * 2);
            // Reinforce adjacent demon tiles
            for (const adjId of t.adjacentIds) {
                const adj = byId[adjId];
                if (adj && this.controlState(adj) === 'enemy') {
                    adj.demonStrength = Math.min(100, adj.demonStrength + t.reinforcementRate);
                }
            }
        }
    },

    // Behavior 2 + 4: Spread into weak territory + retake key tiles
    _demonTurn(player) {
        const tiles    = this.getMap(player);
        const byId     = Object.fromEntries(tiles.map(t => [t.id, t]));
        const fx       = this._getOrderEffects(player);
        const phaseDef = this.getPhase(player);
        const pmult    = (fx.enemyPressureMult ?? 1.0) * (phaseDef?.pressureMult ?? 1.0);
        const smult    = phaseDef?.spreadMult ?? 1.0;
        let changed    = false;

        // Demon pressure tick: regen strength on demon tiles
        for (const t of tiles) {
            if (this.controlState(t) !== 'enemy') continue;
            const zd = t.demonZone ? getDemonZone(t.demonZone) : null;
            const regenMult = (zd?.regenMult ?? 1.0) * (phaseDef?.strengthScaleMult ?? 1.0);
            t.demonStrength = Math.min(100, t.demonStrength + Math.ceil(t.reinforcementRate * regenMult));
        }

        for (const t of tiles) {
            if (this.controlState(t) !== 'enemy') continue;
            const zd         = t.demonZone ? getDemonZone(t.demonZone) : null;
            const zonePMult  = (zd?.pressureMult ?? 1.0) * (zd?.spreadMult ?? 1.0);
            const typePressure = WARBAND_TILE_TYPES[t.type]?.pressurePerTick ?? 1;

            // Score each adjacent non-enemy tile as an attack target
            const targets = t.adjacentIds
                .map(id => byId[id])
                .filter(adj => adj && this.controlState(adj) !== 'enemy')
                .map(adj => {
                    const state    = this.controlState(adj);
                    const adjFort  = this._getEffectiveFortLevel(player, adj);
                    const troops   = adj.troopCount ?? 0;
                    let score = 50;
                    // Behavior 4: prioritize recently-captured or key tiles
                    if (state === 'player' && adj.tier === 'inner') score += 30;
                    if (state === 'player' && adj.tier === 'mid')   score += 15;
                    if (adj.type === 'rift' && !adj.stabilized)     score += 20;
                    if (adj.type === 'stronghold')                   score += 10;
                    // Punish overextension: isolated player tiles (few friendly neighbors)
                    const friendlyNeighbors = adj.adjacentIds.filter(id => {
                        const nb = byId[id];
                        return nb && this.controlState(nb) === state;
                    }).length;
                    if (friendlyNeighbors <= 1) score += 15;
                    // Defense penalty: avoid well-defended tiles unless strongpoint
                    score -= adjFort * 10;
                    score -= troops  * 8;
                    if (t.isStrongpoint) score += 20; // strongpoints ignore penalties
                    return { adj, score };
                })
                .sort((a,b) => b.score - a.score);

            if (targets.length === 0) continue;
            const best = targets[0].adj;
            const bestState = this.controlState(best);

            // Apply damage to target
            const bestFort    = this._getEffectiveFortLevel(player, best);
            const fortReduce  = bestFort >= 4 ? 0.10 : bestFort >= 3 ? 0.15 : bestFort === 2 ? 0.25 : bestFort === 1 ? 0.50 : 1.0;
            const troopReduce = Math.max(0.55, 1.0 - (best.troopCount ?? 0) * 0.15);
            // Chokepoints resist pressure: 30% reduction (40% for collapsed_routes)
            const modId      = player.warbandStats?.mapModifier;
            const chokePct   = best.isChokepoint ? (modId === 'collapsed_routes' ? 0.60 : 0.70) : 1.0;
            const spread      = Math.max(1, Math.ceil(
                (typePressure + t.difficulty) * fortReduce * troopReduce * pmult * zonePMult * smult * chokePct
            ));

            if (bestState === 'ally_iron' || bestState === 'ally_ashen') {
                // Attack ally tile
                best.allyStrength -= spread;
                best.battleIntensity = Math.min(3, (best.battleIntensity || 0) + 1);
                changed = true;
                if (best.allyStrength <= 0) {
                    const allyDef  = WARBAND_ALLY_FACTIONS[best.allyFaction];
                    const typeName = WARBAND_TILE_TYPES[best.type]?.label ?? best.type;
                    this.addWarLog(player, `☠ Void Horde drove ${allyDef?.name ?? best.allyFaction} from ${typeName}!`, 'danger');
                    best.allyFaction  = null;
                    best.allyStrength = 0;
                    best.controlScore = WARBAND_CONTROL.enemyFull;
                    best.demonStrength = t.baseStrength;
                }
            } else {
                // Attack player / contested tile
                best.controlScore = Math.max(WARBAND_CONTROL.enemyFull, best.controlScore - spread);
                best.battleIntensity = Math.min(3, (best.battleIntensity || 0) + 1);
                changed = true;

                if (this.controlState(best) === 'enemy') {
                    const typeName = WARBAND_TILE_TYPES[best.type]?.label ?? best.type;
                    best.troopCount    = 0;
                    best.fortLevel     = 0;
                    best.demonStrength = best.baseStrength;
                    this.addWarLog(player, `☠ Void Horde reclaimed ${typeName}!`, 'danger');
                }
            }

            // Behavior 3: Player-held tiles receive baseline pressure from all nearby demon tiles
            for (const tile of tiles) {
                if (this.controlState(tile) !== 'player') continue;
                const hasDemonNeighbor = tile.adjacentIds.some(id => {
                    const nb = byId[id];
                    return nb && this.controlState(nb) === 'enemy';
                });
                if (!hasDemonNeighbor) continue;
                const tFort   = this._getEffectiveFortLevel(player, tile);
                const fMult   = tFort >= 4 ? 0.10 : tFort >= 3 ? 0.15 : tFort === 2 ? 0.25 : tFort === 1 ? 0.50 : 1.0;
                const tMult   = Math.max(0.55, 1.0 - (tile.troopCount ?? 0) * 0.15);
                const typeDef = WARBAND_TILE_TYPES[tile.type] || {};
                const cpMult  = tile.isChokepoint ? (modId === 'collapsed_routes' ? 0.60 : 0.70) : 1.0;
                let pressure  = (typeDef.pressurePerTick ?? 1) + tile.difficulty;
                if (tile.type === 'rift' && !tile.stabilized) pressure += 2;
                pressure = Math.max(1, Math.ceil(pressure * fMult * tMult * pmult * cpMult));
                tile.controlScore = Math.max(WARBAND_CONTROL.enemyFull, tile.controlScore - pressure);
                if (this.controlState(tile) === 'enemy') {
                    tile.troopCount    = 0;
                    tile.fortLevel     = 0;
                    tile.demonStrength = tile.baseStrength;
                    this.addWarLog(player, `☠ ${WARBAND_TILE_TYPES[tile.type]?.label ?? tile.type} fell to demons!`, 'danger');
                    Log.add(`Enemy reclaimed ${WARBAND_TILE_TYPES[tile.type]?.label ?? tile.type}!`, 'danger');
                }
                changed = true;
            }
        }

        // Decay battle intensity
        for (const t of tiles) {
            if ((t.battleIntensity || 0) > 0) t.battleIntensity = Math.max(0, t.battleIntensity - 1);
        }

        if (changed) { this._propagateUnlocks(tiles); PlayerSystem._recalcStatMaxes(); SaveSystem.save(); }

        // Update demon intent
        const phase = this.computePhase(player);
        const intentTexts = {
            1: 'Holding corrupted territory',
            2: 'Probing for weak flanks',
            3: 'Erupting toward center',
        };
        this._setIntent(player, 'void_horde', intentTexts[phase] ?? 'Advancing');
    },

    // Behavior 5: Wave attacks (every 3 turns minor, every 8 turns major)
    _waveSystem(player) {
        const ws        = player.warbandStats;
        const phaseDef  = this.getPhase(player);
        const intensity = phaseDef?.waveIntensity ?? 1;
        const turn      = ws.turn ?? 0;

        if (turn > 0 && turn % 3 === 0) this._launchWave(player, 'minor', intensity);
        if (turn > 0 && turn % 8 === 0) this._launchWave(player, 'major', intensity);
    },

    _launchWave(player, type, intensityMult) {
        const tiles  = this.getMap(player);
        const byId   = Object.fromEntries(tiles.map(t => [t.id, t]));
        const isMajor = type === 'major';

        // Pick wave sources: infernal zones, strongpoints, or inner-ring demon tiles
        const sources = tiles.filter(t =>
            this.controlState(t) === 'enemy' &&
            (t.demonZone === 'infernal' || t.isStrongpoint || t.tier === 'inner' || t.tier === 'center')
        );
        if (sources.length === 0) return;

        const wavePower = Math.ceil((isMajor ? 25 : 12) * intensityMult);
        const targets   = isMajor ? sources : sources.slice(0, Math.ceil(sources.length / 2));
        let   hit       = 0;

        for (const src of targets) {
            const adjNonEnemy = src.adjacentIds
                .map(id => byId[id])
                .filter(adj => adj && this.controlState(adj) !== 'enemy');

            for (const adj of adjNonEnemy) {
                const adjState = this.controlState(adj);
                if (adjState === 'ally_iron' || adjState === 'ally_ashen') {
                    adj.allyStrength = Math.max(0, adj.allyStrength - wavePower * 0.7);
                    if (adj.allyStrength <= 0) {
                        const allyDef  = WARBAND_ALLY_FACTIONS[adj.allyFaction];
                        const typeName = WARBAND_TILE_TYPES[adj.type]?.label ?? adj.type;
                        this.addWarLog(player, `🌊 Wave overwhelmed ${allyDef?.name}'s ${typeName}!`, 'danger');
                        adj.allyFaction  = null;
                        adj.allyStrength = 0;
                        adj.controlScore = WARBAND_CONTROL.enemyFull;
                        adj.demonStrength = adj.baseStrength;
                    }
                } else {
                    adj.controlScore = Math.max(WARBAND_CONTROL.enemyFull, adj.controlScore - wavePower);
                    adj.battleIntensity = 3;
                    if (this.controlState(adj) === 'enemy') {
                        adj.troopCount    = 0;
                        adj.fortLevel     = 0;
                        adj.demonStrength = adj.baseStrength;
                        this.addWarLog(player, `🌊 Wave overran ${WARBAND_TILE_TYPES[adj.type]?.label ?? adj.type}!`, 'danger');
                    }
                }
                hit++;
            }
        }

        if (hit > 0) {
            const label = isMajor ? '⚠ Major Demon Offensive' : '↑ Demon Incursion';
            this.addWarLog(player, `${label} — ${hit} front${hit > 1 ? 's' : ''} hit.`, 'danger');
            if (isMajor) Log.add(`Major demon offensive underway!`, 'danger');
            // Surviving the wave grants Influence
            if (tiles.some(t => this.controlState(t) === 'player')) {
                const _waveInf = isMajor ? 10 : 3;
                this._gainInfluence(player, _waveInf);
                this.addWarLog(player, `⚑ Wave survived — +${_waveInf} Influence.`, 'info');
            }
            this._propagateUnlocks(tiles);
            PlayerSystem._recalcStatMaxes();
            SaveSystem.save();
        }
    },

    // ══════════════════════════════════════════════════════════════════════════
    // FACTION AI — doctrine-driven
    // ══════════════════════════════════════════════════════════════════════════

    _allyTurn(player) {
        const tiles       = this.getMap(player);
        const byId        = Object.fromEntries(tiles.map(t => [t.id, t]));
        const fx          = this._getOrderEffects(player);
        const activeOrder = this.getActiveOrder(player);
        const phase       = this.computePhase(player);
        let   changed     = false;

        for (const [factionId, faction] of Object.entries(WARBAND_ALLY_FACTIONS)) {
            const allyTiles = tiles.filter(t => t.allyFaction === factionId);
            if (allyTiles.length === 0) continue;

            const attackMult = fx.allyAttackMult ?? 1.0;
            const defMult    = fx.allyDefMult    ?? 1.0;

            // Regen: defensive faction regens faster
            for (const tile of allyTiles) {
                const regenAmt = Math.round(faction.defenseRegen * defMult);
                tile.allyStrength = Math.min(100, tile.allyStrength + regenAmt);
            }

            // Pick best attack target using doctrine scoring
            const allFrontier = allyTiles.flatMap(tile =>
                tile.adjacentIds
                    .map(id => byId[id])
                    .filter(adj => adj && this.controlState(adj) === 'enemy')
                    .map(adj => ({ from: tile, adj }))
            );
            if (allFrontier.length === 0) {
                this._setIntent(player, factionId, 'Holding territory');
                continue;
            }

            // Score each target
            const scored = allFrontier.map(({ from, adj }) => {
                const tierDef    = getTierDef(adj.tier);
                let score = tierDef.routeScore;
                // Doctrine type bonuses
                score += (faction.typeBonus?.[adj.type] ?? 0);
                // Risk: don't attack tiles above riskThreshold unless focused or phase 3
                const riskLimit = faction.doctrine === 'expansionist' ? 88 : 65;
                const effectiveRisk = riskLimit + (phase >= 3 ? 15 : 0);
                if ((adj.demonStrength || 0) > effectiveRisk) score -= 40;
                // Check if another faction is racing for this tile
                const contested = allFrontier.filter(f => f.adj.id === adj.id).length > 1;
                if (contested) score += 10;  // race bonus
                // Focused assault bonus
                if (activeOrder && fx.allyFocusMult && activeOrder.targetTileId === adj.id) score += 80;
                return { from, adj, score };
            }).sort((a,b) => b.score - a.score);

            if (scored.length === 0) continue;
            const best = scored[0];

            // Apply attack
            const focusBonus = (activeOrder && fx.allyFocusMult && activeOrder.targetTileId === best.adj.id)
                ? (fx.allyFocusMult - 1) * faction.attackPerTick : 0;
            const power = Math.round((faction.attackPerTick + focusBonus) * attackMult);

            best.adj.controlScore += power;
            best.adj.demonStrength = Math.max(0, (best.adj.demonStrength || 0) - power * 0.5);
            best.adj.battleIntensity = Math.min(3, (best.adj.battleIntensity || 0) + 1);
            changed = true;

            // Capture
            if (best.adj.controlScore >= WARBAND_CONTROL.playerThresh) {
                const typeName = WARBAND_TILE_TYPES[best.adj.type]?.label ?? best.adj.type;
                const tierLabel = best.adj.tier;
                best.adj.allyFaction  = factionId;
                best.adj.allyStrength = 65;
                best.adj.controlScore = 0;
                best.adj.demonStrength = 0;
                this.addWarLog(player, `${faction.icon} ${faction.name} seized ${typeName} (${tierLabel})!`, 'ally');

                // Defensive doctrine: fortify after capture
                if (faction.doctrine === 'defensive' && !best.adj.fortLevel) {
                    best.adj.fortLevel = 1;
                }
                changed = true;
            }

            // Update intent
            const targetName = WARBAND_TILE_TYPES[best.adj.type]?.label ?? best.adj.type;
            const tierLabel  = best.adj.tier;
            const intentVerb = faction.doctrine === 'expansionist' ? 'Assaulting' : 'Advancing on';
            this._setIntent(player, factionId, `${intentVerb} ${tierLabel} ${targetName}`);
        }

        // Decay battle intensity
        for (const t of tiles) {
            if ((t.battleIntensity || 0) > 0) t.battleIntensity = Math.max(0, t.battleIntensity - 1);
        }

        if (changed) { this._propagateUnlocks(tiles); PlayerSystem._recalcStatMaxes(); }
    },

    // ── Bonus queries ─────────────────────────────────────────────────────────
    _countByState(player, type, state = 'player') {
        return this.getMap(player).filter(t => t.type === type && this.controlState(t) === state).length;
    },
    getStrongholdHealthBonus(player) {
        player = player || PlayerSystem.current;
        return player ? this._countByState(player, 'stronghold') * 10 : 0;
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
