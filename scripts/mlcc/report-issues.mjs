import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { planIssueUpdates } from './issues.mjs'

const root = resolve(import.meta.dirname, '../..')
const status = JSON.parse(readFileSync(resolve(root, 'data/mlcc/fetch-status.json'), 'utf8'))
const pageUrl = 'https://johnpeng-cn.github.io/supplychain-insights/dashboard/mlcc/'

if (!process.env.GH_TOKEN && !process.env.GITHUB_TOKEN) {
  console.log('没有 GitHub 令牌，跳过问题单')
  process.exit(0)
}

const listed = gh(['issue', 'list', '--state', 'open', '--limit', '50', '--json', 'number,title', '--search', 'MLCC 数据抓取失败 in:title'])
const openIssues = listed ? JSON.parse(listed) : []
const actions = planIssueUpdates({ status, openIssues, pageUrl })
if (actions.length === 0) {
  console.log('问题单不需要更新')
  process.exit(0)
}

for (const action of actions) {
  if (action.type === 'create') {
    const file = resolve(tmpdir(), 'mlcc-issue.md')
    writeFileSync(file, action.body)
    gh(['issue', 'create', '--title', action.title, '--body-file', file])
    console.log(`已开问题单：${action.title}`)
  } else if (action.type === 'comment') {
    const file = resolve(tmpdir(), 'mlcc-issue-comment.md')
    writeFileSync(file, action.body)
    gh(['issue', 'comment', String(action.number), '--body-file', file])
    console.log(`已更新问题单 #${action.number}`)
  } else if (action.type === 'close') {
    gh(['issue', 'close', String(action.number), '--comment', action.comment])
    console.log(`已关闭问题单 #${action.number}`)
  }
}

function gh(args) {
  return execFileSync('gh', args, { encoding: 'utf8' }).trim()
}
