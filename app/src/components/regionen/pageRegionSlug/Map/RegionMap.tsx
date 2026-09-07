import { bbox, bboxPolygon, buffer } from '@turf/turf'
import { differenceBy, uniqBy } from 'es-toolkit/compat'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { MapLibreEvent, MapSourceDataEvent, MapStyleImageMissingEvent } from 'maplibre-gl'
import { useEffect, useRef, useState } from 'react'
import type {
  MapGeoJSONFeature,
  MapLayerMouseEvent,
  ViewStateChangeEvent,
} from 'react-map-gl/maplibre'
import { AttributionControl, Map as MapGl, useMap } from 'react-map-gl/maplibre'
import {
  useMapActions,
  useMapCalculatorDrawActive,
  useMapInspectorFeatures,
} from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useQaMapState } from '@/components/regionen/pageRegionSlug/hooks/mapState/useQaMapState'
import { useBg3dParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useBg3dParam'
import { useFeaturesParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/useFeaturesParam'
import { useMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useMapParam'
import { type MapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/utils/mapParam'
import { useRegionDatasetsQuery } from '@/components/regionen/pageRegionSlug/hooks/useRegionDataQueries'
import {
  interactivityConfiguration,
  type InteracitvityConfiguartion,
} from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/generalization/interacitvityConfiguartion'
import { createInspectorFeatureKey } from '@/components/regionen/pageRegionSlug/utils/sourceKeyUtils/createInspectorFeatureKey'
import { isDev, isProd } from '@/components/shared/utils/isEnv'
import {
  exposeMainMapForDebugging,
  firePlaywrightMapLoadedEvent,
} from '@/components/shared/utils/playwright'
import { MAP_STYLE_URL } from '@/server/api/map-style/mapStyleUrl.const'
import { SIMPLIFY_MIN_ZOOM } from '@/server/instrumentation/generalization.const'
import { MapListHoverMarker } from '../modes/MapListHoverMarker'
import { useModeListActions } from '../modes/mode-list-store'
import { NotesNewRelatedGeometry } from '../modes/notes/new/NotesNewRelatedGeometry'
import { useNotesComposeActive } from '../modes/notes/useNotesComposeActive'
import { ReviewMapDrawing } from '../modes/reviewLists/drawing/ReviewMapDrawing'
import { useReviewDrawActive } from '../modes/reviewLists/useReviewDrawActive'
import { useCurrentMode } from '../modes/useCurrentMode'
import { useRegion } from '../regionUtils/useRegion'
import { Calculator } from './Calculator/Calculator'
import { Map3dTouchRotation } from './Map3dTouchRotation'
import { SearchResultLayers } from './Search/SearchResultLayers'
import { MAPTERHORN_DEM_SOURCE_ID } from './SourcesAndLayers/mapterhornDem'
import { SourcesLayerRasterBackgrounds } from './SourcesAndLayers/SourcesLayerRasterBackgrounds'
import { SourcesLayersAtlasGeo } from './SourcesAndLayers/SourcesLayersAtlasGeo'
import { SourcesLayersInternalNotes } from './SourcesAndLayers/SourcesLayersInternalNotes'
import { SourcesLayersMap3dBuildings } from './SourcesAndLayers/SourcesLayersMap3dBuildings'
import { SourcesLayersMap3dDem } from './SourcesAndLayers/SourcesLayersMap3dDem'
import { SourcesLayersOsmNotes } from './SourcesAndLayers/SourcesLayersOsmNotes'
import { qaSourceId, SourcesLayersQa } from './SourcesAndLayers/SourcesLayersQa'
import { SourcesLayersReviewEntries } from './SourcesAndLayers/SourcesLayersReviewEntries'
import { SourcesLayersStaticDatasets } from './SourcesAndLayers/SourcesLayersStaticDatasets'
import { SourcesLayersSystemDatasets } from './SourcesAndLayers/SourcesLayersSystemDatasets'
import { TerrainProfileHoverMarkerLayer } from './SourcesAndLayers/TerrainProfileHoverMarkerLayer'
import { UpdateFeatureState } from './UpdateFeatureState'
import { MASK_INTERACTIVE_LAYER_IDS } from './utils/maskLayerUtils'
import { partitionClickedFeatures } from './utils/partitionClickedFeatures'
import { safeSetFeatureState } from './utils/safeSetFeatureState'
import { useInteractiveLayers } from './utils/useInteractiveLayers'

// On lower zoom level, our source data is stripped down to only styling data
// We do not show those features in our Inspector, which would show wrong data
// However, we do want to show an interaction (Tooltip) to inform our users,
// which is why the layers stay in `interactiveLayerIds`
const extractInteractiveFeatures = (
  mapParam: MapParam,
  features: MapGeoJSONFeature[] | undefined,
) => {
  if (!features) return []
  return features.filter(({ sourceLayer }) => {
    const layer = String(sourceLayer) as keyof InteracitvityConfiguartion
    const config = interactivityConfiguration[layer]
    return config === undefined || mapParam.zoom >= config.minzoom
  })
}

// Stable reference so toggling draw mode doesn't churn the <Map> interactiveLayerIds prop.
const NO_INTERACTIVE_LAYERS: string[] = []

export const RegionMap = () => {
  const { mapParam, setMapParam } = useMapParam()
  const { is3dActive } = useBg3dParam()
  const { featuresParam, setFeaturesParam } = useFeaturesParam()
  const {
    replaceInspectorFeatures,
    markMapLoaded,
    startMapDataLoading,
    finishMapDataLoading,
    updateMapBounds,
  } = useMapActions()
  const region = useRegion()
  const [cursorStyle, setCursorStyle] = useState('grab')
  const { data: regionDatasets } = useRegionDatasetsQuery()
  const currentMode = useCurrentMode()
  const { syncQaFeatureStates } = useQaMapState()
  const { notifyMapViewChanged } = useModeListActions()

  const { mainMap } = useMap()

  const containMaskFeature = (features: MapLayerMouseEvent['features']) => {
    if (!features) return false
    return features.some((f) => MASK_INTERACTIVE_LAYER_IDS.includes(f.layer.id))
  }

  const inspectorFeatures = useMapInspectorFeatures()
  const calculatorDrawActive = useMapCalculatorDrawActive()
  const notesComposeActive = useNotesComposeActive()
  const reviewDrawActive = useReviewDrawActive()

  const handleClick = ({ features, ...event }: MapLayerMouseEvent) => {
    if (reviewDrawActive) return
    if (containMaskFeature(features)) {
      return
    }
    if (!isProd) {
      // Our app relies on a unique `feature.id`. Without it, the uniqueness check below fails as do the hover/select feautres on the map.
      // Remember that the `feature.id` has to be an integer, otherwise Maplibre will silently remove it.
      // There is a workaround to use strings by using `promoteId` but for now we focus on fixing the source data.
      const featuresWithoutId = features?.filter((f) => f.id === undefined)
      if (featuresWithoutId?.length) {
        console.warn(
          'WARNING, there are features without a `feature.id` which will break the app:',
          featuresWithoutId,
        )
      }
    }

    const interactiveFeatures = extractInteractiveFeatures(mapParam, features)
    const uniqueFeatures = uniqBy(interactiveFeatures, (f) => createInspectorFeatureKey(f))

    const { nextInspectorFeatures, nextUrlFeatures } = partitionClickedFeatures({
      clickedFeatures: uniqueFeatures,
      currentMode,
      previousUrlFeatures: featuresParam,
      previousInspectorFeatures: inspectorFeatures,
      regionDatasets: regionDatasets ?? [],
      // Allow multi select with Control (Windows) / Command (Mac) — inspector domain only
      multiselect: event.originalEvent.ctrlKey || event.originalEvent.metaKey,
    })
    replaceInspectorFeatures(nextInspectorFeatures)
    setFeaturesParam(nextUrlFeatures.length > 0 ? nextUrlFeatures : null)
  }

  const updateCursor = (features: MapGeoJSONFeature[] | undefined) => {
    if (!features?.length) {
      setCursorStyle('grab')
      return
    }
    if (containMaskFeature(features)) {
      setCursorStyle('not-allowed')
      return
    }
    setCursorStyle(features.length ? 'pointer' : 'not-allowed')
  }

  const hoveredFeatures = useRef<MapGeoJSONFeature[]>([])
  const key = ({ id, layer }: MapGeoJSONFeature) => `${id}>${layer.id}`
  const sourceExists = (feature: MapGeoJSONFeature) => {
    const sourceId = feature.source?.toString()
    if (!sourceId) return false
    return mainMap?.getMap().getSource(sourceId) != null
  }
  const updateHover = (features: MapGeoJSONFeature[] | undefined) => {
    if (containMaskFeature(features)) features = []
    const previous = hoveredFeatures.current.filter(sourceExists)
    const current = (features || []).filter(sourceExists)
    differenceBy(previous, current, key).forEach((f) => {
      if (!mainMap) return
      safeSetFeatureState(mainMap, f, { hover: false })
    })
    differenceBy(current, previous, key).forEach((f) => {
      if (!mainMap) return
      safeSetFeatureState(mainMap, f, { hover: true })
    })
    hoveredFeatures.current = current
  }

  const handleMouseMove = ({ features }: MapLayerMouseEvent) => {
    features = extractInteractiveFeatures(mapParam, features)
    updateCursor(features)
    updateHover(features)
  }

  const handleMouseLeave = (_e: MapLayerMouseEvent) => {
    updateCursor([])
    updateHover([])
  }

  const handleSourceData = (event: MapSourceDataEvent) => {
    if (currentMode !== 'qa') return
    if (event.sourceId !== qaSourceId || !event.isSourceLoaded) return
    syncQaFeatureStates()
  }

  const handleLoad = (event: MapLibreEvent) => {
    // Only when `loaded` all `Map` feature are actually usable (https://github.com/visgl/react-map-gl/issues/2123)
    // Rotate/pitch handlers: Map3dTouchRotation (runs once mapLoaded is set).
    markMapLoaded()
    updateMapBounds(event.target.getBounds())

    exposeMainMapForDebugging(event.target)
    firePlaywrightMapLoadedEvent()
  }

  useEffect(
    function subscribeToMissingStyleImages() {
      if (!mainMap || !isDev) return

      const handleStyleImageMissing = (event: MapStyleImageMissingEvent) => {
        const imageId = event.id
        if (imageId === 'null') return // Conditional images with fallback "none" can emit "null"

        console.warn('Missing image', imageId)
      }

      mainMap.on('styleimagemissing', handleStyleImageMissing)

      return function unsubscribeFromMissingStyleImages() {
        mainMap.off('styleimagemissing', handleStyleImageMissing)
      }
    },
    [mainMap],
  )

  const handleMoveEnd = (event: ViewStateChangeEvent) => {
    // Note: <SourcesAndLayersOsmNotes> simulates a moveEnd by watching the lat/lng url params
    const { latitude, longitude, zoom, bearing, pitch } = event.viewState
    const nextMapParam: MapParam = { zoom, lat: latitude, lng: longitude }
    if (is3dActive) {
      nextMapParam.bearing = bearing
      nextMapParam.pitch = pitch
    }
    // When 3D is off, omit bearing/pitch from the URL. Do not jumpTo here — that
    // cancels SelectBackground's resetNorthPitch animation when disabling 3D.
    void setMapParam(nextMapParam, { history: 'replace' })
    updateMapBounds(mainMap?.getBounds() || null)
  }

  // While the calculator draw tool or notes compose is active, no layers are interactive:
  // clicking/hovering the data does nothing and the inspector can't open
  // (queryRenderedFeatures returns none). This replaces a special-case guard in the click
  // handler with the map's own interactivity mechanism.
  const computedInteractiveLayerIds = useInteractiveLayers()
  const interactiveLayerIds =
    calculatorDrawActive || notesComposeActive || reviewDrawActive
      ? NO_INTERACTIVE_LAYERS
      : computedInteractiveLayerIds

  if (!mapParam) {
    return null
  }

  type MapMaxBoundsProps = {
    maxBounds: [number, number, number, number]
    padding: { top: number; bottom: number; left: number; right: number }
  }
  let mapMaxBoundsSettings: MapMaxBoundsProps | Record<string, never> = {}
  if (region?.bbox) {
    const maxBounds = region.bbox
    const buffered = buffer(bboxPolygon(maxBounds), 60, {
      units: 'kilometers',
    })
    if (buffered) {
      // turf bbox() returns 4 numbers for 2D; we have no elevation data
      const b = bbox(buffered) as [number, number, number, number]
      mapMaxBoundsSettings = {
        maxBounds: b,
        // Reminder: We have to check fitBounds when changing those padding values.
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
      }
    }
  }

  return (
    <MapGl
      id="mainMap"
      initialViewState={{
        longitude: mapParam.lng,
        latitude: mapParam.lat,
        zoom: mapParam.zoom,
        bearing: is3dActive ? (mapParam.bearing ?? 0) : 0,
        pitch: is3dActive ? (mapParam.pitch ?? 0) : 0,
      }}
      // We prevent users from zooming out too far which puts too much load on our vector tiles db
      {...mapMaxBoundsSettings}
      // hash // we cannot use the hash prop because it interfiers with our URL based states; we recreate the same behavior manually
      style={{ width: '100%', height: '100%' }}
      mapStyle={MAP_STYLE_URL}
      interactiveLayerIds={interactiveLayerIds}
      // onMouseMove={}
      // onLoad={handleInspect}
      cursor={cursorStyle}
      onMove={notifyMapViewChanged}
      onResize={notifyMapViewChanged}
      onMoveEnd={handleMoveEnd}
      // onZoomEnd={} // zooming is always also moving
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onLoad={handleLoad}
      onSourceData={handleSourceData}
      onData={startMapDataLoading}
      onIdle={finishMapDataLoading}
      doubleClickZoom={true}
      terrain={is3dActive ? { source: MAPTERHORN_DEM_SOURCE_ID, exaggeration: 1.5 } : undefined}
      minZoom={SIMPLIFY_MIN_ZOOM}
      attributionControl={false}
    >
      {/* Order: First Background Sources, then Vector Tile Sources */}
      <UpdateFeatureState />
      <SourcesLayerRasterBackgrounds />
      <SourcesLayersMap3dDem />
      <SourcesLayersMap3dBuildings />
      <SourcesLayersSystemDatasets />
      <SourcesLayersAtlasGeo />
      <SourcesLayersStaticDatasets />
      <SourcesLayersOsmNotes />
      <SourcesLayersInternalNotes />
      <SourcesLayersQa />
      <SearchResultLayers />
      <NotesNewRelatedGeometry />
      {/* Last in tree + moveLayer: stay above remounted highlights. Do not use this layer as beforeId. */}
      <TerrainProfileHoverMarkerLayer />
      <SourcesLayersReviewEntries />
      <MapListHoverMarker />
      <AttributionControl compact={true} position="bottom-left" />
      <Map3dTouchRotation />
      <Calculator />
      {currentMode === 'reviewLists' && <ReviewMapDrawing />}
      {/* <GeolocateControl /> */}
      {/* <ScaleControl /> */}
    </MapGl>
  )
}
