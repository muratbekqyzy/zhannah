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
    'linear-gradient(135deg,#f9d0db,#f0e6d3)',
    'linear-gradient(135deg,#f0e6d3,#f9d0db)',
    'linear-gradient(135deg,#e8d5f5,#f9d0db)',
    'linear-gradient(135deg,#d5e8f5,#e8d5f5)',
    'linear-gradient(135deg,#f5f0d5,#d5e8f5)'
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

  /* ── HERO CANVAS ─────────────────────────────────────────────── */
  const canvas = document.getElementById('heroCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let W, H, t = 0, raf;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      W = canvas.width  = canvas.offsetWidth  * DPR;
      H = canvas.height = canvas.offsetHeight * DPR;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const cx = W * .52, cy = H * .48;
      const r  = Math.min(W, H) * .24;
      ctx.lineWidth = DPR;
      for (let ring = 0; ring < 18; ring++) {
        const phi = (ring / 17) * Math.PI;
        for (let d = 0; d < 72; d++) {
          const th   = (d / 72) * Math.PI * 2 + t;
          const x    = Math.sin(phi) * Math.cos(th);
          const y    = Math.sin(phi) * Math.sin(th);
          const z    = Math.cos(phi);
          const rot  = t * .3;
          const x2   = x * Math.cos(rot) - z * Math.sin(rot);
          const z2   = x * Math.sin(rot) + z * Math.cos(rot);
          const px   = cx + x2 * r;
          const py   = cy + y  * r;
          const dep  = (z2 + 1) / 2;
          const size = (.6 + dep * 1.4) * DPR;
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(232,${82 + Math.round(dep * 50)},${122 + Math.round(dep * 30)},${.05 + dep * .38})`;
          ctx.fill();
        }
      }
      t += .003;
      raf = requestAnimationFrame(draw);
    }
    draw();
  }

  /* ── INIT ────────────────────────────────────────────────────── */
  renderFilters();
  renderWorks();
  renderSocial();

})();
