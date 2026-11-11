# IC 采购信号（模拟/MCU）

公开页面是 `/dashboard/ic/`。季度数和灯的规则写在仓库根目录 README 的「更新 IC 看板」。

| 文件 | 谁改 |
| --- | --- |
| `quarters.json` | 从 `docs/public/columns/semi-cycle/data.csv` 抽出。不要手改同比 |
| `signal-config.json` | 改灯的规则才动。要一起改 `tests/ic/` |
| `manual/management.json` | 人工录入电话会或业绩稿里关于客户库存、渠道库存的原句 |

库存天数自算：期末存货 ÷ 当季营业成本 × 91。营收同比自算：本季营收 ÷ 上年同季 − 1。并购季度不进中位数。

检查：

```bash
node scripts/validate-ic.mjs
```
