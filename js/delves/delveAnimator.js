// js/delves/delveAnimator.js
// Canvas-based dungeon animation engine.
// Draws room backgrounds, a player sprite, enemy sprites, particles, and effects.
// showRecord(record) triggers the animation sequence for the current playback node.

const DelveAnimator = {
    canvas: null,
    ctx:    null,
    _rAF:   null,
    _paused:     false,
    _speedMult:  1.0,

    // ── Visual state ──────────────────────────────────────────────────────────
    vs: {
        roomType: 'entrance',

        // Character
        charX:        150,
        charTargetX:  150,
        charState:    'idle',  // idle | walk | attack | hurt | victory | dead
        charFrame:    0,
        charFrameMs:  0,
        charAtkOff:   0,
        charFlashMs:  0,

        // Enemy
        enemyVisible: false,
        enemyType:    'humanoid',
        enemyX:       500,
        enemyTargetX: 500,
        enemyState:   'idle',
        enemyFrame:   0,
        enemyFrameMs: 0,
        enemyAtkOff:  0,
        enemyFlashMs: 0,
        enemyHpPct:   1.0,
        enemyDeadT:   0,
        isBoss:       false,

        // Room props
        chestOpen:       false,
        eventGlowAlpha:  0,
        eventGlowRgb:    [80, 200, 120],

        // Effects
        fadeAlpha:   0,
        particles:   [],

        _lastTs: 0,
    },

    // ── Animation phases ──────────────────────────────────────────────────────
    _phases:   [],
    _phaseIdx: 0,
    _phaseMs:  0,

    // ── Public API ────────────────────────────────────────────────────────────

    init(canvasEl) {
        if (this._rAF) cancelAnimationFrame(this._rAF);
        this.canvas = canvasEl;
        this.ctx    = canvasEl.getContext('2d');

        // Resize to CSS layout width
        const rect = canvasEl.getBoundingClientRect();
        if (rect.width > 0) {
            canvasEl.width  = Math.floor(rect.width);
            canvasEl.height = canvasEl.height || 240;
        }

        // Reset state
        const vs = this.vs;
        vs.charX = 150; vs.charTargetX = 150; vs.charState = 'idle';
        vs.enemyVisible = false; vs.fadeAlpha = 1; vs.particles = [];
        vs.isBoss = false; vs.chestOpen = false;
        vs.eventGlowAlpha = 0; vs._lastTs = 0;
        this._phases = []; this._phaseIdx = 0; this._phaseMs = 0;
        this._paused = false;

        this._rAF = requestAnimationFrame(ts => this._loop(ts));
    },

    destroy() {
        if (this._rAF) cancelAnimationFrame(this._rAF);
        this._rAF = null; this.canvas = null; this.ctx = null;
    },

    setSpeed(n)  { this._speedMult = n; },
    pause()      { this._paused = true; },
    resume()     { this._paused = false; },

    showRecord(record) {
        this._phases   = this._buildPhases(record);
        this._phaseIdx = 0;
        this._phaseMs  = 0;
        if (this._phases[0]) this._phases[0].enter?.();
    },

    // ── Phase builder ─────────────────────────────────────────────────────────

    _buildPhases(record) {
        const vs   = this.vs;
        const type = record.nodeType;
        const B    = 900 / this._speedMult;      // ~1 sec baseline unit
        const W    = this.canvas?.width  || 700;
        const H    = this.canvas?.height || 240;
        const FLOOR_Y = H - 52;

        const spawnHit = (x, color, n) => this._spawnParticles(x, FLOOR_Y - 30, color, n);

        const enterEnemy = (eType, isBoss) => {
            vs.enemyVisible  = true;
            vs.enemyType     = eType;
            vs.enemyX        = W + 80;
            vs.enemyTargetX  = W * 0.72;
            vs.enemyState    = 'walk';
            vs.enemyHpPct    = 1.0;
            vs.enemyDeadT    = 0;
            vs.isBoss        = !!isBoss;
        };

        switch (type) {

            case 'entrance':
                return [
                    { dur: B * 0.1, enter: () => {
                        vs.roomType = 'entrance'; vs.charX = -70; vs.charTargetX = W * 0.22;
                        vs.charState = 'walk'; vs.fadeAlpha = 1; vs.enemyVisible = false;
                    }},
                    { dur: B * 0.7, enter: () => {} },
                    { dur: B * 0.4, enter: () => { vs.charState = 'idle'; } },
                ];

            case 'event': {
                const hazard  = record.eventType === 'hazard';
                const success = record.outcome?.success !== false;
                return [
                    { dur: B * 0.1, enter: () => {
                        vs.roomType = 'event'; vs.charX = -70; vs.charTargetX = W * 0.26;
                        vs.charState = 'walk'; vs.fadeAlpha = 0.9; vs.enemyVisible = false;
                        vs.chestOpen = false; vs.eventGlowAlpha = 0;
                    }},
                    { dur: B * 0.55, enter: () => { vs.charState = 'idle'; } },
                    { dur: B * 0.40, enter: () => {
                        vs.eventGlowAlpha  = 0.9;
                        vs.eventGlowRgb    = hazard ? [220, 60, 60] : [80, 200, 120];
                    }},
                    { dur: B * 0.50, enter: () => {
                        if (success) { spawnHit(W * 0.52, hazard ? '#ff8844' : '#88ff88', 14); }
                        else         { vs.charFlashMs = 500; spawnHit(W * 0.44, '#ff4444', 10); }
                    }},
                    { dur: B * 0.50, enter: () => { vs.eventGlowAlpha = 0; } },
                ];
            }

            case 'combat':
            case 'boss': {
                const isBoss  = type === 'boss';
                const victory = record.outcome?.victory !== false;
                const dmg     = record.outcome?.damageTaken || 0;
                const eType   = this._classifyEnemy(record);

                const phases = [
                    { dur: B * 0.1, enter: () => {
                        vs.roomType = isBoss ? 'boss' : 'combat';
                        vs.charX = W * 0.20; vs.charTargetX = W * 0.20;
                        vs.charState = 'idle'; vs.fadeAlpha = 0.85;
                        enterEnemy(eType, isBoss);
                    }},
                    { dur: B * 0.55, enter: () => { vs.enemyState = 'idle'; } },

                    // Player attack 1
                    { dur: B * 0.28, enter: () => {
                        vs.charState = 'attack'; vs.charAtkOff = W * 0.10;
                        vs.enemyFlashMs = 320; vs.enemyHpPct = 0.62;
                        spawnHit(W * 0.56, '#ff8844', 7);
                    }},
                    { dur: B * 0.22, enter: () => { vs.charAtkOff = 0; vs.charState = 'idle'; } },

                    // Enemy attack 1
                    { dur: B * 0.28, enter: () => {
                        if (dmg > 0) {
                            vs.enemyState = 'attack'; vs.enemyAtkOff = -(W * 0.10);
                            vs.charFlashMs = 320; spawnHit(W * 0.30, '#ff4444', 6);
                        }
                    }},
                    { dur: B * 0.22, enter: () => { vs.enemyAtkOff = 0; vs.enemyState = 'idle'; } },

                    // Player attack 2
                    { dur: B * 0.28, enter: () => {
                        vs.charState = 'attack'; vs.charAtkOff = W * 0.12;
                        vs.enemyFlashMs = 380; vs.enemyHpPct = 0.22;
                        spawnHit(W * 0.60, '#ff8844', 9);
                    }},
                    { dur: B * 0.22, enter: () => { vs.charAtkOff = 0; vs.charState = 'idle'; } },
                ];

                // Boss gets extra rounds
                if (isBoss) {
                    phases.push(
                        { dur: B*0.28, enter: () => { vs.enemyState='attack'; vs.enemyAtkOff=-(W*0.12); vs.charFlashMs=420; spawnHit(W*0.27,'#cc2222',9); }},
                        { dur: B*0.22, enter: () => { vs.enemyAtkOff=0; vs.enemyState='idle'; } },
                        { dur: B*0.28, enter: () => { vs.charState='attack'; vs.charAtkOff=W*0.14; vs.enemyFlashMs=420; vs.enemyHpPct=0.05; spawnHit(W*0.62,'#ff8844',11); }},
                        { dur: B*0.22, enter: () => { vs.charAtkOff=0; vs.charState='idle'; } }
                    );
                }

                // Outcome
                if (victory) {
                    phases.push(
                        { dur: B*0.18, enter: () => { vs.enemyState='dead'; this._spawnParticles(vs.enemyTargetX, FLOOR_Y-35, isBoss?'#ffaa22':'#ff6644', isBoss?26:15); }},
                        { dur: B*0.50, enter: () => { vs.charState='victory'; } },
                        { dur: B*0.35, enter: () => { vs.enemyVisible=false; vs.charState='idle'; } }
                    );
                } else {
                    phases.push(
                        { dur: B*0.35, enter: () => { vs.charState='hurt'; vs.charFlashMs=700; } },
                        { dur: B*0.55, enter: () => {} }
                    );
                }
                return phases;
            }

            case 'loot':
                return [
                    { dur: B*0.1, enter: () => {
                        vs.roomType='loot'; vs.charX=-70; vs.charTargetX=W*0.27;
                        vs.charState='walk'; vs.fadeAlpha=0.85; vs.enemyVisible=false; vs.chestOpen=false;
                    }},
                    { dur: B*0.55, enter: () => { vs.charState='idle'; } },
                    { dur: B*0.30, enter: () => { vs.chestOpen=true; this._spawnParticles(W*0.50, FLOOR_Y-12, '#e8c84a', 20); } },
                    { dur: B*0.55, enter: () => {} },
                ];

            case 'reward':
                return [
                    { dur: B*0.1, enter: () => {
                        vs.roomType='reward'; vs.charX=W*0.27; vs.charTargetX=W*0.27;
                        vs.charState='victory'; vs.fadeAlpha=0.6; vs.enemyVisible=false;
                        this._spawnParticles(W*0.5, 55, '#e8c84a', 26);
                    }},
                    { dur: B*0.9, enter: () => { vs.charState='idle'; } },
                ];

            case 'retreat':
                return [
                    { dur: B*0.25, enter: () => { vs.charState='hurt'; vs.charFlashMs=600; } },
                    { dur: B*0.70, enter: () => { vs.charState='walk'; vs.charTargetX=-120; } },
                    { dur: B*0.35, enter: () => {} },
                ];

            case 'death':
                return [
                    { dur: B*0.25, enter: () => { vs.charState='dead'; vs.charFlashMs=900; } },
                    { dur: B*0.90, enter: () => {} },
                ];

            default:
                return [{ dur: B*0.9, enter: () => {} }];
        }
    },

    _classifyEnemy(record) {
        if (record.nodeType === 'boss') return 'boss';
        const n = (record.outcome?.enemyName || record.title || '').toLowerCase();
        if (n.includes('hound') || n.includes('crawler') || n.includes('beast')) return 'beast';
        if (n.includes('wraith') || n.includes('shade') || n.includes('echo'))   return 'spirit';
        if (n.includes('imp')    || n.includes('cultist'))                        return 'small';
        return 'humanoid';
    },

    // ── rAF loop ──────────────────────────────────────────────────────────────

    _loop(ts) {
        if (!this.canvas) return;
        this._rAF = requestAnimationFrame(t => this._loop(t));

        const dt = this._paused ? 0 : Math.min(66, ts - (this.vs._lastTs || ts));
        this.vs._lastTs = ts;

        this._update(ts, dt);
        this._render(ts);
    },

    _update(ts, dt) {
        const vs = this.vs;

        // Phase advance
        if (this._phases.length > 0 && this._phaseIdx < this._phases.length) {
            this._phaseMs += dt;
            const phase = this._phases[this._phaseIdx];
            if (this._phaseMs >= phase.dur) {
                this._phaseMs -= phase.dur;
                this._phaseIdx++;
                if (this._phaseIdx < this._phases.length) {
                    this._phases[this._phaseIdx].enter?.();
                }
            }
        }

        const spd = this._speedMult;

        // Character X lerp
        vs.charX += (vs.charTargetX - vs.charX) * Math.min(1, dt * 0.012 * spd);

        // Enemy X lerp
        if (vs.enemyState !== 'dead') {
            vs.enemyX += (vs.enemyTargetX - vs.enemyX) * Math.min(1, dt * 0.010 * spd);
        }

        // Walk frames
        vs.charFrameMs  += dt; if (vs.charFrameMs  > 140) { vs.charFrameMs  = 0; vs.charFrame  = 1 - vs.charFrame; }
        vs.enemyFrameMs += dt; if (vs.enemyFrameMs > 190) { vs.enemyFrameMs = 0; vs.enemyFrame = 1 - vs.enemyFrame; }

        // Flash timers
        if (vs.charFlashMs  > 0) vs.charFlashMs  = Math.max(0, vs.charFlashMs  - dt);
        if (vs.enemyFlashMs > 0) vs.enemyFlashMs = Math.max(0, vs.enemyFlashMs - dt);

        // Attack offsets spring back
        vs.charAtkOff  *= Math.max(0, 1 - dt * 0.018);
        vs.enemyAtkOff *= Math.max(0, 1 - dt * 0.018);

        // Fade alpha
        if (vs.fadeAlpha     > 0) vs.fadeAlpha     = Math.max(0, vs.fadeAlpha     - dt * 0.0035 * spd);
        if (vs.eventGlowAlpha > 0) vs.eventGlowAlpha = Math.max(0, vs.eventGlowAlpha - dt * 0.0006 * spd);

        // Enemy dead fall
        if (vs.enemyState === 'dead') {
            vs.enemyDeadT = Math.min(1, vs.enemyDeadT + dt * 0.003 * spd);
        }

        // Particles
        for (const p of vs.particles) {
            p.x += p.vx; p.y += p.vy; p.vy += 0.14; p.life -= dt * 0.045;
        }
        vs.particles = vs.particles.filter(p => p.life > 0);
    },

    // ── Render ────────────────────────────────────────────────────────────────

    _render(ts) {
        const ctx = this.ctx;
        const W   = this.canvas.width;
        const H   = this.canvas.height;
        const vs  = this.vs;

        // Keep canvas pixel size in sync with CSS layout
        const rect = this.canvas.getBoundingClientRect();
        if (rect.width > 1 && Math.abs(rect.width - W) > 2) {
            this.canvas.width  = Math.floor(rect.width);
            this.canvas.height = Math.floor(rect.height);
            return;
        }

        ctx.clearRect(0, 0, W, H);

        this._drawRoom(ctx, W, H, ts, vs);

        // Enemy behind player when dead
        if (vs.enemyVisible && vs.enemyState === 'dead') this._drawEnemy(ctx, W, H, ts, vs);

        this._drawCharacter(ctx, W, H, ts, vs);

        // Enemy alive in front
        if (vs.enemyVisible && vs.enemyState !== 'dead') this._drawEnemy(ctx, W, H, ts, vs);

        // Enemy HP bar
        if (vs.enemyVisible && vs.enemyState !== 'dead' && vs.enemyHpPct < 1) {
            const bx = vs.enemyX - 36;
            const by = H - 46;
            ctx.fillStyle = '#1a0808'; ctx.fillRect(bx, by, 72, 7);
            ctx.fillStyle = '#c04040'; ctx.fillRect(bx, by, 72 * vs.enemyHpPct, 7);
            ctx.strokeStyle = '#2a0808'; ctx.lineWidth = 1; ctx.strokeRect(bx, by, 72, 7);
        }

        // Particles
        ctx.save();
        for (const p of vs.particles) {
            ctx.globalAlpha = Math.max(0, p.life / 28);
            ctx.fillStyle   = p.color;
            ctx.fillRect(p.x - p.size * 0.5, p.y - p.size * 0.5, p.size, p.size);
        }
        ctx.restore();

        // Fade overlay
        if (vs.fadeAlpha > 0.01) {
            ctx.fillStyle = `rgba(0,0,0,${vs.fadeAlpha})`;
            ctx.fillRect(0, 0, W, H);
        }

        // Event glow overlay
        if (vs.eventGlowAlpha > 0.01) {
            const [r, g, b] = vs.eventGlowRgb;
            ctx.fillStyle = `rgba(${r},${g},${b},${vs.eventGlowAlpha * 0.30})`;
            ctx.fillRect(0, 0, W, H);
        }

        // Boss dramatic pulse
        if (vs.isBoss && vs.enemyVisible && vs.enemyState !== 'dead') {
            const gr = 0.40 + Math.sin(ts * 0.0014) * 0.22;
            const bg = ctx.createRadialGradient(vs.enemyX, H * 0.5, 10, vs.enemyX, H * 0.5, 130);
            bg.addColorStop(0, `rgba(160,0,60,${gr * 0.32})`);
            bg.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
        }
    },

    // ── Room background ───────────────────────────────────────────────────────

    _drawRoom(ctx, W, H, ts, vs) {
        const CEIL  = 30;
        const FLOOR = H - 52;

        const THEMES = {
            entrance: { bg:'#05080e', wall:'#0d1520', floor:'#090f18', line:'#142236' },
            event:    { bg:'#060a10', wall:'#101828', floor:'#0b1220', line:'#1a2c40' },
            combat:   { bg:'#0a0508', wall:'#180a0e', floor:'#100a0d', line:'#281016' },
            loot:     { bg:'#050a07', wall:'#0e1810', floor:'#0a1210', line:'#163020' },
            boss:     { bg:'#060408', wall:'#160818', floor:'#0c060e', line:'#240838' },
            reward:   { bg:'#070706', wall:'#181408', floor:'#120f04', line:'#28200a' },
        };
        const T = THEMES[vs.roomType] || THEMES.entrance;

        // Background
        ctx.fillStyle = T.bg;   ctx.fillRect(0, 0, W, H);
        // Ceiling
        ctx.fillStyle = T.wall; ctx.fillRect(0, 0, W, CEIL);
        // Floor
        ctx.fillStyle = T.floor; ctx.fillRect(0, FLOOR, W, H - FLOOR);

        // Stone lines
        ctx.strokeStyle = T.line; ctx.lineWidth = 0.7;
        for (let x = 0; x < W; x += 54) { ctx.beginPath(); ctx.moveTo(x, 0);     ctx.lineTo(x, CEIL);  ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(0, 16); ctx.lineTo(W, 16); ctx.stroke();
        for (let x = 0; x < W; x += 44) { ctx.beginPath(); ctx.moveTo(x, FLOOR); ctx.lineTo(x, H);     ctx.stroke(); }
        for (let y = FLOOR; y < H; y += 26) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y);      ctx.stroke(); }

        // Torches
        this._drawTorch(ctx, W * 0.12, CEIL, ts * 0.003,        T.line);
        this._drawTorch(ctx, W * 0.88, CEIL, ts * 0.0034 + 1.5, T.line);

        // Room props
        if (vs.roomType === 'loot')   { this._drawChest(ctx,  W * 0.50, FLOOR, vs.chestOpen); }
        if (vs.roomType === 'event')  { this._drawShrine(ctx, W * 0.52, FLOOR, vs.eventGlowRgb, vs.eventGlowAlpha); }
        if (vs.roomType === 'boss')   {
            // Rift crack
            ctx.strokeStyle = `rgba(150,0,200,${0.35 + Math.sin(ts*0.002)*0.15})`; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(W*.47,FLOOR+5); ctx.lineTo(W*.50,FLOOR+28); ctx.lineTo(W*.52,FLOOR+14); ctx.lineTo(W*.54,FLOOR+34); ctx.stroke();
            // Purple ambient haze
            const pg = ctx.createRadialGradient(W*.66, FLOOR, 20, W*.66, FLOOR, 170);
            pg.addColorStop(0, `rgba(90,0,140,${0.16+Math.sin(ts*.0012)*.05})`);
            pg.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = pg; ctx.fillRect(0, 0, W, H);
        }
        if (vs.roomType === 'reward') {
            // Golden floor glow
            const rg = ctx.createRadialGradient(W*.5, FLOOR, 5, W*.5, FLOOR, 140);
            rg.addColorStop(0, 'rgba(210,165,25,0.20)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
        }
    },

    _drawTorch(ctx, x, ceilY, phase, wallColor) {
        ctx.fillStyle = wallColor;
        ctx.fillRect(x - 3, ceilY + 2, 6, 10);
        ctx.fillRect(x - 5, ceilY,     10,  5);

        const fl = 0.75 + Math.sin(phase) * 0.25;

        const g = ctx.createRadialGradient(x, ceilY - 3, 1, x, ceilY - 3, 34 * fl);
        g.addColorStop(0, `rgba(255,145,15,${fl * 0.48})`);
        g.addColorStop(.5, `rgba(255,75,8,${fl * 0.18})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(x, ceilY - 3, 34*fl, 34*fl, 0, 0, Math.PI*2); ctx.fill();

        ctx.fillStyle = `rgba(255,${Math.floor(105*fl)},12,${0.68+fl*0.32})`;
        ctx.beginPath(); ctx.moveTo(x-4,ceilY+2); ctx.quadraticCurveTo(x-5,ceilY-6,x,ceilY-14*fl); ctx.quadraticCurveTo(x+5,ceilY-6,x+4,ceilY+2); ctx.fill();
        ctx.fillStyle = `rgba(255,210,55,${0.55+fl*0.35})`;
        ctx.beginPath(); ctx.moveTo(x-2,ceilY+1); ctx.quadraticCurveTo(x-2,ceilY-5,x,ceilY-9*fl); ctx.quadraticCurveTo(x+2,ceilY-5,x+2,ceilY+1); ctx.fill();
    },

    _drawShrine(ctx, x, floorY, rgb, glowA) {
        const [r, g, b] = rgb;
        ctx.fillStyle = '#1c1c2a'; ctx.fillRect(x-20, floorY-10, 40, 10);
        ctx.fillStyle = '#161622'; ctx.fillRect(x-13, floorY-28, 26, 18);
        ctx.fillStyle = '#121220'; ctx.fillRect(x-8,  floorY-44, 16, 16);

        if (glowA > 0.02) {
            const eg = ctx.createRadialGradient(x, floorY-52, 2, x, floorY-52, 36);
            eg.addColorStop(0, `rgba(${r},${g},${b},${glowA*0.65})`);
            eg.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = eg;
            ctx.beginPath(); ctx.ellipse(x, floorY-52, 36, 36, 0, 0, Math.PI*2); ctx.fill();
        }

        ctx.fillStyle = `rgba(${r},${g},${b},${0.55 + glowA*0.45})`;
        ctx.beginPath();
        ctx.moveTo(x, floorY-62); ctx.lineTo(x-7, floorY-50); ctx.lineTo(x, floorY-44); ctx.lineTo(x+7, floorY-50);
        ctx.closePath(); ctx.fill();
    },

    _drawChest(ctx, x, floorY, open) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath(); ctx.ellipse(x, floorY+2, 22, 5, 0, 0, Math.PI*2); ctx.fill();

        ctx.fillStyle = '#5a3a18'; ctx.fillRect(x-20, floorY-17, 40, 17);
        ctx.fillStyle = '#a07820'; ctx.fillRect(x-20, floorY-10, 40,  3);
        ctx.fillStyle = '#a07820'; ctx.fillRect(x-2,  floorY-17,  4, 17);

        ctx.save();
        ctx.translate(x, floorY - 17);
        ctx.rotate(open ? -Math.PI * 0.65 : 0);
        ctx.fillStyle = '#7a4a22'; ctx.fillRect(-20, -10, 40, 10);
        ctx.fillStyle = '#c09030'; ctx.fillRect(-20,  -4, 40,  3);
        ctx.restore();

        ctx.fillStyle = '#c09030'; ctx.fillRect(x-4, floorY-14, 8, 7);
        ctx.fillStyle = '#5a3a18'; ctx.fillRect(x-2, floorY-12, 4, 5);
    },

    // ── Character sprite ──────────────────────────────────────────────────────

    _drawCharacter(ctx, W, H, ts, vs) {
        const FLOOR = H - 52;
        const cx    = Math.round(vs.charX + vs.charAtkOff);
        const st    = vs.charState;

        const flash = vs.charFlashMs > 0 && Math.floor(vs.charFlashMs / 85) % 2 === 0;

        ctx.save();
        ctx.translate(cx, FLOOR);

        if (st === 'dead') { ctx.rotate(Math.PI * 0.5); ctx.globalAlpha = 0.65; }
        if (flash) ctx.globalAlpha = (ctx.globalAlpha || 1) * 0.20;

        const bob = (st === 'walk') ? (vs.charFrame === 0 ? -1 : 1) : 0;
        ctx.translate(0, bob);

        this._drawPlayerSprite(ctx, vs.charFrame, st);
        ctx.restore();
    },

    _drawPlayerSprite(ctx, fr, st) {
        const la = (st === 'walk') ? (fr === 0 ? 5 : -5) : 0;
        const vy = (st === 'victory');

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.38)';
        ctx.beginPath(); ctx.ellipse(0, 2, 13, 4, 0, 0, Math.PI*2); ctx.fill();

        // Back leg
        ctx.fillStyle = '#38465a';
        ctx.fillRect(2, -18, 8, 14-la);
        ctx.fillRect(1, -4-la, 9, 5);

        // Cape
        ctx.fillStyle = '#1a2030';
        ctx.beginPath(); ctx.moveTo(-5,-22); ctx.lineTo(-14,-1); ctx.lineTo(-7,-1); ctx.lineTo(-3,-18); ctx.fill();

        // Body
        ctx.fillStyle = '#4a5e78'; ctx.fillRect(-9,-22,18,20);
        ctx.fillStyle = '#5a7090'; ctx.fillRect(-8,-21, 8, 3);
        ctx.fillStyle = '#5a7090'; ctx.fillRect(-8,-16, 4, 2);

        // Pauldrons
        ctx.fillStyle = '#3a4e68';
        ctx.fillRect(-13,-22, 6, 8);
        ctx.fillRect( 7, -22, 6, 8);

        // Front leg
        ctx.fillStyle = '#38465a';
        ctx.fillRect(-10,-18, 8, 14+la);
        ctx.fillRect(-11, -4+la, 10, 5);

        // Neck
        ctx.fillStyle = '#e0c8a0'; ctx.fillRect(-3,-28, 6, 6);

        // Helmet
        ctx.fillStyle = '#3a4e68'; ctx.fillRect(-8,-42,16,16);
        ctx.fillStyle = '#2a3a50'; ctx.fillRect(-8,-42,16, 4);

        // Visor
        ctx.fillStyle = '#e8c84a'; ctx.fillRect(-5,-35,10, 3);

        // Crest
        ctx.fillStyle = '#c84848'; ctx.fillRect(-2,-46, 4, 6);

        // Shield
        ctx.fillStyle = '#2a3a50'; ctx.fillRect(-15,-20, 5,14);
        ctx.fillStyle = '#e8c84a'; ctx.fillRect(-15,-14, 5, 2);

        // Sword
        const sY = vy ? -54 : -40;
        ctx.fillStyle = '#ccd8e8'; ctx.fillRect(9, sY, 3, 28 + (vy ? 14 : 0));
        ctx.fillStyle = '#e8c84a'; ctx.fillRect(6, vy ? -36 : -24, 9, 3);
    },

    // ── Enemy sprites ─────────────────────────────────────────────────────────

    _drawEnemy(ctx, W, H, ts, vs) {
        const FLOOR = H - 52;
        const cx    = Math.round(vs.enemyX + vs.enemyAtkOff);
        const fr    = vs.enemyFrame;
        const dead  = vs.enemyState === 'dead';
        const scale = vs.isBoss ? 1.55 : 1.0;

        const flash = vs.enemyFlashMs > 0 && Math.floor(vs.enemyFlashMs / 85) % 2 === 0;

        ctx.save();
        ctx.translate(cx, FLOOR);
        ctx.scale(-scale, scale);   // mirror to face left

        if (dead) {
            ctx.rotate(Math.PI * 0.45 + vs.enemyDeadT * 0.12);
            ctx.globalAlpha = Math.max(0, 1 - vs.enemyDeadT * 0.85);
        }
        if (flash) ctx.globalAlpha = (ctx.globalAlpha || 1) * 0.22;

        switch (vs.enemyType) {
            case 'beast':    this._drawBeastSprite(ctx, fr);       break;
            case 'spirit':   this._drawSpiritSprite(ctx, fr, ts);  break;
            case 'small':    this._drawSmallSprite(ctx, fr);       break;
            case 'boss':     this._drawBossSprite(ctx, fr, ts);    break;
            default:         this._drawHumanoidSprite(ctx, fr);    break;
        }

        ctx.restore();
    },

    _drawBeastSprite(ctx, fr) {
        const b  = fr === 0 ? 0 : -2;
        const la = fr === 0 ? 3 : -3;

        ctx.fillStyle = 'rgba(0,0,0,0.32)';
        ctx.beginPath(); ctx.ellipse(0, 2+b, 18, 5, 0, 0, Math.PI*2); ctx.fill();

        // Body
        ctx.fillStyle = '#8b2252'; ctx.fillRect(-16,-16+b,32,18);
        ctx.fillStyle = '#6b1a40'; ctx.fillRect(-16,-16+b,32, 5);

        // Legs
        ctx.fillStyle = '#7a1a44';
        ctx.fillRect(-13,2+b,6,10+la); ctx.fillRect(-4,2+b,6,10-la); ctx.fillRect(5,2+b,6,10+la);

        // Head
        ctx.fillStyle = '#8b2252'; ctx.fillRect(10,-22+b,14,14);
        ctx.fillStyle = '#6b1a40';
        ctx.beginPath(); ctx.moveTo(11,-22+b); ctx.lineTo(8,-30+b); ctx.lineTo(16,-22+b); ctx.fill();
        ctx.beginPath(); ctx.moveTo(22,-22+b); ctx.lineTo(26,-30+b); ctx.lineTo(24,-22+b); ctx.fill();

        // Eyes + fangs
        ctx.fillStyle = '#ff3333'; ctx.fillRect(17,-17+b,4,4);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(21,-11+b,2,5); ctx.fillRect(18,-11+b,2,4);

        // Tail
        ctx.strokeStyle = '#6b1a40'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(-16,-10+b); ctx.quadraticCurveTo(-28,-18+b,-22,-28+b); ctx.stroke();
    },

    _drawSpiritSprite(ctx, fr, ts) {
        const fl = Math.sin(ts * 0.003) * 5;
        const a  = 0.70 + Math.sin(ts * 0.002) * 0.15;
        ctx.globalAlpha = (ctx.globalAlpha || 1) * a;

        // Wispy trail
        const tg = ctx.createLinearGradient(0, 22+fl, 0, 50+fl);
        tg.addColorStop(0, 'rgba(130,70,200,0.5)'); tg.addColorStop(1, 'rgba(130,70,200,0)');
        ctx.fillStyle = tg; ctx.fillRect(-8, 22+fl, 16, 30);

        // Glow
        const gg = ctx.createRadialGradient(0, 6+fl, 4, 0, 6+fl, 32);
        gg.addColorStop(0, 'rgba(160,90,220,0.42)'); gg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gg; ctx.beginPath(); ctx.ellipse(0, 6+fl, 32, 32, 0, 0, Math.PI*2); ctx.fill();

        // Body
        ctx.fillStyle = '#9b6bd4';
        ctx.beginPath(); ctx.ellipse(0, 6+fl, 14, 18, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#c8a0f0';
        ctx.beginPath(); ctx.ellipse(-4, 0+fl, 6, 8, -0.3, 0, Math.PI*2); ctx.fill();

        // Face
        ctx.fillStyle = '#fff'; ctx.fillRect(-6, 2+fl, 4, 6); ctx.fillRect(2, 2+fl, 4, 6);
        ctx.fillStyle = '#1a0030'; ctx.fillRect(-5,4+fl,3,4); ctx.fillRect(3,4+fl,3,4);

        // Claws
        ctx.fillStyle = '#c8a0f0';
        ctx.fillRect(-17,14+fl,4,9); ctx.fillRect(13,14+fl,4,9);
        ctx.fillStyle = '#fff';
        ctx.fillRect(-17,21+fl,3,2); ctx.fillRect(13,21+fl,3,2);

        ctx.globalAlpha = 1;
    },

    _drawSmallSprite(ctx, fr) {
        const b = fr === 0 ? 0 : -3;

        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.beginPath(); ctx.ellipse(0, 2+b, 8, 3, 0, 0, Math.PI*2); ctx.fill();

        ctx.fillStyle = '#2a4a6a'; ctx.fillRect(-7,-10+b,14,16);
        ctx.fillStyle = '#1a3a5a';
        ctx.beginPath(); ctx.arc(0, -16+b, 10, 0, Math.PI*2); ctx.fill();

        // Horns
        ctx.fillStyle = '#4a6a8a';
        ctx.beginPath(); ctx.moveTo(-6,-24+b); ctx.lineTo(-10,-34+b); ctx.lineTo(-2,-24+b); ctx.fill();
        ctx.beginPath(); ctx.moveTo(6,-24+b);  ctx.lineTo(10,-34+b);  ctx.lineTo(2,-24+b);  ctx.fill();

        // Eyes
        ctx.fillStyle = '#44ffff'; ctx.fillRect(-4,-19+b,3,3); ctx.fillRect(1,-19+b,3,3);

        // Legs
        ctx.fillStyle = '#1a3a5a';
        ctx.fillRect(-6, 6+b, 5, 8+(fr===0?2:-2));
        ctx.fillRect( 1, 6+b, 5, 8-(fr===0?2:-2));

        // Arms
        ctx.fillRect(-12, 0+b, 4, 8); ctx.fillRect(8, 0+b, 4, 8);
    },

    _drawHumanoidSprite(ctx, fr) {
        const la = fr === 0 ? 3 : -3;

        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath(); ctx.ellipse(0, 2, 11, 4, 0, 0, Math.PI*2); ctx.fill();

        // Back leg
        ctx.fillStyle = '#1a2a1a'; ctx.fillRect(2,-18,7,14-la); ctx.fillRect(1,-4-la,8,4);

        // Cape
        ctx.fillStyle = '#180808';
        ctx.beginPath(); ctx.moveTo(-3,-20); ctx.lineTo(-9,2); ctx.lineTo(-3,2); ctx.lineTo(-1,-16); ctx.fill();

        // Body
        ctx.fillStyle = '#2a1a1a'; ctx.fillRect(-8,-20,16,18);
        ctx.fillStyle = '#4a2a1a'; ctx.fillRect(-7,-18,6,4); ctx.fillRect(1,-18,6,4); ctx.fillRect(-4,-12,8,3);

        // Front leg
        ctx.fillStyle = '#2a1a1a'; ctx.fillRect(-9,-18,7,14+la); ctx.fillRect(-10,-4+la,9,4);

        // Arms + head
        ctx.fillRect(-14,-20,6,14); ctx.fillRect(8,-20,6,14);
        ctx.fillStyle = '#1a0a0a'; ctx.fillRect(-6,-36,12,16);

        // Horns
        ctx.fillStyle = '#4a1a1a';
        ctx.beginPath(); ctx.moveTo(-4,-36); ctx.lineTo(-6,-44); ctx.lineTo(-1,-36); ctx.fill();
        ctx.beginPath(); ctx.moveTo(4,-36);  ctx.lineTo(6,-44);  ctx.lineTo(1,-36);  ctx.fill();

        // Eyes
        ctx.fillStyle = '#ff4400'; ctx.fillRect(-4,-28,3,3); ctx.fillRect(1,-28,3,3);

        // Weapon
        ctx.fillStyle = '#3a3a4a'; ctx.fillRect(14,-30,3,28);
        ctx.fillStyle = '#aaaacc'; ctx.fillRect(11,-20,9,3);
    },

    _drawBossSprite(ctx, fr, ts) {
        const fl = Math.sin(ts * 0.0014) * 3;
        const ew = 0.55 + Math.sin(ts * 0.0026) * 0.45;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.52)';
        ctx.beginPath(); ctx.ellipse(0, 4, 20, 7, 0, 0, Math.PI*2); ctx.fill();

        // Robe fade bottom
        const rg = ctx.createLinearGradient(0, 22+fl, 0, 50+fl);
        rg.addColorStop(0, '#1a0a2a'); rg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = rg; ctx.fillRect(-15, 22+fl, 30, 30);

        // Main robe
        ctx.fillStyle = '#1a0a2a';
        ctx.beginPath(); ctx.moveTo(-13,22+fl); ctx.lineTo(-10,-4+fl); ctx.lineTo(10,-4+fl); ctx.lineTo(13,22+fl); ctx.fill();

        // Shoulders
        ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-22,-4+fl,12,8); ctx.fillRect(10,-4+fl,12,8);

        // Collar
        ctx.fillStyle = '#6a2a6a'; ctx.fillRect(-11,-10+fl,22,8);

        // Head
        ctx.fillStyle = '#0a0010';
        ctx.beginPath(); ctx.arc(0, -22+fl, 14, 0, Math.PI*2); ctx.fill();
        // Hood
        ctx.fillStyle = '#18082a';
        ctx.beginPath(); ctx.arc(0, -26+fl, 17, Math.PI, 0); ctx.fill();
        ctx.fillRect(-17, -26+fl, 34, 10);

        // Glowing eyes — The defining feature
        ctx.fillStyle = `rgba(255,255,200,${ew})`;
        ctx.beginPath(); ctx.arc(-5,-22+fl, 4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc( 5,-22+fl, 4, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath(); ctx.arc(-5,-22+fl, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc( 5,-22+fl, 2, 0, Math.PI*2); ctx.fill();

        // Staff
        ctx.fillStyle = '#3a2a4a'; ctx.fillRect(15,-36+fl, 4, 50);
        // Orb
        ctx.fillStyle = '#9b4dd4';
        ctx.beginPath(); ctx.arc(17,-40+fl, 7, 0, Math.PI*2); ctx.fill();
        const og = ctx.createRadialGradient(17,-40+fl, 2, 17,-40+fl, 17);
        og.addColorStop(0, `rgba(160,80,220,${ew*0.62})`); og.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = og;
        ctx.beginPath(); ctx.arc(17,-40+fl, 17, 0, Math.PI*2); ctx.fill();

        // Floating runes
        ctx.globalAlpha = (ctx.globalAlpha || 1) * (0.35 + ew * 0.25);
        ctx.fillStyle = '#c080ff'; ctx.font = '11px serif';
        ctx.fillText('◈', -28, -8+fl); ctx.fillText('✦', 20, 10+fl);
        ctx.globalAlpha = 1;
    },

    // ── Helpers ───────────────────────────────────────────────────────────────

    _spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const s = 1.2 + Math.random() * 3.5;
            this.vs.particles.push({
                x, y,
                vx: Math.cos(a) * s,
                vy: Math.sin(a) * s - 2.2,
                life: 18 + Math.random() * 22,
                color,
                size: 2 + Math.random() * 3.5,
            });
        }
    },
};
