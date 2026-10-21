<script setup>
import { withBase } from 'vitepress'
import catalogFile from '../../../../data/electronics/catalog.json'
import seriesFile from '../../../../data/electronics/series.json'

const indicators = Array.isArray(catalogFile.indicators) ? catalogFile.indicators : []
const series = Array.isArray(seriesFile.series) ? seriesFile.series : []
const status = typeof seriesFile.status === 'string' ? seriesFile.status : 'empty'
const updatedAt = seriesFile.updatedAt || ''
const note = typeof seriesFile.note === 'string' ? seriesFile.note : ''

const numberFormat = new Intl.NumberFormat('zh-CN', {
  maximumFractionDigits: 2
})

function numericPoints(item) {
  if (!item || !Array.isArray(item.points)) return []
  return item.points.filter(
    (point) => point && typeof point.value === 'number' && Number.isFinite(point.value)
  )
}

const plottable = series
  .map((item) => ({ item, points: numericPoints(item) }))
  .filter((entry) => entry.points.length > 0)

function formatValue(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  return numberFormat.format(value)
}

function chartOf(points) {
  const width = 640
  const height = 220
  const pad = { left: 64, right: 16, top: 16, bottom: 36 }
  const values = points.map((point) => point.value)
  let min = Math.min(...values)
  let max = Math.max(...values)
  if (min === max) {
    const padValue = Math.abs(min) > 0 ? Math.abs(min) * 0.05 : 1
    min -= padValue
    max += padValue
  }
  const span = max - min
  const innerWidth = width - pad.left - pad.right
  const innerHeight = height - pad.top - pad.bottom
  const coords = points.map((point, index) => {
    const x =
      pad.left +
      (points.length === 1 ? innerWidth / 2 : (index / (points.length - 1)) * innerWidth)
    const y = pad.top + (1 - (point.value - min) / span) * innerHeight
    return {
      x,
      y,
      date: String(point.date),
      value: point.value
    }
  })
  return {
    width,
    height,
    min,
    max,
    first: coords[0],
    last: coords[coords.length - 1],
    coords,
    line: coords.map((coord) => `${coord.x.toFixed(1)},${coord.y.toFixed(1)}`).join(' ')
  }
}
</script>

<template>
  <section class="indicator-board" aria-label="电子元器件指标">
    <div class="board-status">
      <span class="status status-wip">建设中</span>
      <p v-if="plottable.length === 0">
        这张清单还没有曲线。MLCC 不在这里，去
        <a :href="withBase('/dashboard/mlcc/')">MLCC 采购信号</a>。
        <code>data/electronics/series.json</code> 仍然是空的，不会拿猜测的数字画图。
      </p>
      <p v-else>
        已读到 {{ plottable.length }} 条带数值的序列。
        <template v-if="updatedAt">数据文件标注的更新日期是 {{ updatedAt }}。</template>
        每条曲线下面有来源链接，请以原文为准。
      </p>
      <p v-if="note">{{ note }}</p>
      <p v-if="status && status !== 'ok' && plottable.length === 0">当前文件状态：{{ status }}。</p>
    </div>

    <div v-if="plottable.length" class="charts">
      <article v-for="entry in plottable" :key="entry.item.id" class="chart-card">
        <h3>{{ entry.item.name || entry.item.id }}</h3>
        <p>
          <template v-if="entry.item.unit">单位：{{ entry.item.unit }}。</template>
          <template v-if="entry.item.frequency">频率：{{ entry.item.frequency }}。</template>
          <template v-if="entry.item.sourceName">来源：{{ entry.item.sourceName }}。</template>
          <a
            v-if="entry.item.sourceUrl"
            :href="entry.item.sourceUrl"
            target="_blank"
            rel="noopener noreferrer"
          >打开来源</a>
        </p>
        <p v-if="entry.item.note">{{ entry.item.note }}</p>
        <svg
          :viewBox="`0 0 ${chartOf(entry.points).width} ${chartOf(entry.points).height}`"
          role="img"
          :aria-label="`${entry.item.name || entry.item.id}曲线`"
        >
          <polyline class="line" :points="chartOf(entry.points).line" />
          <circle
            v-for="coord in chartOf(entry.points).coords"
            :key="coord.date"
            class="dot"
            :cx="coord.x"
            :cy="coord.y"
            r="3.5"
          >
            <title>{{ coord.date }}：{{ formatValue(coord.value) }}</title>
          </circle>
          <text class="axis" :x="8" :y="20">{{ formatValue(chartOf(entry.points).max) }}</text>
          <text class="axis" :x="8" :y="chartOf(entry.points).height - 28">
            {{ formatValue(chartOf(entry.points).min) }}
          </text>
          <text class="axis" :x="chartOf(entry.points).first.x" :y="chartOf(entry.points).height - 8">
            {{ chartOf(entry.points).first.date }}
          </text>
        </svg>
        <details>
          <summary>查看这 {{ entry.points.length }} 个数值</summary>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>日期</th>
                  <th>数值</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="point in entry.item.points" :key="point.date">
                  <td>{{ point.date }}</td>
                  <td>{{ formatValue(point.value) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </details>
      </article>
    </div>

    <div class="table-wrap">
      <table>
        <caption>
          计划跟踪的指标。这张表只有「去哪看」和「怎么理解」，没有行情数字。
        </caption>
        <thead>
          <tr>
            <th>指标</th>
            <th>去哪看</th>
            <th>频率</th>
            <th>是否免费</th>
            <th>怎么理解（判断）</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in indicators" :key="item.id">
            <td>
              <a
                v-if="item.sourceUrl"
                :href="item.sourceUrl"
                target="_blank"
                rel="noopener noreferrer"
              >{{ item.name }}</a>
              <template v-else>{{ item.name }}</template>
              <div v-if="item.public === false"><span class="status status-soon">不进公开仓库</span></div>
            </td>
            <td>{{ item.where }}</td>
            <td>{{ item.frequency }}</td>
            <td>{{ item.access }}</td>
            <td>{{ item.howToRead }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
