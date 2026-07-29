import { useEffect } from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'
import { usePlanningBoundaryState } from '@/components/regionen/pageRegionSlug/hooks/mapState/usePlanningBoundaryState'
import {
  PLANNING_SCORE_PROPERTY,
  usePlanningAreaFilterParam,
  usePlanningHexagonsVisibleParam,
  usePlanningMinAreaParam,
  usePlanningRunParam,
  usePlanningScoreParam,
} from '@/components/regionen/pageRegionSlug/hooks/useQueryState/usePlanningParams'
import { getTilesUrl } from '@/components/shared/utils/getTilesUrl'
import { getLayerHighlightId } from '../utils/layerHighlight'
import { LayerHighlight } from './LayerHighlight'

export const planningHexagonsSourceId = 'planning-hexagons-source'
export const planningHexagonsLayerId = 'planning-hexagons'
const planningHexagonsLabelLayerId = 'planning-hexagons-label'

// Ab Zoom 18 wird der Score-Wert des aktiven Anzeigemodus (Kombination/Bedarf/
// Bebauung) gut lesbar im Hexagon eingeblendet. Unter Zoom 18 bleibt es wie
// bisher (nur Einfärbung, kein Label).
const HEXAGON_LABEL_MIN_ZOOM = 18

// Planning module result layers (Flächenfinder).
//
// Renders the immutable result of one PlanningRun via the Martin function source
// `planning_hexagons`, keyed by `?run_id=N`. Because a run is immutable, the
// run_id-keyed tile URL is cached effectively forever (separate nginx
// `planning_cache` zone, see configs/nginx.conf).
//
// When `planningRun` is absent (the normal viewer), this renders nothing — so the
// existing viewer is untouched.

// Score → red intensity ramp (0 = excluded/near-white … 100 = deep red).
// The colored property depends on the active display mode (combination / demand /
// buildability), so the ramp is built per selected tile property.
const scoreColor = (property: string): any => [
  'interpolate',
  ['linear'],
  ['coalesce', ['get', property], 0],
  0,
  '#fff5f0',
  40,
  '#fc9272',
  70,
  '#de2d26',
  100,
  '#67000d',
]

// Flächen-Cluster-Filter: nur bei aktivierter Checkbox (filterOn) und gesetzter
// Zielgröße (minArea > 0) werden Hexagone, deren zusammenhängende Fläche
// (`cluster_area_m2`) die Zielgröße nicht erreicht (oder gar keinem Cluster
// angehören, also NULL sind), stark abgedunkelt statt ausgeblendet – so bleibt
// die Score-Einfärbung als Kontext sichtbar. Checkbox aus → wie vor Einführung
// des Filters, alle Hexagone gleich eingefärbt.
const clusterOpacity = (filterOn: boolean, minArea: number): any =>
  filterOn && minArea > 0
    ? ['case', ['>=', ['coalesce', ['get', 'cluster_area_m2'], 0], minArea], 0.7, 0.1]
    : 0.7

const hexagonFillLayerProps = (property: string, filterOn: boolean, minArea: number) => ({
  id: planningHexagonsLayerId,
  source: planningHexagonsSourceId,
  'source-layer': 'planning_hexagons',
  type: 'fill' as const,
  paint: {
    'fill-color': scoreColor(property),
    'fill-opacity': clusterOpacity(filterOn, minArea),
    'fill-outline-color': 'rgba(0,0,0,0.15)',
  },
})

const hexagonLabelLayerProps = (property: string) => ({
  id: planningHexagonsLabelLayerId,
  source: planningHexagonsSourceId,
  'source-layer': 'planning_hexagons',
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

// Kontroll-Layer für die hochgeladenen „Eigene Flächen" (factorConfig.user_geojson).
// Die Geometrie liegt clientseitig im Store (von ScenarioDetail gesetzt); Punkte,
// Linien und Flächen werden mit eigenen Layern dargestellt.
const UserObstaclesLayer = () => {
  const geom = usePlanningBoundaryState((s) => s.userObstaclesGeom)
  if (!geom) return null
  return (
    <Source id="planning-user-obstacles" type="geojson" data={geom as any}>
      <Layer
        id="planning-user-obstacles-fill"
        type="fill"
        filter={['==', ['geometry-type'], 'Polygon']}
        paint={{ 'fill-color': '#7c3aed', 'fill-opacity': 0.2 }}
      />
      <Layer
        id="planning-user-obstacles-line"
        type="line"
        filter={['in', ['geometry-type'], ['literal', ['LineString', 'Polygon']]]}
        paint={{ 'line-color': '#6d28d9', 'line-width': 2 }}
      />
      <Layer
        id="planning-user-obstacles-circle"
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

export const SourcesLayersPlanning = () => {
  const [runId] = usePlanningRunParam()
  const [scoreMode] = usePlanningScoreParam()
  const [hexagonsVisible] = usePlanningHexagonsVisibleParam()
  const [minArea] = usePlanningMinAreaParam()
  const [areaFilterOn] = usePlanningAreaFilterParam()
  const vegetationOn = usePlanningBoundaryState((s) => s.vegetationVisible)
  const vegetationAttribution = usePlanningBoundaryState((s) => s.vegetationAttribution)

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
  const fillLayerProps = hexagonFillLayerProps(
    PLANNING_SCORE_PROPERTY[scoreMode],
    areaFilterOn,
    minArea,
  )

  return (
    <>
      <BoundaryHighlightLayer />
      <UserObstaclesLayer />

      {hexagonsVisible && (
        <>
          <Source
            id={planningHexagonsSourceId}
            type="vector"
            tiles={[hexagonsUrl]}
            promoteId="h3_id"
          />
          <Layer {...fillLayerProps} />
          <LayerHighlight {...fillLayerProps} id={getLayerHighlightId(planningHexagonsLayerId)} />
          <Layer {...hexagonLabelLayerProps(PLANNING_SCORE_PROPERTY[scoreMode])} />
        </>
      )}

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
