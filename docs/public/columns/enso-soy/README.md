# ENSO（厄尔尼诺/拉尼娜）vs 大豆：数据与脚本

本目录是「厄尔尼诺能预测大豆收成和价格吗？」一文的数据和代码。所有相关、去趋势、分组平均、p 值、实际价格和库存消费比都是**自算**。不构成投资建议。

## 运行

```
pip install pandas numpy scipy statsmodels matplotlib openpyxl
# 中文字体：apt-get install fonts-noto-cjk ；--download 还需要 poppler-utils（pdftotext）
python3 analysis.py              # 用本目录的小表
python3 analysis.py --download   # 重新下载原始数据（FAO 压缩包约 34 MB）
```

随机种子 20261126，替身 3000 次。

## 输入（小表，已随目录提供）

| 文件 | 内容 | 来源 |
| --- | --- | --- |
| oni.txt | ONI，三个月滑动，YR=中间月所在年 | https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt |
| roni.txt | RONI（相对 ONI） | https://www.cpc.ncep.noaa.gov/data/indices/RONI.ascii.txt |
| us_nass_soy.csv | 美国大豆面积、单产、产量、农场价 1924–2025 | USDA NASS croptr26.pdf（2026 年 4 月）https://release.nass.usda.gov/reports/croptr26.pdf |
| fao_soy_raw.csv | 世界、美国、巴西、阿根廷、中国大陆大豆 1961–2024 | FAOSTAT 批量数据 https://bulks-faostat.fao.org/production/Production_Crops_Livestock_E_All_Data_(Normalized).zip |
| psd_soy.csv | 阿根廷、巴西、美国、中国的 PSD 大豆平衡表；另有一组「World(各国加总,自算)」 | USDA FAS PSD 2026 年 11 月 https://apps.fas.usda.gov/psdonline/downloads/psd_oilseeds_csv.zip |
| wb_soy_monthly.csv | 大豆月度价格，名义美元/吨，1960-01 到 2026-10 | 世界银行 Pink Sheet（2026-11-03 更新）https://thedocs.worldbank.org/en/doc/74e8be41ceb20fa0da750cda2f6b9e4e-0050012026/related/CMO-Historical-Data-Monthly.xlsx |
| cpi_fred.csv | 美国 CPI-U（CPIAUCSL） | https://fred.stlouisfed.org/series/CPIAUCSL |

## 口径

- 单产：取对数后 HP 滤波（λ=100）去趋势，单位 %。对照：31 年窗 LOWESS、对数同比。
- 季节：美国、中国用当年 6–8 月（JJA）ONI；巴西、阿根廷用收获年 12–2 月（DJF，上年 12 月到当年 2 月）；全球用日历年平均。FAO 年份=收获年；PSD 的 Market_Year=播种年，南美 +1 年换成收获年。
- 分组：ONI≥0.5 厄尔尼诺，≤−0.5 拉尼娜；≥1.5 强厄尔尼诺。
- 校正 p：Bretherton 等 1999 有效样本。替身 p：ONI 随机相位替身 3000 次，双尾。
- 价格：世行名义价 ÷ CPI × 2026-10 CPI = 2026 年 10 月美元实际价。FRED 缺 2025-10 CPI（美国政府停摆期间未发布），线性插值。
- 库存消费比：美国=期末库存/(国内消费+出口)；全球=各国期末库存之和/各国国内消费之和（去掉欧盟合计行）。

## 输出

- data.csv：年度数据集（1950–2026）
- price_monthly.csv：月度名义、CPI、实际价、12 个月对数涨跌（%）
- results_corr.csv：各产地 × 去趋势方法 × 季节 × ONI/RONI 的 r、校正 p、替身 p
- results_composite.csv：厄尔尼诺/中性/拉尼娜/强厄尔尼诺分组平均与差值替身 p
- results_strong_events.csv：1982–83、1997–98、2015–16、2023–24 各产地偏差
- results_robustness.csv：前后两段、逐年去掉一年、去掉极端年份
- results_price_lag.csv：月度实际价 12 个月涨跌 vs ONI 领先 0–18 个月
- results_rallies.csv：五次大行情的低点、高点、实际涨幅、期间 ENSO 月数
- results_price_by_year.csv：按收获年 3 月到次年 3 月的实际价格变化（旁证，正文未用）
- results_stocks_to_use.csv：美国与全球库存消费比
- chart1_oni_vs_argentina.png、chart2_corr_by_country.png、chart3_composite.png、chart4_price_enso.png、chart5_now_vs_past.png
