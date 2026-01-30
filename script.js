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
      window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  });

  const nav = $('nav');
  if (nav) {
    const updateNav = () => {
      const t = clamp(window.scrollY / 160, 0, 1);
      const blur = 6 + t * 6;
      const alpha = 0.02 + t * 0.06;
      nav.style.backdropFilter = `blur(${blur}px)`;
      nav.style.background = `rgba(255,255,255,${alpha})`;
      nav.style.boxShadow = t > 0.05 ? 'var(--shadow-md)' : 'var(--shadow-sm)';
    };
    updateNav();
    window.addEventListener('scroll', updateNav, { passive: true });
  }

  const hero = $('#hero');
  const heroImg = $('.hero-image img');

  if (hero && heroImg && !prefersReducedMotion) {
    hero.addEventListener('mousemove', e => {
      const r = hero.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      heroImg.style.transform = `translate(${dx * 18}px, ${dy * 18}px)`;
    });
    hero.addEventListener('mouseleave', () => heroImg.style.transform = '');
  }

  $$('.project-card').forEach(card => {
    if (prefersReducedMotion) return;
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform =
        `perspective(900px) rotateX(${y * 8}deg) rotateY(${x * -12}deg)`;
    });
    card.addEventListener('mouseleave', () => card.style.transform = '');
  });

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

  const themeToggle = $('.theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = htmlEl.classList.contains('light') ? 'dark' : 'light';
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (_) {}
      themeToggle.textContent = next === 'light' ? '🌞' : '🌙';
    });
  }

  const contactForm = $('#contact-form');
  const formMsg = $('#form-msg');

  if (contactForm) {
    contactForm.addEventListener('submit', async e => {
      e.preventDefault();

      formMsg.textContent = 'Sending...';

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
        const res = await fetch(contactForm.action, {
          method: 'POST',
          body: new FormData(contactForm),
          headers: { Accept: 'application/json' }
        });

        clearInterval(timer);
        bar.style.width = '100%';

        if (res.ok) {
          formMsg.textContent = 'Message sent — thanks!';
          contactForm.reset();
        } else {
          formMsg.textContent = 'Submission failed. Try again.';
        }
      } catch {
        clearInterval(timer);
        formMsg.textContent = 'Network error. Please try again.';
      } finally {
        setTimeout(() => bar.remove(), 800);
      }
    });
  }

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
})();
