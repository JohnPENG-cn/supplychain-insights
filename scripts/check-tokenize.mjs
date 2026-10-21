import { tokenizeForSearch } from '../docs/.vitepress/chinese-search.mjs'

function mustInclude(text, term) {
  const tokens = tokenizeForSearch(text)
  if (!tokens.includes(term)) {
    console.error(`分词结果里没有「${term}」`, tokens)
    process.exit(1)
  }
}

mustInclude('供应商交期跟踪', '交期')
mustInclude('安全库存和最小起订量', '库存')
mustInclude('收到 EOL 通知以后做 LTB', 'eol')
mustInclude('收到 EOL 通知以后做 LTB', 'ltb')

const tokens = tokenizeForSearch('价格和交期为什么会变')
if (tokens.some((token) => token.length === 1)) {
  console.error('单字会被搜得太杂，不应该单独进索引', tokens)
  process.exit(1)
}

console.log('中文分词检查通过')
