<script setup lang="ts">
import { withBase } from 'vitepress'

defineProps<{
  src: string
  duration: string
}>()
</script>

<template>
  <figure class="listen">
    <audio controls preload="metadata" :src="withBase(src)">
      <source :src="withBase(src)" type="audio/mpeg" />
    </audio>
    <figcaption>
      听这篇（约{{ duration }}）：口语版，来源和脚注部分不念，完整出处见文末
    </figcaption>
  </figure>
</template>
