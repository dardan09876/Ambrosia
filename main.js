// main.js — Entry point
// Checks for an existing save; either loads into the game or shows character creation.

(function () {
    'use strict';

    function init() {
        const saved = SaveSystem.load();

        if (saved && saved.player && saved.player.name) {
            // Returning player — restore state and boot the game
            PlayerSystem.load(saved);
            GameLoop.applyOfflineProgress(saved.savedAt);
            Layout.showGameShell();
            Layout.render();
            Router.init();
            GameLoop.start();
        } else {
            // New player — show character creation wizard
            CharacterCreation.render();
        }
    }

    document.addEventListener('DOMContentLoaded', init);
}());
