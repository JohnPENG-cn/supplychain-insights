import { formatNumber, formatPercent } from '../mlcc/dates.mjs'

const LIGHT_LABEL = { red: '红', yellow: '黄', green: '绿', unknown: '缺数据' }

export function lightLabel(light) {
  return LIGHT_LABEL[light] || '缺数据'
}

export function quarterNumber(period) {
  const match = /^(\d{4})Q([1-4])$/.exec(period)
  if (!match) return null
  return Number(match[1]) * 4 + Number(match[2])
}

export function addQuarters(period, count) {
  let year = Number(period.slice(0, 4))
  let quarter = Number(period.slice(5)) + count
  while (quarter > 4) {
    quarter -= 4
    year += 1
  }
  while (quarter < 1) {
    quarter += 4
    year -= 1
  }
  return `${year}Q${quarter}`
}

export function median(values) {
  const sorted = values.filter((value) => Number.isFinite(value)).sort((left, right) => left - right)
  if (sorted.length === 0) return null
  const middle = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 1) return sorted[middle]
  return (sorted[middle - 1] + sorted[middle]) / 2
}

export function buildSeries(file) {
  const byCompany = new Map(file.companies.map((company) => [company.id, []]))
  for (const row of file.rows) byCompany.get(row.company)?.push(row)
  const companySeries = file.companies.map((company) => {
    const rows = byCompany.get(company.id) || []
    const points = rows.map((row) => {
      const yearAgo = rows.find((item) => item.period === addQuarters(row.period, -4))
      const yoy =
        yearAgo && Number.isFinite(row.revenue) && Number.isFinite(yearAgo.revenue) && yearAgo.revenue !== 0
          ? row.revenue / yearAgo.revenue - 1
          : null
      const days =
        Number.isFinite(row.inventory) && Number.isFinite(row.cogs) && row.cogs !== 0
          ? (row.inventory / row.cogs) * file.daysFactor
          : null
      return { ...row, yoy, days }
    })
    return { company, points }
  })
  const periods = [...new Set(file.rows.map((row) => row.period))].sort()
  const quarters = periods.map((period) => {
    const points = companySeries.flatMap((series) => series.points.filter((point) => point.period === period))
    const yoyPoints = points.filter((point) => point.yoy != null && point.yoyBreak !== true)
    const dayPoints = points.filter((point) => point.days != null)
    return {
      period,
      yoyMedian: median(yoyPoints.map((point) => point.yoy)),
      yoyCount: yoyPoints.length,
      yoyIds: yoyPoints.map((point) => point.company),
      daysMedian: median(dayPoints.map((point) => point.days)),
      daysCount: dayPoints.length,
      daysIds: dayPoints.map((point) => point.company)
    }
  })
  return { companySeries, quarters }
}

export function evaluateIc(input) {
  const file = input.quarters
  const config = input.config
  const built = buildSeries(file)
  const yoyQuarters = built.quarters.filter((quarter) => quarter.yoyMedian != null)
  const dayQuarters = built.quarters.filter((quarter) => quarter.daysMedian != null)
  const latestYoy = yoyQuarters.at(-1)
  const previousYoy = yoyQuarters.at(-2)
  const priorYoy = yoyQuarters.at(-3)
  const latestDays = dayQuarters.at(-1)
  const previousDays = dayQuarters.at(-2)
  const paired = pairedShift(built, latestYoy?.period, previousYoy?.period)
  const lights = [
    yoyLight(config, latestYoy, previousYoy, priorYoy),
    inventoryLight(config, latestYoy, previousYoy, latestDays, previousDays, paired),
    managementLight(config, input.management, built)
  ]
  const dayValues = dayQuarters.map((quarter) => quarter.daysMedian)
  const historyMedian = median(dayValues)
  const record = dayQuarters.reduce((best, quarter) => (quarter.daysMedian > best.daysMedian ? quarter : best))
  const troughs = troughReport(config.troughs, built.quarters)
  return {
    today: input.today,
    lights,
    latest: latestRows(built),
    charts: chartsOf(built, config),
    bars: barsOf(built),
    position: {
      period: latestYoy?.period || '',
      yoyMedian: latestYoy?.yoyMedian ?? null,
      yoyCount: latestYoy?.yoyCount ?? 0,
      daysMedian: latestDays?.period === latestYoy?.period ? latestDays.daysMedian : null,
      daysCount: latestDays?.period === latestYoy?.period ? latestDays.daysCount : 0,
      historyMedian,
      recordPeriod: record?.period || '',
      recordDays: record?.daysMedian ?? null
    },
    troughs,
    disclaimer: config.disclaimer
  }
}

function yoyLight(config, latest, previous, prior) {
  const rule = config.yoyDecline
  const one = latest && previous && latest.yoyMedian < previous.yoyMedian
  const two = one && prior && previous.yoyMedian < prior.yoyMedian
  const sampleChanged = one && !sameIds(latest.yoyIds, previous.yoyIds)
  let light = 'green'
  if (two) light = 'red'
  else if (one) light = 'yellow'
  const sample = sampleChanged ? '这一季有数的公司和上一季不是同一批。' : '这一季和上一季是同一批公司。'
  return {
    id: 'yoy-decline',
    name: '营收同比连降两季',
    judgment: true,
    light,
    lights: [{ light, label: lightLabel(light) }],
    asOf: latest?.period || '',
    latest: `${prior?.period || '上上季'} 中位数 ${formatPercent(prior?.yoyMedian)}，${previous?.period || '上一季'} ${formatPercent(previous?.yoyMedian)}，${latest?.period || '这一季'} ${formatPercent(latest?.yoyMedian)}（${latest?.yoyCount ?? 0} 家）。${sample}`,
    action: rule.actions[light],
    gloss: rule.gloss
  }
}

function inventoryLight(config, latestYoy, previousYoy, latestDays, previousDays, paired) {
  const rule = config.inventoryWhileSlowing
  const headlineDaysUp =
    latestDays && previousDays && latestDays.period === latestYoy?.period && latestDays.daysMedian > previousDays.daysMedian
  const headlineYoyDown = latestYoy && previousYoy && latestYoy.yoyMedian < previousYoy.yoyMedian
  const pairedDaysUp = paired && paired.daysNow > paired.daysThen
  const pairedYoyDown = paired && paired.yoyNow < paired.yoyThen
  let light = 'green'
  if (pairedDaysUp && pairedYoyDown) light = 'red'
  else if ((headlineDaysUp && headlineYoyDown) || pairedDaysUp || pairedYoyDown) light = 'yellow'
  const pairedText = paired
    ? `同一批 ${paired.ids.length} 家：库存天数中位数 ${formatDays(paired.daysThen)} 到 ${formatDays(paired.daysNow)}，营收同比中位数 ${formatPercent(paired.yoyThen)} 到 ${formatPercent(paired.yoyNow)}。`
    : '同一批公司比不了。'
  return {
    id: 'inventory-while-slowing',
    name: '库存天数还在升，同时同比放缓',
    judgment: true,
    light,
    lights: [{ light, label: lightLabel(light) }],
    asOf: latestDays?.period || '',
    latest: `当季有数的公司，库存天数中位数 ${formatDays(previousDays?.daysMedian)} 到 ${formatDays(latestDays?.daysMedian)}，营收同比中位数 ${formatPercent(previousYoy?.yoyMedian)} 到 ${formatPercent(latestYoy?.yoyMedian)}。${pairedText}${paired?.detail ? `${paired.detail}。` : ''}`,
    action: rule.actions[light],
    gloss: rule.gloss,
    detail: paired?.detail || ''
  }
}

function managementLight(config, file, built) {
  const rule = config.management
  const entries = file?.entries || []
  const latestByCompany = new Map(latestRows(built).map((row) => [row.id, row.period]))
  const missing = [...latestByCompany.entries()].filter(
    ([id, period]) => !entries.some((entry) => entry.company === id && entry.period === period)
  )
  let light = 'unknown'
  if (entries.some((entry) => entry.hit === true)) light = 'red'
  else if (entries.length > 0 && missing.length === 0) light = 'green'
  else if (entries.length > 0) light = 'yellow'
  const names = missing.map(([id]) => built.companySeries.find((series) => series.company.id === id)?.company.name || id)
  return {
    id: 'management',
    name: '管理层提到客户在消化库存，或渠道库存还在升',
    judgment: true,
    light,
    lights: [{ light, label: lightLabel(light) }],
    asOf: file?.updatedAt || '',
    latest:
      entries.length === 0
        ? file?.note || '手工条目是空的。'
        : `已收录 ${entries.length} 条，命中 ${entries.filter((entry) => entry.hit).length} 条。${names.length ? `还没有对上原文的是：${names.join('、')}。` : '四家最近一季都有条目。'}${file?.note ? ` ${file.note}` : ''}`,
    action: rule.actions[light],
    gloss: rule.gloss,
    entries: entries.map((entry) => ({
      ...entry,
      hitLabel: entry.hit ? '命中' : '未命中'
    }))
  }
}

function pairedShift(built, current, previous) {
  if (!current || !previous) return null
  const ids = built.companySeries
    .filter((series) => {
      const now = series.points.find((point) => point.period === current)
      const then = series.points.find((point) => point.period === previous)
      return now?.yoy != null && then?.yoy != null && now.yoyBreak !== true && then.yoyBreak !== true && now.days != null && then.days != null
    })
    .map((series) => series.company.id)
  if (ids.length < 2) return null
  const pick = (period, key) =>
    median(
      ids.map((id) => built.companySeries.find((series) => series.company.id === id).points.find((point) => point.period === period)[key])
    )
  const detail = ids
    .map((id) => {
      const series = built.companySeries.find((item) => item.company.id === id)
      const now = series.points.find((point) => point.period === current)
      const then = series.points.find((point) => point.period === previous)
      const dayWay = now.days > then.days ? '升' : now.days < then.days ? '降' : '平'
      return `${series.company.name}库存天数${dayWay}`
    })
    .join('，')
  return {
    ids,
    daysThen: pick(previous, 'days'),
    daysNow: pick(current, 'days'),
    yoyThen: pick(previous, 'yoy'),
    yoyNow: pick(current, 'yoy'),
    detail
  }
}

function latestRows(built) {
  return built.companySeries.map((series) => {
    const point = [...series.points].reverse().find((item) => item.revenue != null)
    return {
      id: series.company.id,
      name: series.company.name,
      period: point?.period || '',
      periodEnd: point?.periodEnd || '',
      yoy: point?.yoy ?? null,
      days: point?.days ?? null,
      yoyBreak: point?.yoyBreak === true,
      revenueUrl: point?.revenueUrl || '',
      inventoryUrl: point?.inventoryUrl || '',
      fiscal: series.company.fiscal
    }
  })
}

function chartsOf(built, config) {
  const from = config.chartFrom || '2008Q1'
  const yoy = lineChart(
    '营收同比',
    'percent',
    built,
    from,
    (point) => (point.yoy == null ? null : point.yoy),
    (quarter) => quarter.yoyMedian
  )
  const days = lineChart(
    '库存天数',
    'days',
    built,
    from,
    (point) => point.days,
    (quarter) => quarter.daysMedian
  )
  return [yoy, days]
}

function lineChart(title, format, built, from, companyValue, medianValue) {
  const series = built.companySeries.map((item) => ({
    name: item.company.name,
    color: item.company.color,
    points: item.points
      .filter((point) => point.period >= from)
      .map((point) => ({ date: point.period, value: companyValue(point) }))
      .filter((point) => point.value != null)
  }))
  series.push({
    name: '中位数',
    color: '#334155',
    points: built.quarters
      .filter((quarter) => quarter.period >= from && medianValue(quarter) != null)
      .map((quarter) => ({ date: quarter.period, value: medianValue(quarter) }))
  })
  return { title, format, series, dots: false }
}

function barsOf(built) {
  const rows = latestRows(built).filter((row) => row.yoy != null)
  const dayRows = latestRows(built).filter((row) => row.days != null)
  return {
    yoy: scaleBars(rows.map((row) => ({ name: `${row.name} ${row.period}`, value: row.yoy, color: colorOf(built, row.id) })), 'percent'),
    days: scaleBars(dayRows.map((row) => ({ name: `${row.name} ${row.period}`, value: row.days, color: colorOf(built, row.id) })), 'days')
  }
}

function scaleBars(items, format) {
  const max = Math.max(...items.map((item) => item.value), 0)
  return items.map((item) => ({
    ...item,
    format,
    width: max > 0 ? Math.max(2, (item.value / max) * 100) : 0,
    label: format === 'percent' ? formatPercent(item.value) : formatDays(item.value)
  }))
}

function colorOf(built, id) {
  return built.companySeries.find((series) => series.company.id === id)?.company.color || '#334155'
}

function troughReport(spec, quarters) {
  const points = (spec?.periods || [])
    .map((period) => {
      const quarter = quarters.find((item) => item.period === period)
      return { period, yoyMedian: quarter?.yoyMedian ?? null }
    })
    .filter((item) => item.yoyMedian != null)
  const gaps = []
  for (let index = 1; index < points.length; index += 1) {
    gaps.push(quarterNumber(points[index].period) - quarterNumber(points[index - 1].period))
  }
  const average = gaps.length ? gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length : null
  const last = points.at(-1)?.period
  return {
    points,
    gaps,
    averageQuarters: average,
    extrapolated: last && average != null ? addQuarters(last, Math.round(average)) : ''
  }
}

function sameIds(left, right) {
  const a = [...(left || [])].sort().join(',')
  const b = [...(right || [])].sort().join(',')
  return a === b && a !== ''
}

function quarterText(quarter) {
  return quarter?.period || '上一季'
}

export function formatDays(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  return `${formatNumber(value, 0)} 天`
}

export function formatChartValue(value, format) {
  if (format === 'percent') return formatPercent(value)
  if (format === 'days') return formatDays(value)
  return formatNumber(value, 1)
}
