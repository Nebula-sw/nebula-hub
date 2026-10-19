# Nebula hub (nebula.kim)

`*.nebula.kim` 게임 도우미 사이트들을 묶는 허브입니다. 서버 코드 없는 정적 사이트(Cloudflare Workers Static Assets)입니다.

| 파일 | 역할 |
|---|---|
| `public/sites.json` | **사이트 목록. 새 사이트는 여기에 한 줄만 추가** |
| `public/switcher.js` | 각 사이트 맨 위에 붙는 사이트 전환 바 (공용) |
| `public/index.html` | `nebula.kim` 첫 화면 (사이트 모음) |
| `public/_headers` | 다른 사이트에서 목록·바를 불러갈 수 있게 CORS 허용, 캐시 5분 |

## 새 사이트 추가하기

1. 새 사이트의 `index.html` `<body>` 안에 한 줄:
   ```html
   <script src="https://nebula.kim/switcher.js" defer></script>
   ```
2. 이 저장소의 `public/sites.json` 에 한 항목 추가 후 push (자동 배포):
   ```json
   { "id": "wuwa", "name": "명조 ○○", "game": "명조", "url": "https://wuwa.nebula.kim", "color": "#5cc98a", "description": "설명" }
   ```
   (맨 위 바에는 `game`(게임 이름)만 표시되고, `name`·`description`은 마우스를 올렸을 때 나옵니다.)
3. 끝. 기존 사이트들은 고칠 필요 없음 (캐시 때문에 최대 5분 뒤 반영)

## 전환 바 색 맞추기 (선택)

바는 사이트의 CSS 변수 `--color-night-*`(네뷸라 레이드 테마)를 자동으로 따라가고, 없으면 기본 어두운 색입니다.
다른 사이트에서 색을 직접 정하려면 그 사이트 CSS에:
```css
:root { --nebula-bar-bg: #101010; --nebula-bar-fg: #fff; --nebula-bar-muted: #999; --nebula-bar-border: #222; --nebula-bar-active: #222; }
```

## 로컬 실행 / 배포

```bash
npm install
npm run dev      # http://localhost:8787
```
배포는 Cloudflare 대시보드에서 이 저장소를 연결(Deploy command `npx wrangler deploy`)하고, Custom domain에 `nebula.kim`(루트)을 추가합니다.

## 테마 (맨 위 바의 [테마] 버튼)

바가 화면 모드(라이트/다크/시스템)와 색 테마를 고르는 창을 그려 줍니다. 사이트는 아래 약속만 지키면 됩니다.

- 화면 모드: `<html data-theme="light|dark">` (속성 없음 = 시스템), 저장 이름 `theme`
- 색 테마: `<html data-palette="id">`, 저장 이름 `palette`
- 색 테마 목록을 바에 알려주기 (없으면 화면 모드만 보임):
  ```js
  window.nebulaTheme = { defaultPalette: 'red', palettes: [{ id: 'red', name: '레드', color: '#ff4655' }] }
  ```
- 새로고침 깜빡임 방지: `<head>`에 저장값을 먼저 붙이는 짧은 스크립트 (public/index.html 참고)
- 사이트 CSS는 `:root[data-theme="light"]` 와 `@media (prefers-color-scheme: light) { :root:not([data-theme="dark"]) }` 두 곳에 라이트 색을 넣으면 됩니다.

## 공용 알림창

`switcher.js` 를 넣은 사이트는 `window.nebula.alert('메시지')` 로 사이트 디자인 알림창을 띄울 수 있습니다 (브라우저 기본 alert 대신).
닫히면 끝나는 Promise를 돌려주고, 여러 개면 순서대로 보여줍니다. 스크립트를 못 불러온 경우를 대비해 사이트 쪽에서는
`window.nebula?.alert ? nebula.alert(msg) : alert(msg)` 처럼 기본 alert로 대신하게 해 두세요.
