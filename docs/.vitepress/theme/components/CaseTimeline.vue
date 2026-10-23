<script setup>
import timelines from '../../../../data/cases/timelines.json'

const props = defineProps({
  id: { type: String, required: true }
})

const timeline = timelines[props.id]
if (!timeline) {
  throw new Error(`缺少时间线 ${props.id}`)
}

const phaseLabel = {
  trigger: '触发',
  spread: '传导',
  peak: '高点',
  trough: '低点',
  recovery: '恢复'
}
</script>

<template>
  <figure class="case-timeline">
    <figcaption class="chart-title">{{ timeline.title }}</figcaption>
    <ol>
      <li v-for="(event, index) in timeline.events" :key="`${event.date}-${index}`" :class="`phase-${event.phase}`">
        <span class="phase">{{ phaseLabel[event.phase] || event.phase }}</span>
        <time>{{ event.date }}</time>
        <p>{{ event.label }}</p>
      </li>
    </ol>
    <p class="chart-caption">{{ timeline.caption }}</p>
  </figure>
</template>
