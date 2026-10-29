import { readFileSync, existsSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const dist = resolve(import.meta.dirname, '../docs/.vitepress/dist')

function read(relativePath) {
  const fullPath = resolve(dist, relativePath)
  if (!existsSync(fullPath)) {
    console.error(`缺少构建产物：${relativePath}`)
    process.exit(1)
  }
  return readFileSync(fullPath, 'utf8')
}

const pages = [
  'index.html',
  'categories/index.html',
  'categories/electronics/index.html',
  'categories/electronics/chain-map.html',
  'categories/electronics/cycle-history.html',
  'categories/electronics/price-and-leadtime.html',
  'categories/electronics/indicators.html',
  'categories/electronics/playbook.html',
  'categories/electronics/outlook-2026-2028.html',
  'categories/electronics/snapshot-2026-10.html',
  'categories/electronics/glossary.html',
  'categories/electronics/unknowns.html',
  'categories/electronics/how-to-read-the-cycle.html',
  'categories/electronics/parts/memory.html',
  'categories/electronics/parts/mlcc-passives.html',
  'categories/electronics/parts/mcu.html',
  'categories/electronics/parts/analog-power.html',
  'categories/electronics/parts/discretes.html',
  'categories/electronics/parts/connectors.html',
  'categories/electronics/parts/crystals.html',
  'categories/electronics/parts/pcb-ccl.html',
  'categories/electronics/parts/displays.html',
  'categories/electronics/cases/index.html',
  'categories/electronics/cases/mlcc-2017-2018.html',
  'categories/electronics/cases/dram-2018-2019.html',
  'categories/electronics/cases/shortage-2021.html',
  'categories/electronics/cases/glut-2022-2023.html',
  'categories/electronics/cases/thailand-hdd-2011.html',
  'categories/electronics/cases/tohoku-2011.html',
  'categories/electronics/cases/nexperia.html',
  'categories/electronics/cases/hbm-ddr.html',
  'categories/electronics/cases/tantalum.html',
  'categories/electronics/cases/counterfeit-2012.html',
  'categories/steel/index.html',
  'categories/plastics/index.html',
  'categories/electromechanical/index.html',
  'methods/index.html',
  'methods/industry-chain-insight.html',
  'methods/leveling.html',
  'methods/delivery-tracking.html',
  'dashboard/index.html',
  'dashboard/mlcc/index.html',
  'briefs/index.html',
  'briefs/inp.html',
  'briefs/fiber.html',
  'briefs/tglass.html',
  'columns/company-lens/index.html',
  'columns/company-lens/micron-fy26q4.html',
  'columns/company-lens/ti-2026q3.html',
  'columns/company-lens/umc-2026q3.html',
  'data/electronics/series.json',
  'sitemap.xml'
]

const html = pages.filter((page) => page.endsWith('.html')).map((page) => read(page)).join('\n')

if (!html.includes('/supplychain-insights/')) {
  console.error('构建结果没有带上 /supplychain-insights/ 基础路径')
  process.exit(1)
}
if (!read('categories/steel/index.html').includes('即将上线')) {
  console.error('钢材页没有标明即将上线')
  process.exit(1)
}
if (!read('dashboard/index.html').includes('建设中')) {
  console.error('看板页没有标明建设中')
  process.exit(1)
}
if (!read('dashboard/index.html').includes('全球半导体月销售额')) {
  console.error('看板页没有渲染指标清单')
  process.exit(1)
}
if (!read('dashboard/index.html').includes('已上线') || !read('dashboard/index.html').includes('MLCC')) {
  console.error('看板目录没有把 MLCC 标成已上线')
  process.exit(1)
}
const mlcc = read('dashboard/mlcc/index.html')
for (const text of ['整体判断', '拐点哨兵', '判断', '数据与版权', '政府資料開放授權條款', '生産動態統計']) {
  if (!mlcc.includes(text)) {
    console.error(`MLCC 页缺少：${text}`)
    process.exit(1)
  }
}
if (/DDR4|DRAMeXchange|30~36|30~52/.test(mlcc)) {
  console.error('MLCC 页混入了存储行情或交期原表')
  process.exit(1)
}

const cycle = read('categories/electronics/how-to-read-the-cycle.html')
if (!cycle.includes('/dashboard/mlcc/')) {
  console.error('怎么读周期没有链到 MLCC 看板')
  process.exit(1)
}
if (/dashboard\/memory|存储看板|dram-dashboard|memory-dashboard/.test(html)) {
  console.error('站点露出了存储看板的路径或名称')
  process.exit(1)
}
const memoryCase = read('categories/electronics/cases/hbm-ddr.html')
if (memoryCase.includes('45%–50%') || memoryCase.includes('93%–98%')) {
  console.error('HBM 案例抄进了合约价逐季格子')
  process.exit(1)
}

const insight = read('methods/industry-chain-insight.html')
for (const text of ['传导链', '后见之明', '订单下大了', '单点灾害', '货的来路不清']) {
  if (!insight.includes(text)) {
    console.error(`产业链洞察页缺少：${text}`)
    process.exit(1)
  }
}
if (!insight.includes('/categories/electronics/cases/')) {
  console.error('产业链洞察页没有链到案例')
  process.exit(1)
}

const casePages = pages.filter((page) => page.includes('/cases/') && !page.endsWith('index.html'))
const chartPages = new Set([
  'categories/electronics/cases/mlcc-2017-2018.html',
  'categories/electronics/cases/dram-2018-2019.html',
  'categories/electronics/cases/glut-2022-2023.html',
  'categories/electronics/cases/thailand-hdd-2011.html',
  'categories/electronics/cases/hbm-ddr.html'
])
for (const page of casePages) {
  const text = read(page)
  for (const heading of ['复盘', '传导链', '领先信号', '当时能不能看出来', '这次和以前有什么不一样', '采购动作']) {
    if (!text.includes(heading)) {
      console.error(`${page} 的复盘缺少：${heading}`)
      process.exit(1)
    }
  }
  if (!text.includes('case-timeline')) {
    console.error(`${page} 没有渲染时间线`)
    process.exit(1)
  }
  if (chartPages.has(page) && !text.includes('series-chart')) {
    console.error(`${page} 没有渲染数据图`)
    process.exit(1)
  }
}
if (!insight.includes('先看见什么')) {
  console.error('产业链洞察页缺少七种样子的对照表')
  process.exit(1)
}

const series = JSON.parse(read('data/electronics/series.json'))
if (series.status !== 'empty' || !Array.isArray(series.series) || series.series.length !== 0) {
  console.error('发布出去的序列文件不是空的')
  process.exit(1)
}

const sitemap = read('sitemap.xml')
if (!sitemap.includes('https://johnpeng-cn.github.io/supplychain-insights/dashboard/mlcc/')) {
  console.error('站点地图没有 MLCC 看板')
  console.error(sitemap.slice(0, 500))
  process.exit(1)
}
if (!sitemap.includes('https://johnpeng-cn.github.io/supplychain-insights/briefs/')) {
  console.error('站点地图没有产业链情报中心')
  process.exit(1)
}
if (!sitemap.includes('https://johnpeng-cn.github.io/supplychain-insights/categories/electronics/')) {
  console.error('站点地图没有包含正确的项目站路径')
  console.error(sitemap.slice(0, 500))
  process.exit(1)
}
if (sitemap.includes('/snippets/')) {
  console.error('阅读说明片段被发布成了独立页面')
  process.exit(1)
}

const briefIndex = read('briefs/index.html')
for (const text of ['产业链情报中心', '实事分析', '不构成投资建议', '海关', '未核实', '更新 2026-10-27']) {
  if (!briefIndex.includes(text)) {
    console.error(`情报栏目首页缺少：${text}`)
    process.exit(1)
  }
}
for (const href of ['/briefs/inp.html', '/briefs/fiber.html', '/briefs/tglass.html']) {
  if (!briefIndex.includes(href)) {
    console.error(`情报栏目首页没有链到 ${href}`)
    process.exit(1)
  }
}

const briefPages = [
  ['briefs/inp.html', '/supplychain-insights/audio/inp.mp3', '9:50', '22,288,500', '未核实'],
  ['briefs/fiber.html', '/supplychain-insights/audio/fiber.mp3', '11:24', '+392%', '未核实清单'],
  ['briefs/tglass.html', '/supplychain-insights/audio/tglass.mp3', '10:14', '约1200亿日元', '未核实清单']
]
for (const [page, audioSrc, duration, marker, unverified] of briefPages) {
  const text = read(page)
  if (!text.includes('<audio') || !text.includes('controls') || !text.includes('preload="metadata"')) {
    console.error(`${page} 的音频播放器不完整`)
    process.exit(1)
  }
  if (!text.includes(audioSrc)) {
    console.error(`${page} 的音频路径没有带上基础路径：${audioSrc}`)
    process.exit(1)
  }
  if (!text.includes(`听这篇（约${duration}）`)) {
    console.error(`${page} 的音频时长说明不对`)
    process.exit(1)
  }
  if (!text.includes('不构成投资建议') || !text.includes(unverified) || !text.includes(marker)) {
    console.error(`${page} 缺少免责声明、未核实清单或原稿数字`)
    process.exit(1)
  }
  if (!text.includes('发布 2026-10-2') || !text.includes('更新 2026-10-27')) {
    console.error(`${page} 缺少发布或更新日期`)
    process.exit(1)
  }
  const file = page.replace('.html', '.mp3').replace('briefs/', 'audio/')
  const audioPath = resolve(dist, file)
  if (!existsSync(audioPath) || statSync(audioPath).size < 100000) {
    console.error(`音频文件缺失或过小：${file}`)
    process.exit(1)
  }
}
if (!read('categories/electronics/parts/pcb-ccl.html').includes('/briefs/tglass')) {
  console.error('覆铜板页没有链到 T 玻璃')
  process.exit(1)
}
if (!read('categories/electronics/parts/memory.html').includes('/briefs/tglass')) {
  console.error('存储页没有链到 T 玻璃')
  process.exit(1)
}
if (!read('categories/electronics/cases/hbm-ddr.html').includes('/briefs/tglass')) {
  console.error('HBM 案例没有链到 T 玻璃')
  process.exit(1)
}

const lensIndex = read('columns/company-lens/index.html')
if (!lensIndex.includes('/columns/company-lens/micron-fy26q4.html')) {
  console.error('财报专栏首页没有链到美光这一篇')
  process.exit(1)
}
const lensMicron = read('columns/company-lens/micron-fy26q4.html')
for (const text of ['不构成投资建议', '管理层说法', '待 John 补充', '/supplychain-insights/columns/company-lens/micron-fy26q4.png']) {
  if (!lensMicron.includes(text)) {
    console.error(`美光这一篇缺少：${text}`)
    process.exit(1)
  }
}
if (/\d+\s*%\s*的?涨|涨了?约?\s*\d+\s*%|合约价环比/.test(lensMicron)) {
  console.error('财报专栏混入了存储涨价幅度')
  process.exit(1)
}
if (!lensIndex.includes('/columns/company-lens/ti-2026q3.html')) {
  console.error('财报专栏首页没有链到德州仪器这一篇')
  process.exit(1)
}
const lensTi = read('columns/company-lens/ti-2026q3.html')
for (const text of ['不构成投资建议', '管理层说法', '待 John 补充', '/supplychain-insights/columns/company-lens/ti-2026q3.png']) {
  if (!lensTi.includes(text)) {
    console.error(`德州仪器这一篇缺少：${text}`)
    process.exit(1)
  }
}
if (/\d+\s*%\s*的?涨|涨了?约?\s*\d+\s*%|合约价环比/.test(lensTi)) {
  console.error('财报专栏混入了存储涨价幅度')
  process.exit(1)
}
if (!lensIndex.includes('/columns/company-lens/umc-2026q3.html')) {
  console.error('财报专栏首页没有链到联电这一篇')
  process.exit(1)
}
const lensUmc = read('columns/company-lens/umc-2026q3.html')
for (const text of ['不构成投资建议', '管理层说法', '待 John 补充', '/supplychain-insights/columns/company-lens/umc-2026q3.png']) {
  if (!lensUmc.includes(text)) {
    console.error(`联电这一篇缺少：${text}`)
    process.exit(1)
  }
}
if (/\d+\s*%\s*的?涨|涨了?约?\s*\d+\s*%|合约价环比/.test(lensUmc)) {
  console.error('财报专栏混入了存储涨价幅度')
  process.exit(1)
}

const assets = read('index.html')
if (!assets.includes('/supplychain-insights/assets/')) {
  console.error('首页资源路径没有带仓库名')
  process.exit(1)
}

console.log(`构建检查通过，共核对 ${pages.length} 个产物`)
