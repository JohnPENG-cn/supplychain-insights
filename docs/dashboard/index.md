---
title: 产业链看板
description: MLCC、模拟/MCU 和航运周期已上线。其他电子元器件指标还在建设中，没有存储行情。
---

# 产业链看板

MLCC 采购信号、IC 采购信号（模拟/MCU）和航运周期已经上线。半导体销售额、代工利用率、代理出货、交期指数这些仍是 <span class="status status-wip">建设中</span>，没有曲线。这页不放存储行情。航运看板把集装箱、干散货、油轮分开，不合成一条中位数。

| 看板 | 状态 |
| --- | --- |
| [MLCC 采购信号](/dashboard/mlcc/) | 已上线。页内有「周期位置」，不预测下行落在哪一季 |
| [IC 采购信号（模拟/MCU）](/dashboard/ic/) | 已上线 |
| [航运周期](/dashboard/shipping/) | 已上线。三组分开 |
| 下面这张电子元器件指标清单 | 建设中 |

<!--@include: @/snippets/electronics-note.md-->

读指标本身怎么用，看 [采购能免费跟踪的指标](/categories/electronics/indicators)。MLCC 的灯和动作在 [采购信号](/dashboard/mlcc/)，二十年的位置在同一页的「周期位置」，长文在 [用二十年财报看被动元件](/columns/passive-cycle/twenty-years)。模拟和 MCU 的灯在 [IC 采购信号](/dashboard/ic/)，长历史在 [用二十年财报看半导体](/columns/semi-cycle/twenty-years)。航运三组在 [航运周期](/dashboard/shipping/)。

<IndicatorBoard />

## 数据从哪进网站

MLCC 的台湾月营收和日本产量由定时任务写入 `data/mlcc/`。订单出货比、交期灯、涨价台账要人工改，步骤见仓库 README 的「更新 MLCC 看板」。

IC 看板的季度数从 [半导体周期数据集](/columns/semi-cycle/data.csv) 抽出，放在 `data/ic/`。营收同比和库存天数由页面自算。电话会那一盏灯改 `data/ic/manual/management.json`，没有原文就留空。

MLCC「周期位置」从 [被动元件数据集](/columns/passive-cycle/data.csv) 抽出，放在 `data/mlcc/cycle-position.json`。改 CSV 之后运行 `node scripts/cycle/build-json.mjs`，再跑测试。不要手改算出来的中位数。人工台账（订单出货比、交期、涨价）仍按原来的文件改，不和这条长序列合成一个数。

航运看板从 [航运数据集](/columns/shipping-cycle/data.csv) 抽出，放在 `data/shipping/position.json`。同样用上面的脚本重算。三组不要合并。

其他指标还没接上：

1. 指标名单在 `data/electronics/catalog.json`。要新增一条，先加名单，再允许写入数值。
2. 数值只写在 `data/electronics/series.json`。每条序列要有来源名称和链接，日期从早到晚，不能用文字代替数字。
3. 提交前运行 `npm run validate:data`。格式不对，网站构建会失败。
4. 文件进了 `main` 分支之后，GitHub Actions 会重新构建页面。

公司 ERP 里的承诺日期、到货数量、BOM 和料号留在内部。名单里那条「首次承诺和实际到货」被标成不公开，校验会拒绝把它写进序列文件。记账方法见 [供应商交期跟踪](/methods/delivery-tracking)。

`data/electronics/series.json` 现在仍是空的。不要为了看效果填假数，也不要把存储价格写进公开仓库。
