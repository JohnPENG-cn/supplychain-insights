---
title: 产业链看板
description: 电子元器件指标看板还在建设。清单来自公开来源，没有行情数字。
---

# 产业链看板

<span class="status status-wip">建设中</span>

这里以后用来看电子元器件的公开指标：销售额、代工利用率、存储价格、代理出货、交期和下游 PMI。指标和「去哪看」来自 2026-10-20 那份采购底稿里的指标表。怎么理解，都标成判断。

现在没有曲线。`data/electronics/series.json` 是空的，页面发现没有序列，就只显示下面的清单。

<!--@include: @/snippets/electronics-note.md-->

读指标本身怎么用，看 [采购能免费跟踪的指标](/categories/electronics/indicators)。本页只回答两件事：准备跟踪哪些、数从哪进网站。

<IndicatorBoard />

## 数据以后从哪进网站

1. 指标名单在 `data/electronics/catalog.json`。要新增一条，先加名单，再允许写入数值。
2. 数值只写在 `data/electronics/series.json`。每条序列要有来源名称和链接，日期从早到晚，不能用文字代替数字。
3. 提交前运行 `npm run validate:data`。格式不对，网站构建会失败，错误数据不会发上去。
4. 文件进了 `main` 分支之后，GitHub Actions 会重新构建页面，曲线才会出现。

公司 ERP 里的承诺日期、到货数量、BOM 和料号留在内部。名单里那条「首次承诺和实际到货」被标成不公开，校验会拒绝把它写进序列文件。记账方法见 [供应商交期跟踪](/methods/delivery-tracking)。

取数的定时任务还没做。仓库的 `data/README.md` 里写了以后可以怎么接，包括一个尚未启用的工作流骨架。在取数脚本能逐条带来源之前，不要往 `series.json` 里填数。
