export function isoDate(date) {
  return date.toISOString().slice(0, 10)
}

export function addDays(iso, days) {
  const date = new Date(`${iso}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return isoDate(date)
}

export function addMonths(month, delta) {
  const [year, monthNumber] = month.split('-').map(Number)
  const date = new Date(Date.UTC(year, monthNumber - 1 + delta, 1))
  const nextYear = date.getUTCFullYear()
  const nextMonth = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${nextYear}-${nextMonth}`
}

export function daysBetween(earlier, later) {
  const ms = Date.parse(`${later}T00:00:00Z`) - Date.parse(`${earlier}T00:00:00Z`)
  return Math.round(ms / 86400000)
}

export function rocYearMonth(month) {
  const [year, monthNumber] = month.split('-').map(Number)
  return { rocYear: year - 1911, month: monthNumber }
}

export function fromRocYearMonth(value) {
  const text = String(value).trim()
  const month = Number(text.slice(-2))
  const rocYear = Number(text.slice(0, -2))
  if (!rocYear || month < 1 || month > 12) {
    throw new Error(`无法识别的民国年月：${value}`)
  }
  return `${rocYear + 1911}-${String(month).padStart(2, '0')}`
}

export function fromRocDate(value) {
  const text = String(value).trim()
  if (!/^\d{6,7}$/.test(text)) throw new Error(`无法识别的民国日期：${value}`)
  const day = Number(text.slice(-2))
  const month = Number(text.slice(-4, -2))
  const rocYear = Number(text.slice(0, -4))
  if (!rocYear || month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error(`无法识别的民国日期：${value}`)
  }
  return `${rocYear + 1911}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function formatPercent(ratio, digits = 1) {
  if (typeof ratio !== 'number' || !Number.isFinite(ratio)) return '—'
  const percent = ratio * 100
  const sign = percent > 0 ? '+' : ''
  return `${sign}${percent.toFixed(digits)}%`
}

export function formatNumber(value, digits = 0) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value)
}

export function roundTo(value, digits) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}
