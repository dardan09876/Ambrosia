// js/delves/delveEngine.js
// Resolves an entire delve run upfront into playback records.
// Nothing here touches the live player — it only reads from it.

const DelveEngine = {

    // ── Entry point ───────────────────────────────────────────────────────────
    // Returns { runSnapshot, playbackRecords } without modifying the player.
    resolveRun(delveId, player) {
        const delveDef = getDelveType(delveId);
        if (!delveDef) return null;

        const doctrine = DelveDecisionAI.getDoctrine(player);
        const nodes    = DelveGenerator.generate(delveId);
        const snapshot = this._buildSnapshot(player);

        const records = [];
        let   skipNextCombat = false;

        for (const node of nodes) {
            // Retreat check (not on entrance/reward)
            if (node.type !== 'entrance' && node.type !== 'reward') {
                if (DelveDecisionAI.shouldRetreat(snapshot, doctrine)) {
                    records.push(this._buildRetreatRecord(snapshot, node.index));
                    break;
                }
            }

            let record = null;

            switch (node.type) {
                case 'entrance':
                    record = this._resolveEntrance(node, delveDef, snapshot, doctrine);
                    break;
                case 'event':
                    record = this._resolveEvent(node, snapshot, doctrine);
                    break;
                case 'combat':
                    if (skipNextCombat) {
                        skipNextCombat = false;
                        record = this._buildSkippedCombatRecord(node);
                    } else {
                        record = this._resolveCombat(node, snapshot, doctrine);
                    }
                    break;
                case 'loot':
                    record = this._resolveLoot(node, delveDef, snapshot);
                    break;
                case 'boss':
                    record = this._resolveBoss(node, delveDef, snapshot, doctrine);
                    break;
                case 'reward':
                    record = this._resolveReward(node, delveDef, snapshot);
                    break;
            }

            if (!record) continue;

            // Apply outcome to snapshot
            this._applyRecord(record, snapshot);
            if (record.outcome?.skipNextCombat) skipNextCombat = true;

            records.push(record);

            if (snapshot.health <= 0) {
                records.push(this._buildDeathRecord(snapshot, node.index));
                break;
            }
        }

        const died = snapshot.health <= 0;
        const retreated = !died && records.length > 0 && records[records.length - 1].nodeType === 'retreat';

        const runSnapshot = {
            delveId,
            doctrine,
            delveName:      delveDef.name,
            result:         died ? 'death' : (retreated ? 'retreat' : 'success'),
            finalHealth:    Math.max(0, snapshot.health),
            goldFound:      snapshot.goldFound,
            materialsFound: snapshot.materialsFound,
            itemsFound:     snapshot.itemsFound,
            xpFound:        snapshot.xpFound,
            rounds:         records.length,
        };

        return { runSnapshot, playbackRecords: records };
    },

    // ── Player snapshot (read-only copy of live stats) ────────────────────────
    _buildSnapshot(player) {
        const equipStats = (typeof EquipSystem !== 'undefined') ? EquipSystem.getTotalStats() : { totalDamage: 0, totalDefense: 0 };
        const maxHp      = PlayerSystem.getStatMax('health');
        const maxMp      = PlayerSystem.getStatMax('mana');
        const maxSp      = PlayerSystem.getStatMax('stamina');

        return {
            name:           player.name,
            health:         player.stats.health.value,
            maxHealth:      maxHp,
            mana:           player.stats.mana.value,
            maxMana:        maxMp,
            stamina:        player.stats.stamina.value,
            maxStamina:     maxSp,
            skills:         Object.assign({}, player.skills),
            equipDamage:    equipStats.totalDamage  || 0,
            equipDefense:   equipStats.totalDefense || 0,
            goldFound:      0,
            materialsFound: [],
            itemsFound:     [],
            xpFound:        0,
        };
    },

    // ── Entrance ──────────────────────────────────────────────────────────────
    _resolveEntrance(node, delveDef, snapshot, doctrine) {
        return {
            nodeIndex:  node.index,
            nodeType:   'entrance',
            title:      node.title,
            icon:       '🚪',
            logLines:   [
                `You step into the ${delveDef.name}.`,
                `The air ahead carries the taste of old power.`,
                `Doctrine: ${DelveDecisionAI.doctrineLabel(doctrine)}.`,
                `Your instincts take over. Move forward.`,
            ],
            outcome:    { survived: true },
            playerAfter: this._snapStats(snapshot),
        };
    },

    // ── Event ─────────────────────────────────────────────────────────────────
    _resolveEvent(node, snapshot, doctrine) {
        const ev = node.eventId ? getDelveEvent(node.eventId) : pickDelveEvent(node.pool || 'minor');
        if (!ev) return null;

        const skillVal = snapshot.skills[ev.skillCheck] || 0;
        const success  = skillVal >= ev.threshold;
        const logLines = [
            ev.description,
            ...(success ? ev.successLog : ev.failureLog),
        ];

        const effect = success ? ev.successEffect : ev.failureEffect;

        return {
            nodeIndex:  node.index,
            nodeType:   'event',
            eventType:  ev.type,
            title:      ev.name,
            icon:       ev.type === 'hazard' ? '⚠' : '◈',
            logLines,
            outcome:    { survived: true, success, effect, skillCheck: { skill: ev.skillCheck, value: skillVal, threshold: ev.threshold } },
            playerAfter: this._snapStats(snapshot),
        };
    },

    // ── Combat ────────────────────────────────────────────────────────────────
    _resolveCombat(node, snapshot, doctrine) {
        const enemy = getDelveEnemy(node.enemyId);
        if (!enemy) return null;

        const { damageTaken, victory, xp, logLines } = this._simulateCombat(snapshot, enemy, doctrine, false);

        return {
            nodeIndex:  node.index,
            nodeType:   'combat',
            elite:      node.elite || false,
            title:      enemy.name + (node.elite ? ' ★' : ''),
            icon:       node.elite ? '⚔★' : '⚔',
            logLines,
            outcome:    { survived: victory, damageTaken, victory, xp, enemyName: enemy.name },
            playerAfter: this._snapStats(snapshot),
        };
    },

    // ── Boss ──────────────────────────────────────────────────────────────────
    _resolveBoss(node, delveDef, snapshot, doctrine) {
        const boss = getDelveBoss(node.bossId || delveDef.bossId);
        if (!boss) return null;

        const { damageTaken, victory, xp, logLines } = this._simulateCombat(snapshot, boss, doctrine, true);

        return {
            nodeIndex:  node.index,
            nodeType:   'boss',
            title:      boss.name,
            icon:       '👑',
            logLines:   [boss.intro, ...logLines],
            outcome:    { survived: victory, damageTaken, victory, xp, bossName: boss.name, bossLoot: boss.loot || [] },
            playerAfter: this._snapStats(snapshot),
        };
    },

    // ── Loot ──────────────────────────────────────────────────────────────────
    _resolveLoot(node, delveDef, snapshot) {
        const tier   = delveDef.lootTier || 2;
        const gold   = tier * 25 + Math.floor(Math.random() * tier * 20);
        const mat    = pickDelveMaterial(Math.ceil(tier / 2));
        const hasItem = Math.random() < 0.50;

        let item = null;
        if (hasItem && typeof getItemsByTier !== 'undefined') {
            const pool = getItemsByTier(tier);
            if (pool.length > 0) {
                const base = pool[Math.floor(Math.random() * pool.length)];
                item = typeof getItem !== 'undefined' ? getItem(base.id) : null;
                if (item) item.uid = Date.now() * 10000 + Math.floor(Math.random() * 10000);
            }
        }

        const logLines = [
            'You pry open a cache hidden beneath collapsed stonework.',
            `${gold} gold glints in the darkness.`,
            `You recover ${mat.amount}× ${mat.id.replace(/_/g,' ')}.`,
        ];
        if (item) logLines.push(`A ${item.name} lies wrapped in cloth — worth keeping.`);

        return {
            nodeIndex:  node.index,
            nodeType:   'loot',
            title:      node.title || 'Hidden Cache',
            icon:       '💰',
            logLines,
            outcome:    { survived: true, gold, material: mat, item },
            playerAfter: this._snapStats(snapshot),
        };
    },

    // ── Reward ────────────────────────────────────────────────────────────────
    _resolveReward(node, delveDef, snapshot) {
        const gold  = delveDef.tier * 60 + Math.floor(Math.random() * 40);
        const mats  = [pickDelveMaterial(delveDef.tier), pickDelveMaterial(delveDef.tier)];
        const chest = { tier: delveDef.lootTier, name: `Tier ${delveDef.lootTier} Chest` };

        const logLines = [
            'You emerge from the depths into a sealed chamber.',
            'Spoils of the run — enough to make the risk worthwhile.',
            `Completion reward: ${gold}g, ${chest.name}, and rare materials.`,
            `The way back opens. You leave the ${delveDef.name} behind.`,
        ];

        return {
            nodeIndex:  node.index,
            nodeType:   'reward',
            title:      'Reward Chamber',
            icon:       '🎁',
            logLines,
            outcome:    { survived: true, gold, materials: mats, chest },
            playerAfter: this._snapStats(snapshot),
        };
    },

    // ── Special records ───────────────────────────────────────────────────────
    _buildRetreatRecord(snapshot, nodeIndex) {
        const hpPct = Math.round((snapshot.health / snapshot.maxHealth) * 100);
        return {
            nodeIndex,
            nodeType:   'retreat',
            title:      'Strategic Retreat',
            icon:       '🏃',
            logLines:   [
                `Health critical at ${hpPct}%.`,
                'Your doctrine demands survival over glory.',
                'You turn back through the path you carved.',
                'The delve is abandoned. Live to fight again.',
            ],
            outcome:    { survived: true, retreat: true },
            playerAfter: this._snapStats(snapshot),
        };
    },

    _buildDeathRecord(snapshot, nodeIndex) {
        return {
            nodeIndex,
            nodeType:   'death',
            title:      'Fallen',
            icon:       '💀',
            logLines:   [
                'Your strength fails.',
                'The darkness takes you.',
                'You are dragged back to the surface, barely breathing.',
            ],
            outcome:    { survived: false, death: true },
            playerAfter: this._snapStats(snapshot),
        };
    },

    _buildSkippedCombatRecord(node) {
        return {
            nodeIndex:  node.index,
            nodeType:   'combat',
            title:      node.title,
            icon:       '💨',
            logLines:   [
                'Your earlier manoeuvre pays off.',
                'You slip past the patrol unseen.',
                'The enemy never knows you were here.',
            ],
            outcome:    { survived: true, skipped: true, damageTaken: 0, victory: true },
            playerAfter: null,
        };
    },

    // ── Combat simulation ─────────────────────────────────────────────────────
    _simulateCombat(snapshot, enemy, doctrine, isBoss) {
        const playerAtk  = this._playerAttack(snapshot);
        const playerDef  = this._playerDefense(snapshot);
        const enemyAtk   = Math.max(1, enemy.attack - Math.floor(playerDef * 0.35));
        const enemyHpMax = enemy.health;

        let playerHp = snapshot.health;
        let enemyHp  = enemyHpMax;
        let rounds   = 0;
        const maxRounds = isBoss ? 30 : 15;

        while (playerHp > 0 && enemyHp > 0 && rounds < maxRounds) {
            const pDmg = Math.max(1, playerAtk + Math.floor((Math.random() - 0.5) * playerAtk * 0.4));
            const eDmg = Math.max(1, enemyAtk + Math.floor((Math.random() - 0.5) * enemyAtk * 0.4));
            enemyHp  -= pDmg;
            playerHp -= eDmg;
            rounds++;
        }

        const victory     = enemyHp <= 0 || (isBoss && playerHp > 0);
        const damageTaken = Math.max(0, snapshot.health - Math.max(1, playerHp));
        const xp          = Math.floor(enemy.xp * (isBoss ? 1.5 : 1));

        return {
            damageTaken,
            victory,
            xp,
            logLines: this._combatLog(snapshot, enemy, doctrine, victory, damageTaken, isBoss),
        };
    },

    _playerAttack(snapshot) {
        const sk = snapshot.skills;
        const base = Math.max(
            (sk.melee   || 0) * 0.6,
            (sk.ranged  || 0) * 0.6,
            (sk.magic   || 0) * 0.6,
        );
        return Math.floor(base + (snapshot.equipDamage || 0) * 0.4 + 5);
    },

    _playerDefense(snapshot) {
        return Math.floor((snapshot.skills.defense || 0) * 0.4 + (snapshot.equipDefense || 0) * 0.5);
    },

    // ── Combat log generation ─────────────────────────────────────────────────
    _combatLog(snapshot, enemy, doctrine, victory, damageTaken, isBoss) {
        const style   = DelveDecisionAI.leadAbility(snapshot);
        const name    = snapshot.name;
        const eName   = enemy.name;
        const damagePct = damageTaken / snapshot.maxHealth;

        const openings = {
            melee:   [`${name} charges — the opening strike lands clean.`, `Steel meets demon-flesh. The fight is already decided.`],
            ranged:  [`${name} opens from distance, picking gaps in its guard.`, `A volley of precise shots finds every weakness.`],
            magic:   [`${name} calls up a bolt of arcane force — it detonates centre-mass.`, `Rift energy crackles from ${name}'s hands.`],
            support: [`${name} holds ground and fights conservatively, waiting for openings.`, `Measured strikes. Patient pressure.`],
        };
        const midFight = [
            `The ${eName} presses hard — ${damagePct > 0.3 ? 'the hits are brutal' : 'you absorb most of it'}.`,
            `${name} ${doctrine === 'aggressive' ? 'refuses to fall back' : 'adjusts position'}.`,
            `The ground shakes with each exchange.`,
        ];
        const finishers = victory
            ? [`The ${eName} falls.`, `Victory, at a cost of ${damageTaken} damage taken.`]
            : [`The ${eName} does not fall.`, `${name} is forced to pull back, badly hurt.`];

        const pool = openings[style] || openings.melee;
        const lines = [
            isBoss ? `The encounter with the ${eName} begins.` : `A ${eName} blocks the path.`,
            pool[Math.floor(Math.random() * pool.length)],
            midFight[Math.floor(Math.random() * midFight.length)],
        ];

        if (isBoss && enemy.beats) {
            const numBeats = Math.min(3, enemy.beats.length);
            for (let i = 0; i < numBeats; i++) {
                lines.push(enemy.beats[Math.floor(Math.random() * enemy.beats.length)]);
            }
        }

        lines.push(...finishers);
        return lines;
    },

    // ── Apply a record's outcome to the mutable snapshot ─────────────────────
    _applyRecord(record, snapshot) {
        const out = record.outcome;
        if (!out) return;

        if (out.damageTaken)  snapshot.health  = Math.max(0, snapshot.health  - out.damageTaken);
        if (out.xp)           snapshot.xpFound = (snapshot.xpFound || 0) + out.xp;
        if (out.gold)         snapshot.goldFound = (snapshot.goldFound || 0) + out.gold;
        if (out.materials) {
            for (const m of out.materials) snapshot.materialsFound.push(m);
        }
        if (out.material)     snapshot.materialsFound.push(out.material);
        if (out.item)         snapshot.itemsFound.push(out.item);
        if (out.chest)        snapshot.itemsFound.push({ _isChest: true, ...out.chest });
        if (out.bossLoot) {
            for (const id of out.bossLoot) snapshot.materialsFound.push({ id, amount: 1 });
        }

        // Event effects
        if (out.effect) {
            const eff = out.effect;
            if (eff.type === 'heal')    snapshot.health  = Math.min(snapshot.maxHealth,  snapshot.health  + Math.floor(snapshot.maxHealth  * eff.amount));
            if (eff.type === 'mana')    snapshot.mana    = Math.min(snapshot.maxMana,    snapshot.mana    + Math.floor(snapshot.maxMana    * eff.amount));
            if (eff.type === 'stamina') snapshot.stamina = Math.min(snapshot.maxStamina, snapshot.stamina + Math.floor(snapshot.maxStamina * eff.amount));
            if (eff.type === 'damage')  snapshot.health  = Math.max(0, snapshot.health  - Math.floor(snapshot.maxHealth  * eff.amount));
            if (eff.type === 'damageAndCorruption') {
                snapshot.health  = Math.max(0, snapshot.health  - Math.floor(snapshot.maxHealth  * eff.damage));
                snapshot._pendingCorruption = (snapshot._pendingCorruption || 0) + eff.corruption;
            }
            if (eff.type === 'material') snapshot.materialsFound.push({ id: eff.id, amount: eff.amount });
            if (eff.type === 'skipNextCombat') out.skipNextCombat = true;
        }

        record.playerAfter = this._snapStats(snapshot);
    },

    _snapStats(snapshot) {
        return { health: snapshot.health, maxHealth: snapshot.maxHealth, mana: snapshot.mana, maxMana: snapshot.maxMana };
    },
};
