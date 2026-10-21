export function buildChart(series, options = {}) {
  const width = options.width ?? 640
  const height = options.height ?? 168
  const pad = { left: 56, right: 12, top: 14, bottom: 28 }
  const dates = [...new Set(series.flatMap((item) => item.points.map((point) => point.date)))].sort()
  const values = series
    .flatMap((item) => item.points.map((point) => point.value))
    .filter((value) => Number.isFinite(value))
  if (dates.length === 0 || values.length === 0) return null
  let min = Math.min(...values)
  let max = Math.max(...values)
  if (min === max) {
    min -= 1
    max += 1
  }
  const span = max - min
  const innerWidth = width - pad.left - pad.right
  const innerHeight = height - pad.top - pad.bottom
  const xOf = (date) => {
    const index = dates.indexOf(date)
    if (dates.length === 1) return pad.left + innerWidth / 2
    return pad.left + (index / (dates.length - 1)) * innerWidth
  }
  const yOf = (value) => pad.top + (1 - (value - min) / span) * innerHeight
  return {
    width,
    height,
    min,
    max,
    firstDate: dates[0],
    lastDate: dates[dates.length - 1],
    firstX: xOf(dates[0]),
    lastX: xOf(dates[dates.length - 1]),
    polylines: series.map((item) => ({
      name: item.name,
      color: item.color,
      points: item.points
        .filter((point) => Number.isFinite(point.value))
        .map((point) => `${xOf(point.date).toFixed(1)},${yOf(point.value).toFixed(1)}`)
        .join(' ')
    })),
    dots: series.flatMap((item) =>
      item.points
        .filter((point) => Number.isFinite(point.value))
        .map((point) => ({
          name: item.name,
          color: item.color,
          date: point.date,
          value: point.value,
          x: xOf(point.date),
          y: yOf(point.value)
        }))
    )
  }
}
