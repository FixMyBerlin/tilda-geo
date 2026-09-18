import { MAX_PAGE_SIZE, MAX_SKIP } from './constants'

export function pageToSkipTake({ page, pageSize }: { page: number; pageSize: number }) {
  const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1
  const safePageSize = Number.isFinite(pageSize)
    ? Math.min(Math.max(1, Math.floor(pageSize)), MAX_PAGE_SIZE)
    : 1
  const skip = (safePage - 1) * safePageSize

  return {
    skip: Number.isSafeInteger(skip) ? Math.min(skip, MAX_SKIP) : MAX_SKIP,
    take: safePageSize,
  }
}
