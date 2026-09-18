/**
 * Page links for a pagination bar: first, last and the neighbours of `page`, with `'gap'` for
 * skipped ranges (`1 … 4 5 6 … 12`). A gap never hides a single page; up to 7 pages are all shown.
 */
export function compactPageNumbers(page: number, pageCount: number) {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1)
  }

  const current = Math.min(Math.max(page, 1), pageCount)
  const visible = new Set([1, pageCount, current - 1, current, current + 1])
  // Keep the bar the same width near the edges: `1 2 3 4 5 … 12` / `1 … 8 9 10 11 12`.
  if (current <= 4) [2, 3, 4, 5].forEach((n) => visible.add(n))
  if (current >= pageCount - 3) [1, 2, 3, 4].forEach((n) => visible.add(pageCount - n))

  const sorted = [...visible].filter((n) => n >= 1 && n <= pageCount).sort((a, b) => a - b)
  const items: Array<number | 'gap'> = []
  for (const n of sorted) {
    const previous = items.at(-1)
    if (typeof previous === 'number' && n - previous === 2) items.push(previous + 1)
    if (typeof previous === 'number' && n - previous > 2) items.push('gap')
    items.push(n)
  }
  return items
}
