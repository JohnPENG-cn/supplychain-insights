<script setup>
import { onMounted, ref } from 'vue'
import { buildChart } from '../../../../scripts/mlcc/chart.mjs'
import { formatNumber, formatPercent, isoDate } from '../../../../scripts/mlcc/dates.mjs'
import { evaluateMlcc, formatChartValue } from '../../../../scripts/mlcc/signals.mjs'
import revenue from '../../../../data/mlcc/tw-monthly-revenue.json'
import meti from '../../../../data/mlcc/meti-ceramic-capacitors.json'
import bookToBill from '../../../../data/mlcc/manual/book-to-bill.json'
import leadTime from '../../../../data/mlcc/manual/lead-time.json'
import notices from '../../../../data/mlcc/manual/notices.json'
import turnWatch from '../../../../data/mlcc/manual/turn-watch.json'
import schedule from '../../../../data/mlcc/schedule.json'
import status from '../../../../data/mlcc/fetch-status.json'
import config from '../../../../data/mlcc/signal-config.json'

const input = { revenue, meti, bookToBill, leadTime, notices, turnWatch, schedule, status, config }
const fallbackToday = [status.twse?.lastAttemptAt, status.meti?.lastAttemptAt].filter(Boolean).sort().at(-1)
const model = ref(evaluateMlcc({ ...input, today: fallbackToday }))

onMounted(() => {
  const live = isoDate(new Date())
  if (live !== fallbackToday) model.value = evaluateMlcc({ ...input, today: live })
})

function chartOf(chart) {
  return buildChart(chart.series)
}

function axisLabel(value, format) {
  if (format === 'percent') return formatPercent(value, 0)
  return formatNumber(value, 0)
}

function linksOf(sources) {
  const seen = new Set()
  return (sources || []).filter((source) => {
    if (!source?.url || seen.has(source.url)) return false
    seen.add(source.url)
    return true
  })
}

const statusLabel = { tentative: '暂定', unverified: '日期未核实', confirmed: '', published: '已发布' }
</script>

<template>
  <section class="mlcc-board" aria-label="MLCC 采购信号">
    <p v-if="model.signals.some((signal) => signal.stale)" class="mlcc-stale-note">
      标着「数据过期」的，用的仍是上一笔成功的数。自动抓取失败了，或者过了该更新的日期。
    </p>

    <div class="callout callout-judgment">
      <p class="callout-title">整体判断</p>
      <p>
        <strong>{{ model.overall.highEndTitle }}。</strong>
        {{ model.overall.highEnd }}
      </p>
      <p>
        <strong>{{ model.overall.commodityTitle }}。</strong>
        {{ model.overall.commodity }}
      </p>
      <p>{{ model.overall.priceNote }}</p>
    </div>

    <article v-for="signal in model.signals" :key="signal.id" class="mlcc-card">
      <div class="mlcc-head">
        <h3>{{ signal.name }}</h3>
        <span v-if="signal.judgment" class="status status-judgment">判断</span>
        <span
          v-for="item in signal.lights"
          :key="`${item.name || 'light'}-${item.light}`"
          class="light"
          :class="`light-${item.light}`"
        >
          <template v-if="item.name">{{ item.name }} </template>{{ item.label }}
        </span>
        <span v-if="signal.stale" class="status status-stale">数据过期</span>
      </div>
      <p class="mlcc-latest">{{ signal.latest }}</p>
      <p class="mlcc-meta">数据日期 {{ signal.asOf }}。</p>
      <p v-if="signal.gloss" class="mlcc-gloss">{{ signal.gloss }}</p>

      <figure v-for="chart in signal.charts" :key="chart.title" class="mlcc-chart">
        <figcaption>{{ chart.title }}</figcaption>
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
          <circle
            v-for="dot in chartOf(chart).dots"
            :key="`${dot.name}-${dot.date}`"
            :cx="dot.x"
            :cy="dot.y"
            r="2.6"
            :fill="dot.color"
          >
            <title>{{ dot.name }} {{ dot.date }}：{{ formatChartValue(dot.value, chart.format) }}</title>
          </circle>
          <text class="axis" :x="8" :y="16">{{ axisLabel(chartOf(chart).max, chart.format) }}</text>
          <text class="axis" :x="8" :y="chartOf(chart).height - 24">
            {{ axisLabel(chartOf(chart).min, chart.format) }}
          </text>
          <text class="axis" :x="chartOf(chart).firstX" :y="chartOf(chart).height - 6">
            {{ chartOf(chart).firstDate }}
          </text>
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

      <ul v-if="signal.triggers" class="mlcc-triggers">
        <li v-for="trigger in signal.triggers" :key="trigger.id">
          <strong>{{ trigger.label }}。</strong>
          {{ trigger.text }}
        </li>
      </ul>

      <ul v-if="signal.events" class="mlcc-events">
        <li v-for="event in signal.events" :key="event.summary">
          <span class="status status-soon">{{ event.credibilityLabel }}</span>
          {{ event.date || '日期未单列' }}。{{ event.summary }}
          <a
            v-for="link in event.links"
            :key="link.url"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
          >{{ link.name }}</a>
        </li>
      </ul>
      <details v-if="signal.olderEvents && signal.olderEvents.length">
        <summary>更早的记录（不计入当前这盏灯）</summary>
        <ul class="mlcc-events">
          <li v-for="event in signal.olderEvents" :key="event.summary">
            <span class="status status-soon">{{ event.credibilityLabel }}</span>
            {{ event.date }}。{{ event.summary }}
            <a
              v-for="link in event.links"
              :key="link.url"
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
            >{{ link.name }}</a>
          </li>
        </ul>
      </details>

      <p><strong>建议动作。</strong>{{ signal.action }}</p>
      <p v-for="note in signal.notes" :key="note" class="mlcc-note">{{ note }}</p>
      <p v-if="!signal.events" class="mlcc-meta">
        来源：
        <a
          v-for="source in linksOf(signal.sources)"
          :key="source.url"
          :href="source.url"
          target="_blank"
          rel="noopener noreferrer"
        >{{ source.name }}</a>
      </p>
    </article>

    <aside class="mlcc-schedule">
      <h2>关键日程</h2>
      <ul>
        <li v-for="item in model.schedule" :key="item.text">
          <strong>{{ item.date || '日期未定' }}</strong>
          {{ item.text }}
          <template v-if="item.note">。{{ item.note }}</template>
          <template v-if="statusLabel[item.status]">（{{ statusLabel[item.status] }}）</template>
          <template v-if="item.past && item.status !== 'published'">（已过）</template>
          <a
            v-for="link in item.links || []"
            :key="link.url"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
          >{{ link.name }}</a>
        </li>
      </ul>
    </aside>
  </section>
</template>
