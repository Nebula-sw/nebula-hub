/**
 * Nebula 사이트 전환 바 + 테마 선택 (모든 *.nebula.kim 사이트 공용)
 *
 * 사용법: 각 사이트의 index.html <body> 안에 한 줄만 넣으면 됩니다.
 *   <script src="https://nebula.kim/switcher.js" defer></script>
 *
 * 동작:
 *   1. 이 파일과 같은 곳의 sites.json(사이트 목록)을 불러옴
 *   2. 페이지 맨 위에 바를 끼워 넣고, 사이트들을 게임 이름 버튼으로 나열
 *   3. 지금 보고 있는 사이트는 강조 표시 (주소의 도메인으로 판별)
 *   4. 바 오른쪽 [테마] 버튼: 화면 모드(라이트/다크/시스템) + 그 사이트의 색 테마 선택
 * → 새 사이트를 추가할 때는 sites.json 에 한 줄만 추가하면 모든 사이트의 바에 자동으로 나타남
 *
 * 선택 옵션 (script 태그 속성):
 *   data-site="loa"           지금 사이트 id를 직접 지정 (localhost 개발 중일 때 등)
 *   data-sites="/sites.json"  목록 파일 주소를 바꿀 때 (개발·테스트용)
 *
 * ── 테마 약속 (사이트가 지킬 것) ──
 *   화면 모드: <html data-theme="light|dark"> (속성 없음 = 시스템 설정 따라감), localStorage 'theme'
 *   색 테마:   <html data-palette="id">, localStorage 'palette'
 *   → 사이트 CSS가 이 두 속성을 보고 색을 바꾸면 됩니다. 바는 속성을 바꾸고 저장만 함.
 *   색 테마 목록은 사이트가 알려줌 (없으면 화면 모드만 보임):
 *     window.nebulaTheme = { palettes: [{ id: 'red', name: '레드', color: '#ff4655' }, ...], defaultPalette: 'red' }
 *   바꿀 때마다 window 에 'nebula:theme' 이벤트를 보냄 (detail: { mode, palette })
 *   새로고침 때 깜빡임이 없도록 각 사이트 <head>에 저장값을 먼저 적용하는 짧은 스크립트를 넣어 두세요 (README 참고)
 *
 * 색은 사이트의 CSS 변수를 따라갑니다 (없으면 기본 어두운 색):
 *   --nebula-bar-bg / --nebula-bar-fg / --nebula-bar-muted / --nebula-bar-border / --nebula-bar-active / --nebula-bar-accent
 *   네뷸라 레이드처럼 --color-night-* / --color-lav-* 테마 변수가 있는 사이트는 자동으로 그 테마 색을 씀
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
  const logoUrl = new URL('logo.svg', script?.src || 'https://nebula.kim/').href // 구름+별 로고
  const forcedId = script?.dataset.site
  const html = document.documentElement

  const MODES = [
    { id: 'light', label: '라이트' },
    { id: 'dark', label: '다크' },
    { id: 'system', label: '시스템' },
  ]

  fetch(sitesUrl, { cache: 'no-cache' })
    .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
    .then(render)
    .catch(() => {
      // 목록을 못 불러오면 바를 그리지 않음 (사이트 자체는 정상 동작)
    })

  // ── 테마 읽기/쓰기 (localStorage = 브라우저 저장소. 사생활 보호 모드 등에서 실패해도 동작은 하게 try) ──
  function load(key) {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  }
  function save(key, value) {
    try {
      if (value == null) localStorage.removeItem(key)
      else localStorage.setItem(key, value)
    } catch {}
  }
  function themeConfig() {
    const c = window.nebulaTheme || {}
    return { palettes: Array.isArray(c.palettes) ? c.palettes : [], defaultPalette: c.defaultPalette }
  }
  function currentMode() {
    const t = html.dataset.theme
    return t === 'light' || t === 'dark' ? t : 'system'
  }
  function currentPalette() {
    const { palettes, defaultPalette } = themeConfig()
    const id = html.dataset.palette
    return palettes.some((p) => p.id === id) ? id : defaultPalette || palettes[0]?.id
  }
  function setMode(mode) {
    if (mode === 'system') delete html.dataset.theme
    else html.dataset.theme = mode
    save('theme', mode === 'system' ? null : mode)
    announce()
  }
  function setPalette(id) {
    html.dataset.palette = id
    save('palette', id)
    announce()
  }
  function announce() {
    window.dispatchEvent(new CustomEvent('nebula:theme', { detail: { mode: currentMode(), palette: currentPalette() } }))
  }

  function render(sites) {
    if (!Array.isArray(sites) || sites.length === 0) return
    const currentId = forcedId || sites.find((s) => hostOf(s.url) === location.hostname)?.id

    const host = document.createElement('div')
    host.id = 'nebula-switcher'
    const root = host.attachShadow({ mode: 'open' })
    root.innerHTML = `
      <style>
        /* position + z-index: 펼친 테마 창이 사이트의 고정 헤더보다 위에 보이게 */
        :host { all: initial; display: block; position: relative; z-index: 2147483000; }
        .wrap {
          --bg: var(--nebula-bar-bg, var(--color-night-950, #0f0d16));
          --fg: var(--nebula-bar-fg, var(--color-night-100, #f1eef8));
          --muted: var(--nebula-bar-muted, var(--color-night-400, #9a93b0));
          --border: var(--nebula-bar-border, var(--color-night-800, #2a2638));
          --active: var(--nebula-bar-active, var(--color-night-800, #2a2638));
          --panel: var(--nebula-bar-panel, var(--color-night-900, var(--bg)));
          --accent: var(--nebula-bar-accent, var(--color-lav-500, #9680f2));
          font: 500 14px/1 system-ui, -apple-system, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif;
          color: var(--fg);
        }
        nav {
          display: flex; align-items: center; gap: 4px;
          height: 51px; padding: 0 16px; box-sizing: border-box;
          background: var(--bg); border-bottom: 1px solid var(--border);
          overflow-x: auto; scrollbar-width: none;
        }
        nav::-webkit-scrollbar { display: none; }
        a { color: inherit; text-decoration: none; }
        button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
        .brand {
          display: flex; align-items: center; gap: 6px; padding-right: 14px; margin-right: 6px;
          border-right: 1px solid var(--border); font-weight: 800; font-size: 15px; letter-spacing: .02em;
          white-space: nowrap;
        }
        .brand img { width: 24px; height: 24px; display: block; }
        .brand { color: var(--fg); }
        .brand:hover { filter: brightness(1.12); }
        .site, .theme-btn {
          display: flex; align-items: center; gap: 7px; height: 34px; padding: 0 14px;
          border-radius: 8px; color: var(--muted); white-space: nowrap;
        }
        .site:hover, .theme-btn:hover, .theme-btn[aria-expanded='true'] {
          color: var(--fg); background: color-mix(in srgb, var(--active) 60%, transparent);
        }
        .site.current { color: var(--fg); background: var(--active); font-weight: 700; }
        .dot { width: 9px; height: 9px; border-radius: 50%; flex: none; }
        .theme-btn { margin-left: auto; flex: none; }
        .theme-btn .dot { background: var(--accent); }

        /* ── 펼쳐지는 테마 창 ── */
        .pop {
          position: absolute; top: calc(100% + 6px); right: 12px; width: 264px; box-sizing: border-box;
          padding: 14px; border-radius: 12px; background: var(--panel); border: 1px solid var(--border);
          box-shadow: 0 12px 32px rgba(0, 0, 0, .28);
        }
        [hidden] { display: none !important; }
        .pop h3 { margin: 0 0 8px; font-size: 12px; font-weight: 600; color: var(--muted); }
        .pop h3 + * { margin-bottom: 14px; }
        .pop > :last-child { margin-bottom: 0; }
        .modes { display: flex; gap: 3px; padding: 3px; border-radius: 9px; background: var(--active); }
        .modes button { flex: 1; height: 30px; border-radius: 7px; font-size: 13px; color: var(--muted); }
        .modes button:hover { color: var(--fg); }
        .modes button.on { background: var(--accent); color: #fff; font-weight: 700; }
        .swatches { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
        .swatches button {
          display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 8px 4px;
          border-radius: 9px; font-size: 12px; color: var(--muted);
        }
        .swatches button:hover { background: var(--active); }
        .swatches button.on { background: var(--active); color: var(--fg); font-weight: 700; box-shadow: inset 0 0 0 2px var(--accent); }
        .swatches .chip { width: 20px; height: 20px; border-radius: 50%; }
        @media (max-width: 480px) { .theme-btn .label { display: none; } .theme-btn { padding: 0 11px; } }
      </style>
      <div class="wrap">
        <nav aria-label="Nebula 사이트">
          <a class="brand" href="${hubUrl}" title="Nebula 사이트 모음"><img src="${logoUrl}" alt=""><span>Nebula</span></a>
          ${sites
            .map((s) => {
              const current = s.id === currentId
              return `<a class="site${current ? ' current' : ''}" href="${current ? '#' : escapeHtml(s.url)}" ${
                current ? 'aria-current="page"' : ''
              } title="${escapeHtml(s.name)} · ${escapeHtml(s.description || '')}">
                <span class="dot" style="background:${escapeHtml(s.color || '#888')}"></span>
                ${escapeHtml(s.game || s.name)}
              </a>`
            })
            .join('')}
          <button class="theme-btn" aria-expanded="false" title="테마 바꾸기"><span class="dot"></span><span class="label">테마</span></button>
        </nav>
        <div class="pop" hidden>
          <h3 class="palette-title">색 테마</h3>
          <div class="swatches"></div>
          <h3>화면 모드</h3>
          <div class="modes">${MODES.map((m) => `<button data-mode="${m.id}">${m.label}</button>`).join('')}</div>
        </div>
      </div>`

    // 지금 사이트 버튼은 눌러도 이동하지 않게
    root.querySelector('.site.current')?.addEventListener('click', (e) => e.preventDefault())

    const btn = root.querySelector('.theme-btn')
    const pop = root.querySelector('.pop')
    const swatches = root.querySelector('.swatches')
    const paletteTitle = root.querySelector('.palette-title')

    // 창 안의 선택 표시를 지금 값으로 다시 그림
    function refresh() {
      const mode = currentMode()
      root.querySelectorAll('.modes button').forEach((b) => b.classList.toggle('on', b.dataset.mode === mode))
      // 색 테마 목록은 창을 열 때 읽음 (사이트가 window.nebulaTheme 을 늦게 정해도 괜찮게)
      const { palettes } = themeConfig()
      const palette = currentPalette()
      paletteTitle.hidden = swatches.hidden = palettes.length === 0
      swatches.innerHTML = palettes
        .map(
          (p) => `<button data-palette="${escapeHtml(p.id)}" class="${p.id === palette ? 'on' : ''}">
            <span class="chip" style="background:${escapeHtml(p.color)}"></span>${escapeHtml(p.name)}
          </button>`,
        )
        .join('')
    }
    function open(next) {
      pop.hidden = !next
      btn.setAttribute('aria-expanded', String(next))
      if (next) refresh()
    }

    btn.addEventListener('click', () => open(pop.hidden))
    root.querySelector('.modes').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-mode]')
      if (b) setMode(b.dataset.mode), refresh()
    })
    swatches.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-palette]')
      if (b) setPalette(b.dataset.palette), refresh()
    })
    // 바깥 클릭·Esc로 닫기 (composedPath = Shadow DOM 안쪽까지 포함한 클릭 경로)
    document.addEventListener('click', (e) => {
      if (!pop.hidden && !e.composedPath().includes(host)) open(false)
    })
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') open(false)
    })

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
