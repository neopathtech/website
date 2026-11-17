/* Neopath — gallery.html only.
   1. Category filter chips ([data-filter-group] → [data-filter-target]), announced in [data-filter-status].
   2. Each tile opens the shared viewer (js/pages/lightbox.js); ArrowLeft/Right step through the
      tiles the current filter shows. */
(function () {
    'use strict';

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

    function initFilters() {
        $$('[data-filter-group]').forEach(function (group) {
            var name = group.getAttribute('data-filter-group');
            var target = document.querySelector('[data-filter-target="' + name + '"]');
            var status = document.querySelector('[data-filter-status="' + name + '"]');
            if (!target) return;
            var chips = $$('.filter-chip', group);
            var items = $$('[data-category]', target);

            chips.forEach(function (chip) {
                chip.addEventListener('click', function () {
                    var filter = chip.getAttribute('data-filter');
                    var shown = 0;
                    chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
                    items.forEach(function (item) {
                        var match = filter === 'all' || item.getAttribute('data-category') === filter;
                        item.hidden = !match;
                        item.classList.remove('is-shown');
                        if (!match) return;
                        if (!reduceMotion) {
                            item.style.setProperty('--fd', Math.min(shown, 10) * 0.04 + 's');
                            void item.offsetWidth; // restart the rise-in
                            item.classList.add('is-shown');
                        }
                        shown++;
                    });
                    if (status) {
                        var label = chip.firstChild.textContent.trim();
                        status.textContent = 'Showing ' + shown + (filter === 'all' ? ' items' : ' in ' + label);
                    }
                });
            });
        });
    }

    function initViewer() {
        var grid = document.querySelector('.gallery-grid');
        if (!grid || !window.NPLightbox) return;
        $$('.gallery-open', grid).forEach(function (btn) {
            btn.addEventListener('click', function () {
                var visible = $$('.gallery-item', grid).filter(function (it) { return !it.hidden; });
                window.NPLightbox.open(visible.map(function (it) {
                    var img = it.querySelector('img');
                    return {
                        src: img.currentSrc || img.src,
                        alt: img.alt,
                        title: it.querySelector('figcaption strong').textContent,
                        label: it.querySelector('figcaption span').textContent
                    };
                }), visible.indexOf(btn.closest('.gallery-item')), { opener: btn });
            });
        });
    }

    function init() {
        initFilters();
        initViewer();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
