// ── METES 랜딩페이지 콘텐츠 렌더러 ──
// content/landing.json 을 읽어 페이지를 채웁니다.
// Decap CMS(/admin)나 js/inline-editor.js에서 그 JSON을 편집하면, 여기서 그 값을 그대로 반영합니다.
//
// 모든 데이터 요소에는 data-path 속성을 붙여서, "이 화면 조각 = JSON의 어느 경로"인지
// 표시해둡니다. js/inline-editor.js가 이 속성을 보고 어떤 요소든 편집 가능하게 만듭니다.
// {{h}}강조{{/h}} 문법이나 줄바꿈(\n)이 섞인 항목은 data-format="raw"를 붙여서,
// 편집 모드에서는 그 원본 문법 그대로 보여주고(예쁘게 렌더링하지 않고), 저장 시 그 문법 그대로 씁니다.
//
// content/landing.json을 fetch()로 못 읽어오는 상황(파일을 더블클릭해서 file:// 로 그냥 열었을 때,
// Chrome이 로컬 파일에 대한 fetch를 막아서 실패함 · 오프라인 등)에도 data-path가 항상 붙어있고
// 편집이 계속 되도록, 이 파일 안에 content/landing.json과 "같은 내용"을 그대로 복사해둡니다.
// (fetch에 성공하면 이 값 대신 그 최신 내용을 씀 — 두 값이 벌어지면 이 값도 같이 업데이트할 것)
const FALLBACK_LANDING_DATA = {"hero": {"badge": "Cohort 5 Now Open", "tag": "", "lede": "경계 없는 사람들이 모여 함께 배우고 성장하는\n스타트업 성장 커뮤니티", "cta1_label": "Interest Form", "cta1_url": "https://forms.gle/9ke7W7iYXgfMcE257", "cta2_label": "Mailing List", "cta2_url": "https://metes.stibee.com/", "slides": [{"img": "https://lh3.googleusercontent.com/d/1EUx0gxlnrEfQGHUjQ3Pk4XEaQ4cVwcqX=w1600", "caption": "METES Forum · 박지혜 마이스터"}, {"img": "https://lh3.googleusercontent.com/d/1gz3RLeCuIkvhdsFhyGSCSEkizqv6tjc2=w1600", "caption": "Tuesday Session · 최희진 마이스터"}, {"img": "https://lh3.googleusercontent.com/d/1NGBrFCT0UoRe8MocgcCuufwQc4V2aghA=w1600", "caption": "METES Forum · 이창우 마이스터"}, {"img": "https://lh3.googleusercontent.com/d/15ZZbZ8FNel7zwCnaoygb4S0h6T2mFZvA=w1600", "caption": "METES Forum"}, {"img": "https://lh3.googleusercontent.com/d/1OTkDeSaC4wsqmn3oaOy6QZgEh1v3vWZ9=w1600", "caption": "METES Forum"}]}, "about": {"eyebrow": "About METES", "statement": "창업가, 예비 창업가, 창작자가\n프로젝트로 배우고 {{h}}커뮤니티로 성장{{/h}}합니다.", "desc1": "강의 중심 교육이 아닌 실습·토론·프로젝트 중심으로 스스로 학습하는 환경을 제공합니다.", "desc2": "학력·전공 제한 없이 누구나 참여할 수 있습니다.", "stats": [{"number": "2023–NOW", "label": "Since · Cohort 1", "note": ""}, {"number": "250+", "label": "Meisters have joined", "note": ""}, {"number": "72+", "label": "누적 참여자 (메이커+마이스터)", "note": "수치 확인 필요"}, {"number": "15+", "label": "누적 Learning Block", "note": "수치 확인 필요"}]}, "roadmap": {"eyebrow": "Program · 1-Year Roadmap", "title": "One year,\n{{h}}four{{/h}} blocks.", "lead": "1 Cohort = 4 Learning Block = 총 40주. 각 Block은 10주 동안 진행됩니다.", "badge_status": "Cohort 5 모집 중", "badge_duration": "10 weeks / block", "blocks": [{"key": "LB 01", "start_month": "Mar", "end_month": "May", "title": "Finding Me", "desc": "문제 인식과 방향 찾기"}, {"key": "LB 02", "start_month": "Jun", "end_month": "Aug", "title": "Hard Skill", "desc": "문제 해결 역량 강화"}, {"key": "LB 03", "start_month": "Sep", "end_month": "Nov", "title": "Creating Your Own Company", "desc": "창업 실행과 구축"}, {"key": "LB 04", "start_month": "Dec", "end_month": "Feb", "title": "Stakeholders", "desc": "협업과 이해관계자 관리"}]}, "sessions": {"eyebrow": "Weekly Sessions", "title": "Tuesday & {{h}}Friday.{{/h}}", "cards": [{"day": "Every Tuesday", "title": "AI ×\nLeadership", "desc": "오전은 AI 실습, 오후는 리더십 토론. 강의가 아니라 직접 해보며 배우는 세션입니다.", "tags": ["AI 활용 실습", "프롬프트 설계", "리더십 롤플레이", "커뮤니티"], "stat_number": "120+", "stat_caption": "누적 참여 메이커", "note": "수치 확인 필요"}, {"day": "Every Friday", "title": "METES\nForum", "desc": "업계 전문가 마이스터와의 대화, 실제 사례 공유, 네트워킹. 매 기수 다양한 분야의 연사가 함께합니다.", "tags": ["전문가 초청", "사례 공유", "네트워킹"], "stat_number": "250+", "stat_caption": "Meisters have joined METES.", "note": ""}]}, "offer": {"eyebrow": "What we offer", "items": [{"icon": "mentoring", "title": "전문가 멘토링", "desc": "업계 전문가와 창업 선배(마이스터)가 프로젝트와 성장을 직접 가이드"}, {"icon": "open", "title": "열린 교육 환경", "desc": "학력, 전공 제한 없이 누구나 참여 가능한 구조"}, {"icon": "project", "title": "프로젝트 기반 학습", "desc": "강의가 아닌 프로젝트와 문제 해결 중심 학습"}, {"icon": "network", "title": "글로벌 네트워크", "desc": "국내외 전문가 및 커뮤니티와의 연결 기회 제공"}]}, "members": {"eyebrow": "Members · Since Cohort 1", "title": "People of {{h}}METES.{{/h}}", "desc": "지금까지 METES와 함께한 마이스터, 그리고 메이커들의 이름을 기록합니다.", "note": "띠지에 마우스를 올리면 멈춥니다.", "meisters": ["최희진", "김진석", "이창우", "고승원", "박지혜", "박재형", "이소영", "김수린", "김성훈", "장성호", "박소령", "김정빈", "김정현", "황성재", "권도균", "김승일", "조수빈", "이선민", "김동호", "가종현", "김소희", "권민", "임선영", "이지윤", "최재웅", "영주 닐슨", "윤수영", "크리스토퍼 한", "김호민", "김율희", "고영혁", "강병희", "하용호", "김나이", "송광종", "전진수", "이동수", "한재선", "이미지", "서은아", "이승오", "김지윤", "도영진", "장병탁", "김정태"], "makers": [{"name": "제이콥", "cohorts": "3·4"}, {"name": "리디아", "cohorts": "4"}, {"name": "케이", "cohorts": "4"}, {"name": "박정훈", "cohorts": "4"}, {"name": "조규섭", "cohorts": "3·4"}, {"name": "김태경", "cohorts": "2·3·4"}, {"name": "류승민", "cohorts": "3·4"}, {"name": "김수란", "cohorts": "2·4"}, {"name": "양원재", "cohorts": "4"}, {"name": "신기용", "cohorts": "4"}, {"name": "김준", "cohorts": "4"}, {"name": "최재이", "cohorts": "4"}, {"name": "김민태", "cohorts": "4"}, {"name": "박은혜", "cohorts": "4"}, {"name": "김태훈(릭킴)", "cohorts": "4"}, {"name": "김준현", "cohorts": "3·4"}, {"name": "차현선", "cohorts": "4"}, {"name": "김문정", "cohorts": "4"}, {"name": "장예슬", "cohorts": "4"}, {"name": "김지훈", "cohorts": "4"}, {"name": "강찬하", "cohorts": "4"}, {"name": "유호현", "cohorts": "4"}, {"name": "다니엘", "cohorts": ""}, {"name": "코알티", "cohorts": "4"}, {"name": "백희승", "cohorts": "4"}, {"name": "알렉스", "cohorts": "4"}, {"name": "송인태", "cohorts": "4"}], "moderators": ["다니엘", "세라", "아르베"]}, "cta": {"badge": "Cohort 5", "title": "Now\nOpen.", "desc": "현재 Cohort 5 모집 중. 결원이 발생하는 경우 Learning Block 중간 합류도 가능합니다."}, "footer": {"desc": "Metaverse Technology Training & Extended Studies\n성주재단과 함께합니다.", "email": "sera@metes.io", "instagram_url": "https://www.instagram.com/metes.institute/", "newsletter_url": "https://metes.stibee.com/", "address": "서울 강남구 언주로 734\nMCM빌딩 1, 2층", "copyright": "© 2026 METES. All rights reserved.", "poweredby": "Powered by the Sungjoo Foundation"}};

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
    // 비워두면 그 자리에 빈 줄이 남지 않도록 완전히 숨김 (flex gap 때문에 빈칸이 남는 걸 방지)
    const tagEl = $('hero-tag'); if (tagEl) tagEl.style.display = (h.tag && h.tag.trim()) ? '' : 'none';
    setRaw('hero-lede', 'hero.lede', h.lede, 'span');
    // cta1(Interest Form)은 안에 화살표 아이콘(<span class="arrow">)이 같이 들어있어서
    // 통째로 contenteditable로 두면 실수로 화살표까지 지워질 수 있어 라벨만 별도 span으로 감싸 편집 가능하게 함
    const c1 = $('hero-cta1'), c2 = $('hero-cta2');
    if (c1) {
      const label = c1.querySelector('.btn-label');
      if (label) { label.textContent = h.cta1_label || ''; label.setAttribute('data-path', 'hero.cta1_label'); }
      c1.setAttribute('href', h.cta1_url || '#'); c1.setAttribute('data-href-path', 'hero.cta1_url');
    }
    // 상단 내비게이션의 "Join Cohort 5" 버튼도 같은 주소를 씀 (예전엔 연결 안 된 채 방치돼 있었음)
    const navCta = $('nav-cta');
    if (navCta) { navCta.setAttribute('href', h.cta1_url || '#'); navCta.setAttribute('data-href-path', 'hero.cta1_url'); }
    if (c2) {
      const label = c2.querySelector('.btn-label');
      if (label) { label.textContent = h.cta2_label || ''; label.setAttribute('data-path', 'hero.cta2_label'); }
      c2.setAttribute('href', h.cta2_url || '#'); c2.setAttribute('data-href-path', 'hero.cta2_url');
    }
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
    // Hero의 버튼과 같은 값을 그대로 보여주는 하단 CTA 버튼 (같은 필드를 공유)
    const c1 = $('cta-cta1'), c2 = $('cta-cta2');
    if (c1) {
      const label = c1.querySelector('.btn-label');
      if (label) { label.textContent = data.hero.cta1_label || ''; label.setAttribute('data-path', 'hero.cta1_label'); }
      c1.setAttribute('href', data.hero.cta1_url || '#'); c1.setAttribute('data-href-path', 'hero.cta1_url');
    }
    if (c2) {
      const label = c2.querySelector('.btn-label');
      if (label) { label.textContent = data.hero.cta2_label || ''; label.setAttribute('data-path', 'hero.cta2_label'); }
      c2.setAttribute('href', data.hero.cta2_url || '#'); c2.setAttribute('data-href-path', 'hero.cta2_url');
    }
  }

  // ── Footer ──
  if (data.footer) {
    const f = data.footer;
    setRaw('footer-desc', 'footer.desc', f.desc, 'span');
    // 이메일 링크는 별도 주소 필드가 없고, 왼쪽 글자(footer.email) 자체가 곧 mailto: 주소라
    // 텍스트만 편집 가능하게 함 (data-href-path 없음 — 클릭해도 팝업 안 뜨고 메일 앱만 안 열림)
    setText('footer-email', f.email); markPath('footer-email', 'footer.email');
    setHref('footer-email', f.email ? 'mailto:' + f.email : null);
    setHref('footer-instagram', f.instagram_url); $('footer-instagram') && $('footer-instagram').setAttribute('data-href-path', 'footer.instagram_url');
    setHref('footer-newsletter', f.newsletter_url); $('footer-newsletter') && $('footer-newsletter').setAttribute('data-href-path', 'footer.newsletter_url');
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
    console.warn('[landing-render] content/landing.json을 못 불러와서(로컬 파일로 직접 열었거나 오프라인) 스크립트에 내장된 값을 씁니다.', err);
    data = FALLBACK_LANDING_DATA;
  }
  window.__landingData = data;
  renderLandingContent(data);
  document.dispatchEvent(new CustomEvent('landing-content-ready', { detail: data }));
})();
