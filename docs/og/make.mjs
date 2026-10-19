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
// 휴대폰 홈 화면 아이콘 (180×180, 어두운 배경 꽉 채움 — 모서리는 휴대폰이 알아서 둥글게 깎음)
const icon = await b.newPage({ viewport: { width: 180, height: 180 } })
await icon.goto(`file://${here}icon.html`)
await icon.waitForTimeout(200)
for (const [dir] of targets) await icon.screenshot({ path: `${dir}/apple-touch-icon.png` })
await b.close()
