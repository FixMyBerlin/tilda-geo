import type { MapGeoJSONFeature } from 'react-map-gl/maplibre'
import { useMap } from 'react-map-gl/maplibre'
import { isLayerHighlightId } from '@/components/regionen/pageRegionSlug/Map/utils/layerHighlight'
import { useInteractiveLayers } from '@/components/regionen/pageRegionSlug/Map/utils/useInteractiveLayers'
import { useMapBounds, useMapLoaded } from '../../mapState/useMapState'
import type { UrlFeature } from '../types'
import { useFeaturesParam } from './useFeaturesParam'

type Result = {
  urlFeature: UrlFeature
  mapFeature: MapGeoJSONFeature | undefined
}

const emptyArray: Result[] = []

export const useSelectedFeatures = (run: boolean) => {
  const { mainMap: map } = useMap()
  const mapLoaded = useMapLoaded()
  const mapBounds = useMapBounds()
  const { featuresParam } = useFeaturesParam()
  const interactiveLayers = useInteractiveLayers()

  if (!run || !map || !mapLoaded || !mapBounds || !featuresParam) {
    return emptyArray
  }

  // interactiveLayerIds can be ahead of the applied map style for one render tick,
  // so we only query layers that currently exist in the style.
  const mapInstance = map.getMap()
  const styleLayerIds = new Set(mapInstance.getLayersOrder())
  const layersToQuery = interactiveLayers.filter((layerId) => styleLayerIds.has(layerId))

  if (!layersToQuery.length) {
    return emptyArray
  }

  const renderedFeatures: MapGeoJSONFeature[] = map.queryRenderedFeatures({
    layers: layersToQuery,
  })

  return featuresParam.map((urlFeature) => {
    const mapFeature = renderedFeatures.find(
      (f) => f.id === urlFeature.id && !isLayerHighlightId(f.layer.id),
    )
    return { urlFeature, mapFeature }
  })
}
