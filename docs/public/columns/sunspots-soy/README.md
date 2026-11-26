# 太阳黑子 vs 大豆产量：相关性与领先滞后（T-3，2026-11-26）

**结论（判断）：没有找到可靠关系。** 去掉技术趋势后，美国、全球、巴西、阿根廷、中国的大豆单产/产量与太阳黑子的相关都落在“随机也能碰到”的范围内；对照组 ENSO 至少在阿根廷能测到显著信号。所有相关、去趋势、p 值均为**自算**。

## 数据源（事实）
| 数据 | 来源 | 文件 |
|---|---|---|
| 国际太阳黑子数 v2.0 年均/月均 | SILSO, Royal Observatory of Belgium: https://www.sidc.be/SILSO/INFO/snytotcsv.php , https://www.sidc.be/SILSO/INFO/snmtotcsv.php | sn_y.csv, sn_m.csv |
| 太阳周期极小/极大日期（13 个月平滑） | SILSO https://www.sidc.be/SILSO/cyclesmm （第 25 周期极大值表中尚未列出） | cyclesmm.html |
| 美国大豆种植/收获面积、单产、产量、农场价 1924–2025 | USDA NASS《Crop Production Historical Track Records》2026-04，p.245-246: https://release.nass.usda.gov/reports/croptr26.pdf | us_nass_soy.csv |
| 世界/美国/巴西/阿根廷/中国大陆 大豆单产、产量 1961–2024 | FAOSTAT QCL 批量下载: https://bulks-faostat.fao.org/production/Production_Crops_Livestock_E_All_Data_(Normalized).zip | fao_soy_raw.csv |
| ENSO 指数 ONI | NOAA CPC: https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt | oni.txt |
| （下载了但未用）USDA PSD 油籽 | https://apps.fas.usda.gov/psdonline/downloads/psd_oilseeds_csv.zip | psd_oilseeds.csv |

## 方法（自算）
- 对齐：美国、中国用当年 5–9 月黑子均值；巴西、阿根廷用 FAO 收获年 t，对应上年 10 月–当年 3 月黑子均值（南美营销年 t 的收获在 t+1，FAO 按收获年记）；全球合计用日历年均值。ONI：美国/中国 JJA，南美 DJF（1 月所在年=收获年），全球用年均。
- 去趋势 3 种：①log 后 HP 滤波 λ=100（对 11 年周期保留约 90% 振幅）；②log 后 LOWESS（31 年窗）；③log 同比。偏差单位 %。
- 交叉相关 k=−11..+11 年，k>0=黑子领先。显著性：①Bretherton 有效样本 Neff=N(1−r1x·r1y)/(1+r1x·r1y) 的 t 检验；②黑子随机相位替身（保留 11 年周期和自相关，3000 次），对“扫 23 个滞后取最大|r|”整体检验，即已扣多重比较；另给 Bonferroni×23。
- 相位合成：按距上一个 SILSO 极小值的年数分组，及高/低黑子年（上/下 1/3）对比；p 用异常序列循环平移检验。
- 对照：同样方法下单产与 ONI 的相关。稳定性：美国单产分 1924–74、1975–2025 两段。

## 结果文件
results_xcorr.csv（全部序列×方法）、results_phase.csv、results_enso.csv、results_us_split.csv、data.csv（合并年度数据+部分偏差序列）。
图：chart1_sunspot_vs_us_yield.png、chart2_xcorr.png、chart3_phase_composite.png、chart4_enso_vs_sunspot.png。

## 重跑
`python3 analysis.py`（用本地原始文件）；`python3 analysis.py --download` 先重新下载。依赖 pandas numpy scipy statsmodels matplotlib、poppler-utils。随机种子固定。

## 局限
年度国别数据很粗（一个国家一个数，天气是区域性的）；美国 1924–1950 年代面积小、单产噪声大；FAO 只有 64 年 ≈ 6 个太阳周期；去趋势方法会影响低频结果；只测了线性/同期相位关系，没测 22 年磁周期、宇宙线等其他太阳指标；相关≠因果。
