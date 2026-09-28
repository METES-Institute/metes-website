// ── METES 랜딩페이지 콘텐츠 렌더러 ──
// content/landing.json 을 읽어 페이지를 채웁니다.
// Decap CMS(/admin)에서 그 JSON 파일을 편집하면, 여기서 그 값을 그대로 반영합니다.
// fetch가 실패해도(오프라인 등) HTML에 이미 적혀 있는 값이 그대로 보이도록
// 실패 시에는 아무것도 건드리지 않습니다.

(async function () {
  let data;
  try {
    const res = await fetch('content/landing.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('content fetch failed: ' + res.status);
    data = await res.json();
  } catch (err) {
    console.warn('[landing-render] content/landing.json을 불러오지 못해 기본 HTML을 그대로 둡니다.', err);
    return;
  }

  const $ = (id) => document.getElementById(id);
  const nl2br = (s) => (s || '').replace(/\n/g, '<br>');
  // {{h}}강조{{/h}} 표시를 태그로 바꿔줌. tag는 섹션마다 다름 (h2는 <em>, 문단은 <span class="hl">)
  const hl = (s, tag, cls) => nl2br(s || '').replace(/\{\{h\}\}(.*?)\{\{\/h\}\}/gs, (_, inner) => `<${tag}${cls ? ` class="${cls}"` : ''}>${inner}</${tag}>`);
  const setText = (id, v) => { const el = $(id); if (el && v != null) el.textContent = v; };
  const setHTML = (id, v) => { const el = $(id); if (el && v != null) el.innerHTML = v; };
  const setHref = (id, v) => { const el = $(id); if (el && v != null) el.setAttribute('href', v); };

  // 새로 만들어 넣는 .reveal 요소는 페이지 로드 시 이미 실행된 관찰자가 보지 못하므로
  // 이 스크립트 전용 관찰자를 별도로 둬서 스크롤 등장 애니메이션이 계속 동작하게 함
  const revealObserver = new IntersectionObserver(
    (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revealObserver.unobserve(e.target); } }),
    { threshold: .15 }
  );

  const ICONS = {
    mentoring: '<svg viewBox="0 0 64 64" fill="none" stroke="#141414" stroke-width="2"><circle cx="24" cy="32" r="16"/><circle cx="40" cy="32" r="16"/><circle cx="32" cy="32" r="4" fill="#ff4d1f" stroke="none"/></svg>',
    open: '<svg viewBox="0 0 64 64" fill="none" stroke="#141414" stroke-width="2"><path d="M8 48 A24 24 0 0 1 56 48"/><path d="M16 48 A16 16 0 0 1 48 48"/><path d="M24 48 A8 8 0 0 1 40 48"/><rect x="8" y="48" width="48" height="2" fill="#ff4d1f" stroke="none"/></svg>',
    project: '<svg viewBox="0 0 64 64" fill="none" stroke="#141414" stroke-width="2"><rect x="10" y="10" width="20" height="20"/><rect x="34" y="10" width="20" height="20"/><rect x="10" y="34" width="20" height="20"/><rect x="34" y="34" width="20" height="20" fill="#ff4d1f" stroke="none"/></svg>',
    network: '<svg viewBox="0 0 64 64" fill="none" stroke="#141414" stroke-width="2"><circle cx="12" cy="20" r="5"/><circle cx="52" cy="16" r="5"/><circle cx="20" cy="50" r="5"/><circle cx="48" cy="46" r="5"/><circle cx="34" cy="32" r="6" fill="#ff4d1f" stroke="none"/><path d="M16 23l14 7M47 19L39 28M24 47l6-9M43 43l-6-7"/></svg>',
  };

  // ── Hero ──
  if (data.hero) {
    const h = data.hero;
    setText('hero-badge', h.badge);
    setText('hero-tag', h.tag);
    setHTML('hero-lede', nl2br(h.lede));
    const c1 = $('hero-cta1'), c2 = $('hero-cta2');
    if (c1) { c1.childNodes[0].textContent = (h.cta1_label || '') + ' '; c1.setAttribute('href', h.cta1_url || '#'); }
    if (c2) { c2.textContent = h.cta2_label || ''; c2.setAttribute('href', h.cta2_url || '#'); }
    if (Array.isArray(h.slides) && h.slides.length) {
      const wrap = $('hero-slides');
      if (wrap) {
        wrap.innerHTML = h.slides.map((s, i) =>
          `<div class="hero-slide${i === 0 ? ' active' : ''}" data-caption="${(s.caption || '').replace(/"/g, '&quot;')}" style="background-image:url('${s.img}')"></div>`
        ).join('');
        // 새로 만든 슬라이드로 롤링 로직을 다시 세팅 (기존 index.html 인라인 스크립트의 회전 타이머는
        // 교체 전 노드를 참조하던 채로 남아있지만 화면에서 떨어져나간 노드만 건드려서 무해함)
        const slides = [...wrap.querySelectorAll('.hero-slide')];
        const dots = $('hero-dots');
        const cap = $('hero-caption');
        if (dots) dots.innerHTML = slides.map((_, i) => `<span${i === 0 ? ' class="active"' : ''}></span>`).join('');
        const dotEls = dots ? [...dots.children] : [];
        let i = 0;
        if (cap && slides[0]) cap.textContent = slides[0].dataset.caption;
        const go = (n) => {
          if (!slides.length) return;
          slides[i].classList.remove('active'); if (dotEls[i]) dotEls[i].classList.remove('active');
          i = (n + slides.length) % slides.length;
          slides[i].classList.add('active'); if (dotEls[i]) dotEls[i].classList.add('active');
          if (cap) cap.textContent = slides[i].dataset.caption;
        };
        setInterval(() => go(i + 1), 5000);
      }
    }
  }

  // ── About ──
  if (data.about) {
    const a = data.about;
    setText('about-eyebrow', a.eyebrow);
    setHTML('about-statement', hl(a.statement, 'span', 'hl'));
    const descWrap = $('about-desc');
    if (descWrap && (a.desc1 || a.desc2)) {
      descWrap.innerHTML = [a.desc1, a.desc2].filter(Boolean).map(t => `<p>${nl2br(t)}</p>`).join('');
    }
    const statsWrap = $('about-stats');
    if (statsWrap && Array.isArray(a.stats)) {
      statsWrap.innerHTML = a.stats.map(s => {
        const note = s.note ? ` <span style="opacity:.6">(${s.note})</span>` : '';
        return `<div class="stat"><b>${nl2br(s.number)}</b><span>${s.label || ''}${note}</span></div>`;
      }).join('');
    }
  }

  // ── Roadmap ──
  if (data.roadmap) {
    const r = data.roadmap;
    setText('roadmap-eyebrow', r.eyebrow);
    setHTML('roadmap-title', hl(r.title, 'em'));
    setText('roadmap-lead', r.lead);
    setText('roadmap-badge-status', r.badge_status);
    setText('roadmap-badge-duration', r.badge_duration);
    const blocksWrap = $('roadmap-blocks');
    if (blocksWrap && Array.isArray(r.blocks)) {
      blocksWrap.innerHTML = r.blocks.map(b => `
        <div class="block">
          <span class="num">${b.key || ''}</span><span class="months">${b.start_month || ''} – ${b.end_month || ''}</span>
          <h3>${b.title || ''}</h3>
          <p>${b.desc || ''}</p>
        </div>`).join('');
    }
  }

  // ── Sessions ──
  if (data.sessions) {
    const s = data.sessions;
    setText('sessions-eyebrow', s.eyebrow);
    setHTML('sessions-title', hl(s.title, 'em'));
    const grid = $('sessions-grid');
    if (grid && Array.isArray(s.cards)) {
      grid.innerHTML = s.cards.map((card, i) => {
        const isAccent = i === 1;
        const shape = isAccent ? '<div class="shape shape-grid"></div>' : '<div class="shape shape-rings"></div>';
        const note = card.note ? ` <span style="opacity:.6">(${card.note})</span>` : '';
        const tags = (card.tags || []).map(t => `<li>${t}</li>`).join('');
        return `
        <div class="card ${isAccent ? 'card-accent' : 'card-light'} reveal">
          ${shape}
          <div>
            <span class="eyebrow">${card.day || ''}</span>
            <h3>${nl2br(card.title)}</h3>
            <p>${card.desc || ''}</p>
          </div>
          <div class="stat-panel">
            <ul class="tags">${tags}</ul>
            <div>
              <span class="big">${card.stat_number || ''}</span>
              <span class="stat-cap">${card.stat_caption || ''}${note}</span>
            </div>
          </div>
        </div>`;
      }).join('');
      // 새로 만든 카드들은 이 스크립트 전용 관찰자로 다시 등록
      grid.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
    }
  }

  // ── Offer ──
  if (data.offer) {
    const o = data.offer;
    setText('offer-eyebrow', o.eyebrow);
    const grid = $('offer-grid');
    if (grid && Array.isArray(o.items)) {
      grid.innerHTML = o.items.map(it => `
        <div class="offer-item">
          ${ICONS[it.icon] || ''}
          <h4>${it.title || ''}</h4><p>${it.desc || ''}</p>
        </div>`).join('');
    }
  }

  // ── Members ──
  if (data.members) {
    const m = data.members;
    setText('members-eyebrow', m.eyebrow);
    setHTML('members-title', hl(m.title, 'em'));
    setText('members-desc', m.desc);
    setText('members-note', m.note);

    const nameEl = (n, s) => `<span class="name">${n}${s ? `<small>${s}</small>` : ''}</span>`;
    const meisters = m.meisters || [];
    const makers = m.makers || [];
    const moderators = m.moderators || [];
    const half = Math.ceil(meisters.length / 2);
    setHTML('strip-meister-a', meisters.slice(0, half).map(n => nameEl(n)).join(''));
    setHTML('strip-meister-b', meisters.slice(half).map(n => nameEl(n)).join(''));
    setHTML('strip-maker-a', makers.map(mk => nameEl(mk.name, mk.cohorts ? 'C' + mk.cohorts : '')).join(''));
    setHTML('strip-mod', moderators.concat(moderators, moderators).map(n => nameEl(n, 'Moderator')).join(''));
    // 무한 롤링을 위해 트랙 내용을 2배로 복제
    document.querySelectorAll('[data-dup]').forEach(t => { t.innerHTML += t.innerHTML; });
  }

  // ── CTA ──
  if (data.cta) {
    const c = data.cta;
    setText('cta-badge', c.badge);
    setHTML('cta-title', nl2br(c.title));
    setText('cta-desc', c.desc);
  }
  if (data.hero) {
    const c1 = $('cta-cta1'), c2 = $('cta-cta2');
    if (c1) { c1.childNodes[0].textContent = (data.hero.cta1_label || '') + ' '; c1.setAttribute('href', data.hero.cta1_url || '#'); }
    if (c2) { c2.textContent = data.hero.cta2_label || ''; c2.setAttribute('href', data.hero.cta2_url || '#'); }
  }

  // ── Footer ──
  if (data.footer) {
    const f = data.footer;
    setHTML('footer-desc', nl2br(f.desc));
    setText('footer-email', f.email);
    setHref('footer-email', f.email ? 'mailto:' + f.email : null);
    setHref('footer-instagram', f.instagram_url);
    setHref('footer-newsletter', f.newsletter_url);
    setHTML('footer-address', nl2br(f.address));
    setText('footer-copyright', f.copyright);
    setText('footer-poweredby', f.poweredby);
  }

  // 콘텐츠 교체가 끝난 뒤 커스텀 이벤트 (다른 스크립트가 필요하면 사용)
  document.dispatchEvent(new CustomEvent('landing-content-ready', { detail: data }));
})();
