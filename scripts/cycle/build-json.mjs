import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseCsv } from '../ic/load.mjs'
import { buildPassivePosition, passiveCsvPath } from './passive-position.mjs'
import { buildShippingPosition, shippingCsvPath } from './shipping-position.mjs'

const root = resolve(import.meta.dirname, '../..')

function readRows(relativePath) {
  return parseCsv(readFileSync(resolve(root, relativePath), 'utf8'))
}

const passiveBreaks = JSON.parse(readFileSync(resolve(root, 'data/passive/breaks.json'), 'utf8'))
const shippingBreaks = JSON.parse(readFileSync(resolve(root, 'data/shipping/breaks.json'), 'utf8'))
const passive = buildPassivePosition(readRows(passiveCsvPath), passiveBreaks)
const shipping = buildShippingPosition(readRows(shippingCsvPath), shippingBreaks)

writeFileSync(resolve(root, 'data/mlcc/cycle-position.json'), `${JSON.stringify(passive, null, 2)}\n`)
writeFileSync(resolve(root, 'data/shipping/position.json'), `${JSON.stringify(shipping, null, 2)}\n`)

console.log(
  JSON.stringify(
    {
      passiveMedian: passive.median.latest,
      passiveTroughs: passive.median.troughs.map((point) => point.period),
      passiveGaps: passive.median.gaps,
      passiveUpturn: passive.median.upturn.quarters,
      passivePast: passive.median.upturn.pastQuarters,
      book: passive.bookToBill.latest,
      lead: passive.bookToBill.lead,
      shipping: shipping.segments.map((segment) => ({
        id: segment.id,
        safe: segment.safe,
        latest: segment.latest,
        troughs: segment.troughs.map((point) => point.period),
        gaps: segment.gaps,
        years: segment.averageGapYears
      }))
    },
    null,
    2
  )
)
