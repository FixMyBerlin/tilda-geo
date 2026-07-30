import { getRouteApi, useNavigate } from '@tanstack/react-router'
import type { RegionSearch } from '@/shared/regionen/regionSearchSchemas'

const regionRouteApi = getRouteApi('/regionen/$regionSlug')

type NavigateOptions = {
  replace?: boolean
}

export const useRegionSearchNavigation = () => {
  const search = regionRouteApi.useSearch()
  const navigate = useNavigate({ from: '/regionen/$regionSlug' })

  const updateSearch = (
    partial: Partial<RegionSearch> | ((prev: RegionSearch) => Partial<RegionSearch>),
    options?: NavigateOptions,
  ) => {
    void navigate({
      search: (prev) => {
        const updates = typeof partial === 'function' ? partial(prev) : partial
        const next: Record<string, unknown> = { ...prev }

        for (const [key, value] of Object.entries(updates)) {
          if (value === undefined) {
            delete next[key]
          } else {
            next[key] = value
          }
        }

        return next as RegionSearch
      },
      replace: options?.replace,
    })
  }

  return { search, updateSearch, navigate }
}
