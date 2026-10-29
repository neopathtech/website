// Neopath Technologies — Site Behaviour v2.0
(function () {
  "use strict";

  // Footer year
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // ====== Smart Autohide Sticky Header ======
  function initStickyHeader() {
    var header = document.querySelector(".site-header");
    var nav = document.getElementById("primary-nav");
    if (!header) return;

    var lastScroll = window.scrollY || window.pageYOffset;
    var scrollThreshold = 8;

    function onScroll() {
      var currentScroll = window.scrollY || window.pageYOffset;
      var delta = currentScroll - lastScroll;

      // Backdrop blur when scrolled
      if (currentScroll > 30) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }

      // Don't hide header if mobile nav menu is open
      if (nav && nav.classList.contains("open")) {
        header.classList.remove("header-hidden");
        lastScroll = currentScroll;
        return;
      }

      // Always visible near top of page
      if (currentScroll <= 60) {
        header.classList.remove("header-hidden");
        lastScroll = currentScroll;
        return;
      }

      // Trigger hide / reveal based on scroll direction
      if (Math.abs(delta) > scrollThreshold) {
        if (delta > 0) {
          // Scrolling down the page -> hide header
          header.classList.add("header-hidden");
          closeAllDropdowns();
        } else {
          // Scrolling up towards top -> reveal header
          header.classList.remove("header-hidden");
        }
        lastScroll = currentScroll;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // ====== Scroll Progress Bar ======
  function initScrollProgress() {
    var bar = document.querySelector(".scroll-progress");
    if (!bar) return;

    function updateProgress() {
      var scrollTop = window.scrollY || window.pageYOffset;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = Math.min(100, progress).toFixed(1) + "%";
    }

    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();
  }

  // ====== Mobile Navigation ======
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("primary-nav");

  function setMenu(open) {
    if (!nav || !toggle) return;
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));

    // Animate hamburger
    var spans = toggle.querySelectorAll("span");
    if (spans.length >= 2) {
      if (open) {
        spans[0].style.transform = "translateY(4px) rotate(45deg)";
        spans[1].style.transform = "translateY(-4px) rotate(-45deg)";
      } else {
        spans[0].style.transform = "";
        spans[1].style.transform = "";
      }
    }
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setMenu(!nav.classList.contains("open"));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest(".nav-dropdown-trigger")) return; // handled by dropdown
      if (e.target.tagName === "A") setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        setMenu(false);
        closeAllDropdowns();
      }
    });
  }

  // ====== Nav Dropdown ======
  function setDropdown(dropdown, open) {
    dropdown.classList.toggle("open", open);
    var trigger = dropdown.querySelector(".nav-dropdown-trigger");
    if (trigger) trigger.setAttribute("aria-expanded", String(open));
  }

  function closeAllDropdowns() {
    document.querySelectorAll(".nav-dropdown.open").forEach(function (d) {
      setDropdown(d, false);
    });
  }

  document.querySelectorAll(".nav-dropdown-trigger").forEach(function (trigger) {
    trigger.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var dropdown = trigger.closest(".nav-dropdown");
      var isOpen = dropdown.classList.contains("open");

      // Close others first
      document.querySelectorAll(".nav-dropdown.open").forEach(function (d) {
        if (d !== dropdown) setDropdown(d, false);
      });

      setDropdown(dropdown, !isOpen);
    });
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".nav-dropdown")) {
      closeAllDropdowns();
    }
  });

  // ====== Lusion.co Text Load & Scroll Reveal Animation ======
  function initLusionTextAnimations() {
    var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function wrapLinesInMask(el, isBlock) {
      if (!el || el.dataset.lusionPrepared) return;
      el.dataset.lusionPrepared = "true";

      var html = el.innerHTML;
      var parts = html.split(/<br\s*\/?>/gi);
      if (parts.length > 1) {
        el.innerHTML = parts
          .map(function (part, i) {
            var trimmed = part.trim();
            if (!trimmed) return "";
            return (
              '<span class="lusion-mask" style="display:' +
              (isBlock ? "block" : "inline-block") +
              '"><span class="lusion-item" style="--lusion-delay:' +
              i +
              '">' +
              trimmed +
              "</span></span>"
            );
          })
          .join("");
      } else {
        var text = el.textContent.trim();
        el.innerHTML =
          '<span class="lusion-mask" style="display:' +
          (isBlock ? "block" : "inline-block") +
          '"><span class="lusion-item" style="--lusion-delay:0">' +
          text +
          "</span></span>";
      }
    }

    // 1. Hero Text Load Reveal
    var hero = document.querySelector("[data-lusion-hero]");
    if (hero) {
      var heroTagline = hero.querySelector(".hero-tagline");
      var heroTitle = hero.querySelector(".hero-title, .page-hero-title");
      var heroSubtext = hero.querySelector(".hero-subtext, .page-hero-desc");
      var heroActions = hero.querySelector(".hero-actions");

      if (heroTagline) {
        heroTagline.classList.add("lusion-fade-in");
        heroTagline.style.setProperty("--lusion-fade-delay", "0.06s");
      }

      if (heroTitle) {
        wrapLinesInMask(heroTitle, true);
        heroTitle.style.setProperty("--lusion-base-delay", "0.16s");
      }

      if (heroSubtext) {
        heroSubtext.classList.add("lusion-fade-in");
        heroSubtext.style.setProperty("--lusion-fade-delay", "0.64s");
      }

      if (heroActions) {
        heroActions.classList.add("lusion-fade-in");
        heroActions.style.setProperty("--lusion-fade-delay", "0.78s");
      }

      // Fade-in badges
      var badges = hero.querySelectorAll(".badge");
      badges.forEach(function (badge, i) {
        badge.classList.add("lusion-fade-in");
        badge.style.setProperty("--lusion-fade-delay", (0.04 + i * 0.08) + "s");
      });

      if (prefersReducedMotion) {
        hero.classList.add("lusion-revealed");
      } else {
        requestAnimationFrame(function () {
          setTimeout(function () {
            hero.classList.add("lusion-revealed");
          }, 80);
        });
      }
    }

    // 2. Scroll-Triggered Section Text Reveals
    var revealSections = document.querySelectorAll("[data-lusion-reveal]");
    if (revealSections.length) {
      revealSections.forEach(function (sec) {
        var h2 = sec.querySelector("h2");
        if (h2) {
          wrapLinesInMask(h2, true);
          h2.style.setProperty("--lusion-base-delay", "0.12s");
        }
        var labels = sec.querySelectorAll(":scope > p, :scope > div > div > p:first-child");
        labels.forEach(function (p) {
          p.classList.add("lusion-fade-in");
          p.style.setProperty("--lusion-fade-delay", "0.04s");
        });
        var subp = sec.querySelector(":scope > div > div > p:last-child");
        if (subp && subp !== labels[0]) {
          subp.classList.add("lusion-fade-in");
          subp.style.setProperty("--lusion-fade-delay", "0.22s");
        }
      });

      if (prefersReducedMotion || !("IntersectionObserver" in window)) {
        revealSections.forEach(function (sec) {
          sec.classList.add("lusion-revealed");
        });
      } else {
        var observer = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) {
                entry.target.classList.add("lusion-revealed");
                observer.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.08, rootMargin: "0px 0px -30px 0px" }
        );

        revealSections.forEach(function (sec) {
          observer.observe(sec);
        });
      }
    }
  }

  // ====== Animated Stat Counters ======
  function initStatCounters() {
    var stats = document.querySelectorAll(".stat-number[data-count]");
    if (!stats.length) return;

    var observed = new Set();

    function animateCounter(el) {
      var target = el.getAttribute("data-count");
      var suffix = el.getAttribute("data-suffix") || "";
      var prefix = el.getAttribute("data-prefix") || "";
      var numTarget = parseFloat(target);
      var isNumber = !isNaN(numTarget);

      if (!isNumber) {
        el.textContent = prefix + target + suffix;
        return;
      }

      var duration = 1800;
      var startTime = null;
      var startVal = 0;
      var isFloat = target.includes(".");

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        var ease = 1 - Math.pow(1 - progress, 4); // easeOutQuart
        var current = startVal + (numTarget - startVal) * ease;
        el.textContent = prefix + (isFloat ? current.toFixed(1) : Math.round(current)) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }

      requestAnimationFrame(step);
    }

    if ("IntersectionObserver" in window) {
      var counterObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !observed.has(entry.target)) {
            observed.add(entry.target);
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.3 });

      stats.forEach(function (el) {
        counterObserver.observe(el);
      });
    } else {
      stats.forEach(animateCounter);
    }
  }

  // ====== Horizontal Testimonials Slider ======
  function initTestimonialsSlider() {
    var track = document.getElementById("testimonials-track");
    if (!track) return;

    var prevBtn = document.getElementById("testimonials-prev");
    var nextBtn = document.getElementById("testimonials-next");
    var progressBar = document.getElementById("testimonials-progress");

    function getStep() {
      var item = track.querySelector(".testimonial-item");
      return item ? item.getBoundingClientRect().width : 380;
    }

    function updateControls() {
      var maxScroll = track.scrollWidth - track.clientWidth;
      if (maxScroll <= 0) {
        if (prevBtn) prevBtn.disabled = true;
        if (nextBtn) nextBtn.disabled = true;
        if (progressBar) progressBar.style.width = "100%";
        return;
      }

      var current = track.scrollLeft;
      if (prevBtn) prevBtn.disabled = current <= 4;
      if (nextBtn) nextBtn.disabled = current >= maxScroll - 4;

      if (progressBar) {
        var percent = Math.min(100, Math.max(12, ((current + track.clientWidth) / track.scrollWidth) * 100));
        progressBar.style.width = percent.toFixed(1) + "%";
      }
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        track.scrollBy({ left: -getStep(), behavior: "smooth" });
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        track.scrollBy({ left: getStep(), behavior: "smooth" });
      });
    }

    track.addEventListener("scroll", updateControls, { passive: true });
    window.addEventListener("resize", updateControls, { passive: true });

    // Drag-to-scroll for desktop
    var isDown = false;
    var startX = 0;
    var scrollLeft = 0;

    track.addEventListener("mousedown", function (e) {
      if (e.button !== 0) return;
      isDown = true;
      track.classList.add("is-dragging");
      startX = e.pageX - track.offsetLeft;
      scrollLeft = track.scrollLeft;
    });

    window.addEventListener("mouseup", function () {
      if (!isDown) return;
      isDown = false;
      track.classList.remove("is-dragging");
    });

    track.addEventListener("mousemove", function (e) {
      if (!isDown) return;
      e.preventDefault();
      var x = e.pageX - track.offsetLeft;
      var walk = (x - startX) * 1.2;
      track.scrollLeft = scrollLeft - walk;
    });

    // Keyboard navigation
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        track.scrollBy({ left: -getStep(), behavior: "smooth" });
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        track.scrollBy({ left: getStep(), behavior: "smooth" });
      }
    });

    updateControls();
  }

  // ====== Dark/Light Mockup Toggle (follows site theme) ======
  function initMockupToggle() {
    var toggleGroup = document.querySelector("[data-mockup-toggle]");
    if (!toggleGroup) return;

    var btns = toggleGroup.querySelectorAll(".mode-btn");
    var targetImg = document.getElementById("mobile-mockup-img");
    if (!targetImg) return;

    var currentMode = null;

    function setMode(mode, animate) {
      if (mode === currentMode) return;
      currentMode = mode;

      btns.forEach(function (b) {
        var isActive = b.getAttribute("data-mode") === mode;
        b.classList.toggle("active", isActive);
        b.setAttribute("aria-pressed", String(isActive));
      });

      function swap() {
        if (mode === "dark") {
          targetImg.src = "assets/PowerCampusMobile-Dark.png";
          targetImg.alt = "PowerCampus Mobile App Dark Mode Interface";
        } else {
          targetImg.src = "assets/PowerCampusMobile-Light.png";
          targetImg.alt = "PowerCampus Mobile App Light Mode Interface";
        }
        targetImg.style.opacity = "1";
        targetImg.style.transform = "translateY(0)";
      }

      if (!animate) {
        swap();
        return;
      }

      // Fade transition
      targetImg.style.opacity = "0";
      targetImg.style.transform = "translateY(8px)";
      setTimeout(swap, 250);
    }

    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        setMode(btn.getAttribute("data-mode"), true);
      });
    });

    // Start on, and keep following, the site's light/dark theme
    setMode(document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark", false);
    document.addEventListener("themechange", function (e) {
      setMode(e.detail.theme, true);
    });

    // Add transition style
    targetImg.style.transition = "opacity 0.25s ease, transform 0.3s ease";
  }

  // ====== FAQ Accordion ======
  function initFaqAccordion() {
    var triggers = document.querySelectorAll(".accordion-trigger");
    triggers.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var item = btn.closest(".accordion-item");
        var isActive = item.classList.contains("active");

        var parent = item.parentElement;
        if (parent) {
          parent.querySelectorAll(".accordion-item").forEach(function (it) {
            it.classList.remove("active");
            var itBtn = it.querySelector(".accordion-trigger");
            if (itBtn) itBtn.setAttribute("aria-expanded", "false");
          });
        }

        if (!isActive) {
          item.classList.add("active");
          btn.setAttribute("aria-expanded", "true");
        }
      });
    });
  }

  // ====== Product Tab Switcher ======
  function initProductTabs() {
    var tabs = document.querySelectorAll(".product-tab-btn");
    if (!tabs.length) return;

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function (e) {
        // Don't prevent default — let anchor navigation work
        tabs.forEach(function (t) { t.classList.remove("active"); });
        tab.classList.add("active");
      });
    });
  }

  // ====== Smooth Element Entrance via Intersection Observer ======
  function initEntranceAnimations() {
    var elements = document.querySelectorAll("[data-animate]");
    if (!elements.length || !("IntersectionObserver" in window)) return;

    var animObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in");
          animObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -20px 0px" });

    elements.forEach(function (el) {
      animObserver.observe(el);
    });
  }

  // ====== Light / Dark Theme Toggle ======
  function initThemeToggle() {
    var root = document.documentElement;
    var buttons = document.querySelectorAll(".theme-toggle");
    if (!buttons.length) return;

    function sync() {
      var isLight = root.getAttribute("data-theme") === "light";
      buttons.forEach(function (btn) {
        btn.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
      });
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
        root.setAttribute("data-theme", next);
        try { localStorage.setItem("theme", next); } catch (e) { }
        sync();
        document.dispatchEvent(new CustomEvent("themechange", { detail: { theme: next } }));
      });
    });

    sync();
  }

  // ====== Initialize All ======
  function initApp() {
    initStickyHeader();
    initThemeToggle();
    initScrollProgress();
    initLusionTextAnimations();
    initTestimonialsSlider();
    initMockupToggle();
    initFaqAccordion();
    initProductTabs();
    initStatCounters();
    initEntranceAnimations();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }

  // ====== Form Submission Handler ======
  function attachFormHandler(formId, statusId) {
    var form = document.getElementById(formId);
    var status = document.getElementById(statusId);
    if (!form || !status) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var name = (data.get("name") || "").trim();
      var email = (data.get("email") || "").trim();
      var phone = (data.get("phone") || "").trim();
      var division = (data.get("division") || "General").trim();
      var details = (data.get("details") || data.get("message") || "").trim();

      if (!name || !details || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        status.textContent = "Please enter your name, a valid email address and your project details.";
        status.style.color = "var(--color-error)";
        return;
      }

      var subject = encodeURIComponent("Website Enquiry [" + division + "]: " + name);
      var body = encodeURIComponent(
        "Name: " + name + "\n" +
        "Email: " + email + "\n" +
        (phone ? "Phone: " + phone + "\n" : "") +
        "Division: " + division + "\n\n" +
        "Project / Requirement Details:\n" + details
      );
      window.location.href = "mailto:contact@neopathtech.com?subject=" + subject + "&body=" + body;

      status.textContent = "Thank you! Your email app should open with your enquiry ready to send.";
      status.style.color = "var(--color-success)";
      form.reset();
    });
  }

  // ====== Preselect Division from ?division= Links ======
  function preselectDivision(selectId) {
    var select = document.getElementById(selectId);
    var wanted = new URLSearchParams(window.location.search).get("division");
    if (!select || !wanted) return;

    var options = Array.prototype.slice.call(select.options);
    var keyword = wanted.split(/[\s:]+/)[0].toLowerCase();
    var match = options.find(function (o) { return o.value === wanted; }) ||
      options.find(function (o) { return o.value.toLowerCase().indexOf(keyword) !== -1; });
    if (match) select.value = match.value;
  }

  preselectDivision("contact-division");

  attachFormHandler("enquiry-form", "form-status");
  attachFormHandler("contact-page-form", "contact-form-status");
})();
