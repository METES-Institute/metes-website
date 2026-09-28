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
          syncTextarea();
        });
      }
    });
  }

  function syncTextarea() {
    if (textarea) textarea.value = JSON.stringify(draft, null, 2);
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
      e.preventDefault();
      e.stopPropagation();
      const path = a.getAttribute('data-href-path');
      if (path) openUrlPopover(a, path);
      // data-href-path가 없는 링크(예: 이메일)는 그냥 이동만 막고 팝업은 띄우지 않음 —
      // 그 옆 글자 자체가 곧 값이라 텍스트를 고치면 자동으로 반영됨
    }, true);
  }

  function startEditing() {
    editing = true;
    draft = JSON.parse(JSON.stringify(liveData));
    trigger.style.display = 'none';
    document.body.classList.add('ie-editing');

    bindEditableFields();
    bindLinkInterceptor();

    // 하단 편집 바
    const bar = document.createElement('div');
    bar.id = 'ie-bar';
    bar.innerHTML = `
      <span>편집 모드 — 주황 점선 칸은 클릭해서 바로 고치세요. 우측 상단에 🔗 표시된 버튼은 눌러서 연결 주소를 바꾸세요. 멤버 이름 목록·아이콘 종류는 "전체 JSON 편집"에서.</span>
      <span class="grow"></span>
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
    textarea.addEventListener('input', () => {
      try {
        draft = JSON.parse(textarea.value);
        renderLandingContent(draft);   // 목록 추가/삭제 등 구조 변경까지 전부 다시 그림
        bindEditableFields();          // 새로 그려진 요소들에 편집 가능 표시를 다시 붙임
      } catch (e) { /* 아직 올바른 JSON이 아님 - 계속 타이핑 대기 */ }
    });

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
