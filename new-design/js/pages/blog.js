/* Neopath — blog.html only: category filter chips.
   [data-filter-group] buttons show/hide the [data-category] posts inside the matching
   [data-filter-target]; the result is announced in [data-filter-status]. */
(function () {
    'use strict';

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

    function init() {
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
                            item.style.setProperty('--fd', shown * 0.06 + 's');
                            void item.offsetWidth; // restart the rise-in
                            item.classList.add('is-shown');
                        }
                        shown++;
                    });
                    if (status) {
                        var label = chip.firstChild.textContent.trim();
                        status.textContent = 'Showing ' + shown + (filter === 'all' ? ' posts' : ' in ' + label);
                    }
                });
            });
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
