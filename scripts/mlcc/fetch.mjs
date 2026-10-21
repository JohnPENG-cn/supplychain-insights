import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { USER_AGENT, TWSE_URL, metiWorkbookUrl, mopsUrl, sourcesForRun, metiTargetMonth } from './constants.mjs'
import { addMonths, isoDate } from './dates.mjs'
import { parseTwseRevenue } from './parse-twse.mjs'
import { parseMopsRevenue } from './parse-mops.mjs'
import { parseMetiCeramic } from './parse-meti.mjs'
import { applyMetiMonths, applyRevenueMonth, markFailed, markFresh } from './merge.mjs'

const root = resolve(import.meta.dirname, '../..')
const revenuePath = resolve(root, 'data/mlcc/tw-monthly-revenue.json')
const metiPath = resolve(root, 'data/mlcc/meti-ceramic-capacitors.json')
const statusPath = resolve(root, 'data/mlcc/fetch-status.json')

const today = process.env.MLCC_TODAY || isoDate(new Date())
const sources = sourcesForRun({
  event: process.env.GITHUB_EVENT_NAME || 'local',
  schedule: process.env.MLCC_SCHEDULE || '',
  input: process.env.MLCC_SOURCE || 'all'
})

const revenue = JSON.parse(await readFile(revenuePath, 'utf8'))
const meti = JSON.parse(await readFile(metiPath, 'utf8'))
const status = JSON.parse(await readFile(statusPath, 'utf8'))
let nextRevenue = revenue
let nextMeti = meti

for (const source of sources) {
  try {
    if (source === 'twse') nextRevenue = await fetchRevenue(nextRevenue)
    if (source === 'meti') nextMeti = await fetchMeti(nextMeti)
    status[source] = markFresh(status[source], today)
    status[source].dataThrough = source === 'twse' ? nextRevenue.months.at(-1).month : nextMeti.months.at(-1).month
    console.log(`${source} 成功，截止 ${status[source].dataThrough}`)
  } catch (error) {
    status[source] = markFailed(status[source], today, error)
    console.error(`${source} 失败，保留上一笔数据：${status[source].error}`)
  }
}

status.lastRun = { date: today, sources }
await writeFile(revenuePath, `${JSON.stringify(nextRevenue, null, 2)}\n`)
await writeFile(metiPath, `${JSON.stringify(nextMeti, null, 2)}\n`)
await writeFile(statusPath, `${JSON.stringify(status, null, 2)}\n`)

const failed = sources.filter((source) => status[source].ok === false)
if (process.env.GITHUB_STEP_SUMMARY) {
  const lines = [
    '## MLCC 抓取',
    '',
    ...sources.map((source) => {
      const entry = status[source]
      return entry.ok
        ? `- ${source} 成功，数据截止 ${entry.dataThrough}`
        : `- ${source} 失败，页面将显示数据过期。${entry.error}`
    })
  ]
  const { appendFile } = await import('node:fs/promises')
  await appendFile(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`)
}
if (failed.length) console.log(`MLCC_FETCH_DEGRADED ${failed.join(',')}`)
else console.log('MLCC_FETCH_OK')

async function fetchRevenue(current) {
  const payload = JSON.parse(await requestText(TWSE_URL))
  const parsed = parseTwseRevenue(payload)
  let merged = applyRevenueMonth(current, parsed, TWSE_URL)
  const gap = firstGap(current, parsed.month)
  if (parsed.missing.length > 0) {
    merged = await fillFromMops(merged, parsed.month, parsed.missing)
  } else if (gap) {
    merged = await fillFromMops(merged, gap, [])
  }
  return merged
}

async function fillFromMops(current, month, required) {
  const html = Buffer.from(await requestBuffer(mopsUrl(month)))
  const parsed = parseMopsRevenue(html)
  if (parsed.month !== month) throw new Error(`公开资讯观测站页面是 ${parsed.month}，不是 ${month}`)
  const stillMissing = required.filter((code) => !parsed.rows[code])
  if (stillMissing.length) throw new Error(`月营收缺少公司 ${stillMissing.join('、')}`)
  return applyRevenueMonth(current, parsed, mopsUrl(month))
}

function firstGap(current, latestMonth) {
  const have = new Set(current.months.map((item) => item.month))
  if (have.size === 0) return null
  let cursor = current.months[0].month
  while (cursor < latestMonth) {
    if (!have.has(cursor)) return cursor
    cursor = addMonths(cursor, 1)
  }
  return null
}

async function fetchMeti(current) {
  const through = current.months.at(-1)?.month || null
  const target = metiTargetMonth(through, today)
  const url = metiWorkbookUrl(target)
  const workbook = await requestBuffer(url)
  const parsed = parseMetiCeramic(workbook)
  if (!parsed.months.some((item) => item.month === target)) {
    throw new Error(`工作簿里没有 ${target} 的陶瓷电容产量和金额`)
  }
  return applyMetiMonths(current, parsed.months)
}

async function requestText(url) {
  const buffer = await requestBuffer(url)
  return buffer.toString('utf8')
}

async function requestBuffer(url) {
  console.log(`GET ${url}`)
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: '*/*'
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(60_000)
  })
  if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`)
  return Buffer.from(await response.arrayBuffer())
}
