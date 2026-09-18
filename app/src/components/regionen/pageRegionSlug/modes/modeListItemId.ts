import type { MapGeoJSONFeature } from 'react-map-gl/maplibre'
import { additionalSourceKeys } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/url'
import { notesListItemId } from './notes/notesListHoverId'

const [osmNotesSourceId, internalNotesSourceId, reviewEntriesSourceId, qaSourceId] =
  additionalSourceKeys

export const qaListItemId = (areaId: string | number) => `qa-${areaId}`

export const reviewListItemId = (id: number) => `review-${id}`

/** Numeric review-entry id from a hovered list-row id. */
export const parseReviewListHoverId = (hoveredListItemId: string | undefined) => {
  if (!hoveredListItemId?.startsWith('review-')) return null
  const id = Number(hoveredListItemId.slice('review-'.length))
  return Number.isFinite(id) ? id : null
}

/** Selection plus list-hover and map-hover ids for review-entry highlight layers. */
export const reviewHighlightIds = (
  selectedIds: number[],
  hoveredListItemId: string | undefined,
  hoveredMapItemId: string | null | undefined,
) => {
  const hoverIds = [hoveredListItemId, hoveredMapItemId ?? undefined]
    .map((id) => parseReviewListHoverId(id))
    .filter((id): id is number => id != null)
  return [...selectedIds, ...hoverIds]
}

/**
 * Mode sources set `<Source promoteId="id" />`, which copies `properties.id` onto
 * `feature.id` (`number | string | undefined`). Use that field, never `properties.id`.
 * Side note: without promoteId MapLibre drops non-integer ids, so picking and feature-state break.
 */
type MapFeatureId = Pick<MapGeoJSONFeature, 'source' | 'id'>

/** Mode-prefixed list-row id for a map feature, or null when the source has no mode list. */
export const listItemIdFromMapFeature = (feature: MapFeatureId) => {
  const { source, id } = feature
  if (id == null) return null
  if (source === osmNotesSourceId || source === internalNotesSourceId) {
    return notesListItemId(source, id)
  }
  if (source === qaSourceId) {
    return qaListItemId(id)
  }
  if (source === reviewEntriesSourceId) {
    return reviewListItemId(Number(id))
  }
  return null
}

/** First mode-owned feature in a MapLibre hit list (atlas/mask layers return null). */
export const listItemIdFromMapFeatures = (features: MapFeatureId[] | undefined) => {
  for (const feature of features ?? []) {
    const listId = listItemIdFromMapFeature(feature)
    if (listId) return listId
  }
  return null
}
