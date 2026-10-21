import { readFileSync, existsSync } from 'node:fs'
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
  'categories/steel/index.html',
  'categories/plastics/index.html',
  'categories/electromechanical/index.html',
  'methods/index.html',
  'methods/leveling.html',
  'methods/delivery-tracking.html',
  'dashboard/index.html',
  'dashboard/mlcc/index.html',
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
if (!sitemap.includes('https://johnpeng-cn.github.io/supplychain-insights/categories/electronics/')) {
  console.error('站点地图没有包含正确的项目站路径')
  console.error(sitemap.slice(0, 500))
  process.exit(1)
}
if (sitemap.includes('/snippets/')) {
  console.error('阅读说明片段被发布成了独立页面')
  process.exit(1)
}

const assets = read('index.html')
if (!assets.includes('/supplychain-insights/assets/')) {
  console.error('首页资源路径没有带仓库名')
  process.exit(1)
}

console.log(`构建检查通过，共核对 ${pages.length} 个产物`)
