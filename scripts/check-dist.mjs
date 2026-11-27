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
  'categories/plastics/chain-map.html',
  'categories/plastics/cycle-history.html',
  'categories/plastics/price-and-leadtime.html',
  'categories/plastics/indicators.html',
  'categories/plastics/playbook.html',
  'categories/plastics/glossary.html',
  'categories/plastics/unknowns.html',
  'categories/plastics/parts/engineering-plastics.html',
  'categories/plastics/parts/cable-compounds-additives.html',
  'categories/plastics/parts/specialty-plastics.html',
  'categories/plastics/parts/commodity-resins.html',
  'categories/plastics/parts/fluoropolymers-pfas.html',
  'categories/plastics/parts/adhesives-potting.html',
  'categories/plastics/parts/recycled-biobased.html',
  'categories/plastics/cases/index.html',
  'categories/plastics/cases/pa66-adn-2018.html',
  'categories/plastics/cases/rohs-phthalates-2019.html',
  'categories/plastics/cases/texas-freeze-2021.html',
  'categories/plastics/cases/harvey-2017.html',
  'categories/plastics/cases/europe-energy-2022.html',
  'categories/plastics/cases/ppi-retreat-2022.html',
  'categories/plastics/cases/china-glut-2024.html',
  'categories/plastics/cases/evonik-pa12-2012.html',
  'categories/plastics/cases/meltblown-2020.html',
  'categories/plastics/cases/pfas-exit.html',
  'categories/plastics/cases/recycled-imports.html',
  'categories/electromechanical/index.html',
  'methods/index.html',
  'methods/industry-chain-insight.html',
  'methods/leveling.html',
  'methods/delivery-tracking.html',
  'dashboard/index.html',
  'dashboard/mlcc/index.html',
  'dashboard/ic/index.html',
  'dashboard/shipping/index.html',
  'dashboard/soy/index.html',
  'briefs/index.html',
  'briefs/inp.html',
  'briefs/fiber.html',
  'briefs/tglass.html',
  'briefs/ccl.html',
  'briefs/hog.html',
  'columns/company-lens/index.html',
  'columns/company-lens/micron-fy26q4.html',
  'columns/company-lens/ti-2026q3.html',
  'columns/company-lens/umc-2026q3.html',
  'columns/company-lens/amkor-2026q3.html',
  'columns/company-lens/tsmc-2026q3.html',
  'columns/company-lens/ase-2026q3.html',
  'columns/company-lens/tongfu-2026q3.html',
  'columns/company-lens/gf-2026q3.html',
  'columns/company-lens/huahong-2026q3.html',
  'columns/company-lens/jcet-2026q3.html',
  'columns/company-lens/huatian-2026q3.html',
  'columns/semi-cycle/index.html',
  'columns/semi-cycle/twenty-years.html',
  'columns/cycle/index.html',
  'columns/passive-cycle/index.html',
  'columns/passive-cycle/twenty-years.html',
  'columns/shipping-cycle/index.html',
  'columns/shipping-cycle/twenty-years.html',
  'columns/sunspots-soy/index.html',
  'columns/sunspots-soy/sunspots-vs-yield.html',
  'columns/enso-soy/index.html',
  'columns/enso-soy/enso-vs-soy.html',
  'data/electronics/series.json',
  'sitemap.xml'
]

const html = pages.filter((page) => page.endsWith('.html')).map((page) => read(page)).join('\n')

if (!html.includes('/supplychain-insights/')) {
  console.error('构建结果没有带上 /supplychain-insights/ 基础路径')
  process.exit(1)
}
const plasticsIndex = read('categories/plastics/index.html')
if (plasticsIndex.includes('这一类留给塑料') || plasticsIndex.includes('现在没有正文')) {
  console.error('塑料首页还是占位页')
  process.exit(1)
}
for (const text of ['PC/ABS', 'PA66', 'LCP', '邻苯']) {
  if (!plasticsIndex.includes(text)) {
    console.error(`塑料首页缺少：${text}`)
    process.exit(1)
  }
}
const plasticsChina = read('categories/plastics/cases/china-glut-2024.html')
for (const text of ['10666.4', '检索摘要', 'series-chart']) {
  if (!plasticsChina.includes(text)) {
    console.error(`中国过剩案例缺少：${text}`)
    process.exit(1)
  }
}
if (!read('categories/plastics/unknowns.html').includes('书面授权')) {
  console.error('塑料未知页没有写明期货授权')
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
const icBoard = read('dashboard/ic/index.html')
for (const text of ['IC 采购信号', '判断', '自算', '不预测', '大约 2027', '现场观察', '待 John 补充', '亚德诺', '2026-11-24', '/columns/semi-cycle/twenty-years']) {
  if (!icBoard.includes(text)) {
    console.error(`IC 看板缺少：${text}`)
    process.exit(1)
  }
}
const icStart = icBoard.indexOf('class="vp-doc')
const icEnd = icBoard.indexOf('VPDocFooter')
const icArticle = icStart >= 0 && icEnd > icStart ? icBoard.slice(icStart, icEnd) : icBoard
if (/DDR4|DRAMeXchange|NAND|合约价环比/.test(icArticle)) {
  console.error('IC 看板正文混入了存储行情')
  process.exit(1)
}
if (!read('dashboard/index.html').includes('IC 采购信号')) {
  console.error('看板目录没有链到 IC 采购信号')
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
  'categories/electronics/cases/hbm-ddr.html',
  'categories/plastics/cases/texas-freeze-2021.html',
  'categories/plastics/cases/harvey-2017.html',
  'categories/plastics/cases/europe-energy-2022.html',
  'categories/plastics/cases/ppi-retreat-2022.html',
  'categories/plastics/cases/china-glut-2024.html'
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
if (!sitemap.includes('https://johnpeng-cn.github.io/supplychain-insights/dashboard/ic/')) {
  console.error('站点地图没有 IC 看板')
  process.exit(1)
}
if (!sitemap.includes('https://johnpeng-cn.github.io/supplychain-insights/briefs/')) {
  console.error('站点地图没有产业链情报中心')
  process.exit(1)
}
if (!sitemap.includes('https://johnpeng-cn.github.io/supplychain-insights/briefs/ccl')) {
  console.error('站点地图没有覆铜板这篇')
  process.exit(1)
}
if (!sitemap.includes('https://johnpeng-cn.github.io/supplychain-insights/briefs/hog')) {
  console.error('站点地图没有猪周期这篇')
  process.exit(1)
}
if (!sitemap.includes('https://johnpeng-cn.github.io/supplychain-insights/categories/plastics/')) {
  console.error('站点地图没有塑料章节')
  process.exit(1)
}
if (!sitemap.includes('https://johnpeng-cn.github.io/supplychain-insights/columns/semi-cycle/')) {
  console.error('站点地图没有半导体周期栏目')
  process.exit(1)
}
for (const path of [
  'columns/cycle/',
  'columns/passive-cycle/twenty-years.html',
  'columns/shipping-cycle/twenty-years.html',
  'dashboard/shipping/',
  'dashboard/soy/'
]) {
  if (!sitemap.includes(`https://johnpeng-cn.github.io/supplychain-insights/${path}`)) {
    console.error(`站点地图没有：${path}`)
    process.exit(1)
  }
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
for (const text of [
  '产业链情报中心',
  '实事分析',
  '不构成投资建议',
  '海关',
  '未核实',
  '更新 2026-10-28',
  '更新 2026-11-08',
  '更新 2026-11-26',
  '更新 2026-11-27',
  '光纤涨了5倍，2028年最危险的是中国普通光纤',
  '全世界都在抢着给 AI 做电路板底料，2028 年会不会做多了？',
  '猪价跌到 11 年最低，猪周期到底了吗？',
  '音频约 12:44',
  '音频约 7:33',
  '音频约 8:18',
  '音频约 10:51',
  '用半导体周期的方法给猪周期量体温：猪价在底部磨底，明确拐点大约在 2027 年下半年（推断）；期货 16 次里 14 次猜高，股票比猪价早动五个月。',
  '按半导体周期的方法看，这个行业在“过热”的前半段、还没掉头。',
  '覆铜板：扩产潮和 2028',
  '订单很热，但不是所有客户都能拿够货'
]) {
  if (!briefIndex.includes(text)) {
    console.error(`情报栏目首页缺少：${text}`)
    process.exit(1)
  }
}
for (const href of ['/briefs/inp.html', '/briefs/fiber.html', '/briefs/tglass.html', '/briefs/ccl.html', '/briefs/hog.html']) {
  if (!briefIndex.includes(href)) {
    console.error(`情报栏目首页没有链到 ${href}`)
    process.exit(1)
  }
}

const briefPages = [
  ['briefs/inp.html', '/supplychain-insights/audio/inp.mp3', '7:33', '22,288,500', '未核实', '首发2026-10-23', '更新2026-11-08'],
  ['briefs/fiber.html', '/supplychain-insights/audio/fiber.mp3', '12:44', '+392%', '未核实清单', '首发2026-10-26', '更新2026-10-28'],
  ['briefs/tglass.html', '/supplychain-insights/audio/tglass.mp3', '10:14', '约1200亿日元', '未核实清单', '发布 2026-10-2', '更新 2026-10-27']
]
for (const [page, audioSrc, duration, marker, unverified, published, updated] of briefPages) {
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
  if (!text.includes(published) || !text.includes(updated)) {
    console.error(`${page} 缺少发布或更新日期`)
    process.exit(1)
  }
  if (page === 'briefs/fiber.html') {
    if (!text.includes('光纤涨了5倍，2028年最危险的是中国普通光纤') || !text.includes('预测 vs 实际')) {
      console.error('光纤页标题或第十一节没有更新')
      process.exit(1)
    }
    if (text.includes('光纤涨了5倍，最怕的是行业自己') || text.includes('听这篇（约11:24）')) {
      console.error('光纤页还留着旧标题或旧时长')
      process.exit(1)
    }
  }
  if (page === 'briefs/inp.html') {
    if (!text.includes('11/8更新：订单很热，但不是所有客户都能拿够货') || !text.includes('预测与实际对账') || !text.includes('等三季报检验需求与业绩')) {
      console.error('磷化铟页更新段或对账表没有更新')
      process.exit(1)
    }
    if (!text.includes('<table')) {
      console.error('磷化铟页对账没有渲染成表格')
      process.exit(1)
    }
    if (text.includes('听这篇（约9:50）') || text.includes('更新 2026-10-27') || text.includes('非GAAP毛利率一年内从8.2%升到45.0%')) {
      console.error('磷化铟页还留着旧时长、旧日期或旧毛利率表述')
      process.exit(1)
    }
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
if (!read('categories/electronics/parts/pcb-ccl.html').includes('/briefs/ccl')) {
  console.error('覆铜板品类页没有链到扩产潮这篇')
  process.exit(1)
}
const ccl = read('briefs/ccl.html')
if (!ccl.includes('<audio') || !ccl.includes('controls') || !ccl.includes('preload="metadata"')) {
  console.error('briefs/ccl.html 的音频播放器不完整')
  process.exit(1)
}
if (!ccl.includes('/supplychain-insights/audio/ccl.mp3')) {
  console.error('briefs/ccl.html 的音频路径没有带上基础路径')
  process.exit(1)
}
if (!ccl.includes('听这篇（约8:18）')) {
  console.error('briefs/ccl.html 的音频时长说明不对')
  process.exit(1)
}
if (ccl.includes('听这篇（约13:35）') || ccl.includes('听这篇（约8:19）')) {
  console.error('briefs/ccl.html 还留着旧音频时长')
  process.exit(1)
}
for (const leak of ['/workspace', 'data_pack', '.py', 'v2/']) {
  if (ccl.includes(leak)) {
    console.error(`briefs/ccl.html 还留着本地路径字样：${leak}`)
    process.exit(1)
  }
}
if (!ccl.includes('不构成投资建议') || !ccl.includes('首发2026-11-26') || !ccl.includes('更新2026-11-26（第二版）') || !ccl.includes('未核实清单')) {
  console.error('briefs/ccl.html 缺少免责声明、首发日期、第二版更新日期或未核实说明')
  process.exit(1)
}
if (!ccl.includes('全世界都在抢着给 AI 做电路板底料，2028 年会不会做多了？')) {
  console.error('briefs/ccl.html 标题不对')
  process.exit(1)
}
if (!ccl.includes('第二版：用半导体周期的方法，看覆铜板这一轮走到了哪一段')) {
  console.error('briefs/ccl.html 缺少第二版副标题')
  process.exit(1)
}
if (!ccl.includes('一、先把东西讲清楚') || !ccl.includes('七、这一轮周期走到哪了（第二版新增）')) {
  console.error('briefs/ccl.html 缺少第二版关键标题')
  process.exit(1)
}
if (!ccl.includes('1,415') || !ccl.includes('<table')) {
  console.error('briefs/ccl.html 缺少原稿数字或表格')
  process.exit(1)
}
if (!ccl.includes('台光电扩产表两次下调') || ccl.includes('台光电扩产表的三次修改')) {
  console.error('briefs/ccl.html 的 c2 图说明没有改成两次下调')
  process.exit(1)
}
if (!ccl.includes('href="https://www.emctw.com/upload/media/New_Investors/Financial_Information/Presentation_Materials/CH/115/Investor%20Conference%20Presentation_20261028%20final%20CH.pdf"')) {
  console.error('覆铜板页脚注链接不可点，或把日期括号吃进了链接')
  process.exit(1)
}
if (ccl.includes('%EF%BC%88')) {
  console.error('覆铜板页脚注链接把中文括号吃进去了')
  process.exit(1)
}
const cclAudio = resolve(dist, 'audio/ccl.mp3')
if (!existsSync(cclAudio) || statSync(cclAudio).size < 100000) {
  console.error('音频文件缺失或过小：audio/ccl.mp3')
  process.exit(1)
}
for (const img of [
  'briefs/ccl/c1_capacity_vs_demand.png',
  'briefs/ccl/c2_emc_revisions.png',
  'briefs/ccl/c3_timeline.png',
  'briefs/ccl/c4_margins.png',
  'briefs/ccl/c5_cycle_revenue.png',
  'briefs/ccl/c6_margin_inventory.png',
  'briefs/ccl/c7_book_to_bill.png',
  'briefs/ccl/c8_capex_cash.png'
]) {
  if (!existsSync(resolve(dist, img))) {
    console.error(`覆铜板缺图：${img}`)
    process.exit(1)
  }
  if (!ccl.includes(`/supplychain-insights/${img}`)) {
    console.error(`覆铜板页没有引用图片：${img}`)
    process.exit(1)
  }
}
const hog = read('briefs/hog.html')
if (!hog.includes('<audio') || !hog.includes('controls') || !hog.includes('preload="metadata"')) {
  console.error('briefs/hog.html 的音频播放器不完整')
  process.exit(1)
}
if (!hog.includes('/supplychain-insights/audio/hog.mp3')) {
  console.error('briefs/hog.html 的音频路径没有带上基础路径')
  process.exit(1)
}
if (!hog.includes('听这篇（约10:51）')) {
  console.error('briefs/hog.html 的音频时长说明不对')
  process.exit(1)
}
for (const leak of ['/workspace', '/home', 'data_pack', '.py', 'script.txt', 'segs', 'scorecard.md', 'raw/']) {
  if (hog.includes(leak)) {
    console.error(`briefs/hog.html 还留着本地路径字样：${leak}`)
    process.exit(1)
  }
}
if (!hog.includes('不构成投资建议') || !hog.includes('首发2026-11-27') || !hog.includes('更新2026-11-27') || !hog.includes('未核实清单')) {
  console.error('briefs/hog.html 缺少免责声明、首发日期、更新日期或未核实说明')
  process.exit(1)
}
if (!hog.includes('猪价跌到 11 年最低，猪周期到底了吗？')) {
  console.error('briefs/hog.html 标题不对')
  process.exit(1)
}
if (!hog.includes('用看半导体周期的方法')) {
  console.error('briefs/hog.html 缺少副标题')
  process.exit(1)
}
if (!hog.includes('一、先把猪周期讲清楚') || !hog.includes('七、记分卡：12 项指标')) {
  console.error('briefs/hog.html 缺少关键标题')
  process.exit(1)
}
if (!hog.includes('8.63') || !hog.includes('<table')) {
  console.error('briefs/hog.html 缺少原稿数字或表格')
  process.exit(1)
}
if (!hog.includes('href="https://www.stats.gov.cn/sj/zxfbhjd/202610/t20261019_1965646.html"')) {
  console.error('猪周期页脚注链接不可点，或把日期括号吃进了链接')
  process.exit(1)
}
if (hog.includes('%EF%BC%88')) {
  console.error('猪周期页脚注链接把中文括号吃进去了')
  process.exit(1)
}
const hogAudio = resolve(dist, 'audio/hog.mp3')
if (!existsSync(hogAudio) || statSync(hogAudio).size < 100000) {
  console.error('音频文件缺失或过小：audio/hog.mp3')
  process.exit(1)
}
for (const img of [
  'briefs/hog/c1_price_history.png',
  'briefs/hog/c2_sows_productivity.png',
  'briefs/hog/c3_supply_projection.png',
  'briefs/hog/c4_futures_backtest.png',
  'briefs/hog/c5_futures_curve.png',
  'briefs/hog/c6_company_output.png',
  'briefs/hog/c7_balance_capex.png',
  'briefs/hog/c8_stock_vs_hog.png'
]) {
  if (!existsSync(resolve(dist, img))) {
    console.error(`猪周期缺图：${img}`)
    process.exit(1)
  }
  if (!hog.includes(`/supplychain-insights/${img}`)) {
    console.error(`猪周期页没有引用图片：${img}`)
    process.exit(1)
  }
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
for (const text of [
  '不构成投资建议',
  '管理层说法',
  'John 的现场观察',
  '几乎没有库存缓冲',
  '需求的起伏会直接传进交期',
  '/supplychain-insights/columns/company-lens/umc-2026q3.png'
]) {
  if (!lensUmc.includes(text)) {
    console.error(`联电这一篇缺少：${text}`)
    process.exit(1)
  }
}
if (lensUmc.includes('待 John 补充')) {
  console.error('联电这一篇的现场观察还停在占位')
  process.exit(1)
}
if (/\d+\s*%\s*的?涨|涨了?约?\s*\d+\s*%|合约价环比/.test(lensUmc)) {
  console.error('财报专栏混入了存储涨价幅度')
  process.exit(1)
}
if (!lensIndex.includes('/columns/company-lens/amkor-2026q3.html')) {
  console.error('财报专栏首页没有链到安靠这一篇')
  process.exit(1)
}
const lensAmkor = read('columns/company-lens/amkor-2026q3.html')
for (const text of [
  '不构成投资建议',
  '管理层说法',
  '待 John 补充',
  '整厂都排满了',
  '合同负债',
  '/supplychain-insights/columns/company-lens/amkor-2026q3.png'
]) {
  if (!lensAmkor.includes(text)) {
    console.error(`安靠这一篇缺少：${text}`)
    process.exit(1)
  }
}
if (/\d+\s*%\s*的?涨|涨了?约?\s*\d+\s*%|合约价环比/.test(lensAmkor)) {
  console.error('财报专栏混入了存储涨价幅度')
  process.exit(1)
}
if (!lensIndex.includes('/columns/company-lens/tsmc-2026q3.html')) {
  console.error('财报专栏首页没有链到台积电这一篇')
  process.exit(1)
}
const lensTsmc = read('columns/company-lens/tsmc-2026q3.html')
for (const text of [
  '不构成投资建议',
  '管理层说法',
  '待 John 补充',
  '库存天数',
  '先进制程',
  '暂收客户款',
  '/supplychain-insights/columns/company-lens/tsmc-2026q3.png'
]) {
  if (!lensTsmc.includes(text)) {
    console.error(`台积电这一篇缺少：${text}`)
    process.exit(1)
  }
}
if (/\d+\s*%\s*的?涨|涨了?约?\s*\d+\s*%|合约价环比/.test(lensTsmc)) {
  console.error('财报专栏混入了存储涨价幅度')
  process.exit(1)
}
if (!lensIndex.includes('/columns/company-lens/ase-2026q3.html')) {
  console.error('财报专栏首页没有链到日月光投控这一篇')
  process.exit(1)
}
const lensAse = read('columns/company-lens/ase-2026q3.html')
for (const text of [
  '不构成投资建议',
  '管理层说法',
  '待 John 补充',
  '测试机',
  '打线机',
  '库存天数',
  '设备资本开支',
  '/supplychain-insights/columns/company-lens/ase-2026q3.png'
]) {
  if (!lensAse.includes(text)) {
    console.error(`日月光投控这一篇缺少：${text}`)
    process.exit(1)
  }
}
if (/\d+\s*%\s*的?涨|涨了?约?\s*\d+\s*%|合约价环比/.test(lensAse)) {
  console.error('财报专栏混入了存储涨价幅度')
  process.exit(1)
}
if (!lensIndex.includes('/columns/company-lens/tongfu-2026q3.html')) {
  console.error('财报专栏首页没有链到通富微电这一篇')
  process.exit(1)
}
const lensTongfu = read('columns/company-lens/tongfu-2026q3.html')
for (const text of [
  '不构成投资建议',
  '管理层说法',
  '待 John 补充',
  '合同负债',
  '库存天数',
  '购建',
  '/supplychain-insights/columns/company-lens/tongfu-2026q3.png'
]) {
  if (!lensTongfu.includes(text)) {
    console.error(`通富微电这一篇缺少：${text}`)
    process.exit(1)
  }
}
if (/\d+\s*%\s*的?涨|涨了?约?\s*\d+\s*%|合约价环比/.test(lensTongfu)) {
  console.error('财报专栏混入了存储涨价幅度')
  process.exit(1)
}
if (!lensIndex.includes('/columns/company-lens/gf-2026q3.html')) {
  console.error('财报专栏首页没有链到格芯这一篇')
  process.exit(1)
}
const lensGf = read('columns/company-lens/gf-2026q3.html')
for (const text of [
  '不构成投资建议',
  '管理层说法',
  '待 John 补充',
  '合同负债',
  '库存天数',
  '高 80%',
  '/supplychain-insights/columns/company-lens/gf-2026q3.png'
]) {
  if (!lensGf.includes(text)) {
    console.error(`格芯这一篇缺少：${text}`)
    process.exit(1)
  }
}
if (/\d+\s*%\s*的?涨|涨了?约?\s*\d+\s*%|合约价环比/.test(lensGf)) {
  console.error('财报专栏混入了存储涨价幅度')
  process.exit(1)
}
if (!lensIndex.includes('/columns/company-lens/huahong-2026q3.html')) {
  console.error('财报专栏首页没有链到华虹宏力这一篇')
  process.exit(1)
}
const lensHuahong = read('columns/company-lens/huahong-2026q3.html')
for (const text of [
  '不构成投资建议',
  '管理层说法',
  '待 John 补充',
  '102.9%',
  '合同负债',
  '88 天',
  '/supplychain-insights/columns/company-lens/huahong-2026q3.png'
]) {
  if (!lensHuahong.includes(text)) {
    console.error(`华虹宏力这一篇缺少：${text}`)
    process.exit(1)
  }
}
if (/\d+\s*%\s*的?涨|涨了?约?\s*\d+\s*%|合约价环比/.test(lensHuahong)) {
  console.error('财报专栏混入了存储涨价幅度')
  process.exit(1)
}
if (!lensIndex.includes('/columns/company-lens/jcet-2026q3.html')) {
  console.error('财报专栏首页没有链到长电科技这一篇')
  process.exit(1)
}
const lensJcet = read('columns/company-lens/jcet-2026q3.html')
for (const text of [
  '不构成投资建议',
  '管理层说法',
  '待 John 补充',
  '合同负债',
  '库存天数',
  '3.678',
  '88.91',
  '182.0',
  '/supplychain-insights/columns/company-lens/jcet-2026q3.png'
]) {
  if (!lensJcet.includes(text)) {
    console.error(`长电科技这一篇缺少：${text}`)
    process.exit(1)
  }
}
if (/\d+\s*%\s*的?涨|涨了?约?\s*\d+\s*%|合约价环比/.test(lensJcet)) {
  console.error('财报专栏混入了存储涨价幅度')
  process.exit(1)
}
if (!lensIndex.includes('/columns/company-lens/huatian-2026q3.html')) {
  console.error('财报专栏首页没有链到华天科技这一篇')
  process.exit(1)
}
const lensHuatian = read('columns/company-lens/huatian-2026q3.html')
for (const text of [
  '不构成投资建议',
  '管理层说法',
  '待 John 补充',
  '合同负债',
  '库存天数',
  '1.001',
  '65.63',
  '4.5%',
  '/supplychain-insights/columns/company-lens/huatian-2026q3.png'
]) {
  if (!lensHuatian.includes(text)) {
    console.error(`华天科技这一篇缺少：${text}`)
    process.exit(1)
  }
}
if (/\d+\s*%\s*的?涨|涨了?约?\s*\d+\s*%|合约价环比/.test(lensHuatian)) {
  console.error('财报专栏混入了存储涨价幅度')
  process.exit(1)
}

const cycleIndex = read('columns/semi-cycle/index.html')
if (!cycleIndex.includes('/columns/semi-cycle/twenty-years.html')) {
  console.error('半导体周期栏目首页没有链到二十年财报这一篇')
  process.exit(1)
}
if (!cycleIndex.includes('/supplychain-insights/columns/semi-cycle/data.csv')) {
  console.error('半导体周期栏目首页没有链到数据集')
  process.exit(1)
}
const cycleArticle = read('columns/semi-cycle/twenty-years.html')
for (const text of [
  '不构成投资建议',
  '待 John 补充',
  '判断',
  '事实',
  '组内中位数',
  '库存天数',
  '朱格拉',
  '现场观察',
  '管理层说法',
  '/dashboard/ic/',
  '/supplychain-insights/columns/semi-cycle/data.csv',
  '/supplychain-insights/columns/semi-cycle/foundry-revenue-yoy.png',
  '/supplychain-insights/columns/semi-cycle/capex-vs-equipment-yoy.png'
]) {
  if (!cycleArticle.includes(text)) {
    console.error(`半导体周期这一篇缺少：${text}`)
    process.exit(1)
  }
}
if (/\d+\s*%\s*的?涨|涨了?约?\s*\d+\s*%|合约价环比/.test(cycleArticle)) {
  console.error('半导体周期这一篇混入了存储涨价幅度')
  process.exit(1)
}
const cycleCsv = read('columns/semi-cycle/data.csv')
if (!cycleCsv.includes('source_url') || !cycleCsv.includes('TSMC 台积电') || /美光|Micron|DRAM|NAND/.test(cycleCsv)) {
  console.error('半导体周期数据集不对，或混入了存储厂')
  process.exit(1)
}
for (const img of [
  'columns/semi-cycle/foundry-revenue-yoy.png',
  'columns/semi-cycle/foundry-inventory-days.png',
  'columns/semi-cycle/foundry-utilization.png',
  'columns/semi-cycle/foundry-ocf-capex.png',
  'columns/semi-cycle/osat-revenue-yoy.png',
  'columns/semi-cycle/osat-inventory-days.png',
  'columns/semi-cycle/osat-ocf-capex.png',
  'columns/semi-cycle/analog-revenue-yoy.png',
  'columns/semi-cycle/analog-inventory-days.png',
  'columns/semi-cycle/analog-ocf-capex.png',
  'columns/semi-cycle/equipment-revenue-yoy.png',
  'columns/semi-cycle/equipment-bookings.png',
  'columns/semi-cycle/equipment-inventory-days.png',
  'columns/semi-cycle/capex-vs-equipment-yoy.png'
]) {
  if (!existsSync(resolve(dist, img))) {
    console.error(`半导体周期缺图：${img}`)
    process.exit(1)
  }
}

function articleOf(page) {
  const html = read(page)
  const start = html.indexOf('class="vp-doc')
  const end = html.indexOf('VPDocFooter')
  return start >= 0 && end > start ? html.slice(start, end) : html
}

const priceRise = /\d+\s*%\s*的?涨|涨了?约?\s*\d+\s*%|合约价环比/
const memoryWords = /DRAM|NAND|Micron|美光|DRAMeXchange/
for (const page of [
  'columns/passive-cycle/twenty-years.html',
  'columns/shipping-cycle/twenty-years.html',
  'dashboard/shipping/index.html',
  'dashboard/mlcc/index.html'
]) {
  const article = articleOf(page)
  if (priceRise.test(article) || memoryWords.test(article)) {
    console.error(`${page} 混入了存储行情或涨价幅度`)
    process.exit(1)
  }
}
const passiveArticle = articleOf('columns/passive-cycle/twenty-years.html')
for (const text of [
  '不预测',
  '待 John 补充',
  '判断',
  '事实',
  '自算',
  '缺失',
  '1.47',
  '1.39',
  '14 个季度',
  '/dashboard/mlcc/',
  '/columns/semi-cycle/twenty-years',
  '/supplychain-insights/columns/passive-cycle/data.csv',
  '现场观察'
]) {
  if (!passiveArticle.includes(text)) {
    console.error(`被动元件周期这一篇缺少：${text}`)
    process.exit(1)
  }
}
const shippingArticle = articleOf('columns/shipping-cycle/twenty-years.html')
for (const text of [
  '不预测',
  '待 John 补充',
  '集装箱',
  '干散货',
  '油轮',
  '3.3',
  '3.1',
  '18.2',
  '38.7',
  '96.5',
  '3.8',
  '24.6',
  '现场观察',
  '/supplychain-insights/columns/shipping-cycle/data.csv'
]) {
  if (!shippingArticle.includes(text)) {
    console.error(`航运周期这一篇缺少：${text}`)
    process.exit(1)
  }
}
if (/航运业中位数|全行业同比|三组平均/.test(shippingArticle)) {
  console.error('航运周期把三组合成了一个结论')
  process.exit(1)
}
const shippingBoard = articleOf('dashboard/shipping/index.html')
for (const text of ['不预测', '集装箱', '干散货', '油轮', '待 John 补充', '判断']) {
  if (!shippingBoard.includes(text)) {
    console.error(`航运看板缺少：${text}`)
    process.exit(1)
  }
}
if (/航运业中位数|三组平均/.test(shippingBoard)) {
  console.error('航运看板把三组合成了一个结论')
  process.exit(1)
}
const soyBoard = articleOf('dashboard/soy/index.html')
for (const text of [
  '大豆周期信号',
  '不构成投资建议',
  '中性偏紧',
  '只是概率',
  '不作信号',
  '自算',
  '判断',
  '6.5%',
  '+2.46',
  '26.8%',
  '28.7%',
  '12.10',
  '515',
  '第三方',
  '/columns/enso-soy/enso-vs-soy',
  '/columns/sunspots-soy/sunspots-vs-yield',
  '/supplychain-insights/dashboard/soy/us-stu-price.png',
  '/supplychain-insights/dashboard/soy/oni.png'
]) {
  if (!soyBoard.includes(text)) {
    console.error(`大豆看板缺少：${text}`)
    process.exit(1)
  }
}
if (soyBoard.includes('现场观察')) {
  console.error('大豆看板不该有现场观察')
  process.exit(1)
}
if (/DRAM|NAND|美光|DRAMeXchange|合约价环比/.test(soyBoard)) {
  console.error('大豆看板混入了存储行情')
  process.exit(1)
}
if (!read('dashboard/index.html').includes('大豆周期信号')) {
  console.error('看板目录没有链到大豆周期信号')
  process.exit(1)
}
if (!read('index.html').includes('大豆周期信号')) {
  console.error('首页没有大豆周期信号')
  process.exit(1)
}
for (const img of ['dashboard/soy/us-stu-price.png', 'dashboard/soy/oni.png', 'dashboard/soy/annual.csv']) {
  if (!existsSync(resolve(dist, img))) {
    console.error(`大豆看板缺文件：${img}`)
    process.exit(1)
  }
}
const mlccCycle = articleOf('dashboard/mlcc/index.html')
for (const text of ['周期位置', '不预测', '1.47', '1.39', '14']) {
  if (!mlccCycle.includes(text)) {
    console.error(`MLCC 周期位置缺少：${text}`)
    process.exit(1)
  }
}
for (const csvName of ['columns/passive-cycle/data.csv', 'columns/shipping-cycle/data.csv']) {
  const csv = read(csvName).replace(/^\uFEFF/, '')
  if (!csv.includes('source_url') || memoryWords.test(csv)) {
    console.error(`周期数据集不对，或混入了存储：${csvName}`)
    process.exit(1)
  }
  if (csv.split('\n').some((line) => line && !line.includes('http') && !line.startsWith('cluster,'))) {
    console.error(`周期数据集有行缺少来源：${csvName}`)
    process.exit(1)
  }
}
for (const img of [
  'columns/passive-cycle/passive-revenue-yoy.png',
  'columns/passive-cycle/murata-book-to-bill.png',
  'columns/shipping-cycle/container-revenue-yoy.png',
  'columns/shipping-cycle/drybulk-revenue-yoy.png',
  'columns/shipping-cycle/tanker-revenue-yoy.png',
  'columns/shipping-cycle/unctad-orderbook-fleet.png'
]) {
  if (!existsSync(resolve(dist, img))) {
    console.error(`周期专栏缺图：${img}`)
    process.exit(1)
  }
}
if (!read('columns/cycle/index.html').includes('/columns/semi-cycle/twenty-years')) {
  console.error('周期专栏目录没有链到半导体那一篇')
  process.exit(1)
}
if (!read('columns/semi-cycle/index.html').includes('/columns/cycle/')) {
  console.error('半导体周期栏目没有链回周期目录')
  process.exit(1)
}

const sunspotArticle = articleOf('columns/sunspots-soy/sunspots-vs-yield.html')
for (const text of [
  '没有可靠关系',
  '文献说法',
  '判断',
  '未知',
  '自算',
  '0.11',
  '0.46',
  '0.026',
  '0.65',
  '/supplychain-insights/columns/sunspots-soy/data.csv',
  '/supplychain-insights/columns/sunspots-soy/chart1_sunspot_vs_us_yield.png',
  '/supplychain-insights/columns/sunspots-soy/chart4_enso_vs_sunspot.png'
]) {
  if (!sunspotArticle.includes(text)) {
    console.error(`太阳黑子与大豆这一篇缺少：${text}`)
    process.exit(1)
  }
}
if (/DRAM|NAND|美光|DRAMeXchange/.test(sunspotArticle)) {
  console.error('太阳黑子与大豆这一篇混入了存储行情')
  process.exit(1)
}
if (sunspotArticle.includes('现场观察')) {
  console.error('太阳黑子与大豆这一篇不该有现场观察')
  process.exit(1)
}
if (!read('columns/sunspots-soy/index.html').includes('/columns/sunspots-soy/sunspots-vs-yield')) {
  console.error('太阳黑子栏目目录没有链到正文')
  process.exit(1)
}
for (const asset of [
  'columns/sunspots-soy/data.csv',
  'columns/sunspots-soy/analysis.py',
  'columns/sunspots-soy/chart1_sunspot_vs_us_yield.png',
  'columns/sunspots-soy/chart2_xcorr.png',
  'columns/sunspots-soy/chart3_phase_composite.png',
  'columns/sunspots-soy/chart4_enso_vs_sunspot.png'
]) {
  if (!existsSync(resolve(dist, asset))) {
    console.error(`太阳黑子专栏缺文件：${asset}`)
    process.exit(1)
  }
}

const ensoArticle = articleOf('columns/enso-soy/enso-vs-soy.html')
for (const text of [
  '只在阿根廷站得住',
  '文献说法',
  '机构说法',
  '判断',
  '未知',
  '自算',
  '0.31',
  '0.030',
  '0.007',
  '12.5',
  '0.22',
  '/supplychain-insights/columns/enso-soy/data.csv',
  '/supplychain-insights/columns/enso-soy/chart1_oni_vs_argentina.png',
  '/supplychain-insights/columns/enso-soy/chart4_price_enso.png',
  '/supplychain-insights/columns/sunspots-soy/sunspots-vs-yield'
]) {
  if (!ensoArticle.includes(text)) {
    console.error(`厄尔尼诺与大豆这一篇缺少：${text}`)
    process.exit(1)
  }
}
if (/DRAM|NAND|美光|DRAMeXchange/.test(ensoArticle)) {
  console.error('厄尔尼诺与大豆这一篇混入了存储行情')
  process.exit(1)
}
if (ensoArticle.includes('现场观察')) {
  console.error('厄尔尼诺与大豆这一篇不该有现场观察')
  process.exit(1)
}
if (!read('columns/enso-soy/index.html').includes('/columns/enso-soy/enso-vs-soy')) {
  console.error('厄尔尼诺栏目目录没有链到正文')
  process.exit(1)
}
for (const asset of [
  'columns/enso-soy/data.csv',
  'columns/enso-soy/analysis.py',
  'columns/enso-soy/chart1_oni_vs_argentina.png',
  'columns/enso-soy/chart2_corr_by_country.png',
  'columns/enso-soy/chart3_composite.png',
  'columns/enso-soy/chart4_price_enso.png',
  'columns/enso-soy/chart5_now_vs_past.png'
]) {
  if (!existsSync(resolve(dist, asset))) {
    console.error(`厄尔尼诺专栏缺文件：${asset}`)
    process.exit(1)
  }
}

const assets = read('index.html')
if (!assets.includes('/supplychain-insights/assets/')) {
  console.error('首页资源路径没有带仓库名')
  process.exit(1)
}

console.log(`构建检查通过，共核对 ${pages.length} 个产物`)
