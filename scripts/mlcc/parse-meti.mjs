import { readZip } from './zip.mjs'
import { sharedStrings, sheetRows } from './xml.mjs'

const PRODUCT = 'セラミックコンデンサ'
const QUANTITY = '生産数量'
const VALUE = '生産金額'

export function parseMetiCeramic(buffer) {
  const entries = readZip(buffer)
  const workbook = textEntry(entries, 'xl/workbook.xml')
  const rels = textEntry(entries, 'xl/_rels/workbook.xml.rels')
  const sheetName = workbook.match(/<sheet\b[^>]*name="([^"]*実数表[^"]*)"[^>]*>/)
  if (!sheetName) throw new Error('经济产业省工作簿里没有実数表')
  const sheetTag = workbook.match(new RegExp(`<sheet\\b[^>]*name="${escapeRegExp(sheetName[1])}"[^>]*>`))
  const relation = sheetTag[0].match(/\br:id="([^"]+)"/)
  if (!relation) throw new Error('実数表没有工作表编号')
  const target = rels.match(new RegExp(`Id="${relation[1]}"[^>]*Target="([^"]+)"`))
  if (!target) throw new Error('実数表没有对应文件')
  const sheetPath = target[1].startsWith('/') ? target[1].slice(1) : `xl/${target[1].replace(/^\.\//, '')}`
  const strings = entries.has('xl/sharedStrings.xml')
    ? sharedStrings(textEntry(entries, 'xl/sharedStrings.xml'))
    : []
  const rows = sheetRows(textEntry(entries, sheetPath), strings)
  const headerIndex = rows.findIndex((row) => {
    const values = row.map((cell) => cell.value)
    return values.includes('品目名') && values.includes('アイテム名')
  })
  if (headerIndex < 0) throw new Error('実数表里没有品目名表头')
  const header = rows[headerIndex]
  const nameColumn = columnOf(header, '品目名')
  const itemColumn = columnOf(header, 'アイテム名')
  const monthColumns = header
    .filter((cell) => typeof cell.value === 'string' && /^20\d{4}$/.test(cell.value))
    .map((cell) => ({ column: cell.column, month: `${cell.value.slice(0, 4)}-${cell.value.slice(4)}` }))
  if (monthColumns.length === 0) throw new Error('実数表里没有月份列')
  const quantity = new Map()
  const value = new Map()
  for (const row of rows.slice(headerIndex + 1)) {
    const name = cellText(row, nameColumn)
    const item = cellText(row, itemColumn)
    if (name !== PRODUCT) continue
    const targetMap = item === QUANTITY ? quantity : item === VALUE ? value : null
    if (!targetMap) continue
    if (targetMap.size > 0) throw new Error(`セラミックコンデンサ的${item}出现了两行`)
    for (const monthColumn of monthColumns) {
      const raw = cellText(row, monthColumn.column)
      const number = parseNumber(raw)
      if (number != null) targetMap.set(monthColumn.month, number)
    }
  }
  if (quantity.size === 0 || value.size === 0) {
    throw new Error('実数表里没有陶瓷电容的产量和金额')
  }
  const months = [...quantity.keys()]
    .filter((month) => value.has(month))
    .sort()
    .map((month) => ({ month, quantity: quantity.get(month), value: value.get(month) }))
  if (months.length === 0) throw new Error('陶瓷电容的产量和金额没有重叠的月份')
  return { months }
}

function textEntry(entries, name) {
  const data = entries.get(name)
  if (!data) throw new Error(`xlsx 里没有 ${name}`)
  return data.toString('utf8')
}

function columnOf(row, label) {
  const cell = row.find((item) => item.value === label)
  if (!cell) throw new Error(`表头里没有${label}`)
  return cell.column
}

function cellText(row, column) {
  const cell = row.find((item) => item.column === column)
  return cell ? cell.value : null
}

function parseNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return null
  const text = value.replace(/,/g, '').trim()
  if (!/^-?\d+(\.\d+)?$/.test(text)) return null
  return Number(text)
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
