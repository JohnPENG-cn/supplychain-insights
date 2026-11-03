# 塑料公开数据

这个目录只放脚本从公开接口或政府页面取到的数。大商所、郑商所期货不在这里。

| 文件 | 来源 |
| --- | --- |
| `bls-ppi.json` | 美国劳工统计局 PPI。案例图用 `PCU325211325211`。 |
| `eia-propane.json` | EIA Mont Belvieu 丙烷现货月价，美元/加仑。 |
| `eurostat-c2016.json` | Eurostat，NACE C2016，产量（季调）和国内出厂价（未季调），2021=100。 |
| `mops-revenue.json` | 公开资讯观测站月营收。原表是新台币千元。 |
| `nbs-decade-prices.json` | 国家统计局每旬生产资料价格。图只用 PP 拉丝料和 LLDPE。 |
| `sec-lyondellbasell.json` | 美国证监会营收接口。编写时返回 403，文件里没有营收数字。 |
| `fetch-status.json` | 最近一次抓取哪几项成功。 |

更新：

```bash
node scripts/plastics/fetch.mjs
node scripts/plastics/validate.mjs
```

BLS 无密钥只能取最近约 10 年，脚本分两次请求再合并。统计局页面若改版，解析对不上 2026 年 10 月中旬的对照值，脚本会失败并不写入旬价。
