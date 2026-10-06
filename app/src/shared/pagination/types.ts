export type PaginationSummary = {
  from: number
  to: number
  count: number
  hasMore: boolean
  /** 1-based page of `skip`. */
  page: number
  /** 0 when there are no rows. */
  pageCount: number
}

export type PaginatedList<TRow> = {
  rows: TRow[]
  total: number
  skip: number
  take: number
}
