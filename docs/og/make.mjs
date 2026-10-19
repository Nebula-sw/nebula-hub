// 공유 썸네일·홈 화면 아이콘 만들기: node docs/og/make.mjs (playwright 필요)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs'
const here = new URL('.', import.meta.url).pathname
const targets = [
  ['/home/user/nebula-hub/public', '게임 도우미 사이트 모음'],
  ['/home/user/loa-raid/public', '원정대 등록하면 레이드 공대를 자동으로 짜줘요'],
  ['/home/user/nikke/public', '캐릭터별 스킬·오버로드·큐브·소장품 육성 가이드'],
]
const b = await chromium.launch()
const og = await b.newPage({ viewport: { width: 1200, height: 630 } })
for (const [dir, desc] of targets) {
  await og.goto(`file://${here}og.html?d=${encodeURIComponent(desc)}`)
  await og.waitForTimeout(300)
  await og.screenshot({ path: `${dir}/og.png` })
}
// 휴대폰 홈 화면 아이콘: 아이폰용 180, 안드로이드 앱 설치용 192·512 (manifest.webmanifest 에서 씀)
for (const size of [180, 192, 512]) {
  const icon = await b.newPage({ viewport: { width: size, height: size } })
  await icon.goto(`file://${here}icon.html`)
  await icon.waitForTimeout(200)
  const name = size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`
  for (const [dir] of targets) await icon.screenshot({ path: `${dir}/${name}` })
}
await b.close()
