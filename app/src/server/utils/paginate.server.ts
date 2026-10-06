import { clampSkipTake, lastPageSkip } from '@/shared/pagination/clampSkipTake'
import type { PaginatedList } from '@/shared/pagination/types'

type PaginateArgs<T> = {
  skip?: number
  take?: number
  defaultTake?: number
  maxTake?: number
  /**
   * Admin UI only: a request past the end (stale link, rows deleted meanwhile) returns the last page
   * instead of an empty one. Off for REST API / MCP, whose clients page until `rows` is empty.
   */
  fallbackToLastPage?: boolean
  count: () => Promise<number>
  /** Must use a deterministic `orderBy` that ends in a unique column (usually `id`), or pages overlap. */
  query: (args: { skip: number; take: number }) => Promise<T[]>
}

/**
 * Offset pagination with clamped `skip`/`take`. Counts first so a skip past the end never becomes a
 * huge Postgres `OFFSET`. The returned `skip`/`take` are the effective values (after clamping or the
 * `fallbackToLastPage` fallback).
 */
export async function paginate<T>({
  skip,
  take,
  defaultTake,
  maxTake,
  fallbackToLastPage = false,
  count,
  query,
}: PaginateArgs<T>): Promise<PaginatedList<T>> {
  const pagination = clampSkipTake(skip, take, { defaultTake, maxTake })
  const total = await count()

  if (pagination.skip >= total) {
    if (fallbackToLastPage && total > 0) {
      const fallback = { skip: lastPageSkip(total, pagination.take), take: pagination.take }
      return { rows: await query(fallback), total, ...fallback }
    }
    return { rows: [], total, ...pagination }
  }

  return {
    rows: await query(pagination),
    total,
    ...pagination,
  }
}
