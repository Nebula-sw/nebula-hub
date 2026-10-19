/**
 * 네뷸라 사이트 전환 바 (모든 *.nebula.kim 사이트 공용)
 *
 * 사용법: 각 사이트의 index.html <body> 안에 한 줄만 넣으면 됩니다.
 *   <script src="https://nebula.kim/switcher.js" defer></script>
 *
 * 동작:
 *   1. 이 파일과 같은 곳의 sites.json(사이트 목록)을 불러옴
 *   2. 페이지 맨 위에 바를 끼워 넣고, 사이트들을 게임 이름 버튼으로 나열
 *   3. 지금 보고 있는 사이트는 강조 표시 (주소의 도메인으로 판별)
 * → 새 사이트를 추가할 때는 sites.json 에 한 줄만 추가하면 모든 사이트의 바에 자동으로 나타남
 *
 * 선택 옵션 (script 태그 속성):
 *   data-site="sw"            지금 사이트 id를 직접 지정 (localhost 개발 중일 때 등)
 *   data-sites="/sites.json"  목록 파일 주소를 바꿀 때 (개발·테스트용)
 *
 * 색은 사이트의 CSS 변수를 따라갑니다 (없으면 기본 어두운 색):
 *   --nebula-bar-bg / --nebula-bar-fg / --nebula-bar-muted / --nebula-bar-border / --nebula-bar-active
 *   네뷸라 레이드처럼 --color-night-* 테마 변수가 있는 사이트는 자동으로 그 테마 색을 씀
 *
 * 사이트 스타일과 섞이지 않도록 Shadow DOM(바 안쪽만의 독립된 스타일 공간)에 그립니다.
 */
;(() => {
  // 같은 페이지에서 두 번 실행되지 않게
  if (window.__nebulaSwitcher) return
  window.__nebulaSwitcher = true

  const script = document.currentScript
  const sitesUrl = script?.dataset.sites || new URL('sites.json', script?.src || 'https://nebula.kim/').href
  const hubUrl = new URL('/', script?.src || 'https://nebula.kim/').href
  const forcedId = script?.dataset.site

  fetch(sitesUrl, { cache: 'no-cache' })
    .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
    .then(render)
    .catch(() => {
      // 목록을 못 불러오면 바를 그리지 않음 (사이트 자체는 정상 동작)
    })

  function render(sites) {
    if (!Array.isArray(sites) || sites.length === 0) return
    const currentId = forcedId || sites.find((s) => hostOf(s.url) === location.hostname)?.id

    const host = document.createElement('div')
    host.id = 'nebula-switcher'
    const root = host.attachShadow({ mode: 'open' })
    root.innerHTML = `
      <style>
        :host { all: initial; display: block; }
        nav {
          --bg: var(--nebula-bar-bg, var(--color-night-950, #0f0d16));
          --fg: var(--nebula-bar-fg, var(--color-night-100, #f1eef8));
          --muted: var(--nebula-bar-muted, var(--color-night-400, #9a93b0));
          --border: var(--nebula-bar-border, var(--color-night-800, #2a2638));
          --active: var(--nebula-bar-active, var(--color-night-800, #2a2638));
          display: flex; align-items: center; gap: 4px;
          height: 51px; padding: 0 16px; box-sizing: border-box;
          background: var(--bg); color: var(--fg);
          border-bottom: 1px solid var(--border);
          font: 500 14px/1 system-ui, -apple-system, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif;
          overflow-x: auto; scrollbar-width: none;
        }
        nav::-webkit-scrollbar { display: none; }
        a { color: inherit; text-decoration: none; }
        .brand {
          display: flex; align-items: center; gap: 6px; padding-right: 14px; margin-right: 6px;
          border-right: 1px solid var(--border); font-weight: 800; font-size: 15px; letter-spacing: .02em;
          white-space: nowrap;
        }
        /* 로고 색: 별은 보라, 글자는 보라→분홍 그라데이션 */
        .brand .star { color: #9680f2; }
        .brand .word {
          background: linear-gradient(90deg, #9680f2, #e8678a); -webkit-background-clip: text; background-clip: text;
          color: transparent;
        }
        .brand:hover { filter: brightness(1.15); }
        .site {
          display: flex; align-items: center; gap: 7px; height: 34px; padding: 0 14px;
          border-radius: 8px; color: var(--muted); white-space: nowrap;
        }
        .site:hover { color: var(--fg); background: color-mix(in srgb, var(--active) 60%, transparent); }
        .site.current { color: var(--fg); background: var(--active); font-weight: 700; }
        .dot { width: 9px; height: 9px; border-radius: 50%; flex: none; }
      </style>
      <nav aria-label="네뷸라 사이트">
        <a class="brand" href="${hubUrl}" title="Nebula 사이트 모음"><span class="star">✦</span><span class="word">Nebula</span></a>
        ${sites
          .map((s) => {
            const current = s.id === currentId
            return `<a class="site${current ? ' current' : ''}" href="${current ? '#' : s.url}" ${
              current ? 'aria-current="page"' : ''
            } title="${escapeHtml(s.name)} · ${escapeHtml(s.description || '')}">
              <span class="dot" style="background:${escapeHtml(s.color || '#888')}"></span>
              ${escapeHtml(s.game || s.name)}
            </a>`
          })
          .join('')}
      </nav>`
    // 지금 사이트 버튼은 눌러도 이동하지 않게
    root.querySelector('.site.current')?.addEventListener('click', (e) => e.preventDefault())
    document.body.prepend(host) // body 맨 앞(= 화면 맨 위)에 끼워 넣기
  }

  function hostOf(url) {
    try {
      return new URL(url).hostname
    } catch {
      return ''
    }
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
  }
})()
