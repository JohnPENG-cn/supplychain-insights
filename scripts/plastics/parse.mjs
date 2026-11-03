const TEN = { 上旬: '上', 中旬: '中', 下旬: '下' }
const TEN_ORDER = { 上: '1', 中: '2', 下: '3' }

export function decadeSortKey(label) {
  const match = String(label).match(/^(\d{4}-\d{2})([上中下])$/)
  if (!match) return String(label)
  return `${match[1]}-${TEN_ORDER[match[2]]}`
}

export function parseBls(payload) {
  const series = {}
  for (const item of payload?.Results?.series || []) {
    const points = []
    for (const row of item.data || []) {
      if (!row.period?.startsWith('M') || row.period === 'M13') continue
      const value = Number(row.value)
      if (!Number.isFinite(value)) continue
      points.push({
        x: `${row.year}-${row.period.slice(1)}`,
        y: value
      })
    }
    points.sort((a, b) => a.x.localeCompare(b.x))
    series[item.seriesID] = points
  }
  return series
}

export function mergePoints(older, newer) {
  const map = new Map()
  for (const point of older || []) map.set(point.x, point.y)
  for (const point of newer || []) map.set(point.x, point.y)
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([x, y]) => ({ x, y }))
}

export function parseEiaPropane(html) {
  const rows = [...html.matchAll(/<td class='B4'>&nbsp;&nbsp;(\d{4})<\/td>(.*?)<\/tr>/gs)]
  const points = []
  for (const row of rows) {
    const year = row[1]
    const cells = [...row[2].matchAll(/<td class='B3'>(.*?)<\/td>/g)].map((cell) => cell[1].trim())
    cells.slice(0, 12).forEach((cell, index) => {
      if (!cell) return
      const dollars = Number(cell)
      if (!Number.isFinite(dollars)) return
      points.push({
        x: `${year}-${String(index + 1).padStart(2, '0')}`,
        dollarsPerGallon: dollars,
        centsPerGallon: Math.round(dollars * 1000) / 10
      })
    })
  }
  points.sort((a, b) => a.x.localeCompare(b.x))
  return points
}

export function parseEurostat(payload) {
  const timeIndex = payload?.dimension?.time?.category?.index || {}
  const unitIndex = payload?.dimension?.unit?.category?.index || { I21: 0 }
  const unitLabels = payload?.dimension?.unit?.category?.label || {}
  const adjustment = payload?.dimension?.s_adj?.category?.label || {}
  const size = payload.size || []
  const timeSize = size[size.length - 1]
  const unitPos = unitIndex.I21 ?? 0
  const values = payload.value || {}
  const points = Object.entries(timeIndex)
    .sort((a, b) => a[1] - b[1])
    .flatMap(([month, index]) => {
      const value = values[String(unitPos * timeSize + index)]
      return value == null ? [] : [{ x: month, y: value }]
    })
  return {
    label: payload.label || '',
    updated: payload.updated || null,
    unit: unitLabels.I21 || 'Index, 2021=100',
    adjustment: Object.values(adjustment)[0] || '',
    points
  }
}

export function parseMopsPlastics(buffer, codes) {
  const html = new TextDecoder('big5').decode(buffer)
  const title = html.match(/上市公司(\d+)年(\d+)月份/)
  if (!title) throw new Error('公开资讯观测站页面里没有营业月份')
  const month = `${Number(title[1]) + 1911}-${String(Number(title[2])).padStart(2, '0')}`
  const rows = {}
  const missing = []
  for (const code of codes) {
    const match = html.match(new RegExp(`<td[^>]*>\\s*${code}\\s*</td>([\\s\\S]*?)</tr>`, 'i'))
    if (!match) {
      missing.push(code)
      continue
    }
    const cells = [...match[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) =>
      cell[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    )
    const revenue = Number(String(cells[1] || '').replace(/,/g, ''))
    if (!Number.isFinite(revenue)) throw new Error(`公开资讯观测站 ${code} 的营收不是数字`)
    const yoy = Number(String(cells[5] || '').replace(/,/g, '').replace(/%/g, ''))
    rows[code] = {
      revenueThousandTwd: Math.round(revenue),
      yiTwd: Math.round((revenue / 100000) * 100) / 100,
      yoyPercent: Number.isFinite(yoy) ? Math.round(yoy * 100) / 100 : null
    }
  }
  return { month, rows, missing }
}

function rowText(rowHtml) {
  return rowHtml
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, '')
    .replace(/\s+/g, '')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
}

function priceAfter(text, pattern) {
  const match = text.match(pattern)
  if (!match) return null
  const rest = text.slice(match.index + match[0].length)
  const number = rest.match(/吨(-?\d+\.\d)/)
  if (!number) return null
  const value = Number(number[1])
  if (!(value >= 1000 && value <= 100000)) return null
  return value
}

export function parseNbsDecade(html, url) {
  const titleMatch =
    html.match(/name="ArticleTitle"\s+content="([^"]+)"/) ||
    html.match(/<title>\s*([^<]+?)\s*-\s*国家统计局\s*<\/title>/)
  const title = titleMatch?.[1]?.trim() || ''
  const when = title.match(/(\d{4})年(\d{1,2})月(上旬|中旬|下旬)/)
  if (!when) return null
  const x = `${when[1]}-${when[2].padStart(2, '0')}${TEN[when[3]]}`
  const pub = html.match(/name="PubDate"\s+content="([^"]+)"/)
  let pp = null
  let lldpe = null
  let pvc = null
  let styrene = null
  for (const row of html.match(/<table[\s\S]*?<\/table>/gi) || []) {
    for (const piece of row.split(/<tr/i).slice(1)) {
      const text = rowText(piece)
      if (!text || text.includes('删除')) continue
      pp ??= priceAfter(text, /聚丙烯\(拉丝料\)/)
      lldpe ??= priceAfter(text, /聚乙烯\(LLDPE[^)]*\)/)
      pvc ??= priceAfter(text, /聚氯乙烯/)
      styrene ??= priceAfter(text, /(?<!聚)苯乙烯/)
    }
  }
  if (pp == null && lldpe == null) return null
  return {
    x,
    title,
    url,
    published: pub?.[1] || null,
    pp,
    lldpe,
    pvc,
    styrene
  }
}

export function pointAt(points, x, field = 'y') {
  return points.find((point) => point.x === x)?.[field]
}
