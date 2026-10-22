---
title: HBM 挤占 DDR（2024–2026）
description: 美光说明 HBM 更吃晶圆，SK 海力士称 2026 年产出已售罄，常规 DRAM 跟着紧。
---

# 2024–2026：HBM 吃掉晶圆以后，DDR 也会紧

<!--@include: @/snippets/electronics-note.md-->

HBM 是把 DRAM 叠起来、给 AI 芯片用的高带宽内存。它和桌上的 DDR4、DDR5 用的是同一类晶圆产能。原厂把产能让给 HBM 和服务器内存之后，普通电脑和工控板上的 DDR 也会变紧，老的 DDR4 还会叠上停产。

合约价的逐季表格不抄。下面只引用公司自己的发言和新闻稿里的事件。

## 发生了什么

::: fact
美光 2024 年 6 月 26 日的发言稿写：业界生产同样位数的 HBM3E，大约要消耗 DDR5 三倍的晶圆（同一技术节点）。HBM4 因为性能和封装更复杂，这个倍数还会更高。美光的 HBM 在 2024 日历年已经售罄，2025 年绝大部分供给的价格也已经签出去（[美光发言稿 PDF](https://micron.gcs-web.com/static-files/4550f98c-1054-4847-a929-c17d520a0564)）。
:::

::: fact
路透社 2025 年 10 月 29 日报道，SK 海力士第三季利润创纪录，并表示次年（2026 年）的芯片产出已经全部售出，公司预期这轮超级周期还会延长，并计划从第四季推进 HBM4（[路透社](https://www.reuters.com/world/china/nvidia-supplier-sk-hynix-posts-record-q3-profit-meets-forecasts-2025-10-28/)）。
:::

DDR4 的停产时间表是另一层。三大原厂在 2025 年对 DDR4 发过停止接单或停产的安排，后来又有把生产延长到 2026 年的报道。日期以 TrendForce 的新闻稿为准，这里不把合约价逐季抄成表（[停产时间表](https://www.trendforce.com/news/2025/07/09/news-ddr4-exit-timeline-unfolds-for-top-memory-makers-plans-for-samsung-sk-hynix-and-micron/)、[延长生产的报道](https://www.trendforce.com/news/2025/09/02/news-samsung-sk-hynix-reportedly-delay-phase-out-to-2026-as-ddr4-becomes-unexpected-cash-cow/)）。站点里已有的叙述见 [周期史](../cycle-history)。

## 因果是怎么串起来的

判断：同样 1 吉位的产出，HBM 要更多晶圆，还要先进封装。AI 客户把这些晶圆和封装产能订走以后，剩下给 DDR4、DDR5 的就少。DDR4 再被标成停产，现货会先暴动，合约价跟着涨。原厂后来延长生产，往往是因为老产品变成了利润，不是因为你的工控板被当成了优先客户。

## 价格和交期怎么动

美光给的是晶圆倍数和售罄，不是 DDR 的美元报价。SK 海力士给的是「2026 年产出已售罄」。TrendForce 对 DDR4 合约价和现货有单独的新闻和现货页，打开原文看，不要从二手汇总表抄格子（[TrendForce 新闻稿列表](https://www.trendforce.com/presscenter)、[现货页](https://www.trendforce.com/price/dram/dram_spot)）。

判断：售罄指的是原厂产能被大客户订走，不代表你的代理下周零库存。你要看的是自己这颗 DDR 的确认交期，以及现货是不是连续几周还在涨。涨幅变小，仍然可能是涨。

## 买得好的和买砸的

判断。买得比较稳的：把 HBM 的晶圆倍数当成「DDR 供给被挤」的领先信号，而不是只看自己代理的口头交期。DDR4 的停产信到达后，按产品还要卖多久算出最后一次购买，同时启动 DDR5 或另一家原厂的验证。延长生产的新闻，用来重新算窗口，不用来把停产信从台账里删掉。长约写成跟公开合约价走，并写单季涨幅上限，不在这一段把价格钉死。

买砸的：看到 AI 新闻就把工控用的 DDR 按现货一次买满两个季度；或者认为「我们不用 HBM，所以 DDR 不关我们的事」。

## 一句教训

原厂把晶圆让给 HBM 以后，你没用到 HBM，DDR 的供给一样会紧。

日常打法见 [存储](../parts/memory)。怎么把这件事放进每周看盘，见 [怎么读周期](../how-to-read-the-cycle)。
