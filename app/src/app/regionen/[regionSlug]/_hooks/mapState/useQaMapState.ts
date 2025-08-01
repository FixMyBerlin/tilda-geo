import { isProd } from '@/src/app/_components/utils/isEnv'
import getQaConfigsForRegion from '@/src/server/qa-configs/queries/getQaConfigsForRegion'
import getQaDataForMap from '@/src/server/qa-configs/queries/getQaDataForMap'
import { useQuery } from '@blitzjs/rpc'
import { useEffect, useMemo } from 'react'
import { MapGeoJSONFeature, useMap } from 'react-map-gl/maplibre'
import { qaLayerId, qaSourceId } from '../../_components/Map/SourcesAndLayers/SourcesLayersQa'
import { useRegionSlug } from '../../_components/regionUtils/useRegionSlug'
import { useQaParam } from '../useQueryState/useQaParam'
import { useMapActions, useMapLoaded } from './useMapState'

export const useQaMapState = () => {
  const { mainMap } = useMap()
  const mapLoaded = useMapLoaded()
  const { setSetFeatureStateLoading } = useMapActions()
  const { qaParamData } = useQaParam()
  const regionSlug = useRegionSlug()

  // Get QA configs to find the active config
  const [qaConfigs] = useQuery(
    getQaConfigsForRegion,
    { regionSlug: regionSlug! },
    { staleTime: 2 * 60 * 1000 }, // 120 seconds (2 minutes)
  )

  // Memoize active config to prevent unnecessary re-renders
  const activeQaConfig = useMemo(
    () => qaConfigs?.find((config) => config.slug === qaParamData.configSlug),
    [qaConfigs, qaParamData.configSlug],
  )

  const shouldFetch = qaParamData.configSlug && qaParamData.style !== 'none' && activeQaConfig

  const [currentQaData, { isLoading }] = useQuery(
    getQaDataForMap,
    { configId: activeQaConfig?.id || 0, regionSlug: regionSlug || 'none' },
    {
      enabled: !!shouldFetch,
      refetchOnWindowFocus: false,
    },
  )

  const shouldUpdateFeatureStates =
    mainMap !== undefined && mapLoaded && currentQaData && currentQaData.length > 0

  // Extract setFeatureState logic into a function
  const updateFeatureStates = () => {
    if (!shouldUpdateFeatureStates) {
      return
    }

    // Check if the QA layer exists before querying it
    const qaLayer = mainMap.getMap().getLayer(qaLayerId)
    if (!qaLayer) {
      if (!isProd) console.log('useQaMapState', 'QA layer does not exist yet')
      return
    }

    // Get all rendered QA features from the map
    const mapQaFeatures: MapGeoJSONFeature[] = mainMap.queryRenderedFeatures({
      layers: [qaLayerId],
    })

    if (!isProd) console.time('useQaMapState setFeatureState')

    // Set feature states for all visible features that have QA data
    if (mapQaFeatures.length > 0) {
      currentQaData.forEach((item) => {
        const feature = mapQaFeatures.find((f) => f.id === item.areaId)
        if (feature) {
          mainMap.setFeatureState(feature, {
            qaColor: item.displayColor,
          })
        }
      })
    }

    if (!isProd) console.timeEnd('useQaMapState setFeatureState')
  }

  // Initial loading effect - runs when QA data first loads
  useEffect(() => {
    if (shouldUpdateFeatureStates) {
      setSetFeatureStateLoading(true)
      updateFeatureStates()
      setSetFeatureStateLoading(false)
    }
  }, [shouldUpdateFeatureStates, setSetFeatureStateLoading])

  // Data loading effect - runs when QA source data is loaded
  useEffect(() => {
    if (!mainMap) return

    const handleData = (event: any) => {
      // Only trigger for our QA source
      if (event.sourceId === qaSourceId && shouldUpdateFeatureStates) {
        setSetFeatureStateLoading(true)
        updateFeatureStates()
        setSetFeatureStateLoading(false)
      }
    }

    mainMap.getMap().on('data', handleData)

    return () => {
      mainMap.getMap().off('data', handleData)
    }
  }, [mainMap, shouldUpdateFeatureStates, setSetFeatureStateLoading])

  return {
    qaData: currentQaData,
    isLoading,
  }
}
