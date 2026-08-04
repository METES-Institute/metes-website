// ═══════════════════════════════════════════════════════════════
// METES 구글 시트 Apps Script (전체 교체용)
//
// 설치 방법:
//  1. 시트에서 확장 프로그램 > Apps Script 열기
//  2. 기존 코드를 전부 지우고 이 파일 내용으로 교체
//  3. 왼쪽 톱니바퀴(프로젝트 설정) > 스크립트 속성 > 속성 추가
//     - 속성: GITHUB_TOKEN / 값: 새로 발급한 GitHub 토큰
//     (토큰을 코드에 직접 넣지 말 것!)
//
// GitHub 토큰 발급 (기존 토큰은 노출됐으므로 반드시 폐기):
//  github.com > Settings > Developer settings > Fine-grained tokens
//  - Resource owner: METES-Institute 선택
//  - Repository access: metes-website 만 선택
//  - Permissions: Contents = Read and write, Actions = Read-only
// ═══════════════════════════════════════════════════════════════

// ── 설정 ──
var REPO = 'METES-Institute/metes-website';
var WORKFLOW_FILE = 'sync.yml';
var CONTROL_SHEET_GID = 1977322232; // control 시트

var FOLDERS = {
  members:    '18YyzosXU7uIJLx_otYsHIiyefObWtVcT',
  articles:   '1w1_OptZXIr1SmQP2FJdFb39N0gYjRmk2',
  news:       '1hlSrVnGtHuMKl_SEId7xKD-Hw2HDuP7u',
  curriculum: '1Z5aoPooMOEp1nbVKCv9ldAHxzF_qaDfs',
  home:       '1AdAMS7O6NVS2-fDycWYWchSJMFi7Qd38',
};

var SHEET_CONFIG = {
  members_kor:    { sheet: 'members_KOR',    matchCol: 'name', imgCol: 'img', folder: 'members' },
  members_eng:    { sheet: 'members_ENG',    matchCol: 'name', imgCol: 'img', folder: 'members' },
  articles_kor:   { sheet: 'articles_KOR',   matchCol: 'num',  imgCol: 'img', folder: 'articles' },
  articles_eng:   { sheet: 'articles_ENG',   matchCol: 'num',  imgCol: 'img', folder: 'articles' },
  news_kor:       { sheet: 'news_KOR',       matchCol: 'name', imgCol: 'img', folder: 'news' },
  news_eng:       { sheet: 'news_ENG',       matchCol: 'name', imgCol: 'img', folder: 'news' },
  curriculum_kor: { sheet: 'curriculum_KOR', matchCol: 'key',  imgCol: 'img', folder: 'curriculum' },
  curriculum_eng: { sheet: 'curriculum_ENG', matchCol: 'key',  imgCol: 'img', folder: 'curriculum' },
  site_kor:       { sheet: 'site_KOR',       matchCol: 'key',  imgCol: 'img', folder: 'home' },
  site_eng:       { sheet: 'site_ENG',       matchCol: 'key',  imgCol: 'img', folder: 'home' },
};

// ── GitHub API 공통 ──
function getToken_() {
  var token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  if (!token) {
    throw new Error('GITHUB_TOKEN이 없습니다. 프로젝트 설정 > 스크립트 속성에 추가하세요.');
  }
  return token;
}

function gh_(path, options) {
  options = options || {};
  options.headers = {
    'Authorization': 'Bearer ' + getToken_(),
    'Accept': 'application/vnd.github+json',
  };
  options.muteHttpExceptions = true;
  var res = UrlFetchApp.fetch('https://api.github.com' + path, options);
  var text = res.getContentText();
  return {
    code: res.getResponseCode(),
    body: text ? JSON.parse(text) : null,
  };
}

// ── 배포 스탬프 ──
// control 시트의 _stamp 행에 고유 값을 기록해서, GitHub Actions가
// "게시된 CSV가 이 편집을 반영했는지" 확인할 수 있게 한다.
function writeStamp_() {
  var stamp = 's' + new Date().getTime(); // 문자로 시작해야 시트가 날짜/숫자로 바꾸지 않음
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = null;
  var all = ss.getSheets();
  for (var i = 0; i < all.length; i++) {
    if (all[i].getSheetId() === CONTROL_SHEET_GID) { sheet = all[i]; break; }
  }
  if (!sheet) return stamp; // control 시트를 못 찾으면 스탬프 검증 없이 진행

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var keyIdx = headers.indexOf('key');
  var valIdx = headers.indexOf('enabled');
  if (keyIdx === -1 || valIdx === -1) return stamp;

  for (var r = 1; r < data.length; r++) {
    if (String(data[r][keyIdx]).trim() === '_stamp') {
      sheet.getRange(r + 1, valIdx + 1).setValue(stamp);
      return stamp;
    }
  }
  var row = [];
  for (var c = 0; c < headers.length; c++) row.push('');
  row[keyIdx] = '_stamp';
  row[valIdx] = stamp;
  sheet.appendRow(row);
  return stamp;
}

// ── 배포 트리거 + 결과 감시 ──
function triggerDeploy() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();

  var stamp = writeStamp_();
  SpreadsheetApp.flush();
  var dispatchedAt = new Date();

  var res = gh_('/repos/' + REPO + '/dispatches', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      event_type: 'sheets-update',
      client_payload: { stamp: stamp },
    }),
  });

  if (res.code !== 204) {
    ui.alert('❌ 배포 요청 실패', 'GitHub 응답 코드: ' + res.code + '\n' +
      (res.body && res.body.message ? res.body.message : '') +
      '\n\n토큰이 만료됐거나 권한이 부족할 수 있어요.', ui.ButtonSet.OK);
    return;
  }

  ss.toast('배포가 시작됐어요. 완료될 때까지 지켜보는 중... (최대 5분)', 'METES', -1);
  watchRun_(dispatchedAt);
}

function watchRun_(since) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();
  var deadline = new Date().getTime() + 4.7 * 60 * 1000; // Apps Script 6분 제한 여유
  var runId = null;

  while (new Date().getTime() < deadline) {
    Utilities.sleep(12000);

    if (!runId) {
      var list = gh_('/repos/' + REPO + '/actions/workflows/' + WORKFLOW_FILE +
        '/runs?event=repository_dispatch&per_page=5', {});
      if (list.code !== 200) continue;
      var runs = list.body.workflow_runs || [];
      for (var i = 0; i < runs.length; i++) {
        // dispatch 직후 생성된 실행 찾기 (시계 오차 감안해 15초 여유)
        if (new Date(runs[i].created_at).getTime() >= since.getTime() - 15000) {
          runId = runs[i].id;
          break;
        }
      }
      if (!runId) continue;
    }

    var run = gh_('/repos/' + REPO + '/actions/runs/' + runId, {});
    if (run.code !== 200) continue;

    if (run.body.status === 'completed') {
      if (run.body.conclusion === 'success') {
        ss.toast('사이트에 반영 완료! ✅', 'METES', 8);
      } else {
        ui.alert('❌ 배포 실패',
          '결과: ' + run.body.conclusion +
          '\n\n자세한 로그: ' + run.body.html_url, ui.ButtonSet.OK);
      }
      return;
    }
    ss.toast('배포 진행 중... (' + run.body.status + ')', 'METES', -1);
  }

  ui.alert('⏱ 아직 진행 중',
    '배포가 아직 끝나지 않았어요. 게시 캐시 대기 때문에 몇 분 더 걸릴 수 있어요.\n' +
    '잠시 후 [METES > 마지막 배포 상태 확인] 메뉴로 확인해 주세요.', ui.ButtonSet.OK);
}

// ── 마지막 배포 상태 확인 ──
function checkLastRun() {
  var ui = SpreadsheetApp.getUi();
  var list = gh_('/repos/' + REPO + '/actions/workflows/' + WORKFLOW_FILE +
    '/runs?per_page=1', {});
  if (list.code !== 200 || !list.body.workflow_runs || !list.body.workflow_runs.length) {
    ui.alert('배포 기록을 가져오지 못했어요. (HTTP ' + list.code + ')');
    return;
  }
  var run = list.body.workflow_runs[0];
  var when = Utilities.formatDate(new Date(run.created_at), 'Asia/Seoul', 'MM/dd HH:mm');
  var status = run.status === 'completed'
    ? (run.conclusion === 'success' ? '✅ 성공' : '❌ 실패 (' + run.conclusion + ')')
    : '⏳ 진행 중 (' + run.status + ')';
  ui.alert('마지막 배포: ' + when, status + '\n\n로그: ' + run.html_url, ui.ButtonSet.OK);
}

// ── 폴더 재귀 순회 (하위 폴더까지 전부 수집) ──
function collectFiles(folder, urlMap) {
  var files = folder.getFiles();
  while (files.hasNext()) {
    var file = files.next();
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var name = file.getName().replace(/\.[^.]+$/, '');
    urlMap[name] = 'https://drive.google.com/uc?id=' + file.getId();
  }
  var subs = folder.getFolders();
  while (subs.hasNext()) {
    collectFiles(subs.next(), urlMap);
  }
}

// ── 드라이브 이미지 → 스프레드시트 ──
function syncImages() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  Object.keys(SHEET_CONFIG).forEach(function(key) {
    var config = SHEET_CONFIG[key];
    var folderId = FOLDERS[config.folder];
    if (!folderId) return;

    var sheet = ss.getSheetByName(config.sheet);
    if (!sheet) return;

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var matchIdx = headers.indexOf(config.matchCol);
    var imgIdx = headers.indexOf(config.imgCol);
    if (matchIdx === -1 || imgIdx === -1) return;

    var folder = DriveApp.getFolderById(folderId);
    var urlMap = {};
    collectFiles(folder, urlMap);

    for (var i = 1; i < data.length; i++) {
      var matchValue = String(data[i][matchIdx]).trim();
      if (urlMap[matchValue]) {
        sheet.getRange(i + 1, imgIdx + 1).setValue(urlMap[matchValue]);
      }
    }
  });

  triggerDeploy();
}

// ── 메뉴 추가 ──
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('METES')
    .addItem('이미지 동기화 + 배포', 'syncImages')
    .addItem('지금 배포만', 'triggerDeploy')
    .addItem('마지막 배포 상태 확인', 'checkLastRun')
    .addToUi();
}
