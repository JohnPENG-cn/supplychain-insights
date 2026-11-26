"""大豆周期信号看板的两张折线图。

用法（在本目录或仓库任意目录）：
    python3 docs/public/dashboard/soy/chart.py

图 1 读同目录 annual.csv。
图 2 读专栏里已经提交的 ONI 原文 docs/public/columns/enso-soy/oni.txt。
依赖 matplotlib。中文字体用文泉驿或 Noto Sans CJK。
"""
import csv
import os
from datetime import date

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager

HERE = os.path.dirname(os.path.abspath(__file__))
ANNUAL = os.path.join(HERE, "annual.csv")
ONI = os.path.normpath(os.path.join(HERE, "..", "..", "columns", "enso-soy", "oni.txt"))

_cjk = [
    f.name
    for f in font_manager.fontManager.ttflist
    if "CJK SC" in f.name or "Noto Sans SC" in f.name or "WenQuanYi" in f.name or "Source Han Sans" in f.name
]
plt.rcParams["font.sans-serif"] = (["WenQuanYi Micro Hei"] if any("WenQuanYi" in n for n in _cjk) else _cjk[:1]) + [
    "DejaVu Sans"
]
plt.rcParams["axes.unicode_minus"] = False
if not _cjk:
    print("警告：没有找到中文字体，图中中文会显示成方块")

TEAL = "#0f6b63"
ORANGE = "#c2410c"
RED = "#b42318"
GREEN = "#067647"
BLUE = "#1d4ed8"
MUTED = "#66716f"


def fnum(text):
    text = (text or "").strip()
    if not text:
        return None
    return float(text)


def load_annual():
    with open(ANNUAL, newline="") as handle:
        rows = list(csv.DictReader(handle))
    out = []
    for row in rows:
        out.append(
            {
                "year": int(row["market_year"]),
                "us": fnum(row["US_STU"]),
                "world": fnum(row["World_STU"]),
                "world_ex": fnum(row["WorldExCN_STU"]),
                "price": fnum(row["WB_real_usd_mt_2026_10"]),
            }
        )
    return out


def season_end(season, year):
    """三字季节码的最后一个月，用来把重叠的 ONI 排到时间轴上。"""
    end = {"DJF": 2, "JFM": 3, "FMA": 4, "MAM": 5, "AMJ": 6, "MJJ": 7, "JJA": 8, "JAS": 9, "ASO": 10, "SON": 11, "OND": 12, "NDJ": 1}
    month = end[season]
    if season == "NDJ":
        year += 1
    return date(year, month, 1)


def load_oni():
    points = []
    with open(ONI) as handle:
        next(handle)
        for line in handle:
            parts = line.split()
            if len(parts) < 4:
                continue
            season, year, _total, anom = parts[0], int(parts[1]), parts[2], float(parts[3])
            points.append((season_end(season, year), anom, season, year))
    points.sort(key=lambda item: item[0])
    return points


def draw_stu(rows):
    hist = [row for row in rows if row["year"] <= 2025 and row["price"] is not None]
    stu_years = [row["year"] for row in rows if row["us"] is not None]
    stu = [row["us"] for row in rows if row["us"] is not None]
    fig, ax = plt.subplots(figsize=(10.6, 5.15), dpi=140)
    ax2 = ax.twinx()
    line_stu, = ax.plot(stu_years, stu, color=TEAL, lw=2.0, label="美国库存消费比")
    line_tight = ax.axhline(5, color=RED, ls="--", lw=1.0, label="5%（偏紧）")
    line_loose = ax.axhline(12, color=GREEN, ls="--", lw=1.0, label="12%（偏松）")
    line_price, = ax2.plot(
        [row["year"] for row in hist],
        [row["price"] for row in hist],
        color=ORANGE,
        lw=2.0,
        label="实际价格",
    )
    ax.set_xlim(min(stu_years), max(stu_years))
    ax.set_xlabel("营销年度（美国为 9–8 月）")
    ax.set_ylabel("美国库存消费比（%）", color=TEAL)
    ax2.set_ylabel("实际价格（2026年10月美元/吨）", color=ORANGE)
    ax.set_title("美国大豆库存消费比和实际价格，1964–2026")
    ax.tick_params(axis="y", colors=TEAL)
    ax2.tick_params(axis="y", colors=ORANGE)
    ax.grid(True, axis="y", color="#d9e0de", lw=0.6)
    ax.legend(
        [line_stu, line_price, line_tight, line_loose],
        ["美国库存消费比（%）", "实际价格（2026年10月美元/吨）", "5% 参考线", "12% 参考线"],
        loc="upper right",
        frameon=False,
    )
    fig.text(
        0.01,
        0.01,
        "库存消费比到 2026/27（预测）。价格是世界银行年度均价，按美国 CPI 折到 2026 年 10 月美元，只到 2025。自算整理。",
        color=MUTED,
        fontsize=8,
    )
    fig.tight_layout(rect=(0, 0.04, 1, 1))
    path = os.path.join(HERE, "us-stu-price.png")
    fig.savefig(path)
    plt.close(fig)
    print("wrote", path)


def draw_oni(points):
    fig, ax = plt.subplots(figsize=(10.6, 4.6), dpi=140)
    xs = [item[0] for item in points]
    ys = [item[1] for item in points]
    ax.plot(xs, ys, color=BLUE, lw=1.3, label="ONI")
    ax.axhline(0.5, color=RED, ls="--", lw=1.0, label="+0.5（厄尔尼诺）")
    ax.axhline(-0.5, color=TEAL, ls="--", lw=1.0, label="−0.5（拉尼娜）")
    ax.axhline(0, color="#c5cdc9", lw=0.8)
    last = points[-1]
    ax.scatter([last[0]], [last[1]], color=ORANGE, zorder=3)
    ax.annotate(
        f"{last[2]} {last[3]}  {last[1]:+.2f}",
        xy=(last[0], last[1]),
        xytext=(-110, -28),
        textcoords="offset points",
        color=ORANGE,
        fontsize=9,
    )
    ax.set_ylabel("ONI 距平")
    ax.set_xlabel("季节结束月")
    ax.set_title("ONI 时间序列，1950–2026")
    ax.grid(True, axis="y", color="#d9e0de", lw=0.6)
    ax.legend(loc="upper left", frameon=False)
    fig.text(0.01, 0.01, "数据：NOAA CPC oni.ascii.txt，与厄尔尼诺专栏同一份。重叠的三个月季节。", color=MUTED, fontsize=8)
    fig.tight_layout(rect=(0, 0.04, 1, 1))
    path = os.path.join(HERE, "oni.png")
    fig.savefig(path)
    plt.close(fig)
    print("wrote", path, "last", last[2], last[3], last[1])


def summarize(rows):
    """打印分位，方便改页面时核对。不写进图。"""
    level = next(row["us"] for row in rows if row["year"] == 2026)
    world = next(row["world"] for row in rows if row["year"] == 2026)

    def share(sample, value, key):
        n = len(sample)
        k = sum(1 for row in sample if row[key] <= value + 1e-9)
        return n, k, 100 * k / n

    for label, sample in (
        ("1964-2025", [row for row in rows if 1964 <= row["year"] <= 2025]),
        ("1964-2026", [row for row in rows if 1964 <= row["year"] <= 2026]),
    ):
        n, k, pct = share(sample, level, "us")
        print(f"US <= {level} in {label}: {k}/{n} = {pct:.1f}%")
        n, k, pct = share(sample, world, "world")
        print(f"World <= {world} in {label}: {k}/{n} = {pct:.1f}%")
    hist = [row for row in rows if 1964 <= row["year"] <= 2025]
    tight = sum(1 for row in hist if row["us"] <= 5)
    mid = sum(1 for row in hist if 5 < row["us"] <= 12)
    loose = sum(1 for row in hist if row["us"] > 12)
    print(f"bins 1964-2025 <=5 / (5,12] / >12: {tight} {mid} {loose} total {len(hist)}")
    # 边界：≤5 含 5，>12 不含 12。5–12 的闭开要再数一次正好等于 5 或 12 的年份。
    eq5 = [row["year"] for row in hist if abs(row["us"] - 5) < 1e-9]
    eq12 = [row["year"] for row in hist if abs(row["us"] - 12) < 1e-9]
    print("years == 5", eq5, "years == 12", eq12)


if __name__ == "__main__":
    rows = load_annual()
    summarize(rows)
    draw_stu(rows)
    draw_oni(load_oni())
