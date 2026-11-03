import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const read = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'))

const bls = read('data/plastics/bls-ppi.json')
const eia = read('data/plastics/eia-propane.json')
const euro = read('data/plastics/eurostat-c2016.json')
const mops = read('data/plastics/mops-revenue.json')
const nbs = read('data/plastics/nbs-decade-prices.json')
const sec = read('data/plastics/sec-lyondellbasell.json')
const charts = read('data/cases/charts.json')
const timelines = read('data/cases/timelines.json')

if (sec.ok !== false || sec.quarters) {
  throw new Error('SEC 这次没有取到，文件里不该有成功的季度营收')
}

const resin = new Map(bls.series.PCU325211325211.points.map((point) => [point.x, point.y]))
if (resin.get('2022-06') !== 380.764 || resin.get('2021-02') !== 300.4 || resin.get('2017-08') !== 269.9) {
  throw new Error('BLS 锚点对不上')
}

const propane = new Map(eia.points.map((point) => [point.x, point]))
if (propane.get('2026-09').dollarsPerGallon !== 0.848 || propane.get('2021-10').dollarsPerGallon !== 1.454) {
  throw new Error('EIA 锚点对不上')
}

function samePoints(actual, expected) {
  if (actual.length !== expected.length) return false
  return actual.every((point, index) => point.x === expected[index].x && point.y === expected[index].y)
}

const harvey = charts['plastics-harvey-2017-ppi'].series[0].points
if (!samePoints(harvey, bls.series.PCU325211325211.points.filter((point) => point.x >= '2017-01' && point.x <= '2018-12'))) {
  throw new Error('哈维图和 BLS 不一致')
}

const texas = charts['plastics-texas-2021-ppi']
if (texas.series[1].points.find((point) => point.x === '2021-02').y !== 90.5) {
  throw new Error('寒潮图的丙烷不是 90.5 美分')
}

const prod = new Map(euro.production.points.map((point) => [point.x, point.y]))
if (prod.get('2021-12') !== 106.4 || prod.get('2022-12') !== 76.4 || prod.get('2026-08') !== 71.3) {
  throw new Error('Eurostat 产量锚点对不上')
}
if (euro.producerPrices.points.find((point) => point.x === '2022-06').y !== 130.5) {
  throw new Error('Eurostat 出厂价锚点对不上')
}

const revenue = charts['plastics-tw-revenue']
const sept = mops.months.find((month) => month.month === '2026-09')
if (sept.rows['6505'].yoyPercent !== 65.59) throw new Error('台塑化 2026-09 同比对不上')
if (revenue.series[0].points.at(-1).y !== sept.rows['1301'].yiTwd) throw new Error('台塑营收图和原始数据不一致')

const mid = nbs.observations.find((row) => row.x === '2026-10中')
if (mid.pp !== 10666.4 || mid.lldpe !== 9999) throw new Error('统计局 2026-10 中旬对照失败')
const early = nbs.observations.find((row) => row.x === '2026-01上')
if (early.pvc != null || early.pp !== 6269.2) throw new Error('2026-01 上旬不该再有 PVC 价格')
const china = charts['plastics-china-pp-lldpe']
const june = china.series[0].points.find((point) => point.x === '2023-06中')
if (!june || june.y !== 7020.6) throw new Error('中国图缺少 2023-06 中旬的 PP')
if (china.series.some((series) => series.name.includes('PVC') || series.name.includes('苯乙烯'))) {
  throw new Error('中国图不该画 PVC 或苯乙烯')
}

for (const id of [
  'harvey-2017',
  'texas-freeze-2021',
  'evonik-pa12-2012',
  'pa66-adn-2018',
  'meltblown-2020',
  'europe-energy-2022',
  'ppi-retreat-2022',
  'china-glut-2024',
  'pfas-exit',
  'rohs-phthalates-2019',
  'recycled-imports'
]) {
  if (!timelines[id]?.events?.length) throw new Error(`缺少时间线 ${id}`)
}

console.log('塑料数据检查通过')
