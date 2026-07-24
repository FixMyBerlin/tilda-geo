export type PaginationSummary = {
  from: number
  to: number
  count: number
  hasMore: boolean
}

export type PaginatedList<TRow> = {
  rows: TRow[]
  total: number
  skip: number
  take: number
}
