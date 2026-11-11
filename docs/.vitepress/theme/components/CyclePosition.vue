<script setup>
import { withBase } from 'vitepress'
import { buildChart } from '../../../../scripts/mlcc/chart.mjs'
import position from '../../../../data/mlcc/cycle-position.json'

const model = position

function signed(value, digits = 1) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(digits)}`
}

function chartOf(points, name, color) {
  return buildChart([
    {
      name,
      color,
      points: points.map((point) => ({ date: point.period, value: point.value }))
    }
  ])
}

const medianChart = chartOf(model.median.points, '中位营收同比', '#0f6b63')
const bookChart = chartOf(model.bookToBill.points, '村田电容器订单出货比', '#b45309')

function axisLabel(value, digits) {
  return signed(value, digits)
}
</script>

<template>
  <section id="cycle-position" class="mlcc-card" aria-label="周期位置">
    <div class="mlcc-head">
      <h2>周期位置</h2>
    </div>
    <p class="mlcc-gloss">
      这一节用<a :href="withBase('/columns/passive-cycle/data.csv')">被动元件公开数据集</a>自算，看这组账本在过去二十年里站在哪。
      它不预测下一次下行落在哪一季。14 个季度只说明这轮上行已经走了多久，不是确认的峰。
    </p>
    <p>{{ model.disclaimer }}</p>

    <article v-for="signal in model.lights" :key="signal.id" class="mlcc-card">
      <div class="mlcc-head">
        <h3>{{ signal.name }}</h3>
        <span v-if="signal.judgment" class="status status-judgment">判断</span>
        <span class="light" :class="`light-${signal.light}`">{{ signal.label }}</span>
      </div>
      <p class="mlcc-latest">{{ signal.latest }}</p>
      <p class="mlcc-gloss">{{ signal.rule }}</p>
    </article>

    <h3>中位营收同比</h3>
    <p class="mlcc-gloss">
      自算。至少 3 家、并且不是并购或改会计口径的季度，才进中位数。
      {{ model.median.latest.period }} 是 {{ signed(model.median.latest.value) }}%（{{ model.median.latest.n }} 家）。
      {{ model.median.latest.percentileN }} 个季度里有 {{ model.median.latest.percentileCount }} 个不高于这一季
      （{{ model.median.latest.percentile }}%）。历史中位数 {{ signed(model.median.latest.historyMedian) }}%，
      最高是 {{ model.median.latest.historyMaxPeriod }} 的 {{ signed(model.median.latest.historyMax) }}%。
      主要谷底间隔 {{ model.median.gaps.join('、') }} 个季度，平均 {{ model.median.averageGapQuarters }} 个季度，大约 3.6 年。
    </p>
    <figure v-if="medianChart" class="mlcc-chart">
      <figcaption>被动元件中位营收同比，2004 年到 {{ model.median.latest.period }}</figcaption>
      <svg :viewBox="`0 0 ${medianChart.width} ${medianChart.height}`" role="img" aria-label="被动元件中位营收同比">
        <polyline
          v-for="line in medianChart.polylines"
          :key="line.name"
          class="mlcc-line"
          :stroke="line.color"
          :points="line.points"
        />
        <text class="axis" :x="8" :y="16">{{ axisLabel(medianChart.max, 0) }}%</text>
        <text class="axis" :x="8" :y="medianChart.height - 24">{{ axisLabel(medianChart.min, 0) }}%</text>
        <text class="axis" :x="medianChart.firstX" :y="medianChart.height - 6">{{ medianChart.firstDate }}</text>
        <text class="axis axis-end" :x="medianChart.lastX" :y="medianChart.height - 6" text-anchor="end">
          {{ medianChart.lastDate }}
        </text>
      </svg>
    </figure>
    <ul class="mlcc-events">
      <li v-for="company in model.median.companies.filter((item) => item.value != null)" :key="company.name">
        {{ company.name }} {{ company.period }} {{ signed(company.value) }}%
        <template v-if="company.provisional">（7–9 月月营收相加，季报还没出）</template>
        <template v-if="!company.inMedian">。不进中位数。{{ company.breakNote }}</template>
        <a v-if="company.url" :href="company.url" target="_blank" rel="noopener noreferrer">来源</a>
      </li>
    </ul>

    <h3>村田电容器订单出货比</h3>
    <p class="mlcc-gloss">
      自算，等于电容器当季订单除以当季营收。
      {{ model.bookToBill.latest.previousPeriod }} {{ model.bookToBill.latest.previous.toFixed(2) }}，
      {{ model.bookToBill.latest.period }} {{ model.bookToBill.latest.value.toFixed(2) }}。
      样本最高在 {{ model.bookToBill.latest.maxPeriod }}。
      它领先中位营收同比大约 {{ model.bookToBill.lead.lag }} 个季度，相关系数 {{ model.bookToBill.lead.r }}
      （{{ model.bookToBill.lead.n }} 季，自算）。这是相关，不是到货日。
      <a :href="model.bookToBill.latest.url" target="_blank" rel="noopener noreferrer">2026 年 10 月 30 日村田短信</a>
    </p>
    <figure v-if="bookChart" class="mlcc-chart">
      <figcaption>村田电容器订单出货比</figcaption>
      <svg :viewBox="`0 0 ${bookChart.width} ${bookChart.height}`" role="img" aria-label="村田电容器订单出货比">
        <polyline class="mlcc-line" stroke="#b45309" :points="bookChart.polylines[0].points" />
        <text class="axis" :x="8" :y="16">{{ bookChart.max.toFixed(2) }}</text>
        <text class="axis" :x="8" :y="bookChart.height - 24">{{ bookChart.min.toFixed(2) }}</text>
        <text class="axis" :x="bookChart.firstX" :y="bookChart.height - 6">{{ bookChart.firstDate }}</text>
        <text class="axis axis-end" :x="bookChart.lastX" :y="bookChart.height - 6" text-anchor="end">
          {{ bookChart.lastDate }}
        </text>
      </svg>
    </figure>

    <h3>存货天数</h3>
    <p class="mlcc-gloss">{{ model.inventory.limitation }} 天数自算：期末存货 ÷ 当季营业成本 × 91。</p>
    <ul class="mlcc-events">
      <li v-for="company in model.inventory.companies" :key="company.name">
        {{ company.name }} {{ company.period }} {{ company.days }} 天，自身历史约第 {{ Math.round(company.percentile) }} 百分位，
        自家中位数 {{ company.medianDays }} 天。
        <template v-if="company.previous">上一季 {{ company.previous.period }} {{ company.previous.days }} 天。</template>
        <a :href="company.url" target="_blank" rel="noopener noreferrer">来源</a>
      </li>
    </ul>
    <p v-if="model.inventory.group" class="mlcc-note">
      四家都有数的最近一季是 {{ model.inventory.group.period }}，中位数 {{ model.inventory.group.days }} 天（{{ model.inventory.group.n }} 家）。
      2026 年第三季度只有村田和太阳诱电有存货，不再取中位数。
    </p>
    <p class="mlcc-note">
      长文、谷底表和另外几张图在
      <a :href="withBase('/columns/passive-cycle/twenty-years.html')">用二十年财报看被动元件</a>。
      上面 S2 的灯仍用人工台账，不和这里的长序列合成一个数。
    </p>
  </section>
</template>
