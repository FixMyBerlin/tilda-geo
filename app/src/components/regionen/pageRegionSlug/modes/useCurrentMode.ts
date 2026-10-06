import { getRouteApi, useMatchRoute, useMatches } from '@tanstack/react-router'

const routeApi = getRouteApi('/regionen/$regionSlug')

/**
 * The mode pages of a region. Every mode reuses the central map (mounted in the
 * `/regionen/$regionSlug` layout route) and adds a data panel on the right.
 * `map` is the default mode (the classic region map at the region root URL).
 */
const regionModeRouteIds = {
  map: '/regionen/$regionSlug/',
  notes: '/regionen/$regionSlug/hinweise',
  qa: '/regionen/$regionSlug/qa',
  reviewLists: '/regionen/$regionSlug/prueflisten',
} as const

/** Link `to` paths. Map omits the trailing slash that `regionModeRouteIds` uses for committed matching. */
export const modeRoutePaths = {
  map: '/regionen/$regionSlug',
  notes: '/regionen/$regionSlug/hinweise',
  qa: '/regionen/$regionSlug/qa',
  reviewLists: '/regionen/$regionSlug/prueflisten',
} as const

export const regionModeOrder = ['map', 'notes', 'qa', 'reviewLists'] as const

export type RegionMode = keyof typeof regionModeRouteIds

const regionModeFlags = (mode: RegionMode) =>
  ({
    mode,
    isMap: mode === 'map',
    isNotes: mode === 'notes',
    isQa: mode === 'qa',
    isReviewLists: mode === 'reviewLists',
  }) satisfies {
    mode: RegionMode
    isMap: boolean
    isNotes: boolean
    isQa: boolean
    isReviewLists: boolean
  }

/**
 * Returns the active region mode and boolean flags, derived from the matched route.
 * Only call below the `/regionen/$regionSlug` layout route.
 */
export const useCurrentMode = () => {
  const deepestRouteId = useMatches({
    select: (matches) => matches[matches.length - 1]?.routeId,
  })
  if (deepestRouteId === regionModeRouteIds.notes) return regionModeFlags('notes')
  if (deepestRouteId === regionModeRouteIds.qa) return regionModeFlags('qa')
  if (deepestRouteId === regionModeRouteIds.reviewLists) return regionModeFlags('reviewLists')
  return regionModeFlags('map')
}

/**
 * Mode for chrome that should follow in-flight navigation (switcher highlight, panel width).
 * Uses TanStack Router pending-location matching, not React `useOptimistic`.
 * Only call below the `/regionen/$regionSlug` layout route.
 */
export const useOptimisticMode = () => {
  const matchRoute = useMatchRoute()
  const { regionSlug } = routeApi.useParams()
  const committedMode = useCurrentMode()

  for (const mode of regionModeOrder) {
    const pendingMatch = matchRoute({
      from: '/regionen/$regionSlug',
      to: modeRoutePaths[mode],
      params: { regionSlug },
      pending: true,
      fuzzy: false,
    })
    if (pendingMatch) return mode
  }

  return committedMode.mode
}
