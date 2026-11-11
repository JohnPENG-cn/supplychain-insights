import assert from 'node:assert/strict'
import test from 'node:test'
import { addQuarters, evaluateIc } from '../../scripts/ic/signals.mjs'
import { validateIc } from '../../scripts/validate-ic.mjs'

const companies = [
  { id: 'a', csvName: 'A', name: '甲', color: '#111', fiscal: '自然季' },
  { id: 'b', csvName: 'B', name: '乙', color: '#222', fiscal: '自然季' }
]

function row(company, period, revenue, cogs, inventory) {
  return {
    company,
    period,
    periodEnd: '',
    revenue,
    cogs,
    inventory,
    revenueUrl: 'https://example.com/a',
    cogsUrl: 'https://example.com/a',
    inventoryUrl: 'https://example.com/a',
    yoyBreak: false
  }
}

function fileWith(rows) {
  return {
    extractedFrom: 'fixture',
    extractedAt: '2026-11-11',
    cluster: 'fixture',
    unit: 'USD m',
    daysFactor: 91,
    companies,
    rows
  }
}

const config = {
  chartFrom: '2024Q1',
  troughs: { periods: ['2024Q1'] },
  disclaimer: '不预测',
  yoyDecline: {
    gloss: '规则',
    actions: { red: '收', yellow: '看', green: '按季' }
  },
  inventoryWhileSlowing: {
    gloss: '规则',
    actions: { red: '收', yellow: '看', green: '不加' }
  },
  management: {
    gloss: '规则',
    actions: { red: '停', yellow: '缺', green: '没有', unknown: '空' }
  }
}

test('当前数据和三盏黄灯', () => {
  const result = validateIc()
  assert.equal(result.position.period, '2026Q3')
  assert.equal(Math.round(result.position.yoyMedian * 100), 28)
  assert.equal(Math.round(result.position.daysMedian), 184)
  assert.equal(Math.round(result.position.historyMedian), 114)
  assert.equal(result.position.recordPeriod, '2025Q1')
  assert.equal(Math.round(result.position.recordDays), 205)
  assert.equal(result.troughs.extrapolated, '2027Q4')
  assert.deepEqual(
    result.lights.map((item) => item.light),
    ['yellow', 'yellow', 'yellow']
  )
  assert.equal(result.latest.find((row) => row.id === 'mchp').period, '2026Q3')
  assert.match(result.disclaimer, /不预测/)
})

test('同比连降两季才是红灯', () => {
  const rows = []
  for (const company of ['a', 'b']) {
    rows.push(
      row(company, '2024Q1', 100, 40, 80),
      row(company, '2024Q2', 100, 40, 80),
      row(company, '2024Q3', 100, 40, 80),
      row(company, '2024Q4', 100, 40, 80),
      row(company, '2025Q1', 130, 40, 80),
      row(company, '2025Q2', 120, 40, 90),
      row(company, '2025Q3', 110, 40, 100)
    )
  }
  const result = evaluateIc({
    today: '2026-11-11',
    quarters: fileWith(rows),
    management: { entries: [], note: '' },
    config
  })
  assert.equal(result.lights.find((item) => item.id === 'yoy-decline').light, 'red')
  assert.equal(result.lights.find((item) => item.id === 'inventory-while-slowing').light, 'red')
  assert.equal(result.lights.find((item) => item.id === 'management').light, 'unknown')
})

test('管理层说渠道库存还在升才点红，空文件不是绿灯', () => {
  const rows = [
    row('a', '2025Q1', 100, 50, 50),
    row('a', '2025Q2', 100, 50, 50),
    row('a', '2025Q3', 100, 50, 50),
    row('a', '2025Q4', 100, 50, 50),
    row('a', '2026Q1', 110, 50, 40)
  ]
  const base = {
    today: '2026-11-11',
    quarters: fileWith(rows),
    config
  }
  const empty = evaluateIc({ ...base, management: { entries: [] } })
  assert.equal(empty.lights.find((item) => item.id === 'management').light, 'unknown')
  const hit = evaluateIc({
    ...base,
    management: {
      entries: [
        {
          company: 'a',
          period: '2026Q1',
          date: '2026-04-01',
          hit: true,
          summary: '渠道库存还在升',
          sourceName: '业绩稿',
          sourceUrl: 'https://example.com/call'
        }
      ]
    }
  })
  assert.equal(hit.lights.find((item) => item.id === 'management').light, 'red')
})

test('平均间隔从 2024Q1 加 15 个季度落到 2027Q4', () => {
  assert.equal(addQuarters('2024Q1', 15), '2027Q4')
  assert.equal(addQuarters('2009Q1', 11), '2011Q4')
})
