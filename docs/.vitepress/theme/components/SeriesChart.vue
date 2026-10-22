<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import charts from '../../../../data/cases/charts.json'

const props = defineProps({
  id: { type: String, required: true }
})

const chart = charts[props.id]
if (!chart) {
  throw new Error(`缺少图表 ${props.id}`)
}

const colors = ['#0f6b63', '#c2410c', '#1d4ed8', '#9f1239']
const font = "var(--vp-font-family-base), 'PingFang SC', 'Noto Sans SC', 'Microsoft YaHei', sans-serif"
const plotHeight = 268
const root = ref(null)
const plotWidth = ref(680)
const tip = ref(null)
let observer

const hasDerived = chart.series.some((item) => item.points.some((point) => point.derived))
const links = chart.sources?.length ? chart.sources : [chart.source]

function panelGroups(series) {
  const main = series.filter((item) => !item.panel)
  const extras = new Map()
  for (const item of series) {
    if (!item.panel) continue
    if (!extras.has(item.panel)) extras.set(item.panel, [])
    extras.get(item.panel).push(item)
  }
  return [main, ...extras.values()].filter((group) => group.length)
}

function niceStep(span, count) {
  const rough = span / Math.max(count, 1)
  if (!Number.isFinite(rough) || rough <= 0) return 1
  const pow = 10 ** Math.floor(Math.log10(rough))
  const n = rough / pow
  const mult = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10
  return mult * pow
}

function niceAxis(values, pinZero) {
  let min = Math.min(...values)
  let max = Math.max(...values)
  if (pinZero) min = Math.min(0, min)
  if (min > 0 && min < max * 0.2) min = 0
  if (min === max) max = min + 1
  const step = niceStep(max - min || 1, 6)
  const start = Math.floor(min / step + 1e-9) * step
  const end = Math.ceil(max / step - 1e-9) * step
  const ticks = []
  for (let value = start; value <= end + step * 0.01; value += step) {
    ticks.push(Math.round(value * 1000) / 1000)
  }
  return { min: ticks[0], max: ticks[ticks.length - 1], ticks }
}

function labelPad(ticks, unit) {
  const widest = Math.max(...ticks.map((value) => formatNumber(value, unit).length))
  return Math.ceil(36 + widest * 7)
}

function formatNumber(value, unit) {
  const rounded = Math.abs(value - Math.round(value)) < 0.05 ? Math.round(value) : Math.round(value * 10) / 10
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
  if (unit === '%') return `${text}%`
  return text
}

function buildPanel(series, width) {
  const labels = []
  for (const item of series) {
    for (const point of item.points) {
      if (!labels.includes(point.x)) labels.push(point.x)
    }
  }
  const leftSeries = series.filter((item) => item.axis !== 'right')
  const rightSeries = series.filter((item) => item.axis === 'right')
  const money = (item) => item.unit === '亿美元' || item.unit === '新台币亿元'
  const pinLeft = leftSeries.some((item) => item.kind === 'bar' || money(item) || item.points.some((point) => point.y < 0))
  const pinRight = rightSeries.some((item) => item.points.some((point) => point.y < 0))
  const left = niceAxis(leftSeries.flatMap((item) => item.points.map((point) => point.y)), pinLeft)
  const right = rightSeries.length
    ? niceAxis(rightSeries.flatMap((item) => item.points.map((point) => point.y)), pinRight)
    : null
  const leftUnit = leftSeries[0]?.unit || ''
  const rightUnit = rightSeries[0]?.unit || ''
  const pad = { l: labelPad(left.ticks, leftUnit), r: right ? labelPad(right.ticks, rightUnit) : 16, t: 12, b: 32 }
  const plotW = width - pad.l - pad.r
  const plotH = plotHeight - pad.t - pad.b
  const slot = plotW / Math.max(labels.length, 1)

  function xAt(label) {
    return pad.l + (labels.indexOf(label) + 0.5) * slot
  }
  function yAt(value, scale) {
    return pad.t + ((scale.max - value) / (scale.max - scale.min || 1)) * plotH
  }

  const barSeries = series.filter((item) => item.kind === 'bar')
  const barW = Math.min(18, slot * 0.62)
  const shapes = []
  series.forEach((item, seriesIndex) => {
    const scale = item.axis === 'right' ? right : left
    const color = colors[seriesIndex % colors.length]
    if (item.kind === 'bar') {
      const barIndex = barSeries.indexOf(item)
      const offset = (barIndex - (barSeries.length - 1) / 2) * barW
      for (const point of item.points) {
        const x = xAt(point.x) + offset - barW / 2
        const y = yAt(point.y, scale)
        const base = yAt(0, scale)
        shapes.push({
          type: 'bar',
          x,
          y: Math.min(y, base),
          w: Math.max(2, barW - 3),
          h: Math.max(1, Math.abs(base - y)),
          color,
          derived: !!point.derived
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

  const monthGap = (a, b) => {
    const [y1, m1] = a.split('-').map(Number)
    const [y2, m2] = b.split('-').map(Number)
    return (y2 - y1) * 12 + (m2 - m1)
  }
  const monthly = labels.length > 16 && labels.every((label, index) => index === 0 || monthGap(labels[index - 1], label) === 1)
  const minGap = 76
  let labelStep = 1
  if (!monthly) {
    while (slot * labelStep < minGap && labelStep < labels.length) labelStep += 1
  }
  const julyGap = slot * 6
  const shown = labels.map((label, index) => ({
    label,
    x: xAt(label),
    show: monthly
      ? label.endsWith('-01') || (julyGap >= minGap && label.endsWith('-07'))
      : index % labelStep === 0
  }))

  const byX = new Map()
  series.forEach((item, seriesIndex) => {
    for (const point of item.points) {
      if (!byX.has(point.x)) byX.set(point.x, { x: xAt(point.x), label: point.x, rows: [] })
      byX.get(point.x).rows.push({
        name: item.name,
        color: colors[seriesIndex % colors.length],
        text: item.unit === '%' ? formatNumber(point.y, item.unit) : `${formatNumber(point.y, item.unit)} ${item.unit}`,
        derived: !!point.derived
      })
    }
  })

  return {
    h: plotHeight,
    pad,
    yLeft: left.ticks.map((value) => ({ y: yAt(value, left), text: formatNumber(value, leftSeries[0]?.unit) })),
    yRight: right ? right.ticks.map((value) => ({ y: yAt(value, right), text: formatNumber(value, rightSeries[0]?.unit) })) : [],
    yLeftTitle: leftUnit,
    yRightTitle: rightUnit,
    labels: shown,
    shapes,
    groups: [...byX.values()],
    legend: series.map((item, index) => ({
      name: item.name,
      unit: item.unit,
      color: colors[index % colors.length]
    })),
    zeroY: left.min < 0 && left.max > 0
      ? yAt(0, left)
      : right && right.min < 0 && right.max > 0
        ? yAt(0, right)
        : null
  }
}

function panelsOf(width) {
  return panelGroups(chart.series).map((series) => buildPanel(series, width))
}

const panels = ref(panelsOf(plotWidth.value))

function resize() {
  const el = root.value
  if (!el) return
  const style = getComputedStyle(el)
  const pad = (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0)
  const width = el.clientWidth - pad
  if (!width) return
  const next = Math.max(320, Math.min(760, Math.floor(width)))
  if (next === plotWidth.value) return
  plotWidth.value = next
  panels.value = panelsOf(next)
  tip.value = null
}

function move(event, panelIndex) {
  const panel = panels.value[panelIndex]
  const rect = event.currentTarget.getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width) * plotWidth.value
  let best = null
  let bestDist = Infinity
  for (const group of panel.groups) {
    const dist = Math.abs(group.x - x)
    if (dist < bestDist) {
      bestDist = dist
      best = group
    }
  }
  if (!best || bestDist > 28) {
    tip.value = null
    return
  }
  const left = (best.x / plotWidth.value) * rect.width
  tip.value = {
    panelIndex,
    left: Math.min(Math.max(left, 8), rect.width - 8),
    title: best.label,
    rows: best.rows,
    x: best.x
  }
}

function leave() {
  tip.value = null
}

onMounted(() => {
  resize()
  observer = new ResizeObserver(resize)
  if (root.value) observer.observe(root.value)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <figure ref="root" class="series-chart">
    <figcaption class="chart-title">{{ chart.title }}</figcaption>
    <div v-for="(panel, panelIndex) in panels" :key="panelIndex" class="chart-panel">
      <ul class="chart-legend">
        <li v-for="item in panel.legend" :key="item.name">
          <span class="chart-swatch" :style="{ background: item.color, display: 'inline-block', width: '0.7rem', height: '0.7rem', borderRadius: '2px', marginRight: '0.35rem' }" />
          {{ item.name }}
          <span class="chart-unit">{{ item.unit }}</span>
        </li>
      </ul>
      <div class="chart-plot" @mousemove="move($event, panelIndex)" @mouseleave="leave">
        <svg
          :viewBox="`0 0 ${plotWidth} ${panel.h}`"
          :width="plotWidth"
          :height="panel.h"
          role="img"
          :aria-label="chart.title"
          :style="{ fontFamily: font, fontSize: '12px', maxWidth: '100%', height: 'auto' }"
        >
          <text
            v-if="panel.yLeftTitle"
            x="14"
            :y="panel.h / 2"
            class="chart-axis"
            text-anchor="middle"
            :transform="`rotate(-90 14 ${panel.h / 2})`"
          >
            {{ panel.yLeftTitle }}
          </text>
          <text
            v-if="panel.yRightTitle"
            :x="plotWidth - 14"
            :y="panel.h / 2"
            class="chart-axis"
            text-anchor="middle"
            :transform="`rotate(90 ${plotWidth - 14} ${panel.h / 2})`"
          >
            {{ panel.yRightTitle }}
          </text>
          <line
            v-for="tick in panel.yLeft"
            :key="`g-${tick.y}`"
            :x1="panel.pad.l"
            :x2="plotWidth - panel.pad.r"
            :y1="tick.y"
            :y2="tick.y"
            class="chart-grid"
          />
          <line
            v-if="panel.zeroY != null"
            :x1="panel.pad.l"
            :x2="plotWidth - panel.pad.r"
            :y1="panel.zeroY"
            :y2="panel.zeroY"
            class="chart-zero"
          />
          <line
            v-if="tip && tip.panelIndex === panelIndex"
            :x1="tip.x"
            :x2="tip.x"
            :y1="panel.pad.t"
            :y2="panel.h - panel.pad.b"
            class="chart-hover"
          />
          <template v-for="(shape, shapeIndex) in panel.shapes" :key="shapeIndex">
            <rect
              v-if="shape.type === 'bar'"
              :x="shape.x"
              :y="shape.y"
              :width="shape.w"
              :height="shape.h"
              :fill="shape.color"
              :opacity="shape.derived ? 0.45 : 0.92"
              rx="1.5"
            />
            <g v-else>
              <path :d="shape.d" :stroke="shape.color" fill="none" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
              <circle
                v-for="(point, pointIndex) in shape.points"
                :key="pointIndex"
                :cx="point.x"
                :cy="point.y"
                :r="point.derived ? 3.5 : 2.4"
                :fill="point.derived ? 'var(--vp-c-bg-elv, #fff)' : shape.color"
                :stroke="shape.color"
                stroke-width="1.6"
              />
            </g>
          </template>
          <text
            v-for="tick in panel.yLeft"
            :key="`yl-${tick.text}-${tick.y}`"
            :x="panel.pad.l - 8"
            :y="tick.y + 4"
            class="chart-tick"
            text-anchor="end"
          >
            {{ tick.text }}
          </text>
          <text
            v-for="tick in panel.yRight"
            :key="`yr-${tick.text}-${tick.y}`"
            :x="plotWidth - panel.pad.r + 8"
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
            text-anchor="middle"
          >
            {{ item.label }}
          </text>
        </svg>
        <div
          v-if="tip && tip.panelIndex === panelIndex"
          class="chart-tip"
          :style="{ left: `${tip.left}px` }"
        >
          <p class="chart-tip-title">{{ tip.title }}</p>
          <p v-for="row in tip.rows" :key="row.name">
            <span class="chart-swatch" :style="{ background: row.color, display: 'inline-block', width: '0.55rem', height: '0.55rem', borderRadius: '2px', marginRight: '0.35rem' }" />
            {{ row.name }} {{ row.text }}<template v-if="row.derived">，财年减去前三季</template>
          </p>
        </div>
      </div>
    </div>
    <p class="chart-caption">{{ chart.caption }}</p>
    <details class="chart-details">
      <summary>数据说明</summary>
      <p>{{ chart.note }}</p>
      <p v-if="hasDerived">较淡的柱子和空心点，是用财年总数减去前三季得到的，不是单独申报的一季。</p>
      <p>
        来源：
        <template v-for="(link, index) in links" :key="link.url">
          <span v-if="index">；</span>
          <a :href="link.url">{{ link.name }}</a>
        </template>
      </p>
    </details>
  </figure>
</template>
