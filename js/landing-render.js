// ── METES 랜딩페이지 콘텐츠 렌더러 ──
// content/landing.json 을 읽어 페이지를 채웁니다.
// Decap CMS(/admin)나 js/inline-editor.js에서 그 JSON을 편집하면, 여기서 그 값을 그대로 반영합니다.
// fetch가 실패해도(오프라인 등) HTML에 이미 적혀 있는 값이 그대로 보이도록
// 실패 시에는 아무것도 건드리지 않습니다.
//
// 모든 데이터 요소에는 data-path 속성을 붙여서, "이 화면 조각 = JSON의 어느 경로"인지
// 표시해둡니다. js/inline-editor.js가 이 속성을 보고 어떤 요소든 편집 가능하게 만듭니다.
// {{h}}강조{{/h}} 문법이나 줄바꿈(\n)이 섞인 항목은 data-format="raw"를 붙여서,
// 편집 모드에서는 그 원본 문법 그대로 보여주고(예쁘게 렌더링하지 않고), 저장 시 그 문법 그대로 씁니다.

function renderLandingContent(data) {
  const $ = (id) => document.getElementById(id);
  const nl2br = (s) => (s || '').replace(/\n/g, '<br>');
  // {{h}}강조{{/h}} 표시를 태그로 바꿔줌. tag는 섹션마다 다름 (h2는 <em>, 문단은 <span class="hl">)
  const hl = (s, tag, cls) => nl2br(s || '').replace(/\{\{h\}\}(.*?)\{\{\/h\}\}/gs, (_, inner) => `<${tag}${cls ? ` class="${cls}"` : ''}>${inner}</${tag}>`);
  const esc = (s) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const setText = (id, v) => { const el = $(id); if (el && v != null) el.textContent = v; };
  const setHTML = (id, v) => { const el = $(id); if (el && v != null) el.innerHTML = v; };
  const setHref = (id, v) => { const el = $(id); if (el && v != null) el.setAttribute('href', v); };
  // {{h}}..{{/h}} 나 줄바꿈(\n)이 섞인 필드: 평소엔 예쁘게(hl) 렌더링하고,
  // data-path/data-format="raw"만 표시해둬서 편집 모드 진입 시 원본 문법으로 바꿔 보여주게 함
  const setRaw = (id, path, v, tag, cls) => {
    const el = $(id); if (!el || v == null) return;
    el.innerHTML = hl(v, tag || 'span', cls);
    el.setAttribute('data-path', path);
    el.setAttribute('data-format', 'raw');
  };
  const markPath = (id, path) => { const el = $(id); if (el) el.setAttribute('data-path', path); };

  const ICONS = {
    mentoring: '<svg viewBox="0 0 64 64" fill="none" stroke="#141414" stroke-width="2"><circle cx="24" cy="32" r="16"/><circle cx="40" cy="32" r="16"/><circle cx="32" cy="32" r="4" fill="#ff4d1f" stroke="none"/></svg>',
    open: '<svg viewBox="0 0 64 64" fill="none" stroke="#141414" stroke-width="2"><path d="M8 48 A24 24 0 0 1 56 48"/><path d="M16 48 A16 16 0 0 1 48 48"/><path d="M24 48 A8 8 0 0 1 40 48"/><rect x="8" y="48" width="48" height="2" fill="#ff4d1f" stroke="none"/></svg>',
    project: '<svg viewBox="0 0 64 64" fill="none" stroke="#141414" stroke-width="2"><rect x="10" y="10" width="20" height="20"/><rect x="34" y="10" width="20" height="20"/><rect x="10" y="34" width="20" height="20"/><rect x="34" y="34" width="20" height="20" fill="#ff4d1f" stroke="none"/></svg>',
    network: '<svg viewBox="0 0 64 64" fill="none" stroke="#141414" stroke-width="2"><circle cx="12" cy="20" r="5"/><circle cx="52" cy="16" r="5"/><circle cx="20" cy="50" r="5"/><circle cx="48" cy="46" r="5"/><circle cx="34" cy="32" r="6" fill="#ff4d1f" stroke="none"/><path d="M16 23l14 7M47 19L39 28M24 47l6-9M43 43l-6-7"/></svg>',
  };

  // ── Hero ──
  if (data.hero) {
    const h = data.hero;
    setText('hero-badge', h.badge); markPath('hero-badge', 'hero.badge');
    setText('hero-tag', h.tag); markPath('hero-tag', 'hero.tag');
    setRaw('hero-lede', 'hero.lede', h.lede, 'span');
    // cta1(Interest Form)은 안에 화살표 아이콘(<span class="arrow">)이 같이 들어있어서
    // 통째로 contenteditable로 두면 실수로 화살표까지 지워질 수 있어 라벨만 별도 span으로 감싸 편집 가능하게 함
    const c1 = $('hero-cta1'), c2 = $('hero-cta2');
    if (c1) { const label = c1.querySelector('.btn-label'); if (label) { label.textContent = h.cta1_label || ''; label.setAttribute('data-path', 'hero.cta1_label'); } c1.setAttribute('href', h.cta1_url || '#'); }
    if (c2) { c2.textContent = h.cta2_label || ''; c2.setAttribute('href', h.cta2_url || '#'); c2.setAttribute('data-path', 'hero.cta2_label'); }
    if (Array.isArray(h.slides) && h.slides.length) {
      const wrap = $('hero-slides');
      if (wrap) {
        wrap.innerHTML = h.slides.map((s, i) =>
          `<div class="hero-slide${i === 0 ? ' active' : ''}" data-caption="${(s.caption || '').replace(/"/g, '&quot;')}" style="background-image:url('${s.img}')"></div>`
        ).join('');
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
        if (!window.__heroRotationStarted) { window.__heroRotationStarted = true; setInterval(() => go(i + 1), 5000); }
      }
    }
  }

  // ── About ──
  if (data.about) {
    const a = data.about;
    setText('about-eyebrow', a.eyebrow); markPath('about-eyebrow', 'about.eyebrow');
    setRaw('about-statement', 'about.statement', a.statement, 'span', 'hl');
    const descWrap = $('about-desc');
    if (descWrap) {
      descWrap.innerHTML = `<p data-path="about.desc1">${esc(a.desc1 || '')}</p><p data-path="about.desc2">${esc(a.desc2 || '')}</p>`;
    }
    const statsWrap = $('about-stats');
    if (statsWrap && Array.isArray(a.stats)) {
      statsWrap.innerHTML = a.stats.map((s, i) => {
        const note = s.note ? ` <span style="opacity:.6" data-path="about.stats.${i}.note">(${s.note})</span>` : `<span style="display:none" data-path="about.stats.${i}.note"></span>`;
        return `<div class="stat"><b data-path="about.stats.${i}.number" data-format="raw">${hl(s.number, 'span')}</b><span><span data-path="about.stats.${i}.label">${s.label || ''}</span> ${note}</span></div>`;
      }).join('');
    }
  }

  // ── Roadmap ──
  if (data.roadmap) {
    const r = data.roadmap;
    setText('roadmap-eyebrow', r.eyebrow); markPath('roadmap-eyebrow', 'roadmap.eyebrow');
    setRaw('roadmap-title', 'roadmap.title', r.title, 'em');
    setText('roadmap-lead', r.lead); markPath('roadmap-lead', 'roadmap.lead');
    setText('roadmap-badge-status', r.badge_status); markPath('roadmap-badge-status', 'roadmap.badge_status');
    setText('roadmap-badge-duration', r.badge_duration); markPath('roadmap-badge-duration', 'roadmap.badge_duration');
    const blocksWrap = $('roadmap-blocks');
    if (blocksWrap && Array.isArray(r.blocks)) {
      blocksWrap.innerHTML = r.blocks.map((b, i) => `
        <div class="block">
          <span class="num" data-path="roadmap.blocks.${i}.key">${b.key || ''}</span><span class="months"><span data-path="roadmap.blocks.${i}.start_month">${b.start_month || ''}</span> – <span data-path="roadmap.blocks.${i}.end_month">${b.end_month || ''}</span></span>
          <h3 data-path="roadmap.blocks.${i}.title">${b.title || ''}</h3>
          <p data-path="roadmap.blocks.${i}.desc">${b.desc || ''}</p>
        </div>`).join('');
    }
  }

  // ── Sessions ──
  if (data.sessions) {
    const s = data.sessions;
    setText('sessions-eyebrow', s.eyebrow); markPath('sessions-eyebrow', 'sessions.eyebrow');
    setRaw('sessions-title', 'sessions.title', s.title, 'em');
    const grid = $('sessions-grid');
    if (grid && Array.isArray(s.cards)) {
      grid.innerHTML = s.cards.map((card, ci) => {
        const isAccent = ci === 1;
        const shape = isAccent ? '<div class="shape shape-grid"></div>' : '<div class="shape shape-rings"></div>';
        const note = card.note ? ` <span style="opacity:.6" data-path="sessions.cards.${ci}.note">(${card.note})</span>` : `<span style="display:none" data-path="sessions.cards.${ci}.note"></span>`;
        const tags = (card.tags || []).map((t, ti) => `<li data-path="sessions.cards.${ci}.tags.${ti}">${t}</li>`).join('');
        return `
        <div class="card ${isAccent ? 'card-accent' : 'card-light'} reveal">
          ${shape}
          <div>
            <span class="eyebrow" data-path="sessions.cards.${ci}.day">${card.day || ''}</span>
            <h3 data-path="sessions.cards.${ci}.title" data-format="raw">${hl(card.title, 'span')}</h3>
            <p data-path="sessions.cards.${ci}.desc">${card.desc || ''}</p>
          </div>
          <div class="stat-panel">
            <ul class="tags">${tags}</ul>
            <div>
              <span class="big" data-path="sessions.cards.${ci}.stat_number">${card.stat_number || ''}</span>
              <span class="stat-cap"><span data-path="sessions.cards.${ci}.stat_caption">${card.stat_caption || ''}</span>${note}</span>
            </div>
          </div>
        </div>`;
      }).join('');
      grid.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
    }
  }

  // ── Offer ──
  if (data.offer) {
    const o = data.offer;
    setText('offer-eyebrow', o.eyebrow); markPath('offer-eyebrow', 'offer.eyebrow');
    const grid = $('offer-grid');
    if (grid && Array.isArray(o.items)) {
      grid.innerHTML = o.items.map((it, i) => `
        <div class="offer-item">
          ${ICONS[it.icon] || ''}
          <h4 data-path="offer.items.${i}.title">${it.title || ''}</h4><p data-path="offer.items.${i}.desc">${it.desc || ''}</p>
        </div>`).join('');
    }
  }

  // ── Members ──
  if (data.members) {
    const m = data.members;
    setText('members-eyebrow', m.eyebrow); markPath('members-eyebrow', 'members.eyebrow');
    setRaw('members-title', 'members.title', m.title, 'em');
    setText('members-desc', m.desc); markPath('members-desc', 'members.desc');
    setText('members-note', m.note); markPath('members-note', 'members.note');

    // 이름 롤링 띠지는 애니메이션 때문에 내용이 통째로 2배 복제되어 흐릅니다.
    // (마우스를 올리면 멈추는 그 효과) 그래서 이 부분은 한 글자씩 화면에서 바로 고치는 게 아니라
    // 아래 "전체 JSON 편집" 칸에서 이름을 추가/삭제/수정하도록 안내만 남겨둡니다.
    const nameEl = (n, s) => `<span class="name">${n}${s ? `<small>${s}</small>` : ''}</span>`;
    const meisters = m.meisters || [];
    const makers = m.makers || [];
    const moderators = m.moderators || [];
    const half = Math.ceil(meisters.length / 2);
    setHTML('strip-meister-a', meisters.slice(0, half).map(n => nameEl(n)).join(''));
    setHTML('strip-meister-b', meisters.slice(half).map(n => nameEl(n)).join(''));
    setHTML('strip-maker-a', makers.map(mk => nameEl(mk.name, mk.cohorts ? 'C' + mk.cohorts : '')).join(''));
    setHTML('strip-mod', moderators.concat(moderators, moderators).map(n => nameEl(n, 'Moderator')).join(''));
    document.querySelectorAll('[data-dup]').forEach(t => { if (!t.dataset.duped) { t.innerHTML += t.innerHTML; t.dataset.duped = '1'; } });
  }

  // ── CTA ──
  if (data.cta) {
    const c = data.cta;
    setText('cta-badge', c.badge); markPath('cta-badge', 'cta.badge');
    setRaw('cta-title', 'cta.title', c.title, 'span');
    setText('cta-desc', c.desc); markPath('cta-desc', 'cta.desc');
  }
  if (data.hero) {
    const c1 = $('cta-cta1'), c2 = $('cta-cta2');
    if (c1) { const label = c1.querySelector('.btn-label'); if (label) label.textContent = data.hero.cta1_label || ''; c1.setAttribute('href', data.hero.cta1_url || '#'); }
    if (c2) { c2.textContent = data.hero.cta2_label || ''; c2.setAttribute('href', data.hero.cta2_url || '#'); }
  }

  // ── Footer ──
  if (data.footer) {
    const f = data.footer;
    setRaw('footer-desc', 'footer.desc', f.desc, 'span');
    setText('footer-email', f.email); markPath('footer-email', 'footer.email');
    setHref('footer-email', f.email ? 'mailto:' + f.email : null);
    setHref('footer-instagram', f.instagram_url); markPath('footer-instagram', 'footer.instagram_url');
    setHref('footer-newsletter', f.newsletter_url); markPath('footer-newsletter', 'footer.newsletter_url');
    setRaw('footer-address', 'footer.address', f.address, 'span');
    setText('footer-copyright', f.copyright); markPath('footer-copyright', 'footer.copyright');
    setText('footer-poweredby', f.poweredby); markPath('footer-poweredby', 'footer.poweredby');
  }
}

// 새로 만든 .reveal 요소(세션 카드)는 초기 로드 시 관찰자가 못 보므로 이 스크립트 전용 관찰자를 둠
const revealObserver = new IntersectionObserver(
  (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revealObserver.unobserve(e.target); } }),
  { threshold: .15 }
);

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
  window.__landingData = data;
  renderLandingContent(data);
  document.dispatchEvent(new CustomEvent('landing-content-ready', { detail: data }));
})();
