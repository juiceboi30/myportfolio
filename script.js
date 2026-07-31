(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const THEME_KEY = 'site-theme-v1';
  const htmlEl = document.documentElement;

  function applyTheme(theme) {
    htmlEl.classList.remove('light', 'dark');
    if (theme) htmlEl.classList.add(theme);
  }

  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) applyTheme(saved);
  } catch (_) {}

  /* ================= NAV / BURGER ================= */

  const burger = $('.burger');
  const navLinks = $('.nav-links');

  if (burger && navLinks) {
    burger.addEventListener('click', () => {
      const open = navLinks.classList.toggle('active');
      burger.setAttribute('aria-expanded', open);
    });
  }

  $$('nav .nav-links a').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      e.preventDefault();

      navLinks?.classList.remove('active');

      const target = $(href);
      if (!target) return;

      const navHeight = $('nav')?.offsetHeight || 68;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 8;

      window.scrollTo({
        top,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
    });
  });

  /* ================= NAV SCROLL EFFECT ================= */

  const nav = $('nav');
  if (nav) {
    const updateNav = () => {
      const t = clamp(window.scrollY / 160, 0, 1);
      nav.style.backdropFilter = `blur(${6 + t * 6}px)`;
      nav.style.background = `rgba(255,255,255,${0.02 + t * 0.06})`;
      nav.style.boxShadow = t > 0.05 ? 'var(--shadow-md)' : 'var(--shadow-sm)';
    };
    updateNav();
    window.addEventListener('scroll', updateNav, { passive: true });
  }

  /* ================= HERO PARALLAX ================= */

  const hero = $('#hero');
  const heroImg = $('.hero-image img');

  if (hero && heroImg && !prefersReducedMotion) {
    hero.addEventListener('mousemove', e => {
      const r = hero.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      heroImg.style.transform = `translate(${dx * 18}px, ${dy * 18}px)`;
    });

    hero.addEventListener('mouseleave', () => {
      heroImg.style.transform = '';
    });
  }

  /* ================= PROJECT CARD TILT ================= */

  $$('.project-card').forEach(card => {
    if (prefersReducedMotion) return;

    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform =
        `perspective(900px) rotateX(${y * 8}deg) rotateY(${x * -12}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  /* ================= REVEAL ANIMATIONS ================= */

  const reveals = $$('section, .project-card, .skill, .hero-content');

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('reveal--visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });

    reveals.forEach(r => io.observe(r));
  } else {
    reveals.forEach(r => r.classList.add('reveal--visible'));
  }

  /* ================= THEME TOGGLE ================= */

  const themeToggle = $('.theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = htmlEl.classList.contains('light') ? 'dark' : 'light';
      applyTheme(next);

      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (_) {}

      themeToggle.textContent = next === 'light' ? '🌞' : '🌙';
    });
  }

    /* ================= CONTACT FORM ================= */

  const contactForm = $('#contact-form');
  const formMsg = $('#form-msg');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      formMsg.textContent = 'Sending...';
      formMsg.style.color = '#fff';

      const bar = document.createElement('div');
      bar.className = 'submit-progress';
      bar.style.cssText = `
        height:6px;
        width:0%;
        border-radius:6px;
        background:linear-gradient(90deg,var(--brand-accent),var(--brand-primary));
        transition:width .3s ease;
        margin-top:10px;
      `;

      contactForm.appendChild(bar);

      let pct = 20;

      const timer = setInterval(() => {
        pct = Math.min(pct + Math.random() * 15, 90);
        bar.style.width = pct + '%';
      }, 200);

      try {

        const response = await fetch("const response = await fetch("https://myportfolio-2-qhdg.onrender.com/contact", {", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: $("#name").value,
            email: $("#email").value,
            message: $("#message").value
          })
        });

        clearInterval(timer);
        bar.style.width = "100%";

        const result = await response.json();

        if (response.ok) {

          formMsg.textContent =
            result.msg || "Message sent successfully!"

          formMsg.style.color = "lime";

          contactForm.reset();

        } else {

          formMsg.textContent =
            result.msg || "Failed to send message."

          formMsg.style.color = "red";

        }

      } catch (err) {

        clearInterval(timer);

        formMsg.textContent =
          "Server unavailable. Please try again.";

        formMsg.style.color = "red";

      } finally {

        setTimeout(() => {
          bar.remove();
        }, 800);

      }

    });
  }
  /* ================= TAB AWAY TITLE ================= */

  const originalTitle = document.title;
  const awayMessages = [
    '👋 Hey, come back!',
    '🚀 Still exploring my portfolio?',
    '😄 Don’t forget Johnson Koryon!',
    '🔥 Cool stuff waiting here'
  ];

  let msgIndex = 0;
  let titleInterval = null;

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      document.title = awayMessages[msgIndex];
      titleInterval = setInterval(() => {
        msgIndex = (msgIndex + 1) % awayMessages.length;
        document.title = awayMessages[msgIndex];
      }, 1500);
    } else {
      clearInterval(titleInterval);
      titleInterval = null;
      document.title = originalTitle;
    }
  });

  /* ================= SOCIAL ICONS ================= */

  document.querySelectorAll('.social-icons button').forEach(btn => {
    const link = btn.dataset.link;
    if (!link) return;

    btn.addEventListener('click', () => {
      btn.classList.add('icon-active');

      setTimeout(() => {
        window.open(link, '_blank', 'noopener');
        btn.classList.remove('icon-active');
      }, 250);
    });

    btn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
  });

})();
