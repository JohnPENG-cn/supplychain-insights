# MLCC 数据

公开页面是 `/dashboard/mlcc/`。怎么改人工文件、定时任务什么时候跑，写在仓库根目录 README 的「更新 MLCC 看板」。

| 文件 | 谁改 |
| --- | --- |
| `tw-monthly-revenue.json` | 定时任务。单位是千新台币 |
| `meti-ceramic-capacitors.json` | 定时任务。产量是千个，金额是百万日元 |
| `fetch-status.json` | 定时任务。失败时 `ok` 为 false，页面显示数据过期 |
| `signal-config.json` | 改阈值才动。要一起改测试 |
| `manual/book-to-bill.json` | 每季人工录入订单出货比和稼动率 |
| `manual/lead-time.json` | 人工录入灯和链接，不抄交期表 |
| `manual/notices.json` | 人工录入涨价、停产摘要 |
| `manual/turn-watch.json` | 人工标拐点哨兵里那两条判断 |
| `schedule.json` | 人工改关键日程 |

检查：

```bash
npm test
```
