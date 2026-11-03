---
title: 塑料与化工原料
description: 给 ICT 采购看的塑料和化工原料：先看外壳、连接器、线缆和特种料，再看其余三类。
---

# 塑料与化工原料

<!--@include: @/snippets/plastics-note.md-->

写给 ICT 和工厂里买塑料件的人：外壳、连接器、线缆、结构件。看完应能回答三件事：这颗料的价卡在树脂、改性还是法规，紧的时候先保哪一类，松的时候哪一类该去做替代认证。

## 先看这五句

1. **按你们现在的采购结构，先看四类：PC/ABS 外壳、PA66 和 PBT 连接器、PVC 和无卤线缆料、LCP 和 PPS。** 判断，按已确认的用量来排，不是按树脂产量排名。含氟聚合物、灌封料、再生料页面留着，写短。通用树脂是这四类下面的成本，单独有一页。
2. **外壳料的报价，多半已经过了改性厂。** 判断：你 ERP 里先动的是报价有效期变短、某个颜色或阻燃牌号要分配，不是美国树脂指数。指数仍要看，它告诉你树脂厂那一层松没松。事实：美国塑料材料与树脂制造的生产者价格指数（BLS 序列 PCU325211325211）在 2022-06 到 380.764，2023-12 回到 317.748（[BLS API](https://api.bls.gov/publicAPI/v2/timeseries/data/PCU325211325211)）。这是行业指数，不是 PC/ABS 的改性报价。
3. **连接器料里，PA66 卡在 ADN，不卡在你仓库里的粒子名字。** 事实：Plastics Technology 2018-11-30 写道，到 2018 年年中，尼龙 66 价格比 18 个月前涨了 50% 以上；己二腈（ADN）全球产能大约 38 亿磅，由四家主要生产商掌握。文中点名的替代方向是尼龙 6、PBT 和 PPA（[Plastics Technology](https://www.ptonline.com/articles/nylon-66-pricing-supply-issues-spur-processors-to-consider-alternatives)）。PBT 本身也是连接器料，紧的时候它会一起被问到。见 [PA66 案例](./cases/pa66-adn-2018)。
4. **线缆料先被法规卡住，再被树脂价卡住。** 事实：欧盟委员会授权指令 2015/863 把 DEHP、BBP、DBP、DIBP 写进 RoHS 附件二，均质材料里每种 0.1%（重量）。成员国规定自 2019-07-22 起适用。2019-07-22 之前已上市设备的线缆和维修备件，这四种有豁免（[法令正文，欧盟出版局](http://publications.europa.eu/resource/cellar/a8027b13-0a7e-11e5-8817-01aa75ed71a1.0006.03/DOC_1)）。PVC 护套和无卤配方都要全物质声明。见 [邻苯案例](./cases/rohs-phthalates-2019)。
5. **LCP 和 PPS 不要等停产函来了再找第二家。** 判断：供应商少，连接器客户认证往往按年算。动作是提前做第二来源，信来了做最后一次购买和算得清的战略库存。本站没有核对到单独的 LCP 或 PPS 公开价格序列，不编一条行情。单点装置会把一条特种料掐断，公开例子是 2012 年赢创的 PA12，见 [赢创案例](./cases/evonik-pa12-2012)。

## 按料拆开

先读和你下单最接近的三类，再读成本和其余料。

1. [工程塑料：PC/ABS 外壳，PA66、PBT 连接器](./parts/engineering-plastics)
2. [线缆料、阻燃剂、助剂](./parts/cable-compounds-additives)
3. [特种工程塑料：LCP、PPS，以及认证和最后一次购买](./parts/specialty-plastics)
4. [通用树脂](./parts/commodity-resins)：PP、PE、PVC、PS、ABS。外壳里的 ABS、线缆里的 PVC 树脂在这一层。
5. [含氟聚合物与 PFAS](./parts/fluoropolymers-pfas)
6. [胶粘剂与灌封料](./parts/adhesives-potting)
7. [再生料与生物基](./parts/recycled-biobased)

能核对到原文的缺货、装置事故、法规和跌价，在 [历史案例](./cases/)。和这四类绑得最紧的是 PA66、邻苯、寒潮和飓风（PVC）、欧洲能源（尼龙链）。

## 这组文章怎么读

1. [产业链一张图看懂](./chain-map)：树脂厂、改性厂、你的注塑或线缆厂，价在哪一层。
2. [周期史](./cycle-history)：装置事故、法规、产能滞后、恐慌超买，各看一次。
3. [价格和交期为什么会变](./price-and-leadtime)：成本、停车、过剩、牌号、法规。
4. [采购能免费跟踪的指标](./indicators)：公开曲线，加上你 ERP 里更早能看见的五件。
5. [实战打法](./playbook)：按四类写的锁价、替代认证、分配和最后一次购买。
6. [名词就这一句话](./glossary)
7. [这些地方先别当定论](./unknowns)

复盘新事件的步骤，和电子料用的是同一套，见 [产业链洞察](/methods/industry-chain-insight)。塑料案例末尾的六步，按那一页的格式写。
