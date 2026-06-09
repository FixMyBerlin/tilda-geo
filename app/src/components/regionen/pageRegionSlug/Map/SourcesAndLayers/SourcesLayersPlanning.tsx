import { Layer, Source } from 'react-map-gl/maplibre'
import { usePlanningRunParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/usePlanningParams'
import { getTilesUrl } from '@/components/shared/utils/getTilesUrl'

// Planning module result layers (Flächenfinder).
//
// Renders the immutable result of one PlanningRun via the Martin function sources
// `planning_hexagons` / `planning_areas`, keyed by `?run_id=N`. Because a run is
// immutable, the run_id-keyed tile URL is cached effectively forever (separate
// nginx `planning_cache` zone, see configs/nginx.conf).
//
// When `planningRun` is absent (the normal viewer), this renders nothing — so the
// existing viewer is untouched.

// MCE score → color ramp (0 = excluded … 100 = very suitable).
const MCE_COLOR: any = [
  'interpolate',
  ['linear'],
  ['coalesce', ['get', 'mce_gesamtscore'], 0],
  0,
  '#d73027',
  40,
  '#fdae61',
  60,
  '#fee08b',
  80,
  '#a6d96a',
  100,
  '#1a9850',
]

export const SourcesLayersPlanning = () => {
  const [runId] = usePlanningRunParam()
  if (runId == null) return null

  const hexagonsUrl = getTilesUrl(`/planning_hexagons/{z}/{x}/{y}?run_id=${runId}`)
  const areasUrl = getTilesUrl(`/planning_areas/{z}/{x}/{y}?run_id=${runId}`)

  return (
    <>
      <Source id="planning-hexagons-source" type="vector" tiles={[hexagonsUrl]} promoteId="h3_id" />
      <Layer
        id="planning-hexagons"
        source="planning-hexagons-source"
        source-layer="planning_hexagons"
        type="fill"
        paint={{
          'fill-color': MCE_COLOR,
          'fill-opacity': 0.55,
          'fill-outline-color': 'rgba(0,0,0,0.15)',
        }}
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
