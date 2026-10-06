import { useQuery } from '@tanstack/react-query'
import type { ExpressionSpecification } from 'maplibre-gl'
import { Layer, Source } from 'react-map-gl/maplibre'
import { useFeaturesParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/useFeaturesParam'
import {
  useHoveredListItem,
  useHoveredMapItemId,
} from '@/components/regionen/pageRegionSlug/modes/mode-list-store'
import { reviewHighlightIds } from '@/components/regionen/pageRegionSlug/modes/modeListItemId'
import { noteHighlightFilter } from '@/components/regionen/pageRegionSlug/modes/notes/noteSelectRingPaint'
import {
  reviewHighlightAreaLinePaint,
  reviewHighlightCirclePaint,
  reviewHighlightLinePaint,
} from '@/components/regionen/pageRegionSlug/modes/reviewLists/reviewHighlightPaint'
import { useReviewListsModeValue } from '@/components/regionen/pageRegionSlug/modes/reviewLists/useReviewListsModeParam'
import { useCurrentMode } from '@/components/regionen/pageRegionSlug/modes/useCurrentMode'
import { useRegionSlug } from '@/components/regionen/pageRegionSlug/regionUtils/useRegionSlug'
import {
  reviewEntriesQueryOptions,
  reviewListsQueryOptions,
} from '@/server/regions/regionQueryOptions'
import {
  reviewEntriesHitareaLayerId,
  reviewEntriesLayerId,
  reviewEntriesSourceId,
} from './reviewEntriesLayers.const'

// Status → color (matches the panel pills).
const STATUS_COLOR: ExpressionSpecification = [
  'match',
  ['get', 'status'],
  'OK',
  '#16a34a', // green-600
  'PROBLEM',
  '#dc2626', // red-600
  '#6b7280', // gray-500 (OPEN / default)
]

/**
 * Map source + layers for the review lists mode. Renders the selected list's entries (points,
 * lines, polygons, and their Multi* variants) from a GeoJSON source, colored by status. Only
 * active in the review lists mode.
 */
export const SourcesLayersReviewEntries = () => {
  const currentMode = useCurrentMode()
  const regionSlug = useRegionSlug()
  const { key, new: isComposing, move: isMoveArmed } = useReviewListsModeValue()
  const { featuresParam } = useFeaturesParam()
  const hoveredListItem = useHoveredListItem()
  const hoveredMapItemId = useHoveredMapItemId()

  const { data: lists } = useQuery({
    ...reviewListsQueryOptions(regionSlug),
    enabled: currentMode.isReviewLists,
  })
  const activeListId = key ?? lists?.lists[0]?.id

  const { data } = useQuery({
    ...reviewEntriesQueryOptions(regionSlug, activeListId),
    enabled: currentMode.isReviewLists && activeListId !== undefined,
  })

  if (!currentMode.isReviewLists || !data) return null

  const selectedIds = featuresParam
    .filter((feature) => feature.sourceId === reviewEntriesSourceId)
    .map((feature) => Number(feature.id))
  const editingId =
    !isComposing && isMoveArmed && selectedIds.length === 1 ? selectedIds[0] : undefined
  const haloIds = reviewHighlightIds(selectedIds, hoveredListItem?.id, hoveredMapItemId).filter(
    (id) => id !== editingId,
  )

  const notEditing = (filter: ExpressionSpecification) =>
    editingId === undefined
      ? filter
      : (['all', filter, ['!=', ['get', 'id'], editingId]] as ExpressionSpecification)

  return (
    <>
      <Source
        id={reviewEntriesSourceId}
        type="geojson"
        data={data.featureCollection}
        promoteId="id"
      />
      {/* Selection and hover use the same shadow under status colors. */}
      <Layer
        id={`${reviewEntriesLayerId}-halo-area`}
        key={`${reviewEntriesLayerId}-halo-area`}
        source={reviewEntriesSourceId}
        type="line"
        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
        filter={[
          'all',
          ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
          noteHighlightFilter(haloIds),
        ]}
        paint={reviewHighlightAreaLinePaint}
      />
      <Layer
        id={`${reviewEntriesLayerId}-halo-line`}
        key={`${reviewEntriesLayerId}-halo-line`}
        source={reviewEntriesSourceId}
        type="line"
        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
        filter={[
          'all',
          ['in', ['geometry-type'], ['literal', ['LineString', 'MultiLineString']]],
          noteHighlightFilter(haloIds),
        ]}
        paint={reviewHighlightLinePaint}
      />
      <Layer
        id={`${reviewEntriesLayerId}-halo`}
        key={`${reviewEntriesLayerId}-halo`}
        source={reviewEntriesSourceId}
        type="circle"
        filter={[
          'all',
          ['in', ['geometry-type'], ['literal', ['Point', 'MultiPoint']]],
          noteHighlightFilter(haloIds),
        ]}
        paint={reviewHighlightCirclePaint}
      />
      <Layer
        id={`${reviewEntriesLayerId}-fill`}
        key={`${reviewEntriesLayerId}-fill`}
        source={reviewEntriesSourceId}
        type="fill"
        filter={notEditing(['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]])}
        paint={{ 'fill-color': STATUS_COLOR, 'fill-opacity': 0.25 }}
      />
      <Layer
        id={`${reviewEntriesLayerId}-line`}
        key={`${reviewEntriesLayerId}-line`}
        source={reviewEntriesSourceId}
        type="line"
        filter={notEditing([
          'in',
          ['geometry-type'],
          ['literal', ['LineString', 'MultiLineString', 'Polygon', 'MultiPolygon']],
        ])}
        paint={{ 'line-color': STATUS_COLOR, 'line-width': 2 }}
      />
      <Layer
        id={reviewEntriesLayerId}
        key={reviewEntriesLayerId}
        source={reviewEntriesSourceId}
        type="circle"
        filter={notEditing(['in', ['geometry-type'], ['literal', ['Point', 'MultiPoint']]])}
        paint={{
          'circle-radius': 6,
          'circle-color': STATUS_COLOR,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.5,
        }}
      />
      {/* Hitareas last (on top): only these ids are in `interactiveLayerIds`. Opacity 0 still
          participates in queryRenderedFeatures, same as atlas `hitarea-*` layers. */}
      <Layer
        id={`${reviewEntriesHitareaLayerId}-fill`}
        key={`${reviewEntriesHitareaLayerId}-fill`}
        source={reviewEntriesSourceId}
        type="fill"
        filter={notEditing(['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]])}
        paint={{ 'fill-color': '#000', 'fill-opacity': 0 }}
      />
      <Layer
        id={`${reviewEntriesHitareaLayerId}-line`}
        key={`${reviewEntriesHitareaLayerId}-line`}
        source={reviewEntriesSourceId}
        type="line"
        filter={notEditing([
          'in',
          ['geometry-type'],
          ['literal', ['LineString', 'MultiLineString', 'Polygon', 'MultiPolygon']],
        ])}
        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
        paint={{
          'line-color': '#000',
          'line-opacity': 0,
          'line-width': ['interpolate', ['linear'], ['zoom'], 9, 8, 14, 14, 22, 16],
        }}
      />
      <Layer
        id={reviewEntriesHitareaLayerId}
        key={reviewEntriesHitareaLayerId}
        source={reviewEntriesSourceId}
        type="circle"
        filter={notEditing(['in', ['geometry-type'], ['literal', ['Point', 'MultiPoint']]])}
        paint={{
          'circle-color': '#000',
          'circle-opacity': 0,
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 12, 16, 16],
        }}
      />
    </>
  )
}
