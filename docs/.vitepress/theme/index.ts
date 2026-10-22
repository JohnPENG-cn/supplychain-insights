import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import IndicatorBoard from './components/IndicatorBoard.vue'
import MlccBoard from './components/MlccBoard.vue'
import CaseTimeline from './components/CaseTimeline.vue'
import SeriesChart from './components/SeriesChart.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('IndicatorBoard', IndicatorBoard)
    app.component('MlccBoard', MlccBoard)
    app.component('CaseTimeline', CaseTimeline)
    app.component('SeriesChart', SeriesChart)
  }
} satisfies Theme
