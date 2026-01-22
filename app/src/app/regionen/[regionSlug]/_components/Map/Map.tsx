import { isDev, isProd } from '@/src/app/_components/utils/isEnv'
import { MAP_STYLE_URL } from '@/src/app/api/map-style/_utils/mapStyleUrl.const'
import { useMapParam } from '@/src/app/regionen/[regionSlug]/_hooks/useQueryState/useMapParam'
import { SIMPLIFY_MIN_ZOOM } from '@/src/server/instrumentation/registerGeneralizationFunctions'
import { bbox, bboxPolygon, buffer } from '@turf/turf'
import { differenceBy, uniqBy } from 'lodash'
import { type MapLibreEvent, type MapStyleImageMissingEvent } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Suspense, useEffect, useRef, useState } from 'react'
import {
  AttributionControl,
  MapGeoJSONFeature,
  Map as MapGl,
  MapLayerMouseEvent,
  NavigationControl,
  ViewStateChangeEvent,
  useMap,
} from 'react-map-gl/maplibre'
import { useMapActions, useMapInspectorFeatures } from '../../_hooks/mapState/useMapState'
import {
  convertToUrlFeature,
  useFeaturesParam,
} from '../../_hooks/useQueryState/useFeaturesParam/useFeaturesParam'
import { useRegionDatasets } from '../../_hooks/useRegionDatasets/useRegionDatasets'
import { interactivityConfiguration } from '../../_mapData/mapDataSources/generalization/interacitvityConfiguartion'
import { useStaticRegion } from '../regionUtils/useStaticRegion'
import { createInspectorFeatureKey } from '../utils/sourceKeyUtils/createInspectorFeatureKey'
import { isSourceKeyAtlasGeo } from '../utils/sourceKeyUtils/sourceKeyUtilsAtlasGeo'
import { parseSourceKeyStaticDatasets } from '../utils/sourceKeyUtils/sourceKeyUtilsStaticDataset'
import { Calculator } from './Calculator/Calculator'
import { QaZoomNotice } from './QaZoomNotice'
import { Search } from './Search/Search'
import { MASK_INTERACTIVE_LAYER_IDS } from './utils/maskLayerUtils'

import { SourcesLayerRasterBackgrounds } from './SourcesAndLayers/SourcesLayerRasterBackgrounds'
import { SourcesLayersAtlasGeo } from './SourcesAndLayers/SourcesLayersAtlasGeo'
import { SourcesLayersInternalNotes } from './SourcesAndLayers/SourcesLayersInternalNotes'
import { SourcesLayersOsmNotes } from './SourcesAndLayers/SourcesLayersOsmNotes'
import { SourcesLayersQa } from './SourcesAndLayers/SourcesLayersQa'
import { SourcesLayersStaticDatasets } from './SourcesAndLayers/SourcesLayersStaticDatasets'
import { SourcesLayersSystemDatasets } from './SourcesAndLayers/SourcesLayersSystemDatasets'
import { UpdateFeatureState } from './UpdateFeatureState'
import { useInteractiveLayers } from './utils/useInteractiveLayers'

// On lower zoom level, our source data is stripped down to only styling data
// We do not show those features in our Inspector, which would show wrong data
// However, we do want to show an interaction (Tooltip) to inform our users,
// which is why the layers stay in `interactiveLayerIds`
const extractInteractiveFeatures = (
  mapParam,
  features: MapGeoJSONFeature[] | undefined,
): MapGeoJSONFeature[] => {
  if (!features) return []
  return features?.filter(({ sourceLayer }) => {
    sourceLayer = String(sourceLayer)
    return (
      !(sourceLayer in interactivityConfiguration) ||
      mapParam.zoom >= interactivityConfiguration[sourceLayer].minzoom
    )
  })
}

export const Map = () => {
  const { mapParam, setMapParam } = useMapParam()
  const { setFeaturesParam } = useFeaturesParam()
  const {
    setInspectorFeatures,
    resetInspectorFeatures,
    setMapLoaded,
    setMapDataLoading,
    setMapBounds,
  } = useMapActions()
  const region = useStaticRegion()
  const [cursorStyle, setCursorStyle] = useState('grab')
  const regionDatasets = useRegionDatasets()

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
      setInspectorFeatures(newInspectorFeatures)

      const persistableFeatures = newInspectorFeatures.filter(
        (f) =>
          isSourceKeyAtlasGeo(f.source) ||
          regionDatasets.some(({ id }) => id === parseSourceKeyStaticDatasets(f.source).sourceId),
      )
      if (persistableFeatures.length) {
        setFeaturesParam(persistableFeatures.map((feature) => convertToUrlFeature(feature)))
      } else {
        setFeaturesParam(null)
      }
    } else {
      resetInspectorFeatures()
    }
  }

  const updateCursor = (features: MapGeoJSONFeature[] | undefined) => {
    if (!features || !features.length) {
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

  const handleMouseLeave = (e: MapLayerMouseEvent) => {
    updateCursor([])
    updateHover([])
  }

  const handleLoad = (_event: MapLibreEvent<undefined>) => {
    // Only when `loaded` all `Map` feature are actually usable (https://github.com/visgl/react-map-gl/issues/2123)
    setMapLoaded(true)
    setMapBounds(mainMap?.getBounds() || null)
  }

  // Warn when a sprite image is missing
  useEffect(() => {
    if (!mainMap) return
    if (!isDev) return
    mainMap.on('styleimagemissing', (e: MapStyleImageMissingEvent) => {
      const imageId = e.id
      if (imageId === 'null') return // Conditional images with Fallback images "Fill pattern: none" result in e.id=NULL
      console.warn('Missing image', imageId)
    })
  }, [mainMap])

  const handleMoveEnd = (event: ViewStateChangeEvent) => {
    // Note: <SourcesAndLayersOsmNotes> simulates a moveEnd by watching the lat/lng url params
    const { latitude, longitude, zoom } = event.viewState
    void setMapParam({ zoom, lat: latitude, lng: longitude }, { history: 'replace' })
    setMapBounds(mainMap?.getBounds() || null)
  }

  const interactiveLayerIds = useInteractiveLayers()

  if (!mapParam) {
    return null
  }

  let mapMaxBoundsSettings: ReturnType<typeof bbox> | {} = {}
  if (region?.bbox) {
    const maxBounds = [
      region.bbox.min[0],
      region.bbox.min[1],
      region.bbox.max[0],
      region.bbox.max[1],
    ] satisfies ReturnType<typeof bbox>
    mapMaxBoundsSettings = {
      maxBounds: bbox(buffer(bboxPolygon(maxBounds), 60, { units: 'kilometers' })!),
      // Padding is in pixel to make sure the map controls are visible
      padding: {
        // TODO: We might need different padding on mobile…
        top: 0,
        bottom: 0,
        // left: 250, breaks fitBounds()
        left: 0,
        right: 0,
      },
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
      onData={() => setMapDataLoading(true)}
      onIdle={() => setMapDataLoading(false)}
      doubleClickZoom={true}
      dragRotate={false}
      RTLTextPlugin={false}
      minZoom={SIMPLIFY_MIN_ZOOM}
      attributionControl={false}
    >
      {/* Order: First Background Sources, then Vector Tile Sources */}
      <UpdateFeatureState />
      <SourcesLayerRasterBackgrounds />
      <SourcesLayersSystemDatasets />
      <SourcesLayersAtlasGeo />
      <SourcesLayersStaticDatasets />
      <Suspense>
        <SourcesLayersOsmNotes />
        <SourcesLayersInternalNotes />
        <SourcesLayersQa />
      </Suspense>
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
