// ── METES 랜딩페이지 인라인 편집기 ──
// 가입/서버/OAuth 없이, 본인 GitHub 계정의 "이 레포 전용" Personal Access Token만으로
// 화면에서 바로 고치고 저장(=GitHub에 커밋)하는 간단한 편집 모드입니다.
//
// 짧은 문장(제목/배지/링크 등)은 화면을 클릭해 바로 고칠 수 있고,
// 멤버 이름 추가/삭제, 로드맵 블록 추가 같은 "목록 구조를 바꾸는 편집"은
// 이 편집기 안의 "전체 JSON 직접 수정" 칸에서 합니다.
//
// 주의: 토큰은 파일에 저장하지 않고 이 브라우저 세션에만 잠깐 기억합니다(새로고침하면 다시 입력).
// 토큰은 반드시 "이 레포 한 곳만, Contents 읽기/쓰기 권한만" 주는 Fine-grained token으로 만드세요.
// (README.md 4부 참고)

(function () {
  const REPO = 'METES-Institute/metes-website';
  const BRANCH = 'main';
  const FILE_PATH = 'content/landing.json';

  // 화면에서 바로 고칠 수 있는 "순수 텍스트" 항목만 여기 등록 (id -> JSON 경로)
  // 강조 표시({{h}}..{{/h}})나 줄바꿈이 섞인 항목, 목록(배열) 항목은 아래 JSON 칸에서 수정합니다.
  const ID_PATH = {
    'hero-badge': 'hero.badge',
    'hero-tag': 'hero.tag',
    'hero-cta1': 'hero.cta1_label',
    'hero-cta2': 'hero.cta2_label',
    'about-eyebrow': 'about.eyebrow',
    'roadmap-eyebrow': 'roadmap.eyebrow',
    'roadmap-lead': 'roadmap.lead',
    'roadmap-badge-status': 'roadmap.badge_status',
    'roadmap-badge-duration': 'roadmap.badge_duration',
    'sessions-eyebrow': 'sessions.eyebrow',
    'offer-eyebrow': 'offer.eyebrow',
    'members-eyebrow': 'members.eyebrow',
    'members-desc': 'members.desc',
    'members-note': 'members.note',
    'cta-badge': 'cta.badge',
    'cta-desc': 'cta.desc',
    'footer-email': 'footer.email',
    'footer-copyright': 'footer.copyright',
    'footer-poweredby': 'footer.poweredby',
  };

  let liveData = null; // landing-render.js가 fetch한 원본 (landing-content-ready에서 받음)
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
    for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]];
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
    #ie-panel .msg.ok { color: #1a7a3c; }
    [contenteditable="true"][data-ie] { outline: 2px dashed #ff4d1f; outline-offset: 2px; background: rgba(255,77,31,.06); }
    #ie-bar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 9997; background: #141414; color: #fff;
      padding: 10px 16px; display: flex; align-items: center; gap: 12px; font-family: Arial, sans-serif; font-size: 13px; }
    #ie-bar .grow { flex: 1; }
    #ie-json { position: fixed; right: 14px; bottom: 56px; z-index: 9997; width: min(420px, 90vw); max-height: 50vh;
      display: none; background: #fff; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,.3); overflow: hidden; }
    #ie-json textarea { width: 100%; height: 260px; box-sizing: border-box; border: 0; padding: 10px;
      font-family: ui-monospace, monospace; font-size: 11px; }
    #ie-json .head { padding: 8px 10px; background: #f4f2ec; font-size: 12px; font-weight: 700; }
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

  function startEditing() {
    editing = true;
    draft = JSON.parse(JSON.stringify(liveData));
    trigger.style.display = 'none';

    // 1) 순수 텍스트 항목 -> contenteditable
    Object.entries(ID_PATH).forEach(([id, path]) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('data-ie', '1');
      el.addEventListener('input', () => { setPath(draft, path, el.textContent); syncJson(); });
    });
    // 링크(href)도 같이 고칠 수 있게 아주 짧은 안내만 남김 (href 자체는 JSON 칸에서)
    ['hero-cta1', 'hero-cta2'].forEach((id) => {
      // 링크 주소는 텍스트가 아니라 속성이라 contenteditable로 못 고침 -> JSON 칸 안내
    });

    // 2) 하단 편집 바
    const bar = document.createElement('div');
    bar.id = 'ie-bar';
    bar.innerHTML = `
      <span>편집 모드 — 주황 점선 칸은 클릭해서 바로 고치세요. 이름/목록 추가·삭제는 JSON 칸에서.</span>
      <span class="grow"></span>
      <button id="ie-toggle-json" style="background:#333;color:#fff;border:none;padding:8px 12px;border-radius:6px;cursor:pointer;">전체 JSON 편집</button>
      <button id="ie-save" style="background:#ff4d1f;color:#fff;border:none;padding:8px 14px;border-radius:6px;cursor:pointer;font-weight:700;">저장 (커밋)</button>
      <button id="ie-exit" style="background:#666;color:#fff;border:none;padding:8px 12px;border-radius:6px;cursor:pointer;">종료</button>
      <span id="ie-save-msg" style="min-width:160px;"></span>
    `;
    document.body.appendChild(bar);

    // 3) JSON 패널
    const jsonPanel = document.createElement('div');
    jsonPanel.id = 'ie-json';
    jsonPanel.innerHTML = `<div class="head">전체 콘텐츠 (JSON) — 목록 추가/삭제는 여기서 직접</div>
      <textarea id="ie-json-textarea" spellcheck="false"></textarea>`;
    document.body.appendChild(jsonPanel);
    const textarea = jsonPanel.querySelector('#ie-json-textarea');
    textarea.value = JSON.stringify(draft, null, 2);
    textarea.addEventListener('input', () => {
      try { draft = JSON.parse(textarea.value); paintInlineFromDraft(); } catch (e) { /* 파싱될 때까지 대기 */ }
    });

    function syncJson() { textarea.value = JSON.stringify(draft, null, 2); }
    function paintInlineFromDraft() {
      Object.entries(ID_PATH).forEach(([id, path]) => {
        const el = document.getElementById(id);
        const v = getPath(draft, path);
        if (el && v != null && el.textContent !== v) el.textContent = v;
      });
    }

    bar.querySelector('#ie-toggle-json').onclick = () => {
      jsonPanel.style.display = jsonPanel.style.display === 'block' ? 'none' : 'block';
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
      // 최신 sha 확인 (동시 편집 충돌 방지)
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
    } catch (err) {
      msgEl.style.color = '#f88';
      msgEl.textContent = String(err.message || err);
    }
  }
})();
