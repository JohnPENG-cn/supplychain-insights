import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import IndicatorBoard from './components/IndicatorBoard.vue'
import MlccBoard from './components/MlccBoard.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('IndicatorBoard', IndicatorBoard)
    app.component('MlccBoard', MlccBoard)
  }
} satisfies Theme
