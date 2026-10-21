export function applyRevenueMonth(revenue, parsed, sourceUrl) {
  const next = structuredClone(revenue)
  let row = next.months.find((item) => item.month === parsed.month)
  if (!row) {
    row = { month: parsed.month }
    next.months.push(row)
  }
  const filingRows = {}
  for (const [code, value] of Object.entries(parsed.rows)) {
    if (!Number.isFinite(value.revenue)) continue
    row[code] = value.revenue
    filingRows[code] = {
      reportedYearAgo: value.reportedYearAgo,
      reportedYoYPercent: value.reportedYoYPercent,
      reportedMomPercent: value.reportedMomPercent,
      remark: value.remark || ''
    }
  }
  next.months.sort((a, b) => a.month.localeCompare(b.month))
  const filingMonth = next.latestFiling?.month
  if (!filingMonth || parsed.month >= filingMonth) {
    next.latestFiling = {
      month: parsed.month,
      publishedAt: parsed.publishedAt,
      sourceUrl,
      rows: filingRows
    }
  }
  return next
}

export function applyMetiMonths(meti, months) {
  const next = structuredClone(meti)
  for (const item of months) {
    if (!Number.isFinite(item.quantity) || !Number.isFinite(item.value)) continue
    const existing = next.months.find((row) => row.month === item.month)
    if (existing) {
      existing.quantity = item.quantity
      existing.value = item.value
    } else {
      next.months.push({ month: item.month, quantity: item.quantity, value: item.value })
    }
  }
  next.months.sort((a, b) => a.month.localeCompare(b.month))
  return next
}

export function markFresh(entry, today) {
  return {
    ...entry,
    ok: true,
    error: null,
    fetchedAt: today,
    lastAttemptAt: today,
    staleAfter: addIsoDays(today, entry.staleAfterDays)
  }
}

export function markFailed(entry, today, error) {
  return {
    ...entry,
    ok: false,
    error: String(error?.message || error).slice(0, 500),
    lastAttemptAt: today
  }
}

function addIsoDays(iso, days) {
  const date = new Date(`${iso}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}
