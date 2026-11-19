import { useQuery } from '@tanstack/react-query'
import { bbox } from '@turf/turf'
import type { Geometry } from 'geojson'
import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { reviewEntriesQueryOptions } from '@/server/regions/regionQueryOptions'
import type { ReviewStatus } from '@/shared/reviewLists/reviewListStatusStyles'
import { useMapExtentFilter } from '../useMapExtentFilter'
import { useReviewListsModeParam } from './useReviewListsModeParam'
import { useSelectedReviewList } from './useSelectedReviewList'

type ReviewListEntryFeature = {
  geometry: Geometry
  properties: {
    id: number
    status: ReviewStatus
    source: string
    geometryType: string
    authorName?: string | null
    authorOsmName?: string | null
    commentCount: number
    data?: Record<string, string>
  }
}

const firstPosition = (geometry: Geometry) => {
  if (!('coordinates' in geometry)) return null
  let coords: unknown = geometry.coordinates
  while (Array.isArray(coords) && Array.isArray(coords[0])) coords = coords[0]
  if (!Array.isArray(coords)) return null
  const [lng, lat] = coords
  if (typeof lng !== 'number' || typeof lat !== 'number') return null
  return [lng, lat] satisfies [number, number]
}

/**
 * Entries of the selected review list: all of them (`features`), after the status/source/search
 * filters (`matchingFilters`) and after the map extent filter as well (`entries`). The list rows
 * and the count in the filter bar both call it; React Query fetches once.
 */
export const useReviewListEntries = () => {
  const region = useRegion()
  const { selectedListId } = useSelectedReviewList()
  const { reviewListsMode } = useReviewListsModeParam()
  const { data, isLoading, isError } = useQuery({
    ...reviewEntriesQueryOptions(region.slug, selectedListId),
    enabled: selectedListId !== undefined,
  })
  const features: ReviewListEntryFeature[] = data?.featureCollection.features ?? []
  const search = reviewListsMode.search ?? ''
  const passesExtent = useMapExtentFilter(reviewListsMode.extent ?? 'view')

  const matchingFilters = features
    .map((feature) => ({ feature, coordinates: firstPosition(feature.geometry) }))
    .filter(
      (entry): entry is { feature: ReviewListEntryFeature; coordinates: [number, number] } => {
        if (!entry.coordinates) return false // skip empty/degenerate geometry
        const props = entry.feature.properties
        if (reviewListsMode.status && props.status !== reviewListsMode.status) return false
        if (reviewListsMode.source && props.source !== reviewListsMode.source) return false
        if (search) {
          const haystack =
            `${props.id} ${props.authorName ?? ''} ${props.authorOsmName ?? ''} ${JSON.stringify(props.data ?? {})}`.toLowerCase()
          if (!haystack.includes(search.toLowerCase())) return false
        }
        return true
      },
    )
    // The first vertex stays the hover/click position; the extent filter uses the whole
    // geometry. Computed once here, not on every map move.
    .map((entry) => {
      const [minLng, minLat, maxLng, maxLat] = bbox(entry.feature.geometry)
      return { ...entry, bbox: [minLng, minLat, maxLng, maxLat] as const }
    })
  const entries = matchingFilters.filter((entry) => passesExtent(entry.bbox))

  return { selectedListId, isLoading, isError, features, matchingFilters, entries }
}
