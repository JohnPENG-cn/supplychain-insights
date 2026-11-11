import { correlation, gapsOf, inBreak, majorTroughs, median, percentileAtOrBelow, quarterIndex, round } from './quarters.mjs'

export const passiveCsvPath = 'docs/public/columns/passive-cycle/data.csv'

const members = [
  { company: 'Murata 村田', metric: 'capacitor_revenue_yoy_pct', name: '村田电容器' },
  { company: 'Taiyo Yuden 太阳诱电', metric: 'capacitor_revenue_yoy_pct', name: '太阳诱电电容器' },
  { company: 'TDK', metric: 'passive_segment_revenue_yoy_pct', name: 'TDK 被动元件' },
  { company: 'SEMCO 三星电机', metric: 'component_segment_revenue_yoy_pct', name: '三星电机元件' },
  { company: 'Yageo 国巨', metric: 'revenue_yoy_pct', name: '国巨' },
  { company: 'Walsin Tech 华新科', metric: 'revenue_yoy_pct', name: '华新科' },
  { company: 'AVX', metric: 'revenue_yoy_pct', name: 'AVX' }
]

const inventoryCompanies = [
  { company: 'Murata 村田', name: '村田' },
  { company: 'Taiyo Yuden 太阳诱电', name: '太阳诱电' },
  { company: 'Yageo 国巨', name: '国巨' },
  { company: 'Walsin Tech 华新科', name: '华新科' }
]

function byPeriod(rows, company, metric) {
  const points = []
  for (const row of rows) {
    if (row.company !== company || row.metric !== metric) continue
    if (!quarterIndex(row.period)) continue
    const value = Number(row.value)
    if (!Number.isFinite(value)) continue
    points.push({
      period: row.period,
      value,
      url: row.source_url,
      note: row.note || ''
    })
  }
  return points.sort((left, right) => quarterIndex(left.period) - quarterIndex(right.period))
}

function buildMedian(rows, breaks) {
  const byCompany = Object.fromEntries(
    members.map((member) => [member.company, byPeriod(rows, member.company, member.metric)])
  )
  const periods = [...new Set(Object.values(byCompany).flatMap((points) => points.map((point) => point.period)))]
    .sort((left, right) => quarterIndex(left) - quarterIndex(right))
  const points = []
  for (const period of periods) {
    const kept = []
    for (const member of members) {
      const point = byCompany[member.company].find((item) => item.period === period)
      if (!point || inBreak(breaks, member.company, period)) continue
      kept.push(point.value)
    }
    if (kept.length < 3) continue
    points.push({
      period,
      value: round(median(kept), 4),
      n: kept.length
    })
  }
  return points
}

function upturnOf(points, troughs) {
  if (!troughs.length || !points.length) return null
  const completed = []
  for (let index = 0; index < troughs.length - 1; index += 1) {
    const start = quarterIndex(troughs[index].period)
    const end = quarterIndex(troughs[index + 1].period)
    const between = points.filter((point) => {
      const cursor = quarterIndex(point.period)
      return cursor > start && cursor < end
    })
    if (!between.length) continue
    const peak = between.reduce((best, point) => (point.value > best.value ? point : best))
    completed.push({
      from: troughs[index].period,
      to: peak.period,
      quarters: quarterIndex(peak.period) - start,
      peak: round(peak.value, 2)
    })
  }
  const last = troughs[troughs.length - 1]
  const latest = points[points.length - 1]
  return {
    from: last.period,
    to: latest.period,
    quarters: quarterIndex(latest.period) - quarterIndex(last.period),
    confirmedPeak: false,
    pastQuarters: completed.map((item) => item.quarters),
    past: completed,
    longestPast: completed.reduce((max, item) => Math.max(max, item.quarters), 0)
  }
}

function inventoryOf(rows) {
  return inventoryCompanies.map((company) => {
    const points = byPeriod(rows, company.company, 'inventory_days')
    const latest = points[points.length - 1]
    const values = points.map((point) => point.value)
    const rank = percentileAtOrBelow(values, latest.value)
    const sorted = [...values].sort((left, right) => left - right)
    const highest = points.reduce((best, point) => (point.value > best.value ? point : best))
    return {
      name: company.name,
      period: latest.period,
      days: round(latest.value, 1),
      percentile: round(rank.percent, 1),
      medianDays: round(median(values), 1),
      maxDays: round(highest.value, 1),
      maxPeriod: highest.period,
      url: latest.url,
      previous:
        points.length > 1
          ? { period: points[points.length - 2].period, days: round(points[points.length - 2].value, 1) }
          : null
    }
  })
}

function groupInventory(rows) {
  const bucket = new Map()
  for (const company of inventoryCompanies) {
    for (const point of byPeriod(rows, company.company, 'inventory_days')) {
      if (!bucket.has(point.period)) bucket.set(point.period, [])
      bucket.get(point.period).push(point.value)
    }
  }
  return [...bucket.entries()]
    .filter(([, values]) => values.length >= 3)
    .map(([period, values]) => ({ period, days: round(median(values), 1), n: values.length }))
    .sort((left, right) => quarterIndex(left.period) - quarterIndex(right.period))
}

function leadOf(bookToBill, medianPoints) {
  const medianByPeriod = new Map(medianPoints.map((point) => [point.period, point.value]))
  let best = { lag: null, r: null, n: 0 }
  for (let lag = 0; lag <= 4; lag += 1) {
    const xs = []
    const ys = []
    for (const point of bookToBill) {
      const target = quarterIndex(point.period) + lag
      const match = [...medianByPeriod.keys()].find((period) => quarterIndex(period) === target)
      if (!match) continue
      xs.push(point.value)
      ys.push(medianByPeriod.get(match))
    }
    const r = correlation(xs, ys)
    if (r != null && (best.r == null || r > best.r)) best = { lag, r: round(r, 2), n: xs.length }
  }
  return best
}

export function buildPassivePosition(rows, breaks) {
  const medianPoints = buildMedian(rows, breaks)
  const latestMedian = medianPoints[medianPoints.length - 1]
  const medianValues = medianPoints.map((point) => point.value)
  const rank = percentileAtOrBelow(medianValues, latestMedian.value)
  const historyMedian = round(median(medianValues), 2)
  const historyMax = medianPoints.reduce((best, point) => (point.value > best.value ? point : best))
  const troughs = majorTroughs(medianPoints)
  const gaps = gapsOf(troughs)
  const upturn = upturnOf(medianPoints, troughs)

  const latestPeriod = latestMedian.period
  const companyRows = members.map((member) => {
    const points = byPeriod(rows, member.company, member.metric)
    const chosen = points.find((item) => item.period === latestPeriod) || null
    return {
      name: member.name,
      company: member.company,
      period: chosen ? chosen.period : null,
      value: chosen ? round(chosen.value, 2) : null,
      url: chosen ? chosen.url : '',
      inMedian: Boolean(chosen) && !inBreak(breaks, member.company, chosen.period),
      provisional: Boolean(chosen && chosen.note.includes('月营收')),
      breakNote: chosen && inBreak(breaks, member.company, chosen.period) ? '口径断点，不进中位数' : ''
    }
  })

  const bookPoints = byPeriod(rows, 'Murata 村田', 'capacitor_book_to_bill').map((point) => ({
    period: point.period,
    value: round(point.value, 4),
    url: point.url
  }))
  const bookLatest = bookPoints[bookPoints.length - 1]
  const bookPrevious = bookPoints[bookPoints.length - 2]
  const bookRank = percentileAtOrBelow(
    bookPoints.map((point) => point.value),
    bookLatest.value
  )
  const bookMax = bookPoints.reduce((best, point) => (point.value > best.value ? point : best))
  const lead = leadOf(bookPoints, medianPoints)
  const inventory = inventoryOf(rows)
  const grouped = groupInventory(rows)
  const inventoryLatest = [...grouped].reverse().find((point) => quarterIndex(point.period) <= quarterIndex('2026Q2'))

  const longest = upturn.longestPast
  const stillRising = latestMedian.value > medianPoints[medianPoints.length - 2].value
  const lights = [
    {
      id: 'level',
      name: '景气位置',
      judgment: true,
      light: rank.percent >= 90 ? 'red' : rank.percent >= 60 ? 'yellow' : 'green',
      label: rank.percent >= 90 ? '历史高位' : '不高',
      rule: '判断：中位同比处在样本第 90 百分位及以上，标成历史高位。这只说明现在高，不说明这一季是峰。',
      latest: `${latestMedian.period} 中位同比 ${latestMedian.value >= 0 ? '+' : ''}${latestMedian.value.toFixed(1)}%（${latestMedian.n} 家）。${rank.n} 个季度里有 ${rank.count} 个不高于这一季（${rank.percent.toFixed(1)}%）。`
    },
    {
      id: 'length',
      name: '上行长度',
      judgment: true,
      light: upturn.quarters > longest ? 'yellow' : 'green',
      label: upturn.quarters > longest ? '长于以往，未确认见顶' : '未长于以往',
      rule: `判断：已经走完的上行是 ${upturn.pastQuarters.join('、')} 个季度。本轮已 ${upturn.quarters} 个季度，而且 ${latestMedian.period} 是序列最后一点，不把它写成峰。`,
      latest: `从 ${upturn.from} 的谷底算到 ${upturn.to}，已经 ${upturn.quarters} 个季度。${stillRising ? '这一季的中位数仍高于上一季。' : '这一季的中位数没有再高于上一季。'}`
    },
    {
      id: 'book',
      name: '村田电容器订单出货比',
      judgment: true,
      light: bookLatest.value < bookPrevious.value && bookPrevious.period === bookMax.period ? 'yellow' : bookLatest.value >= 1.3 ? 'red' : 'green',
      label: bookLatest.value < bookPrevious.value && bookPrevious.period === bookMax.period ? '从纪录高点回落' : '未从纪录高点回落',
      rule: '判断：订单出货比从本样本的最高点回落，标成第一次转松。它仍然高于 1，不能单独写成下行已经开始。领先约 2 个季度是相关，不是到货日期。',
      latest: `${bookPrevious.period} ${bookPrevious.value.toFixed(2)}，${bookLatest.period} ${bookLatest.value.toFixed(2)}。${bookRank.n} 季里有 ${bookRank.count} 季不高于 ${bookLatest.value.toFixed(2)}（${bookRank.percent.toFixed(1)}%）。`
    },
    {
      id: 'inventory',
      name: '存货天数',
      judgment: true,
      light: 'yellow',
      label: '全公司口径，天数不低',
      rule: '判断：存货天数用全公司存货和营业成本，含电容以外的业务。高于自家历史中位数，只说明账上不瘦，不能当成见顶。',
      latest: inventory
        .map((item) => `${item.name} ${item.period} ${item.days} 天（约第 ${Math.round(item.percentile)} 百分位）`)
        .join('；')
    },
    {
      id: 'utilization',
      name: '产能利用率',
      judgment: false,
      light: 'unknown',
      label: '缺失',
      rule: '公司公开文件里没有可引用的稼动率数字，这里留空，不估算。',
      latest: '缺失。'
    }
  ]

  return {
    extractedFrom: `/${passiveCsvPath.replace(/^docs\/public\//, '')}`,
    asOf: '2026-11-11',
    disclaimer:
      '本块不预测下一次下行落在哪一季。谷底间隔大约三年半，是这批被动元件账本自己算出来的，不是把半导体那口四年的钟挪过来。',
    median: {
      points: medianPoints,
      latest: {
        period: latestMedian.period,
        value: round(latestMedian.value, 2),
        n: latestMedian.n,
        percentile: round(rank.percent, 1),
        percentileCount: rank.count,
        percentileN: rank.n,
        historyMedian,
        historyMax: round(historyMax.value, 1),
        historyMaxPeriod: historyMax.period
      },
      companies: companyRows,
      troughs: troughs.map((point) => ({ period: point.period, value: round(point.value, 1) })),
      gaps,
      averageGapQuarters: round(gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length, 2),
      upturn
    },
    bookToBill: {
      points: bookPoints.map((point) => ({ period: point.period, value: point.value })),
      latest: {
        period: bookLatest.period,
        value: round(bookLatest.value, 2),
        url: bookLatest.url,
        previousPeriod: bookPrevious.period,
        previous: round(bookPrevious.value, 2),
        percentile: round(bookRank.percent, 1),
        maxPeriod: bookMax.period,
        max: round(bookMax.value, 2)
      },
      lead
    },
    inventory: {
      limitation: '存货天数是全公司口径，村田、太阳诱电、国巨、华新科都含电容以外的业务。TDK 和三星电机的全公司存货不拿来算。',
      companies: inventory,
      group: inventoryLatest
    },
    utilization: '缺失',
    lights
  }
}
