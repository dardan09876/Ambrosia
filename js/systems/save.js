// js/systems/save.js
// Handles all localStorage persistence.

const SaveSystem = {
    KEY: 'golden_ambrosia_save',
    VERSION: '0.1.0',

    save() {
        if (!PlayerSystem.current) return;
        const data = {
            version: this.VERSION,
            savedAt: Date.now(),
            player: PlayerSystem.current,
        };
        try {
            localStorage.setItem(this.KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('[SaveSystem] Save failed:', e);
        }
    },

    load() {
        try {
            const raw = localStorage.getItem(this.KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            console.warn('[SaveSystem] Load failed:', e);
            return null;
        }
    },

    exists() {
        return !!localStorage.getItem(this.KEY);
    },

    clear() {
        localStorage.removeItem(this.KEY);
        localStorage.removeItem('ga_log');
    },
};
