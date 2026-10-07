import { getRouteApi } from '@tanstack/react-router'
import { useRegionSearchNavigation } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useRegionSearchNavigation'
import { sourcesBackgroundsRaster } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/sourcesBackgroundsRaster.const'
import { getMapParamFromSearch } from '@/shared/regionen/regionSearchSchemas'
import { useCurrentMode } from '../useCurrentMode'
import { pickAerialBackground } from './utils/pickAerialBackground'

const routeApi = getRouteApi('/regionen/$regionSlug')

/**
 * The aerial image the Messen mode shows by itself at the map center (`pickAerialBackground`);
 * `undefined` in every other mode. It may be one the region does not list.
 */
export const useMeasureAutomaticBackground = () => {
  const { isMeasure } = useCurrentMode()
  const { search } = useRegionSearchNavigation()
  const allowedIds = routeApi.useLoaderData({
    select: (data) => (data.authorized ? data.region.backgroundSources : undefined),
  })
  if (!isMeasure) return undefined

  const { lng, lat } = getMapParamFromSearch(search)
  return pickAerialBackground({
    sources: sourcesBackgroundsRaster,
    allowedIds: allowedIds ?? [],
    center: [lng, lat],
  })?.id
}
