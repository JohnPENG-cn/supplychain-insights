<script setup>
import board from '../../../../data/soy/board.json'
</script>

<template>
  <section class="mlcc-board" aria-label="大豆周期信号">
    <div class="callout callout-judgment">
      <p class="callout-title">判断</p>
      <p>{{ board.disclaimer }}</p>
      <p class="mlcc-gloss">读数对应 {{ board.asOf }}，页面更新 {{ board.updated }}。黄灯是中间档，绿灯是供应偏松的一侧，灰灯表示这盏只作背景。</p>
    </div>

    <article v-for="signal in board.lights" :key="signal.id" class="mlcc-card">
      <div class="mlcc-head">
        <h3>{{ signal.name }}</h3>
        <span class="status status-judgment">判断</span>
        <span class="light" :class="`light-${signal.light}`">{{ signal.label }}</span>
      </div>
      <p class="mlcc-gloss">{{ signal.role }}</p>
      <p class="mlcc-latest">{{ signal.latest }}</p>
      <p class="mlcc-note">{{ signal.note }}</p>
    </article>
  </section>
</template>
