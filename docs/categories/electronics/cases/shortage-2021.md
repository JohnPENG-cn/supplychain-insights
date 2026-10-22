---
title: 2021–2022 缺芯和三场意外
description: 车用 MCU 交期拉到半年附近，叠加上那珂火灾、德州停电和旭化成延冈火灾。
---

# 2021–2022 缺芯：车用芯片，加上三场意外

<!--@include: @/snippets/electronics-note.md-->

这一轮缺芯是疫情里需求乱了，再叠上几场工厂事故。先看全行业，再看三场能核对到原文的意外：瑞萨那珂火灾、德州冬季风暴、旭化成电子（AKM）延冈火灾。每场都分开写，避免把「全行业交期」算成某一场火造成的。

## 全行业先发生了什么

疫情初期不少车厂砍了芯片订单。后面汽车需求回来，消费电子、笔记本也在抢同一批成熟制程。8 英寸和车用 MCU 特别紧。

::: fact
Electronics Weekly 在 2021 年 8 月报道，MCU 平均交期大约 26.5 周，部分料号 52 周（[Electronics Weekly](https://www.electronicsweekly.com/news/business/worst-chip-shortage-ever-2021-08/)）。有媒体转述 Susquehanna 的统计，平均交期在 2022 年 6 月大约 27 周见顶（[autoevolution 的转述](https://www.autoevolution.com/news/microchip-shortage-peaked-in-june-with-delivery-times-showing-a-modest-relief-192990.html)）。美联储后来有文章讲这轮缺芯和汽车减产（[美联储](https://www.federalreserve.gov/econres/notes/feds-notes/when-the-chips-went-down-motor-vehicle-production-and-the-2021-2022-semiconductor-shortages-accessible-20260928.htm)）。
:::

判断：交期用「周」而不是「月」在变长的时候，保供比完成降价指标重要。现货可以贵到授权价的很多倍，但倍数要用你自己的报价单，不要用传闻。交期不再变长的那一段，往往离这轮顶部不远。

下面三场意外，是在已经很紧的市场上又拆掉一块产能。

## 瑞萨那珂火灾，2021 年 3 月 19 日

### 发生了什么

::: fact
2021 年 3 月 19 日 2:47，瑞萨半导体制造子公司的那珂工厂 N3 栋（300 毫米生产线）起火，当天 8:12 被确认扑灭。N2 栋（200 毫米）和晶圆测试继续出货。3 月 20 日的第二报写明：起火点是电镀设备过电流，烧毁面积大约 600 平方米，大约是 N3 洁净室 12000 平方米的 5%；烧毁设备 11 台，大约是 N3 设备的 2%（[第一报](https://www.renesas.com/en/about/press-room/notice-regarding-semiconductor-manufacturing-factory-naka-factory-fire)、[第二报](https://www.renesas.com/en/about/press-room/update-2-notice-regarding-semiconductor-manufacturing-factory-naka-factory-fire)）。
:::

### 因果是怎么串起来的

判断：烧毁面积只有洁净室的一小块，但洁净室的风、水和上下楼工艺是连在一起的。火在一楼，二楼没有直接烧到，照样不能单独出货。车用 MCU 本来就在分配，少一座 300 毫米厂，客户感觉到的是「这个月的额度没了」，不是「只少了 5% 的面积」。

### 价格和交期怎么动

瑞萨这几份公告给的是恢复时间，没有给客户采购价涨了多少。这里不编一个涨幅。

::: fact
3 月 21 日的说明里，公司希望一个月内恢复 N3 生产，并曾估计停产对销售的影响大约每月 170 亿日元。3 月 30 日第四报把这个月影响改成大约 130 亿日元，因为原先的 170 亿把其他产线也算进去了。第四报还写：大约四分之三的在制品没损坏；受影响设备从 11 台改成 23 台（11 台烧毁，另有 12 台受影响）。若 4 月底前设备到齐，一楼在制品大约火灾后 60 天开始出货，二楼大约 90 天，N3 产品出货大约 100 天恢复到火灾前。这是有前提的预计，设备晚到，恢复就顺延。大约三分之二的 N3 产品在技术上可以厂内或外协转产。第四报按「替代生产相当于 N3 产能 1.5 个月或 2 个月」分别估计了外协和厂内能覆盖多少，比例以第四报原文为准。销售影响上，若 1.5 个月恢复到满产大约 175 亿日元，若两个月大约 240 亿日元（[第三报](https://www.renesas.com/en/about/newsroom/update-3-notice-regarding-semiconductor-manufacturing-factory-naka-factory-fire)、[第四报](https://www.renesas.com/en/about/press-room/update-4-notice-regarding-semiconductor-manufacturing-factory-naka-factory-fire)）。
:::

::: fact
4 月 17 日 N3 复产，当天产能不到火灾前的 10%。公司当时说，出货恢复到 100% 会比 3 月 30 日估计的「大约 100 天」再晚大约 7 到 10 天（[第六报](https://www.renesas.com/en/about/press-room/update-6-notice-regarding-semiconductor-manufacturing-factory-naka-factory-fire)）。6 月 1 日的第九报写，5 月底产能恢复到火灾前的 88%，目标是 6 月中回到 100%（[第九报](https://www.renesas.com/en/about/press-room/update-9-notice-regarding-semiconductor-manufacturing-factory-naka-factory-fire-production-capacity)）。
:::

### 买得好的和买砸的

判断。买得比较稳的：拿到火灾通知的当天，就问代理这颗料是 N3 还是 N2。N2 还在出货，不该和 N3 用同一套应急。已经有第二来源、并且软件验证过的，转产窗口才用得上。没有第二来源的，把未来 8 到 16 周已经确定的客户订单算清楚，再决定要不要接不可退货的分配，而不是按传闻把一年用量都下了。

买砸的：火警新闻一出，向三家现货商各下一遍同一颗瑞萨 MCU，授权渠道的历史提货反而变少，下一轮分配更小。或者只看「烧毁面积才 5%」，以为交期不会动。

### 一句教训

问清你的料在哪一座楼，再决定备多少；烧毁面积的百分比，代替不了这条线停没停。

## 德州冬季风暴，2021 年 2 月

### 发生了什么

::: fact
路透社 2021 年 2 月 17 日报道，恩智浦停掉奥斯汀的两座工厂，并通知客户可能断供。公司称，当地公用事业优先保障居民用电（[路透社](https://www.reuters.com/business/nxp-shuts-two-austin-plants-texas-reels-winter-storm-2021-02-17/)）。
:::

::: fact
路透社随后报道，三星、恩智浦、英飞凌在德州的工厂被要求停产。奥斯汀地区制造商协会首席执行官 Edward Latson 说，重新开工大约要几周，客户可能在几个月后才感到连带影响。这是行业协会负责人的判断，不是三家公司共同发布的复产日期（[路透社](https://www.reuters.com/article/us-usa-texas-chipmakers/texan-chipmakers-face-slow-recovery-from-power-crisis-as-shortage-looms-idUSKCN2AU2JI/)）。
:::

### 因果是怎么串起来的

判断：晶圆厂停电不是关灯再打开。设备要重新升温、清洗、送检，在制品可能报废。车用芯片本来就长在少数几座厂里，奥斯汀这一簇同时停，缺口会在整车厂的排产上晚一拍才看见。

### 价格和交期怎么动

上面两则路透社没有给出统一的涨价百分比，这里不补。能核对的是：恩智浦通知客户可能断供；行业协会说复工要数周，冲击可能滞后数月。全行业 MCU 交期仍用前面 Electronics Weekly 的大约 26.5 周，那是 2021 年 8 月的行业数字，包含这场停电，也包含别的原因。

### 买得好的和买砸的

判断。买得比较稳的：车用料的晶圆产地写进台账，奥斯汀、那珂、台湾成熟制程不要全部压在同一颗料的唯一来源上。停电当周先核对在途和在制品，再决定现货只覆盖已经排产的周次。

买砸的：把「工厂已经来电了」理解成「下周就有货」。晶圆厂来电之后，还有清洗和重新流片，整车厂感觉到缺料往往在后面一两个月。

### 一句教训

地理上扎在同一座城市的车用晶圆厂，会一起停；复工日期不等于你的料下周入库。

## 旭化成电子延冈火灾，2020 年 10 月

### 发生了什么

::: fact
旭化成电子 2020 年 10 月 30 日的通知写：10 月 20 日 16:45，宫崎县延冈市生产中心第二制造部起火，10 月 24 日 12:25 扑灭。受损的是混合信号大规模集成电路的生产线。公司当时认为短期内难以恢复，正在安排替代生产。其他工厂没有直接受影响（[旭化成电子，日文通知](https://www.akm.com/jp/ja/about-us/news/information/20201030-information/)）。
:::

这颗厂做的包括音频数模转换、以及给晶振模块用的集成电路。所以它同时打到模拟芯片和晶振采购。

::: fact
分销商 TTI 的公告写，受影响的有模数和数模转换、温补晶振和普通晶振、射频模块等；TTI 预计分配可能持续到 2021 年第一季。这是分销商的预计，不是旭化成电子公告里的日期（[TTI](https://www.tti.com/content/ttiinc/en/announcements/akm-fire.html)）。
:::

### 因果是怎么串起来的

判断：晶振采购经常只盯频率和品牌，不盯里面那颗振荡器芯片是哪家的前道。前道厂烧掉以后，成品晶振的交期会在几个星期后才反映到你的订单上。替代生产要重新流片和验证，比「换一家代理」慢。

### 价格和交期怎么动

旭化成电子的通知没有写涨价幅度。TTI 给出的是「分配可能到 2021 年第一季」这一句预计。这里不用别的媒体补一个价格。

### 买得好的和买砸的

判断。买得比较稳的：晶振的第二来源在火灾之前就按频率、负载电容、ppm 和温度范围验证过，不只是「也是 25 MHz」。火灾通知到达后，先问这颗型号的芯片是不是延冈前道，再决定要不要启动替代。

买砸的：只向现货商买同一型号的旧库存，不核对批次和翻新。音频和工控料的假货，后来在 [参议院报告](./counterfeit-2012) 里是另一类教训，两件事变在一起时更要检测。

### 一句教训

晶振断货有时断在里面的芯片厂，第二来源要在火灾之前验证完。

MCU 平时怎么买，见 [MCU](../parts/mcu)。晶振见 [晶振和振荡器](../parts/crystals)。模拟和电源见 [模拟和电源](../parts/analog-power)。
