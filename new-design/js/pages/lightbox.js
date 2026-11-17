/* Neopath — shared image / story viewer (About: NEo Social stories, Gallery grid).
   Usage: NPLightbox.open(items, startIndex, { opener, story, nextStory, prevStory })
   items: [{ src, alt, title, label }]
   Gallery mode: arrows / swipe step through the images and wrap around.
   Story mode (story: true) plays like a social-media status:
     - each slide shows for STORY_MS and its progress segment fills in time, then it moves on;
     - after the last slide it calls nextStory() (open the next story) or closes;
     - stepping back from the first slide calls prevStory() or restarts the slide;
     - press and hold pauses, the pause button pauses / plays,
       tapping the left third of the image goes back, the rest goes forward.
   Keyboard: Esc closes (native <dialog>), ArrowLeft / ArrowRight step, focus returns to the opener.
   Touch: swipe left / right to step. Click the dimmed area around the image to close. */
(function () {
    'use strict';

    var STORY_MS = 6000;   // time each story slide stays on screen
    var HOLD_MS = 220;     // a press longer than this is a "hold" (pause), not a tap

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var dialog, img, stage, titleEl, labelEl, counterEl, progressEl, prevBtn, nextBtn, pauseBtn;
    var items = [];
    var index = 0;
    var opener = null;
    var isStory = false;
    var nextStory = null, prevStory = null;

    // story clock
    var showId = 0;        // guards async image loads against fast stepping
    var ready = false;     // the current slide's image is on screen
    var elapsed = 0;
    var lastFrame = 0;
    var raf = 0;
    var userPaused = false;
    var held = false;

    var ICON_PAUSE = '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>';
    var ICON_PLAY = '<path d="M7 4.5v15l12.5-7.5z"/>';

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
                    '<div class="lb-actions">' +
                        '<button class="lb-btn lb-pause" type="button" aria-label="Pause story" hidden></button>' +
                        '<button class="lb-btn lb-close" type="button" aria-label="Close" autofocus>' + icon('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>') + '</button>' +
                    '</div>' +
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
        pauseBtn = dialog.querySelector('.lb-pause');

        dialog.querySelector('.lb-close').addEventListener('click', function () { dialog.close(); });
        prevBtn.addEventListener('click', function () { step(-1); });
        nextBtn.addEventListener('click', function () { step(1); });
        pauseBtn.addEventListener('click', function () { setPaused(!userPaused); });

        dialog.addEventListener('keydown', function (e) {
            if (items.length < 2 && !isStory) return;
            if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
            if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
        });

        // touch / mouse on the stage:
        //   swipe → step, press and hold → pause (story), short tap on the image → step (story),
        //   short tap on the dimmed area → close
        var sx = null, sy = 0, downAt = 0, skipClick = false;
        stage.addEventListener('pointerdown', function (e) {
            if (e.button > 0) return;
            sx = e.clientX; sy = e.clientY; downAt = Date.now(); skipClick = false;
            if (isStory) setHeld(true);
        });
        function release(e) {
            setHeld(false);
            if (sx === null) return;
            var dx = e.clientX - sx, dy = e.clientY - sy;
            sx = null;
            if (Date.now() - downAt > HOLD_MS) skipClick = true;   // it was a hold, not a tap
            if ((items.length > 1 || isStory) && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) {
                skipClick = true;
                step(dx < 0 ? 1 : -1);
            }
        }
        stage.addEventListener('pointerup', release);
        stage.addEventListener('pointercancel', function () { sx = null; setHeld(false); });
        stage.addEventListener('pointerleave', function () { setHeld(false); });
        stage.addEventListener('contextmenu', function (e) { if (isStory) e.preventDefault(); });
        stage.addEventListener('click', function (e) {
            if (skipClick) { skipClick = false; return; }
            if (e.target === stage) { dialog.close(); return; }
            if (isStory && e.target === img) {
                var r = img.getBoundingClientRect();
                step(e.clientX - r.left < r.width / 3 ? -1 : 1);
            }
        });

        dialog.addEventListener('close', function () {
            stopClock();
            document.documentElement.classList.remove('lb-lock');
            img.removeAttribute('src');
            if (opener && document.contains(opener)) opener.focus();
            opener = null;
            nextStory = prevStory = null;
            userPaused = false;
        });
        return true;
    }

    /* ---------- story clock ---------- */

    function setBars(p) {
        Array.prototype.forEach.call(progressEl.children, function (bar, j) {
            bar.style.setProperty('--p', j < index ? 1 : j === index ? p : 0);
            bar.classList.toggle('is-done', j < index);
            bar.classList.toggle('is-current', j === index);
        });
    }

    function tick(t) {
        raf = requestAnimationFrame(tick);
        // real time between frames (browsers may throttle frames), capped so a long stall never
        // skips a slide; time spent in a hidden tab is not counted (see visibilitychange below)
        var dt = lastFrame ? Math.min(t - lastFrame, 1000) : 0;
        lastFrame = t;
        if (!ready || userPaused || held) return;
        elapsed += dt;
        var p = Math.min(elapsed / STORY_MS, 1);
        setBars(p);
        if (p >= 1) step(1);
    }

    function startClock() {
        stopClock();
        lastFrame = 0;
        raf = requestAnimationFrame(tick);
    }

    function stopClock() {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
    }

    document.addEventListener('visibilitychange', function () { lastFrame = 0; });

    function setPaused(on) {
        userPaused = on;
        pauseBtn.innerHTML = icon(on ? ICON_PLAY : ICON_PAUSE);
        pauseBtn.setAttribute('aria-label', on ? 'Play story' : 'Pause story');
        dialog.classList.toggle('is-paused', on);
    }

    function setHeld(on) {
        if (held === on) return;
        held = on;
        dialog.classList.toggle('is-held', on && isStory);
    }

    /* ---------- navigation ---------- */

    function step(d) {
        if (!isStory) { show(index + d, d); return; }
        var j = index + d;
        if (j >= items.length) {
            if (!(nextStory && nextStory())) dialog.close();
            return;
        }
        if (j < 0) {
            if (!(prevStory && prevStory())) show(0, 0);   // no earlier story: replay the first slide
            return;
        }
        show(j, d);
    }

    function show(i, dir) {
        index = (i + items.length) % items.length;
        var it = items[index];
        var many = items.length > 1;
        var id = ++showId;

        titleEl.textContent = it.title || '';
        labelEl.textContent = it.label || '';
        counterEl.textContent = many ? (index + 1) + ' / ' + items.length : '';
        counterEl.setAttribute('aria-label', many ? 'Image ' + (index + 1) + ' of ' + items.length : '');

        ready = false;
        elapsed = 0;
        setBars(0);

        img.classList.remove('is-in');
        img.style.setProperty('--dx', (dir || 0) * 24 + 'px');
        img.alt = it.alt || '';
        img.src = it.src;
        var reveal = function () {
            if (id !== showId) return;           // the viewer has moved on to another slide
            if (!reduceMotion) void img.offsetWidth; // restart the entrance
            img.classList.add('is-in');
            ready = true;                        // the story clock starts once the slide is visible
        };
        if (img.decode) img.decode().then(reveal, function () {
            if (img.complete) reveal(); else img.addEventListener('load', reveal, { once: true });
        }); else reveal();

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
        nextStory = typeof opts.nextStory === 'function' ? opts.nextStory : null;
        prevStory = typeof opts.prevStory === 'function' ? opts.prevStory : null;

        var many = items.length > 1;
        prevBtn.hidden = nextBtn.hidden = !many && !isStory;
        prevBtn.setAttribute('aria-label', isStory ? 'Previous slide' : 'Previous image');
        nextBtn.setAttribute('aria-label', isStory ? 'Next slide' : 'Next image');
        pauseBtn.hidden = !isStory;
        dialog.classList.toggle('lb--story', isStory);
        dialog.setAttribute('aria-label', isStory ? 'Story viewer' : 'Image viewer');
        progressEl.innerHTML = isStory ? new Array(items.length + 1).join('<i></i>') : '';
        if (isStory) setPaused(userPaused);

        show(start || 0, 0);
        if (!dialog.open) {
            document.documentElement.classList.add('lb-lock');
            dialog.showModal();
        }
        if (isStory) startClock(); else stopClock();
    }

    window.NPLightbox = { open: open };
})();
