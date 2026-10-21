/**
 * 给 VitePress 本地搜索用的分词。
 * 中文按词，再补上相邻两字，这样搜「交期」能命中句子里的「交期」。
 * 这个函数会被原样塞进浏览器，不要引用外部变量。
 */
export function tokenizeForSearch(text) {
  const input = String(text || '').toLowerCase()
  const tokens = new Set()
  const add = (term) => {
    const value = String(term || '').trim().toLowerCase()
    if (value) tokens.add(value)
  }

  const words = input.match(/[a-z0-9][a-z0-9+.#_-]*/g) || []
  for (const word of words) add(word)

  const segmenter =
    typeof Intl !== 'undefined' && Intl.Segmenter
      ? new Intl.Segmenter('zh-CN', { granularity: 'word' })
      : null
  const runs = input.match(/[\u3400-\u9fff]+/g) || []

  for (const run of runs) {
    const chars = Array.from(run)
    for (let index = 0; index < chars.length - 1; index += 1) {
      add(chars[index] + chars[index + 1])
    }
    if (!segmenter) continue
    for (const part of segmenter.segment(run)) {
      const word = part.segment.trim()
      if (Array.from(word).length >= 2) add(word)
    }
  }

  return Array.from(tokens)
}
