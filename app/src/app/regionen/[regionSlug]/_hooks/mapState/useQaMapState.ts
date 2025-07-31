import getQaConfigsForRegion from '@/src/server/qa-configs/queries/getQaConfigsForRegion'
import getQaDataForMap from '@/src/server/qa-configs/queries/getQaDataForMap'
import { useQuery } from '@blitzjs/rpc'
import { useMemo } from 'react'
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

  // Get QA configs to find the active config
  const [qaConfigs] = useQuery(getQaConfigsForRegion, { regionSlug: regionSlug! })

  // Memoize active config to prevent unnecessary re-renders
  const activeQaConfig = useMemo(
    () => qaConfigs?.find((config) => config.slug === qaParamData.configSlug),
    [qaConfigs, qaParamData.configSlug],
  )

  const shouldFetch = qaParamData.configSlug && qaParamData.style !== 'none' && activeQaConfig

  const [qaData, { isLoading }] = useQuery(
    getQaDataForMap,
    { configId: activeQaConfig?.id || 0, regionSlug: regionSlug || 'none' },
    {
      enabled: !!shouldFetch,
      refetchOnWindowFocus: false,
    },
  )

  // Update feature states when dependencies change
  if (mainMap && mapLoaded && qaData) {
    const currentData = qaData || []

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

    console.log('xxx', 'useQaMapState', {
      currentDataLength: currentData.length,
      qaFeaturesLength: qaFeatures.length,
    })

    // Set feature states for all visible features that have QA data
    if (qaFeatures.length > 0) {
      currentData.forEach((item) => {
        const feature = qaFeatures.find((f) => f.id === item.areaId)
        if (feature) {
          mainMap.setFeatureState(feature, {
            qaColor: item.displayColor,
          })
        }
      })
    }
  }

  return {
    qaData,
    isLoading,
  }
}
