/* PowerCampus page — mobile app preview: switch the phone between light and dark mode.
   Markup: .app-stage[data-mode] > .app-phone > img[data-mode] (one .is-active)
           [data-mockup-toggle] > button.seg-btn[data-mode][aria-pressed]
   Buttons are native <button>s, so Enter/Space work; Left/Right arrows move between them. */
(function () {
    'use strict';

    function init() {
        var group = document.querySelector('[data-mockup-toggle]');
        var stage = document.querySelector('.app-stage');
        if (!group || !stage) return;

        var buttons = Array.prototype.slice.call(group.querySelectorAll('button[data-mode]'));
        var images = Array.prototype.slice.call(stage.querySelectorAll('.app-phone img[data-mode]'));

        function setMode(mode) {
            stage.setAttribute('data-mode', mode);
            buttons.forEach(function (b) {
                b.setAttribute('aria-pressed', b.getAttribute('data-mode') === mode ? 'true' : 'false');
            });
            images.forEach(function (img) {
                var on = img.getAttribute('data-mode') === mode;
                img.classList.toggle('is-active', on);
                if (on) {
                    img.removeAttribute('aria-hidden');
                    // the hidden preview is lazy; make sure it is loaded once it is shown
                    img.loading = 'eager';
                } else {
                    img.setAttribute('aria-hidden', 'true');
                }
            });
        }

        buttons.forEach(function (btn, i) {
            btn.addEventListener('click', function () { setMode(btn.getAttribute('data-mode')); });
            btn.addEventListener('keydown', function (e) {
                var dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
                if (!dir) return;
                e.preventDefault();
                var next = buttons[(i + dir + buttons.length) % buttons.length];
                next.focus();
                setMode(next.getAttribute('data-mode'));
            });
        });

        // warm the other preview as the section approaches, so the first switch is instant
        if ('IntersectionObserver' in window) {
            var io = new IntersectionObserver(function (entries) {
                if (entries[0].isIntersecting) {
                    images.forEach(function (img) { img.loading = 'eager'; });
                    io.disconnect();
                }
            }, { rootMargin: '400px 0px' });
            io.observe(stage);
        }

        var current = buttons.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; })[0];
        setMode(current ? current.getAttribute('data-mode') : 'dark');
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
