import { useEffect } from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'
import { usePlanningBoundaryState } from '@/components/regionen/pageRegionSlug/hooks/mapState/usePlanningBoundaryState'
import { usePlanningRunParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/usePlanningParams'
import { getTilesUrl } from '@/components/shared/utils/getTilesUrl'
import { getLayerHighlightId } from '../utils/layerHighlight'
import { LayerHighlight } from './LayerHighlight'

export const planningHexagonsSourceId = 'planning-hexagons-source'
export const planningHexagonsLayerId = 'planning-hexagons'

// Planning module result layers (Flächenfinder).
//
// Renders the immutable result of one PlanningRun via the Martin function sources
// `planning_hexagons` / `planning_areas`, keyed by `?run_id=N`. Because a run is
// immutable, the run_id-keyed tile URL is cached effectively forever (separate
// nginx `planning_cache` zone, see configs/nginx.conf).
//
// When `planningRun` is absent (the normal viewer), this renders nothing — so the
// existing viewer is untouched.

// MCE score → red intensity ramp (0 = excluded/near-white … 100 = deep red).
const MCE_COLOR: any = [
  'interpolate',
  ['linear'],
  ['coalesce', ['get', 'mce_gesamtscore'], 0],
  0,
  '#fff5f0',
  40,
  '#fc9272',
  70,
  '#de2d26',
  100,
  '#67000d',
]

const hexagonFillLayerProps = {
  id: planningHexagonsLayerId,
  source: planningHexagonsSourceId,
  'source-layer': 'planning_hexagons',
  type: 'fill' as const,
  paint: {
    'fill-color': MCE_COLOR,
    'fill-opacity': 0.7,
    'fill-outline-color': 'rgba(0,0,0,0.15)',
  },
}

const BoundaryHighlightLayer = () => {
  const geom = usePlanningBoundaryState((s) => s.boundaryHighlightGeom)
  const filled = usePlanningBoundaryState((s) => s.boundaryHighlightFilled)
  if (!geom) return null
  return (
    <Source
      id="planning-boundary-highlight"
      type="geojson"
      data={{ type: 'Feature', geometry: geom as any, properties: {} }}
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

export const SourcesLayersPlanning = () => {
  const [runId] = usePlanningRunParam()
  const vegetationOn = usePlanningBoundaryState((s) => s.vegetationVisible)
  const vegetationAttribution = usePlanningBoundaryState((s) => s.vegetationAttribution)

  useEffect(() => {
    if (runId != null) {
      console.debug('[Planning] runId changed →', runId)
      console.debug(
        '[Planning] hexagons URL:',
        getTilesUrl(`/planning_hexagons/{z}/{x}/{y}?run_id=${runId}`),
      )
      console.debug(
        '[Planning] areas URL:    ',
        getTilesUrl(`/planning_areas/{z}/{x}/{y}?run_id=${runId}`),
      )
    }
  }, [runId])

  if (runId == null) return <BoundaryHighlightLayer />

  const hexagonsUrl = getTilesUrl(`/planning_hexagons/{z}/{x}/{y}?run_id=${runId}`)
  const areasUrl = getTilesUrl(`/planning_areas/{z}/{x}/{y}?run_id=${runId}`)
  const vegetationUrl = getTilesUrl(`/planning_vegetation/{z}/{x}/{y}?run_id=${runId}`)

  return (
    <>
      <BoundaryHighlightLayer />

      <Source id={planningHexagonsSourceId} type="vector" tiles={[hexagonsUrl]} promoteId="h3_id" />
      <Layer {...hexagonFillLayerProps} />
      <LayerHighlight
        {...hexagonFillLayerProps}
        id={getLayerHighlightId(planningHexagonsLayerId)}
      />

      <Source id="planning-areas-source" type="vector" tiles={[areasUrl]} />
      <Layer
        id="planning-areas-fill"
        source="planning-areas-source"
        source-layer="planning_areas"
        type="fill"
        paint={{ 'fill-color': '#1a9850', 'fill-opacity': 0.8 }}
      />
      <Layer
        id="planning-areas-outline"
        source="planning-areas-source"
        source-layer="planning_areas"
        type="line"
        paint={{ 'line-color': '#08522a', 'line-width': 1.5 }}
      />

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
            source="planning-vegetation-source"
            source-layer="planning_vegetation"
            type="fill"
            paint={{ 'fill-color': '#2d6a4f', 'fill-opacity': 0.45 }}
          />
          <Layer
            id="planning-vegetation-outline"
            source="planning-vegetation-source"
            source-layer="planning_vegetation"
            type="line"
            paint={{ 'line-color': '#1b4332', 'line-width': 0.5, 'line-opacity': 0.6 }}
          />
        </>
      )}
    </>
  )
}
