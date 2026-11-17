/* Neopath — about.html only: NEo Social story viewer.
   Each .story-open button carries its slides as JSON in data-slides; opening it plays the
   slides in the shared viewer (js/pages/lightbox.js) like a social-media status: timed
   progress bars, auto-advance, and on to the next story when one finishes. */
(function () {
    'use strict';

    function init() {
        if (!window.NPLightbox) return;
        var buttons = Array.prototype.slice.call(document.querySelectorAll('.story-open[data-slides]'));

        function openStory(k) {
            var btn = buttons[k];
            if (!btn) return false;
            var slides;
            try { slides = JSON.parse(btn.getAttribute('data-slides')); } catch (e) { return false; }
            if (!slides || !slides.length) return false;
            var title = btn.getAttribute('data-title');
            var label = btn.getAttribute('data-label');
            window.NPLightbox.open(slides.map(function (s) {
                return { src: s.src, alt: s.alt, title: title, label: label };
            }), 0, {
                opener: btn,
                story: true,
                nextStory: function () { return openStory(k + 1); },
                prevStory: function () { return openStory(k - 1); }
            });
            return true;
        }

        buttons.forEach(function (btn, k) {
            btn.addEventListener('click', function () { openStory(k); });
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
