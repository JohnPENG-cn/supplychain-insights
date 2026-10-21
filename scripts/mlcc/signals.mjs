import { addMonths, daysBetween, formatNumber, formatPercent } from './dates.mjs'

const LIGHT_LABEL = { red: '红', yellow: '黄', green: '绿' }

export function evaluateMlcc(input) {
  const today = input.today
  const config = input.config
  const revenueStats = revenueStatsOf(input.revenue)
  const signals = [
    evaluateS1(input, revenueStats, today),
    evaluateS2(input, today),
    evaluateS3(input, today),
    evaluateS4(input, today),
    evaluateS5(input, today),
    evaluateS6(input, revenueStats, today)
  ]
  return {
    today,
    overall: overallOf(signals, config),
    signals,
    schedule: (input.schedule?.items || []).map((item) => ({
      ...item,
      past: Boolean(item.date && item.date < today)
    }))
  }
}

export function lightLabel(light) {
  return LIGHT_LABEL[light] || '缺数据'
}

function evaluateS1(input, stats, today) {
  const config = input.config.s1
  const hot = stats.filter(
    (item) => item.yoy != null && item.yoy > config.red.yoyAbove && item.trailing3 != null && item.trailing3 > config.red.trailing3Above
  )
  const easing = stats.filter(
    (item) => item.yoy != null && item.yoy < config.green.yoyBelow && item.momDeclines >= config.green.consecutiveMomDeclines
  )
  let light = 'yellow'
  if (easing.length >= config.green.minCompanies) light = 'green'
  else if (hot.length >= config.red.minCompanies) light = 'red'
  const latest = stats
    .map((item) => `${item.name} ${formatPercent(item.yoy)}`)
    .join('，')
  const trailing = stats.map((item) => formatPercent(item.trailing3)).join('、')
  const notes = []
  for (const item of stats) {
    if (item.caveat) notes.push(`${item.name}：${item.caveat}`)
    if (
      item.reportedYoY != null &&
      item.seriesYoY != null &&
      Math.abs(item.reportedYoY - item.seriesYoY) >= 0.005
    ) {
      notes.push(
        `${item.name}本月申报同比是 ${formatPercent(item.reportedYoY)}，按保存的去年同期营收计算是 ${formatPercent(item.seriesYoY)}。差在去年同期后来被修正过。`
      )
    }
    if (item.remark) notes.push(`${item.name}当月说明：${item.remark}`)
  }
  const through = input.revenue.months.at(-1)?.month || ''
  return {
    id: 's1',
    name: 'S1 台系月营收动能',
    judgment: false,
    light,
    lights: [{ light, label: lightLabel(light) }],
    stale: isStale(input.status?.twse, today),
    asOf: through,
    latest: `${latest}。近三个月合计比前三个月：${trailing}。`,
    action: config.actions[light],
    gloss: config.gloss,
    notes,
    sources: [input.revenue.source].filter(Boolean).map((source) => ({
      name: source.name,
      url: source.url
    })),
    charts: [
      {
        title: '月营收同比',
        format: 'percent',
        series: stats.map((item, index) => ({
          name: item.name,
          color: config.colors[index],
          points: item.chart.slice(-18).map((point) => ({ date: point.date, value: point.value }))
        }))
      }
    ],
    triggers: null
  }
}

function evaluateS2(input, today) {
  const config = input.config.s2
  const readings = input.bookToBill.readings || []
  const tracked = config.tracked.map((spec) => {
    const row = readings.find(
      (item) => item.maker === spec.maker && item.scope === spec.scope && item.countsTowardSignal !== false
    )
    return {
      spec,
      row,
      value: row && Number.isFinite(row.bookToBill) ? row.bookToBill : null,
      drop: dropOf(row?.history)
    }
  })
  const values = tracked.map((item) => item.value)
  const complete = values.every((value) => value != null)
  let light = 'yellow'
  if (!complete) light = 'yellow'
  else if (values.every((value) => value > config.red.bothAbove) || values.some((value) => value > config.red.anyAbove)) {
    light = 'red'
  } else if (values.every((value) => value < config.green.bothBelow)) light = 'green'
  const parts = tracked.map((item) => {
    const utilization =
      item.row && Number.isFinite(item.row.utilization)
        ? `，稼动率约 ${formatPercent(item.row.utilization, 0).replace('+', '')}`
        : ''
    return `${item.spec.label} ${item.value == null ? '缺录' : item.value.toFixed(2)}${utilization}`
  })
  const context = readings
    .filter((item) => item.countsTowardSignal === false && Number.isFinite(item.bookToBill))
    .map((item) => `${item.label || item.maker} ${item.scope} ${item.bookToBill.toFixed(2)}（${item.note || '不参与灯'}）`)
  const asOf = tracked
    .map((item) => item.row?.periodEnd)
    .filter(Boolean)
    .sort()
    .at(-1)
  return {
    id: 's2',
    name: 'S2 日系订单出货比',
    judgment: false,
    light,
    lights: [{ light, label: lightLabel(light) }],
    stale: isStale(null, today, input.bookToBill.staleAfter) || !complete,
    asOf: asOf || input.bookToBill.updatedAt,
    latest: `${parts.join('；')}。${context.length ? `对照：${context.join('；')}。` : ''}`,
    action: config.actions[light],
    gloss: config.gloss,
    notes: config.notes || [],
    sources: readings
      .filter((item) => item.sourceUrl)
      .map((item) => ({ name: item.sourceName || `${item.maker} ${item.scope}`, url: item.sourceUrl })),
    charts: [],
    triggers: null,
    drops: tracked.map((item) => ({ maker: item.spec.maker, scope: item.spec.scope, drop: item.drop }))
  }
}

function evaluateS3(input, today) {
  const config = input.config.s3
  const months = input.meti.months || []
  const recent = months.slice(-3)
  const yearAgo = recent.map((item) => months.find((row) => row.month === addMonths(item.month, -12))).filter(Boolean)
  const ready = recent.length === 3 && yearAgo.length === 3
  let volumeLight = 'unknown'
  let priceLight = 'unknown'
  let volumeYoY = null
  let priceYoY = null
  let valueYoY = null
  if (ready) {
    volumeYoY = sum(recent, 'quantity') / sum(yearAgo, 'quantity') - 1
    valueYoY = sum(recent, 'value') / sum(yearAgo, 'value') - 1
    priceYoY = unitValue(recent) / unitValue(yearAgo) - 1
    volumeLight = band(volumeYoY, config.volume)
    priceLight = unitBand(priceYoY, config.unitValue)
  }
  const latestMonth = months.at(-1)
  const latest = ready
    ? `近三个月产量同比 ${formatPercent(volumeYoY)}，产值同比 ${formatPercent(valueYoY)}，单位产值同比 ${formatPercent(priceYoY)}。`
    : '还不够 12 个月，算不出同比。'
  const charts = [
    {
      title: '日本陶瓷电容产量',
      format: 'quantity',
      series: [
        {
          name: '产量（亿个）',
          color: config.colors[0],
          points: months.map((item) => ({ date: item.month, value: item.quantity / 1e5 }))
        }
      ]
    },
    {
      title: '单位产值',
      format: 'unit',
      series: [
        {
          name: '日元/千个',
          color: config.colors[1],
          points: months.map((item) => ({
            date: item.month,
            value: (item.value * 1e6) / item.quantity
          }))
        }
      ]
    }
  ]
  return {
    id: 's3',
    name: 'S3 日本陶瓷电容产量和单位产值',
    judgment: false,
    light: worse(volumeLight, priceLight),
    lights: [
      { name: '产量', light: volumeLight, label: lightLabel(volumeLight) },
      { name: '单位产值', light: priceLight, label: lightLabel(priceLight) }
    ],
    volumeLight,
    priceLight,
    stale: isStale(input.status?.meti, today),
    asOf: latestMonth?.month || '',
    latest,
    action: s3Action(config, volumeLight, priceLight),
    gloss: config.gloss,
    notes: config.notes || [],
    sources: [{ name: input.meti.source.name, url: input.meti.source.url }],
    charts,
    triggers: null
  }
}

function evaluateS4(input, today) {
  const file = input.leadTime
  const light = file.light
  const direction = input.config.s4.directions[file.direction] || ''
  return {
    id: 's4',
    name: 'S4 交期',
    judgment: false,
    light,
    lights: [{ light, label: lightLabel(light) }],
    stale: isStale(null, today, file.staleAfter),
    asOf: file.asOf,
    latest: `${file.summary}${direction ? `方向：${direction}。` : ''}`,
    action: input.config.s4.actions[light],
    gloss: input.config.s4.gloss,
    notes: input.config.s4.notes || [],
    sources: file.sources || [],
    charts: [],
    triggers: null
  }
}

function evaluateS5(input, today) {
  const config = input.config.s5
  const events = input.notices.events || []
  const head = new Set(config.headMakers)
  const counted = []
  for (const event of events) {
    if (!countsAsNotice(event) || !inWindow(event, today, config.windowDays)) continue
    for (const maker of event.makers || []) {
      if (head.has(maker)) counted.push({ maker, event })
    }
  }
  const makers = [...new Set(counted.map((item) => item.maker))]
  const eol = events.filter((event) => eolInForce(event, today))
  const rumours = events.filter(
    (event) =>
      event.credibility === 'broker_rumour' &&
      (event.kind === 'price_hike' || event.kind === 'eol') &&
      inWindow(event, today, config.windowDays)
  )
  let light = 'green'
  if (makers.length >= config.red.minMakers || eol.length > 0) light = 'red'
  else if (makers.length === 1 || rumours.length > 0) light = 'yellow'
  const makerText = makers.map((maker) => makerName(maker, events)).join('、') || '没有'
  const eolText = eol.length
    ? `仍有效的停产：${eol.map((event) => `${makerName(event.makers[0], events)}，最后下单 ${event.lastOrder}`).join('；')}。`
    : ''
  const visible = events.filter(
    (event) => inWindow(event, today, config.windowDays) || eolInForce(event, today) || event.credibility === 'broker_rumour'
  )
  const older = events.filter((event) => !visible.includes(event))
  return {
    id: 's5',
    name: 'S5 涨价和停产',
    judgment: false,
    light,
    lights: [{ light, label: lightLabel(light) }],
    stale: isStale(null, today, input.notices.staleAfter),
    asOf: today,
    latest: `近 ${config.windowDays} 天计入灯的头部厂：${makerText}。${eolText}`,
    action: config.actions[light],
    gloss: config.gloss,
    notes: config.notes || [],
    sources: events.flatMap((event) => event.links || []),
    charts: [],
    triggers: null,
    events: visible.map((event) => presentEvent(event)),
    olderEvents: older.map((event) => presentEvent(event))
  }
}

function evaluateS6(input, stats, today) {
  const config = input.config.s6
  const s2 = evaluateS2(input, today)
  const dropHit = (s2.drops || []).some((item) => item.drop != null && item.drop > config.dropMoreThan)
  const channel = stats.find((item) => item.code === config.channelCode)
  const peers = config.stillRisingCodes.map((code) => stats.find((item) => item.code === code))
  const channelHit =
    channel?.trailing3 != null &&
    channel.trailing3 < 0 &&
    peers.every((item) => item?.trailing3 != null && item.trailing3 > 0)
  const lytica = input.turnWatch.lytica?.hit === true
  const inventory = input.turnWatch.inventoryRemark?.hit === true
  const triggers = [
    {
      id: 'bb-drop',
      text: config.triggerText.bbDrop,
      hit: dropHit,
      partial: false
    },
    {
      id: 'channel',
      text: config.triggerText.channel,
      hit: channelHit,
      partial: false
    },
    {
      id: 'lytica',
      text: config.triggerText.lytica,
      hit: lytica,
      partial: false
    },
    {
      id: 'inventory',
      text: config.triggerText.inventory,
      hit: inventory,
      partial: inventory && input.turnWatch.inventoryRemark?.partial === true
    }
  ].map((item) => ({
    ...item,
    label: item.hit ? (item.partial ? '部分命中' : '命中') : '未命中'
  }))
  const hits = triggers.filter((item) => item.hit).length
  const light = hits >= config.red.minHits ? 'red' : hits >= config.yellow.minHits ? 'yellow' : 'green'
  return {
    id: 's6',
    name: 'S6 拐点哨兵',
    judgment: true,
    light,
    lights: [{ light, label: lightLabel(light) }],
    stale: isStale(null, today, input.turnWatch.staleAfter),
    asOf: input.turnWatch.updatedAt,
    latest: `四条里命中 ${hits} 条。`,
    action: config.actions[light],
    gloss: config.gloss,
    notes: [input.turnWatch.inventoryRemark?.note, input.turnWatch.lytica?.note].filter(Boolean),
    sources: [
      ...(input.turnWatch.inventoryRemark?.sources || []),
      input.turnWatch.lytica?.sourceUrl
        ? { name: 'Lytica', url: input.turnWatch.lytica.sourceUrl }
        : null
    ].filter(Boolean),
    charts: [],
    triggers
  }
}

function overallOf(signals, config) {
  const byId = Object.fromEntries(signals.map((item) => [item.id, item]))
  const tight =
    ['s1', 's2', 's4', 's5'].some((id) => byId[id].light === 'red') || byId.s3.volumeLight === 'red'
  const watch = byId.s6.light
  const price =
    byId.s3.priceLight === 'red'
      ? config.overall.priceRed
      : byId.s3.priceLight === 'green'
        ? config.overall.priceGreen
        : config.overall.priceYellow
  return {
    kind: '判断',
    highEndTitle: '高容、车规、AI 服务器',
    highEnd: tight ? config.overall.highEndTight : config.overall.highEndLoose,
    commodityTitle: '消费级通用料',
    commodity: config.overall.commodity[watch] || config.overall.commodity.yellow,
    priceNote: price
  }
}

function revenueStatsOf(revenue) {
  const months = revenue.months
  const latest = months.at(-1)
  const filing = revenue.latestFiling?.month === latest?.month ? revenue.latestFiling : null
  return revenue.companies.map((company) => {
    const series = months.map((row) => ({ month: row.month, revenue: row[company.code] }))
    const seriesYoY = yoyAt(series, latest.month)
    const reported = filing?.rows?.[company.code]
    const reportedYoY =
      reported && Number.isFinite(reported.reportedYoYPercent) ? reported.reportedYoYPercent / 100 : null
    return {
      code: company.code,
      name: company.name,
      caveat: company.caveat || '',
      remark: reported?.remark || '',
      seriesYoY,
      reportedYoY,
      yoy: reportedYoY ?? seriesYoY,
      trailing3: change(sumRange(series, 0, 3), sumRange(series, 3, 3)),
      momDeclines: consecutiveDeclines(series),
      chart: yoySeries(series)
    }
  })
}

function yoyAt(series, month) {
  const current = series.find((item) => item.month === month)?.revenue
  const base = series.find((item) => item.month === addMonths(month, -12))?.revenue
  if (!Number.isFinite(current) || !Number.isFinite(base) || base === 0) return null
  return current / base - 1
}

function yoySeries(series) {
  return series
    .map((item) => ({ date: item.month, value: yoyAt(series, item.month) }))
    .filter((item) => item.value != null)
}

function sumRange(series, skipFromEnd, count) {
  const slice = series.slice(series.length - skipFromEnd - count, series.length - skipFromEnd)
  if (slice.length < count || slice.some((item) => !Number.isFinite(item.revenue))) return null
  return slice.reduce((total, item) => total + item.revenue, 0)
}

function change(current, previous) {
  if (current == null || previous == null || previous === 0) return null
  return current / previous - 1
}

function consecutiveDeclines(series) {
  const values = series.map((item) => item.revenue)
  let count = 0
  for (let index = values.length - 1; index > 0; index -= 1) {
    if (!(values[index] < values[index - 1])) break
    count += 1
  }
  return count
}

function dropOf(history) {
  if (!Array.isArray(history) || history.length < 2) return null
  const current = history[history.length - 1]
  const previous = history[history.length - 2]
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null
  return previous - current
}

function sum(rows, key) {
  return rows.reduce((total, row) => total + row[key], 0)
}

function unitValue(rows) {
  return (sum(rows, 'value') * 1e6) / sum(rows, 'quantity')
}

function band(value, rule) {
  if (value > rule.redAbove) return 'red'
  if (value < rule.greenBelow) return 'green'
  return 'yellow'
}

function unitBand(value, rule) {
  if (value > rule.redAbove) return 'red'
  if (value < rule.greenBelow - rule.boundaryBand) return 'green'
  return 'yellow'
}

function s3Action(config, volumeLight, priceLight) {
  if (volumeLight === 'unknown' || priceLight === 'unknown') return config.actions.unknown
  return `${config.actions.volume[volumeLight]}${config.actions.price[priceLight]}`
}

function worse(left, right) {
  const rank = { red: 3, yellow: 2, unknown: 1, green: 0 }
  return (rank[left] || 0) >= (rank[right] || 0) ? left : right
}

function countsAsNotice(event) {
  if (!['price_hike', 'allocation', 'eol'].includes(event.kind)) return false
  return event.credibility === 'maker_notice' || event.credibility === 'media'
}

function inWindow(event, today, windowDays) {
  if (!event.date) return false
  const age = daysBetween(event.date, today)
  return age >= 0 && age <= windowDays
}

function eolInForce(event, today) {
  if (event.kind !== 'eol' || event.broad !== true || event.credibility === 'broker_rumour') return false
  if (event.inForce === false) return false
  if (event.lastOrder && event.lastOrder < today) return false
  return event.inForce === true
}

function makerName(maker, events) {
  const named = events.find((event) => (event.makers || []).includes(maker) && event.makerLabels?.[maker])
  return named?.makerLabels?.[maker] || maker
}

function presentEvent(event) {
  return {
    date: event.date,
    summary: event.summary,
    credibility: event.credibility,
    credibilityLabel: credibilityLabel(event.credibility),
    links: event.links || []
  }
}

function credibilityLabel(value) {
  if (value === 'maker_notice') return '原厂通知'
  if (value === 'media') return '媒体转述'
  if (value === 'broker_rumour') return '券商传闻'
  return value
}

function isStale(status, today, staleAfter) {
  if (status && status.ok === false) return true
  const deadline = staleAfter || status?.staleAfter
  return Boolean(deadline && today > deadline)
}

export function formatChartValue(value, format) {
  if (format === 'percent') return formatPercent(value)
  if (format === 'quantity') return `${formatNumber(value, 0)} 亿个`
  if (format === 'unit') return `${formatNumber(value, 0)} 日元/千个`
  return formatNumber(value, 1)
}
