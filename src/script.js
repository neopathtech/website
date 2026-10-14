// Neopath Technologies — homepage behaviour
(function () {
  "use strict";

  // Footer year
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Mobile navigation
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("primary-nav");
  function setMenu(open) {
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
  }
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setMenu(!nav.classList.contains("open"));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });
  }

  // Lusion.co Text Load & Scroll Reveal Animation
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
      var heroTitle = hero.querySelector(".hero-title");
      var heroSubtext = hero.querySelector(".hero-subtext");
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

      if (prefersReducedMotion) {
        hero.classList.add("lusion-revealed");
      } else {
        requestAnimationFrame(function () {
          setTimeout(function () {
            hero.classList.add("lusion-revealed");
          }, 80);
        });

        // Interactive subtle 3D mouse parallax on hero title
        if (heroTitle && window.matchMedia("(hover: hover)").matches) {
          hero.addEventListener("mousemove", function (e) {
            var rect = hero.getBoundingClientRect();
            var x = (e.clientX - rect.left) / rect.width - 0.5;
            var y = (e.clientY - rect.top) / rect.height - 0.5;
            heroTitle.style.transform =
              "perspective(1000px) rotateY(" +
              (x * 4).toFixed(2) +
              "deg) rotateX(" +
              (-y * 4).toFixed(2) +
              "deg)";
          });
          hero.addEventListener("mouseleave", function () {
            heroTitle.style.transform =
              "perspective(1000px) rotateY(0deg) rotateX(0deg)";
          });
        }
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
          { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
        );

        revealSections.forEach(function (sec) {
          observer.observe(sec);
        });
      }
    }
  }

  // Horizontal Testimonials Slider (Controls, Drag-to-scroll, Progress Bar)
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

    // Drag-to-scroll for desktop mouse users
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

    // Initial state
    updateControls();
  }

  // Initialize interactive components
  function initApp() {
    initLusionTextAnimations();
    initTestimonialsSlider();
    initMockupToggle();
    initFaqAccordion();
    initProductTabs();
  }

  // Dark/Light mockup toggle
  function initMockupToggle() {
    var toggleGroup = document.querySelector("[data-mockup-toggle]");
    if (!toggleGroup) return;

    var btns = toggleGroup.querySelectorAll(".mode-btn");
    var targetImg = document.getElementById("mobile-mockup-img");
    if (!targetImg) return;

    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        btns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        var mode = btn.getAttribute("data-mode");
        if (mode === "dark") {
          targetImg.src = "assets/PowerCampusMobile-Dark.png";
          targetImg.alt = "PowerCampus Mobile App Dark Mode Interface";
        } else {
          targetImg.src = "assets/PowerCampusMobile-Light.png";
          targetImg.alt = "PowerCampus Mobile App Light Mode Interface";
        }
      });
    });
  }

  // FAQ Accordion
  function initFaqAccordion() {
    var triggers = document.querySelectorAll(".accordion-trigger");
    triggers.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var item = btn.closest(".accordion-item");
        var isActive = item.classList.contains("active");
        
        // Optionally close other items in the same accordion
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
        } else {
          item.classList.remove("active");
          btn.setAttribute("aria-expanded", "false");
        }
      });
    });
  }

  // Product tab switcher
  function initProductTabs() {
    var tabs = document.querySelectorAll(".product-tab-btn");
    if (!tabs.length) return;

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.classList.remove("active"); });
        tab.classList.add("active");
        var targetId = tab.getAttribute("data-target");
        
        var sections = document.querySelectorAll(".product-view-section");
        sections.forEach(function (sec) {
          if (targetId === "all" || sec.id === targetId) {
            sec.style.display = "block";
          } else {
            sec.style.display = "none";
          }
        });
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }

  // Form submission handler (supports both enquiry-form and contact-page-form)
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
        status.style.color = "#F06B52";
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

      status.textContent = "Thank you. Your email app should open with your enquiry ready to send.";
      status.style.color = "#36B8D8";
      form.reset();
    });
  }

  attachFormHandler("enquiry-form", "form-status");
  attachFormHandler("contact-page-form", "contact-form-status");
})();

