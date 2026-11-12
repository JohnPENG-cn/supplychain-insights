import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { parseCsv } from '../../scripts/ic/load.mjs'
import * as passive from '../../scripts/cycle/passive-position.mjs'
import { buildShippingPosition, shippingCsvPath } from '../../scripts/cycle/shipping-position.mjs'

const root = new URL('../../', import.meta.url)

function read(relativePath) {
  return readFileSync(new URL(relativePath, root), 'utf8')
}

function rows(relativePath) {
  return parseCsv(read(relativePath))
}

const buildPassive = passive['build' + 'PassivePosition']

test('被动元件周期位置由公开 CSV 算出，并和页面用的 JSON 一致', () => {
  const breaks = JSON.parse(read('data/passive/breaks.json'))
  const built = buildPassive(rows(passive.passiveCsvPath), breaks)
  const saved = JSON.parse(read('data/mlcc/cycle-position.json'))
  assert.deepEqual(built, saved)
  assert.equal(built.median.latest.period, '2026Q3')
  assert.equal(built.median.latest.n, 5)
  assert.ok(Math.abs(built.median.latest.value - 35.99) < 0.01)
  assert.equal(built.median.latest.percentile, 95.6)
  assert.deepEqual(
    built.median.troughs.map((point) => point.period),
    ['2005Q1', '2009Q1', '2011Q4', '2016Q1', '2019Q3', '2023Q1']
  )
  assert.deepEqual(built.median.gaps, [16, 11, 17, 14, 14])
  assert.equal(built.median.averageGapQuarters, 14.4)
  assert.equal(built.median.upturn.quarters, 14)
  assert.equal(built.median.upturn.confirmedPeak, false)
  assert.deepEqual(built.median.upturn.pastQuarters, [4, 4, 6, 9, 7])
  assert.equal(built.bookToBill.latest.previous, 1.47)
  assert.equal(built.bookToBill.latest.value, 1.39)
  assert.equal(built.bookToBill.lead.lag, 2)
  assert.equal(built.bookToBill.lead.r, 0.63)
  assert.equal(built.utilization, '缺失')
  assert.match(built.disclaimer, /不预测/)
  const yageo = built.median.companies.find((company) => company.name === '国巨')
  assert.equal(yageo.inMedian, false)
  assert.equal(yageo.provisional, true)
  const walsin = built.median.companies.find((company) => company.name === '华新科')
  assert.equal(walsin.inMedian, true)
  assert.equal(walsin.provisional, true)
  assert.equal(built.lights.find((light) => light.id === 'utilization').light, 'unknown')
  assert.equal(built.median.companies.some((company) => company.name.includes('禾伸堂')), false)
})

test('航运三组分开算，页面 JSON 跟 CSV 一致', () => {
  const breaks = JSON.parse(read('data/shipping/breaks.json'))
  const built = buildShippingPosition(rows(shippingCsvPath), breaks)
  const saved = JSON.parse(read('data/shipping/position.json'))
  assert.deepEqual(built, saved)
  assert.equal(built.segments.map((segment) => segment.id).join(','), 'container,drybulk,tanker')
  assert.match(built.disclaimer, /不预测/)
  assert.equal(Object.hasOwn(built, 'blendedMedian'), false)

  const container = built.segments[0]
  assert.equal(container.safe.period, '2026Q2')
  assert.equal(container.safe.value, 18.2)
  assert.equal(container.safe.n, 4)
  assert.equal(container.latest.period, '2026Q3')
  assert.equal(container.latest.value, 40.9)
  assert.equal(container.latest.n, 2)
  assert.equal(container.points.some((point) => point.period.startsWith('2013')), false)
  assert.deepEqual(
    container.troughs.map((point) => point.period),
    ['2009Q1', '2011Q3', '2016Q1', '2020Q2', '2023Q2', '2025Q3']
  )
  assert.equal(container.averageGapYears, 3.3)
  assert.equal(container.overlay.inMedian, false)
  assert.equal(container.overlay.correlation.r, 0.93)
  assert.equal(container.overlay.correlation.n, 52)
  assert.equal(container.companies.some((company) => company.name.includes('马士基')), false)

  const dry = built.segments[1]
  assert.equal(dry.safe.value, 38.7)
  assert.equal(dry.safe.n, 4)
  assert.equal(dry.averageGapYears, 3.06)
  assert.deepEqual(
    dry.troughs.map((point) => point.period),
    ['2012Q4', '2016Q1', '2020Q3', '2023Q3', '2025Q1']
  )
  assert.equal(dry.companies.some((company) => company.name.includes('太平洋')), false)
  assert.equal(dry.companies.some((company) => company.name.includes('招商')), false)
  assert.equal(dry.halfYearOverlay.inMedian, false)
  assert.equal(dry.halfYearOverlay.correlation.r, 0.57)
  assert.equal(dry.halfYearOverlay.correlation.n, 20)
  assert.equal(dry.halfYearOverlay.latest.value, 38.3)
  assert.equal(dry.halfYearOverlay.latest.group, 28.8)
  assert.equal(built.segments[0].halfYearOverlay, null)

  const tanker = built.segments[2]
  assert.equal(tanker.safe.period, '2026Q2')
  assert.equal(tanker.safe.value, 96.5)
  assert.equal(tanker.safe.n, 5)
  assert.equal(tanker.safe.percentile, 88.4)
  assert.equal(tanker.safe.percentileCount, 38)
  assert.equal(tanker.safe.percentileN, 43)
  assert.equal(tanker.latest.n, 3)
  assert.equal(tanker.latest.value, 146)
  assert.equal(tanker.averageGapYears, 3.75)
  assert.deepEqual(tanker.gaps, [15])
  assert.deepEqual(
    tanker.troughs.map((point) => point.period),
    ['2021Q2', '2025Q1']
  )
  assert.equal(tanker.lights[0].light, 'yellow')
  assert.equal(tanker.lights[0].label, '偏高')
  assert.equal(tanker.companies.some((company) => company.name.includes('中远海能')), false)
  assert.equal(tanker.companies.some((company) => company.name.includes('招商')), false)
  assert.equal(tanker.halfYearOverlay.inMedian, false)
  assert.equal(tanker.halfYearOverlay.correlation.r, 0.94)
  assert.equal(tanker.halfYearOverlay.correlation.n, 21)
  assert.equal(tanker.halfYearOverlay.latest.value, 115.7)
  assert.equal(tanker.halfYearOverlay.latest.group, 76.9)
  const frontline = tanker.companies.find((company) => company.name === 'Frontline')
  assert.equal(frontline.value, 96.5)
  const scorpio = tanker.companies.find((company) => company.name.includes('Scorpio'))
  assert.equal(scorpio.newestValue, 10.4)

  assert.equal(built.orderbook.global.find((point) => point.label === '2009年').value, 52)
  assert.equal(built.orderbook.global.find((point) => point.label === '2025年初').value, 15)
  assert.equal(built.orderbook.bySegment.find((point) => point.id === 'container').value, 24.6)
  assert.equal(built.orderbook.bySegment.find((point) => point.id === 'drybulk').value, 10)
  assert.equal(built.orderbook.bySegment.find((point) => point.id === 'tanker').value, 7.5)
  assert.equal(built.orderbook.fleet.find((point) => point.id === 'container').value, 9.7)
  assert.equal(built.orderbook.fleet.find((point) => point.id === 'tanker').value, 0.7)
})

test('两份周期 CSV 每一行都有来源，且没有存储价格', () => {
  for (const relativePath of [passive.passiveCsvPath, shippingCsvPath]) {
    const text = read(relativePath)
    assert.doesNotMatch(text, /DRAM|NAND|Micron|美光|DRAMeXchange/)
    const table = rows(relativePath)
    assert.ok(table.length > 1000)
    assert.ok(table.every((row) => String(row.source_url).startsWith('http')))
  }
})
