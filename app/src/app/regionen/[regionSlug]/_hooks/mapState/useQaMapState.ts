import getQaConfigsForRegion from '@/src/server/qa-configs/queries/getQaConfigsForRegion'
import getQaDataForMap, { QaMapData } from '@/src/server/qa-configs/queries/getQaDataForMap'
import { useQuery } from '@blitzjs/rpc'
import { useRef } from 'react'
import { MapGeoJSONFeature, useMap } from 'react-map-gl/maplibre'
import { qaLayerId } from '../../_components/Map/SourcesAndLayers/SourcesLayersQa'
import { useRegionSlug } from '../../_components/regionUtils/useRegionSlug'
import { useQaParam } from '../useQueryState/useQaParam'
import { useMapLoaded } from './useMapState'

export const useQaMapState = () => {
  const { mainMap } = useMap()
  const mapLoaded = useMapLoaded()
  const { qaParamData } = useQaParam()
  const regionSlug = useRegionSlug()
  const previousQaData = useRef<QaMapData[]>([])

  // Get QA configs to find the active config
  const [qaConfigs] = useQuery(getQaConfigsForRegion, { regionSlug: regionSlug! })
  const activeQaConfig = qaConfigs?.find((config) => config.slug === qaParamData.configSlug)

  // Only fetch data if QA is active and we have the config
  const shouldFetch = qaParamData.configSlug && qaParamData.style !== 'none' && activeQaConfig

  const [qaData, { isLoading }] = useQuery(
    getQaDataForMap,
    shouldFetch && activeQaConfig
      ? { configId: activeQaConfig.id, regionSlug: regionSlug! }
      : { configId: 0, regionSlug: '' },
    {
      enabled: !!shouldFetch,
      refetchOnWindowFocus: false,
    },
  )

  // Update feature states when QA data changes - using direct approach without useEffect
  if (mainMap && mapLoaded && qaData) {
    const currentData = qaData || []
    const previousData = previousQaData.current

    console.log('xxx', 'useQaMapState', { currentData, previousData })

    // Check if the QA layer exists before querying it
    const qaLayer = mainMap.getMap().getLayer(qaLayerId)
    if (!qaLayer) {
      console.log('xxx', 'useQaMapState', 'QA layer does not exist yet')
      return {
        qaData,
        isLoading,
      }
    }

    // Get all rendered QA features from the map
    const qaFeatures: MapGeoJSONFeature[] = mainMap.queryRenderedFeatures({
      layers: [qaLayerId],
    })

    // Remove old feature states
    previousData.forEach((item) => {
      const feature = qaFeatures.find((f) => f.id === item.areaId)
      if (feature) {
        mainMap.setFeatureState(feature, {
          qaColor: undefined,
        })
      }
    })

    // Set new feature states
    currentData.forEach((item) => {
      const feature = qaFeatures.find((f) => f.id === item.areaId)
      if (feature) {
        mainMap.setFeatureState(feature, {
          qaColor: item.displayColor,
        })
      }
    })

    previousQaData.current = currentData
  }

  return {
    qaData,
    isLoading,
  }
}
