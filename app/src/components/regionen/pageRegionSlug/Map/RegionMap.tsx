import { bbox, bboxPolygon, buffer } from '@turf/turf'
import { differenceBy, uniqBy } from 'es-toolkit/compat'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { MapLibreEvent, MapStyleImageMissingEvent } from 'maplibre-gl'
import { useEffect, useRef, useState } from 'react'
import type {
  MapGeoJSONFeature,
  MapLayerMouseEvent,
  ViewStateChangeEvent,
} from 'react-map-gl/maplibre'
import { AttributionControl, Map as MapGl, NavigationControl, useMap } from 'react-map-gl/maplibre'
import {
  useMapActions,
  useMapInspectorFeatures,
} from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import {
  convertToUrlFeature,
  isPersistableFeature,
  useFeaturesParam,
} from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/useFeaturesParam'
import { useMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useMapParam'
import { useRegionDatasetsQuery } from '@/components/regionen/pageRegionSlug/hooks/useRegionDataQueries'
import { interactivityConfiguration } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/generalization/interacitvityConfiguartion'
import { createInspectorFeatureKey } from '@/components/regionen/pageRegionSlug/utils/sourceKeyUtils/createInspectorFeatureKey'
import { isDev, isProd } from '@/components/shared/utils/isEnv'
import { firePlaywrightMapLoadedEvent } from '@/components/shared/utils/playwright'
import { MAP_STYLE_URL } from '@/server/api/map-style/mapStyleUrl.const'
import { SIMPLIFY_MIN_ZOOM } from '@/server/instrumentation/generalization.const'
import { useStaticRegion } from '../regionUtils/useStaticRegion'
import { Calculator } from './Calculator/Calculator'
import { QaZoomNotice } from './QaZoomNotice'
import { Search } from './Search/Search'
import { SourcesLayerRasterBackgrounds } from './SourcesAndLayers/SourcesLayerRasterBackgrounds'
import { SourcesLayersAtlasGeo } from './SourcesAndLayers/SourcesLayersAtlasGeo'
import { SourcesLayersInternalNotes } from './SourcesAndLayers/SourcesLayersInternalNotes'
import { SourcesLayersOsmNotes } from './SourcesAndLayers/SourcesLayersOsmNotes'
import { SourcesLayersQa } from './SourcesAndLayers/SourcesLayersQa'
import { SourcesLayersStaticDatasets } from './SourcesAndLayers/SourcesLayersStaticDatasets'
import { SourcesLayersSystemDatasets } from './SourcesAndLayers/SourcesLayersSystemDatasets'
import { UpdateFeatureState } from './UpdateFeatureState'
import { MASK_INTERACTIVE_LAYER_IDS } from './utils/maskLayerUtils'
import { useInteractiveLayers } from './utils/useInteractiveLayers'

// On lower zoom level, our source data is stripped down to only styling data
// We do not show those features in our Inspector, which would show wrong data
// However, we do want to show an interaction (Tooltip) to inform our users,
// which is why the layers stay in `interactiveLayerIds`
const extractInteractiveFeatures = (mapParam, features: MapGeoJSONFeature[] | undefined) => {
  if (!features) return []
  return features?.filter(({ sourceLayer }) => {
    sourceLayer = String(sourceLayer)
    return (
      !(sourceLayer in interactivityConfiguration) ||
      mapParam.zoom >= interactivityConfiguration[sourceLayer].minzoom
    )
  })
}

export const RegionMap = () => {
  const { mapParam, setMapParam } = useMapParam()
  const { setFeaturesParam } = useFeaturesParam()
  const {
    replaceInspectorFeatures,
    clearInspectorFeatures,
    markMapLoaded,
    startMapDataLoading,
    finishMapDataLoading,
    updateMapBounds,
  } = useMapActions()
  const region = useStaticRegion()
  const [cursorStyle, setCursorStyle] = useState('grab')
  const { data: regionDatasets } = useRegionDatasetsQuery()

  // Position the map when URL change is triggered from the outside (eg a Button that changes the URL-state to move the map)
  const { mainMap } = useMap()
  mainMap?.getMap().touchZoomRotate.disableRotation()

  const containMaskFeature = (features: MapLayerMouseEvent['features']) => {
    if (!features) return false
    return features.some((f) => MASK_INTERACTIVE_LAYER_IDS.includes(f.layer.id))
  }

  const inspectorFeatures = useMapInspectorFeatures()

  const handleClick = ({ features, ...event }: MapLayerMouseEvent) => {
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

    if (uniqueFeatures) {
      let newInspectorFeatures: MapGeoJSONFeature[] = []
      // Allow multi select with Control (Windows) / Command (Mac)
      if (event.originalEvent.ctrlKey || event.originalEvent.metaKey) {
        // ctrl/command is down - toggle features
        const featureInArray = (f0, farr) =>
          !!farr.find((f1) => f0.properties.id === f1.properties.id)
        const keepFeatures = inspectorFeatures.filter((f) => !featureInArray(f, uniqueFeatures))
        const addFeatures = uniqueFeatures.filter((f) => !featureInArray(f, inspectorFeatures))
        newInspectorFeatures = [...keepFeatures, ...addFeatures]
      } else {
        // ctrl/command is not down - just set features
        newInspectorFeatures = uniqueFeatures
      }
      replaceInspectorFeatures(newInspectorFeatures)

      const persistableFeatures = newInspectorFeatures.filter((f) =>
        isPersistableFeature(f, regionDatasets ?? []),
      )
      if (persistableFeatures.length) {
        setFeaturesParam(persistableFeatures.map((feature) => convertToUrlFeature(feature)))
      } else {
        setFeaturesParam(null)
      }
    } else {
      clearInspectorFeatures()
    }
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
  const updateHover = (features: MapGeoJSONFeature[] | undefined) => {
    if (containMaskFeature(features)) features = []
    const previous = hoveredFeatures.current
    const current = features || []
    differenceBy(previous, current, key).forEach((f) => {
      mainMap?.setFeatureState(f, { hover: false })
    })
    differenceBy(current, previous, key).forEach((f) => {
      mainMap?.setFeatureState(f, { hover: true })
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

  const handleLoad = (_event: MapLibreEvent<undefined>) => {
    // Only when `loaded` all `Map` feature are actually usable (https://github.com/visgl/react-map-gl/issues/2123)
    markMapLoaded()
    updateMapBounds(mainMap?.getBounds() || null)

    firePlaywrightMapLoadedEvent()
  }

  // Warn when a sprite image is missing
  useEffect(
    function warnAboutMissingDevSprites() {
      if (!mainMap) return
      if (!isDev) return
      mainMap.on('styleimagemissing', (e: MapStyleImageMissingEvent) => {
        const imageId = e.id
        if (imageId === 'null') return // Conditional images with Fallback images "Fill pattern: none" result in e.id=NULL
        console.warn('Missing image', imageId)
      })
    },
    [mainMap],
  )

  const handleMoveEnd = (event: ViewStateChangeEvent) => {
    // Note: <SourcesAndLayersOsmNotes> simulates a moveEnd by watching the lat/lng url params
    const { latitude, longitude, zoom } = event.viewState
    void setMapParam({ zoom, lat: latitude, lng: longitude }, { history: 'replace' })
    updateMapBounds(mainMap?.getBounds() || null)
  }

  const interactiveLayerIds = useInteractiveLayers()

  if (!mapParam) {
    return null
  }

  type MapMaxBoundsProps = {
    maxBounds: [number, number, number, number]
    padding: { top: number; bottom: number; left: number; right: number }
  }
  let mapMaxBoundsSettings: MapMaxBoundsProps | Record<string, never> = {}
  if (region?.bbox) {
    // [minLon, minLat, maxLon, maxLat] for bboxPolygon
    const maxBounds: [number, number, number, number] = [
      region.bbox.min[0],
      region.bbox.min[1],
      region.bbox.max[0],
      region.bbox.max[1],
    ]
    const buffered = buffer(bboxPolygon(maxBounds), 60, { units: 'kilometers' })
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
      onMoveEnd={handleMoveEnd}
      // onZoomEnd={} // zooming is always also moving
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onLoad={handleLoad}
      onData={startMapDataLoading}
      onIdle={finishMapDataLoading}
      doubleClickZoom={true}
      dragRotate={false}
      minZoom={SIMPLIFY_MIN_ZOOM}
      attributionControl={false}
    >
      {/* Order: First Background Sources, then Vector Tile Sources */}
      <UpdateFeatureState />
      <SourcesLayerRasterBackgrounds />
      <SourcesLayersSystemDatasets />
      <SourcesLayersAtlasGeo />
      <SourcesLayersStaticDatasets />
      <SourcesLayersOsmNotes />
      <SourcesLayersInternalNotes />
      <SourcesLayersQa />
      <AttributionControl compact={true} position="bottom-left" />

      <Search />

      <NavigationControl showCompass={false /* TODO: See Story */} visualizePitch={true} />
      <Calculator />
      {/* <GeolocateControl /> */}
      {/* <ScaleControl /> */}
      <QaZoomNotice />
    </MapGl>
  )
}
