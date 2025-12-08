// script.js — glassmorphism + micro-interactions (updated theme restore earlier)
/* Features:
 - burger toggle (existing)
 - smooth scroll (existing)
 - nav frosted blur on scroll
 - hero parallax (mouse & touch)
 - project-card tilt + shine
 - reveal-on-scroll (glass fade + translate)
 - animate progress bars when visible
 - theme toggle (persisted to localStorage) — restored early so CSS theme is applied before layout scripts
 - simple contact form send UI
*/

(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------
     Helper utilities
     ------------------ */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ------------------
     Theme: restore early so CSS sees the correct class
     ------------------ */
  const THEME_KEY = 'site-theme-v1';
  const htmlEl = document.documentElement;

  function applyTheme(theme) {
    if (theme === 'light') {
      htmlEl.classList.remove('dark');
      htmlEl.classList.add('light');
    } else if (theme === 'dark') {
      htmlEl.classList.remove('light');
      htmlEl.classList.add('dark');
    } else {
      htmlEl.classList.remove('light','dark');
    }
  }

  // restore saved theme immediately
  (function restoreTheme() {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved) applyTheme(saved);
      // no saved: fall back to system (prefers-color-scheme)
    } catch (err) {
      // ignore storage errors (e.g., in incognito)
    }
  })();

  /* ------------------
     Burger nav toggle
     ------------------ */
  const burger = $('.burger');
  const navLinks = $('.nav-links');
  if (burger && navLinks) {
    burger.addEventListener('click', () => {
      const expanded = navLinks.classList.toggle('active');
      // Keep aria-expanded on burger for screen readers
      const isExpanded = navLinks.classList.contains('active');
      burger.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    });
  }

  /* ------------------
     Smooth scroll for nav links
     ------------------ */
  const navAnchors = $$('nav .nav-links a');
  navAnchors.forEach(link => {
    link.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      e.preventDefault();
      navLinks && navLinks.classList.remove('active');
      const target = document.querySelector(href);
      if (!target) return;
      // compute offset (nav height)
      const navHeight = document.querySelector('nav')?.offsetHeight || 68;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 8;
      window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  });

  /* ------------------
     Nav: frosted blur & elevation on scroll
     ------------------ */
  const nav = $('nav');
  if (nav) {
    const applyNavStyle = () => {
      const y = window.scrollY;
      // progress 0..1 for first 160px
      const t = clamp(y / 160, 0, 1);
      // increase blur and darken background slightly as we scroll
      const blur = 6 + t * 6; // 6 -> 12
      const alpha = 0.02 + t * 0.06; // 0.02 -> 0.08

      // use CSS variable for overlay color so themes can control whether overlay is light/dark
      const r = getComputedStyle(document.documentElement).getPropertyValue('--nav-overlay-r') || '255';
      const g = getComputedStyle(document.documentElement).getPropertyValue('--nav-overlay-g') || '255';
      const b = getComputedStyle(document.documentElement).getPropertyValue('--nav-overlay-b') || '255';

      nav.style.backdropFilter = `blur(${blur}px) saturate(${1 + t * 0.15})`;
      nav.style.background = `linear-gradient(180deg, rgba(${r},${g},${b},${alpha}) , rgba(${r},${g},${b},${alpha * 0.2}))`;
      nav.style.borderBottomColor = `rgba(${r},${g},${b},${alpha * 1.2})`;
      nav.style.boxShadow = t > 0.02 ? 'var(--shadow-md)' : 'var(--shadow-sm)';
    };
    applyNavStyle();
    window.addEventListener('scroll', applyNavStyle, { passive: true });
  }

  /* ------------------
     Hero Parallax (mouse & touch)
     ------------------ */
  const hero = $('#hero');
  const heroImage = $('.hero-image img');

  if (hero && heroImage && !prefersReducedMotion) {
    let rafId = null;
    let clientX = 0;
    let clientY = 0;

    const onMove = (x, y) => {
      clientX = x;
      clientY = y;
      if (rafId == null) {
        rafId = requestAnimationFrame(() => {
          const rect = hero.getBoundingClientRect();
          // center origin
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = (clientX - cx) / rect.width;  // -0.5 .. 0.5
          const dy = (clientY - cy) / rect.height;
          const tx = clamp(dx * 18, -18, 18); // translate px
          const ty = clamp(dy * 18, -18, 18);
          // subtle 3D tilt + translate
          heroImage.style.transform = `translate3d(${tx}px, ${ty}px, 0) rotate(${tx * -0.04}deg)`;
          rafId = null;
        });
      }
    };

    // mouse
    hero.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
    // touch
    hero.addEventListener('touchmove', e => {
      const t = e.touches[0];
      if (t) onMove(t.clientX, t.clientY);
    }, { passive: true });
    // reset on leave
    hero.addEventListener('mouseleave', () => {
      heroImage.style.transform = '';
    });
  }

  /* ------------------
     Project cards tilt + shine
     ------------------ */
  const cards = $$('.project-card');
  cards.forEach(card => {
    // create shine overlay
    const shine = document.createElement('div');
    shine.className = 'card-shine';
    Object.assign(shine.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      pointerEvents: 'none',
      borderRadius: getComputedStyle(card).borderRadius || '12px',
      mixBlendMode: 'overlay',
      transition: 'opacity 350ms var(--ease), transform 350ms var(--ease)',
      opacity: '0',
      background: 'linear-gradient(120deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02) 40%, rgba(255,255,255,0.00) 80%)'
    });
    card.appendChild(shine);

    if (prefersReducedMotion) return;

    let raf = null;
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width; // 0..1
      const py = (e.clientY - rect.top) / rect.height;
      const rx = (py - 0.5) * 8; // rotateX
      const ry = (px - 0.5) * -12; // rotateY
      const tx = (px - 0.5) * 6; // translateX
      const ty = (py - 0.5) * 6; // translateY

      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translate3d(${tx}px, ${ty}px, 0)`;
        card.style.transition = 'transform 220ms var(--ease)';
        shine.style.opacity = '1';
        // move the shine gradient to follow cursor
        const angle = Math.atan2(py - 0.5, px - 0.5) * (180 / Math.PI);
        shine.style.transform = `translate3d(${(px - 0.5) * 40}px, ${(py - 0.5) * 40}px, 0) rotate(${angle}deg)`;
      });
    });

    card.addEventListener('mouseleave', () => {
      if (raf) cancelAnimationFrame(raf);
      card.style.transform = '';
      shine.style.opacity = '0';
      shine.style.transform = '';
    });
  });

  /* ------------------
     Reveal on scroll + progress bar animation
     ------------------ */
  const reveals = $$('section, .project-card, .skill, .hero-content');
  const progressBars = $$('.progress-bar > div');

  if ('IntersectionObserver' in window) {
    const obsOptions = { root: null, rootMargin: '0px', threshold: 0.12 };
    const io = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        const el = entry.target;
        if (entry.isIntersecting) {
          el.classList.add('reveal--visible'); // add class for CSS to animate glass/fade
          // if it's in a project card, boost box-shadow
          if (el.classList.contains('project-card')) {
            el.style.boxShadow = 'var(--shadow-md)';
            el.style.borderColor = 'rgba(0,255,208,0.04)';
          }
          // animate contained progress bars
          const innerBars = el.querySelectorAll?.('.progress-bar > div') || [];
          innerBars.forEach(b => {
            const pct = b.getAttribute('data-pct') || b.style.width || '70%';
            let width = pct.toString();
            if (!width.includes('%')) width = width + '%';
            setTimeout(() => { b.style.width = width; }, 120);
          });

          // animate global progress bars if the section has them
          progressBars.forEach(b => {
            if (!b.dataset._animated) {
              const pct = b.getAttribute('data-pct') || b.style.width || '70%';
              let width = pct.toString();
              if (!width.includes('%')) width = width + '%';
              b.style.width = width;
              b.dataset._animated = '1';
            }
          });

          observer.unobserve(el);
        }
      });
    }, obsOptions);

    reveals.forEach(r => io.observe(r));
  } else {
    reveals.forEach(r => r.classList.add('reveal--visible'));
    progressBars.forEach(b => {
      const pct = b.getAttribute('data-pct') || b.style.width || '70%';
      b.style.width = pct.includes('%') ? pct : pct + '%';
    });
  }

  /* ------------------
     Theme toggle (persisted)
     ------------------ */
  const themeToggle = $('.theme-toggle');
  if (themeToggle) {
    // initialize button state and label
    const current = htmlEl.classList.contains('light') ? 'light' : htmlEl.classList.contains('dark') ? 'dark' : (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    themeToggle.setAttribute('aria-pressed', current === 'dark' ? 'false' : 'true');
    themeToggle.textContent = current === 'light' ? '🌞' : '🌙';

    themeToggle.addEventListener('click', () => {
      const now = htmlEl.classList.contains('light') ? 'light' : htmlEl.classList.contains('dark') ? 'dark' : null;
      const next = now === 'light' ? 'dark' : 'light';
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
      // update control visuals
      themeToggle.animate([{ transform: 'scale(0.96)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'cubic-bezier(.22,.9,.28,1)' });
      themeToggle.setAttribute('aria-pressed', next === 'light' ? 'true' : 'false');
      themeToggle.textContent = next === 'light' ? '🌞' : '🌙';
    });

    // keyboard accessibility
    themeToggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        themeToggle.click();
      }
    });
  }

  /* ------------------
     Contact form send UI
     ------------------ */
  const contactForm = $('#contact-form');
  const formMsg = $('#form-msg');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (formMsg) formMsg.textContent = 'Sending...';
      // fake send progress (visual only)
      let progress = 0;
      const progElem = document.createElement('div');
      progElem.className = 'submit-progress';
      Object.assign(progElem.style, {
        height: '6px',
        width: '0%',
        borderRadius: '6px',
        background: 'linear-gradient(90deg,var(--brand-accent),var(--brand-primary))',
        transition: 'width 400ms var(--ease)',
        marginTop: '10px'
      });
      contactForm.appendChild(progElem);
      const step = () => {
        progress += Math.random() * 28 + 18; // random increment
        progElem.style.width = `${Math.min(progress, 100)}%`;
        if (progress < 100) {
          setTimeout(step, 260);
        } else {
          progElem.style.width = '100%';
          if (formMsg) formMsg.textContent = 'Message sent — thanks!';
          setTimeout(() => progElem.remove(), 900);
          contactForm.reset();
        }
      };
      step();
    });
  }

  /* ------------------
     small accessibility: keyboard support to toggle nav
     ------------------ */
  if (burger) {
    burger.setAttribute('role', 'button');
    burger.setAttribute('tabindex', '0');
    burger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navLinks && navLinks.classList.toggle('active');
      }
    });
  }

  /* ------------------
     END
     ------------------ */
})();
