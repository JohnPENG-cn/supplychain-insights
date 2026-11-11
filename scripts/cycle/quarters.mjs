export function quarterIndex(period) {
  const match = /^(\d{4})Q([1-4])$/.exec(period)
  if (!match) return null
  return Number(match[1]) * 4 + Number(match[2])
}

export function median(values) {
  const sorted = [...values].sort((left, right) => left - right)
  const count = sorted.length
  if (count === 0) return null
  if (count % 2 === 1) return sorted[(count - 1) / 2]
  return (sorted[count / 2 - 1] + sorted[count / 2]) / 2
}

export function round(value, digits = 4) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  const factor = 10 ** digits
  return Math.round((value + Number.EPSILON) * factor) / factor
}

export function inBreak(breaks, company, period) {
  const index = quarterIndex(period)
  if (index == null) return false
  for (const window of breaks[company] || []) {
    const start = quarterIndex(window[0])
    const end = quarterIndex(window[1])
    if (start != null && end != null && start <= index && index <= end) return true
  }
  return false
}

export function correlation(xs, ys) {
  const count = xs.length
  if (count < 3 || count !== ys.length) return null
  const meanX = xs.reduce((sum, value) => sum + value, 0) / count
  const meanY = ys.reduce((sum, value) => sum + value, 0) / count
  let numerator = 0
  let dx = 0
  let dy = 0
  for (let index = 0; index < count; index += 1) {
    const left = xs[index] - meanX
    const right = ys[index] - meanY
    numerator += left * right
    dx += left * left
    dy += right * right
  }
  if (dx === 0 || dy === 0) return null
  return numerator / Math.sqrt(dx * dy)
}

export function percentileAtOrBelow(values, current) {
  const count = values.filter((value) => value <= current + 1e-9).length
  return {
    count,
    n: values.length,
    percent: values.length ? (count / values.length) * 100 : null
  }
}

/**
 * 主要谷底：前后各 4 个季度的窗口里最低，比窗口内最高至少低 15 个百分点，并且同比小于 0。
 * 窗口里前后至少要各看到 3 个季度以外的点；序列两端不算。缺 1 个季度仍可算。
 */
export function majorTroughs(points) {
  const troughs = []
  for (const point of points) {
    const center = quarterIndex(point.period)
    if (center == null) continue
    const window = points.filter((item) => {
      const index = quarterIndex(item.period)
      return index != null && index >= center - 4 && index <= center + 4
    })
    const indexes = window.map((item) => quarterIndex(item.period))
    // 允许窗口里缺 1 个季度。干散货 2011Q4 没有中位数，2012Q4 的谷仍要留在样本里。
    if (Math.min(...indexes) > center - 3 || Math.max(...indexes) < center + 3) continue
    const lowest = Math.min(...window.map((item) => item.value))
    const highest = Math.max(...window.map((item) => item.value))
    if (point.value === lowest && point.value < 0 && highest - lowest >= 15) {
      troughs.push(point)
    }
  }
  return troughs
}

export function gapsOf(troughs) {
  const gaps = []
  for (let index = 1; index < troughs.length; index += 1) {
    gaps.push(quarterIndex(troughs[index].period) - quarterIndex(troughs[index - 1].period))
  }
  return gaps
}
