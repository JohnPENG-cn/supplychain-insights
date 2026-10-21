const TITLES = {
  twse: 'MLCC 数据抓取失败：台湾月营收',
  meti: 'MLCC 数据抓取失败：日本陶瓷电容产量'
}

export function issueTitle(source) {
  return TITLES[source]
}

export function planIssueUpdates({ status, openIssues, pageUrl }) {
  const attempted = status.lastRun?.sources || []
  const actions = []
  for (const source of attempted) {
    const title = TITLES[source]
    const entry = status[source]
    if (!title || !entry) continue
    const existing = (openIssues || []).find((issue) => issue.title === title)
    if (entry.ok) {
      if (existing) {
        actions.push({
          type: 'close',
          number: existing.number,
          comment: '这一项最近一次抓取已经成功。页面会用新数据，数据过期的提示会在网站重新构建后去掉。'
        })
      }
      continue
    }
    const body = [
      '自动抓取没有成功。仓库里仍保留上一笔成功的数据，页面会显示「数据过期」。',
      '',
      `- 来源：${title}`,
      `- 尝试日期：${entry.lastAttemptAt || '未知'}`,
      `- 上一笔成功：${entry.fetchedAt || '没有'}`,
      `- 数据截止：${entry.dataThrough || '没有'}`,
      `- 错误：${entry.error || '没有错误说明'}`,
      `- 页面：${pageUrl}`,
      '',
      '请等下一次定时任务，或在 Actions 里手动跑「更新 MLCC 公开数据」。不要为了补洞去抄付费报告。'
    ].join('\n')
    if (existing) actions.push({ type: 'comment', number: existing.number, body })
    else actions.push({ type: 'create', title, body })
  }
  return actions
}
