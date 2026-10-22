<script setup>
import charts from '../../../../data/cases/charts.json'

const props = defineProps({
  id: { type: String, required: true }
})

const chart = charts[props.id]
if (!chart) {
  throw new Error(`缺少图表 ${props.id}`)
}

const colors = ['#0f6b63', '#c2410c', '#1d4ed8', '#9f1239']
const width = 720
const height = 292

function panelGroups(series) {
  const main = series.filter((item) => !item.panel)
  const extras = new Map()
  for (const item of series) {
    if (!item.panel) continue
    if (!extras.has(item.panel)) extras.set(item.panel, [])
    extras.get(item.panel).push(item)
  }
  return [main, ...extras.values()]
}

function extent(values, pinZero) {
  let min = Math.min(...values)
  let max = Math.max(...values)
  if (pinZero) {
    min = Math.min(0, min)
    max = Math.max(0, max)
  }
  if (min === max) {
    min -= 1
    max += 1
  }
  const pad = (max - min) * 0.14
  if (pinZero && min >= 0) return { min: 0, max: max + pad }
  return { min: min - pad, max: max + pad }
}

function ticks(min, max, count = 4) {
  const step = (max - min) / count
  return Array.from({ length: count + 1 }, (_, index) => min + step * index)
}

function formatTick(value, unit) {
  if (unit === '%') return `${Math.round(value)}%`
  if (unit === '天') return `${Math.round(value)}`
  const abs = Math.abs(value)
  if (abs >= 100) return `${Math.round(value)}`
  if (abs >= 10) return value.toFixed(0)
  return value.toFixed(1)
}

function buildPanel(series) {
  const labels = []
  for (const item of series) {
    for (const point of item.points) {
      if (!labels.includes(point.x)) labels.push(point.x)
    }
  }
  const leftSeries = series.filter((item) => item.axis !== 'right')
  const rightSeries = series.filter((item) => item.axis === 'right')
  const pinLeft = leftSeries.some((item) => item.kind === 'bar') || leftSeries.some((item) => item.points.some((point) => point.y < 0))
  const pinRight = rightSeries.some((item) => item.points.some((point) => point.y < 0))
  const left = extent(leftSeries.flatMap((item) => item.points.map((point) => point.y)), pinLeft)
  const right = rightSeries.length
    ? extent(rightSeries.flatMap((item) => item.points.map((point) => point.y)), pinRight)
    : null
  const pad = { l: 52, r: right ? 52 : 18, t: 16, b: labels.length > 8 ? 58 : 40 }
  const plotW = width - pad.l - pad.r
  const plotH = height - pad.t - pad.b
  const slot = plotW / labels.length

  function xAt(label) {
    return pad.l + (labels.indexOf(label) + 0.5) * slot
  }
  function yAt(value, scale) {
    return pad.t + ((scale.max - value) / (scale.max - scale.min)) * plotH
  }

  const bars = leftSeries.filter((item) => item.kind === 'bar')
  const barW = Math.min(22, slot * 0.46)
  const shapes = []
  series.forEach((item, seriesIndex) => {
    const scale = item.axis === 'right' ? right : left
    const color = colors[seriesIndex % colors.length]
    if (item.kind === 'bar') {
      const offset = (seriesIndex - (bars.length - 1) / 2) * barW
      for (const point of item.points) {
        const x = xAt(point.x) + offset - barW / 2
        const y = yAt(point.y, scale)
        const base = yAt(0, scale)
        shapes.push({
          type: 'bar',
          x,
          y: Math.min(y, base),
          w: barW - 2,
          h: Math.max(1, Math.abs(base - y)),
          color,
          derived: point.derived
        })
      }
      return
    }
    const ordered = item.points.map((point) => ({
      ...point,
      x: xAt(point.x),
      y: yAt(point.y, scale)
    }))
    shapes.push({
      type: 'line',
      color,
      d: ordered.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' '),
      points: ordered
    })
  })

  const showEvery = labels.length > 18 ? 6 : labels.length > 12 ? 2 : 1
  return {
    h: height,
    labels: labels.map((label, index) => ({
      label,
      x: xAt(label),
      show: index % showEvery === 0
    })),
    yLeft: ticks(left.min, left.max).map((value) => ({
      y: yAt(value, left),
      text: formatTick(value, leftSeries[0]?.unit)
    })),
    yRight: right
      ? ticks(right.min, right.max).map((value) => ({
          y: yAt(value, right),
          text: formatTick(value, rightSeries[0]?.unit)
        }))
      : [],
    zeroY: pinLeft ? yAt(0, left) : null,
    shapes,
    legend: series.map((item, index) => ({
      name: `${item.name}（${item.unit}）`,
      color: colors[index % colors.length]
    })),
    pad
  }
}

const panels = panelGroups(chart.series).map(buildPanel)
const hasDerived = chart.series.some((item) => item.points.some((point) => point.derived))
const links = chart.sources?.length ? chart.sources : [chart.source]
</script>

<template>
  <figure class="series-chart">
    <figcaption class="chart-title">{{ chart.title }}</figcaption>
    <template v-for="(panel, panelIndex) in panels" :key="panelIndex">
    <svg
      :viewBox="`0 0 ${width} ${panel.h}`"
      role="img"
      :aria-label="chart.title"
    >
      <line
        v-for="tick in panel.yLeft"
        :key="`g-${panelIndex}-${tick.y}`"
        :x1="panel.pad.l"
        :x2="width - panel.pad.r"
        :y1="tick.y"
        :y2="tick.y"
        class="chart-grid"
      />
      <template v-for="shape in panel.shapes" :key="shape.d || `${shape.x}-${shape.y}`">
        <rect
          v-if="shape.type === 'bar'"
          :x="shape.x"
          :y="shape.y"
          :width="shape.w"
          :height="shape.h"
          :fill="shape.color"
          :opacity="shape.derived ? 0.45 : 0.9"
          rx="2"
        />
        <path v-else :d="shape.d" :stroke="shape.color" fill="none" stroke-width="2.25" />
      </template>
      <template v-for="shape in panel.shapes.filter((item) => item.type === 'line')" :key="shape.d">
        <circle
          v-for="(point, pointIndex) in shape.points"
          :key="pointIndex"
          :cx="point.x"
          :cy="point.y"
          :r="point.derived ? 4 : 2.6"
          :fill="point.derived ? 'var(--vp-c-bg-elv)' : shape.color"
          :stroke="shape.color"
          stroke-width="2"
        />
      </template>
      <text
        v-for="tick in panel.yLeft"
        :key="`yl-${tick.y}`"
        :x="panel.pad.l - 8"
        :y="tick.y + 4"
        class="chart-tick"
        text-anchor="end"
      >
        {{ tick.text }}
      </text>
      <text
        v-for="tick in panel.yRight"
        :key="`yr-${tick.y}`"
        :x="width - panel.pad.r + 8"
        :y="tick.y + 4"
        class="chart-tick"
        text-anchor="start"
      >
        {{ tick.text }}
      </text>
      <text
        v-for="item in panel.labels"
        v-show="item.show"
        :key="item.label"
        :x="item.x"
        :y="panel.h - 8"
        class="chart-tick"
        text-anchor="end"
        :transform="`rotate(-40 ${item.x} ${panel.h - 8})`"
      >
        {{ item.label }}
      </text>
    </svg>
    <p class="chart-legend-row">
      <span v-for="item in panel.legend" :key="item.name">
        <i :style="{ background: item.color }" />{{ item.name }}
      </span>
    </p>
    </template>
    <p class="chart-caption">{{ chart.caption }}</p>
    <p v-if="hasDerived" class="chart-note">较淡的柱子和空心点，是用财年总数减去前三季得到的，不是单独申报的一季。</p>
    <p class="chart-note">{{ chart.note }}</p>
    <p class="chart-source">
      来源：
      <template v-for="(link, index) in links" :key="link.url">
        <span v-if="index">；</span>
        <a :href="link.url">{{ link.name }}</a>
      </template>
    </p>
  </figure>
</template>
