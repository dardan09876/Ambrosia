// js/pages/arena.js
// Arena page — displays the run lobby, active combat, and results.

Router.register('arena', function renderArena(container) {
    const player = PlayerSystem.current;
    if (!player) return;

    if (!ArenaState.inRun) {
        _renderArenaLobby(container, player);
    } else {
        _renderArenaCombat(container, player);
    }
});

// ── Lobby ────────────────────────────────────────────────────────────────────

function _renderArenaLobby(container, player) {
    const tokens = player.arenaTokens || 0;

    // Build loadout preview
    const loadout = buildPlayerLoadout(player.skills);
    const loadoutHtml = loadout.map(id => {
        const a = getArenaAbility(id);
        return a ? `<span class="arena-ability-tag">${a.name}</span>` : '';
    }).join('');

    // Summarise past run if available
    const prevRounds  = Math.max(0, ArenaState.round - 1);
    const prevGold    = ArenaState.totalGold;
    const prevTokens  = ArenaState.totalTokens;
    const hasPrevRun  = prevRounds > 0 || ArenaState.round > 0;
    const prevSummary = hasPrevRun
        ? `<div class="arena-last-run">
               Last run: <strong>${prevRounds}</strong> round${prevRounds !== 1 ? 's' : ''} cleared
               · <strong>${prevGold}g</strong> · <strong>${prevTokens}</strong> token${prevTokens !== 1 ? 's' : ''}.
           </div>`
        : '';

    container.innerHTML = `
        <div class="page">
            <div class="page-header">
                <h1 class="page-title">Arena</h1>
                <p class="page-subtitle">Auto-battle combat — survive as many rounds as you can.</p>
            </div>

            ${prevSummary}

            <div class="arena-grid">

                <div class="card">
                    <div class="card-header">Combat Loadout</div>
                    <div class="card-body">
                        <p class="arena-hint">Abilities are assigned automatically from your strongest skills.</p>
                        <div class="arena-ability-list">${loadoutHtml || '<em>No skills trained — basic attack only.</em>'}</div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">Arena Tokens</div>
                    <div class="card-body">
                        <div class="arena-tokens-display">
                            <span class="arena-token-icon">⚔</span>
                            <span class="arena-token-count">${tokens}</span>
                            <span class="arena-token-label">Tokens</span>
                        </div>
                        <p class="arena-hint">Earned every 3 rounds. Spent at future token shops.</p>
                    </div>
                </div>

                <div class="card arena-start-card">
                    <div class="card-header">Enter the Arena</div>
                    <div class="card-body">
                        <p>Your stats carry into the run. Mana and stamina are spent during combat.
                           Health persists across rounds until the run ends.</p>
                        <p class="arena-warn">Make sure you are prepared. You cannot pause once you start.</p>
                        <button class="btn btn-primary arena-start-btn" onclick="CombatEngine.startRun()">
                            Start Arena Run
                        </button>
                    </div>
                </div>

            </div>
        </div>
    `;
}

// ── Active combat ────────────────────────────────────────────────────────────

function _renderArenaCombat(container) {
    const p = ArenaState.player;
    const e = ArenaState.enemy;
    const round = ArenaState.round;

    const combatantHtml = (c) => {
        if (!c) return '';
        const hpPct  = Math.round((c.health  / c.maxHealth)  * 100);
        const mpPct  = Math.round((c.mana    / c.maxMana)    * 100);
        const spPct  = Math.round((c.stamina / c.maxStamina) * 100);
        const hpCol  = hpPct > 50 ? 'var(--stat-health)' : hpPct > 25 ? 'var(--warning)' : 'var(--danger)';

        const effs = c.effects.length > 0
            ? `<div class="arena-effects">${c.effects.map(ef =>
                `<span class="arena-effect-tag" title="${ef.id}">${_arenaEffectIcon(ef)} ${ef.duration}t</span>`
              ).join('')}</div>`
            : '';

        const cds = c.abilities
            ? c.abilities.filter(id => (c.cooldowns[id] || 0) > 0)
                .map(id => {
                    const a = getArenaAbility(id);
                    return a ? `<span class="arena-cd-tag">${a.name} (${c.cooldowns[id]})</span>` : '';
                }).join('')
            : '';

        return `
            <div class="arena-combatant ${c.id === 'player' ? 'arena-player' : 'arena-enemy'}">
                <div class="arena-comb-name">${c.name}${c.isBoss ? ' 👑' : ''}</div>
                ${effs}
                <div class="arena-stat-row">
                    <span class="arena-stat-label">HP</span>
                    <div class="arena-bar-track">
                        <div class="arena-bar-fill" style="width:${hpPct}%;background:${hpCol}"></div>
                    </div>
                    <span class="arena-stat-val">${c.health}/${c.maxHealth}</span>
                </div>
                <div class="arena-stat-row">
                    <span class="arena-stat-label">MP</span>
                    <div class="arena-bar-track">
                        <div class="arena-bar-fill" style="width:${mpPct}%;background:var(--stat-mana)"></div>
                    </div>
                    <span class="arena-stat-val">${c.mana}/${c.maxMana}</span>
                </div>
                <div class="arena-stat-row">
                    <span class="arena-stat-label">SP</span>
                    <div class="arena-bar-track">
                        <div class="arena-bar-fill" style="width:${spPct}%;background:var(--stat-stamina)"></div>
                    </div>
                    <span class="arena-stat-val">${c.stamina}/${c.maxStamina}</span>
                </div>
                ${cds ? `<div class="arena-cooldowns">Cooldowns: ${cds}</div>` : ''}
            </div>
        `;
    };

    const statusLine = ArenaState.inCombat
        ? `<div class="arena-status arena-status-active">⚔ Round ${round} — Turn ${ArenaState.turn}</div>`
        : ArenaState.winner === 'player'
            ? `<div class="arena-status arena-status-win">✔ Round ${round - 1} cleared — preparing next round…</div>`
            : `<div class="arena-status arena-status-loss">✘ Run ended after ${Math.max(0, round - 1)} round${round > 2 ? 's' : ''}.</div>`;

    const logHtml = ArenaState.combatLog.slice(0, 20).map(msg =>
        `<div class="arena-log-line">${msg}</div>`
    ).join('');

    container.innerHTML = `
        <div class="page">
            <div class="page-header">
                <h1 class="page-title">Arena — Round ${round}</h1>
            </div>

            ${statusLine}

            <div class="arena-fight-grid">
                ${combatantHtml(p)}
                <div class="arena-vs">VS</div>
                ${combatantHtml(e)}
            </div>

            <div class="arena-log">
                <div class="card-header">Combat Log</div>
                <div class="arena-log-entries">${logHtml}</div>
            </div>

            ${ArenaState.inRun ? `
                <div class="arena-actions">
                    <button class="btn btn-danger" onclick="CombatEngine.withdraw()">Withdraw</button>
                </div>
            ` : `
                <div class="arena-actions">
                    <button class="btn btn-primary" onclick="CombatEngine.startRun()">New Run</button>
                </div>
            `}
        </div>
    `;
}

function _arenaEffectIcon(eff) {
    const icons = {
        bleed:       '🩸',
        defense_up:  '🛡',
        dodge_up:    '💨',
        mana_shield: '✦',
        regen:       '✚',
    };
    return icons[eff.id] || '◈';
}
