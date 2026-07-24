import type { OffsetSearch } from '@/shared/pagination/offsetSearchSchema'

type OffsetNavigate<TSearch extends OffsetSearch> = (options: {
  search: TSearch | ((previous: TSearch) => TSearch)
}) => void

type UseOffsetPaginationOptions = {
  defaultTake?: number
}

export function useOffsetPagination<TSearch extends OffsetSearch>(
  search: TSearch,
  navigate: OffsetNavigate<TSearch>,
  { defaultTake = 50 }: UseOffsetPaginationOptions = {},
) {
  const take = search.take ?? defaultTake
  const skip = search.skip ?? 0
  const page = Math.floor(skip / take) + 1

  const goToPage = (nextPage: number) => {
    navigate({
      search: (previous) => {
        const currentTake = previous.take ?? defaultTake
        const nextSkip = (Math.max(1, nextPage) - 1) * currentTake

        return {
          ...previous,
          skip: nextSkip > 0 ? nextSkip : undefined,
        }
      },
    })
  }

  return { page, take, skip, goToPage }
}
