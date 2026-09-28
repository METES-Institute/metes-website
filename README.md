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

이미지는 구글 드라이브에 올린 뒤, 공유 링크를 시트에 붙여넣는 방식입니다.

1. 이미지를 구글 드라이브의 전용 폴더에 업로드합니다 (members / articles / news / curriculum / home 폴더)
2. 업로드한 파일 우클릭 → **공유** → 일반 액세스를 **"링크가 있는 모든 사용자"로 변경** (이걸 안 하면 사이트에서 이미지가 안 보입니다!)
3. **링크 복사**를 눌러 공유 링크를 복사합니다
4. 시트에서 해당 행의 `img` 칸에 복사한 링크를 붙여넣습니다
5. 시트 메뉴 **METES → 지금 배포만** 클릭

> 참고 — 자동 입력 기능: 파일 이름을 시트의 매칭 값과 똑같이 맞춰서 올리면 (멤버·뉴스는 `name` 값, 포럼 카드는 `num` 값, 커리큘럼·사이트는 `key` 값. 예: `홍길동.jpg`), **METES → 이미지 동기화 + 배포** 한 번으로 공개 설정과 링크 입력이 전부 자동 처리됩니다. 여러 장을 한꺼번에 올릴 때 편합니다.

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

---

## 4부. 랜딩페이지 리뉴얼 초안 (`landing.html`) 콘텐츠 관리

`landing.html`은 원페이지 랜딩 리뉴얼 **초안**입니다. 아직 `index.html`을 대체하지 않았고,
기존 시트(`csv/*.csv`, `js/data.js`)와도 연결되어 있지 않은 **독립된 정적 파일**입니다.

이 초안의 문구·사진·숫자·이름은 전부 `content/landing.json` 한 파일에 들어 있고,
`js/landing-render.js`가 페이지 로드 시 그 값을 읽어 화면에 채웁니다.

이 JSON은 **사이트 화면에서 직접** 고칠 수 있습니다 (`js/inline-editor.js`). 별도 가입이나
서버 없이, GitHub 계정 자체를 로그인 수단으로 씁니다.

### 파일 구성

| 파일 | 역할 |
|------|------|
| `content/landing.json` | 랜딩페이지 콘텐츠 원본. 지금 화면에 있는 실제 값이 전부 들어있음 |
| `js/landing-render.js` | 그 JSON을 읽어 `landing.html`의 각 요소를 채우는 렌더러 |
| `js/inline-editor.js` | 화면 우측 하단 ✎ 버튼(또는 `Alt+Shift+E`)으로 여는 편집 모드 |
| `admin/config.yml`, `admin/index.html` | (선택) Decap CMS — 나중에 더 정식화된 편집 화면이 필요해지면 쓸 대안. 지금 당장은 안 써도 됨 |
| `METES_landing_content_schema.xlsx` | 같은 스키마를 엑셀로 미리 본 초안 (참고용) |

`content/landing.json`이 없거나 fetch에 실패하면(오프라인 등) `landing.html`에 이미 적혀 있는
값이 그대로 보이도록 안전망을 넣어뒀습니다 — 페이지 자체가 깨지지는 않습니다.

### 사이트에서 바로 편집하기 (가입 없음, 처음 한 번만 준비)

**미리 알아둘 것:** 이 방식은 진짜 "로그인 화면"이 아니라, 여러분의 GitHub 계정으로 발급한
"이 레포 전용 열쇠(토큰)"를 매번 입력하는 방식이에요. 비밀번호를 코드에 숨겨두는 건 원래
불가능한데(브라우저에서 실행되는 코드는 누구나 볼 수 있어서), **토큰은 코드에 저장하지 않고
편집할 때마다 직접 입력**하기 때문에 안전합니다. 새로고침하면 토큰은 사라집니다.

**처음 한 번, 토큰 만들기**

1. `github.com` 로그인 → 우측 상단 프로필 → **Settings**
2. 맨 아래 **Developer settings** → **Personal access tokens** → **Fine-grained tokens** →
   **Generate new token**
3. 아래처럼 설정:
   - Resource owner: `METES-Institute`
   - Repository access: **Only select repositories** → `metes-website`
   - Permissions → Repository permissions → **Contents: Read and write**
   - Expiration: 90일 정도로 설정 (만료되면 새로 만들면 됨)
4. **Generate token** → `github_pat_...`로 시작하는 문자열이 딱 한 번 보여집니다. 복사해서
   메모장 등에 잠깐 붙여두세요 (다시는 못 봄 — 잃어버리면 새로 만들면 됨).

**편집할 때마다**

1. 사이트 화면 우측 아래 작은 **✎** 버튼 클릭 (또는 키보드 `Alt+Shift+E`)
2. 위에서 만든 토큰을 붙여넣고 확인
3. 화면에 주황 점선으로 표시된 글자(제목, 배지, 링크 라벨 등)는 **그 자리를 클릭해서 바로 수정**
4. 멤버 이름 추가/삭제, 로드맵 블록 추가처럼 "목록 자체를 바꾸는" 편집은 하단 **"전체 JSON 편집"**
   버튼을 눌러 나오는 칸에서 직접 고칩니다 (형식은 `content/landing.json`과 동일)
5. 다 고쳤으면 하단의 **저장 (커밋)** 버튼 클릭 → GitHub에 커밋이 생기고, 1~2분 뒤 실제
   사이트에 반영됩니다

**주의할 점**

- 토큰을 다른 사람과 공유하지 마세요. 이 토큰을 가진 사람은 누구나 이 레포에 쓸 수 있습니다.
- 위 3번에서 권한을 **이 레포 하나, Contents 권한만**으로 좁혀뒀기 때문에, 혹시 토큰이 새더라도
  피해 범위가 이 레포로 한정됩니다 (계정 전체가 털리지 않음).
- 편집 권한을 늘리거나 줄이려면, GitHub 레포의 **Collaborators** 목록만 관리하면 됩니다 —
  그 목록에 있는 사람만 위 방식으로 토큰을 만들어 편집할 수 있습니다.

### (선택) Decap CMS — 나중에 필요해지면

지금 당장은 위 방식만으로 충분합니다. 다만 편집자가 여러 명으로 늘어나거나, 각 항목을
폼처럼 깔끔하게 채우고 싶어지면 `admin/` 폴더에 이미 준비해둔 Decap CMS로 넘어갈 수 있습니다.
이건 GitHub 로그인 화면을 대신 처리해줄 곳(예: Netlify 무료 계정)이 하나 더 필요해서, 지금은
설정을 미뤄뒀습니다. 필요해지면 말씀해주세요.
