/* Neopath — about.html only: NEo Social story viewer.
   Each .story-open button carries its slides as JSON in data-slides; opening it shows every
   slide in the shared viewer (js/pages/lightbox.js) with a progress bar and "n / total". */
(function () {
    'use strict';

    function init() {
        if (!window.NPLightbox) return;
        Array.prototype.forEach.call(document.querySelectorAll('.story-open[data-slides]'), function (btn) {
            btn.addEventListener('click', function () {
                var slides;
                try { slides = JSON.parse(btn.getAttribute('data-slides')); } catch (e) { return; }
                var title = btn.getAttribute('data-title');
                var label = btn.getAttribute('data-label');
                window.NPLightbox.open(slides.map(function (s) {
                    return { src: s.src, alt: s.alt, title: title, label: label };
                }), 0, { opener: btn, story: true });
            });
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
