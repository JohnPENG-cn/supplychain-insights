import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'
import { metiTargetMonth, sourcesForRun } from '../../scripts/mlcc/constants.mjs'
import { applyMetiMonths, applyRevenueMonth } from '../../scripts/mlcc/merge.mjs'
import { evaluateMlcc } from '../../scripts/mlcc/signals.mjs'
import { planIssueUpdates } from '../../scripts/mlcc/issues.mjs'
import { validateMlcc } from '../../scripts/validate-mlcc.mjs'

const root = resolve(import.meta.dirname, '../..')

function readData(name) {
  return JSON.parse(readFileSync(resolve(root, 'data/mlcc', name), 'utf8'))
}

function baseInput() {
  return {
    revenue: readData('tw-monthly-revenue.json'),
    meti: readData('meti-ceramic-capacitors.json'),
    bookToBill: readData('manual/book-to-bill.json'),
    leadTime: readData('manual/lead-time.json'),
    notices: readData('manual/notices.json'),
    turnWatch: readData('manual/turn-watch.json'),
    schedule: readData('schedule.json'),
    status: readData('fetch-status.json'),
    config: readData('signal-config.json')
  }
}

function run(overrides = {}, today = '2026-10-21') {
  return evaluateMlcc({ ...baseInput(), ...overrides, today })
}

function signal(result, id) {
  return result.signals.find((item) => item.id === id)
}

test('当前读数和报告里的灯一致', () => {
  const result = validateMlcc()
  const s1 = signal(result, 's1')
  assert.match(s1.latest, /国巨 \+46\.1%/)
  assert.match(s1.latest, /华新科 \+53\.9%/)
  assert.match(s1.latest, /禾伸堂 \+27\.1%/)
  assert.match(s1.latest, /\+11\.4%、\+22\.3%、\+10\.8%/)
  assert.match(s1.notes.join('\n'), /4 到 5 个百分/)
  assert.match(s1.notes.join('\n'), /28\.7%/)
  const s3 = signal(result, 's3')
  assert.match(s3.latest, /产量同比 \+19\.1%/)
  assert.match(s3.latest, /单位产值同比 -12\.4%/)
  assert.equal(s3.charts.length, 2)
  assert.equal(signal(result, 's4').charts.length, 0)
  assert.match(result.overall.highEnd, /锁产能/)
  assert.match(result.overall.commodity, /不囤货/)
  assert.equal(result.overall.kind, '判断')
  assert.equal(signal(result, 's6').triggers.map((item) => item.hit).join(','), 'false,false,false,true')
})

test('营收同比掉下来、而且连着两个月环比下降，才是绿灯', () => {
  const months = []
  for (let month = 1; month <= 12; month += 1) {
    months.push({ month: `2025-${String(month).padStart(2, '0')}`, 2327: 100, 2492: 100, 3026: 100 })
  }
  const latest = [90, 80, 70, 60]
  ;['2026-06', '2026-07', '2026-08', '2026-09'].forEach((month, index) => {
    months.push({ month, 2327: latest[index], 2492: latest[index], 3026: latest[index] })
  })
  const result = run({
    revenue: {
      source: { name: '测试', url: 'https://example.com/twse' },
      companies: baseInput().revenue.companies,
      months,
      latestFiling: null
    }
  })
  assert.equal(signal(result, 's1').light, 'green')
})

test('同比很高但近三个月合计不再上升时，不是红灯', () => {
  const months = []
  for (let month = 1; month <= 12; month += 1) {
    months.push({ month: `2025-${String(month).padStart(2, '0')}`, 2327: 100, 2492: 100, 3026: 100 })
  }
  const values = [180, 170, 160, 150, 140, 130]
  ;['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'].forEach((month, index) => {
    months.push({ month, 2327: values[index], 2492: values[index], 3026: values[index] })
  })
  const result = run({
    revenue: {
      source: { name: '测试', url: 'https://example.com/twse' },
      companies: baseInput().revenue.companies,
      months,
      latestFiling: null
    }
  })
  assert.equal(signal(result, 's1').light, 'yellow')
})

test('订单出货比按阈值分三档，下降超过 0.15 会单独记给拐点', () => {
  const file = structuredClone(baseInput().bookToBill)
  file.readings = [
    { maker: 'Murata', scope: 'MLCC', bookToBill: 1.05, history: [1.25, 1.05], countsTowardSignal: true, sourceUrl: 'https://example.com/a', sourceName: '村田', periodEnd: '2026-09-30' },
    { maker: 'Taiyo Yuden', scope: '电容', bookToBill: 1.02, history: [1.1, 1.02], countsTowardSignal: true, sourceUrl: 'https://example.com/b', sourceName: '太阳诱电', periodEnd: '2026-09-30' }
  ]
  const yellow = run({ bookToBill: file })
  assert.equal(signal(yellow, 's2').light, 'yellow')
  assert.equal(signal(yellow, 's6').triggers.find((item) => item.id === 'bb-drop').hit, true)

  file.readings[0].bookToBill = 1.4
  file.readings[0].history = [1.4]
  file.readings[1].bookToBill = 0.9
  file.readings[1].history = [0.9]
  assert.equal(signal(run({ bookToBill: file }), 's2').light, 'red')

  file.readings[0].bookToBill = 0.8
  file.readings[1].bookToBill = 0.9
  assert.equal(signal(run({ bookToBill: file }), 's2').light, 'green')
})

test('单位产值贴近 -10% 时按黄灯，明显低于 -13% 才是绿灯', () => {
  const meti = {
    source: { name: '测试', url: 'https://example.com/meti', attribution: 'テスト' },
    months: [
      { month: '2025-06', quantity: 100, value: 100 },
      { month: '2025-07', quantity: 100, value: 100 },
      { month: '2025-08', quantity: 100, value: 100 },
      { month: '2026-06', quantity: 100, value: 88 },
      { month: '2026-07', quantity: 100, value: 88 },
      { month: '2026-08', quantity: 100, value: 88 }
    ]
  }
  const boundary = signal(run({ meti }), 's3')
  assert.equal(boundary.volumeLight, 'yellow')
  assert.equal(boundary.priceLight, 'yellow')

  for (const row of meti.months.slice(3)) row.value = 80
  assert.equal(signal(run({ meti }), 's3').priceLight, 'green')

  for (const row of meti.months.slice(3)) {
    row.quantity = 130
    row.value = 140
  }
  const hot = signal(run({ meti }), 's3')
  assert.equal(hot.volumeLight, 'red')
  assert.equal(hot.priceLight, 'red')
})

test('涨价灯不把传闻单独算成红灯，停产仍有效则是红灯', () => {
  const notices = structuredClone(baseInput().notices)
  notices.events = [
    {
      id: 'rumour',
      date: '2026-10-01',
      makers: ['Yageo'],
      makerLabels: { Yageo: '国巨' },
      kind: 'price_hike',
      credibility: 'broker_rumour',
      summary: '传闻',
      links: [{ name: '来源', url: 'https://example.com/rumour' }]
    }
  ]
  assert.equal(signal(run({ notices }), 's5').light, 'yellow')

  notices.events.push({
    id: 'eol',
    date: null,
    makers: ['Murata'],
    makerLabels: { Murata: '村田' },
    kind: 'eol',
    broad: true,
    inForce: true,
    credibility: 'maker_notice',
    lastOrder: '2028-03-31',
    summary: '停产',
    links: [{ name: 'PTN', url: 'https://example.com/ptn' }]
  })
  const red = signal(run({ notices }), 's5')
  assert.equal(red.light, 'red')
  assert.match(red.latest, /最后下单 2028-03-31/)
})

test('抓取失败时保留原数字，并标数据过期', () => {
  const status = structuredClone(baseInput().status)
  status.twse = { ...status.twse, ok: false, error: 'HTTP 503', fetchedAt: '2026-10-21' }
  const result = run({ status })
  assert.equal(signal(result, 's1').stale, true)
  assert.match(signal(result, 's1').latest, /国巨 \+46\.1%/)
  assert.equal(signal(result, 's3').stale, false)
})

test('补月份不会冲掉更新的申报，失败路径则完全不调用合并', () => {
  const revenue = baseInput().revenue
  const before = revenue.months.length
  const merged = applyRevenueMonth(
    revenue,
    {
      month: '2026-08',
      publishedAt: '2026-09-10',
      rows: { 2327: { revenue: 1, reportedYoYPercent: 1, reportedMomPercent: 1, reportedYearAgo: 1, remark: '' } }
    },
    'https://example.com/mops'
  )
  assert.equal(merged.months.length, before)
  assert.equal(merged.months.find((row) => row.month === '2026-08')['2327'], 1)
  assert.equal(merged.latestFiling.month, '2026-09')
  assert.equal(revenue.months.find((row) => row.month === '2026-08')['2327'], 16332196)

  const meti = applyMetiMonths(baseInput().meti, [{ month: '2026-09', quantity: 5, value: 6 }])
  assert.equal(meti.months.at(-1).month, '2026-09')
  assert.equal(baseInput().meti.months.at(-1).month, '2026-08')
})

test('定时任务按日期只抓一个来源，缺月时先补最近的洞', () => {
  assert.deepEqual(sourcesForRun({ event: 'schedule', schedule: '20 1 11 * *', input: '' }), ['twse'])
  assert.deepEqual(sourcesForRun({ event: 'schedule', schedule: '20 1 20 * *', input: '' }), ['meti'])
  assert.deepEqual(sourcesForRun({ event: 'workflow_dispatch', schedule: '', input: 'all' }), ['twse', 'meti'])
  assert.equal(metiTargetMonth('2026-08', '2026-10-21'), '2026-08')
  assert.equal(metiTargetMonth('2026-06', '2026-10-21'), '2026-07')
  assert.equal(metiTargetMonth('2026-08', '2026-11-20'), '2026-09')
})

test('抓取失败开或更新问题单，恢复后关闭，没跑的来源不动', () => {
  const status = {
    lastRun: { sources: ['twse'] },
    twse: { ok: false, error: 'HTTP 403', lastAttemptAt: '2026-11-11', fetchedAt: '2026-10-21', dataThrough: '2026-09' },
    meti: { ok: true }
  }
  const created = planIssueUpdates({ status, openIssues: [], pageUrl: 'https://example.com/mlcc' })
  assert.equal(created.length, 1)
  assert.equal(created[0].type, 'create')
  assert.match(created[0].body, /数据过期/)

  const updated = planIssueUpdates({
    status,
    openIssues: [{ number: 7, title: created[0].title }],
    pageUrl: 'https://example.com/mlcc'
  })
  assert.equal(updated[0].type, 'comment')
  assert.equal(updated[0].number, 7)

  status.twse.ok = true
  const closed = planIssueUpdates({
    status,
    openIssues: [{ number: 7, title: 'MLCC 数据抓取失败：台湾月营收' }],
    pageUrl: 'https://example.com/mlcc'
  })
  assert.equal(closed[0].type, 'close')
  assert.equal(planIssueUpdates({ status, openIssues: [], pageUrl: 'https://example.com' }).length, 0)
})
