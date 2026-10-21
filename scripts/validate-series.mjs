import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const catalog = JSON.parse(readFileSync(resolve(root, 'data/electronics/catalog.json'), 'utf8'))
const seriesFile = JSON.parse(readFileSync(resolve(root, 'data/electronics/series.json'), 'utf8'))

const datePattern = /^\d{4}-\d{2}-\d{2}$/
const idPattern = /^[a-z0-9_]+$/
const banned = /TODO|TBD|示例数据|假数据|fake data/i

function fail(message) {
  throw new Error(message)
}

function assertUrl(value, label) {
  if (typeof value !== 'string' || !/^https?:\/\//.test(value)) {
    fail(`${label} 必须是 http 或 https 链接`)
  }
}

function validateCatalog(input) {
  if (!input || !Array.isArray(input.indicators) || input.indicators.length === 0) {
    fail('catalog.json 缺少 indicators')
  }
  const seen = new Set()
  for (const item of input.indicators) {
    if (!item || typeof item.id !== 'string' || !idPattern.test(item.id)) {
      fail(`指标 id 不合法：${item && item.id}`)
    }
    if (seen.has(item.id)) fail(`指标 id 重复：${item.id}`)
    seen.add(item.id)
    for (const key of ['name', 'where', 'frequency', 'access', 'howToRead']) {
      if (typeof item[key] !== 'string' || !item[key].trim()) {
        fail(`${item.id} 缺少 ${key}`)
      }
    }
    if (item.public !== false) {
      assertUrl(item.sourceUrl, `${item.id} 的 sourceUrl`)
    }
    const blob = JSON.stringify(item)
    if (banned.test(blob)) fail(`${item.id} 里有占位词`)
  }
  return input
}

function validateSeries(input, catalogInput) {
  if (!input || (input.status !== 'empty' && input.status !== 'ok')) {
    fail('series.json 的 status 只能是 empty 或 ok')
  }
  if (typeof input.note === 'string' && banned.test(input.note)) {
    fail('series.json 的说明里有占位词')
  }
  if (!Array.isArray(input.series)) fail('series.json 的 series 必须是数组')

  const allowed = new Map(
    catalogInput.indicators.filter((item) => item.public !== false).map((item) => [item.id, item])
  )

  if (input.status === 'empty') {
    if (input.updatedAt !== null) fail('空数据的 updatedAt 必须是 null')
    if (input.series.length !== 0) fail('空数据的 series 必须是空数组')
    return
  }

  if (typeof input.updatedAt !== 'string' || !datePattern.test(input.updatedAt)) {
    fail('有数据时 updatedAt 必须是 YYYY-MM-DD')
  }
  if (input.series.length === 0) fail('status 为 ok 时至少要有一条序列')

  const seen = new Set()
  for (const item of input.series) {
    if (!item || typeof item.id !== 'string' || !allowed.has(item.id)) {
      fail(`序列 id 不在公开指标清单里：${item && item.id}`)
    }
    if (seen.has(item.id)) fail(`序列 id 重复：${item.id}`)
    seen.add(item.id)
    for (const key of ['name', 'unit', 'frequency', 'sourceName']) {
      if (typeof item[key] !== 'string' || !item[key].trim()) fail(`${item.id} 缺少 ${key}`)
    }
    assertUrl(item.sourceUrl, `${item.id} 的 sourceUrl`)
    if (!Array.isArray(item.points) || item.points.length === 0) {
      fail(`${item.id} 没有数据点`)
    }
    let previous = ''
    let numeric = 0
    const dates = new Set()
    for (const point of item.points) {
      if (!point || typeof point.date !== 'string' || !datePattern.test(point.date)) {
        fail(`${item.id} 的日期必须是 YYYY-MM-DD`)
      }
      if (dates.has(point.date)) fail(`${item.id} 的日期重复：${point.date}`)
      dates.add(point.date)
      if (previous && point.date < previous) fail(`${item.id} 的日期必须从早到晚`)
      previous = point.date
      if (point.value === null) continue
      if (typeof point.value !== 'number' || !Number.isFinite(point.value)) {
        fail(`${item.id} 在 ${point.date} 的数值不是有限数字`)
      }
      numeric += 1
    }
    if (numeric === 0) fail(`${item.id} 至少要有一个数字，不能全是空值`)
    if (banned.test(JSON.stringify(item))) fail(`${item.id} 里有占位词`)
  }
}

function selfTest() {
  const miniCatalog = {
    indicators: [
      {
        id: 'demo_public',
        name: '公开示例',
        where: '无',
        frequency: '月',
        access: '免费',
        public: true,
        sourceUrl: 'https://example.com/source',
        howToRead: '只用于校验脚本'
      },
      {
        id: 'demo_private',
        name: '内部示例',
        where: '内部',
        frequency: '周',
        access: '不公开',
        public: false,
        sourceUrl: '',
        howToRead: '不能写进 series'
      }
    ]
  }
  validateSeries({ updatedAt: null, status: 'empty', series: [] }, miniCatalog)

  const good = {
    updatedAt: '2026-10-21',
    status: 'ok',
    series: [
      {
        id: 'demo_public',
        name: '公开示例',
        unit: '个',
        frequency: '月',
        sourceName: '示例来源',
        sourceUrl: 'https://example.com/source',
        points: [
          { date: '2026-09-01', value: 1 },
          { date: '2026-10-01', value: null }
        ]
      }
    ]
  }
  validateSeries(good, miniCatalog)

  const cases = [
    [{ updatedAt: '2026-10-21', status: 'empty', series: [] }, '空数据却写了日期'],
    [
      {
        updatedAt: '2026-10-21',
        status: 'ok',
        series: [
          {
            id: 'missing',
            name: '不存在',
            unit: '个',
            frequency: '月',
            sourceName: '来源',
            sourceUrl: 'https://example.com/source',
            points: [{ date: '2026-10-01', value: 1 }]
          }
        ]
      },
      '未知 id'
    ],
    [
      {
        updatedAt: '2026-10-21',
        status: 'ok',
        series: [
          {
            id: 'demo_private',
            name: '内部',
            unit: '天',
            frequency: '周',
            sourceName: '内部',
            sourceUrl: 'https://example.com/source',
            points: [{ date: '2026-10-01', value: 3 }]
          }
        ]
      },
      '内部指标'
    ],
    [
      {
        updatedAt: '2026-10-21',
        status: 'ok',
        series: [
          {
            id: 'demo_public',
            name: '坏数值',
            unit: '个',
            frequency: '月',
            sourceName: '来源',
            sourceUrl: 'https://example.com/source',
            points: [{ date: '2026-10-01', value: '很多' }]
          }
        ]
      },
      '字符串数值'
    ]
  ]

  for (const [input, label] of cases) {
    let threw = false
    try {
      validateSeries(input, miniCatalog)
    } catch {
      threw = true
    }
    if (!threw) fail(`自检没有拦住：${label}`)
  }
}

selfTest()
validateCatalog(catalog)
validateSeries(seriesFile, catalog)
console.log(`指标清单 ${catalog.indicators.length} 条，序列文件状态 ${seriesFile.status}，校验通过`)
