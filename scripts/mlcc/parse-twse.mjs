import { COMPANY_CODES } from './constants.mjs'
import { fromRocDate, fromRocYearMonth, roundTo } from './dates.mjs'

const EMPTY_REMARK = new Set(['', '-', '—', '－', '─'])

export function parseTwseRevenue(payload) {
  const rows = Array.isArray(payload) ? payload : payload?.data
  if (!Array.isArray(rows)) throw new Error('台湾证交所月营收不是 JSON 数组')
  const byCode = new Map()
  for (const row of rows) {
    const code = String(row?.['公司代號'] ?? '').trim()
    if (COMPANY_CODES.includes(code)) byCode.set(code, row)
  }
  const missing = COMPANY_CODES.filter((code) => !byCode.has(code))
  const present = [...byCode.values()]
  if (present.length === 0) throw new Error('台湾证交所月营收里没有国巨、华新科、禾伸堂')
  const months = new Set(present.map((row) => fromRocYearMonth(row['資料年月'])))
  if (months.size !== 1) throw new Error(`台湾证交所这批资料不是同一个月：${[...months].join('、')}`)
  const month = [...months][0]
  const published = new Set(present.map((row) => fromRocDate(row['出表日期'])))
  const parsed = {
    month,
    publishedAt: [...published].sort().at(-1),
    rows: {},
    missing
  }
  for (const code of COMPANY_CODES) {
    const row = byCode.get(code)
    if (!row) continue
    parsed.rows[code] = readCompany(row)
  }
  return parsed
}

function readCompany(row) {
  const revenue = parseInteger(row['營業收入-當月營收'])
  if (!Number.isFinite(revenue)) throw new Error(`${row['公司代號']} 的当月营收不是数字`)
  const remark = cleanRemark(row['備註'])
  return {
    revenue,
    reportedYearAgo: parseInteger(row['營業收入-去年當月營收']),
    reportedYoYPercent: parsePercent(row['營業收入-去年同月增減(%)']),
    reportedMomPercent: parsePercent(row['營業收入-上月比較增減(%)']),
    remark
  }
}

function parseInteger(value) {
  if (value == null || value === '') return null
  const number = Number(String(value).replace(/,/g, '').trim())
  return Number.isFinite(number) ? Math.round(number) : null
}

function parsePercent(value) {
  if (value == null || value === '' || value === '-') return null
  const number = Number(String(value).replace(/,/g, '').replace(/%/g, '').trim())
  return Number.isFinite(number) ? roundTo(number, 2) : null
}

function cleanRemark(value) {
  const text = String(value ?? '').trim()
  return EMPTY_REMARK.has(text) ? '' : text
}
