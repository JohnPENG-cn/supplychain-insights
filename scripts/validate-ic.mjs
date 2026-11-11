import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { readQuarterSource } from './ic/load.mjs'
import { buildSeries, evaluateIc } from './ic/signals.mjs'

const root = resolve(import.meta.dirname, '..')
const dataDir = resolve(root, 'data/ic')
const banned = /DRAM|DDR4|DDR5|NAND|HBM|存储合约|存储现货|DRAMeXchange/i
const weekTable = /\d+\s*[-~～到至]\s*\d+\s*周/

function fail(message) {
  throw new Error(message)
}

function readJson(name) {
  return JSON.parse(readFileSync(resolve(dataDir, name), 'utf8'))
}

function walk(dir, files = []) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const path = resolve(dir, name.name)
    if (name.isDirectory()) walk(path, files)
    else files.push(path)
  }
  return files
}

export function validateIc() {
  for (const file of walk(dataDir)) {
    const text = readFileSync(file, 'utf8')
    if (banned.test(text)) fail(`${file} 里出现了存储行情，公开站不收`)
    if (weekTable.test(text)) fail(`${file} 里出现了周数区间`)
  }

  const fresh = readQuarterSource(root)
  const quarters = readJson('quarters.json')
  if (JSON.stringify(fresh) !== JSON.stringify(quarters)) {
    fail('data/ic/quarters.json 和 docs/public/columns/semi-cycle/data.csv 不一致')
  }
  for (const row of quarters.rows) {
    if (!Number.isFinite(row.revenue)) fail(`${row.company} ${row.period} 没有营收`)
    assertUrl(row.revenueUrl, `${row.company} ${row.period} 营收`)
    if (row.cogs != null) assertUrl(row.cogsUrl, `${row.company} ${row.period} 营业成本`)
    if (row.inventory != null) assertUrl(row.inventoryUrl, `${row.company} ${row.period} 存货`)
  }

  const management = readJson('manual/management.json')
  const config = readJson('signal-config.json')
  if (!Array.isArray(management.entries)) fail('管理层条目不是数组')
  for (const entry of management.entries) {
    if (!entry.summary || !entry.date || !entry.period) fail('管理层条目缺字段')
    if (typeof entry.hit !== 'boolean') fail('管理层命中必须是 true 或 false')
    assertUrl(entry.sourceUrl, entry.company)
    for (const link of entry.links || []) assertUrl(link.url, entry.company)
  }

  const result = evaluateIc({ today: '2026-11-11', quarters, management, config })
  const byId = Object.fromEntries(result.lights.map((item) => [item.id, item]))
  for (const id of ['yoy-decline', 'inventory-while-slowing', 'management']) {
    if (byId[id]?.light !== 'yellow') fail(`${id} 在 2026-11-11 应该是黄，实际是 ${byId[id]?.light}`)
    if (!byId[id].judgment) fail(`${id} 必须标成判断`)
  }
  if (byId.management.entries.some((entry) => entry.hit)) fail('管理层条目不应该有命中')
  if (Math.round(result.position.yoyMedian * 100) !== 28) fail('2026Q3 营收同比中位数四舍五入后应是 +28%')
  if (Math.round(result.position.daysMedian) !== 184) fail('2026Q3 库存天数中位数应是 184 天')
  if (Math.round(result.position.historyMedian) !== 114) fail('库存天数历史中位数应是 114 天')
  if (result.position.recordPeriod !== '2025Q1' || Math.round(result.position.recordDays) !== 205) {
    fail('库存天数高点应是 2025Q1 的 205 天')
  }
  if (result.troughs.extrapolated !== '2027Q4') fail('平均间隔外推应落在 2027Q4')
  if (result.troughs.gaps.join(',') !== '11,17,15,17') fail('谷底间隔不对')
  const adi = result.latest.find((row) => row.id === 'adi')
  if (adi?.period !== '2026Q2') fail('亚德诺最新季度应是 2026Q2')
  const built = buildSeries(quarters)
  const breakQuarter = built.quarters.find((quarter) => quarter.period === '2017Q1')
  if (breakQuarter?.yoyIds.includes('adi')) fail('2017Q1 亚德诺并购季度不应进中位数')
  return result
}

function assertUrl(value, label) {
  if (typeof value !== 'string' || !/^https:\/\//.test(value)) fail(`${label} 缺少 https 链接`)
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  validateIc()
  console.log('IC 数据检查通过')
}
