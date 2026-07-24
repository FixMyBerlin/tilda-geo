import type { PaginationSummary } from './types'

export function toPaginationResult({
  skip,
  total,
  rowCount,
}: {
  skip: number
  take: number
  total: number
  rowCount: number
}): PaginationSummary {
  return {
    from: total === 0 ? 0 : skip + 1,
    to: skip + rowCount,
    count: total,
    hasMore: skip + rowCount < total,
  }
}
