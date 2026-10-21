# 指标数据怎么接

MLCC 采购信号在 [`mlcc/`](mlcc/README.md)，不写进下面的电子元器件序列。台湾月营收和日本产量由定时任务更新；订单出货比、交期灯、涨价台账人工改。不要把存储价格写进这个公开仓库。

电子元器件看板只读这个目录，现在没有数值。

| 文件 | 作用 |
| --- | --- |
| `electronics/catalog.json` | 计划跟踪哪些指标、去哪看、怎么理解。没有数值。 |
| `electronics/series.schema.json` | `series.json` 的格式说明。 |
| `electronics/series.json` | 真正的曲线数据。现在是空的。 |

页面在构建时读取这些文件。`series.json` 为空时，看板只显示「建设中」和指标清单，不画曲线。

## 什么时候算有数据

`series.json` 同时满足这些条件，构建才会收下：

- `status` 改成 `ok`，`updatedAt` 写成 `YYYY-MM-DD`。
- `series` 里每一条的 `id` 必须已经在 `catalog.json` 里，而且 `public` 不是 `false`。
- 每条都有 `sourceName` 和 `https` 开头的 `sourceUrl`。
- `points` 按日期从早到晚排列，数值是数字或 `null`，不能是「大约」「待定」这种文字。
- 至少有一个真正的数字。
- 公司自己的 ERP、BOM、料号不要写进来。清单里 `internal_commitment_vs_receipt` 被标成不公开，校验会拒绝它。

本地检查：

```bash
npm run validate:data
```

## 以后的定时任务可以长这样

不要现在就填假数。等真的要从公开网页取数时，再新增一个手动或定时的 GitHub Actions，大致步骤：

1. 只从 `catalog.json` 里 `public: true` 的来源取数。
2. 写成 `data/electronics/series.json`，遵守上面的格式。
3. 运行 `npm run validate:data`。校验失败就不要提交。
4. 有变化才提交到 `main`。网站工作流会重新构建，曲线才会出现。

取数脚本没写进仓库。没有来源的月份留空，不要为了把线连上而估算。付费报告只收录已经公开转述、并且能链回那篇转述的数字，月份对不上就不要画。

参考骨架（尚未启用，放在这里是为了以后照着做）：

```yaml
name: 更新电子元器件指标
on:
  workflow_dispatch:
  schedule:
    - cron: '0 1 * * 1'
permissions:
  contents: write
jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: node scripts/fetch-electronics-indicators.mjs
      - run: npm run validate:data
      # 确认 series.json 有真实来源后，再提交并推送
```

`scripts/fetch-electronics-indicators.mjs` 现在不存在。在它能逐条写出来源链接之前，不要加这个工作流。
