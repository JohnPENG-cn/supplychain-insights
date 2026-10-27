# 采购实战笔记

给中国制造业采购、计划和刚入行的人看的静态网站。用大白话写品类经验和采购方法，数字带来源，虚构例子标明「示例场景」。

线上地址按这个路径准备：[https://johnpeng-cn.github.io/supplychain-insights/](https://johnpeng-cn.github.io/supplychain-insights/)。

## 为什么用 VitePress

文章就是 Markdown，改完在侧边栏登记即可。VitePress 自带中文界面和本地搜索，这个仓库又加了中文分词，搜「交期」「EOL」能找到正文。构建结果是纯静态文件，用 GitHub Actions 部署到 GitHub Pages，不需要服务器，公开仓库可以免费托管。

电子元器件指标名单在 `data/electronics/`，序列文件现在是空的。MLCC 看板用 `data/mlcc/`：台湾月营收和日本产量由定时任务写入，订单出货比、交期灯和涨价台账要人工改。

## 本地预览

需要 Node.js 22 或更新版本。

```bash
npm install
npm run dev
```

终端会给出本地地址。页面路径带 `/supplychain-insights/`，这是项目站的基础路径，不是多出来的一层目录。

提交前跑一次：

```bash
npm run build
```

它会校验指标数据、检查中文分词、构建网站，并确认关键页面和基础路径都在。

## 怎么加一篇文章

1. 选目录。
   - 电子元器件总览和跨类文章：`docs/categories/electronics/`
   - 某一类料：`docs/categories/electronics/parts/`
   - 一件能核对的历史案例：`docs/categories/electronics/cases/`
   - 采购方法：`docs/methods/`
   - 新的品类：先建 `docs/categories/品类英文目录/index.md`，标题下加上「即将上线」。没有真实内容之前，不要写行情和案例。
   - 采购人视角读财报（每篇读一家公司的财报，看筹码、周期和买方动作）：`docs/columns/company-lens/`。栏目首页是 `index.md`，新文章要在首页「已经发布」里加一条。文首引用 `@/snippets/lens-note.md`。只来自电话会或新闻稿发言、报表里查不到的数字，前面写「管理层说法」。图片放在 `docs/public/columns/company-lens/`，文章里写 `/columns/company-lens/文件名.png`。这一栏同样不写存储合约价、现货价和涨跌幅。
   - 产业链情报（按篇发布的公开信号，不是品类页）：`docs/briefs/`。栏目首页是 `index.md`。音频放在 `docs/public/audio/`，文章里写 `/audio/文件名.mp3`，由站点加上 `/supplychain-insights/`，不要写死域名。标题下面用 `ListenBar`，时长用稿子里的 `audio_duration`，不要改成另一套数字。文首引用 `@/snippets/brief-note.md`。
2. 新建文件，文件名用英文小写和短横线，例如 `safety-stock.md`。目录页用 `index.md`。
3.    文首写清标签。电子类文章可以引用现成的说明：

   ```md
   <!--@include: @/snippets/electronics-note.md-->
   ```

   页内有 `::: scenario` 时，改用 `@/snippets/electronics-scenario-note.md`，说明示例场景是虚构的。历史案例用 `@/snippets/case-note.md`，不要写成虚构。方法类用 `@/snippets/methods-note.md`。
4. 用大白话写，让只读一遍的人能懂。术语第一次出现时用一句话解释，例如：EOL（原厂宣布这颗料以后不生产了）。
5. 有公开数字，写成事实并给出处链接，数字以原文为准。经验推断用 `::: judgment`。没核实的用 `::: unknown`。虚构例子必须放进 `::: scenario`，不要起一个像真公司的名字，也不要把假设数字写成市场行情。
6. 打开 `docs/.vitepress/config.ts`，把标题和链接加进 `sidebar`。链接不要写 `.html`。
7. `npm run dev` 看一遍，再 `npm run build`。

判断和未知可以这样写：

```md
::: judgment
这是经验，下单前对照自己的料号。
:::

::: scenario
假设一家工厂每周要用 1 万只。1 万只是编的。
:::
```

## 四种标签

| 标签 | 含义 |
| --- | --- |
| 事实 | 有来源。写错时以链接原文为准 |
| 判断 | 经验推断，要对照自己的现场 |
| 未知 | 没核实，不要写进汇报或合同 |
| 示例场景 | 虚构，用来把步骤说具体 |

## 网站地址里的仓库名

`docs/.vitepress/config.ts` 里的 `base` 必须是 `/supplychain-insights/`。GitHub Pages 的项目站地址是 `https://<用户名>.github.io/<仓库名>/`，资源路径如果不带仓库名，页面会空白。

文章地址带 `.html`。GitHub Pages 不会自动把没有后缀的地址转到 `.html`。目录页因为用了 `index.md`，地址以 `/` 结尾。

## 部署到 GitHub Pages

工作流在 `.github/workflows/pages.yml`。合并到 `main` 之后会构建并部署。拉取请求只构建，不部署。

仓库管理员需要在 GitHub 上做一次设置：

1. 打开本仓库的 **Settings**。
2. 左侧进入 **Pages**。
3. 在 **Build and deployment** 里，**Source** 选择 **GitHub Actions**。不要选 Deploy from a branch。
4. 如果 Actions 被关掉了：还是在 **Settings** 里打开 **Actions** → **General**，**Actions permissions** 选 **Allow all actions and reusable workflows**，保存。
5. 把包含这个工作流的改动合并到 `main`。
6. 打开 **Actions**，确认「构建并部署到 GitHub Pages」成功。成功后 Pages 页会显示地址 `https://johnpeng-cn.github.io/supplychain-insights/`。
7. 如果工作流停在等待批准：进入 **Settings** → **Environments** → `github-pages`，看是不是开了人工审核。个人公开仓库通常不用批。

免费使用 GitHub Pages 时，仓库需要是公开的（Public）。私有仓库的 Pages 属于付费功能。

## 指标数据

看板的约定写在 [data/README.md](data/README.md)。`data/electronics/series.json` 仍是空的，除 MLCC 以外的指标显示建设中，不会出现曲线。不要为了看效果填假数，也不要把存储价格写进公开仓库。

## 更新 MLCC 看板

页面在 `/dashboard/mlcc/`。灯和「建议动作」由 `data/mlcc/signal-config.json` 里的阈值算出来，改阈值要一起改 `tests/mlcc/`。

自动抓的只有两类，人不要手改里面的数字，除非抓取坏了要回滚：

- `data/mlcc/tw-monthly-revenue.json`：国巨 2327、华新科 2492、禾伸堂 3026 的月营收。来源是台湾证券交易所 OpenAPI。缺月时才补公开资讯观测站的一页历史。
- `data/mlcc/meti-ceramic-capacitors.json`：日本经济产业省陶瓷电容产量和金额。

定时任务在 `.github/workflows/mlcc-data.yml`。每月 11 日和 15 日抓台湾营收，每月 20 日抓日本产量（都是 UTC 01:20，大约是台北时间上午 9:20）。也可以在 Actions 里手动跑，并选择只抓一项。每次每个来源只请求一次。失败就保留上一笔数字，把状态写成失败；页面显示「数据过期」，并开或更新一条标题以「MLCC 数据抓取失败」开头的 issue。成功后关掉对应 issue。

数据提交到 `main` 之后，这个任务会再触发「构建并部署到 GitHub Pages」。GitHub 默认不会因为机器人推送而级联启动另一个工作流，所以这里用手动触发补上。拉取请求里会真的抓一次并跑测试，不会提交，也不会部署。网站只在 `main` 上部署。

仓库需要允许 Actions 写内容和开 issue：Settings → Actions → General → Workflow permissions，选 **Read and write permissions**。只读令牌提交不了数据。

下面四个文件要人工改。改完跑 `npm test`，再 `npm run build`。

1. `data/mlcc/manual/book-to-bill.json`  
   村田、太阳诱电出季报后追加或改最新一条。要有 PDF 链接、`publishedAt` 和 `periodEnd`。参与灯的是村田 `scope` 为 `MLCC`、太阳诱电 `scope` 为 `电容`。全公司数字和媒体转述的三星电机数字把 `countsTowardSignal` 设为 `false`。`history` 从旧到新写下订单出货比，最后一格要等于 `bookToBill`。稼动率写成 0 到 1 的小数，例如 85% 写 `0.85`。村田下一季预计 10 月 30 日（暂定）之后，把 `staleAfter` 改到再下一季发布后大约一周，否则页面会显示数据过期。

2. `data/mlcc/manual/lead-time.json`  
   只改 `light`（`red` / `yellow` / `green`）、`direction`（`lengthening` / `flat` / `shortening`）、一句 `summary` 和来源链接。不要粘贴 Future、Lytica 或券商报告里的交期周数表。阈值写在配置文件里：主要品牌标准料中位数到 26 周及以上，或还在拉长，是红灯。

3. `data/mlcc/manual/notices.json`  
   一条涨价或停产用自己的一两句话，加上链接。`credibility` 只能是 `maker_notice`（原厂通知）、`media`（媒体转述）、`broker_rumour`（券商传闻）。传闻不会单独把灯打红。大范围停产要写 `kind: "eol"`、`broad: true`、`inForce: true` 和 `lastOrder`。料号清单留在链接里，不要抄进仓库。

4. `data/mlcc/manual/turn-watch.json`  
   拐点哨兵里有两条要人看完再改：`lytica.hit` 和 `inventoryRemark.hit`。只改 true 或 false。Lytica 的指数、可得率不要抄进来。`partial: true` 表示只听到了「有人提前下单」，还没听到「库存已经在调」。哨兵是判断。命中两条或以上转红，意思是停止追加备货，和前面几条红灯相反。

关键日程在 `data/mlcc/schedule.json`。过期的可以留着，页面会标「已过」。

日本海关和韩国海关的出口单价还没接。那两个接口要本人注册的免费 key，没有 key 之前不要把猜测的数字写进来。
