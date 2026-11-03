import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { mopsUrl } from '../mlcc/constants.mjs'
import {
  USER_AGENT,
  BLS_SERIES,
  BLS_NAMES,
  EIA_PAGE,
  EUROSTAT_PROD,
  EUROSTAT_PPI,
  MOPS_CODES,
  MOPS_NAMES,
  SEC_URL,
  NBS_INDEX,
  NBS_CONTROL_PAGES
} from './constants.mjs'
import {
  parseBls,
  mergePoints,
  parseEiaPropane,
  parseEurostat,
  parseMopsPlastics,
  parseNbsDecade,
  decadeSortKey,
  pointAt
} from './parse.mjs'

const root = resolve(import.meta.dirname, '../..')
const dataDir = resolve(root, 'data/plastics')
const fetchedAt = new Date().toISOString().slice(0, 10)

await mkdir(dataDir, { recursive: true })

const status = {}

const bls = await run('bls', fetchBls)
const eia = await run('eia', fetchEia)
const eurostat = await run('eurostat', fetchEurostat)
const mops = await run('mops', fetchMops)
const nbs = await run('nbs', fetchNbs)
const sec = await run('sec', fetchSec)

if (bls) await writeJson('bls-ppi.json', bls)
if (eia) await writeJson('eia-propane.json', eia)
if (eurostat) await writeJson('eurostat-c2016.json', eurostat)
if (mops) await writeJson('mops-revenue.json', mops)
if (nbs) await writeJson('nbs-decade-prices.json', nbs)
await writeJson('sec-lyondellbasell.json', sec || { ok: false, fetchedAt, error: status.sec?.error || '没有抓到' })
await writeJson('fetch-status.json', { fetchedAt, status })

if (bls && eia && eurostat) {
  await syncCharts({ bls, eia, eurostat, mops, nbs })
}

const failed = Object.entries(status).filter(([, item]) => !item.ok)
console.log(failed.length ? `PLASTICS_FETCH_DEGRADED ${failed.map(([name]) => name).join(',')}` : 'PLASTICS_FETCH_OK')

async function run(name, task) {
  try {
    const value = await task()
    status[name] = { ok: true, fetchedAt, detail: value?.detail || '' }
    console.log(`${name} 成功 ${value?.detail || ''}`)
    return value
  } catch (error) {
    status[name] = { ok: false, fetchedAt, error: error.message }
    console.error(`${name} 失败：${error.message}`)
    return null
  }
}

async function fetchBls() {
  const recent = parseBls(await postBls('2017', '2026'))
  const earlier = parseBls(await postBls('2016', '2025'))
  const series = {}
  for (const id of BLS_SERIES) {
    series[id] = {
      name: BLS_NAMES[id],
      points: mergePoints(earlier[id], recent[id])
    }
  }
  const resin = series.PCU325211325211.points
  const latest = resin.at(-1)
  return {
    detail: `树脂 PPI 截至 ${latest?.x} = ${latest?.y}`,
    fetchedAt,
    source: 'https://api.bls.gov/publicAPI/v2/timeseries/data/',
    series
  }
}

async function postBls(startyear, endyear) {
  const response = await request('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ seriesid: BLS_SERIES, startyear, endyear })
  })
  const payload = JSON.parse(response)
  if (payload.status !== 'REQUEST_SUCCEEDED') {
    throw new Error(`BLS ${payload.status || '失败'} ${payload.message || ''}`)
  }
  return payload
}

async function fetchEia() {
  const html = await request(EIA_PAGE)
  const points = parseEiaPropane(html)
  if (!points.some((point) => point.x === '2026-09')) throw new Error('EIA 页面没有 2026-09')
  const latest = points.at(-1)
  return {
    detail: `丙烷截至 ${latest.x} = ${latest.dollarsPerGallon} 美元/加仑`,
    fetchedAt,
    source: EIA_PAGE,
    seriesId: 'EER_EPLLPA_PF4_Y44MB_DPG',
    unit: 'Dollars per Gallon',
    points
  }
}

async function fetchEurostat() {
  const production = parseEurostat(JSON.parse(await request(EUROSTAT_PROD)))
  const prices = parseEurostat(JSON.parse(await request(EUROSTAT_PPI)))
  if (!production.points.length || !prices.points.length) throw new Error('Eurostat 没有产量或出厂价')
  return {
    detail: `产量截至 ${production.points.at(-1).x}，出厂价截至 ${prices.points.at(-1).x}`,
    fetchedAt,
    production: { ...production, source: EUROSTAT_PROD },
    producerPrices: { ...prices, source: EUROSTAT_PPI }
  }
}

async function fetchMops() {
  const months = []
  let cursor = '2022-01'
  const end = '2026-09'
  while (cursor <= end) {
    months.push(cursor)
    cursor = addMonth(cursor)
  }
  const rows = []
  const errors = []
  for (const month of months) {
    try {
      const html = Buffer.from(await requestBuffer(mopsUrl(month)))
      const parsed = parseMopsPlastics(html, MOPS_CODES)
      if (parsed.month !== month) throw new Error(`页面是 ${parsed.month}`)
      rows.push({ ...parsed, url: mopsUrl(month) })
      console.log(`  mops ${month} 缺 ${parsed.missing.join(',') || '无'}`)
    } catch (error) {
      errors.push({ month, error: error.message })
      console.error(`  mops ${month} ${error.message}`)
    }
    await sleep(120)
  }
  if (rows.length < 12) throw new Error(`月营收只拿到 ${rows.length} 个月`)
  return {
    detail: `${rows[0].month} 至 ${rows.at(-1).month}，${rows.length} 个月`,
    fetchedAt,
    names: MOPS_NAMES,
    months: rows,
    errors
  }
}

async function fetchNbs() {
  const links = new Map()
  for (let page = 0; page < 67; page += 1) {
    const url = page === 0 ? `${NBS_INDEX}index.html` : `${NBS_INDEX}index_${page}.html`
    try {
      const html = await request(url)
      for (const match of html.matchAll(/href="(\.\/20\d{4}\/t20[^"]+\.html)"[^>]*>([\s\S]*?)<\/a>/g)) {
        const text = match[2].replace(/<[^>]+>/g, '').replace(/\s+/g, '')
        if (text.includes('流通领域重要生产资料市场价格')) {
          links.set(new URL(match[1], url).href, text)
        }
      }
    } catch (error) {
      console.error(`  nbs index ${page} ${error.message}`)
    }
  }
  const observations = []
  const failed = []
  const queue = [...links.keys()]
  await pool(queue, 4, async (url) => {
    try {
      const parsed = parseNbsDecade(await request(url), url)
      if (!parsed) {
        failed.push({ url, error: '没有解析出 PP 或 LLDPE' })
        return
      }
      observations.push(parsed)
    } catch (error) {
      failed.push({ url, error: error.message })
    }
    await sleep(40)
  })
  for (const control of NBS_CONTROL_PAGES) {
    let row = observations.find((item) => item.url === control.url)
    if (!row) {
      row = parseNbsDecade(await request(control.url), control.url)
      if (row) observations.push(row)
    }
    if (!row || row.x !== control.x || row.pp !== control.pp || row.lldpe !== control.lldpe || row.pvc != null) {
      throw new Error(`对照页对不上 ${control.url}：${JSON.stringify(row)}`)
    }
  }
  observations.sort((a, b) => decadeSortKey(a.x).localeCompare(decadeSortKey(b.x)))
  const unique = []
  const seen = new Set()
  for (const row of observations) {
    if (seen.has(row.x)) continue
    seen.add(row.x)
    unique.push(row)
  }
  if (!unique.length) throw new Error('没有旬度价格')
  return {
    detail: `${unique[0].x} 至 ${unique.at(-1).x}，${unique.length} 旬，索引 ${links.size} 条`,
    fetchedAt,
    observations: unique,
    failed
  }
}

async function fetchSec() {
  const response = await request(SEC_URL, {
    headers: {
      'User-Agent': 'Supply Chain Insights research@johnpeng-cn.github.io',
      Accept: 'application/json'
    }
  })
  if (response.trim().startsWith('<')) throw new Error('SEC 返回的不是 JSON')
  const payload = JSON.parse(response)
  const usd = payload.units?.USD || []
  const quarters = usd
    .filter((row) => row.form === '10-Q' && row.fp?.startsWith('Q'))
    .map((row) => ({
      end: row.end,
      fp: row.fp,
      fy: row.fy,
      filed: row.filed,
      val: row.val
    }))
  return {
    ok: true,
    detail: payload.entityName || 'LyondellBasell',
    fetchedAt,
    source: SEC_URL,
    entityName: payload.entityName,
    quarters
  }
}

async function syncCharts(bundle) {
  const resin = bundle.bls.series.PCU325211325211.points
  const chartsPath = resolve(root, 'data/cases/charts.json')
  const charts = {}
  const sourceBls = {
    name: '美国劳工统计局 PPI，序列 PCU325211325211',
    url: 'https://api.bls.gov/publicAPI/v2/timeseries/data/PCU325211325211'
  }
  const sourceEia = { name: '美国能源信息署 Mont Belvieu 丙烷现货月价', url: EIA_PAGE }
  const sourceProd = { name: 'Eurostat 工业产量 sts_inpr_m，C2016，EU27_2020', url: EUROSTAT_PROD }
  const sourcePpi = { name: 'Eurostat 国内出厂价 sts_inppd_m，C2016，EU27_2020', url: EUROSTAT_PPI }

  const harvey = slice(resin, '2017-01', '2018-12')
  charts['plastics-harvey-2017-ppi'] = lineChart({
    id: 'plastics-harvey-2017-ppi',
    title: '美国树脂 PPI：哈维飓风前后',
    caption: `2017 年 8 月 ${y(harvey, '2017-08')}，10 月 ${y(harvey, '2017-10')}，12 月 ${y(harvey, '2017-12')}。行业指数抬得慢，牌号现货可以跳得很快。`,
    note: blsNote(harvey.at(-1).x, '窗口是 2017-01 至 2018-12。'),
    sources: [sourceBls],
    series: [{ name: '塑料材料与树脂制造', unit: '指数', points: harvey }]
  })

  const texasResin = slice(resin, '2020-08', '2022-03')
  const texasPropane = bundle.eia.points
    .filter((point) => point.x >= '2020-08' && point.x <= '2022-03')
    .map((point) => ({ x: point.x, y: point.centsPerGallon }))
  charts['plastics-texas-2021-ppi'] = lineChart({
    id: 'plastics-texas-2021-ppi',
    title: '得州寒潮前后：美国树脂 PPI 和丙烷现货',
    caption: `树脂 PPI 2021 年 1 月 ${y(texasResin, '2021-01')}，2 月 ${y(texasResin, '2021-02')}，3 月 ${y(texasResin, '2021-03')}。丙烷 2021 年 2 月 ${y(texasPropane, '2021-02')} 美分/加仑，10 月 ${y(texasPropane, '2021-10')}。`,
    note: `${blsNote(texasResin.at(-1).x, '窗口是 2020-08 至 2022-03。')}丙烷是 EIA 序列 EER_EPLLPA_PF4_Y44MB_DPG，单位美元/加仑，图上乘以 100 画成美分/加仑，便于和指数放在一起看，不是另算的一种价格。`,
    sources: [sourceBls, sourceEia],
    series: [
      { name: '塑料材料与树脂制造', unit: '指数', points: texasResin },
      { name: 'Mont Belvieu 丙烷', axis: 'right', unit: '美分/加仑', points: texasPropane }
    ]
  })

  const prod = bundle.eurostat.production.points.filter((point) => point.x >= '2021-01')
  const euPrice = bundle.eurostat.producerPrices.points.filter((point) => point.x >= '2021-01')
  charts['plastics-eu-energy-2022'] = lineChart({
    id: 'plastics-eu-energy-2022',
    title: '欧盟初级形态塑料：产量和国内出厂价',
    caption: `产量指数 2021-12 为 ${y(prod, '2021-12')}，2022-12 为 ${y(prod, '2022-12')}，最新 ${prod.at(-1).x} 为 ${prod.at(-1).y}。出厂价 2022-06 为 ${y(euPrice, '2022-06')}。两条都是 2021=100。`,
    note: `产量是季调且日历调整（${bundle.eurostat.production.adjustment}），出厂价本次接口返回的是未季调（${bundle.eurostat.producerPrices.adjustment}）。单位都是 ${bundle.eurostat.production.unit}。NACE C2016，地域 EU27_2020。产量更新时间 ${bundle.eurostat.production.updated}，出厂价更新时间 ${bundle.eurostat.producerPrices.updated}。本站整理绘图，不是 Eurostat 原图。`,
    sources: [sourceProd, sourcePpi],
    series: [
      { name: '产量', unit: '2021=100', points: prod },
      { name: '国内出厂价', unit: '2021=100', points: euPrice }
    ]
  })

  const retreat = slice(resin, '2020-01', resin.at(-1).x)
  const peak = retreat.reduce((best, point) => (point.y > best.y ? point : best), retreat[0])
  charts['plastics-ppi-2020-2024'] = lineChart({
    id: 'plastics-ppi-2020-2024',
    title: '美国树脂 PPI：2022 年高点之后',
    caption: `高点在 ${peak.x}，指数 ${peak.y}。2023-12 为 ${y(retreat, '2023-12')}。最新 ${retreat.at(-1).x} 为 ${retreat.at(-1).y}。`,
    note: blsNote(retreat.at(-1).x, '窗口从 2020-01 起到本次抓到的最新月。指数回落本身不能区分去库存和需求下滑。'),
    sources: [sourceBls],
    series: [{ name: '塑料材料与树脂制造', unit: '指数', points: retreat }]
  })

  if (bundle.mops) {
    const codes = ['1301', '1326', '1303']
    charts['plastics-tw-revenue'] = lineChart({
      id: 'plastics-tw-revenue',
      title: '台塑、台化、南亚月营收',
      caption: revenueCaption(bundle.mops),
      note: '图上是上市公司每月营业收入，不是树脂单价，也不是中国大陆出厂价。公开资讯观测站原表单位是新台币千元，图上换成亿元（千元 ÷ 100,000，保留两位小数）。1301 台塑，1326 台化，1303 南亚。取当月营收，不是累计。台塑化体量不在同一级，没有画在这张图上。本站整理绘图。',
      sources: [{ name: '台湾证券交易所公开资讯观测站，上市公司每月营业收入', url: mopsUrl(bundle.mops.months.at(-1).month) }],
      series: codes.map((code) => ({
        name: MOPS_NAMES[code],
        unit: '新台币亿元',
        points: bundle.mops.months
          .filter((month) => month.rows[code])
          .map((month) => ({ x: month.month, y: month.rows[code].yiTwd }))
      }))
    })
  }

  if (bundle.nbs) {
    const windowed = bundle.nbs.observations.filter((row) => row.x >= '2023-01上')
    const pp = windowed.filter((row) => row.pp != null).map((row) => ({ x: row.x, y: row.pp }))
    const lldpe = windowed.filter((row) => row.lldpe != null).map((row) => ({ x: row.x, y: row.lldpe }))
    if (pp.length >= 12 && lldpe.length >= 12) {
      charts['plastics-china-pp-lldpe'] = lineChart({
        id: 'plastics-china-pp-lldpe',
        title: '中国流通领域：PP 拉丝料和 LLDPE',
        caption: nbsCaption(windowed),
        note: `国家统计局每旬《流通领域重要生产资料市场价格变动情况》。聚丙烯（拉丝料）、聚乙烯（LLDPE，熔融指数 2 薄膜料），单位元/吨，取当旬价格，不是本站算的月均。图从 2023 年上旬起，画到本次索引能解析到的最新旬 ${windowed.at(-1)?.x || ''}。PVC 和苯乙烯不在这张图上。每个点都能回到该旬的统计局页面。本站整理绘图。`,
        sources: [{ name: '国家统计局流通领域重要生产资料市场价格', url: windowed.at(-1).url }],
        series: [
          { name: '聚丙烯（拉丝料）', unit: '元/吨', points: pp },
          { name: 'LLDPE', unit: '元/吨', points: lldpe }
        ]
      })
    }
  }

  const raw = await readFile(chartsPath, 'utf8')
  await writeFile(chartsPath, upsertCharts(raw, charts))
  console.log(`charts.json 已写入 ${Object.keys(charts).join(', ')}`)
}

function upsertCharts(raw, additions) {
  let text = raw
  for (const key of Object.keys(JSON.parse(raw))) {
    if (key.startsWith('plastics-')) text = removeTopLevelKey(text, key)
  }
  text = text.replace(/,(\s*}\s*)$/, '$1')
  const inner = JSON.stringify(additions, null, 2).split('\n').slice(1, -1).join('\n')
  const trimmed = text.trimEnd()
  if (!trimmed.endsWith('}')) throw new Error('charts.json 不是对象')
  const body = trimmed.slice(0, -1).replace(/\s*$/, '')
  return `${body},\n${inner}\n}\n`
}

function removeTopLevelKey(jsonText, key) {
  const token = `\n  "${key}": `
  const start = jsonText.indexOf(token)
  if (start < 0) return jsonText
  let index = start + token.length
  if (jsonText[index] !== '{') throw new Error(`图表 ${key} 不是对象`)
  let depth = 0
  let inString = false
  let escaped = false
  for (; index < jsonText.length; index += 1) {
    const char = jsonText[index]
    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
      continue
    }
    if (char === '"') inString = true
    else if (char === '{') depth += 1
    else if (char === '}') {
      depth -= 1
      if (depth === 0) {
        index += 1
        break
      }
    }
  }
  let end = index
  if (jsonText[end] === ',') end += 1
  return jsonText.slice(0, start) + jsonText.slice(end)
}

function lineChart({ id, title, caption, note, sources, series }) {
  return { id, title, caption, note, sources, series }
}

function slice(points, start, end) {
  return points.filter((point) => point.x >= start && point.x <= end).map((point) => ({ x: point.x, y: point.y }))
}

function y(points, x) {
  const value = pointAt(points, x)
  if (value == null) throw new Error(`缺 ${x}`)
  return value
}

function blsNote(through, extra) {
  return `序列 PCU325211325211，Plastics Material and Resin Manufacturing，不是热塑性树脂分项 PCU3252113252111，也不是某一牌号的合约价。本站于 ${fetchedAt} 调用 BLS 公开 API 后整理绘图。图上最新月 ${through}。BLS 会修订近期月份，以官网为准。${extra}`
}

function revenueCaption(mops) {
  const first = mops.months[0]
  const last = mops.months.at(-1)
  const a = last.rows['1301']
  const b = last.rows['1326']
  return `台塑 ${last.month} 当月营收 ${a?.yiTwd ?? '缺'} 亿元，台化 ${b?.yiTwd ?? '缺'} 亿元。起点 ${first.month}。这是公司营收，不是大陆树脂价。`
}

function nbsCaption(rows) {
  const latest = rows.at(-1)
  const yearSpan = (year, field) => {
    const picked = rows.filter((row) => row.x.startsWith(year) && row[field] != null)
    if (!picked.length) return ''
    const low = picked.reduce((a, b) => (a[field] < b[field] ? a : b))
    const high = picked.reduce((a, b) => (a[field] > b[field] ? a : b))
    return `${year} 年 ${low[field]}（${low.x}）到 ${high[field]}（${high.x}）`
  }
  return `PP 拉丝料 ${yearSpan('2023', 'pp')}，${yearSpan('2024', 'pp')}。最新 ${latest.x} 为 ${latest.pp} 元/吨。低价没有一直延续到这张图的末端。`

function addMonth(month) {
  const [year, monthNumber] = month.split('-').map(Number)
  const date = new Date(Date.UTC(year, monthNumber, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

async function pool(items, size, worker) {
  let index = 0
  async function next() {
    while (index < items.length) {
      const current = items[index]
      index += 1
      await worker(current)
    }
  }
  await Promise.all(Array.from({ length: size }, next))
}

async function request(url, options = {}) {
  const buffer = await requestBuffer(url, options)
  return buffer.toString('utf8')
}

async function requestBuffer(url, options = {}) {
  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(60_000),
    ...options,
    headers: {
      'User-Agent': USER_AGENT,
      Accept: '*/*',
      ...(options.headers || {})
    }
  })
  if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`)
  return Buffer.from(await response.arrayBuffer())
}

async function writeJson(name, value) {
  await writeFile(resolve(dataDir, name), `${JSON.stringify(value, null, 2)}\n`)
}

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms))
}
