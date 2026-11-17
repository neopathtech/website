/* Neopath — shared image / story viewer (About: NEo Social stories, Gallery grid).
   Usage: NPLightbox.open(items, startIndex, { opener: buttonEl, story: true|false })
   items: [{ src, alt, title, label }]
   Keyboard: Esc closes (native <dialog>), ArrowLeft / ArrowRight step, focus returns to the opener.
   Touch: swipe left / right to step. Click the dimmed area around the image to close. */
(function () {
    'use strict';

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var dialog, img, stage, titleEl, labelEl, counterEl, progressEl, prevBtn, nextBtn;
    var items = [];
    var index = 0;
    var opener = null;
    var isStory = false;

    function icon(paths) {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
    }

    function build() {
        if (dialog) return true;
        dialog = document.createElement('dialog');
        if (typeof dialog.showModal !== 'function') { dialog = null; return false; }
        dialog.className = 'lb';
        dialog.setAttribute('aria-label', 'Image viewer');
        dialog.innerHTML =
            '<div class="lb-top">' +
                '<div class="lb-progress" aria-hidden="true"></div>' +
                '<div class="lb-head">' +
                    '<p class="lb-caption"><strong></strong><span></span></p>' +
                    '<button class="lb-btn lb-close" type="button" aria-label="Close" autofocus>' + icon('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>') + '</button>' +
                '</div>' +
            '</div>' +
            '<div class="lb-stage"><img class="lb-img" alt="" draggable="false"></div>' +
            '<div class="lb-foot">' +
                '<button class="lb-btn lb-prev" type="button" aria-label="Previous image">' + icon('<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>') + '</button>' +
                '<span class="lb-counter" aria-live="polite"></span>' +
                '<button class="lb-btn lb-next" type="button" aria-label="Next image">' + icon('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>') + '</button>' +
            '</div>';
        document.body.appendChild(dialog);

        img = dialog.querySelector('.lb-img');
        stage = dialog.querySelector('.lb-stage');
        titleEl = dialog.querySelector('.lb-caption strong');
        labelEl = dialog.querySelector('.lb-caption span');
        counterEl = dialog.querySelector('.lb-counter');
        progressEl = dialog.querySelector('.lb-progress');
        prevBtn = dialog.querySelector('.lb-prev');
        nextBtn = dialog.querySelector('.lb-next');

        dialog.querySelector('.lb-close').addEventListener('click', function () { dialog.close(); });
        prevBtn.addEventListener('click', function () { show(index - 1, -1); });
        nextBtn.addEventListener('click', function () { show(index + 1, 1); });

        dialog.addEventListener('keydown', function (e) {
            if (items.length < 2) return;
            if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1, -1); }
            if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1, 1); }
        });

        // swipe on touch screens; a tap on the dimmed stage (not the image) closes
        var sx = null, sy = 0, swiped = false;
        stage.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; swiped = false; });
        stage.addEventListener('pointerup', function (e) {
            if (sx === null) return;
            var dx = e.clientX - sx, dy = e.clientY - sy;
            sx = null;
            if (items.length > 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) {
                swiped = true;
                show(index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
            }
        });
        stage.addEventListener('click', function (e) {
            if (swiped) { swiped = false; return; }
            if (e.target === stage) dialog.close();
        });

        dialog.addEventListener('close', function () {
            document.documentElement.classList.remove('lb-lock');
            img.removeAttribute('src');
            if (opener && document.contains(opener)) opener.focus();
            opener = null;
        });
        return true;
    }

    function show(i, dir) {
        index = (i + items.length) % items.length;
        var it = items[index];
        var many = items.length > 1;

        titleEl.textContent = it.title || '';
        labelEl.textContent = it.label || '';
        counterEl.textContent = many ? (index + 1) + ' / ' + items.length : '';
        counterEl.setAttribute('aria-label', many ? 'Image ' + (index + 1) + ' of ' + items.length : '');

        Array.prototype.forEach.call(progressEl.children, function (bar, j) {
            bar.classList.toggle('is-done', j < index);
            bar.classList.toggle('is-current', j === index);
        });

        img.classList.remove('is-in');
        img.style.setProperty('--dx', (dir || 0) * 24 + 'px');
        img.alt = it.alt || '';
        img.src = it.src;
        var reveal = function () {
            if (!reduceMotion) void img.offsetWidth; // restart the entrance
            img.classList.add('is-in');
        };
        if (img.decode) img.decode().then(reveal, reveal); else reveal();

        // warm the neighbours so stepping feels instant
        if (many) [index + 1, index - 1].forEach(function (k) {
            var n = items[(k + items.length) % items.length];
            var pre = new Image(); pre.src = n.src;
        });
    }

    function open(list, start, opts) {
        if (!list || !list.length || !build()) return;
        opts = opts || {};
        items = list;
        opener = opts.opener || document.activeElement;
        isStory = !!opts.story;

        var many = items.length > 1;
        prevBtn.hidden = nextBtn.hidden = !many;
        dialog.classList.toggle('lb--story', isStory && many);
        dialog.setAttribute('aria-label', isStory ? 'Story viewer' : 'Image viewer');
        progressEl.innerHTML = isStory && many ? new Array(items.length + 1).join('<i></i>') : '';

        show(start || 0, 0);
        document.documentElement.classList.add('lb-lock');
        dialog.showModal();
    }

    window.NPLightbox = { open: open };
})();
