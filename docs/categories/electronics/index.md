---
title: 电子元器件与芯片
description: 给电子元器件和芯片采购、计划看的一页结论，以及这组文章的目录。
---

# 电子元器件与芯片

<!--@include: @/snippets/electronics-note.md-->

写给把电子料当成第一大采购品类的人：采购、计划，还有刚开始管 BOM 的新人。看完应能回答三件事：货和定价权在链条的哪一层，这轮周期走到哪了，该保供还是该压价。

## 先看这五句

1. **这轮是 AI 拉动、存储领涨，涨价已经蔓延到模拟、功率、MCU、MLCC 和电阻。** 事实：SIA 公布 2026 年 8 月全球半导体销售额 1597 亿美元，同比增加 144.3%，连续 18 个月增长（[SIA](https://www.semiconductors.org/year-to-date-global-semiconductor-sales-top-1-trillion-through-august/)）。WSTS 预计 2026 年全球市场 1.655 万亿美元，同比增加 108%，其中存储 8039 亿美元，同比增加 249.5%（[WSTS 新闻稿 PDF](https://www.wsts.org/esraCMS/extension/media/f/WST/7745/WSTS-Q2-Release-2026-08-06.pdf)）。
2. **同比涨一倍多，主要是存储价格涨出来的，不代表你手上的通用料都缺成这样。** 判断。同一份 WSTS 里，模拟芯片 2026 年预计 954 亿美元，分立器件 332 亿美元，增速远低于存储。看你自己那几颗料，比看大盘有用。
3. **2026 年 9 月的信号是：涨价的面变宽了，交期的劲变小了。** 事实：Lytica 9 月元器件价格指数环比增加 2.98%，是当年到那时的最高；31 个品类里 30 个在涨。整体交期指数从 8 月的增加 12.4%，回落到增加 1.89%（[Lytica](https://lytica.com/state-of-the-electronic-components-market-september-2026/)）。判断：这很像原厂用价格管需求。货还能拿到，但要按新价。
4. **离底稿最近的不确定，是 11 月 9 日和 11 月 10 日两个政策节点。** 事实：美国商务部工业与安全局「50% 关联方规则」的暂停期到 2026-11-09 结束；中国稀土出口管制的暂停到 11 月 10 日结束。政治层面宣布的休战延长两个月，到 2027-01-10，但截至相关报道时还没见到对应的法律文本（[technology.org](https://www.technology.org/2026/10/19/china-rare-earth-export-pause-november-10/)、[Politico](https://www.politico.com/news/2026/09/23/u-s-china-trade-truce-extended-two-months-01091121)）。
5. **给采购的一句话：上行周期里，最贵的往往不是涨价，而是断料。** 判断：先保供，再谈价，同时严防重复下单。事实：2001 年全球半导体销售额从 2040 亿美元跌到 1390 亿美元，跌幅 32%，是当时看到的最大跌幅（[EE Times](https://www.eetimes.com/semiconductor-sales-suffered-worst-decline-ever-in-2001/)）。缺货时重复下单、渠道里叠了好几层库存，把后来的跌幅放大了（[EDN](https://www.edn.com/what-caused-the-glut/)）。

## 按料拆开

跨子类的地图和打法还在下面原来的文章里。每一类料自己的供应商、周期信号、坑、长约和检查清单，分开写：

1. [怎么读周期](./how-to-read-the-cycle)：把各类信号放在一起，并链到 [MLCC 采购信号](/dashboard/mlcc/)。
2. [存储 DRAM / NAND](./parts/memory)
3. [MLCC、电阻、电感和钽电容](./parts/mlcc-passives)
4. [MCU 和通用芯片](./parts/mcu)
5. [模拟和电源](./parts/analog-power)
6. [分立器件](./parts/discretes)
7. [连接器](./parts/connectors)
8. [晶振和振荡器](./parts/crystals)
9. [PCB 和覆铜板](./parts/pcb-ccl)
10. [显示](./parts/displays)

能核对到原文的缺货、跌价、天灾和管制，收在 [历史案例](./cases/)。

## 这组文章怎么读

按这个顺序，前面是地图，后面是动作。子类页面不重复这里的全文，只写这类料不一样的地方。

1. [产业链一张图看懂](./chain-map)：钱和话语权在哪一层。
2. [周期史：每次缺芯潮发生了什么](./cycle-history)：同样的错，2001、2018、2021、2025 都犯过。
3. [价格和交期为什么会变](./price-and-leadtime)：五个会让报价改口的开关。
4. [采购能免费跟踪的指标](./indicators)：不用买研报也能看的表。
5. [实战打法](./playbook)：锁价、备货、停产、国产替代、防假货。
6. [2026–2028 要关注什么](./outlook-2026-2028)：AI 挤产能、成熟制程扩产、出口管制和关税。
7. [2026 年 10 月看点](./snapshot-2026-10)：底稿那一周的记录。过期了就当历史，不要当成今天的行情。

名词第一次出现都会用一句话解释。[名词就这一句话](./glossary) 可以回头查。[这些地方先别当定论](./unknowns) 把没核实的数字集中放在一起。

MLCC 的公开信号在 [采购信号看板](/dashboard/mlcc/)。其他指标还没接上曲线。

磷化铟衬底、光纤、封装基板里的低膨胀玻璃布，不在这组「怎么买」的文章里。公开信号记在 [产业链情报中心](/briefs/)。
