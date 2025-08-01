import { isProd } from '@/src/app/_components/utils/isEnv'
import { USER_STATUS_TO_LETTER } from '@/src/app/regionen/[regionSlug]/_components/SidebarInspector/InspectorQa/qaConfigs'
import getQaConfigsForRegion from '@/src/server/qa-configs/queries/getQaConfigsForRegion'
import getQaDataForMap, { QaMapData } from '@/src/server/qa-configs/queries/getQaDataForMap'
import { useQuery } from '@blitzjs/rpc'
import { useEffect, useMemo } from 'react'
import { MapGeoJSONFeature, useMap } from 'react-map-gl/maplibre'
import { qaLayerId, qaSourceId } from '../../_components/Map/SourcesAndLayers/SourcesLayersQa'
import { useRegionSlug } from '../../_components/regionUtils/useRegionSlug'
import { useQaParam } from '../useQueryState/useQaParam'
import { useMapActions, useMapLoaded } from './useMapState'

// Shared filter function for both filtering and optimistic updates
const filterQaDataByStyle = (data: QaMapData[], style: string) => {
  switch (style) {
    case 'none':
      return []
    case 'all':
      return data
    case 'user-not-ok-processing':
      return data.filter((item) => {
        return item.userStatus === USER_STATUS_TO_LETTER.NOT_OK_PROCESSING_ERROR
      })
    case 'user-not-ok-osm':
      return data.filter((item) => {
        return item.userStatus === USER_STATUS_TO_LETTER.NOT_OK_DATA_ERROR
      })
    case 'user-ok-construction':
      return data.filter((item) => {
        return item.userStatus === USER_STATUS_TO_LETTER.OK_STRUCTURAL_CHANGE
      })
    case 'user-ok-reference-error':
      return data.filter((item) => {
        return item.userStatus === USER_STATUS_TO_LETTER.OK_REFERENCE_ERROR
      })
    case 'user-pending':
      return data.filter((item) => {
        return item.userStatus === null && item.systemStatus !== null
      })
    default:
      return data
  }
}

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

  // Filter QA data based on selected style (client-side filtering since Maplibre doesn't support feature-state in filters)
  const filteredQaData = useMemo(() => {
    if (!currentQaData) return []
    return filterQaDataByStyle(currentQaData, qaParamData.style)
  }, [currentQaData, qaParamData.style])

  const shouldUpdateFeatureStates = mainMap !== undefined && mapLoaded && filteredQaData.length > 0

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

    // Set feature states for all map features
    if (mapQaFeatures.length > 0) {
      // Get all area IDs that should be visible with current filter
      const visibleAreaIds = new Set(filteredQaData.map((item) => item.areaId))

      // Update all map features
      mapQaFeatures.forEach((feature) => {
        const featureId = feature.id?.toString()
        if (!featureId) return

        const qaDataItem = currentQaData?.find((item) => item.areaId === featureId)

        // Set feature state - only set status if visible
        const isVisible = qaDataItem && visibleAreaIds.has(featureId)

        mainMap.setFeatureState(feature, {
          systemStatus: isVisible ? qaDataItem.systemStatus : null,
          userStatus: isVisible ? qaDataItem.userStatus : null,
        })
      })
    }

    if (!isProd) console.timeEnd('useQaMapState setFeatureState')
  }

  // Initial loading effect - runs when QA data first loads or style changes
  useEffect(() => {
    if (shouldUpdateFeatureStates) {
      setSetFeatureStateLoading(true)
      updateFeatureStates()
      setSetFeatureStateLoading(false)
    }
  }, [shouldUpdateFeatureStates, setSetFeatureStateLoading, qaParamData.style])

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
    filteredQaData,
    filterQaDataByStyle,
  }
}
