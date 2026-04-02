// js/pages/characterCreation.js
// Multi-step character creation wizard.
// Steps: 1 = Intro, 2 = Name, 3 = Faction, 4 = Origin, 5 = Confirm

const CharacterCreation = {
    _step: 1,
    _data: { name: '', faction: '', origin: '' },

    render() {
        const screen = document.getElementById('creation-screen');
        screen.classList.remove('hidden');
        this._step = 1;
        this._data = { name: '', faction: '', origin: '' };
        this._renderStep();
    },

    _renderStep() {
        const screen = document.getElementById('creation-screen');
        const builders = [null, '_stepIntro', '_stepName', '_stepFaction', '_stepOrigin', '_stepConfirm'];
        screen.innerHTML = this[builders[this._step]]();
        this._bindEvents();
    },

    // ── Step templates ────────────────────────────────────────

    _stepIntro() {
        return `
            <div class="cc-container">
                <div class="cc-intro">
                    <div class="cc-logo">Golden Ambrosia</div>
                    <div class="cc-tagline">The Fallen Empire of Alaia</div>
                    <div class="cc-lore">
                        <p>On the moon <strong>Alaia</strong>, orbiting the great blue gas giant <strong>Indigos</strong>,
                        the empire of <strong>Golden Ambrosia</strong> once unified the known world under a single throne.
                        It did not survive its own ambition.</p>
                        <p>Corruption and economic collapse lit the fuse. Civil war did the rest. In a final bid to end
                        the conflict, the necromancer <strong>Aidia</strong> led a coup against the emperor. When
                        defeat became inevitable, Aidia and his inner circle performed a catastrophic ritual —
                        one that destroyed the capital and themselves with it.</p>
                        <p>The ritual tore <strong>rifts</strong> across Alaia. Through them came the demons of the
                        underworld, pouring into a land already broken by war. The empire is ash.
                        Three rival factions now control distant corners of the continent, each pushing toward the
                        shattered central region — and each other.</p>
                        <p>You have pledged yourself to one of the three factions holding what remains of Alaia.
                        Their capitals stand at the edges of the shattered continent — each a foothold against
                        the ruins and the rifts beyond. What you become here is yours to decide.</p>
                    </div>
                    <button class="btn-primary cc-begin-btn" id="cc-next">Begin Your Journey</button>
                </div>
            </div>
        `;
    },

    _stepName() {
        return `
            <div class="cc-container">
                ${this._stepIndicator()}
                <div class="cc-panel">
                    <h2 class="cc-title">What is your name?</h2>
                    <p class="cc-subtitle">Your name is your mark. It will follow you through every victory and every failure.</p>
                    <input
                        type="text"
                        id="cc-name-input"
                        class="cc-input"
                        placeholder="Enter your name..."
                        value="${this._data.name}"
                        maxlength="24"
                        autocomplete="off"
                    />
                    <div class="cc-error hidden" id="cc-name-error">Name must be between 2 and 24 characters.</div>
                    <div class="cc-nav-row">
                        <button class="btn-secondary" id="cc-back">Back</button>
                        <button class="btn-primary" id="cc-next">Continue</button>
                    </div>
                </div>
            </div>
        `;
    },

    _stepFaction() {
        return `
            <div class="cc-container">
                ${this._stepIndicator()}
                <div class="cc-panel">
                    <h2 class="cc-title">Choose your Faction</h2>
                    <p class="cc-subtitle">Three powers rose from the empire's ruin. Each controls a corner of Alaia — and each wants the shattered central region.</p>
                    <div class="cc-cards" data-type="faction">
                        ${FACTIONS.map(f => `
                            <div class="cc-card ${this._data.faction === f.id ? 'selected' : ''}"
                                 data-id="${f.id}"
                                 style="--faction-color:${f.color};--faction-accent:${f.accentColor}">
                                <div class="cc-card-icon">${f.icon}</div>
                                <div class="cc-card-name">${f.name}</div>
                                <div class="cc-card-tagline">${f.tagline}</div>
                                <div class="cc-card-desc">${f.description}</div>
                                <div class="cc-card-flavor">"${f.lore}"</div>
                                <div class="cc-card-bonuses">
                                    ${Object.entries(f.skillBonuses).map(([s, v]) =>
                                        `<span class="bonus-tag">+${v} ${skillLabel(s)}</span>`
                                    ).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="cc-error hidden" id="cc-faction-error">Please select a faction to continue.</div>
                    <div class="cc-nav-row">
                        <button class="btn-secondary" id="cc-back">Back</button>
                        <button class="btn-primary" id="cc-next">Continue</button>
                    </div>
                </div>
            </div>
        `;
    },

    _stepOrigin() {
        return `
            <div class="cc-container">
                ${this._stepIndicator()}
                <div class="cc-panel">
                    <h2 class="cc-title">Choose your Origin</h2>
                    <p class="cc-subtitle">Where you came from shapes what you start with — not what you'll become.</p>
                    <div class="cc-cards cc-cards-origins" data-type="origin">
                        ${ORIGINS.map(o => `
                            <div class="cc-card ${this._data.origin === o.id ? 'selected' : ''}"
                                 data-id="${o.id}">
                                <div class="cc-card-name">${o.name}</div>
                                <div class="cc-card-desc">${o.description}</div>
                                <div class="cc-card-flavor">"${o.flavor}"</div>
                                <div class="cc-card-bonuses">
                                    ${Object.entries(o.skillBonuses).map(([s, v]) =>
                                        `<span class="bonus-tag">+${v} ${skillLabel(s)}</span>`
                                    ).join('')}
                                    <span class="bonus-tag gold-tag">◈ ${o.startingGold} gold</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="cc-error hidden" id="cc-origin-error">Please select an origin to continue.</div>
                    <div class="cc-nav-row">
                        <button class="btn-secondary" id="cc-back">Back</button>
                        <button class="btn-primary" id="cc-next">Continue</button>
                    </div>
                </div>
            </div>
        `;
    },

    _stepConfirm() {
        const faction = FACTIONS.find(f => f.id === this._data.faction);
        const origin  = ORIGINS.find(o => o.id === this._data.origin);

        // Merge faction + origin bonuses for the summary
        const combined = Object.assign({}, faction.skillBonuses);
        for (const [s, v] of Object.entries(origin.skillBonuses)) {
            combined[s] = (combined[s] || 0) + v;
        }

        return `
            <div class="cc-container">
                ${this._stepIndicator()}
                <div class="cc-panel cc-confirm-panel">
                    <h2 class="cc-title">Your Character</h2>
                    <p class="cc-subtitle">Review your choices before entering Alaia.</p>

                    <div class="cc-summary">
                        <div class="cc-summary-name">${this._data.name}</div>
                        <div class="cc-summary-row">
                            <div class="cc-summary-block">
                                <div class="cc-summary-label">Faction</div>
                                <div class="cc-summary-value" style="color:${faction.accentColor}">${faction.name}</div>
                            </div>
                            <div class="cc-summary-block">
                                <div class="cc-summary-label">Origin</div>
                                <div class="cc-summary-value">${origin.name}</div>
                            </div>
                            <div class="cc-summary-block">
                                <div class="cc-summary-label">Starting Gold</div>
                                <div class="cc-summary-value gold-text">◈ ${origin.startingGold}</div>
                            </div>
                        </div>
                        <div class="cc-summary-skills">
                            <div class="cc-summary-label">Starting Skills</div>
                            <div class="cc-skills-grid">
                                ${Object.entries(combined).map(([s, v]) => `
                                    <div class="cc-skill-entry">
                                        <span class="cc-skill-name">${skillLabel(s)}</span>
                                        <span class="cc-skill-val">+${v}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <div class="cc-nav-row">
                        <button class="btn-secondary" id="cc-back">Back</button>
                        <button class="btn-primary cc-enter-btn" id="cc-confirm">Enter Alaia</button>
                    </div>
                </div>
            </div>
        `;
    },

    // ── Step indicator ────────────────────────────────────────
    _stepIndicator() {
        const steps = ['Intro', 'Name', 'Faction', 'Origin', 'Begin'];
        return `
            <div class="cc-steps">
                ${steps.map((label, i) => {
                    const num = i + 1;
                    const cls = num === this._step ? 'active' : num < this._step ? 'done' : '';
                    const dot = num < this._step ? '✓' : num;
                    return `
                        ${i > 0 ? '<div class="cc-step-line"></div>' : ''}
                        <div class="cc-step ${cls}">
                            <div class="cc-step-dot">${dot}</div>
                            <div class="cc-step-label">${label}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    // ── Event binding ─────────────────────────────────────────
    _bindEvents() {
        document.getElementById('cc-next')?.addEventListener('click', () => this._advance());
        document.getElementById('cc-back')?.addEventListener('click', () => this._retreat());
        document.getElementById('cc-confirm')?.addEventListener('click', () => this._confirm());

        // Card selection via event delegation on each cards container
        document.querySelectorAll('.cc-cards').forEach(grid => {
            grid.addEventListener('click', (e) => {
                const card = e.target.closest('.cc-card');
                if (!card) return;
                grid.querySelectorAll('.cc-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                const type = grid.dataset.type;
                if (type === 'faction') this._data.faction = card.dataset.id;
                if (type === 'origin')  this._data.origin  = card.dataset.id;
            });
        });

        // Enter key on name input
        const nameInput = document.getElementById('cc-name-input');
        if (nameInput) {
            nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') this._advance(); });
            nameInput.focus();
        }
    },

    // ── Navigation ────────────────────────────────────────────
    _advance() {
        if (!this._validate()) return;
        this._step++;
        this._renderStep();
    },

    _retreat() {
        if (this._step > 1) { this._step--; this._renderStep(); }
    },

    _validate() {
        if (this._step === 2) {
            const val = document.getElementById('cc-name-input')?.value.trim() ?? '';
            if (val.length < 2 || val.length > 24) {
                document.getElementById('cc-name-error')?.classList.remove('hidden');
                return false;
            }
            this._data.name = val;
        }
        if (this._step === 3 && !this._data.faction) {
            document.getElementById('cc-faction-error')?.classList.remove('hidden');
            return false;
        }
        if (this._step === 4 && !this._data.origin) {
            document.getElementById('cc-origin-error')?.classList.remove('hidden');
            return false;
        }
        return true;
    },

    // ── Final confirmation ────────────────────────────────────
    _confirm() {
        const player = PlayerSystem.createNew(this._data.name, this._data.faction, this._data.origin);
        SaveSystem.save();
        Layout.showGameShell();
        Layout.render();
        Router.init();
        Router.navigate('home');
        GameLoop.start();
        const capitalName = (typeof MAP_REGIONS !== 'undefined' && MAP_REGIONS[player.location])
            ? MAP_REGIONS[player.location].name
            : player.location;
        Log.add(`${player.name} arrives in ${capitalName}. The rifts glow on the horizon.`, 'system');
    },
};
