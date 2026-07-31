import { clampSkipTake } from '@/shared/pagination/clampSkipTake'
import type { PaginatedList } from '@/shared/pagination/types'

type PaginateArgs<T> = {
  skip?: number
  take?: number
  defaultTake?: number
  maxTake?: number
  count: () => Promise<number>
  query: (args: { skip: number; take: number }) => Promise<T[]>
}

export async function paginate<T>({
  skip,
  take,
  defaultTake = 50,
  maxTake = 200,
  count,
  query,
}: PaginateArgs<T>): Promise<PaginatedList<T>> {
  const pagination = clampSkipTake(skip, take, { defaultTake, maxTake })

  const [total, rows] = await Promise.all([count(), query(pagination)])

  return {
    rows,
    total,
    ...pagination,
  }
}
