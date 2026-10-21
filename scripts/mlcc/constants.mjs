export const COMPANY_CODES = ['2327', '2492', '3026']

export const USER_AGENT =
  'Mozilla/5.0 (compatible; supplychain-insights/mlcc-dashboard; +https://github.com/JohnPENG-cn/supplychain-insights)'

export const TWSE_URL = 'https://openapi.twse.com.tw/v1/opendata/t187ap05_L'

export const METI_PAGE =
  'https://www.meti.go.jp/statistics/tyo/seidou/result/ichiran/08_seidou.html'

export function mopsUrl(month) {
  const [year, monthNumber] = month.split('-').map(Number)
  const rocYear = year - 1911
  return `https://mopsov.twse.com.tw/nas/t21/sii/t21sc03_${rocYear}_${monthNumber}_0.html`
}

export function metiWorkbookUrl(month) {
  const [year, monthNumber] = month.split('-')
  const yyyymm = `${year}${monthNumber}`
  return `https://www.meti.go.jp/statistics/tyo/seidou/result/ichiran/resourceData/08_seidou/kakuho/${year}/h2daa${yyyymm}_jikei.xlsx`
}

export function sourcesForRun({ event, schedule, input }) {
  if (input && input !== 'all') {
    if (input !== 'twse' && input !== 'meti') {
      throw new Error(`不知道要抓哪一项：${input}`)
    }
    return [input]
  }
  if (event === 'schedule') {
    return String(schedule || '').includes('1 20 ') ? ['meti'] : ['twse']
  }
  return ['twse', 'meti']
}

export function metiTargetMonth(dataThrough, today) {
  const expected = addMonthsUnchecked(today.slice(0, 7), -2)
  if (!dataThrough) return expected
  const nextMissing = addMonthsUnchecked(dataThrough, 1)
  return nextMissing < expected ? nextMissing : expected
}

function addMonthsUnchecked(month, delta) {
  const [year, monthNumber] = month.split('-').map(Number)
  const date = new Date(Date.UTC(year, monthNumber - 1 + delta, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}
