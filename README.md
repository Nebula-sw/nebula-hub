# Nebula 허브 (nebula.kim)

`*.nebula.kim` 게임 도우미 사이트들을 하나로 묶는 허브입니다. 서버 코드 없이 파일만 올리는 정적 사이트예요 (Cloudflare Workers Static Assets, 무료).

허브는 세 가지를 맡습니다.

1. **첫 화면** (`nebula.kim`): 사이트 카드 목록과 "홈 화면에 앱처럼 추가하기" 안내
2. **모든 사이트 공용 기능** (`switcher.js`): 맨 위 사이트 전환 바, 테마(라이트/다크/시스템 + 색 테마) 선택, 공용 알림창
3. **공용 디자인 원본**: 구름+별 로고, 탭 아이콘, 홈 화면 아이콘, 카톡 공유 썸네일

## Nebula 사이트 전체 구성

| 사이트 | 주소 | 저장소 | 내용 |
|---|---|---|---|
| 허브 | https://nebula.kim | `Nebula-sw/nebula-hub` (이곳) | 사이트 모음, 공용 바·테마·알림창 |
| 로스트아크 | https://loa.nebula.kim | `Nebula-sw/Lostark` | 원정대 등록 → 레이드 공대 자동 조합, 시세 |
| 니케 | https://nikke.nebula.kim | `Nebula-sw/Nikke` | 육성 시트를 캐릭터 카드로 (속성 필터) |
| 명조 | https://wuwa.nebula.kim | `Nebula-sw/WUWA` | 아카라이브 위키 "잘키웠다표"를 캐릭터 카드로 |

모든 사이트는 Cloudflare Workers에 GitHub를 연결해 두어서 **`main`에 push하면 자동 배포**됩니다.

## 파일 구성

| 파일 | 역할 |
|---|---|
| `public/sites.json` | **사이트 목록. 새 사이트는 여기에 한 항목만 추가** |
| `public/switcher.js` | 모든 사이트 맨 위에 붙는 공용 스크립트 (전환 바 · 테마 창 · `nebula.alert`) |
| `public/index.html` | `nebula.kim` 첫 화면 (사이트 카드 + 홈 화면 추가 안내) |
| `public/logo.svg` | 로고 원본 (구름 + 흰 테두리 금별). 바·첫 화면·아이콘이 모두 이걸 씀 |
| `public/favicon.svg`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` | 탭 아이콘 · 홈 화면 아이콘 |
| `public/manifest.webmanifest` | 홈 화면에 추가했을 때 앱 이름·아이콘·주소창 없이 열기 설정 |
| `public/og.png` | 카톡 등 공유 썸네일 |
| `public/_headers` | 다른 사이트가 `sites.json`·`switcher.js`를 불러갈 수 있게 CORS 허용, 캐시 5분 |
| `docs/og/` | 썸네일·아이콘 원본(`og.html`, `icon.html`)과 만드는 스크립트(`make.mjs`) |
| `docs/logos*.png` | 로고 시안들 (최종: `logos8.html`의 5번 "흰 테두리 금별") |

## 새 사이트 추가하기

1. 새 사이트 `index.html`의 `<body>` 맨 끝에 한 줄:
   ```html
   <script src="https://nebula.kim/switcher.js" data-site="새사이트id" defer></script>
   ```
2. 이 저장소 `public/sites.json`에 한 항목 추가 후 push:
   ```json
   { "id": "hsr", "name": "스타레일", "game": "스타레일", "url": "https://hsr.nebula.kim", "color": "#7aa2ff", "description": "한 줄 설명" }
   ```
   - 맨 위 바와 첫 화면 카드에는 `game`이 보이고, `name`·`description`은 마우스를 올리면 나옵니다.
3. 기존 사이트들은 고칠 필요 없습니다. 캐시 때문에 최대 5분 뒤 모든 사이트 바에 나타납니다.
4. (선택) 아이콘·썸네일: `docs/og/make.mjs`의 `targets`에 새 사이트 폴더와 설명을 추가하고 `node docs/og/make.mjs` 실행
   → `og.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`가 그 사이트 `public/`에 만들어집니다.

## switcher.js 사용법 (사이트가 지킬 약속)

### 전환 바
- 지금 사이트는 주소(도메인)로 알아서 강조됩니다. 로컬 개발 중이면 `data-site="loa"`처럼 직접 지정하세요.
- 바 색은 사이트 CSS 변수를 따라갑니다. 없으면 기본 어두운 색.
  - 우선순위: `--nebula-bar-*` → `--color-night-*`/`--color-lav-*`(로아 테마 변수) → 기본값
  - 직접 지정 예: `:root { --nebula-bar-bg: #101010; --nebula-bar-fg: #fff; --nebula-bar-muted: #999; --nebula-bar-border: #222; --nebula-bar-active: #222; --nebula-bar-panel: #181818; --nebula-bar-accent: #ff4655; }`

### 테마 (바 오른쪽 [테마] 버튼)
- 화면 모드: `<html data-theme="light|dark">` (속성 없음 = 시스템 설정), 저장 이름 `theme`
- 색 테마: `<html data-palette="id">`, 저장 이름 `palette`
- 색 테마 목록 알려주기 (안 정하면 화면 모드만 보임):
  ```js
  window.nebulaTheme = { defaultPalette: 'lavender', palettes: [{ id: 'lavender', name: '라벤더', color: '#9680f2' }] }
  ```
- 바꿀 때마다 `window`에 `nebula:theme` 이벤트가 옵니다 (`detail: { mode, palette }`).
- 새로고침 깜빡임 방지: `<head>`에 저장값을 먼저 붙이는 짧은 스크립트를 넣으세요 (`public/index.html` 참고).
- 사이트 CSS는 `:root[data-theme="light"] { ... }`와 `@media (prefers-color-scheme: light) { :root:not([data-theme="dark"]) { ... } }` 두 곳에 같은 라이트 색을 넣으면 됩니다.

### 공용 알림창
```js
await window.nebula.alert('이 공대에는 이미 승객이 있어요.')
```
- 화면 가운데 사이트 디자인 알림창 (브라우저 기본 alert 대신). 휴대폰에서도 같은 모양.
- [확인]·Enter·Esc·바깥 클릭으로 닫히고, 여러 개면 순서대로 하나씩 보여줍니다.
- 스크립트를 못 불러온 경우를 대비해 사이트에서는 `window.nebula?.alert ? nebula.alert(msg) : alert(msg)`처럼 쓰세요.

```js
if (await window.nebula.confirm('이번 주 기록을 지울까요?', { ok: '초기화', danger: true })) { ... }
```
- [취소]/[확인] 확인창. 확인 → `true`, 취소·Esc·바깥 클릭 → `false`. Enter는 확인.
- `ok` = 확인 버튼 글자 (기본 "확인"), `danger: true` = 확인 버튼 빨간색 (지우기처럼 되돌릴 수 없는 작업)

## 로컬 실행 / 배포

```bash
npm install
npm run dev      # http://localhost:8787
```

- 배포: Cloudflare 대시보드 → Workers & Pages → 이 저장소 연결 (Deploy command `npx wrangler deploy`) → Custom domain `nebula.kim`
- 다른 사이트를 로컬에서 띄워 바를 시험할 때는 그 사이트 script 태그에 `data-sites="http://localhost:8787/sites.json"`을 붙이면 로컬 목록을 씁니다.
