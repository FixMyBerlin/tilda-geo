import { useEffect } from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'
import { usePlanningRunParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/usePlanningParams'
import { getTilesUrl } from '@/components/shared/utils/getTilesUrl'
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

export const SourcesLayersPlanning = () => {
  const [runId] = usePlanningRunParam()

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

  if (runId == null) return null

  const hexagonsUrl = getTilesUrl(`/planning_hexagons/{z}/{x}/{y}?run_id=${runId}`)
  const areasUrl = getTilesUrl(`/planning_areas/{z}/{x}/{y}?run_id=${runId}`)

  return (
    <>
      <Source id={planningHexagonsSourceId} type="vector" tiles={[hexagonsUrl]} promoteId="h3_id" />
      <Layer {...hexagonFillLayerProps} />
      <LayerHighlight {...hexagonFillLayerProps} />

      <Source
        id="planning-bikelanes-ref"
        type="vector"
        tiles={[getTilesUrl('/atlas_generalized_bikelanes/{z}/{x}/{y}')]}
      />
      <Layer
        id="planning-bikelanes-ref-layer"
        source="planning-bikelanes-ref"
        source-layer="bikelanes"
        type="line"
        paint={{ 'line-color': '#0066ff', 'line-width': 1.5, 'line-opacity': 0.6 }}
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
    </>
  )
}
