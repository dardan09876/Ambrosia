// js/ui/log.js
// Activity log — stores the last 6 actions and renders them in the footer.

const Log = {
    MAX: 6,
    STORAGE_KEY: 'ga_log',
    _entries: [],

    init() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            this._entries = raw ? JSON.parse(raw) : [];
        } catch (e) {
            this._entries = [];
        }
        this.render();
    },

    // type: 'info' | 'success' | 'danger' | 'warning' | 'system'
    add(message, type = 'info') {
        this._entries.unshift({
            message,
            type,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        if (this._entries.length > this.MAX) this._entries.length = this.MAX;
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._entries));
        } catch (e) { /* storage full */ }
        this.render();
    },

    render() {
        const container = document.getElementById('log-entries');
        if (!container) return;

        if (this._entries.length === 0) {
            container.innerHTML = '<span class="log-empty">No recent activity.</span>';
            return;
        }

        container.innerHTML = this._entries.map(e => `
            <div class="log-entry log-${e.type}">
                <span class="log-time">${e.time}</span>
                <span class="log-msg">${e.message}</span>
            </div>
        `).join('');
    },

    clear() {
        this._entries = [];
        localStorage.removeItem(this.STORAGE_KEY);
        this.render();
    },
};
