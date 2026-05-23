(function () {
  'use strict';

  /* ── CURSOR ─────────────────────────────────────────────────── */
  const cursor = document.querySelector('.cursor');
  const ring   = document.querySelector('.cursor-ring');
  let mx = 0, my = 0, rx = 0, ry = 0;
  if (cursor && ring) {
    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      cursor.style.left = mx + 'px'; cursor.style.top = my + 'px';
    });
    (function loop() {
      rx += (mx - rx) * .12; ry += (my - ry) * .12;
      ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
      requestAnimationFrame(loop);
    })();
  }

  /* ── NAV SCROLL ─────────────────────────────────────────────── */
  const nav = document.querySelector('.site-nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  /* ── MOBILE MENU ─────────────────────────────────────────────── */
  const menuBtn = document.querySelector('.menu-btn');
  const mobileMenu = document.querySelector('.mobile-menu');
  menuBtn?.addEventListener('click', () => mobileMenu.classList.toggle('open'));
  mobileMenu?.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => mobileMenu.classList.remove('open'))
  );

  /* ── SCROLL REVEAL ───────────────────────────────────────────── */
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: .1, rootMargin: '0px 0px -50px 0px' });
  document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

  /* ── HELPERS ─────────────────────────────────────────────────── */
  const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(s) { return String(s).replace(/[&<>"']/g, m => ESC_MAP[m]) }

  const COLORS = [
    'linear-gradient(135deg,#F7C3CF,#C8E6E5)',
    'linear-gradient(135deg,#C8E6E5,#EDE8F9)',
    'linear-gradient(135deg,#EDE8F9,#F7C3CF)',
    'linear-gradient(135deg,#FDF5D0,#C8E6E5)',
    'linear-gradient(135deg,#C9DFC9,#EDE8F9)'
  ];

  /* ── FILTERS & WORK GRID ─────────────────────────────────────── */
  const CATEGORIES = ['All', 'Community / Documentary', 'Travel Recaps', 'Portrait / Visual Diary'];
  const filtersEl = document.getElementById('filters');
  const workGrid  = document.getElementById('workGrid');
  let activeCategory = 'All';

  function renderFilters() {
    filtersEl.innerHTML = CATEGORIES.map(c =>
      `<button class="filter-btn${c === activeCategory ? ' active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`
    ).join('');
    filtersEl.querySelectorAll('.filter-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.cat;
        renderFilters();
        renderWorks();
      })
    );
  }

  function renderWorks() {
    const visible = WORKS.filter(w => activeCategory === 'All' || w.category === activeCategory);
    workGrid.innerHTML = visible.map((w, i) => {
      const important = w.category === 'Community / Documentary' ? ' important' : '';
      const portrait  = w.aspect === 'portrait' ? ' portrait' : '';
      const bg = w.cover ? `url(${w.cover}) center/cover` : COLORS[i % COLORS.length];
      return `
        <article class="poster${important}${portrait} reveal visible" style="--cover:${bg}">
          <div class="poster-content">
            <div class="poster-kicker">${esc(w.date)} · ${esc(w.label)}</div>
            <h3>${esc(w.title)}</h3>
            <p class="poster-note">${esc(w.note)}</p>
            <p class="poster-desc">${esc(w.description)}</p>
            <div class="poster-actions">
              <button class="btn watch"
                data-video="${esc(w.vimeo)}"
                data-title="${esc(w.title)}"
                data-label="${esc(w.label)}"
                data-desc="${esc(w.description)}">Watch film</button>
              <span class="category-pill">${esc(w.category)}</span>
            </div>
          </div>
        </article>`;
    }).join('');
    attachWatchButtons();
  }

  function renderSocial() {
    const socialGrid = document.getElementById('socialGrid');
    socialGrid.innerHTML = SOCIAL_WORKS.map(w => `
      <article class="social-card reveal visible">
        <div>
          <small>${esc(w.date)} · ${esc(w.label)}</small>
          <h3>${esc(w.title)}</h3>
          <p>${esc(w.description)}</p>
        </div>
        <a href="${esc(w.url)}" target="_blank" rel="noopener">Open on Instagram</a>
      </article>`
    ).join('');
  }

  /* ── VIDEO MODAL ─────────────────────────────────────────────── */
  const modal      = document.getElementById('videoModal');
  const modalVideo = document.getElementById('modalVideo');
  const modalTitle = document.getElementById('modalTitle');
  const modalLabel = document.getElementById('modalLabel');
  const modalDesc  = document.getElementById('modalDesc');

  function openModal(url, title, label, desc) {
    modalTitle.textContent = title;
    modalLabel.textContent = label;
    modalDesc.textContent  = desc;
    modalVideo.innerHTML   = `<iframe
      src="${url}?autoplay=1&title=0&byline=0&portrait=0&badge=0&autopause=0"
      allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
      referrerpolicy="strict-origin-when-cross-origin"
      allowfullscreen></iframe>`;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    modalVideo.innerHTML = '';
    document.body.style.overflow = '';
  }

  function attachWatchButtons() {
    document.querySelectorAll('.watch').forEach(btn =>
      btn.addEventListener('click', () =>
        openModal(btn.dataset.video, btn.dataset.title, btn.dataset.label, btn.dataset.desc)
      )
    );
  }

  document.querySelectorAll('[data-close]').forEach(el =>
    el.addEventListener('click', closeModal)
  );
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  /* ── CONTACT FORM ───────────────────────────────────────────── */
  const contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = contactForm.querySelector('button[type="submit"]');
      const errEl = () => {
        let el = contactForm.querySelector('.form-error');
        if (!el) { el = document.createElement('p'); el.className = 'form-error'; contactForm.appendChild(el); }
        return el;
      };

      const data = {
        name:         contactForm.querySelector('[name="name"]').value.trim(),
        email:        contactForm.querySelector('[name="email"]').value.trim(),
        project_type: contactForm.querySelector('[name="project_type"]').value.trim(),
        message:      contactForm.querySelector('[name="message"]').value.trim(),
      };

      btn.textContent = 'Sending…';
      btn.disabled = true;
      const prev = contactForm.querySelector('.form-error');
      if (prev) prev.remove();

      try {
        const res  = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Something went wrong.');

        contactForm.innerHTML = `
          <div class="form-success">
            <div class="success-icon">✦</div>
            <h3>Message sent.</h3>
            <p>Thank you — I'll read this carefully and get back to you soon.</p>
          </div>`;
      } catch (err) {
        errEl().textContent = err.message;
        btn.textContent = 'Send a note';
        btn.disabled = false;
      }
    });
  }

  /* ── HERO CANVAS — BUTTERFLIES ──────────────────────────────── */
  const canvas = document.getElementById('heroCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let W, H;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      W = canvas.width  = canvas.offsetWidth  * DPR;
      H = canvas.height = canvas.offsetHeight * DPR;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Spring palette [r, g, b]
    const PALETTE = [
      [232, 146, 167],   // rose
      [102, 177, 176],   // teal
      [196, 183, 232],   // lilac
      [133, 166, 139],   // sage
      [245, 205, 105],   // gold
      [247, 195, 207],   // blush
    ];

    function mkB() {
      const depth  = 0.3 + Math.random() * 0.7;
      const sz     = (10 + Math.random() * 13) * DPR * (0.45 + depth * 0.55);
      const speed  = (0.18 + Math.random() * 0.32) * DPR * depth;
      const angle  = Math.random() * Math.PI * 2;
      return {
        x: Math.random() * W, y: Math.random() * H,
        sz, depth,
        col: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        alpha: 0.55 + depth * 0.35,

        // velocity
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,

        // body rotation smoothly follows velocity direction
        facing: angle,

        // wander: the butterfly has a slowly drifting "desired direction"
        wanderAngle: Math.random() * Math.PI * 2,
        wanderTurn:  (Math.random() - 0.5) * 0.016,
        wanderTick:  Math.floor(60 + Math.random() * 120),

        // wing flap (speed varies with movement)
        flapPhase: Math.random() * Math.PI * 2,
        flapBase:  0.05 + Math.random() * 0.055,

        // vertical bob (gentle float feeling)
        bobPhase: Math.random() * Math.PI * 2,
        bobAmp:   (0.35 + Math.random() * 0.55) * DPR,
        bobSpeed: 0.022 + Math.random() * 0.022,

        // dart impulse — butterflies make sudden quick direction changes
        dartVx: 0, dartVy: 0,
        dartTick: Math.floor(80 + Math.random() * 200),

        // occasional pause/hover
        hoverTick:    Math.floor(150 + Math.random() * 250),
        hovering:     false,
        hoverFrames:  0,
      };
    }

    const COUNT = 20;
    const bflies = Array.from({ length: COUNT }, mkB);

    function updateB(b) {
      // --- wander: desired direction slowly rotates, occasionally reverses ---
      b.wanderAngle += b.wanderTurn;
      b.wanderTick--;
      if (b.wanderTick <= 0) {
        b.wanderTurn  = (Math.random() - 0.5) * 0.022;
        b.wanderTick  = Math.floor(50 + Math.random() * 130);
      }

      // --- dart impulse ---
      b.dartTick--;
      if (b.dartTick <= 0) {
        const da = Math.random() * Math.PI * 2;
        const ds = (0.9 + Math.random() * 1.4) * DPR * b.depth;
        b.dartVx = Math.cos(da) * ds;
        b.dartVy = Math.sin(da) * ds;
        b.dartTick = Math.floor(90 + Math.random() * 180);
      }
      b.dartVx *= 0.87;
      b.dartVy *= 0.87;

      // --- hover (butterfly pauses mid-air) ---
      b.hoverTick--;
      if (b.hoverTick <= 0 && !b.hovering) {
        b.hovering    = true;
        b.hoverFrames = Math.floor(40 + Math.random() * 80);
        b.hoverTick   = Math.floor(180 + Math.random() * 300);
      }
      if (b.hovering) {
        b.hoverFrames--;
        if (b.hoverFrames <= 0) b.hovering = false;
      }

      const str = b.hovering ? 0.003 : 0.009;
      b.vx += Math.cos(b.wanderAngle) * str * DPR * b.depth;
      b.vy += Math.sin(b.wanderAngle) * str * DPR * b.depth;
      b.vx += b.dartVx * 0.055;
      b.vy += b.dartVy * 0.055;

      // speed cap (hover = much slower)
      const maxSpd = b.hovering
        ? 0.28 * DPR * b.depth
        : 1.1  * DPR * b.depth;
      const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      if (spd > maxSpd) { b.vx = b.vx / spd * maxSpd; b.vy = b.vy / spd * maxSpd; }

      // gentle damping (keeps motion from feeling mechanical)
      const damp = b.hovering ? 0.94 : 0.975;
      b.vx *= damp;
      b.vy *= damp;

      // bob
      b.bobPhase += b.bobSpeed;
      const bob = Math.sin(b.bobPhase) * b.bobAmp * (b.hovering ? 1.4 : 0.7);

      // move
      b.x += b.vx;
      b.y += b.vy + bob * 0.12;

      // facing smoothly tracks velocity
      if (spd > 0.04) {
        const target = Math.atan2(b.vy, b.vx) - Math.PI / 2;
        let diff = target - b.facing;
        while (diff >  Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        b.facing += diff * 0.07;
      }

      // flap speed rises with movement speed (gliding = slower flap)
      const spdRatio = Math.min(spd / maxSpd, 1);
      b.flapPhase += b.flapBase * (0.45 + spdRatio * 0.75);

      // wrap
      if (b.x < -b.sz * 4) b.x = W + b.sz * 3;
      if (b.x > W + b.sz * 4) b.x = -b.sz * 3;
      if (b.y < -b.sz * 4) b.y = H + b.sz * 3;
      if (b.y > H + b.sz * 4) b.y = -b.sz * 3;
    }

    function drawB(b) {
      const [r, g, bc] = b.col;
      const sz   = b.sz;
      const open = Math.abs(Math.cos(b.flapPhase)); // 0=edge-on, 1=fully open
      const wx   = sz * open;                        // actual horizontal wing spread
      const al   = b.alpha * (0.7 + open * 0.3);

      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.facing);

      // glow on all butterflies
      ctx.shadowColor = `rgba(${r},${g},${bc},0.5)`;
      ctx.shadowBlur  = sz * (b.depth > 0.6 ? 1.6 : 0.9);

      // ── upper wings ──
      ctx.beginPath();
      ctx.moveTo(0, -sz * 0.06);
      ctx.bezierCurveTo(-wx * 0.35, -sz * 0.55, -wx * 1.7, -sz * 0.85, -wx * 1.75, -sz * 0.15);
      ctx.bezierCurveTo(-wx * 1.55,  sz * 0.12, -wx * 0.3,  sz * 0.06,  0, -sz * 0.06);
      ctx.moveTo(0, -sz * 0.06);
      ctx.bezierCurveTo( wx * 0.35, -sz * 0.55,  wx * 1.7, -sz * 0.85,  wx * 1.75, -sz * 0.15);
      ctx.bezierCurveTo( wx * 1.55,  sz * 0.12,  wx * 0.3,  sz * 0.06,  0, -sz * 0.06);

      const grU = ctx.createRadialGradient(0, -sz * 0.3, 0, 0, -sz * 0.1, sz * 1.5);
      grU.addColorStop(0,   `rgba(255,255,255,${Math.min(1, al * 1.1)})`);
      grU.addColorStop(0.3, `rgba(${r},${g},${bc},${al})`);
      grU.addColorStop(0.8, `rgba(${r},${g},${bc},${al * 0.7})`);
      grU.addColorStop(1,   `rgba(${r},${g},${bc},0)`);
      ctx.fillStyle = grU;
      ctx.fill();

      // ── lower wings ──
      ctx.beginPath();
      ctx.moveTo(0, sz * 0.06);
      ctx.bezierCurveTo(-wx * 0.28,  sz * 0.22, -wx * 1.05,  sz * 0.88, -wx * 0.75,  sz * 0.58);
      ctx.bezierCurveTo(-wx * 0.42,  sz * 0.28, -wx * 0.08,  sz * 0.1,   0, sz * 0.06);
      ctx.moveTo(0, sz * 0.06);
      ctx.bezierCurveTo( wx * 0.28,  sz * 0.22,  wx * 1.05,  sz * 0.88,  wx * 0.75,  sz * 0.58);
      ctx.bezierCurveTo( wx * 0.42,  sz * 0.28,  wx * 0.08,  sz * 0.1,   0, sz * 0.06);

      const grL = ctx.createRadialGradient(0, sz * 0.5, 0, 0, sz * 0.3, sz);
      grL.addColorStop(0,   `rgba(255,255,255,${Math.min(1, al * 0.9)})`);
      grL.addColorStop(0.4, `rgba(${r},${g},${bc},${al})`);
      grL.addColorStop(1,   `rgba(${r},${g},${bc},0)`);
      ctx.fillStyle = grL;
      ctx.fill();

      // ── body ──
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(0, -sz * 0.42);
      ctx.lineTo(0,  sz * 0.48);
      ctx.strokeStyle = `rgba(${r},${g},${bc},${Math.min(1, al * 0.8)})`;
      ctx.lineWidth   = Math.max(1, 1.5 * DPR);
      ctx.stroke();

      ctx.restore();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      bflies.sort((a, b) => a.depth - b.depth);
      bflies.forEach(b => { updateB(b); drawB(b); });
      setTimeout(draw, 16);
    }
    draw();
  }

  /* ── INIT ────────────────────────────────────────────────────── */
  renderFilters();
  renderWorks();
  renderSocial();

})();
