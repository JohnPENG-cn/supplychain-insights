<script setup>
import { buildChart } from '../../../../scripts/mlcc/chart.mjs'
import { formatPercent } from '../../../../scripts/mlcc/dates.mjs'
import { evaluateIc, formatChartValue, formatDays } from '../../../../scripts/ic/signals.mjs'
import quarters from '../../../../data/ic/quarters.json'
import management from '../../../../data/ic/manual/management.json'
import config from '../../../../data/ic/signal-config.json'

const model = evaluateIc({ quarters, management, config, today: '2026-11-11' })

function chartOf(chart) {
  return buildChart(chart.series)
}

function axisLabel(value, format) {
  if (format === 'percent') return formatPercent(value, 0)
  if (format === 'days') return formatDays(value)
  return String(value)
}

function linksOf(entry) {
  if (entry.links?.length) return entry.links
  if (entry.sourceUrl) return [{ name: entry.sourceName || '来源', url: entry.sourceUrl }]
  return []
}

function yoyText(value) {
  return formatPercent(value)
}
</script>

<template>
  <section class="mlcc-board" aria-label="IC 采购信号">
    <div class="callout callout-judgment">
      <p class="callout-title">判断</p>
      <p>{{ model.disclaimer }}</p>
      <p>
        这一组营收同比中位数的谷底是
        <template v-for="(point, index) in model.troughs.points" :key="point.period">
          {{ index ? '、' : '' }}{{ point.period }}
        </template>
        。相邻间隔 {{ model.troughs.gaps.join('、') }} 个季度，平均 {{ model.troughs.averageQuarters }} 个季度。
        加到最近一次谷底上，外推到 {{ model.troughs.extrapolated }}。这只是平均数往前推，大约 2027 年，不是预测。
      </p>
    </div>

    <article v-for="signal in model.lights" :key="signal.id" class="mlcc-card">
      <div class="mlcc-head">
        <h3>{{ signal.name }}</h3>
        <span class="status status-judgment">判断</span>
        <span
          v-for="item in signal.lights"
          :key="item.light"
          class="light"
          :class="`light-${item.light}`"
        >{{ item.label }}</span>
      </div>
      <p class="mlcc-latest">{{ signal.latest }}</p>
      <p v-if="signal.gloss" class="mlcc-gloss">{{ signal.gloss }}</p>
      <p><strong>建议动作。</strong>{{ signal.action }}</p>
      <ul v-if="signal.entries" class="mlcc-events">
        <li v-for="entry in signal.entries" :key="`${entry.company}-${entry.date}`">
          <span class="status status-soon">{{ entry.hitLabel }}</span>
          {{ entry.date }}，{{ entry.companyLabel || entry.company }} {{ entry.period }}。{{ entry.summary }}
          <a
            v-for="link in linksOf(entry)"
            :key="link.url"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
          >{{ link.name }}</a>
        </li>
      </ul>
    </article>

    <article class="mlcc-card">
      <div class="mlcc-head">
        <h3>最近一季</h3>
      </div>
      <p class="mlcc-gloss">
        营收同比和库存天数都是自算。同比是本季营收除以上年同季再减 1。库存天数是期末存货除以当季营业成本再乘 91。
        2026 年第三季的中位数，同比四舍五入是 +28%，库存天数四舍五入是 184 天。历史中位数 114 天，高点是 2025 年第一季的 205 天。
      </p>
      <h4>营收同比</h4>
      <div class="ic-bars">
        <div v-for="bar in model.bars.yoy" :key="bar.name" class="ic-bar">
          <span>{{ bar.name }}</span>
          <span class="ic-bar-track"><i class="ic-bar-fill" :style="{ width: `${bar.width}%`, background: bar.color }" /></span>
          <b>{{ bar.label }}</b>
        </div>
      </div>
      <h4>库存天数</h4>
      <div class="ic-bars">
        <div v-for="bar in model.bars.days" :key="bar.name" class="ic-bar">
          <span>{{ bar.name }}</span>
          <span class="ic-bar-track"><i class="ic-bar-fill" :style="{ width: `${bar.width}%`, background: bar.color }" /></span>
          <b>{{ bar.label }}</b>
        </div>
      </div>
      <ul class="mlcc-events">
        <li v-for="row in model.latest" :key="row.id">
          {{ row.name }} {{ row.period }}<template v-if="row.periodEnd">（截止 {{ row.periodEnd }}）</template>，
          同比 {{ yoyText(row.yoy) }}，库存天数 {{ formatDays(row.days) }}。
          <a v-if="row.revenueUrl" :href="row.revenueUrl" target="_blank" rel="noopener noreferrer">营收来源</a>
          <a v-if="row.inventoryUrl" :href="row.inventoryUrl" target="_blank" rel="noopener noreferrer">存货来源</a>
        </li>
      </ul>
    </article>

    <article v-for="chart in model.charts" :key="chart.title" class="mlcc-card">
      <h3>{{ chart.title }}</h3>
      <p class="mlcc-gloss">
        四家公司加中位数。并购季度仍画在公司线上，不进中位数。纵轴被 2010 年前后的高点和并购季度拉开，最近几季看上面的柱。
      </p>
      <figure class="mlcc-chart">
        <svg
          v-if="chartOf(chart)"
          :viewBox="`0 0 ${chartOf(chart).width} ${chartOf(chart).height}`"
          role="img"
          :aria-label="chart.title"
        >
          <polyline
            v-for="line in chartOf(chart).polylines"
            :key="line.name"
            class="mlcc-line"
            :stroke="line.color"
            :points="line.points"
          />
          <text class="axis" :x="8" :y="16">{{ axisLabel(chartOf(chart).max, chart.format) }}</text>
          <text class="axis" :x="8" :y="chartOf(chart).height - 24">{{ axisLabel(chartOf(chart).min, chart.format) }}</text>
          <text class="axis" :x="chartOf(chart).firstX" :y="chartOf(chart).height - 6">{{ chartOf(chart).firstDate }}</text>
          <text class="axis axis-end" :x="chartOf(chart).lastX" :y="chartOf(chart).height - 6" text-anchor="end">
            {{ chartOf(chart).lastDate }}
          </text>
        </svg>
        <p class="mlcc-legend">
          <span v-for="series in chart.series" :key="series.name">
            <i :style="{ background: series.color }" />{{ series.name }}
          </span>
        </p>
      </figure>
    </article>
  </section>
</template>
