# 采购实战笔记

给中国制造业采购、计划和刚入行的人看的静态网站。用大白话写品类经验和采购方法，数字带来源，虚构例子标明「示例场景」。

线上地址按这个路径准备：[https://johnpeng-cn.github.io/supplychain-insights/](https://johnpeng-cn.github.io/supplychain-insights/)。

## 为什么用 VitePress

文章就是 Markdown，改完在侧边栏登记即可。VitePress 自带中文界面和本地搜索，这个仓库又加了中文分词，搜「交期」「EOL」能找到正文。构建结果是纯静态文件，用 GitHub Actions 部署到 GitHub Pages，不需要服务器，公开仓库可以免费托管。

数据看板不靠手填。`data/electronics/` 里放指标名单和空的序列文件，以后定时任务只要按格式写入 JSON 并提交，网站重新构建就会出曲线。

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
   - 电子元器件：`docs/categories/electronics/`
   - 采购方法：`docs/methods/`
   - 新的品类：先建 `docs/categories/品类英文目录/index.md`，标题下加上「即将上线」。没有真实内容之前，不要写行情和案例。
2. 新建文件，文件名用英文小写和短横线，例如 `safety-stock.md`。目录页用 `index.md`。
3. 文首写清标签。电子类文章可以引用现成的说明：

   ```md
   <!--@include: @/snippets/electronics-note.md-->
   ```

   方法类用 `@/snippets/methods-note.md`。
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

看板的约定写在 [data/README.md](data/README.md)。现在 `data/electronics/series.json` 是空的，页面显示建设中，不会出现曲线。不要为了看效果填假数。
