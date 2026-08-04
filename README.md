# METES 웹사이트 — 운영 & 인수인계 가이드

- **사이트 주소**: https://metes-institute.github.io/metes-website/
- **콘텐츠 관리**: 구글 스프레드시트 (아래 "관리자 가이드" 참고)
- **코드 저장소**: https://github.com/METES-Institute/metes-website

---

## 1부. 관리자 가이드 (비개발자용)

사이트의 모든 텍스트·이미지는 **구글 시트에서 관리**합니다. 코드를 만질 일은 없습니다.

### 내용 수정하고 사이트에 반영하기

1. 구글 시트를 엽니다 (METES 관리 계정에 공유되어 있음)
2. 원하는 탭에서 내용을 수정합니다
3. 시트 상단 메뉴 **METES → 지금 배포만** 클릭
4. 화면 오른쪽 아래에 진행 상황이 표시되고, 완료되면 **"사이트에 반영 완료! ✅"** 메시지가 뜹니다 (보통 1~3분, 길면 5분)
5. 사이트를 새로고침해서 확인합니다

> 처음 실행할 때는 구글이 권한 승인 창을 띄웁니다. 시트 관리 계정으로 승인하면 됩니다.

### 시트 탭별 역할

| 탭 | 내용 |
|----|----|
| `site_KOR` / `site_ENG` | 각 페이지의 제목·소개문 등 일반 텍스트 |
| `members_KOR` / `members_ENG` | 멤버 (모더레이터, 마이스터, 메이커) |
| `articles_KOR` / `articles_ENG` | 포럼 세션 카드, 다음 세션 안내 |
| `news_KOR` / `news_ENG` | 뉴스 목록과 대표 기사 |
| `curriculum_KOR` / `curriculum_ENG` | 커리큘럼 (러닝블록, 화/금 세션) |
| `control` | 기능 켜기/끄기 스위치 |

- 첫 칸이 `[예시]` 또는 `[Example]`로 시작하는 행은 사이트에 반영되지 않습니다 (참고용 샘플).
- `control` 탭의 `_stamp` 행은 배포 시스템이 자동으로 쓰는 값이니 **지우거나 수정하지 마세요.**

### 이미지 넣기

이미지는 구글 드라이브의 전용 폴더에 올립니다 (members / articles / news / curriculum / home 폴더).

1. **파일 이름을 시트의 매칭 값과 똑같이** 맞춥니다
   - 멤버·뉴스: `name` 값 (예: `홍길동.jpg`)
   - 포럼 카드: `num` 값 (예: `12.png`)
   - 커리큘럼·사이트: `key` 값
2. 해당 드라이브 폴더에 업로드합니다
3. 시트 메뉴 **METES → 이미지 동기화 + 배포** 클릭 — 이미지 주소가 시트에 자동 입력되고 배포까지 이어집니다

### 문제가 생겼을 때

- **배포가 실패했다고 뜸** → 시트 메뉴 **METES → 마지막 배포 상태 확인**을 눌러 결과와 로그 링크를 확인합니다.
- **"GITHUB_TOKEN이 없습니다" 오류** → 토큰이 지워졌거나 만료된 경우입니다. 2부의 "토큰 재발급" 절차대로 새로 발급해 넣으면 됩니다.
- **수정했는데 사이트가 그대로임** → 배포는 성공했는데 브라우저가 옛날 화면을 기억하는 경우가 많습니다. 강력 새로고침(Mac: Cmd+Shift+R / Windows: Ctrl+F5)을 해보세요.
- 해결이 안 되면 개발자에게 **마지막 배포 상태 확인**에 나온 로그 링크와 함께 문의하세요.

---

## 2부. 개발자 가이드

### 전체 구조

```
구글 시트 (콘텐츠 원본)
   │  METES 메뉴 버튼 (Apps Script)
   ▼
GitHub repository_dispatch 이벤트
   │
   ▼
GitHub Actions (.github/workflows/sync.yml)
   │  node sync.js — 게시된 CSV를 읽어 js/data.js 생성
   ▼
js/data.js 자동 커밋 → GitHub Pages 재배포
```

- 사이트는 **순수 정적 사이트**입니다 (서버·DB 없음). GitHub Pages가 `main` 브랜치를 그대로 서빙합니다.
- 모든 콘텐츠는 빌드 시점에 `js/data.js` 하나로 구워지고, 각 페이지가 이를 읽어 렌더링합니다.

### 파일 안내

| 파일 | 역할 |
|------|------|
| `*.html` | 페이지들 (index가 진입점, home/members/curriculum/news/search 등) |
| `js/data.js` | **자동 생성 파일 — 직접 수정 금지.** 시트 동기화로만 갱신됨 |
| `js/main.js`, `js/components.js` | 렌더링 로직, 공용 컴포넌트 |
| `sync.js` | 시트(웹에 게시된 CSV) → `data.js` 변환 스크립트. Actions에서 실행됨 |
| `.github/workflows/sync.yml` | 동기화 워크플로우. `repository_dispatch`(시트 버튼)와 `workflow_dispatch`(수동)로 실행 |
| `apps-script.gs` | 구글 시트에 붙어 있는 Apps Script의 **사본** (원본은 시트 안에 있음). 시트 쪽 코드를 수정하면 이 파일도 같이 갱신할 것 |

### 배포 안정화 장치 (알아두면 디버깅에 유용)

- 구글 "웹에 게시" CSV는 편집 후 몇 분간 옛 데이터를 반환할 수 있습니다. 이를 막기 위해 Apps Script가 배포 직전 `control` 탭의 `_stamp` 값을 갱신해 dispatch payload로 보내고, `sync.js`는 게시된 CSV에 그 스탬프가 나타날 때까지 대기(35초 × 최대 8회)한 뒤 데이터를 읽습니다.
- Apps Script는 dispatch 후 Actions 실행 결과를 폴링해서 성공/실패를 시트 안에 표시합니다.

### GitHub 토큰 재발급 (만료·분실 시)

1. 조직 owner 권한이 있는 계정으로 github.com → Settings → Developer settings → **Fine-grained tokens** → Generate new token
2. **Resource owner**: `METES-Institute`
3. **Repository access**: Only select repositories → `metes-website`
4. **Permissions**: Contents = **Read and write**, Actions = **Read-only**
5. Expiration: No expiration (조직 정책에서 허용되어 있음)
6. 발급된 토큰을 시트 → 확장 프로그램 → Apps Script → 프로젝트 설정(⚙️) → **스크립트 속성**의 `GITHUB_TOKEN` 값에 저장

> 토큰 값은 스크립트 속성에만 보관하고 문서·코드·채팅에 남기지 않습니다.

### 로컬 개발

```bash
git clone https://github.com/METES-Institute/metes-website.git
cd metes-website
# 정적 사이트라 그냥 로컬 서버로 열면 됨
python3 -m http.server 8000   # → http://localhost:8000

# 시트 데이터를 수동으로 다시 굽고 싶을 때
node sync.js                  # js/data.js 재생성
```

`main`에 push하면 GitHub Pages가 자동으로 재배포합니다.

---

## 3부. 자산 목록 (인수인계 체크리스트)

| 자산 | 위치 / 계정 | 상태 |
|------|------------|------|
| GitHub 조직 `METES-Institute` | github.com/METES-Institute | 클라이언트 계정을 Owner로 초대 필요 |
| 레포 `metes-website` | 조직 소유로 이전 완료 | ✅ |
| GitHub Pages | metes-institute.github.io/metes-website | ✅ 작동 중 |
| GitHub 토큰 (`METESWeB`) | Apps Script 스크립트 속성 `GITHUB_TOKEN` | ✅ 무기한, metes-website 한정 |
| 구글 스프레드시트 (콘텐츠 원본) | 시트 소유 계정 확인 | 클라이언트 구글 계정으로 소유권 이전 권장 |
| 구글 드라이브 이미지 폴더 5개 (members/articles/news/curriculum/home) | 시트와 동일 | 클라이언트 구글 계정으로 소유권 이전 권장 |
| Apps Script (시트 내장) | 시트에 종속 — 시트와 함께 이전됨 | ✅ |
| 신청 폼 링크 | walla.my/a/metes_cohort4 (articles 데이터에 하드코딩, `sync.js` 내) | 기수 변경 시 수정 필요 |
