// js/ui/layout.js
// Renders the persistent game shell: top bar, sub bar, sidebar nav.
// updateStatBars() is called every tick by the game loop.

const Layout = {

    NAV_ITEMS: [
        { page: 'home',      label: 'Home',      icon: '⌂' },
        { page: 'skills',    label: 'Skills',    icon: '✦' },
        { page: 'guilds',    label: 'Guilds',    icon: '◆' },
        { page: 'quests',    label: 'Quests',    icon: '◈' },
        { page: 'inventory', label: 'Inventory', icon: '◫' },
        { page: 'equipment', label: 'Equipment', icon: '◉' },
        { page: 'crafting',  label: 'Crafting',  icon: '◈' },
        { page: 'market',    label: 'Market',    icon: '◎' },
        { page: 'abilities', label: 'Abilities', icon: '✧' },
        { page: 'map',       label: 'Map',       icon: '⬡' },
    ],

    STAT_CONFIG: [
        { key: 'health',  label: 'Health',  color: '#c04040' },
        { key: 'energy',  label: 'Energy',  color: '#4a9edb' },
        { key: 'focus',   label: 'Focus',   color: '#9b6bd4' },
        { key: 'stamina', label: 'Stamina', color: '#4a9e6b' },
        { key: 'mana',    label: 'Mana',    color: '#5b8fd4' },
    ],

    // Full render — called once on game start
    render() {
        this._renderNav();
        this.updateStatBars();
        Log.init();
    },

    // ── Top bar: stat bars + player info ─────────────────────
    _renderStatBars() {
        const player = PlayerSystem.current;
        if (!player) return;

        const el = document.getElementById('stat-bars-container');
        if (!el) return;

        el.innerHTML = this.STAT_CONFIG.map(cfg => {
            const stat         = player.stats[cfg.key];
            const cap          = PlayerSystem.getStatMax(cfg.key);
            const pct          = cap > 0 ? Math.round((stat.value / cap) * 100) : 0;
            const isFull       = stat.value >= cap;
            const secsLeft     = Math.max(0, stat.regenInterval - (stat._timer || 0));
            const timeToRegenStr = secsLeft >= 60
                ? `${Math.floor(secsLeft / 60)}m ${secsLeft % 60}s`
                : `${secsLeft}s`;
            return `
                <div class="stat-bar-item" title="${cfg.label}: ${stat.value} / ${cap}">
                    <div class="stat-bar-label">${cfg.label}</div>
                    <div class="stat-bar-track">
                        <div class="stat-bar-fill" style="width:${pct}%;background:${cfg.color}"></div>
                    </div>
                    <div class="stat-bar-value">${stat.value}/${cap}</div>
                    <div class="stat-bar-regen ${isFull ? 'stat-regen-full' : ''}">
                        ${isFull ? 'Full' : timeToRegenStr}
                    </div>
                </div>
            `;
        }).join('');
    },

    _renderPlayerInfo() {
        const player = PlayerSystem.current;
        if (!player) return;

        const el = document.getElementById('top-player-info');
        if (!el) return;

        const faction = FACTIONS.find(f => f.id === player.faction);
        el.innerHTML = `
            <span class="player-name">${player.name}</span>
            <span class="player-faction" style="color:${faction ? faction.accentColor : '#c9a84c'}">
                ${faction ? faction.name : ''}
            </span>
        `;
    },

    // ── Sub bar: currency + food + location ───────────────────
    _renderSubBar() {
        const player = PlayerSystem.current;
        if (!player) return;

        const currEl = document.getElementById('currency-display');
        if (currEl) {
            const sv         = player.survival;
            const stateClass = `survival-${sv.state.replace('-', '')}`;
            const shelterCost = (typeof MapSystem !== 'undefined')
                ? MapSystem.getShelterCost(player.location)
                : 0;
            currEl.innerHTML = `
                <div class="currency-item">
                    <span class="currency-icon">◈</span>
                    <span class="currency-value">${player.gold.toLocaleString()}</span>
                    <span class="currency-label">Gold</span>
                </div>
                <div class="currency-item ${stateClass}" title="${sv.state}">
                    <span class="currency-icon">⊕</span>
                    <span class="currency-value">${sv.food}/${sv.foodMax}</span>
                    <span class="currency-label">Food · ${sv.state}</span>
                </div>
                <div class="currency-item currency-shelter" title="Daily shelter cost for this region">
                    <span class="currency-icon">⌂</span>
                    <span class="currency-value">${shelterCost.toLocaleString()}g</span>
                    <span class="currency-label">Shelter/day</span>
                </div>
                ${(() => {
                    const corruption = player.corruption ?? 0;
                    if (corruption === 0) return '';
                    const tier      = (typeof PlayerSystem !== 'undefined') ? PlayerSystem.getCorruptionTier() : null;
                    const color     = tier ? tier.color : '#c9a84c';
                    const tierLabel = tier ? tier.label : '';
                    const atCapital = typeof FACTION_CAPITALS !== 'undefined' && Object.values(FACTION_CAPITALS).includes(player.location);
                    const hint = atCapital ? ' · Shrine available' : ' · Visit a shrine';
                    return `
                <div class="currency-item" style="color:${color}" title="${tierLabel} — Corruption: ${corruption}${hint}">
                    <span class="currency-icon">☠</span>
                    <span class="currency-value">${corruption}</span>
                    <span class="currency-label">${tierLabel}</span>
                </div>`;
                })()}
            `;
        }

        const locEl = document.getElementById('location-display');
        if (locEl) {
            if (PlayerSystem.isHospitalized()) {
                const remaining = Math.max(0, player.hospitalized.until - Date.now());
                const mins      = Math.ceil(remaining / 60000);
                locEl.innerHTML = `<span class="location-label location-hospitalized">⚕ Hospitalized — ${mins}m remaining</span>`;
            } else {
                const regionName = (typeof MAP_REGIONS !== 'undefined' && MAP_REGIONS[player.location])
                    ? MAP_REGIONS[player.location].name
                    : player.location;
                locEl.innerHTML = `<span class="location-label">◉ ${regionName}</span>`;
            }
        }
    },

    // ── Left sidebar navigation ───────────────────────────────
    _renderNav() {
        const list = document.getElementById('nav-list');
        if (!list) return;

        list.innerHTML = this.NAV_ITEMS.map(item => `
            <li class="nav-item" data-page="${item.page}">
                <span class="nav-icon">${item.icon}</span>
                <span class="nav-label">${item.label}</span>
            </li>
        `).join('');

        list.addEventListener('click', (e) => {
            const item = e.target.closest('.nav-item');
            if (item) Router.navigate(item.dataset.page);
        });
    },

    // Called every tick — only refreshes the dynamic parts
    updateStatBars() {
        this._renderStatBars();
        this._renderPlayerInfo();
        this._renderSubBar();
    },

    // Show game shell, hide creation screen
    showGameShell() {
        document.getElementById('creation-screen').classList.add('hidden');
        document.getElementById('game-shell').classList.remove('hidden');
    },
};
