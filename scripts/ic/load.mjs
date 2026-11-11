import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export const csvPath = 'docs/public/columns/semi-cycle/data.csv'
export const clusterName = 'Analog/MCU 模拟与MCU'

export const companies = [
  {
    id: 'ti',
    csvName: 'TI 德州仪器',
    name: '德州仪器',
    color: '#0f6b63',
    fiscal: '按自然季度披露。2026 年第三季的截止日是 2026-09-30。'
  },
  {
    id: 'adi',
    csvName: 'ADI 亚德诺',
    name: '亚德诺',
    color: '#b45309',
    fiscal:
      '财年截至 10 月底或 11 月初。财季按结束日前 45 天归入自然季度。例如财年第一季（11 月到 1 月）归入上一个自然年的第四季。数据集里最新一笔是自然年 2026 年第二季。'
  },
  {
    id: 'mchp',
    csvName: 'Microchip 微芯',
    name: '微芯',
    color: '#1d4e89',
    fiscal:
      '财年截至 3 月。财年第一季（4 月到 6 月）等于自然年第二季，所以 7 月到 9 月那一季就是自然年第三季。2026-11-05 公布的 FY2027 第二季，对应自然年 2026 年第三季。'
  },
  {
    id: 'nxp',
    csvName: 'NXP 恩智浦',
    name: '恩智浦',
    color: '#6d28d9',
    fiscal: '按自然季度披露。2026 年第三季业绩稿的截止日是 2026-09-27。'
  }
]

const byCsvName = Object.fromEntries(companies.map((company) => [company.csvName, company.id]))

export function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  const source = text.replace(/^\uFEFF/, '')
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          cell += '"'
          index += 1
        } else quoted = false
      } else cell += char
      continue
    }
    if (char === '"') {
      quoted = true
      continue
    }
    if (char === ',') {
      row.push(cell)
      cell = ''
      continue
    }
    if (char === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
      continue
    }
    if (char !== '\r') cell += char
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }
  const [header, ...body] = rows
  return body
    .filter((item) => item.some((value) => value !== ''))
    .map((item) => Object.fromEntries(header.map((name, index) => [name, item[index] ?? ''])))
}

export function periodEndOf(note) {
  const match = String(note || '').match(/期末日 (\d{4}-\d{2}-\d{2})/)
  return match ? match[1] : ''
}

export function buildQuarterFile(csvText) {
  const table = parseCsv(csvText)
  const bucket = new Map()
  for (const row of table) {
    if (row.cluster !== clusterName) continue
    if (!row.period.includes('Q')) continue
    const company = byCsvName[row.company]
    if (!company) continue
    const key = `${company}|${row.period}`
    if (!bucket.has(key)) {
      bucket.set(key, {
        company,
        period: row.period,
        periodEnd: '',
        revenue: null,
        cogs: null,
        inventory: null,
        revenueUrl: '',
        cogsUrl: '',
        inventoryUrl: '',
        yoyBreak: false
      })
    }
    const item = bucket.get(key)
    const value = Number(row.value)
    if (!Number.isFinite(value)) continue
    if (row.metric === 'revenue') {
      item.revenue = value
      item.revenueUrl = row.source_url
      item.periodEnd = periodEndOf(row.note) || item.periodEnd
    } else if (row.metric === 'cogs') {
      item.cogs = value
      item.cogsUrl = row.source_url
      item.periodEnd = item.periodEnd || periodEndOf(row.note)
    } else if (row.metric === 'inventory') {
      item.inventory = value
      item.inventoryUrl = row.source_url
      item.periodEnd = item.periodEnd || periodEndOf(row.note)
    } else if (row.metric === 'revenue_yoy_pct' && row.note.includes('⚠')) {
      item.yoyBreak = true
    }
  }
  const rows = [...bucket.values()]
    .filter((item) => item.revenue != null)
    .sort((left, right) => left.period.localeCompare(right.period) || left.company.localeCompare(right.company))
  return {
    extractedFrom: csvPath,
    extractedAt: '2026-11-11',
    cluster: clusterName,
    unit: 'USD m',
    daysFactor: 91,
    companies,
    rows
  }
}

export function readQuarterSource(root) {
  const text = readFileSync(resolve(root, csvPath), 'utf8')
  return buildQuarterFile(text)
}
