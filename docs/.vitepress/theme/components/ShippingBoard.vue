<script setup>
import { withBase } from 'vitepress'
import { buildChart } from '../../../../scripts/mlcc/chart.mjs'
import position from '../../../../data/shipping/position.json'

const model = position
const colors = { container: '#0f6b63', drybulk: '#b45309', tanker: '#1d4e89' }

function signed(value, digits = 1) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(digits)}`
}

function years(value) {
  if (typeof value !== 'number') return '—'
  return (Math.round(value * 10) / 10).toFixed(1)
}

function chartOf(segment) {
  const series = [
    {
      name: `${segment.name}中位数`,
      color: colors[segment.id],
      points: segment.points.map((point) => ({ date: point.period, value: point.value }))
    }
  ]
  if (segment.overlay) {
    series.push({
      name: `${segment.overlay.name}（不进中位数）`,
      color: '#66716f',
      dash: '5 4',
      points: segment.overlay.points.map((point) => ({ date: point.period, value: point.value }))
    })
  }
  return buildChart(series)
}

function barWidth(value) {
  return Math.max(2, Math.min(100, (value / 52) * 100))
}
</script>

<template>
  <section class="mlcc-board" aria-label="航运周期">
    <div class="callout callout-judgment">
      <p class="callout-title">判断</p>
      <p>{{ model.disclaimer }}</p>
    </div>

    <article v-for="segment in model.segments" :key="segment.id" class="mlcc-card">
      <div class="mlcc-head">
        <h2>{{ segment.name }}</h2>
        <span
          v-for="signal in segment.lights"
          :key="signal.id"
          class="light"
          :class="`light-${signal.light}`"
        >{{ signal.label }}</span>
      </div>
      <p class="mlcc-gloss">{{ segment.note }}</p>
      <p class="mlcc-latest">
        当前读数用 {{ segment.safe.period }}：中位同比 {{ signed(segment.safe.value) }}%（{{ segment.safe.n }} 家）。
        {{ segment.safe.percentileN }} 个季度里有 {{ segment.safe.percentileCount }} 个不高于这一季
        （{{ segment.safe.percentile }}%）。
      </p>
      <p v-if="segment.latest.thin" class="mlcc-note">
        {{ segment.latest.period }} 中位 {{ signed(segment.latest.value) }}% 只有 {{ segment.latest.n }} 家，只作参考，不当作这一组的当前结论。
      </p>
      <p class="mlcc-gloss">
        主要谷底 {{ segment.troughs.map((point) => point.period).join('、') }}。
        间隔 {{ segment.gaps.join('、') }} 个季度，平均 {{ years(segment.averageGapYears) }} 年。
        样本里最高 {{ segment.historyMax.period }} {{ signed(segment.historyMax.value) }}%，
        最低 {{ segment.historyMin.period }} {{ signed(segment.historyMin.value) }}%。
      </p>
      <p v-for="signal in segment.lights" :key="`${signal.id}-rule`" class="mlcc-gloss">{{ signal.rule }}</p>

      <figure v-if="chartOf(segment)" class="mlcc-chart">
        <figcaption>{{ segment.name }}中位营收同比。灰线若出现，是对照，不进中位数。</figcaption>
        <svg
          :viewBox="`0 0 ${chartOf(segment).width} ${chartOf(segment).height}`"
          role="img"
          :aria-label="`${segment.name}中位营收同比`"
        >
          <polyline
            v-for="line in chartOf(segment).polylines"
            :key="line.name"
            class="mlcc-line"
            :stroke="line.color"
            :stroke-dasharray="line.dash || undefined"
            :points="line.points"
          />
          <text class="axis" :x="8" :y="16">{{ signed(chartOf(segment).max, 0) }}%</text>
          <text class="axis" :x="8" :y="chartOf(segment).height - 24">{{ signed(chartOf(segment).min, 0) }}%</text>
          <text class="axis" :x="chartOf(segment).firstX" :y="chartOf(segment).height - 6">
            {{ chartOf(segment).firstDate }}
          </text>
          <text class="axis axis-end" :x="chartOf(segment).lastX" :y="chartOf(segment).height - 6" text-anchor="end">
            {{ chartOf(segment).lastDate }}
          </text>
        </svg>
        <p class="mlcc-legend">
          <span><i :style="{ background: colors[segment.id] }" />{{ segment.name }}中位数</span>
          <span v-if="segment.overlay"><i style="background: #66716f" />{{ segment.overlay.name }}（虚线，不进中位数）</span>
        </p>
      </figure>

      <ul class="mlcc-events">
        <li v-for="company in segment.companies" :key="company.name">
          {{ company.name }}
          <template v-if="company.value != null">
            {{ company.period }} {{ signed(company.value) }}%
            <a v-if="company.url" :href="company.url" target="_blank" rel="noopener noreferrer">这一季来源</a>
          </template>
          <template v-else>这一季没有进当前读数。</template>
          <template v-if="company.newestPeriod && company.newestPeriod !== segment.safe.period">
            最新已披露 {{ company.newestPeriod }} {{ signed(company.newestValue) }}%。
            <a v-if="company.newestUrl" :href="company.newestUrl" target="_blank" rel="noopener noreferrer">最新来源</a>
          </template>
        </li>
      </ul>
      <p v-if="segment.overlay && segment.overlay.latest" class="mlcc-note">
        {{ segment.overlay.name }} {{ segment.overlay.latest.period }} 同比 {{ signed(segment.overlay.latest.value) }}%，
        和中位数同期相关 {{ segment.overlay.correlation.r }}（{{ segment.overlay.correlation.n }} 季，自算）。不进中位数。
        <a :href="segment.overlay.latest.url" target="_blank" rel="noopener noreferrer">来源</a>
      </p>
      <p v-if="segment.halfYearOverlay && segment.halfYearOverlay.latest" class="mlcc-note">
        {{ segment.halfYearOverlay.name }}不进季度中位数，只作半年对照。
        {{ segment.halfYearOverlay.latest.period }} 分部营收同比 {{ signed(segment.halfYearOverlay.latest.value) }}%，
        同期两个季度中位数的平均是 {{ signed(segment.halfYearOverlay.latest.group) }}%。
        <template v-if="segment.halfYearOverlay.correlation">
          {{ segment.halfYearOverlay.correlation.from }} 到 {{ segment.halfYearOverlay.correlation.to }}，
          和这组半年平均相关 {{ segment.halfYearOverlay.correlation.r }}
          （{{ segment.halfYearOverlay.correlation.n }} 个半年，自算，断点半年已剔除）。
        </template>
        集团营收是油轮、干散货、集装箱等混在一起，不进任何一组。
        <a :href="segment.halfYearOverlay.latest.url" target="_blank" rel="noopener noreferrer">来源</a>
      </p>
    </article>

    <article class="mlcc-card">
      <div class="mlcc-head">
        <h2>订单簿占在役船队</h2>
        <span
          v-for="signal in model.supplyLights"
          :key="signal.id"
          class="light"
          :class="`light-${signal.light}`"
        >{{ signal.name }} {{ signal.label }}</span>
      </div>
      <p class="mlcc-gloss">
        全球那条线是历史对照。右边三根是约 2025 年初的分船型，不能把全球 15% 当成三组的共同结论。
        数字来自 UNCTAD《海运述评 2025》，估计值由 UNCTAD 转引 Clarksons。
        <a href="https://unctad.org/system/files/official-document/rmt2025_en.pdf" target="_blank" rel="noopener noreferrer">报告 PDF</a>
      </p>
      <div class="ic-bars">
        <div v-for="point in model.orderbook.global" :key="point.period" class="ic-bar">
          <span>全球 {{ point.label }}</span>
          <span class="ic-bar-track"><i class="ic-bar-fill" :style="{ width: `${barWidth(point.value)}%`, background: '#66716f' }" /></span>
          <b>{{ point.value }}%</b>
        </div>
        <div v-for="point in model.orderbook.bySegment" :key="point.id" class="ic-bar">
          <span>{{ point.name }} 约 2025 年初</span>
          <span class="ic-bar-track"><i class="ic-bar-fill" :style="{ width: `${barWidth(point.value)}%`, background: colors[point.id] }" /></span>
          <b>{{ point.value }}%</b>
        </div>
      </div>
      <ul class="mlcc-events">
        <li v-for="point in model.orderbook.fleet" :key="point.id">
          {{ point.name }} 2024 年船队载重吨同比 {{ signed(point.value) }}%（表 II.5，印刷页 54，实际）。
          <a :href="point.url" target="_blank" rel="noopener noreferrer">UNCTAD</a>
        </li>
      </ul>
      <p v-for="signal in model.supplyLights" :key="`${signal.id}-rule`" class="mlcc-gloss">
        <span class="status status-judgment">判断</span>
        {{ signal.latest }} {{ signal.rule }}
      </p>
      <p class="mlcc-note">{{ model.utilization }}</p>
      <p class="mlcc-note">
        三组的谷底表、公司运价和还缺什么，写在
        <a :href="withBase('/columns/shipping-cycle/twenty-years.html')">用财报看航运</a>。
        数据集在
        <a :href="withBase('/columns/shipping-cycle/data.csv')">data.csv</a>。
      </p>
    </article>
  </section>
</template>
