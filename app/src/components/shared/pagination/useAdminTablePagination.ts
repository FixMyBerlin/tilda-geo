import { toPaginationResult } from '@/shared/pagination/toPaginationResult'
import type { PaginatedList } from '@/shared/pagination/types'
import { useOffsetPagination } from './useOffsetPagination'

type OffsetNavigate<TSearch extends { skip?: number; take?: number }> = Parameters<
  typeof useOffsetPagination<TSearch>
>[1]

export function useAdminTablePagination<TSearch extends { skip?: number; take?: number }, TRow>(
  search: TSearch,
  navigate: OffsetNavigate<TSearch>,
  { rows, total, skip, take }: PaginatedList<TRow>,
) {
  const { page, goToPage } = useOffsetPagination(search, navigate, { defaultTake: take })
  const result = toPaginationResult({ skip, take, total, rowCount: rows.length })

  return { page, goToPage, result }
}
