import { cpSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import container from 'markdown-it-container'
import { defineConfig } from 'vitepress'
import { tokenizeForSearch } from './chinese-search.mjs'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

function syncIndicatorData() {
  const source = resolve(repoRoot, 'data/electronics')
  const target = resolve(repoRoot, 'docs/public/data/electronics')
  mkdirSync(target, { recursive: true })
  cpSync(source, target, { recursive: true })
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      default:
        return '&#39;'
    }
  })
}

function labeledContainer(
  md: { use: Function },
  name: string,
  fallback: string,
  kind: string
) {
  md.use(container, name, {
    render(tokens: { info: string; nesting: number }[], idx: number) {
      const token = tokens[idx]
      const info = token.info.trim().slice(name.length).trim()
      if (token.nesting !== 1) return '</div>\n'
      const title =
        name === 'scenario'
          ? info
            ? `示例场景（虚构）：${escapeHtml(info)}`
            : '示例场景（虚构，不是真实公司或数字）'
          : escapeHtml(info || fallback)
      return `<div class="callout callout-${kind}"><p class="callout-title">${title}</p>\n`
    }
  })
}

const electronics = [
  { text: '这一类写什么', link: '/categories/electronics/' },
  { text: '产业链一张图看懂', link: '/categories/electronics/chain-map' },
  { text: '周期史：缺货时采购怎么吃亏', link: '/categories/electronics/cycle-history' },
  { text: '价格和交期为什么会变', link: '/categories/electronics/price-and-leadtime' },
  { text: '采购能免费跟踪的指标', link: '/categories/electronics/indicators' },
  { text: '实战打法', link: '/categories/electronics/playbook' },
  { text: '2026–2028 要关注什么', link: '/categories/electronics/outlook-2026-2028' },
  { text: '2026 年 10 月看点', link: '/categories/electronics/snapshot-2026-10' },
  { text: '名词就这一句话', link: '/categories/electronics/glossary' },
  { text: '这些地方先别当定论', link: '/categories/electronics/unknowns' }
]

export default defineConfig({
  title: '采购实战笔记',
  titleTemplate: ':title · 采购实战笔记',
  description:
    '给中国制造业采购、计划和新人看的供应链经验。大白话，带来源，有案例。先从电子元器件和芯片写起。',
  lang: 'zh-CN',
  // GitHub Pages 项目站地址是 /仓库名/。页面用 .html，目录页用 index，Pages 才能直接打开。
  base: '/supplychain-insights/',
  cleanUrls: false,
  srcExclude: ['snippets/**'],
  lastUpdated: true,
  sitemap: {
    hostname: 'https://johnpeng-cn.github.io/supplychain-insights/'
  },
  head: [
    ['link', { rel: 'icon', href: '/logo.svg', type: 'image/svg+xml' }],
    ['meta', { name: 'theme-color', content: '#0f6b63' }]
  ],
  markdown: {
    config(md) {
      labeledContainer(md, 'fact', '事实', 'fact')
      labeledContainer(md, 'judgment', '判断', 'judgment')
      labeledContainer(md, 'unknown', '未知', 'unknown')
      labeledContainer(md, 'scenario', '示例场景（虚构，不是真实公司或数字）', 'scenario')
    }
  },
  vite: {
    plugins: [
      {
        name: 'sync-indicator-data',
        buildStart: syncIndicatorData,
        configureServer: syncIndicatorData
      }
    ]
  },
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: '采购实战笔记',
    outline: { label: '本页目录', level: [2, 3] },
    nav: [
      { text: '首页', link: '/' },
      { text: '品类采购经验', link: '/categories/' },
      { text: '采购方法论', link: '/methods/' },
      { text: '产业链看板', link: '/dashboard/' }
    ],
    sidebar: [
      {
        text: '品类采购经验',
        items: [
          { text: '品类目录', link: '/categories/' },
          { text: '电子元器件与芯片', collapsed: false, items: electronics },
          { text: '钢材与金属件（即将上线）', link: '/categories/steel/' },
          { text: '塑料与化工原料（即将上线）', link: '/categories/plastics/' },
          { text: '机电件（即将上线）', link: '/categories/electromechanical/' }
        ]
      },
      {
        text: '采购方法论',
        items: [
          { text: '方法目录', link: '/methods/' },
          { text: '采购计划均衡：削峰要有边界', link: '/methods/leveling' },
          { text: '供应商交期跟踪', link: '/methods/delivery-tracking' }
        ]
      },
      {
        text: '产业链看板',
        items: [
          { text: '看板目录', link: '/dashboard/' },
          { text: 'MLCC 采购信号', link: '/dashboard/mlcc/' }
        ]
      }
    ],
    search: {
      provider: 'local',
      options: {
        miniSearch: {
          options: {
            tokenize: tokenizeForSearch
          },
          searchOptions: {
            fuzzy: false,
            prefix: true,
            boost: { title: 4, text: 2, titles: 1 }
          }
        },
        translations: {
          button: {
            buttonText: '搜索',
            buttonAriaLabel: '搜索文章'
          },
          modal: {
            displayDetails: '显示详细列表',
            resetButtonTitle: '清除',
            backButtonTitle: '返回',
            noResultsText: '没有找到相关内容',
            footer: {
              selectText: '打开',
              selectKeyAriaLabel: '回车打开',
              navigateText: '上下移动',
              navigateUpKeyAriaLabel: '向上',
              navigateDownKeyAriaLabel: '向下',
              closeText: '关闭',
              closeKeyAriaLabel: '退出搜索'
            }
          }
        }
      }
    },
    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },
    editLink: {
      pattern: 'https://github.com/JohnPENG-cn/supplychain-insights/edit/main/docs/:path',
      text: '在 GitHub 上修改本页'
    },
    lastUpdated: {
      text: '本页更新'
    },
    footer: {
      message: '事实带来源。判断要自己核对。示例场景都是虚构的。',
      copyright: '数字以文章里的原文链接为准'
    },
    darkModeSwitchLabel: '外观',
    lightModeSwitchTitle: '切换到浅色',
    darkModeSwitchTitle: '切换到深色',
    sidebarMenuLabel: '菜单',
    returnToTopLabel: '回到顶部',
    skipToContentLabel: '跳到正文',
    notFound: {
      code: '404',
      title: '找不到这一页',
      quote: '链接可能写错了，或者这篇文章还没写。',
      linkLabel: '回到首页',
      linkText: '回首页'
    },
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/JohnPENG-cn/supplychain-insights'
      }
    ]
  }
})
