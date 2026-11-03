import { feature, featureCollection } from '@turf/helpers'
import { Layer, Source } from 'react-map-gl/maplibre'
import {
  useSpaceFinderBoundaryHighlightFilled,
  useSpaceFinderBoundaryHighlightGeom,
  useSpaceFinderCarriagewaysVisible,
  useSpaceFinderCensusVisible,
  useSpaceFinderMinAreaDraft,
  useSpaceFinderUserObstaclesGeom,
  useSpaceFinderUserObstaclesVisible,
  useSpaceFinderVegetationAttribution,
  useSpaceFinderVegetationVisible,
} from '@/components/regionen/pageRegionSlug/hooks/mapState/space-finder-boundary-store'
import {
  useSpaceFinderCandidateSelectActive,
  useSpaceFinderCandidates,
  useSpaceFinderFocusedCandidateH3Id,
} from '@/components/regionen/pageRegionSlug/hooks/mapState/space-finder-candidates-store'
import { useHoveredListItem } from '@/components/regionen/pageRegionSlug/modes/mode-list-store'
import { appliedMinAreaM2 } from '@/components/regionen/pageRegionSlug/modes/spaceFinder/spaceFinderModeParam'
import { useSpaceFinderModeParam } from '@/components/regionen/pageRegionSlug/modes/spaceFinder/useSpaceFinderModeParam'
import { useSpaceFinderSelection } from '@/components/regionen/pageRegionSlug/modes/spaceFinder/useSpaceFinderSelection'
import { useRegionSlug } from '@/components/regionen/pageRegionSlug/regionUtils/useRegionSlug'
import { getAppBaseUrl } from '@/components/shared/utils/getAppBaseUrl'
import { spaceFinderTilesPath } from '@/server/spaceFinder/spaceFinderTilesPath'
import {
  SPACE_FINDER_SCORE_PROPERTY,
  type SpaceFinderScoreMode,
} from '@/shared/regionen/spaceFinderScoreMode.const'
import { getLayerHighlightId } from '../utils/layerHighlight'
import { LayerHighlight } from './LayerHighlight'

export const spaceFinderHexagonsSourceId = 'space-finder-hexagons-source'
export const spaceFinderHexagonsLayerId = 'space-finder-hexagons'
/**
 * Two invisible anchor layers, mounted on the first render (with or without a `runId`) and
 * never removed or recreated afterwards. `SpaceFinderOverlayAnchors` sits at the same position
 * in both returns of `SourcesLayersSpaceFinder`, so React keeps it mounted when `runId`
 * changes.
 *
 * - The hexagon layers (fill/highlight/label) always attach directly below the
 *   `ceiling` via `beforeId`.
 * - The control layers (vegetation, carriageways, census, "Eigene Daten") attach below
 *   the `floor` via `beforeId`, which sits directly before the ceiling, so they always
 *   stay below the hexagons.
 *
 * Without the anchors a remount (e.g. toggling via ScoreModeSwitcher or the switches)
 * would add a layer without `beforeId` at the very top, above other layers already
 * visible.
 */
const spaceFinderOverlayFloorLayerId = 'space-finder-overlay-floor'
const spaceFinderOverlayCeilingLayerId = 'space-finder-overlay-ceiling'
/** MVT layer name of the `space_finder_hexagons` tile function (see registerSpaceFinderFunctions.server.ts). */
export const spaceFinderHexagonsSourceLayer = 'space_finder_hexagons'
/**
 * Separate point layer with the hexagon center, each hexagon contained in exactly one
 * tile (see registerSpaceFinderFunctions.server.ts). The fill layer
 * `spaceFinderHexagonsSourceLayer` buffers & clips polygons per tile, so the same hexagon
 * often appears in several tiles with shifted centroids — a label on it would be
 * duplicated and off-center. Hence a separate, unbuffered point layer just for the
 * label.
 */
const spaceFinderHexagonsLabelSourceLayer = 'space_finder_hexagons_label'
const spaceFinderHexagonsLabelLayerId = 'space-finder-hexagons-label'

// From zoom 18 on, the score of the active display mode (Kombination/Bedarf/
// Bebauung) is shown as a readable label in the hexagon. Below zoom 18 there is
// only the fill color, no label.
const HEXAGON_LABEL_MIN_ZOOM = 18

// Flächenfinder result layers (Flächenfinder).
//
// Renders the immutable result of one SpaceFinderRun from the authenticated app route
// `/api/regions/:slug/space-finder-tiles/:layer/{z}/{x}/{y}?run_id=N` (see spaceFinderTilesPath). Scores
// and census population are member-only, so the tiles do not come from Martin's public hosts. A
// finished run is immutable; the route answers with a private 7-day browser cache.
//
// When the active variant has no run yet (`runId` from `useSpaceFinderSelection`), this renders
// nothing — this component only mounts inside the Flächenfinder mode anyway (`RegionMap`).

// Score → color intensity ramp (0 = excluded/transparent … 100 = strongest color).
// Hexagons with value 0 get no fill, only the outline (fill-outline-color) still
// marks them. Between 0 and HEXAGON_FADE_IN_THRESHOLD the opacity fades in gradually
// (instead of switching hard at 0) – otherwise many values just above 0 produce a
// patchy pattern of abruptly alternating transparent and opaque neighbor hexagons.
// The hue depends on the active display mode — same colors as `spaceFinderGroupStyle`
// (Bedarf blue, Bebauung purple); Kombination is not a factor group and gets a
// positive yellow-green/lime (red reads as negative, good areas should read positive).
// The vegetation layer uses a bluish emerald so both stay distinguishable.
const HEXAGON_FADE_IN_THRESHOLD = 10
const HEXAGON_SCORE_RAMP: Record<SpaceFinderScoreMode, { fadeFrom: string; stops: string[] }> = {
  kombination: {
    fadeFrom: 'rgba(247,254,231,0)',
    stops: ['#f7fee7', '#bef264', '#84cc16', '#3f6212'],
  },
  bedarf: {
    fadeFrom: 'rgba(239,246,255,0)',
    stops: ['#eff6ff', '#60a5fa', '#2563eb', '#1e3a8a'],
  },
  bebauung: {
    fadeFrom: 'rgba(250,245,255,0)',
    stops: ['#faf5ff', '#c084fc', '#9333ea', '#581c87'],
  },
}
const scoreColor = (property: string, mode: SpaceFinderScoreMode) => {
  const { fadeFrom, stops } = HEXAGON_SCORE_RAMP[mode]
  return [
    'interpolate',
    ['linear'],
    ['coalesce', ['get', property], 0],
    0,
    fadeFrom,
    HEXAGON_FADE_IN_THRESHOLD,
    stops[0],
    40,
    stops[1],
    70,
    stops[2],
    100,
    stops[3],
  ]
}

// Original fixed layer opacity (before the transparency slider existed).
// 100% on the slider maps to exactly this value, not CSS opacity 1 —
// it scales the full range below, so "100%" looks like the old, unchanged layer.
const MAX_FILL_OPACITY = 0.7

// Dimmed : fully visible ratio from the original fixed values (0.1/0.7), now applied
// relative to the slider opacity (`space.opacity`, ScoreModeSwitcher) so dimming stays
// visible at every transparency setting.
const DIMMED_RATIO = 0.1 / 0.7

// Area cluster filter: only with the checkbox on (filterOn) and a target size set
// (minArea > 0), hexagons whose contiguous area (`cluster_area_m2`) is below the
// target size (or that belong to no cluster, i.e. NULL) are strongly dimmed instead
// of hidden – so the score coloring stays visible as context. Checkbox off → no
// filter, all hexagons colored with the configured opacity.
const clusterOpacity = (filterOn: boolean, minArea: number, maxOpacity: number) =>
  filterOn && minArea > 0
    ? [
        'case',
        ['>=', ['coalesce', ['get', 'cluster_area_m2'], 0], minArea],
        maxOpacity,
        maxOpacity * DIMMED_RATIO,
      ]
    : maxOpacity

const hexagonFillLayerProps = (
  property: string,
  mode: SpaceFinderScoreMode,
  filterOn: boolean,
  minArea: number,
  opacityPct: number,
) => ({
  id: spaceFinderHexagonsLayerId,
  source: spaceFinderHexagonsSourceId,
  'source-layer': spaceFinderHexagonsSourceLayer,
  type: 'fill' as const,
  paint: {
    'fill-color': scoreColor(property, mode) as any,
    'fill-opacity': clusterOpacity(filterOn, minArea, (opacityPct / 100) * MAX_FILL_OPACITY) as any,
    'fill-outline-color': 'rgba(0,0,0,0.15)',
  },
})

const hexagonLabelLayerProps = (property: string) => ({
  id: spaceFinderHexagonsLabelLayerId,
  source: spaceFinderHexagonsSourceId,
  'source-layer': spaceFinderHexagonsLabelSourceLayer,
  type: 'symbol' as const,
  minzoom: HEXAGON_LABEL_MIN_ZOOM,
  layout: {
    'text-field': ['to-string', ['round', ['coalesce', ['get', property], 0]]] as any,
    'text-size': 14,
    'text-allow-overlap': true,
    'text-ignore-placement': true,
  },
  paint: {
    'text-color': '#1a1a1a',
    'text-halo-color': 'rgba(255,255,255,0.85)',
    'text-halo-width': 1.5,
  },
})

// Census population points (factor „Bewohnerbedarf"). Tiles come directly from
// `data.census_population_point`, limited to the study area's bounding box —
// nothing is stored per run in the space_finder schema (see the tile function
// `space_finder.space_finder_census`). A point usually sits on the building center and carries its
// population.
const spaceFinderCensusSourceId = 'space-finder-census-source'

const CENSUS_ATTRIBUTION =
  '<a href="https://www.zensus2022.de/" target="_blank" rel="noopener">Zensus 2022</a> (Destatis, auf Gebäude disaggregiert)'

// From zoom 17 on, write the population next to the point — below that, buildings
// are too close together for numbers to be readable.
const CENSUS_LABEL_MIN_ZOOM = 17

const censusCircleLayerProps = {
  id: 'space-finder-census-circle',
  source: spaceFinderCensusSourceId,
  'source-layer': 'space_finder_census',
  type: 'circle' as const,
  paint: {
    // Radius grows with zoom AND population, so an apartment building can be told
    // apart from a single-family house even without a label.
    'circle-radius': [
      'interpolate',
      ['linear'],
      ['zoom'],
      12,
      2,
      16,
      ['interpolate', ['linear'], ['coalesce', ['get', 'einwohner'], 0], 0, 3, 100, 8],
      19,
      ['interpolate', ['linear'], ['coalesce', ['get', 'einwohner'], 0], 0, 5, 100, 16],
    ] as any,
    'circle-color': [
      'interpolate',
      ['linear'],
      ['coalesce', ['get', 'einwohner'], 0],
      0,
      '#bfdbfe',
      25,
      '#60a5fa',
      100,
      '#1d4ed8',
    ] as any,
    'circle-opacity': 0.8,
    'circle-stroke-color': '#1e3a8a',
    'circle-stroke-width': 0.75,
  },
}

const censusLabelLayerProps = {
  id: 'space-finder-census-label',
  source: spaceFinderCensusSourceId,
  'source-layer': 'space_finder_census',
  type: 'symbol' as const,
  minzoom: CENSUS_LABEL_MIN_ZOOM,
  layout: {
    'text-field': ['to-string', ['round', ['coalesce', ['get', 'einwohner'], 0]]] as any,
    'text-size': 12,
    'text-offset': [0, -1.1] as [number, number],
    'text-allow-overlap': false,
  },
  paint: {
    'text-color': '#1e3a8a',
    'text-halo-color': 'rgba(255,255,255,0.85)',
    'text-halo-width': 1.5,
  },
}

// Vegetation as a light emerald fill. The bluish green stands out from the yellow-green
// (lime) hexagon ramp.
const VEGETATION_FILL_COLOR = '#6ee7b7'
const VEGETATION_LINE_COLOR = '#047857'

// See comment at spaceFinderOverlayCeilingLayerId.
const SpaceFinderOverlayAnchors = () => (
  <>
    <Layer id={spaceFinderOverlayFloorLayerId} type="background" layout={{ visibility: 'none' }} />
    <Layer
      id={spaceFinderOverlayCeilingLayerId}
      type="background"
      layout={{ visibility: 'none' }}
    />
  </>
)

const BoundaryHighlightLayer = () => {
  const geom = useSpaceFinderBoundaryHighlightGeom()
  const filled = useSpaceFinderBoundaryHighlightFilled()
  if (!geom) return null
  return (
    <Source
      id="space-finder-boundary-highlight"
      type="geojson"
      data={feature(geom as GeoJSON.Geometry)}
    >
      {filled && (
        <Layer
          id="space-finder-boundary-highlight-fill"
          type="fill"
          paint={{ 'fill-color': '#3b82f6', 'fill-opacity': 0.1 }}
        />
      )}
      <Layer
        id="space-finder-boundary-highlight-outline"
        type="line"
        paint={{ 'line-color': '#2563eb', 'line-width': 2, 'line-dasharray': [4, 2] }}
      />
    </Source>
  )
}

// Control layer for the uploaded „Eigene Daten" (all datasets from factorConfig.user_datasets).
// The geometry lives client-side in the store (set by `SpaceFinderBody`); points,
// lines and polygons get their own layers. Toggled via the panel switch
// (userObstaclesVisible) like vegetation/carriageways.
const UserObstaclesLayer = () => {
  const geom = useSpaceFinderUserObstaclesGeom()
  const visible = useSpaceFinderUserObstaclesVisible()
  if (!geom || !visible) return null
  return (
    <Source id="space-finder-user-obstacles" type="geojson" data={geom as any}>
      <Layer
        id="space-finder-user-obstacles-fill"
        beforeId={spaceFinderOverlayFloorLayerId}
        type="fill"
        filter={['==', ['geometry-type'], 'Polygon']}
        paint={{ 'fill-color': '#7c3aed', 'fill-opacity': 0.2 }}
      />
      <Layer
        id="space-finder-user-obstacles-line"
        beforeId={spaceFinderOverlayFloorLayerId}
        type="line"
        filter={['in', ['geometry-type'], ['literal', ['LineString', 'Polygon']]]}
        paint={{ 'line-color': '#6d28d9', 'line-width': 2 }}
      />
      <Layer
        id="space-finder-user-obstacles-circle"
        beforeId={spaceFinderOverlayFloorLayerId}
        type="circle"
        filter={['==', ['geometry-type'], 'Point']}
        paint={{
          'circle-radius': 4,
          'circle-color': '#7c3aed',
          'circle-stroke-color': '#6d28d9',
          'circle-stroke-width': 1,
        }}
      />
    </Source>
  )
}

// Yellow outline of the hexagons selected as candidates (selection tool, see
// `SpaceFinderCandidatesSection`). The geometries are already in the store on click,
// hence a separate GeoJSON source instead of a filter expression on the vector source.
// This keeps the marking visible even when a hexagon is not in the rendered tiles.
//
// All candidates are only visible while the selection tool is active (`selectActive`).
// Turning the toggle off or collapsing »Auswahl« sets `selectActive` to false and hides
// the marking without clearing the selection itself.
//
// The candidate clicked in the list (`focusedH3Id`) and the one hovered there also get
// a fill and a thicker outline, even when the tool is off.
const CANDIDATE_LIST_ITEM_ID_PREFIX = 'spaceFinder-candidate-'
export const spaceFinderCandidateListItemId = (h3Id: string) =>
  `${CANDIDATE_LIST_ITEM_ID_PREFIX}${h3Id}`

const CandidateHighlightLayer = ({ runKey }: { runKey: string | null }) => {
  const selectActive = useSpaceFinderCandidateSelectActive()
  const candidates = useSpaceFinderCandidates(runKey)
  const focusedH3Id = useSpaceFinderFocusedCandidateH3Id()
  const hoveredId = useHoveredListItem()?.id
  const hoveredH3Id = hoveredId?.startsWith(CANDIDATE_LIST_ITEM_ID_PREFIX)
    ? hoveredId.slice(CANDIDATE_LIST_ITEM_ID_PREFIX.length)
    : null

  const emphasized = candidates.filter((c) => c.h3Id === focusedH3Id || c.h3Id === hoveredH3Id)
  const outlined = selectActive ? candidates : emphasized
  if (!outlined.length) return null

  return (
    <>
      <Source
        id="space-finder-candidates"
        type="geojson"
        data={featureCollection(
          outlined.map((candidate) => feature(candidate.geometry, {}, { id: candidate.h3Id })),
        )}
      >
        <Layer
          id="space-finder-candidates-outline"
          type="line"
          paint={{ 'line-color': '#eab308', 'line-width': 2.5 }}
        />
      </Source>
      {emphasized.length > 0 && (
        <Source
          id="space-finder-candidates-emphasis"
          type="geojson"
          data={featureCollection(
            emphasized.map((candidate) => feature(candidate.geometry, {}, { id: candidate.h3Id })),
          )}
        >
          <Layer
            id="space-finder-candidates-emphasis-fill"
            type="fill"
            paint={{ 'fill-color': '#eab308', 'fill-opacity': 0.35 }}
          />
          <Layer
            id="space-finder-candidates-emphasis-outline"
            type="line"
            paint={{ 'line-color': '#a16207', 'line-width': 4 }}
          />
        </Source>
      )}
    </>
  )
}

export const SourcesLayersSpaceFinder = () => {
  const regionSlug = useRegionSlug()
  const { runId, candidateRunKey, variant } = useSpaceFinderSelection()
  const { spaceFinderMode } = useSpaceFinderModeParam()
  const minAreaDraft = useSpaceFinderMinAreaDraft()
  const scoreMode = spaceFinderMode.score ?? 'kombination'
  const hexagonsOpacityPct = spaceFinderMode.opacity ?? 100
  const minArea = appliedMinAreaM2(
    spaceFinderMode.minArea === true,
    variant?.factorConfig.min_area_m2,
    minAreaDraft,
  )
  const areaFilterOn = minArea > 0
  const vegetationOn = useSpaceFinderVegetationVisible()
  const vegetationAttribution = useSpaceFinderVegetationAttribution()
  const carriagewaysOn = useSpaceFinderCarriagewaysVisible()
  const censusOn = useSpaceFinderCensusVisible()

  if (runId == null)
    return (
      <>
        <BoundaryHighlightLayer />
        <SpaceFinderOverlayAnchors />
        <UserObstaclesLayer />
      </>
    )

  // MapLibre needs absolute tile URLs (same as private backgrounds in useRegionBackgrounds).
  const hexagonsUrl = getAppBaseUrl(spaceFinderTilesPath(regionSlug, 'hexagons', runId))
  const vegetationUrl = getAppBaseUrl(spaceFinderTilesPath(regionSlug, 'vegetation', runId))
  const carriagewaysUrl = getAppBaseUrl(spaceFinderTilesPath(regionSlug, 'carriageways', runId))
  const censusUrl = getAppBaseUrl(spaceFinderTilesPath(regionSlug, 'census', runId))
  const fillLayerProps = hexagonFillLayerProps(
    SPACE_FINDER_SCORE_PROPERTY[scoreMode],
    scoreMode,
    areaFilterOn,
    minArea,
    hexagonsOpacityPct,
  )

  return (
    <>
      <BoundaryHighlightLayer />
      <SpaceFinderOverlayAnchors />

      {hexagonsOpacityPct > 0 && (
        <>
          <Source
            id={spaceFinderHexagonsSourceId}
            type="vector"
            tiles={[hexagonsUrl]}
            promoteId="h3_id"
          />
          <Layer {...fillLayerProps} beforeId={spaceFinderOverlayCeilingLayerId} />
          <LayerHighlight
            {...fillLayerProps}
            id={getLayerHighlightId(spaceFinderHexagonsLayerId)}
            beforeId={spaceFinderOverlayCeilingLayerId}
          />
          <Layer
            {...hexagonLabelLayerProps(SPACE_FINDER_SCORE_PROPERTY[scoreMode])}
            beforeId={spaceFinderOverlayCeilingLayerId}
          />
        </>
      )}

      {/* After the hexagon layers so the yellow selection outline sits on top. */}
      <CandidateHighlightLayer runKey={candidateRunKey} />

      <UserObstaclesLayer />

      {vegetationOn && (
        <>
          <Source
            id="space-finder-vegetation-source"
            type="vector"
            tiles={[vegetationUrl]}
            attribution={vegetationAttribution ?? undefined}
          />
          <Layer
            id="space-finder-vegetation-fill"
            beforeId={spaceFinderOverlayFloorLayerId}
            source="space-finder-vegetation-source"
            source-layer="space_finder_vegetation"
            type="fill"
            paint={{ 'fill-color': VEGETATION_FILL_COLOR, 'fill-opacity': 0.45 }}
          />
          <Layer
            id="space-finder-vegetation-outline"
            beforeId={spaceFinderOverlayFloorLayerId}
            source="space-finder-vegetation-source"
            source-layer="space_finder_vegetation"
            type="line"
            paint={{ 'line-color': VEGETATION_LINE_COLOR, 'line-width': 0.5, 'line-opacity': 0.8 }}
          />
        </>
      )}

      {carriagewaysOn && (
        <>
          <Source id="space-finder-carriageways-source" type="vector" tiles={[carriagewaysUrl]} />
          <Layer
            id="space-finder-carriageways-fill"
            beforeId={spaceFinderOverlayFloorLayerId}
            source="space-finder-carriageways-source"
            source-layer="space_finder_carriageways"
            type="fill"
            paint={{ 'fill-color': '#b45309', 'fill-opacity': 0.45 }}
          />
          <Layer
            id="space-finder-carriageways-outline"
            beforeId={spaceFinderOverlayFloorLayerId}
            source="space-finder-carriageways-source"
            source-layer="space_finder_carriageways"
            type="line"
            paint={{ 'line-color': '#78350f', 'line-width': 0.5, 'line-opacity': 0.6 }}
          />
        </>
      )}

      {censusOn && (
        <>
          <Source
            id={spaceFinderCensusSourceId}
            type="vector"
            tiles={[censusUrl]}
            attribution={CENSUS_ATTRIBUTION}
          />
          <Layer {...censusCircleLayerProps} beforeId={spaceFinderOverlayFloorLayerId} />
          <Layer {...censusLabelLayerProps} beforeId={spaceFinderOverlayFloorLayerId} />
        </>
      )}
    </>
  )
}
