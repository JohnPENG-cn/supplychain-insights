import { COMPANY_CODES } from './constants.mjs'
import { roundTo } from './dates.mjs'

export function parseMopsRevenue(buffer) {
  const html = new TextDecoder('big5').decode(buffer)
  const title = html.match(/上市公司(\d+)年(\d+)月份/)
  if (!title) throw new Error('公开资讯观测站页面里没有营业月份')
  const rocYear = Number(title[1])
  const monthNumber = Number(title[2])
  const month = `${rocYear + 1911}-${String(monthNumber).padStart(2, '0')}`
  const published = html.match(/出表日期：(\d+)\/(\d+)\/(\d+)/)
  const publishedAt = published
    ? `${Number(published[1]) + 1911}-${String(published[2]).padStart(2, '0')}-${String(published[3]).padStart(2, '0')}`
    : null
  const rows = {}
  const missing = []
  for (const code of COMPANY_CODES) {
    const match = html.match(new RegExp(`<td[^>]*>\\s*${code}\\s*</td>([\\s\\S]*?)</tr>`, 'i'))
    if (!match) {
      missing.push(code)
      continue
    }
    const cells = [...match[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) =>
      cell[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    )
    const revenue = parseInteger(cells[1])
    if (!Number.isFinite(revenue)) throw new Error(`公开资讯观测站 ${code} 的营收不是数字`)
    rows[code] = {
      revenue,
      reportedYearAgo: parseInteger(cells[3]),
      reportedMomPercent: parsePercent(cells[4]),
      reportedYoYPercent: parsePercent(cells[5]),
      remark: cells[9] && cells[9] !== '-' ? cells[9] : ''
    }
  }
  if (Object.keys(rows).length === 0) throw new Error('公开资讯观测站页面里没有这三家公司')
  return { month, publishedAt, rows, missing }
}

function parseInteger(value) {
  if (!value) return null
  const number = Number(String(value).replace(/,/g, ''))
  return Number.isFinite(number) ? Math.round(number) : null
}

function parsePercent(value) {
  if (!value || value === '-') return null
  const number = Number(String(value).replace(/,/g, '').replace(/%/g, ''))
  return Number.isFinite(number) ? roundTo(number, 2) : null
}
