import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { evaluateMlcc } from './mlcc/signals.mjs'

const root = resolve(import.meta.dirname, '..')
const dataDir = resolve(root, 'data/mlcc')

const banned = /DRAM|DDR4|DDR5|NAND|HBM|存储合约|存储现货|DRAMeXchange/i
const weekTable = /\d+\s*[-~～到至]\s*\d+\s*周/

function fail(message) {
  throw new Error(message)
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(resolve(dataDir, relativePath), 'utf8'))
}

function walk(dir, files = []) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const path = resolve(dir, name.name)
    if (name.isDirectory()) walk(path, files)
    else if (name.name.endsWith('.json')) files.push(path)
  }
  return files
}

export function validateMlcc() {
  for (const file of walk(dataDir)) {
    const text = readFileSync(file, 'utf8')
    if (banned.test(text)) fail(`${file} 里出现了存储数据，公开站不收`)
  }

  const revenue = readJson('tw-monthly-revenue.json')
  const meti = readJson('meti-ceramic-capacitors.json')
  const bookToBill = readJson('manual/book-to-bill.json')
  const leadTime = readJson('manual/lead-time.json')
  const notices = readJson('manual/notices.json')
  const turnWatch = readJson('manual/turn-watch.json')
  const schedule = readJson('schedule.json')
  const status = readJson('fetch-status.json')
  const config = readJson('signal-config.json')

  if (!Array.isArray(revenue.months) || revenue.months.length < 24) fail('台系营收月份不够')
  let previous = ''
  for (const row of revenue.months) {
    if (!/^\d{4}-\d{2}$/.test(row.month) || row.month <= previous) fail(`营收月份没有按顺序：${row.month}`)
    previous = row.month
    for (const company of revenue.companies) {
      if (!Number.isFinite(row[company.code])) fail(`${row.month} 缺少 ${company.code}`)
    }
  }
  if (!revenue.source?.url?.startsWith('https://')) fail('台系营收缺少来源')

  previous = ''
  for (const row of meti.months) {
    if (!/^\d{4}-\d{2}$/.test(row.month) || row.month <= previous) fail(`产量月份没有按顺序：${row.month}`)
    previous = row.month
    if (!Number.isFinite(row.quantity) || !Number.isFinite(row.value)) fail(`${row.month} 的产量或金额不是数字`)
  }
  if (!meti.source?.attribution?.includes('経済産業省')) fail('日本产量缺少出处')

  const leadText = JSON.stringify(leadTime)
  if (weekTable.test(leadText)) fail('交期文件里出现了周数区间，不能转载表格')
  if (!['red', 'yellow', 'green'].includes(leadTime.light)) fail('交期灯不合法')
  for (const source of leadTime.sources) assertUrl(source.url, '交期来源')

  for (const reading of bookToBill.readings) {
    if (!Number.isFinite(reading.bookToBill)) fail('订单出货比不是数字')
    assertUrl(reading.sourceUrl, '订单出货比来源')
    if (!reading.publishedAt) fail('订单出货比缺少发布日期')
  }

  for (const event of notices.events) {
    if (!event.summary || event.summary.length > 240) fail(`通知摘要太长或是空的：${event.id}`)
    if (!['maker_notice', 'media', 'broker_rumour'].includes(event.credibility)) {
      fail(`通知可信度不合法：${event.id}`)
    }
    if (!event.links?.length) fail(`通知缺少链接：${event.id}`)
    for (const link of event.links) assertUrl(link.url, event.id)
  }

  if (typeof turnWatch.lytica?.hit !== 'boolean') fail('Lytica 拐点必须是 true 或 false')
  if (typeof turnWatch.inventoryRemark?.hit !== 'boolean') fail('库存拐点必须是 true 或 false')
  for (const source of turnWatch.inventoryRemark.sources) assertUrl(source.url, '拐点来源')

  for (const id of ['s1', 's2', 's3', 's4', 's5', 's6', 'overall']) {
    if (!config[id]) fail(`阈值配置缺少 ${id}`)
  }

  const result = evaluateMlcc({
    today: '2026-10-21',
    revenue,
    meti,
    bookToBill,
    leadTime,
    notices,
    turnWatch,
    schedule,
    status,
    config
  })
  const byId = Object.fromEntries(result.signals.map((item) => [item.id, item]))
  const expected = { s1: 'red', s2: 'red', s4: 'red', s5: 'red', s6: 'yellow' }
  for (const [id, light] of Object.entries(expected)) {
    if (byId[id].light !== light) fail(`${id} 在 2026-10-21 应该是 ${light}，实际是 ${byId[id].light}`)
  }
  if (byId.s3.volumeLight !== 'red' || byId.s3.priceLight !== 'yellow') {
    fail(`S3 应为产量红、价格黄，实际 ${byId.s3.volumeLight}/${byId.s3.priceLight}`)
  }
  if (!byId.s6.judgment) fail('S6 必须标成判断')
  if (byId.s6.triggers.filter((item) => item.hit).length !== 1) fail('S6 当前应只命中 1 条')
  if (byId.s6.triggers.find((item) => item.id === 'inventory')?.label !== '部分命中') {
    fail('S6 第 4 条应显示部分命中')
  }
  return result
}

function assertUrl(value, label) {
  if (typeof value !== 'string' || !/^https:\/\//.test(value)) fail(`${label} 缺少 https 链接`)
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  validateMlcc()
  console.log('MLCC 数据检查通过')
}
