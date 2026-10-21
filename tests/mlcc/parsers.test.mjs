import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { parseMetiCeramic } from '../../scripts/mlcc/parse-meti.mjs'
import { parseMopsRevenue } from '../../scripts/mlcc/parse-mops.mjs'
import { parseTwseRevenue } from '../../scripts/mlcc/parse-twse.mjs'

const fixture = new URL('../fixtures/mlcc/', import.meta.url)

test('台湾证交所月营收只留下三家，并换算民国年月', () => {
  const payload = JSON.parse(readFileSync(new URL('twse-sample.json', fixture), 'utf8'))
  const parsed = parseTwseRevenue(payload)
  assert.equal(parsed.month, '2026-09')
  assert.equal(parsed.publishedAt, '2026-10-17')
  assert.deepEqual(parsed.missing, [])
  assert.equal(parsed.rows['2327'].revenue, 17068153)
  assert.equal(parsed.rows['2327'].reportedYoYPercent, 46.12)
  assert.equal(parsed.rows['2327'].remark, '')
  assert.match(parsed.rows['2492'].remark, /十一長假/)
  assert.equal(parsed.rows['2301'], undefined)
})

test('台湾证交所缺公司时标出来，不把别的公司算进去', () => {
  const payload = JSON.parse(readFileSync(new URL('twse-sample.json', fixture), 'utf8'))
  const parsed = parseTwseRevenue(payload.filter((row) => row['公司代號'] !== '3026'))
  assert.deepEqual(parsed.missing, ['3026'])
  assert.equal(parsed.rows['3026'], undefined)
})

test('公开资讯观测站 Big5 页面能读出三家营收', () => {
  const parsed = parseMopsRevenue(readFileSync(new URL('mops-sample.html', fixture)))
  assert.equal(parsed.month, '2026-09')
  assert.equal(parsed.publishedAt, '2026-10-17')
  assert.equal(parsed.rows['2327'].revenue, 17068153)
  assert.equal(parsed.rows['3026'].reportedYoYPercent, 27.11)
  assert.match(parsed.rows['2492'].remark, /十一長假/)
  assert.equal(parsed.rows['2301'], undefined)
})

test('经济产业省实数表只取陶瓷电容，跳过未公布的格子', () => {
  const parsed = parseMetiCeramic(readFileSync(new URL('meti-mini.xlsx', fixture)))
  assert.deepEqual(parsed.months, [
    { month: '2026-01', quantity: 1000, value: 10 },
    { month: '2026-08', quantity: 1200, value: 12 }
  ])
})
