// ── METES 랜딩페이지 인라인 편집기 (전체 텍스트 버전) ──
// 화면에 보이는 거의 모든 텍스트를 그 자리에서 클릭해 바로 고치고, GitHub에 커밋으로 저장합니다.
// 가입/서버/OAuth 없이, 본인 GitHub 계정의 "이 레포 전용" Personal Access Token만 있으면 됩니다.
//
// 버튼/링크 라벨(글자)은 클릭해서 바로 고치고, 그 버튼이 실제로 연결하는 주소(href)는
// 편집 모드에서 버튼을 누르면 페이지 이동 대신 "연결된 주소" 팝업이 뜨면서 고칠 수 있습니다.
//
// 예외 (JSON 편집 칸에서만 가능):
// - 멤버 이름 롤링 띠지(마이스터/메이커/모더레이터 목록): 애니메이션 때문에 내용이 통째로
//   2배 복제되어 흐르는 구조라, 이름 하나하나를 화면에서 직접 편집하면 꼬일 수 있어 제외함
// - Offer 카드의 아이콘 종류(mentoring/open/project/network): 화면에 보이는 "글자"가 아니라
//   어떤 그림을 쓸지 정하는 값이라 제외함
//
// 토큰은 파일에 저장하지 않고 이 브라우저 세션에만 잠깐 기억합니다(새로고침하면 다시 입력).

(function () {
  const REPO = 'METES-Institute/metes-website';
  const BRANCH = 'main';
  const FILE_PATH = 'content/landing.json';

  let liveData = null; // landing-render.js가 fetch한 원본
  let draft = null;    // 지금 편집 중인 사본
  let token = null;
  let editing = false;

  document.addEventListener('landing-content-ready', (e) => { liveData = e.detail; });

  function getPath(obj, path) {
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  }
  function setPath(obj, path, value) {
    const keys = path.split('.');
    let o = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (o[k] == null) o[k] = /^\d+$/.test(keys[i + 1]) ? [] : {};
      o = o[k];
    }
    o[keys[keys.length - 1]] = value;
  }

  // ── 최소한의 UI 스타일 ──
  const style = document.createElement('style');
  style.textContent = `
    #ie-trigger { position: fixed; right: 14px; bottom: 14px; z-index: 9998; width: 34px; height: 34px;
      border-radius: 999px; background: rgba(20,20,20,.55); color: #fff; border: none; cursor: pointer;
      font-size: 15px; opacity: .35; transition: opacity .2s; }
    #ie-trigger:hover { opacity: 1; }
    #ie-panel { position: fixed; inset: 0; z-index: 9999; background: rgba(20,20,20,.6);
      display: flex; align-items: center; justify-content: center; font-family: Arial, sans-serif; }
    #ie-panel .box { background: #fff; width: min(560px, 92vw); max-height: 86vh; overflow: auto;
      border-radius: 10px; padding: 24px; box-shadow: 0 20px 60px rgba(0,0,0,.35); }
    #ie-panel h3 { margin: 0 0 12px; font-size: 16px; }
    #ie-panel p.hint { color: #666; font-size: 12px; line-height: 1.5; margin: 0 0 14px; }
    #ie-panel input[type=password] { width: 100%; padding: 10px 12px; font-size: 13px; box-sizing: border-box;
      border: 1px solid #ccc; border-radius: 6px; margin-bottom: 12px; }
    #ie-panel .row { display: flex; gap: 8px; justify-content: flex-end; }
    #ie-panel button.primary { background: #ff4d1f; color: #fff; border: none; padding: 10px 16px;
      border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 700; }
    #ie-panel button.ghost { background: #eee; border: none; padding: 10px 16px; border-radius: 6px;
      cursor: pointer; font-size: 13px; }
    #ie-panel .msg { font-size: 12px; margin-top: 10px; white-space: pre-wrap; }
    #ie-panel .msg.err { color: #c0392b; }
    [contenteditable="true"][data-ie] { outline: 2px dashed #ff4d1f; outline-offset: 2px;
      background: rgba(255,77,31,.06); white-space: pre-wrap; }
    #ie-bar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 9997; background: #141414; color: #fff;
      padding: 10px 16px; display: flex; align-items: center; gap: 12px; font-family: Arial, sans-serif;
      font-size: 13px; flex-wrap: wrap; }
    #ie-bar .grow { flex: 1; min-width: 120px; }
    #ie-json { position: fixed; right: 14px; bottom: 56px; z-index: 9997; width: min(440px, 90vw); max-height: 55vh;
      display: none; background: #fff; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,.3); overflow: hidden; }
    #ie-json textarea { width: 100%; height: 280px; box-sizing: border-box; border: 0; padding: 10px;
      font-family: ui-monospace, monospace; font-size: 11px; }
    #ie-json .head { padding: 8px 10px; background: #f4f2ec; font-size: 12px; font-weight: 700; }
    #ie-layout-panel { position: fixed; left: 14px; bottom: 56px; z-index: 9997; width: min(320px, 90vw);
      display: none; background: #fff; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,.3); overflow: hidden;
      font-family: Arial, sans-serif; }
    #ie-layout-panel .head { padding: 8px 10px; background: #f4f2ec; font-size: 12px; font-weight: 700; }
    #ie-layout-panel .row { padding: 10px 14px; }
    #ie-layout-panel label { display: flex; justify-content: space-between; font-size: 12px; color: #444; margin-bottom: 6px; }
    #ie-layout-panel input[type="range"] { width: 100%; }
    a[data-href-path], a[href^="mailto:"] { position: relative; }
    body.ie-editing a[data-href-path]::after, body.ie-editing a[href^="mailto:"]::after {
      content: '🔗'; position: absolute; top: -8px; right: -8px; background: #141414; color: #fff;
      width: 18px; height: 18px; border-radius: 999px; font-size: 10px; display: flex;
      align-items: center; justify-content: center; pointer-events: none;
    }
    #ie-url-panel { position: fixed; z-index: 10000; background: #fff; border-radius: 8px;
      padding: 14px; box-shadow: 0 10px 30px rgba(0,0,0,.3); font-family: Arial, sans-serif;
      width: min(360px, 90vw); }
    #ie-url-panel .label { font-size: 12px; color: #666; margin-bottom: 6px; }
    #ie-url-panel input { width: 100%; box-sizing: border-box; padding: 8px 10px; font-size: 13px;
      border: 1px solid #ccc; border-radius: 6px; margin-bottom: 10px; }
    #ie-url-panel .row { display: flex; gap: 8px; justify-content: flex-end; }
    body.ie-editing .hero-logo span { cursor: pointer; }
    body.ie-editing [data-bg-path] { cursor: pointer; outline: 2px dashed rgba(255,255,255,.6); outline-offset: -2px; }
    body.ie-editing [data-bg-path]:hover { outline-color: #ff4d1f; }
    body.ie-editing .hero-logo span.ie-kern-selected { outline: 2px dashed #ff4d1f; outline-offset: 4px; }
    #ie-kern-readout { position: fixed; z-index: 9997; background: #141414; color: #fff;
      font-family: ui-monospace, monospace; font-size: 11px; padding: 8px 10px; border-radius: 6px;
      display: flex; gap: 10px; box-shadow: 0 6px 18px rgba(0,0,0,.3); }
    #ie-kern-readout span { padding: 2px 6px; border-radius: 3px; }
    #ie-kern-readout span.on { background: #ff4d1f; font-weight: 700; }
    #ie-text-toolbar { position: absolute; z-index: 10001; background: #141414; border-radius: 6px;
      display: flex; gap: 2px; padding: 4px; box-shadow: 0 6px 18px rgba(0,0,0,.35); }
    #ie-text-toolbar button { background: transparent; border: none; color: #fff; cursor: pointer;
      font-family: Arial, sans-serif; font-size: 12px; padding: 6px 10px; border-radius: 4px; }
    #ie-text-toolbar button:hover { background: #ff4d1f; }
  `;
  document.head.appendChild(style);

  // ── 트리거 버튼 ──
  const trigger = document.createElement('button');
  trigger.id = 'ie-trigger';
  trigger.title = '편집 모드 (관리자 전용)';
  trigger.textContent = '✎';
  document.body.appendChild(trigger);
  trigger.addEventListener('click', () => { if (!editing) openLogin(); });
  window.addEventListener('keydown', (e) => {
    if (e.altKey && e.shiftKey && (e.key === 'e' || e.key === 'E')) { if (!editing) openLogin(); }
  });

  function openLogin() {
    const panel = document.createElement('div');
    panel.id = 'ie-panel';
    panel.innerHTML = `
      <div class="box">
        <h3>편집 모드 로그인</h3>
        <p class="hint">이 레포 쓰기 권한이 있는 GitHub Personal Access Token(Fine-grained)을 입력하세요.
        토큰은 저장되지 않고 이 창을 닫거나 새로고침하면 사라집니다.</p>
        <input type="password" id="ie-token-input" placeholder="github_pat_...">
        <div class="row">
          <button class="ghost" id="ie-cancel">취소</button>
          <button class="primary" id="ie-confirm">확인</button>
        </div>
        <div class="msg" id="ie-login-msg"></div>
      </div>`;
    document.body.appendChild(panel);
    const msg = panel.querySelector('#ie-login-msg');
    panel.querySelector('#ie-cancel').onclick = () => panel.remove();
    panel.querySelector('#ie-confirm').onclick = async () => {
      const t = panel.querySelector('#ie-token-input').value.trim();
      if (!t) return;
      msg.textContent = '확인 중...'; msg.className = 'msg';
      try {
        const res = await fetch(`https://api.github.com/repos/${REPO}`, {
          headers: { Authorization: `Bearer ${t}`, Accept: 'application/vnd.github+json' },
        });
        if (!res.ok) throw new Error('토큰이 유효하지 않거나 이 레포에 접근 권한이 없습니다. (' + res.status + ')');
        const json = await res.json();
        if (!(json.permissions && json.permissions.push)) {
          throw new Error('이 토큰은 읽기 전용입니다. Contents: Read and write 권한으로 다시 발급해주세요.');
        }
        token = t;
        panel.remove();
        startEditing();
      } catch (err) {
        msg.textContent = String(err.message || err);
        msg.className = 'msg err';
      }
    };
  }

  let textarea = null;

  function bindEditableFields() {
    document.querySelectorAll('[data-path]').forEach((el) => {
      const path = el.getAttribute('data-path');
      // 편집 모드에서는 항상 "원본 저장 값"을 그대로 보여주고 고치게 함
      // ({{h}}..{{/h}}, 줄바꿈 문법이 있는 필드도 예쁜 렌더링 대신 원본 문법 그대로)
      const v = getPath(draft, path);
      if (v != null) el.textContent = v;
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('data-ie', '1');
      if (!el.__ieBound) {
        el.__ieBound = true;
        el.addEventListener('input', () => {
          setPath(draft, path, el.textContent);
          scheduleSyncTextarea();
        });
      }
    });
  }

  function syncTextarea() {
    if (textarea) textarea.value = JSON.stringify(draft, null, 2);
  }

  // 타이핑할 때마다 draft 전체(히어로 슬라이드 20장, 멤버 70여 명 등)를 JSON.stringify해서
  // textarea에 넣으면 글자 하나 칠 때마다 버벅이므로, 타이핑이 잠깐 멈췄을 때만 동기화함
  let __syncTimer;
  function scheduleSyncTextarea() {
    clearTimeout(__syncTimer);
    __syncTimer = setTimeout(syncTextarea, 400);
  }

  // 편집 모드에서 버튼/링크를 눌러도 페이지가 이동하지 않게 막고,
  // 그 자리에 "연결된 주소" 팝업을 띄워서 바로 고칠 수 있게 함
  function openUrlPopover(anchorEl, path) {
    document.getElementById('ie-url-panel')?.remove();
    const rect = anchorEl.getBoundingClientRect();
    const panel = document.createElement('div');
    panel.id = 'ie-url-panel';
    const top = Math.min(window.innerHeight - 140, rect.bottom + 8);
    const left = Math.min(window.innerWidth - 380, Math.max(8, rect.left));
    panel.style.top = top + 'px';
    panel.style.left = left + 'px';
    const current = getPath(draft, path) || '';
    panel.innerHTML = `
      <div class="label">연결된 주소</div>
      <input type="text" id="ie-url-input" value="${current.replace(/"/g, '&quot;')}">
      <div class="row">
        <button class="ghost" id="ie-url-cancel" style="background:#eee;border:none;padding:8px 12px;border-radius:6px;cursor:pointer;font-size:12px;">취소</button>
        <button class="primary" id="ie-url-save" style="background:#ff4d1f;color:#fff;border:none;padding:8px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700;">이 주소로 바꾸기</button>
      </div>`;
    document.body.appendChild(panel);
    const input = panel.querySelector('#ie-url-input');
    input.focus(); input.select();
    panel.querySelector('#ie-url-cancel').onclick = () => panel.remove();
    panel.querySelector('#ie-url-save').onclick = () => {
      const v = input.value.trim();
      setPath(draft, path, v);
      anchorEl.setAttribute('href', v);
      syncTextarea();
      panel.remove();
    };
    const onOutside = (e) => { if (!panel.contains(e.target) && e.target !== anchorEl) { panel.remove(); document.removeEventListener('mousedown', onOutside, true); } };
    setTimeout(() => document.addEventListener('mousedown', onOutside, true), 0);
  }

  let linkInterceptorBound = false;
  function bindLinkInterceptor() {
    if (linkInterceptorBound) return;
    linkInterceptorBound = true;
    document.addEventListener('click', (e) => {
      if (!editing) return;
      const a = e.target.closest('a[target="_blank"], a[href^="mailto:"]');
      if (!a) return;
      // 편집 모드에서는 어떤 경우든 실제 페이지 이동/새 탭 열림을 막음 (라벨 글자를
      // 클릭했을 때 바로 밑의 return으로 빠지면서 이 preventDefault를 건너뛰면, 편집 중에도
      // 버튼이 눌려서 실제 링크로 이동해버리는 버그가 있었음)
      e.preventDefault();
      // 버튼 안의 글자(contenteditable 라벨)를 직접 클릭한 거면, 주소 팝업을 띄우지 않고
      // 그냥 글자 편집이 되도록 둠 — 이전엔 여기서 항상 팝업이 뜨면서 포커스를 뺏어가서
      // 라벨 텍스트를 클릭해도 타이핑이 안 먹혔음(전체 JSON 편집으로 우회해야 했던 버그)
      const label = e.target.closest('[contenteditable="true"]');
      if (label && a.contains(label)) return;
      e.stopPropagation();
      const path = a.getAttribute('data-href-path');
      if (path) openUrlPopover(a, path);
      // data-href-path가 없는 링크(예: 이메일)는 그냥 이동만 막고 팝업은 띄우지 않음 —
      // 그 옆 글자 자체가 곧 값이라 텍스트를 고치면 자동으로 반영됨
    }, true);
  }

  // 구글 드라이브 "공유 링크"를 그대로 붙여넣어도, 사이트에서 바로 쓸 수 있는 직링크로
  // 자동 변환해줌 (지금까지는 이 변환을 매번 수동으로 해야 했음)
  function toDirectImageUrl(url) {
    const m = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    return m ? `https://lh3.googleusercontent.com/d/${m[1]}=w1600` : url;
  }

  function openImagePopover(targetEl, path) {
    document.getElementById('ie-url-panel')?.remove();
    const rect = targetEl.getBoundingClientRect();
    const panel = document.createElement('div');
    panel.id = 'ie-url-panel';
    const top = Math.min(window.innerHeight - 140, rect.bottom + 8);
    const left = Math.min(window.innerWidth - 380, Math.max(8, rect.left));
    panel.style.top = top + 'px';
    panel.style.left = left + 'px';
    const current = getPath(draft, path) || '';
    panel.innerHTML = `
      <div class="label">이미지 주소 (구글 드라이브 공유 링크를 그대로 붙여넣어도 자동 변환됩니다)</div>
      <input type="text" id="ie-img-input" value="${current.replace(/"/g, '&quot;')}">
      <div class="row">
        <button class="ghost" id="ie-img-cancel" style="background:#eee;border:none;padding:8px 12px;border-radius:6px;cursor:pointer;font-size:12px;">취소</button>
        <button class="primary" id="ie-img-save" style="background:#ff4d1f;color:#fff;border:none;padding:8px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700;">이 사진으로 바꾸기</button>
      </div>`;
    document.body.appendChild(panel);
    const input = panel.querySelector('#ie-img-input');
    input.focus(); input.select();
    panel.querySelector('#ie-img-cancel').onclick = () => panel.remove();
    panel.querySelector('#ie-img-save').onclick = () => {
      const v = toDirectImageUrl(input.value.trim());
      setPath(draft, path, v);
      targetEl.style.backgroundImage = `url('${v}')`;
      scheduleSyncTextarea();
      panel.remove();
    };
    const onOutside = (e) => { if (!panel.contains(e.target) && e.target !== targetEl) { panel.remove(); document.removeEventListener('mousedown', onOutside, true); } };
    setTimeout(() => document.addEventListener('mousedown', onOutside, true), 0);
  }

  let imageInterceptorBound = false;
  function bindImageInterceptor() {
    if (imageInterceptorBound) return;
    imageInterceptorBound = true;
    document.addEventListener('click', (e) => {
      if (!editing) return;
      const el = e.target.closest('[data-bg-path]');
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      openImagePopover(el, el.getAttribute('data-bg-path'));
    }, true);
  }

  // 글자를 드래그로 선택하면 "볼드"/"강조(주황색)" 버튼이 뜨는 작은 툴바.
  // {{h}}..{{/h}}, {{b}}..{{/b}} 괄호를 직접 타이핑하지 않아도 되게 해줌 — 버튼을 누르면
  // 선택한 글자를 그 괄호로 감싸주기만 함 (실제 강조/볼드 처리는 landing-render.js의 hl()이 함).
  // data-format="raw" 필드(제목, 문단 등)에서만 동작 — 태그/링크 라벨처럼 그 문법을 지원하지
  // 않는 자리에서는 버튼이 뜨지 않음.
  let textToolbarBound = false;
  function bindTextToolbar() {
    if (textToolbarBound) return;
    textToolbarBound = true;
    let bar = null;
    const removeBar = () => { if (bar) { bar.remove(); bar = null; } };
    document.addEventListener('selectionchange', () => {
      if (!editing) { removeBar(); return; }
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0 || !sel.toString().trim()) { removeBar(); return; }
      const range = sel.getRangeAt(0);
      const node = range.commonAncestorContainer;
      const host = (node.nodeType === 1 ? node : node.parentElement);
      const el = host && host.closest('[data-format="raw"][contenteditable="true"]');
      if (!el) { removeBar(); return; }
      const rect = range.getBoundingClientRect();
      if (!rect.width && !rect.height) { removeBar(); return; }
      if (!bar) {
        bar = document.createElement('div');
        bar.id = 'ie-text-toolbar';
        bar.innerHTML = `<button data-act="b"><b>B</b></button><button data-act="h">강조</button>`;
        document.body.appendChild(bar);
        bar.addEventListener('mousedown', (e) => e.preventDefault()); // 버튼 눌러도 선택 영역 안 풀리게
        bar.addEventListener('click', (e) => {
          const btn = e.target.closest('button');
          if (!btn) return;
          const tag = btn.getAttribute('data-act');
          const text = sel.toString();
          if (!text) return;
          document.execCommand('insertText', false, `{{${tag}}}${text}{{/${tag}}}`);
          setPath(draft, el.getAttribute('data-path'), el.textContent);
          scheduleSyncTextarea();
          removeBar();
        });
      }
      bar.style.top = (window.scrollY + rect.top - 40) + 'px';
      bar.style.left = (window.scrollX + rect.left) + 'px';
    });
  }

  // Hero 로고(METES) 글자 사이 간격을 화면 보면서 화살표 키로 직접 조정.
  // 글자를 클릭해서 선택하면(M 제외 — M 앞엔 조정할 간격이 없음), 그 글자 "바로 앞" 간격을
  // ←/→ 로 1px씩(Shift+←/→ 로 5px씩) 조정. 조정한 값은 draft.hero.logo_kerning에 그대로
  // 저장되고, 기존 "저장(커밋)" 버튼으로 GitHub에 올라감.
  let kernSelected = null; // 1~4 (letters 배열 인덱스, kerning[index-1]을 조정)
  let kernBound = false;
  function bindHeroLogoKerning() {
    if (kernBound) return;
    kernBound = true;
    const el = document.querySelector('.hero-logo');
    if (!el) return;
    const letters = [...el.querySelectorAll('span')];

    const readout = document.createElement('div');
    readout.id = 'ie-kern-readout';
    document.body.appendChild(readout);

    const pairLabels = ['M–E', 'E–T', 'T–E', 'E–S'];
    function paintReadout() {
      const kerning = (draft.hero && draft.hero.logo_kerning) || [0, 0, 0, 0];
      readout.innerHTML = pairLabels.map((label, i) =>
        `<span class="${kernSelected === i + 1 ? 'on' : ''}">${label}: ${Math.round(kerning[i])}px</span>`
      ).join('');
      const rect = el.getBoundingClientRect();
      readout.style.top = Math.max(8, rect.top - 40) + 'px';
      readout.style.left = Math.max(8, rect.left) + 'px';
    }

    function selectLetter(i) {
      if (i === 0) return; // M 앞에는 조정할 간격이 없음
      kernSelected = i;
      letters.forEach((s, idx) => s.classList.toggle('ie-kern-selected', idx === i));
      paintReadout();
    }

    letters.forEach((span, i) => {
      span.addEventListener('click', (e) => { e.stopPropagation(); selectLetter(i); });
    });

    document.addEventListener('keydown', (e) => {
      if (!editing || kernSelected == null) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      if (!draft.hero.logo_kerning) draft.hero.logo_kerning = [40, 0, 20, 28];
      const step = e.shiftKey ? 5 : 1;
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      const idx = kernSelected - 1;
      draft.hero.logo_kerning[idx] = Math.max(-20, draft.hero.logo_kerning[idx] + dir * step);
      equalizeHeroLogoSpacing(draft.hero.logo_kerning);
      paintReadout();
      syncTextarea();
    });

    paintReadout();
    window.addEventListener('resize', paintReadout);
  }

  function startEditing() {
    editing = true;
    draft = JSON.parse(JSON.stringify(liveData));
    trigger.style.display = 'none';
    document.body.classList.add('ie-editing');

    bindEditableFields();
    bindLinkInterceptor();
    bindImageInterceptor();
    bindHeroLogoKerning();
    bindTextToolbar();

    // 하단 편집 바
    const bar = document.createElement('div');
    bar.id = 'ie-bar';
    bar.innerHTML = `
      <span>편집 모드 — 주황 점선 칸은 클릭해서 바로 고치세요. 우측 상단에 🔗 표시된 버튼은 눌러서 연결 주소를 바꾸세요. 멤버 이름 목록·아이콘 종류는 "전체 JSON 편집"에서.</span>
      <span class="grow"></span>
      <button id="ie-toggle-layout" style="background:#333;color:#fff;border:none;padding:8px 12px;border-radius:6px;cursor:pointer;">레이아웃 조절</button>
      <button id="ie-toggle-json" style="background:#333;color:#fff;border:none;padding:8px 12px;border-radius:6px;cursor:pointer;">전체 JSON 편집</button>
      <button id="ie-save" style="background:#ff4d1f;color:#fff;border:none;padding:8px 14px;border-radius:6px;cursor:pointer;font-weight:700;">저장 (커밋)</button>
      <button id="ie-exit" style="background:#666;color:#fff;border:none;padding:8px 12px;border-radius:6px;cursor:pointer;">종료</button>
      <span id="ie-save-msg" style="min-width:160px;"></span>
    `;
    document.body.appendChild(bar);

    // JSON 패널
    const jsonPanel = document.createElement('div');
    jsonPanel.id = 'ie-json';
    jsonPanel.innerHTML = `<div class="head">전체 콘텐츠 (JSON) — 목록 추가/삭제, 멤버 이름, 링크 주소, 아이콘 종류는 여기서 직접</div>
      <textarea id="ie-json-textarea" spellcheck="false"></textarea>`;
    document.body.appendChild(jsonPanel);
    textarea = jsonPanel.querySelector('#ie-json-textarea');
    textarea.value = JSON.stringify(draft, null, 2);
    // draft 자체는 타이핑할 때마다 바로 갱신해서(그래야 입력 중 바로 "저장"을 눌러도
    // 최신 내용이 반영됨), 글자 하나 칠 때마다 페이지 전체(슬라이드 20장, 멤버 70여 명 등)를
    // 통째로 다시 그리는 무거운 부분만 타이핑이 잠깐 멈췄을 때로 미뤄서 버벅임을 없앰
    let __jsonApplyTimer;
    textarea.addEventListener('input', () => {
      try {
        draft = JSON.parse(textarea.value);
      } catch (e) { return; /* 아직 올바른 JSON이 아님 - 계속 타이핑 대기 */ }
      clearTimeout(__jsonApplyTimer);
      __jsonApplyTimer = setTimeout(() => {
        renderLandingContent(draft);   // 목록 추가/삭제 등 구조 변경까지 전부 다시 그림
        bindEditableFields();          // 새로 그려진 요소들에 편집 가능 표시를 다시 붙임
      }, 500);
    });

    bar.querySelector('#ie-toggle-json').onclick = () => {
      jsonPanel.style.display = jsonPanel.style.display === 'block' ? 'none' : 'block';
    };

    // 레이아웃 조절판: 섹션 여백 / 세션 카드 간격 / 히어로 높이를 슬라이더로 직접 조절
    const layoutPanel = document.createElement('div');
    layoutPanel.id = 'ie-layout-panel';
    const L = draft.layout || (draft.layout = { section_pad: 108, card_gap: 19, hero_h: 100 });
    layoutPanel.innerHTML = `
      <div class="head">레이아웃 조절</div>
      <div class="row"><label>섹션 위/아래 여백<span id="ie-lv-section_pad">${L.section_pad}px</span></label>
        <input type="range" id="ie-ls-section_pad" min="40" max="160" value="${L.section_pad}"></div>
      <div class="row"><label>세션 카드 간격<span id="ie-lv-card_gap">${L.card_gap}px</span></label>
        <input type="range" id="ie-ls-card_gap" min="0" max="60" value="${L.card_gap}"></div>
      <div class="row"><label>히어로 사진 높이<span id="ie-lv-hero_h">${L.hero_h}vh</span></label>
        <input type="range" id="ie-ls-hero_h" min="40" max="100" value="${L.hero_h}"></div>
    `;
    document.body.appendChild(layoutPanel);
    [['section_pad', '--section-pad', 'px'], ['card_gap', '--card-gap', 'px'], ['hero_h', '--hero-h', 'vh']]
      .forEach(([key, cssVar, unit]) => {
        const slider = layoutPanel.querySelector(`#ie-ls-${key}`);
        const label = layoutPanel.querySelector(`#ie-lv-${key}`);
        slider.addEventListener('input', () => {
          const v = Number(slider.value);
          draft.layout[key] = v;
          label.textContent = v + unit;
          document.documentElement.style.setProperty(cssVar, v);
          scheduleSyncTextarea();
        });
      });
    bar.querySelector('#ie-toggle-layout').onclick = () => {
      layoutPanel.style.display = layoutPanel.style.display === 'block' ? 'none' : 'block';
    };
    bar.querySelector('#ie-exit').onclick = () => {
      if (!confirm('저장하지 않은 변경사항은 사라집니다. 편집 모드를 종료할까요?')) return;
      location.reload();
    };
    bar.querySelector('#ie-save').onclick = () => save(bar.querySelector('#ie-save-msg'));
  }

  async function save(msgEl) {
    msgEl.style.color = '#fff';
    msgEl.textContent = '저장 중...';
    try {
      const getRes = await fetch(
        `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`,
        { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } }
      );
      if (!getRes.ok) throw new Error('현재 파일 정보를 못 가져왔습니다. (' + getRes.status + ')');
      const cur = await getRes.json();

      const content = JSON.stringify(draft, null, 2);
      const b64 = btoa(unescape(encodeURIComponent(content)));

      const putRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
        body: JSON.stringify({
          message: '랜딩페이지 콘텐츠 수정 (사이트 편집 모드)',
          content: b64,
          sha: cur.sha,
          branch: BRANCH,
        }),
      });
      if (!putRes.ok) {
        const errBody = await putRes.json().catch(() => ({}));
        throw new Error('저장 실패 (' + putRes.status + ') ' + (errBody.message || ''));
      }
      msgEl.style.color = '#8f8';
      msgEl.textContent = '저장 완료! 1~2분 뒤 실제 사이트에 반영됩니다.';

      // 저장한 내용을 기준으로 화면을 예쁘게 다시 그리고, 계속 편집할 수 있게 편집 가능 표시를 다시 붙임
      liveData = JSON.parse(JSON.stringify(draft));
      window.__landingData = liveData;
      renderLandingContent(draft);
      bindEditableFields();
    } catch (err) {
      msgEl.style.color = '#f88';
      msgEl.textContent = String(err.message || err);
    }
  }
})();
