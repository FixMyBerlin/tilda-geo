import { getRouteApi, useNavigate } from '@tanstack/react-router'
import type { RegionSearch } from '@/shared/regionen/regionSearchSchemas'

const regionRouteApi = getRouteApi('/regionen/$regionSlug')

type NavigateOptions = {
  replace?: boolean
}

export const useRegionSearchNavigation = () => {
  const search = regionRouteApi.useSearch()
  // No `from`: with `from: '/regionen/$regionSlug'`, navigations resolve to the layout route's own
  // path and kick users out of the mode sub-routes (`/qa`, `/hinweise`, …) on every search-param
  // write (map pan, QA selects, calculator dataset). `to: '.'` stays on the current location.
  const navigate = useNavigate()

  const updateSearch = (
    partial: Partial<RegionSearch> | ((prev: RegionSearch) => Partial<RegionSearch>),
    options?: NavigateOptions,
  ) => {
    void navigate({
      to: '.',
      search: (prev: Record<string, unknown>) => {
        const updates = typeof partial === 'function' ? partial(prev as RegionSearch) : partial
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
