// js/delves/delveGridEngine.js
// Grid generation, movement logic, and all combat/tile resolution for
// the interactive Rift Delve system.

const DelveGridEngine = {

    W: 10,
    H: 10,

    // ── Tile icons (rendered in grid cells) ──────────────────────────────────
    TILE_ICONS: {
        empty:    '·',
        enemy:    '⚔',
        elite:    '★',
        treasure: '◈',
        shrine:   '✦',
        event:    '?',
        hazard:   '⚠',
        boss:     '☠',
        cleared:  '·',
    },

    TILE_LABELS: {
        empty:    'Empty',
        enemy:    'Enemy',
        elite:    'Elite Enemy',
        treasure: 'Treasure',
        shrine:   'Shrine',
        event:    'Event',
        hazard:   'Hazard',
        boss:     'Boss',
    },

    // Weighted tile distribution (excludes player start and boss — placed manually)
    TILE_WEIGHTS: [
        { type: 'empty',    weight: 30 },
        { type: 'enemy',    weight: 30 },
        { type: 'event',    weight: 10 },
        { type: 'treasure', weight: 10 },
        { type: 'shrine',   weight:  8 },
        { type: 'elite',    weight:  7 },
        { type: 'hazard',   weight:  5 },
    ],

    ROLE_LABELS: {
        bruiser:    'Bruiser',
        tank:       'Tank',
        skirmisher: 'Skirmisher',
        corruptor:  'Corruptor',
        leech:      'Leech',
    },

    // ── Grid generation ───────────────────────────────────────────────────────

    generateGrid(delveDef) {
        const W = this.W, H = this.H;
        const grid = [];

        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                grid.push({
                    x, y,
                    type:     'empty',
                    revealed:  false,
                    visited:   false,
                    cleared:   false,
                    enemyId:   null,
                    event:     null,
                    hazard:    null,
                });
            }
        }

        const startX = 0;
        const startY = Math.floor(H / 2);
        const bossX  = W - 1;
        const bossY  = Math.floor(H / 2);

        // Player start — empty + revealed
        this._tile(grid, startX, startY).type    = 'empty';
        this._tile(grid, startX, startY).visited  = true;
        this._tile(grid, startX, startY).revealed = true;

        // Boss tile
        this._tile(grid, bossX, bossY).type = 'boss';

        // Safe zone around start (x ≤ 1)
        for (let y = 0; y < H; y++) {
            for (let x = 0; x <= 1; x++) {
                if (x === startX && y === startY) continue;
                this._tile(grid, x, y).type = 'empty';
            }
        }

        // Fill remaining tiles with weighted random
        const enemyPool = delveDef.enemyPool || [];
        const elitePool = delveDef.elitePool || [];

        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                const t = this._tile(grid, x, y);
                if (t.type !== 'empty' || (x === startX && y === startY)) continue;
                if (x <= 1) continue; // safe zone already set

                t.type = this._weightedRandom(this.TILE_WEIGHTS);

                if (t.type === 'enemy' && enemyPool.length) {
                    t.enemyId = enemyPool[Math.floor(Math.random() * enemyPool.length)];
                } else if (t.type === 'elite') {
                    if (elitePool.length) {
                        t.enemyId = elitePool[Math.floor(Math.random() * elitePool.length)];
                    } else if (enemyPool.length) {
                        t.enemyId = enemyPool[Math.floor(Math.random() * enemyPool.length)];
                    }
                } else if (t.type === 'event') {
                    t.event = pickDelveTileEvent();
                } else if (t.type === 'hazard') {
                    t.hazard = pickDelveHazard();
                }
            }
        }

        // Reveal start + immediate neighbours
        this._revealAround(grid, startX, startY);

        return grid;
    },

    _tile(grid, x, y) {
        return grid[y * this.W + x];
    },

    _weightedRandom(table) {
        const total = table.reduce((s, e) => s + e.weight, 0);
        let roll = Math.random() * total;
        for (const e of table) {
            roll -= e.weight;
            if (roll <= 0) return e.type;
        }
        return table[0].type;
    },

    _revealAround(grid, x, y) {
        const dirs = [
            { dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
            { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
        ];
        for (const { dx, dy } of dirs) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < this.W && ny >= 0 && ny < this.H) {
                this._tile(grid, nx, ny).revealed = true;
            }
        }
    },

    // ── Movement ──────────────────────────────────────────────────────────────

    // Returns valid move positions adjacent to pos (4-directional, in-bounds)
    getValidMoves(grid, pos) {
        const dirs = [
            { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
            { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
        ];
        const moves = [];
        for (const { dx, dy } of dirs) {
            const nx = pos.x + dx, ny = pos.y + dy;
            if (nx >= 0 && nx < this.W && ny >= 0 && ny < this.H) {
                moves.push({ x: nx, y: ny });
            }
        }
        return moves;
    },

    // ── Corruption scaling ────────────────────────────────────────────────────

    // Corruption gained per turn (scales with time spent in the delve)
    corruptionGain(turn) {
        return 1 + Math.floor(turn / 5);
    },

    // ── Player stats ──────────────────────────────────────────────────────────

    buildPlayerStats(player) {
        const equip = (typeof EquipSystem !== 'undefined')
            ? EquipSystem.getTotalStats()
            : { totalDamage: 0, totalDefense: 0 };

        const sk = player.skills || {};
        const primarySkill = Math.max(sk.melee || 0, sk.ranged || 0, sk.magic || 0);

        const attack  = Math.max(5,  Math.floor(primarySkill * 0.25 + (equip.totalDamage  || 0)));
        const defense = Math.max(0,  Math.floor((sk.defense || 0) * 0.15 + (equip.totalDefense || 0)));
        const power   = Math.max(0,  Math.floor(primarySkill * 0.08 + (sk.magic || 0) * 0.04));

        return { attack, defense, power };
    },

    // ── Enemy role modifiers ──────────────────────────────────────────────────

    // Returns a shallow copy of the enemy with role-specific stat adjustments
    applyRoleModifiers(enemy) {
        const e = Object.assign({}, enemy);
        switch (e.role) {
            case 'bruiser':
                e.attack  = Math.floor(e.attack  * 1.35);
                e.defense = Math.floor(e.defense * 0.7);
                break;
            case 'tank':
                e.health  = Math.floor(e.health  * 1.5);
                e.defense = Math.floor(e.defense * 1.35);
                e.attack  = Math.floor(e.attack  * 0.85);
                break;
            // skirmisher, corruptor, leech — stat-neutral; handled in combat resolution
        }
        return e;
    },

    // ── Combat formulas ───────────────────────────────────────────────────────

    calcPlayerDamage(attack, enemy) {
        const base     = Math.max(1, attack - Math.floor(enemy.defense * 0.5));
        const variance = Math.max(1, Math.floor(base * 0.15));
        return base + Math.floor((Math.random() * 2 - 1) * variance);
    },

    calcEnemyDamage(enemy, defense) {
        const base     = Math.max(1, enemy.attack - Math.floor(defense * 0.6));
        const variance = Math.max(1, Math.floor(base * 0.15));
        return base + Math.floor((Math.random() * 2 - 1) * variance);
    },

    // Retreat success chance (clamped 10–90%)
    calcRetreatChance(enemy, gainedCorruption) {
        const levelPenalty  = (enemy.level || 1) * 0.05;
        const corrPenalty   = gainedCorruption * 0.002;
        const rolePenalty   = enemy.role === 'skirmisher' ? 0.20 : 0;
        const chance = 0.60 - levelPenalty - corrPenalty - rolePenalty;
        return Math.max(0.10, Math.min(0.90, chance));
    },

    // ── Tile resolution (called when player steps onto a tile) ────────────────

    // Returns a result object describing what happened. Does NOT mutate DelveState directly.
    resolveTile(tile, delveDef) {
        // Boss: enters combat (handled separately — boss is always a fight)
        if (tile.type === 'boss') {
            const boss = getDelveBoss(delveDef.bossId);
            if (!boss) return { type: 'empty', log: 'An empty chamber at the rift\'s heart.' };
            return {
                type:  'boss',
                boss:  Object.assign({}, boss),
                log:   boss.intro,
            };
        }

        // Enemy or elite: enters combat
        if (tile.type === 'enemy' || tile.type === 'elite') {
            const def   = getDelveEnemy(tile.enemyId);
            if (!def) return { type: 'empty', log: 'The threat has already passed.' };
            const enemy = this.applyRoleModifiers(def);
            return {
                type:  'enemy',
                enemy,
                log:   `A ${enemy.name} blocks the path.${enemy.role ? ` [${this.ROLE_LABELS[enemy.role] || enemy.role}]` : ''}`,
            };
        }

        // Treasure
        if (tile.type === 'treasure') {
            const tier      = delveDef.tier || 1;
            const gold      = tier * 20 + Math.floor(Math.random() * tier * 30);
            const mat       = pickDelveMaterial(tier);
            const shards    = Math.random() < 0.45 ? (1 + Math.floor(Math.random() * (delveDef.riftShardBonus || 1))) : 0;
            return {
                type:   'treasure',
                gold,
                material: mat,
                riftShards: shards,
                log: `You find a hidden cache: ${gold}g, ${mat.amount}× ${mat.id.replace(/_/g,' ')}${shards > 0 ? `, ${shards} rift shard${shards !== 1 ? 's' : ''}` : ''}.`,
            };
        }

        // Shrine
        if (tile.type === 'shrine') {
            return {
                type: 'shrine',
                log:  'A shrine pulses with restorative energy. Interact to heal.',
            };
        }

        // Event
        if (tile.type === 'event') {
            const ev     = tile.event || pickDelveTileEvent();
            const player = PlayerSystem.current;
            const sk     = player?.skills || {};
            const skill  = ev.check?.skill || 'melee';
            const val    = sk[skill] || 0;
            const passed = val >= (ev.check?.threshold || 0);
            const eff    = passed ? ev.onSuccess : ev.onFail;
            return {
                type:   'event',
                event:  ev,
                passed,
                effect: eff,
                log:    `${ev.name}: ${ev.desc} — ${eff?.log || (passed ? 'Success.' : 'No effect.')}`,
            };
        }

        // Hazard
        if (tile.type === 'hazard') {
            const hz = tile.hazard || pickDelveHazard();
            return {
                type:    'hazard',
                hazard:  hz,
                log:     `${hz.name}: ${hz.log}`,
            };
        }

        // Empty (or already visited and cleared)
        const msgs = [
            'The path is quiet here.',
            'Nothing stirs in this section of the rift.',
            'The corridor holds only shadows.',
            'Dust and silence.',
        ];
        return {
            type: 'empty',
            log:  msgs[Math.floor(Math.random() * msgs.length)],
        };
    },

    // ── Shrine interaction ────────────────────────────────────────────────────

    useShrine(playerHp, playerMaxHp) {
        const healed = Math.floor(playerMaxHp * 0.25);
        return {
            newHp: Math.min(playerMaxHp, playerHp + healed),
            healed,
            log: `The shrine restores ${healed} HP.`,
        };
    },

    // ── Treasure loot for boss ────────────────────────────────────────────────

    generateBossLoot(delveDef) {
        const tier   = delveDef.tier || 1;
        const gold   = tier * 80 + Math.floor(Math.random() * 60);
        const mats   = [pickDelveMaterial(tier), pickDelveMaterial(tier)];
        const shards = (delveDef.riftShardBonus || 1) * 4 + Math.floor(Math.random() * 4);
        const chest  = {
            _isChest: true,
            tier:     delveDef.lootTier || tier,
            name:     (typeof CHEST_DEFS !== 'undefined' && CHEST_DEFS[delveDef.lootTier]?.name)
                        || `Tier ${delveDef.lootTier || tier} Chest`,
        };
        return { gold, materials: mats, riftShards: shards, chest };
    },
};
