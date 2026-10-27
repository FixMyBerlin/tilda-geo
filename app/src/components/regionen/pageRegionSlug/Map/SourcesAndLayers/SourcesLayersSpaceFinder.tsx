import { feature, featureCollection } from '@turf/helpers'
import { useEffect } from 'react'
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
import { getTilesUrl } from '@/components/shared/utils/getTilesUrl'
import {
  PLANNING_SCORE_PROPERTY,
  type PlanningScoreMode,
} from '@/shared/regionen/planningScoreMode.const'
import { getLayerHighlightId } from '../utils/layerHighlight'
import { LayerHighlight } from './LayerHighlight'

export const planningHexagonsSourceId = 'planning-hexagons-source'
export const planningHexagonsLayerId = 'planning-hexagons'
/**
 * Two invisible anchor layers, mounted only on the first render with a `runId` set and
 * never removed or recreated afterwards.
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
const planningOverlayFloorLayerId = 'planning-overlay-floor'
const planningOverlayCeilingLayerId = 'planning-overlay-ceiling'
/** MVT layer name of the Martin function source (see registerPlanningFunctions.server.ts). */
export const planningHexagonsSourceLayer = 'planning_hexagons'
/**
 * Separate point layer with the hexagon center, each hexagon contained in exactly one
 * tile (see registerPlanningFunctions.server.ts). The fill layer
 * `planningHexagonsSourceLayer` buffers & clips polygons per tile, so the same hexagon
 * often appears in several tiles with shifted centroids — a label on it would be
 * duplicated and off-center. Hence a separate, unbuffered point layer just for the
 * label.
 */
const planningHexagonsLabelSourceLayer = 'planning_hexagons_label'
const planningHexagonsLabelLayerId = 'planning-hexagons-label'

// From zoom 18 on, the score of the active display mode (Kombination/Bedarf/
// Bebauung) is shown as a readable label in the hexagon. Below zoom 18 there is
// only the fill color, no label.
const HEXAGON_LABEL_MIN_ZOOM = 18

// Planning module result layers (Flächenfinder).
//
// Renders the immutable result of one PlanningRun via the Martin function source
// `planning_hexagons`, keyed by `?run_id=N`. Because a run is immutable, the
// run_id-keyed tile URL is cached effectively forever (separate nginx
// `planning_cache` zone, see configs/nginx.conf).
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
const HEXAGON_SCORE_RAMP: Record<PlanningScoreMode, { fadeFrom: string; stops: string[] }> = {
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
const scoreColor = (property: string, mode: PlanningScoreMode) => {
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
  mode: PlanningScoreMode,
  filterOn: boolean,
  minArea: number,
  opacityPct: number,
) => ({
  id: planningHexagonsLayerId,
  source: planningHexagonsSourceId,
  'source-layer': planningHexagonsSourceLayer,
  type: 'fill' as const,
  paint: {
    'fill-color': scoreColor(property, mode) as any,
    'fill-opacity': clusterOpacity(filterOn, minArea, (opacityPct / 100) * MAX_FILL_OPACITY) as any,
    'fill-outline-color': 'rgba(0,0,0,0.15)',
  },
})

const hexagonLabelLayerProps = (property: string) => ({
  id: planningHexagonsLabelLayerId,
  source: planningHexagonsSourceId,
  'source-layer': planningHexagonsLabelSourceLayer,
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
// nothing is stored per run in the planning schema (see the Martin function
// `planning_census`). A point usually sits on the building center and carries its
// population.
const planningCensusSourceId = 'planning-census-source'

const CENSUS_ATTRIBUTION =
  '<a href="https://www.zensus2022.de/" target="_blank" rel="noopener">Zensus 2022</a> (Destatis, auf Gebäude disaggregiert)'

// From zoom 17 on, write the population next to the point — below that, buildings
// are too close together for numbers to be readable.
const CENSUS_LABEL_MIN_ZOOM = 17

const censusCircleLayerProps = {
  id: 'planning-census-circle',
  source: planningCensusSourceId,
  'source-layer': 'planning_census',
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
  id: 'planning-census-label',
  source: planningCensusSourceId,
  'source-layer': 'planning_census',
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

const BoundaryHighlightLayer = () => {
  const geom = useSpaceFinderBoundaryHighlightGeom()
  const filled = useSpaceFinderBoundaryHighlightFilled()
  if (!geom) return null
  return (
    <Source
      id="planning-boundary-highlight"
      type="geojson"
      data={feature(geom as GeoJSON.Geometry)}
    >
      {filled && (
        <Layer
          id="planning-boundary-highlight-fill"
          type="fill"
          paint={{ 'fill-color': '#3b82f6', 'fill-opacity': 0.1 }}
        />
      )}
      <Layer
        id="planning-boundary-highlight-outline"
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
    <Source id="planning-user-obstacles" type="geojson" data={geom as any}>
      <Layer
        id="planning-user-obstacles-fill"
        beforeId={planningOverlayFloorLayerId}
        type="fill"
        filter={['==', ['geometry-type'], 'Polygon']}
        paint={{ 'fill-color': '#7c3aed', 'fill-opacity': 0.2 }}
      />
      <Layer
        id="planning-user-obstacles-line"
        beforeId={planningOverlayFloorLayerId}
        type="line"
        filter={['in', ['geometry-type'], ['literal', ['LineString', 'Polygon']]]}
        paint={{ 'line-color': '#6d28d9', 'line-width': 2 }}
      />
      <Layer
        id="planning-user-obstacles-circle"
        beforeId={planningOverlayFloorLayerId}
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
        id="planning-candidates"
        type="geojson"
        data={featureCollection(
          outlined.map((candidate) => feature(candidate.geometry, {}, { id: candidate.h3Id })),
        )}
      >
        <Layer
          id="planning-candidates-outline"
          type="line"
          paint={{ 'line-color': '#eab308', 'line-width': 2.5 }}
        />
      </Source>
      {emphasized.length > 0 && (
        <Source
          id="planning-candidates-emphasis"
          type="geojson"
          data={featureCollection(
            emphasized.map((candidate) => feature(candidate.geometry, {}, { id: candidate.h3Id })),
          )}
        >
          <Layer
            id="planning-candidates-emphasis-fill"
            type="fill"
            paint={{ 'fill-color': '#eab308', 'fill-opacity': 0.35 }}
          />
          <Layer
            id="planning-candidates-emphasis-outline"
            type="line"
            paint={{ 'line-color': '#a16207', 'line-width': 4 }}
          />
        </Source>
      )}
    </>
  )
}

export const SourcesLayersSpaceFinder = () => {
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

  useEffect(() => {
    if (runId != null) {
      console.debug('[Planning] runId changed →', runId)
      console.debug(
        '[Planning] hexagons URL:',
        getTilesUrl(`/planning_hexagons/{z}/{x}/{y}?run_id=${runId}`),
      )
    }
  }, [runId])

  if (runId == null)
    return (
      <>
        <BoundaryHighlightLayer />
        <UserObstaclesLayer />
      </>
    )

  const hexagonsUrl = getTilesUrl(`/planning_hexagons/{z}/{x}/{y}?run_id=${runId}`)
  const vegetationUrl = getTilesUrl(`/planning_vegetation/{z}/{x}/{y}?run_id=${runId}`)
  const carriagewaysUrl = getTilesUrl(`/planning_carriageways/{z}/{x}/{y}?run_id=${runId}`)
  const censusUrl = getTilesUrl(`/planning_census/{z}/{x}/{y}?run_id=${runId}`)
  const fillLayerProps = hexagonFillLayerProps(
    PLANNING_SCORE_PROPERTY[scoreMode],
    scoreMode,
    areaFilterOn,
    minArea,
    hexagonsOpacityPct,
  )

  return (
    <>
      <BoundaryHighlightLayer />

      {/* See comment at planningOverlayCeilingLayerId. */}
      <Layer id={planningOverlayFloorLayerId} type="background" layout={{ visibility: 'none' }} />
      <Layer id={planningOverlayCeilingLayerId} type="background" layout={{ visibility: 'none' }} />

      {hexagonsOpacityPct > 0 && (
        <>
          <Source
            id={planningHexagonsSourceId}
            type="vector"
            tiles={[hexagonsUrl]}
            promoteId="h3_id"
          />
          <Layer {...fillLayerProps} beforeId={planningOverlayCeilingLayerId} />
          <LayerHighlight
            {...fillLayerProps}
            id={getLayerHighlightId(planningHexagonsLayerId)}
            beforeId={planningOverlayCeilingLayerId}
          />
          <Layer
            {...hexagonLabelLayerProps(PLANNING_SCORE_PROPERTY[scoreMode])}
            beforeId={planningOverlayCeilingLayerId}
          />
        </>
      )}

      {/* After the hexagon layers so the yellow selection outline sits on top. */}
      <CandidateHighlightLayer runKey={candidateRunKey} />

      <UserObstaclesLayer />

      {vegetationOn && (
        <>
          <Source
            id="planning-vegetation-source"
            type="vector"
            tiles={[vegetationUrl]}
            attribution={vegetationAttribution ?? undefined}
          />
          <Layer
            id="planning-vegetation-fill"
            beforeId={planningOverlayFloorLayerId}
            source="planning-vegetation-source"
            source-layer="planning_vegetation"
            type="fill"
            paint={{ 'fill-color': VEGETATION_FILL_COLOR, 'fill-opacity': 0.45 }}
          />
          <Layer
            id="planning-vegetation-outline"
            beforeId={planningOverlayFloorLayerId}
            source="planning-vegetation-source"
            source-layer="planning_vegetation"
            type="line"
            paint={{ 'line-color': VEGETATION_LINE_COLOR, 'line-width': 0.5, 'line-opacity': 0.8 }}
          />
        </>
      )}

      {carriagewaysOn && (
        <>
          <Source id="planning-carriageways-source" type="vector" tiles={[carriagewaysUrl]} />
          <Layer
            id="planning-carriageways-fill"
            beforeId={planningOverlayFloorLayerId}
            source="planning-carriageways-source"
            source-layer="planning_carriageways"
            type="fill"
            paint={{ 'fill-color': '#b45309', 'fill-opacity': 0.45 }}
          />
          <Layer
            id="planning-carriageways-outline"
            beforeId={planningOverlayFloorLayerId}
            source="planning-carriageways-source"
            source-layer="planning_carriageways"
            type="line"
            paint={{ 'line-color': '#78350f', 'line-width': 0.5, 'line-opacity': 0.6 }}
          />
        </>
      )}

      {censusOn && (
        <>
          <Source
            id={planningCensusSourceId}
            type="vector"
            tiles={[censusUrl]}
            attribution={CENSUS_ATTRIBUTION}
          />
          <Layer {...censusCircleLayerProps} beforeId={planningOverlayFloorLayerId} />
          <Layer {...censusLabelLayerProps} beforeId={planningOverlayFloorLayerId} />
        </>
      )}
    </>
  )
}
