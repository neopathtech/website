/* Neopath — new design: shared interactions for every page.
   Everything is progressive: without JS the content is fully visible. */
(function () {
    'use strict';

    var doc = document.documentElement;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    /* ---------- helpers ---------- */
    function $(sel, root) { return (root || document).querySelector(sel); }
    function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
    function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

    var ticking = false;
    var scrollHandlers = [];
    function onScroll(fn) { scrollHandlers.push(fn); }
    function runScroll() {
        ticking = false;
        for (var i = 0; i < scrollHandlers.length; i++) scrollHandlers[i]();
    }
    window.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(runScroll); }
    }, { passive: true });
    window.addEventListener('resize', function () { requestAnimationFrame(runScroll); });

    /* ---------- button label roll: wrap text so CSS can duplicate it ---------- */
    function initButtonLabels() {
        $$('.btn, .float-cta-label').forEach(function (btn) {
            if (btn.querySelector('.btn-label')) return;
            // only wrap the first direct text node
            for (var i = 0; i < btn.childNodes.length; i++) {
                var n = btn.childNodes[i];
                if (n.nodeType === 3 && n.textContent.trim()) {
                    var text = n.textContent.trim();
                    var outer = document.createElement('span');
                    outer.className = 'btn-label';
                    var inner = document.createElement('span');
                    inner.textContent = text;
                    inner.setAttribute('data-text', text);
                    outer.appendChild(inner);
                    btn.replaceChild(outer, n);
                    break;
                }
            }
        });
    }

    /* ---------- navigation ---------- */
    function initNav() {
        var wrap = $('.nav-wrap');
        if (!wrap) return;

        // dropdowns: click to toggle, hover on desktop
        $$('.nav-drop', wrap).forEach(function (drop) {
            var btn = $('.nav-drop-btn', drop);
            var closeTimer;
            function set(open) {
                drop.classList.toggle('is-open', open);
                btn.setAttribute('aria-expanded', open ? 'true' : 'false');
            }
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var open = !drop.classList.contains('is-open');
                $$('.nav-drop.is-open', wrap).forEach(function (d) { if (d !== drop) { d.classList.remove('is-open'); $('.nav-drop-btn', d).setAttribute('aria-expanded', 'false'); } });
                set(open);
            });
            if (canHover) {
                drop.addEventListener('mouseenter', function () { clearTimeout(closeTimer); set(true); });
                drop.addEventListener('mouseleave', function () { closeTimer = setTimeout(function () { set(false); }, 180); });
            }
            drop.addEventListener('keydown', function (e) { if (e.key === 'Escape') { set(false); btn.focus(); } });
        });
        document.addEventListener('click', function (e) {
            if (!e.target.closest('.nav-drop')) $$('.nav-drop.is-open').forEach(function (d) { d.classList.remove('is-open'); $('.nav-drop-btn', d).setAttribute('aria-expanded', 'false'); });
        });

        // compact pill after the first screen: it shrinks while scrolling down and only opens
        // again near the top, on hover (CSS), or on a quick flick upwards — a slow scroll up
        // keeps it compact
        var FAST_UP = 1.2;          // upward speed (px per ms, ~1200 px/s) that counts as "fast"
        var lastY = window.scrollY;
        var samples = [];           // recent [scrollY, time] pairs, for the scroll speed
        onScroll(function () {
            var y = window.scrollY;
            var t = performance.now();
            samples.push([y, t]);
            while (samples.length > 2 && t - samples[0][1] > 150) samples.shift();

            if (y < 320) {
                wrap.classList.remove('is-compact');
                lastY = y;
                return;
            }
            var dy = y - lastY;
            if (dy > 4) {
                wrap.classList.add('is-compact');
                lastY = y;
            } else if (dy < -4) {
                var span = t - samples[0][1];
                var speedUp = span > 0 ? (samples[0][0] - y) / span : 0;
                if (span >= 30 && speedUp > FAST_UP) wrap.classList.remove('is-compact');
                lastY = y;
            }
        });

        // mobile menu
        var toggle = $('.nav-toggle');
        var menu = $('.mobile-menu');
        if (toggle && menu) {
            toggle.addEventListener('click', function () {
                var open = !document.body.classList.contains('menu-open');
                document.body.classList.toggle('menu-open', open);
                toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
                menu.setAttribute('aria-hidden', open ? 'false' : 'true');
                $$('a', menu).forEach(function (a, i) { a.style.transitionDelay = open ? (0.05 + i * 0.035) + 's' : '0s'; });
            });
            $$('a', menu).forEach(function (a) {
                a.addEventListener('click', function () {
                    document.body.classList.remove('menu-open');
                    toggle.setAttribute('aria-expanded', 'false');
                });
            });
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape' && document.body.classList.contains('menu-open')) toggle.click();
            });
        }
    }

    /* ---------- floating "Book a call" ---------- */
    function initFloatCta() {
        var cta = $('.float-cta');
        if (!cta) return;
        var footer = $('.footer');
        onScroll(function () {
            var show = window.scrollY > window.innerHeight * 0.7;
            if (footer && footer.getBoundingClientRect().top < window.innerHeight - 40) show = false;
            cta.classList.toggle('is-visible', show);
        });
    }

    /* ---------- split headings into masked words ---------- */
    function splitWords(el) {
        if (el.dataset.splitDone) return;
        el.dataset.splitDone = '1';
        var idx = 0;
        function walk(node) {
            var kids = Array.prototype.slice.call(node.childNodes);
            kids.forEach(function (child) {
                if (child.nodeType === 3) {
                    var parts = child.textContent.split(/(\s+)/);
                    var frag = document.createDocumentFragment();
                    parts.forEach(function (p) {
                        if (!p) return;
                        if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
                        var line = document.createElement('span');
                        line.className = 'split-line';
                        var w = document.createElement('span');
                        w.className = 'split-word';
                        w.style.setProperty('--wi', idx++);
                        w.textContent = p;
                        line.appendChild(w);
                        frag.appendChild(line);
                    });
                    node.replaceChild(frag, child);
                } else if (child.nodeType === 1 && child.tagName !== 'BR' && !child.classList.contains('sr-only')) {
                    walk(child);
                }
            });
        }
        // keep an accessible copy of the text
        if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
        walk(el);
        $$('.split-line', el).forEach(function (l) { l.setAttribute('aria-hidden', 'true'); });
    }

    /* ---------- reveal on enter ---------- */
    function initReveal() {
        var els = $$('[data-reveal], [data-split]');
        $$('[data-split]').forEach(splitWords);
        // stagger children of [data-stagger]
        $$('[data-stagger]').forEach(function (group) {
            var step = parseFloat(group.dataset.stagger) || 0.08;
            Array.prototype.forEach.call(group.children, function (child, i) {
                if (!child.hasAttribute('data-reveal')) child.setAttribute('data-reveal', '');
                child.style.setProperty('--d', (i * step) + 's');
                els.push(child);
            });
        });
        if (reduceMotion || !('IntersectionObserver' in window)) {
            els.forEach(function (el) { el.classList.add('is-in'); });
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) {
                    en.target.classList.add('is-in');
                    io.unobserve(en.target);
                }
            });
        }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
        // wait for the preloader to lift before the first-screen animations start
        var wait = doc.classList.contains('no-preloader') ? 0 : 1350;
        setTimeout(function () { els.forEach(function (el) { io.observe(el); }); }, wait);
    }

    /* ---------- statement lit word-by-word with scroll ---------- */
    function initScrollLit() {
        $$('[data-scroll-lit]').forEach(function (el) {
            var words = [];
            function walk(node) {
                Array.prototype.slice.call(node.childNodes).forEach(function (child) {
                    if (child.nodeType === 3) {
                        var frag = document.createDocumentFragment();
                        child.textContent.split(/(\s+)/).forEach(function (p) {
                            if (!p) return;
                            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
                            var s = document.createElement('span');
                            s.className = 'w';
                            s.textContent = p;
                            words.push(s);
                            frag.appendChild(s);
                        });
                        node.replaceChild(frag, child);
                    } else if (child.nodeType === 1 && child.tagName !== 'BR') {
                        walk(child);
                    }
                });
            }
            walk(el);
            if (reduceMotion) { words.forEach(function (w) { w.classList.add('lit'); }); return; }
            onScroll(function () {
                var r = el.getBoundingClientRect();
                var vh = window.innerHeight;
                // 0 when the block's top hits 85% of the viewport, 1 when its bottom reaches 40%
                var p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.45), 0, 1);
                var n = Math.round(p * words.length);
                for (var i = 0; i < words.length; i++) words[i].classList.toggle('lit', i < n);
            });
        });
    }

    /* ---------- hero frame tilt + widget parallax ---------- */
    function initHeroMotion() {
        var frame = $('[data-tilt]');
        if (frame && !reduceMotion) {
            onScroll(function () {
                var r = frame.getBoundingClientRect();
                var vh = window.innerHeight;
                var t = clamp((r.top - vh * 0.15) / (vh * 0.7), 0, 1);
                frame.style.setProperty('--tilt', t.toFixed(3));
            });
        }
        var zone = $('[data-parallax-zone]');
        if (zone && canHover && !reduceMotion) {
            var widgets = $$('.widget', zone);
            zone.addEventListener('mousemove', function (e) {
                var r = zone.getBoundingClientRect();
                var x = (e.clientX - r.left) / r.width - 0.5;
                var y = (e.clientY - r.top) / r.height - 0.5;
                widgets.forEach(function (w) {
                    var d = parseFloat(w.dataset.depth || '20');
                    w.style.setProperty('--px', (x * d).toFixed(1) + 'px');
                    w.style.setProperty('--py', (y * d).toFixed(1) + 'px');
                });
            });
            zone.addEventListener('mouseleave', function () {
                widgets.forEach(function (w) { w.style.setProperty('--px', '0px'); w.style.setProperty('--py', '0px'); });
            });
        }
        // background videos: pause off-screen, respect reduced motion
        $$('video[autoplay]').forEach(function (v) {
            if (reduceMotion) { v.removeAttribute('autoplay'); v.pause(); return; }
            if (!('IntersectionObserver' in window)) return;
            new IntersectionObserver(function (en) {
                en.forEach(function (e) { if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () { }); } else v.pause(); });
            }).observe(v);
        });
    }

    /* ---------- sticky split: swap the visual as each text item passes ---------- */
    function initSplitSticky() {
        $$('.split-sticky').forEach(function (block) {
            var items = $$('.split-item', block);
            var figs = $$('.split-visual figure', block);
            if (!items.length || !figs.length) return;
            function setActive(i) {
                figs.forEach(function (f, j) { f.classList.toggle('is-active', j === i); });
                items.forEach(function (it, j) { it.classList.toggle('is-active', j === i); });
            }
            setActive(0);
            onScroll(function () {
                var mid = window.innerHeight * 0.5;
                var best = 0, bestD = Infinity;
                items.forEach(function (it, i) {
                    var r = it.getBoundingClientRect();
                    var d = Math.abs(r.top + r.height / 2 - mid);
                    if (d < bestD) { bestD = d; best = i; }
                });
                setActive(Math.min(best, figs.length - 1));
            });
        });
    }

    /* ---------- stacking cards: earlier cards shrink as the next one covers them ---------- */
    function initStack() {
        if (reduceMotion) return;
        $$('.stack').forEach(function (stack) {
            var cards = $$('.stack-card', stack);
            cards.forEach(function (c, i) { c.style.setProperty('--i', i); });
            onScroll(function () {
                if (window.innerWidth <= 860) { cards.forEach(function (c) { c.style.setProperty('--s', 1); }); return; }
                for (var i = 0; i < cards.length - 1; i++) {
                    var a = cards[i].getBoundingClientRect();
                    var b = cards[i + 1].getBoundingClientRect();
                    var gap = b.top - a.top;
                    var p = clamp(1 - gap / a.height, 0, 1);
                    cards[i].style.setProperty('--s', (1 - p * 0.06).toFixed(4));
                }
            });
        });
    }

    /* ---------- counters ---------- */
    function initCounters() {
        var els = $$('[data-count]');
        if (!els.length) return;
        function run(el) {
            var to = parseFloat(el.dataset.count);
            var dec = (el.dataset.count.split('.')[1] || '').length;
            if (reduceMotion) { el.textContent = to.toFixed(dec); return; }
            var start = null, dur = 1600;
            function step(ts) {
                if (!start) start = ts;
                var p = clamp((ts - start) / dur, 0, 1);
                var e = 1 - Math.pow(1 - p, 4);
                el.textContent = (to * e).toFixed(dec);
                if (p < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
        }
        if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
        }, { threshold: 0.4 });
        els.forEach(function (el) { io.observe(el); });
    }

    /* ---------- horizontal rail: buttons + drag ---------- */
    function initRails() {
        $$('[data-rail]').forEach(function (wrap) {
            var rail = $('.rail', wrap);
            var prev = $('[data-rail-prev]', wrap.closest('section') || wrap);
            var next = $('[data-rail-next]', wrap.closest('section') || wrap);
            if (!rail) return;
            function stepSize() { var c = rail.firstElementChild; return c ? c.getBoundingClientRect().width + 16 : 400; }
            function update() {
                if (prev) prev.disabled = rail.scrollLeft < 4;
                if (next) next.disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4;
            }
            if (prev) prev.addEventListener('click', function () { rail.scrollBy({ left: -stepSize(), behavior: 'smooth' }); });
            if (next) next.addEventListener('click', function () { rail.scrollBy({ left: stepSize(), behavior: 'smooth' }); });
            rail.addEventListener('scroll', update, { passive: true });
            update();
            if (canHover) {
                var down = false, sx = 0, sl = 0, moved = false;
                rail.addEventListener('mousedown', function (e) { down = true; moved = false; sx = e.pageX; sl = rail.scrollLeft; rail.classList.add('is-dragging'); });
                window.addEventListener('mouseup', function () { if (down) { down = false; rail.classList.remove('is-dragging'); } });
                rail.addEventListener('mousemove', function (e) {
                    if (!down) return;
                    var dx = e.pageX - sx;
                    if (Math.abs(dx) > 3) moved = true;
                    rail.scrollLeft = sl - dx;
                });
                rail.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
            }
        });
    }

    /* ---------- FAQ accordion ---------- */
    function initFaq() {
        $$('.faq-item').forEach(function (item, i) {
            var q = $('.faq-q', item);
            var a = $('.faq-a', item);
            if (!q || !a) return;
            var id = a.id || ('faq-a-' + i + '-' + Math.random().toString(36).slice(2, 7));
            a.id = id;
            q.setAttribute('aria-controls', id);
            function set(open) {
                item.classList.toggle('is-open', open);
                q.setAttribute('aria-expanded', open ? 'true' : 'false');
                // collapsed answers are hidden from assistive tech and tab order
                if ('inert' in a) a.inert = !open;
                a.setAttribute('aria-hidden', open ? 'false' : 'true');
            }
            set(item.classList.contains('is-open'));
            q.addEventListener('click', function (e) {
                // a mouse click while hovering keeps it open; keyboard (detail 0) and touch toggle
                if (canHover && e.detail > 0) { set(true); return; }
                set(!item.classList.contains('is-open'));
            });
            // on mouse devices, answers open on hover and close when the pointer leaves
            if (canHover) {
                item.addEventListener('mouseenter', function () { set(true); });
                item.addEventListener('mouseleave', function () { set(false); });
            }
        });
    }

    /* ---------- enquiry forms: open the visitor's email app with the enquiry filled in ----------
       Usage: <form data-mailto-form> … <p data-form-status role="status"></p></form>
       Field names: name, email, phone (optional), division, details|message */
    function initForms() {
        $$('form[data-mailto-form]').forEach(function (form) {
            var status = $('[data-form-status]', form);
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                var data = new FormData(form);
                function g(k) { return String(data.get(k) || '').trim(); }
                var name = g('name'), email = g('email'), phone = g('phone');
                var division = g('division') || 'General';
                var details = g('details') || g('message');
                if (!name || !details || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    if (status) { status.textContent = 'Please enter your name, a valid email address and your project details.'; status.dataset.state = 'error'; }
                    return;
                }
                var subject = encodeURIComponent('Website Enquiry [' + division + ']: ' + name);
                var body = encodeURIComponent('Name: ' + name + '\nEmail: ' + email + '\n' + (phone ? 'Phone: ' + phone + '\n' : '') +
                    'Division: ' + division + '\n\nProject / Requirement Details:\n' + details);
                window.location.href = 'mailto:contact@neopathtech.com?subject=' + subject + '&body=' + body;
                if (status) { status.textContent = 'Thank you! Your email app should open with your enquiry ready to send.'; status.dataset.state = 'ok'; }
                form.reset();
            });
        });
        // preselect a division from ?division=… links
        var wanted = new URLSearchParams(window.location.search).get('division');
        if (wanted) {
            $$('select[name="division"]').forEach(function (sel) {
                var key = wanted.split(/[\s:]+/)[0].toLowerCase();
                var opts = Array.prototype.slice.call(sel.options);
                var m = opts.filter(function (o) { return o.value === wanted; })[0] || opts.filter(function (o) { return o.value.toLowerCase().indexOf(key) !== -1; })[0];
                if (m) sel.value = m.value;
            });
        }
    }

    /* ---------- misc ---------- */
    function initYear() {
        $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
    }

    function init() {
        initButtonLabels();
        initNav();
        initFloatCta();
        initReveal();
        initScrollLit();
        initHeroMotion();
        initSplitSticky();
        initStack();
        initCounters();
        initRails();
        initFaq();
        initForms();
        initYear();
        runScroll();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
