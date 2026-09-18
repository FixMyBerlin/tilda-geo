import type { PaginationSummary } from './types'

export function toPaginationResult({
  skip,
  take,
  total,
  rowCount,
}: {
  skip: number
  take: number
  total: number
  rowCount: number
}) {
  const safeTake = Math.max(take, 1)

  return {
    from: total === 0 || rowCount === 0 ? 0 : skip + 1,
    to: rowCount === 0 ? 0 : skip + rowCount,
    count: total,
    hasMore: skip + rowCount < total,
    page: Math.floor(skip / safeTake) + 1,
    pageCount: Math.ceil(total / safeTake),
  } satisfies PaginationSummary
}
