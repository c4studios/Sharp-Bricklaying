/* ═══════════════════════════════════════════════════════
   Sharp Bricklaying — Main JavaScript
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── REDUCED MOTION CHECK ─────────────────────────────
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ─── TICKER SETUP ─────────────────────────────────────
  var tickerItems = [
    'Zorzi Builders', 'Beamond Homes', 'Giorgi', 'Summit Homes',
    'As Seen on Channel 9', 'As Seen on Channel 10', 'Perth, WA'
  ];

  var track = document.getElementById('ticker-track');
  if (track) {
    for (var r = 0; r < 2; r++) {
      tickerItems.forEach(function (t) {
        var item = document.createElement('span');
        item.className = 'ticker-item';
        item.textContent = t;
        var sep = document.createElement('span');
        sep.className = 'ticker-sep';
        item.appendChild(sep);
        track.appendChild(item);
      });
    }
    // Pause ticker on hover for readability
    track.addEventListener('mouseenter', function () { track.style.animationPlayState = 'paused'; });
    track.addEventListener('mouseleave', function () { track.style.animationPlayState = 'running'; });
  }

  // ─── NAV SCROLL ───────────────────────────────────────
  var nav = document.getElementById('nav');
  var navLinks = nav ? nav.querySelectorAll('.nav-links a:not(.nav-cta)') : [];

  if (nav) {
    window.addEventListener('scroll', function () {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
  }

  // ─── ACTIVE NAV HIGHLIGHTING ──────────────────────────
  var sections = document.querySelectorAll('section[id]');
  var navMap = {};
  navLinks.forEach(function (link) {
    var hash = link.getAttribute('href');
    if (hash && hash.startsWith('#')) navMap[hash.substring(1)] = link;
  });

  function updateActiveNav() {
    var scrollPos = window.scrollY + 120;
    var current = '';
    sections.forEach(function (section) {
      if (section.offsetTop <= scrollPos) current = section.id;
    });
    navLinks.forEach(function (link) { link.classList.remove('active'); });
    if (current && navMap[current]) navMap[current].classList.add('active');
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });

  // ─── MOBILE MENU ──────────────────────────────────────
  var hamburger = document.getElementById('nav-hamburger');
  var mobileMenu = document.getElementById('mobile-menu');

  function closeMobileMenu() {
    if (!mobileMenu || !hamburger) return;
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('active');
    document.body.style.overflow = '';
    hamburger.setAttribute('aria-expanded', 'false');
  }

  function openMobileMenu() {
    if (!mobileMenu || !hamburger) return;
    mobileMenu.classList.add('open');
    hamburger.classList.add('active');
    document.body.style.overflow = 'hidden';
    hamburger.setAttribute('aria-expanded', 'true');
    // Focus first link for keyboard nav
    var firstLink = mobileMenu.querySelector('a');
    if (firstLink) firstLink.focus();
  }

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
      mobileMenu.classList.contains('open') ? closeMobileMenu() : openMobileMenu();
    });

    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMobileMenu);
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        closeMobileMenu();
        hamburger.focus();
      }
    });
  }

  // ─── PARALLAX HERO ────────────────────────────────────

  // ─── SERVICE CARD → PRE-FILL CONTACT FORM ─────────────
  document.querySelectorAll('.service-link[data-service]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var service = link.getAttribute('data-service');
      var projectSelect = document.getElementById('form-project');
      var messageField = document.getElementById('form-message');

      if (projectSelect) {
        // Set the dropdown to the matching option
        for (var i = 0; i < projectSelect.options.length; i++) {
          if (projectSelect.options[i].value === service) {
            projectSelect.selectedIndex = i;
            break;
          }
        }
      }

      if (messageField && !messageField.value.trim()) {
        var serviceName = link.closest('.service-card').querySelector('h3').textContent;
        messageField.value = "Hi, I'm interested in your " + serviceName + " service. ";
        messageField.placeholder = '';
      }

      // Focus the name field after scroll completes
      setTimeout(function () {
        var nameField = document.getElementById('form-name');
        if (nameField) nameField.focus();
      }, 600);
    });
  });

  // ─── PARALLAX HERO (continued) ────────────────────────
  var heroBg = document.getElementById('hero-bg');
  if (heroBg && !prefersReducedMotion) {
    window.addEventListener('scroll', function () {
      if (window.innerWidth < 900) return;
      heroBg.style.transform = 'translateY(' + (window.scrollY * 0.35) + 'px)';
    }, { passive: true });
  }

  // ─── SCROLL REVEAL ────────────────────────────────────
  if (!prefersReducedMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) e.target.classList.add('visible');
      });
    }, { threshold: 0.08 });

    document.querySelectorAll('section:not(#hero)').forEach(function (s) {
      revealObserver.observe(s);
    });
  } else {
    // If reduced motion, just show everything immediately
    document.querySelectorAll('section:not(#hero)').forEach(function (s) {
      s.classList.add('visible');
    });
  }

  // ─── STAT COUNTER ANIMATION ───────────────────────────
  var statsSection = document.getElementById('stats');
  var statsAnimated = false;

  function animateCounters() {
    if (statsAnimated) return;
    statsAnimated = true;

    document.querySelectorAll('.stat-num').forEach(function (el) {
      var text = el.textContent.trim();
      // Extract the numeric part and suffix (e.g. "200+" -> 200, "+")
      var match = text.match(/^(\d+)(.*)$/);
      if (!match) return;

      var target = parseInt(match[1], 10);
      var suffix = match[2];
      var duration = 1600;
      var startTs = null;

      if (prefersReducedMotion) {
        el.textContent = target + suffix;
        return;
      }

      function step(timestamp) {
        if (!startTs) startTs = timestamp;
        var progress = Math.min((timestamp - startTs) / duration, 1);
        // Ease-out cubic
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  if (statsSection) {
    var statsObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) animateCounters();
      });
    }, { threshold: 0.3 });
    statsObserver.observe(statsSection);
  }

  // ─── BACK TO TOP BUTTON ───────────────────────────────
  var backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', function () {
      backToTop.classList.toggle('visible', window.scrollY > 600);
    }, { passive: true });

    backToTop.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  // ─── CONTACT FORM ────────────────────────────────────
  var contactForm = document.getElementById('contact-form');
  var formStatus = document.getElementById('form-status');
  var submitBtn = contactForm ? contactForm.querySelector('button[type="submit"]') : null;

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = contactForm.querySelector('[name="name"]');
      var email = contactForm.querySelector('[name="email"]');
      var message = contactForm.querySelector('[name="message"]');

      if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
        showFormStatus('Please fill in all required fields.', 'error');
        return;
      }

      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email.value.trim())) {
        showFormStatus('Please enter a valid email address.', 'error');
        return;
      }

      // Check honeypot
      var honeypot = contactForm.querySelector('[name="_gotcha"]');
      if (honeypot && honeypot.value) return;

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
      }

      // Vercel serverless function → Resend, delivers enquiries to luke@sharpbricklaying.com.au
      var ENDPOINT = '/api/send-email';

      var formData = new FormData(contactForm);
      var payload  = {
        name:    (formData.get('name')    || '').toString().trim(),
        email:   (formData.get('email')   || '').toString().trim(),
        phone:   (formData.get('phone')   || '').toString().trim(),
        service: (formData.get('project_type') || '').toString().trim(),
        message: (formData.get('message') || '').toString().trim()
      };

      fetch(ENDPOINT, {
        method:  'POST',
        body:    JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
      })
      .then(function (response) {
        if (response.ok) {
          showFormStatus('Thanks! Your enquiry has been sent. Luke will be in touch shortly.', 'success');
          contactForm.reset();
        } else {
          return response.json().then(function (data) {
            throw new Error(data.error || 'Something went wrong.');
          });
        }
      })
      .catch(function () {
        showFormStatus('Something went wrong. Please email luke@sharpbricklaying.com.au directly.', 'error');
      })
      .finally(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Enquiry';
        }
      });
    });
  }

  function showFormStatus(msg, type) {
    if (!formStatus) return;
    formStatus.textContent = msg;
    formStatus.className = 'form-status ' + type;
    // Auto-clear success after 8 seconds
    if (type === 'success') {
      setTimeout(function () {
        formStatus.className = 'form-status';
        formStatus.textContent = '';
      }, 8000);
    }
  }

  // ─── BRICK LOADER ────────────────────────────────────
  var loader = document.getElementById('loader');
  var canvas = document.getElementById('brick-canvas');
  var pctEl = document.getElementById('loader-pct');
  var wallPanel = document.getElementById('wall-panel');

  // Skip loader for returning visitors or reduced motion
  var hasVisited = false;
  try { hasVisited = sessionStorage.getItem('sharp_visited') === '1'; } catch(e) {}

  if (loader && (hasVisited || prefersReducedMotion)) {
    // Instant skip
    loader.classList.add('done');
    loader.style.display = 'none';
    document.body.classList.remove('loading-active');
    document.querySelectorAll('section:not(#hero)').forEach(function (s) {
      s.classList.add('visible');
    });
    try { sessionStorage.setItem('sharp_visited', '1'); } catch(e) {}
  } else if (loader && canvas && pctEl && wallPanel) {
    var ctx = canvas.getContext('2d');
    var BRICK_W = 76;
    var BRICK_H = 26;
    var MORTAR = 4;
    var STRIDE_W = BRICK_W + MORTAR;
    var STRIDE_H = BRICK_H + MORTAR;
    var W, H, cols, rows;
    var progress = 0;
    var loaderStart = null;
    var DURATION = 2600;

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      cols = Math.ceil(W / STRIDE_W) + 2;
      rows = Math.ceil(H / STRIDE_H) + 2;
    }

    resize();
    window.addEventListener('resize', resize);

    var brickVariants = ['#3A3D42', '#2E3035', '#404449', '#353840', '#3D4046'];

    function brickColor(row, col, totalRows) {
      var isBlueBrick = col === Math.floor(cols * 0.38);
      if (isBlueBrick && row === totalRows - 1) return '#8db4c8';
      return brickVariants[(row * 7 + col * 3) % brickVariants.length];
    }

    function draw(timestamp) {
      if (!loaderStart) loaderStart = timestamp;
      var elapsed = timestamp - loaderStart;
      progress = Math.min(elapsed / DURATION, 1);

      ctx.clearRect(0, 0, W, H);

      var filledRows = Math.ceil(progress * rows);

      for (var r = 0; r < filledRows; r++) {
        var rowY = H - (r + 1) * STRIDE_H;
        var offset = (r % 2 === 0) ? 0 : STRIDE_W / 2;

        for (var c = -1; c < cols + 1; c++) {
          var brickX = c * STRIDE_W - offset;

          var slideProgress = 1;
          if (r === filledRows - 1) {
            var rowFraction = (progress * rows) - (filledRows - 1);
            slideProgress = Math.min(rowFraction * 2.5, 1);
            slideProgress = 1 - Math.pow(1 - slideProgress, 3);
          }

          var slideX = r % 2 === 0
            ? (1 - slideProgress) * (-W * 0.3)
            : (1 - slideProgress) * (W * 0.3);

          var brickXFinal = brickX + slideX;

          ctx.fillStyle = '#d6cfc4';
          ctx.fillRect(brickXFinal, rowY, BRICK_W + MORTAR, BRICK_H + MORTAR);

          ctx.fillStyle = brickColor(r, c, filledRows);
          ctx.fillRect(brickXFinal, rowY, BRICK_W, BRICK_H);

          ctx.fillStyle = 'rgba(255,255,255,0.06)';
          ctx.fillRect(brickXFinal, rowY, BRICK_W, 3);

          ctx.fillStyle = 'rgba(0,0,0,0.08)';
          ctx.fillRect(brickXFinal + BRICK_W * 0.3, rowY + 2, BRICK_W * 0.4, 5);
        }
      }

      pctEl.textContent = Math.round(progress * 100) + '%';

      if (progress < 1) {
        requestAnimationFrame(draw);
      } else {
        setTimeout(function () {
          var imgData = canvas.toDataURL('image/jpeg', 0.85);
          wallPanel.style.backgroundImage = 'url(' + imgData + ')';
          wallPanel.style.backgroundSize = W + 'px ' + H + 'px';
          wallPanel.style.backgroundPosition = 'center center';

          canvas.style.display = 'none';
          loader.style.background = 'transparent';
          loader.classList.add('reveal');

          setTimeout(function () {
            loader.classList.add('done');
            loader.style.display = 'none';
            document.body.classList.remove('loading-active');
            document.querySelectorAll('section:not(#hero)').forEach(function (s) {
              s.classList.add('visible');
            });
            try { sessionStorage.setItem('sharp_visited', '1'); } catch(e) {}
          }, 1150);
        }, 180);
      }
    }

    setTimeout(function () {
      requestAnimationFrame(draw);
    }, 300);
  }

  // ─── CURRENT YEAR IN FOOTER ───────────────────────────
  // Job gallery tabs
  document.querySelectorAll('[data-job-tabs]').forEach(function (tabSet) {
    var tabs = Array.prototype.slice.call(tabSet.querySelectorAll('[data-job-tab]'));
    var panels = Array.prototype.slice.call(tabSet.querySelectorAll('.gallery-job-panel'));
    if (!tabs.length || !panels.length) return;

    function activateTab(nextTab) {
      var panelId = nextTab.getAttribute('data-job-tab');

      tabs.forEach(function (tab) {
        var isActive = tab === nextTab;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        tab.setAttribute('tabindex', isActive ? '0' : '-1');
      });

      panels.forEach(function (panel) {
        var isActive = panel.id === panelId;
        panel.classList.toggle('active', isActive);
        panel.hidden = !isActive;
      });
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener('click', function () {
        activateTab(tab);
      });

      tab.addEventListener('keydown', function (e) {
        var nextIndex = index;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextIndex = (index + 1) % tabs.length;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') nextIndex = (index - 1 + tabs.length) % tabs.length;
        if (e.key === 'Home') nextIndex = 0;
        if (e.key === 'End') nextIndex = tabs.length - 1;
        if (nextIndex === index) return;
        e.preventDefault();
        activateTab(tabs[nextIndex]);
        tabs[nextIndex].focus();
      });
    });
  });

  // Sponsor profile modals (one per sponsor, linked via aria-controls)
  var sponsorProfileTriggers = document.querySelectorAll('[data-sponsor-profile-open]');
  var sponsorProfileLastFocus = null;

  function openSponsorProfile(modal) {
    if (!modal) return;
    sponsorProfileLastFocus = document.activeElement;
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('sponsor-profile-open');

    var closeBtn = modal.querySelector('.sponsor-profile-modal__close');
    if (closeBtn) closeBtn.focus();
  }

  function closeSponsorProfile(modal) {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('sponsor-profile-open');

    if (sponsorProfileLastFocus && typeof sponsorProfileLastFocus.focus === 'function') {
      sponsorProfileLastFocus.focus();
    }
  }

  sponsorProfileTriggers.forEach(function (trigger) {
    var modal = document.getElementById(trigger.getAttribute('aria-controls'));
    if (!modal) return;

    trigger.addEventListener('click', function () {
      openSponsorProfile(modal);
    });

    modal.querySelectorAll('[data-sponsor-profile-close]').forEach(function (el) {
      el.addEventListener('click', function () {
        closeSponsorProfile(modal);
      });
    });

    document.addEventListener('keydown', function (e) {
      if (modal.hidden) return;
      if (e.key === 'Escape') {
        closeSponsorProfile(modal);
        return;
      }
      if (e.key !== 'Tab') return;

      var focusable = modal.querySelectorAll('a[href], button:not([disabled])');
      if (!focusable.length) return;

      var firstFocusable = focusable[0];
      var lastFocusable = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      } else if (!e.shiftKey && document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    });
  });

  var yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ─── AERIAL HERO IMAGE CAROUSEL ───────────────────────
  // Crossfades through all .hero-slide images every INTERVAL ms.
  // First slide gets a longer delay (FIRST_DELAY) to account for the
  // loader animation — ensures the opening photo is visible for a full
  // 5 seconds after the hero becomes visible.
  (function () {
    var slides = document.querySelectorAll('.hero-slide');
    if (!slides.length) return;

    var FIRST_DELAY = 8000; // ms before first transition (loader ~3s + 5s visible)
    var INTERVAL    = 6000; // ms per slide after that
    var current     = 0;

    // Show first slide immediately
    slides[0].classList.add('active');

    if (prefersReducedMotion) return;

    function advance() {
      slides[current].classList.remove('active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('active');
    }

    // Hold opening photo for FIRST_DELAY, then cycle at INTERVAL
    setTimeout(function () {
      advance();
      setInterval(advance, INTERVAL);
    }, FIRST_DELAY);
  }());

})();

