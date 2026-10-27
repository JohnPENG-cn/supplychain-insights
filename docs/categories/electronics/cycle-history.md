---
title: 周期史：每次缺芯潮发生了什么、采购怎么吃亏
description: 2001 到 2026，几轮缺货和暴跌里，采购重复下单、忽视低值料、把停产通知当成普通涨价。
---

# 周期史：每次缺芯潮发生了什么、采购怎么吃亏

<!--@include: @/snippets/electronics-scenario-note.md-->

半导体大约几年就走一轮。缺的时候大家抢，松的时候库存砸在自己手里。下面每一段都先写公开报道里发生了什么，再写采购可以记住的教训。教训是判断。数字是事实的，都带了链接。

总的教训就一句：缺货时你下出去的订单，不等于客户的真需求。

每一段下面若已有单独案例，只保留教训和必要的数字，细节和出处到案例页，避免两处各写一套。怎么把这些事放进每周看盘，见 [怎么读周期](./how-to-read-the-cycle)。

## 先有一张年表

| 时期 | 发生了什么 | 有来源的数字 | 采购上的教训（判断） |
| --- | --- | --- | --- |
| 2000–2001 | 先缺货，订单下重了，需求一掉全变库存 | 2001 年销售额从 2040 亿美元跌到 1390 亿美元，跌 32% | 把「保供多下的单」和真需求分开记 |
| 2008–2009 | 需求骤降，原厂砍产能 | 2009 年春季 WSTS 预测全年跌 21.6% | 下行末期原厂产能已经砍掉，复苏时会反过来缺货 |
| 2017–2018 | MLCC 大缺货 | 国巨库存一度只剩约 35 天；交期普遍约 20 周 | 几分钱的电容也能停线 |
| 2019 | 存储价格大跌 | WSTS 春季预测全年跌 12.1% | 存储适合在下行时谈长约，不适合在山顶锁死价 |
| 2020–2022 | 疫情缺芯 | 2021 年有报道称 MCU 平均交期约 26.5 周 | 交期见顶，往往离周期见顶不远 |
| 2023 | 去库存 | 全球销售额 5268 亿美元，跌 8.2% | 原厂求单，适合谈价、做替代、清不可退货的尾巴 |
| 2025 | DDR4 停产潮，后来又延长 | 消费级 DDR4 合约价 2025 年第三季预计涨 40%–45% | 停产通知经常就是涨价通知 |
| 2025 年底–2026 | 存储超级周期，再扩散到其他料 | TrendForce 多次发布合约价仍在上涨的新闻，逐季格子不抄进本表 | 涨得慢了，还不等于见顶 |

## 2001：重复下单把跌幅放大了

1999 到 2000 年缺货，交期变长。品牌厂和代工厂把订单下到实际需要的两到三倍，生怕拿不到货。需求一旦掉下去，这些单子全变成库存。

::: fact
2001 年全球半导体销售额从 2040 亿美元跌到 1390 亿美元，跌幅 32%，EE Times 称为当时最大的一次下跌（[EE Times](https://www.eetimes.com/semiconductor-sales-suffered-worst-decline-ever-in-2001/)）。EDN 复盘时指出，重复下单和好几层看不见的库存，把过剩放大了（[EDN](https://www.edn.com/what-caused-the-glut/)）。
:::

判断：缺货时的订单量不是真需求。系统里要能分出「客户要的」和「怕断料多下的」。多下的那部分要有退出条件，不能和正式订单长得一模一样。

::: scenario
假设某颗料真实每周要用 5000 只，采购怕分配不够，按 15000 下了不可取消的单，同时还让现货商再找 5000。三个月后客户砍单，仓库里是真需求的三倍，而且退不掉。5000 和 15000 是假设。2001 年全行业跌 32% 是上面的事实，不要把假设倍数说成那一年的统计。
:::

## 2009：原厂把产能砍掉，第二年更容易缺

金融危机里需求骤降，原厂砍产能、裁员。

::: fact
WSTS 在 2009 年春季预测全年市场下跌 21.6%（[WSTS](https://www.wsts.org/76/103/WSTS-Semiconductor-Market-Forecast-Spring-2009)）。
:::

::: unknown
底稿里写过「2009 年实际全年跌幅大约 9%」，并标明那是凭记忆，没有逐条核对。这里不把它当成事实。
:::

判断：下行的时候原厂砍产能，复苏时供给跟不上，2010 年就出现过缺货。所以下行的最后一段，要开始看交期有没有止住变短，而不是还在全力砍安全库存。

## 2018：一颗电容停一条线

日系 MLCC 厂把产能转向车规和高端，手机用量又上来。普通规格变得很难买。涨价次数、库存天数、交期和 2018 年底渠道库存堆到半年以上，分出处写在 [MLCC 案例](./cases/mlcc-2017-2018)。6 月 12 日那篇台北时报写的是需求大约为出货的两倍、库存大约 35 天；四次涨价是 2017 年 11 月 20 日的另一篇，不要算进同一篇文章。

::: fact
Avnet Abacus 的回顾写到，交期普遍约 20 周，部分新单报到约 50 周（[Avnet Abacus](https://my.avnet.com/abacus/solutions/technologies/passive/capacitors/the-global-mlcc-shortage/)）。
:::

判断：低值料也要有第二来源，规格上留退路，比如封装从 0402 放到 0603，或者容值和耐压留一个能替代的组合。这些要在不缺的时候让研发写进 BOM，缺了再改板，产线等不起。

::: scenario
假设一块板子上有 40 颗同规格电容，采购金额每个月不到一箱主芯片。电容交期变成 20 周以后，主芯片库存再多也贴不了板。研发如果早留了「可用更大一号封装」的备注，采购还能改买有货的规格。40 颗是假设，20 周来自上面的公开回顾，不要混成同一份统计。
:::

## 2019：存储跌的时候，才是谈长约的窗口

::: fact
WSTS 2019 年春季预测全年市场下跌 12.1%（[WSTS](https://www.wsts.org/76/103/WSTS-Semiconductor-Market-Forecast-Spring-2019)）。
:::

判断：存储最像大宗商品。价格跌的时候谈 6 到 12 个月的量价，比在上涨段把价格签死要安全。美光自己的财年跌幅和 WSTS 秋季的行业数字，见 [2019 案例](./cases/dram-2018-2019)。上涨段怎么谈，见 [实战打法](./playbook) 和 [存储](./parts/memory)。

## 2021：交期长到半年，现货可以贵到离谱

车厂在疫情初期砍了芯片订单，后来又急着要；消费电子需求同时涨上来；8 英寸产能不够。

::: fact
Electronics Weekly 在 2021 年 8 月报道，MCU 平均交期约 26.5 周，部分料号 52 周（[Electronics Weekly](https://www.electronicsweekly.com/news/business/worst-chip-shortage-ever-2021-08/)）。有媒体转述 Susquehanna 的统计，平均交期在 2022 年 6 月大约 27 周见顶（[autoevolution 的转述](https://www.autoevolution.com/news/microchip-shortage-peaked-in-june-with-delivery-times-showing-a-modest-relief-192990.html)）。美联储后来有文章专门讲这轮缺芯和汽车减产（[美联储，2026-09-28 的笔记](https://www.federalreserve.gov/econres/notes/feds-notes/when-the-chips-went-down-motor-vehicle-production-and-the-2021-2022-semiconductor-shortages-accessible-20260928.htm)）。
:::

判断：现货价格可以到正常授权价的很多倍。交期不再变长的那一段，往往就是周期接近顶部的时候。交期是同步或者稍微领先的指标，不是马后炮。那珂火灾、德州停电和延冈火灾分开写在 [2021 年案例](./cases/shortage-2021)，不要把上面的行业周数算成某一场火单独造成的。

## 2023：去库存，是谈价和做替代的窗口

2022 年下半年渠道库存已经高，消费电子又弱。

::: fact
SIA 统计，2023 年全球销售额 5268 亿美元，比 2022 年下降 8.2%（[SIA](https://www.semiconductors.org/global-semiconductor-sales-decrease-8-2-in-2023-market-rebounds-late-in-year/)）。2024 年回到 6276 亿美元，增长 19.1%（[SIA](https://www.semiconductors.org/global-semiconductor-sales-increase-19-1-in-2024-double-digit-growth-projected-in-2025/)）。
:::

判断：这种时候原厂和代理都在找订单。适合压价、把国产第二来源导进 BOM、把 NCNR（下了就不能取消、也不能退货的订单）的尾巴谈掉，并降低安全库存。窗口会关。2024 年市场已经反弹。三星和美光当时怎么减产，见 [2023 案例](./cases/glut-2022-2023)。

## 2025：停产通知发出来，老料反而更贵

三大存储原厂把产能转向 DDR5 和 HBM（给 AI 用的高带宽内存），对 DDR4、LPDDR4 发了 EOL（停产通知）。

::: fact
TrendForce 整理的时间表：三星原计划 2025 年 6 月停止接 DDR4 订单；美光 2025 年 6 月发出 EOL，最后出货放在 2026 年第一季；海力士计划 2025 年 10 月停止接单（[TrendForce](https://www.trendforce.com/news/2025/07/09/news-ddr4-exit-timeline-unfolds-for-top-memory-makers-plans-for-samsung-sk-hynix-and-micron/)）。2025 年第三季消费级 DDR4 合约价预计上涨 40% 到 45%（[TrendForce](https://www.trendforce.com/presscenter/news/20250707-12633.html)）。7 月出现 8GB DDR4 模组价格高于同容量 DDR5 的倒挂。三星和海力士后来又把 DDR4 生产延长到 2026 年（[TrendForce](https://www.trendforce.com/news/2025/09/02/news-samsung-sk-hynix-reportedly-delay-phase-out-to-2026-as-ddr4-becomes-unexpected-cash-cow/)）。
:::

判断：EOL 通知就是涨价通知。收到 PCN（产品变更通知）或 EOL 之后，第一件事是算 LTB（停产前最后一次还能买的数量），同时启动换 DDR5 或换国产存储（比如长鑫）的验证。原厂后来延长生产，不代表你可以当没收到过那封信，延长本身就是因为老料变成了利润。

::: scenario
假设你还有一个产品要再用两年 DDR4。停产信到了以后，如果只把信转给研发，采购没有按未来 24 个月的用量算出最后一次要买多少，等现货涨起来再补，就只能追价。两年用量是假设。上面的涨幅和停产时间表是公开报道。
:::

## 2026：存储领涨，然后其他料跟着涨

AI 服务器占住先进产能，常规内存跟着紧。HBM 为什么更吃晶圆、原厂怎么说售罄，见 [HBM 案例](./cases/hbm-ddr)。

::: fact
TrendForce 在 2025 年底到 2026 年多次发布常规 DRAM 合约价仍在环比上涨的新闻，并在 2026-09-30 的新闻稿里给出当时对后面季度的看法（[TrendForce](https://www.trendforce.com/presscenter/news/20260930-13258.html)）。逐季涨幅以他们的新闻稿为准，这里不抄成表，也不引用二手汇总表上的格子。现货打开 [TrendForce 现货页](https://www.trendforce.com/price/dram/dram_spot) 看方向。
:::

判断：公开报道里的涨幅比早几个季度收窄时，价格仍可能在往上。涨得慢了，不等于见顶。要看现货有没有转跌，以及现货和合约价的差距有没有收拢。

同一年，涨价从存储扩散开。

::: fact
TrendForce 报道，德州仪器在 2026 年 4 月和 7 月两轮提价，代理侧提到的幅度在 15% 到 85%；恩智浦 6 月、意法半导体 4 月也有提价（[TrendForce](https://www.trendforce.com/news/2026/05/11/news-chip-price-hike-wave-builds-as-nxp-ti-reportedly-prepare-their-second-increases-this-year-for-june-and-july/)）。中微半导 1 月涨价 15%–50%（[中微半导新闻页](https://www.mcu.com.cn/about-news/1000.html)），兆易创新 3 月、5 月两轮（[与非网](https://www.eefocus.com/article/2067914.html)）。经济观察网报道，华润微、士兰微、扬杰 7 月涨价 10% 以上，有的到 15% 以上；MOSFET 和 IGBT 交期普遍超过 30 周，部分 52 周（[经济观察网](http://www.eeo.com.cn/2026/0712/954600.shtml)）。
:::

这些料接下来怎么谈，不在年表里展开，见 [实战打法](./playbook)。底稿写的时候把 2026 年 10 月判在上行段。你读到这页如果已经过了那个月，用 [指标](./indicators) 重新看一眼，不要直接沿用「现在还在涨」这句判断。

2026 年 10 月用海关和公告写的另外几层（磷化铟、光纤、封装基板里的低膨胀玻璃布）在 [产业链情报中心](/briefs/)。那些数字不抄进本页。
