import { useEffect } from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'
import { useSpaceFinderBoundaryState } from '@/components/regionen/pageRegionSlug/hooks/mapState/useSpaceFinderBoundaryState'
import {
  useSpaceFinderCandidates,
  useSpaceFinderCandidatesState,
} from '@/components/regionen/pageRegionSlug/hooks/mapState/useSpaceFinderCandidatesState'
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
 * Unsichtbarer Fixpunkt, direkt (und ausschließlich) beim ersten Rendern mit
 * gesetztem `runId` gemountet und danach nie mehr entfernt oder neu erzeugt.
 * Die Hexagon-Layer (Fläche/Highlight/Label) hängen sich per `beforeId` immer
 * direkt darunter ein. Vegetation/Fahrbahnen/Zensus/Eigene-Daten-Layer werden
 * dagegen ganz normal ohne `beforeId` angehängt (landen also immer ganz oben
 * auf dem aktuellen Stapel) und liegen dadurch immer über der Decke – und
 * damit immer über den Hexagonen. Ohne diesen Fixpunkt würde ein Neu-Mount der
 * Hexagon-Layer (z.B. Ein-/Ausblenden über ScoreModeSwitcher) sie ohne
 * `beforeId` ganz oben neu einfügen, also über bereits sichtbare
 * Vegetation/Zensus/Eigene-Daten-Layer.
 */
const planningOverlayCeilingLayerId = 'planning-overlay-ceiling'
/** MVT layer name of the Martin function source (see registerPlanningFunctions.server.ts). */
export const planningHexagonsSourceLayer = 'planning_hexagons'
/**
 * Eigener Punkt-Layer mit dem Hexagon-Mittelpunkt, je Hexagon in genau einer
 * Kachel enthalten (siehe registerPlanningFunctions.server.ts). Der Fläche-Layer
 * `planningHexagonsSourceLayer` puffert & schneidet Polygone pro Kachel, sodass
 * dasselbe Hexagon oft in mehreren Kacheln mit versetztem Zentroid auftaucht — ein
 * Label darauf wäre mehrfach und außermittig. Deshalb ein eigener, ungepufferter
 * Punkt-Layer nur fürs Label.
 */
const planningHexagonsLabelSourceLayer = 'planning_hexagons_label'
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
// When the active variant has no run yet (`runId` from `useSpaceFinderSelection`), this renders
// nothing — this component only mounts inside the Flächenfinder mode anyway (`RegionMap`).

// Score → Farbintensitäts-Rampe (0 = ausgeschlossen/transparent … 100 = kräftigste Farbe).
// Hexagone mit Wert 0 bekommen keine Füllfarbe, nur der Rand (fill-outline-color)
// markiert sie noch. Zwischen 0 und HEXAGON_FADE_IN_THRESHOLD blendet die
// Deckkraft graduell ein (statt hart bei 0 umzuschalten) – sonst entsteht bei
// vielen knapp über 0 liegenden Werten ein löchriges Muster aus abrupt
// wechselnden transparenten und undurchsichtigen Nachbar-Hexagonen. Der Farbton
// hängt vom aktiven Anzeigemodus ab — dieselben Farben wie `spaceFinderGroupStyle`
// (Bedarf blau, Bebauung lila); Kombination bleibt beim ursprünglichen Rot, da sie
// keine Faktorgruppe mit eigener Farbe ist.
const HEXAGON_FADE_IN_THRESHOLD = 10
const HEXAGON_SCORE_RAMP: Record<PlanningScoreMode, { fadeFrom: string; stops: string[] }> = {
  kombination: {
    fadeFrom: 'rgba(255,245,240,0)',
    stops: ['#fff5f0', '#fc9272', '#de2d26', '#67000d'],
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
const scoreColor = (property: string, mode: PlanningScoreMode): any => {
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

// Ursprüngliche feste Layer-Deckkraft (vor Einführung des Transparenz-Reglers).
// Der Regler steht bei 100% für genau diesen Wert, nicht für CSS-Opacity 1 —
// er skaliert die volle Fläche darunter, damit "100%" optisch dem alten,
// unveränderten Layer entspricht.
const MAX_FILL_OPACITY = 0.7

// Verhältnis abgedunkelt : voll sichtbar aus den ursprünglichen Festwerten (0.1/0.7),
// jetzt relativ zur per Regler eingestellten Deckkraft (`ff.opacity`, ScoreModeSwitcher)
// angewendet, damit das Abdunkeln bei jeder Transparenz-Einstellung sichtbar bleibt.
const DIMMED_RATIO = 0.1 / 0.7

// Flächen-Cluster-Filter: nur bei aktivierter Checkbox (filterOn) und gesetzter
// Zielgröße (minArea > 0) werden Hexagone, deren zusammenhängende Fläche
// (`cluster_area_m2`) die Zielgröße nicht erreicht (oder gar keinem Cluster
// angehören, also NULL sind), stark abgedunkelt statt ausgeblendet – so bleibt
// die Score-Einfärbung als Kontext sichtbar. Checkbox aus → wie vor Einführung
// des Filters, alle Hexagone mit der eingestellten Deckkraft eingefärbt.
const clusterOpacity = (filterOn: boolean, minArea: number, maxOpacity: number): any =>
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
    'fill-color': scoreColor(property, mode),
    'fill-opacity': clusterOpacity(filterOn, minArea, (opacityPct / 100) * MAX_FILL_OPACITY),
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

// Zensus-Einwohnerpunkte (Faktor „Bewohnerbedarf"). Die Kacheln kommen direkt aus
// `data.census_population_point`, auf die Bounding-Box des Planungsgebiets
// beschränkt — es liegt nichts pro Lauf im planning-Schema (siehe die
// Martin-Funktion `planning_census`). Ein Punkt sitzt in aller Regel auf dem
// Gebäudemittelpunkt und trägt dessen Einwohnerzahl.
const planningCensusSourceId = 'planning-census-source'

const CENSUS_ATTRIBUTION =
  '<a href="https://www.zensus2022.de/" target="_blank" rel="noopener">Zensus 2022</a> (Destatis, auf Gebäude disaggregiert)'

// Ab Zoom 17 die Einwohnerzahl neben den Punkt schreiben — darunter liegen die
// Gebäude zu dicht beieinander, als dass Zahlen lesbar wären.
const CENSUS_LABEL_MIN_ZOOM = 17

const censusCircleLayerProps = {
  id: 'planning-census-circle',
  source: planningCensusSourceId,
  'source-layer': 'planning_census',
  type: 'circle' as const,
  paint: {
    // Radius wächst mit Zoom UND Einwohnerzahl, damit ein Mehrfamilienhaus auch
    // ohne Label vom Einfamilienhaus zu unterscheiden ist.
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

const BoundaryHighlightLayer = () => {
  const geom = useSpaceFinderBoundaryState((s) => s.boundaryHighlightGeom)
  const filled = useSpaceFinderBoundaryState((s) => s.boundaryHighlightFilled)
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

// Kontroll-Layer für die hochgeladenen „Eigene Daten" (factorConfig.user_geojson).
// Die Geometrie liegt clientseitig im Store (von ScenarioDetail gesetzt); Punkte,
// Linien und Flächen werden mit eigenen Layern dargestellt. Über den Schalter im
// Panel (userObstaclesVisible) ein- und ausblendbar wie Vegetation/Fahrbahnen.
const UserObstaclesLayer = () => {
  const geom = useSpaceFinderBoundaryState((s) => s.userObstaclesGeom)
  const visible = useSpaceFinderBoundaryState((s) => s.userObstaclesVisible)
  if (!geom || !visible) return null
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

// Gelbe Umrandung der als Kandidaten ausgewählten Hexagone (Auswahl-Werkzeug,
// siehe PlanningCandidateToggle). Die Geometrien liegen beim Klick bereits im
// Store, deshalb eine eigene GeoJSON-Source statt eines Filter-Ausdrucks auf der
// Vektor-Source – so bleibt die Markierung auch sichtbar, wenn ein Hexagon gerade
// nicht in den gerenderten Kacheln liegt.
//
// Nur sichtbar, während das Auswahl-Werkzeug aktiv ist (selectActive): Toggle-Knopf
// oder Schließen der Kandidaten-Sidebar setzen selectActive auf false und blenden die
// Markierung damit aus, ohne die Auswahl selbst zu löschen (siehe PlanningCandidateToggle,
// SidebarInspector handleClose).
const CandidateHighlightLayer = ({ runId }: { runId: number | null }) => {
  const selectActive = useSpaceFinderCandidatesState((s) => s.selectActive)
  const candidates = useSpaceFinderCandidates(runId)
  if (!selectActive || !candidates.length) return null

  return (
    <Source
      id="planning-candidates"
      type="geojson"
      data={{
        type: 'FeatureCollection',
        features: candidates.map((candidate) => ({
          type: 'Feature' as const,
          id: candidate.h3Id,
          geometry: candidate.geometry as any,
          properties: {},
        })),
      }}
    >
      <Layer
        id="planning-candidates-outline"
        type="line"
        paint={{ 'line-color': '#eab308', 'line-width': 2.5 }}
      />
    </Source>
  )
}

export const SourcesLayersSpaceFinder = () => {
  const { runId } = useSpaceFinderSelection()
  const { spaceFinderMode } = useSpaceFinderModeParam()
  const scoreMode = spaceFinderMode.score ?? 'kombination'
  const hexagonsOpacityPct = spaceFinderMode.opacity ?? 100
  const minArea = spaceFinderMode.minArea ?? 0
  const areaFilterOn = minArea > 0
  const vegetationOn = useSpaceFinderBoundaryState((s) => s.vegetationVisible)
  const vegetationAttribution = useSpaceFinderBoundaryState((s) => s.vegetationAttribution)
  const carriagewaysOn = useSpaceFinderBoundaryState((s) => s.carriagewaysVisible)
  const censusOn = useSpaceFinderBoundaryState((s) => s.censusVisible)

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

      {/* Siehe Kommentar bei planningOverlayCeilingLayerId. */}
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

      {/* Nach den Hexagon-Layern, damit die gelbe Auswahl-Umrandung darüber liegt. */}
      <CandidateHighlightLayer runId={runId} />

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

      {carriagewaysOn && (
        <>
          <Source id="planning-carriageways-source" type="vector" tiles={[carriagewaysUrl]} />
          <Layer
            id="planning-carriageways-fill"
            source="planning-carriageways-source"
            source-layer="planning_carriageways"
            type="fill"
            paint={{ 'fill-color': '#b45309', 'fill-opacity': 0.45 }}
          />
          <Layer
            id="planning-carriageways-outline"
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
          <Layer {...censusCircleLayerProps} />
          <Layer {...censusLabelLayerProps} />
        </>
      )}
    </>
  )
}
