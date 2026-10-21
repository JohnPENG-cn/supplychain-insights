export function decodeXml(text) {
  return text
    .replace(/&#(\d+);/g, (_, value) => String.fromCodePoint(Number(value)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, value) => String.fromCodePoint(parseInt(value, 16)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

export function sharedStrings(xml) {
  const strings = []
  const items = xml.match(/<si\b[\s\S]*?<\/si>/g) || []
  for (const item of items) {
    const withoutRuby = item.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '').replace(/<phoneticPr\b[^>]*\/>/g, '')
    const texts = [...withoutRuby.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((match) =>
      decodeXml(match[1])
    )
    strings.push(texts.join(''))
  }
  return strings
}

export function sheetRows(xml, strings) {
  const rows = []
  const parts = xml.split('<row ')
  for (const part of parts.slice(1)) {
    const end = part.indexOf('</row>')
    const body = end >= 0 ? part.slice(0, end) : part
    const cells = []
    const pattern = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g
    let match = pattern.exec(body)
    while (match) {
      const attrs = match[1] || ''
      const inner = match[2] || ''
      const ref = attrs.match(/\br="([A-Z]+)(\d+)"/)
      if (ref) {
        const typeMatch = attrs.match(/\bt="([^"]+)"/)
        const type = typeMatch ? typeMatch[1] : ''
        let value = null
        if (type === 'inlineStr') {
          value = [...inner.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((item) => decodeXml(item[1])).join('')
        } else {
          const raw = inner.match(/<v>([\s\S]*?)<\/v>/)
          if (raw) {
            value = type === 's' ? strings[Number(raw[1])] : decodeXml(raw[1])
          }
        }
        cells.push({ column: ref[1], value })
      }
      match = pattern.exec(body)
    }
    rows.push(cells)
  }
  return rows
}
