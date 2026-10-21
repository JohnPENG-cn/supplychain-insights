---
title: 产业链看板
description: MLCC 采购信号已上线。其他电子元器件指标还在建设中，没有存储行情。
---

# 产业链看板

MLCC 采购信号已经上线。半导体销售额、代工利用率、代理出货、交期指数这些仍是 <span class="status status-wip">建设中</span>，没有曲线。这页不放存储行情。

| 看板 | 状态 |
| --- | --- |
| [MLCC 采购信号](/dashboard/mlcc/) | 已上线 |
| 下面这张电子元器件指标清单 | 建设中 |

<!--@include: @/snippets/electronics-note.md-->

读指标本身怎么用，看 [采购能免费跟踪的指标](/categories/electronics/indicators)。MLCC 的灯和动作在 [采购信号](/dashboard/mlcc/)。

<IndicatorBoard />

## 数据从哪进网站

MLCC 的台湾月营收和日本产量由定时任务写入 `data/mlcc/`。订单出货比、交期灯、涨价台账要人工改，步骤见仓库 README 的「更新 MLCC 看板」。

其他指标还没接上：

1. 指标名单在 `data/electronics/catalog.json`。要新增一条，先加名单，再允许写入数值。
2. 数值只写在 `data/electronics/series.json`。每条序列要有来源名称和链接，日期从早到晚，不能用文字代替数字。
3. 提交前运行 `npm run validate:data`。格式不对，网站构建会失败。
4. 文件进了 `main` 分支之后，GitHub Actions 会重新构建页面。

公司 ERP 里的承诺日期、到货数量、BOM 和料号留在内部。名单里那条「首次承诺和实际到货」被标成不公开，校验会拒绝把它写进序列文件。记账方法见 [供应商交期跟踪](/methods/delivery-tracking)。

`data/electronics/series.json` 现在仍是空的。不要为了看效果填假数，也不要把存储价格写进公开仓库。
