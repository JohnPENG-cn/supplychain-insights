import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import IndicatorBoard from './components/IndicatorBoard.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('IndicatorBoard', IndicatorBoard)
  }
} satisfies Theme
