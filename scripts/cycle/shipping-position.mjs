import { correlation, gapsOf, inBreak, majorTroughs, median, percentileAtOrBelow, quarterIndex, round } from './quarters.mjs'

export const shippingCsvPath = 'docs/public/columns/shipping-cycle/data.csv'

const segments = [
  {
    id: 'container',
    name: '集装箱班轮',
    cluster: 'Container 集装箱班轮',
    members: ['Evergreen 长荣', 'Yang Ming 阳明', 'COSCO Holdings 中远海控', 'Hapag-Lloyd 赫伯罗特'],
    overlay: { company: 'Maersk 马士基', name: '马士基 Ocean/Line' },
    minSafe: 4,
    note: '中位数是长荣、阳明、中远海控、赫伯罗特。马士基只作虚线对照，不进中位数。2013 年长荣改国际准则，只剩阳明，这一年没有中位数。'
  },
  {
    id: 'drybulk',
    name: '干散货',
    cluster: 'Dry bulk 干散货',
    members: ['Star Bulk 星散', 'Genco', 'Safe Bulkers', 'Diana Shipping'],
    overlay: null,
    minSafe: 4,
    note: '中位数是星散、Genco、Safe Bulkers、Diana。太平洋航运只有半年报，不进季度中位数。可靠阶段大约从 2015 年起，2008–2009 年样本薄。'
  },
  {
    id: 'tanker',
    name: '油轮',
    cluster: 'Tanker 油轮',
    members: ['Frontline', 'DHT', 'Teekay Tankers', 'International Seaways', 'Scorpio Tankers'],
    overlay: null,
    minSafe: 4,
    note: '中位数是 Frontline、DHT、Teekay Tankers、International Seaways、Scorpio。原油和成品油放在一组，不含 LNG。中远海能含 LNG，只留在数据集里，不进中位数。可靠阶段大约从 2016 年起。'
  }
]

function pointsOf(rows, cluster, company, metric) {
  const points = []
  for (const row of rows) {
    if (row.cluster !== cluster || row.company !== company || row.metric !== metric) continue
    if (!quarterIndex(row.period)) continue
    const value = Number(row.value)
    if (!Number.isFinite(value)) continue
    points.push({ period: row.period, value, url: row.source_url, note: row.note || '' })
  }
  return points.sort((left, right) => quarterIndex(left.period) - quarterIndex(right.period))
}

function labelFromNote(note, period) {
  if (note.includes('2009年')) return '2009年'
  if (note.includes('2014年') && note.includes('2015年')) return period === 'FY2015' ? '2015年' : '2014年'
  if (note.includes('2023年初')) return '2023年初'
  if (note.includes('2024年初')) return '2024年初'
  if (note.includes('2025年初')) return '2025年初'
  return period
}

function orderbookOf(rows) {
  const global = []
  const bySegment = []
  const fleet = []
  for (const row of rows) {
    if (!row.company.includes('UNCTAD')) continue
    const value = Number(row.value)
    if (!Number.isFinite(value)) continue
    if (row.metric === 'orderbook_fleet_pct' && row.cluster.startsWith('Shipping')) {
      global.push({
        period: row.period,
        label: labelFromNote(row.note, row.period),
        value: round(value, 1),
        url: row.source_url,
        note: row.note
      })
    }
    if (row.metric === 'orderbook_fleet_pct' && row.period === 'FY2024' && !row.cluster.startsWith('Shipping')) {
      const segment = segments.find((item) => item.cluster === row.cluster)
      if (!segment) continue
      bySegment.push({
        id: segment.id,
        name: segment.name,
        value: round(value, 1),
        url: row.source_url,
        note: row.note
      })
    }
    if (row.metric === 'fleet_dwt_yoy_pct') {
      const segment = segments.find((item) => item.cluster === row.cluster)
      if (!segment) continue
      fleet.push({
        id: segment.id,
        name: segment.name,
        value: round(value, 1),
        url: row.source_url,
        note: row.note
      })
    }
  }
  const order = ['FY2009', 'FY2014', 'FY2015', 'FY2022', 'FY2023', 'FY2024']
  global.sort((left, right) => order.indexOf(left.period) - order.indexOf(right.period))
  return { global, bySegment, fleet }
}

function buildSegment(rows, breaks, spec) {
  const series = spec.members.map((company) => ({
    company,
    points: pointsOf(rows, spec.cluster, company, 'revenue_yoy_pct')
  }))
  const periods = [...new Set(series.flatMap((item) => item.points.map((point) => point.period)))].sort(
    (left, right) => quarterIndex(left) - quarterIndex(right)
  )
  const medianPoints = []
  for (const period of periods) {
    const kept = []
    for (const item of series) {
      if (inBreak(breaks, item.company, period)) continue
      const point = item.points.find((row) => row.period === period)
      if (point) kept.push(point)
    }
    if (kept.length < 2) continue
    medianPoints.push({
      period,
      value: round(median(kept.map((point) => point.value)), 4),
      n: kept.length
    })
  }
  const latest = medianPoints[medianPoints.length - 1]
  const safe = [...medianPoints].reverse().find((point) => point.n >= spec.minSafe) || latest
  const values = medianPoints.map((point) => point.value)
  const safeRank = percentileAtOrBelow(values, safe.value)
  const latestRank = percentileAtOrBelow(values, latest.value)
  const troughs = majorTroughs(medianPoints)
  const gaps = gapsOf(troughs)
  const companies = spec.members.map((company) => {
    const points = series.find((item) => item.company === company).points
    const point = points.find((item) => item.period === safe.period) || null
    const newest = points[points.length - 1] || null
    return {
      name: company,
      period: point ? point.period : null,
      value: point ? round(point.value, 1) : null,
      url: point ? point.url : '',
      inMedian: Boolean(point) && !inBreak(breaks, company, point.period),
      newestPeriod: newest ? newest.period : null,
      newestValue: newest ? round(newest.value, 1) : null,
      newestUrl: newest ? newest.url : ''
    }
  })
  let overlay = null
  if (spec.overlay) {
    const points = pointsOf(rows, spec.cluster, spec.overlay.company, 'revenue_yoy_pct')
      .filter((point) => !inBreak(breaks, spec.overlay.company, point.period))
    const plotted = points.map((point) => ({ period: point.period, value: round(point.value, 2), url: point.url }))
    const medianByPeriod = new Map(medianPoints.map((point) => [point.period, point.value]))
    const pairedX = []
    const pairedY = []
    for (const point of plotted) {
      if (!medianByPeriod.has(point.period)) continue
      pairedX.push(point.value)
      pairedY.push(medianByPeriod.get(point.period))
    }
    const overlayCorrelation = correlation(pairedX, pairedY)
    overlay = {
      name: spec.overlay.name,
      inMedian: false,
      points: plotted.map((point) => ({ period: point.period, value: point.value })),
      latest: plotted.length
        ? {
            period: plotted[plotted.length - 1].period,
            value: round(plotted[plotted.length - 1].value, 1),
            url: plotted[plotted.length - 1].url
          }
        : null,
      correlation: overlayCorrelation == null ? null : { r: round(overlayCorrelation, 2), n: pairedX.length }
    }
  }
  const historyMax = medianPoints.reduce((best, point) => (point.value > best.value ? point : best))
  const historyMin = medianPoints.reduce((best, point) => (point.value < best.value ? point : best))
  const levelLight = safeRank.percent >= 90 ? 'red' : safeRank.percent >= 70 ? 'yellow' : 'green'
  return {
    id: spec.id,
    name: spec.name,
    note: spec.note,
    points: medianPoints,
    latest: {
      period: latest.period,
      value: round(latest.value, 1),
      n: latest.n,
      percentile: round(latestRank.percent, 1),
      thin: latest.n < spec.minSafe
    },
    safe: {
      period: safe.period,
      value: round(safe.value, 1),
      n: safe.n,
      percentile: round(safeRank.percent, 1),
      percentileCount: safeRank.count,
      percentileN: safeRank.n
    },
    companies,
    overlay,
    troughs: troughs.map((point) => ({ period: point.period, value: round(point.value, 1), n: point.n })),
    gaps,
    averageGapQuarters: gaps.length ? round(gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length, 2) : null,
    averageGapYears: gaps.length ? round(gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length / 4, 2) : null,
    historyMax: { period: historyMax.period, value: round(historyMax.value, 1) },
    historyMin: { period: historyMin.period, value: round(historyMin.value, 1) },
    lights: [
      {
        id: `${spec.id}-level`,
        name: '相对自身历史',
        judgment: true,
        light: levelLight,
        label: levelLight === 'red' ? '历史高位' : levelLight === 'yellow' ? '偏高' : '不高',
        rule: '判断：当前读数用最近一个至少 4 家公司的季度。它在本组中位数历史里不低于第 90 百分位才标红。这不是见顶，也不预测下一季。',
        latest: ''
      },
      {
        id: `${spec.id}-sample`,
        name: '最新季样本',
        judgment: true,
        light: latest.n < spec.minSafe ? 'yellow' : 'green',
        label: latest.n < spec.minSafe ? '最新季家数不足' : '样本够用',
        rule: '判断：少于 4 家的最新季只作参考，不当作这一组的当前结论。',
        latest: ''
      }
    ]
  }
}

export function buildShippingPosition(rows, breaks) {
  const built = segments.map((spec) => buildSegment(rows, breaks, spec))
  const orderbook = orderbookOf(rows)
  const supplyLights = orderbook.bySegment.map((book) => {
    const fleet = orderbook.fleet.find((item) => item.id === book.id)
    const fleetValue = fleet ? fleet.value : null
    if (book.id === 'container') {
      const hot = book.value >= 20 && fleetValue != null && fleetValue >= 5
      return {
        id: 'container-supply',
        segment: book.id,
        name: '集装箱运力',
        judgment: true,
        light: hot ? 'red' : 'yellow',
        label: hot ? '订单和交船都偏高' : '还不到这条线',
        rule: '判断：订单簿/船队达到 20% 以上，并且 2024 年船队载重吨同比达到 5% 以上，标成三组里最清楚的交付压力。不是运价见顶的季度。',
        latest: `订单簿/船队 ${book.value}% ，船队载重吨同比 ${fleetValue}%。`
      }
    }
    if (book.id === 'tanker') {
      const tight = book.value < 10 && fleetValue != null && fleetValue < 1
      return {
        id: 'tanker-supply',
        segment: book.id,
        name: '油轮运力',
        judgment: true,
        light: tight ? 'green' : 'yellow',
        label: tight ? '供给仍紧' : '不再同时满足',
        rule: '判断：订单簿/船队低于 10%，并且 2024 年船队载重吨同比低于 1%，标成供给仍紧。事件可以很快把运价打下来，这盏灯不预测哪一季。',
        latest: `订单簿/船队 ${book.value}% ，船队载重吨同比 ${fleetValue}%。`
      }
    }
    return {
      id: 'drybulk-supply',
      segment: book.id,
      name: '干散货运力',
      judgment: true,
      light: 'yellow',
      label: '居中',
      rule: '判断：干散货不套用集装箱那条 20% 的线，也不套用油轮那条「低于 10% 且船队几乎不增长」的线。数字放在两组中间，就标成居中。',
      latest: `订单簿/船队 ${book.value}% ，船队载重吨同比 ${fleetValue}%。`
    }
  })
  return {
    extractedFrom: `/${shippingCsvPath.replace(/^docs\/public\//, '')}`,
    asOf: '2026-11-11',
    disclaimer:
      '本看板不预测下一次下行落在哪一季。集装箱、干散货、油轮分开读。这里没有把三组合成一个中位数，也不下全组一起怎样的结论。',
    segments: built,
    orderbook,
    supplyLights,
    utilization: '班轮公司偶有公布的利用率只留在数据集里，不拿来给三组打一盏灯。'
  }
}
