// js/ui/router.js
// Hash-based SPA router. Pages register a render function; the router calls it
// when the hash changes.

const Router = {
    _pages: {},
    _current: null,

    // Pages register themselves: Router.register('home', fn)
    register(name, renderFn) {
        this._pages[name] = renderFn;
    },

    init() {
        window.addEventListener('hashchange', () => this._resolve());
        this._resolve();
    },

    navigate(page) {
        window.location.hash = page;
    },

    _resolve() {
        const hash = window.location.hash.replace('#', '').trim() || 'home';
        this._load(hash);
    },

    _load(page) {
        const content = document.getElementById('content-area');
        if (!content) return;

        this._current = page;
        content.innerHTML = '';

        const renderFn = this._pages[page];
        if (renderFn) {
            renderFn(content);
        } else {
            // Unbuilt section stub
            const label = page.charAt(0).toUpperCase() + page.slice(1);
            content.innerHTML = `
                <div class="page">
                    <div class="page-header">
                        <h1 class="page-title">${label}</h1>
                    </div>
                    <div class="card">
                        <div class="card-body page-stub">
                            <div class="page-stub-title">Under Construction</div>
                            <div class="page-stub-text">This section is coming in the next phase.</div>
                        </div>
                    </div>
                </div>
            `;
        }

        this._highlightNav(page);
    },

    _highlightNav(active) {
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.page === active);
        });
    },
};
