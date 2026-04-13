import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import type { MapGeoJSONFeature } from 'react-map-gl/maplibre'
import { useMap } from 'react-map-gl/maplibre'
import {
  qaLayerId,
  qaSourceId,
} from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/SourcesLayersQa'
import { useRegionSlug } from '@/components/regionen/pageRegionSlug/regionUtils/useRegionSlug'
import { USER_STATUS_TO_LETTER } from '@/components/regionen/pageRegionSlug/SidebarInspector/InspectorQa/qaConfigs'
import { useHasPermissions } from '@/components/shared/hooks/useHasPermissions'
import { isProd } from '@/components/shared/utils/isEnv'
import type { QaMapData } from '@/server/qa-configs/queries/getQaDataForMap.server'
import {
  qaDataForMapQueryOptions,
  regionQaConfigsQueryOptions,
} from '@/server/regions/regionQueryOptions'
import { useQaFilterParam } from '../useQueryState/useQaFilterParam'
import { useQaParam } from '../useQueryState/useQaParam'
import { useMapActions, useMapLoaded } from './useMapState'

// Shared filter function for both filtering and optimistic updates
export const filterQaDataByStyle = (data: QaMapData[], style: string) => {
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
    case 'user-ok-qa-tooling-error':
      return data.filter((item) => {
        return item.userStatus === USER_STATUS_TO_LETTER.OK_QA_TOOLING_ERROR
      })
    case 'user-pending-needs-review':
      return data.filter((item) => {
        return item.userStatus === null && item.systemStatus === 'N'
      })
    case 'user-pending-problematic':
      return data.filter((item) => {
        return item.userStatus === null && item.systemStatus === 'P'
      })
    case 'user-selected':
      // Filtering by users happens server-side, so just return all data
      return data
    default:
      return data
  }
}

export const useQaMapState = () => {
  const hasPermissions = useHasPermissions()
  const { mainMap } = useMap()
  const mapLoaded = useMapLoaded()
  const { startFeatureStateSync, finishFeatureStateSync } = useMapActions()
  const { qaParamData } = useQaParam()
  const { qaFilterParam } = useQaFilterParam()
  const regionSlug = useRegionSlug()
  const { data: qaConfigs } = useQuery({
    ...regionQaConfigsQueryOptions(regionSlug ?? ''),
    enabled: hasPermissions && Boolean(regionSlug),
  })

  // React Compiler automatically memoizes this computation
  const activeQaConfig = qaConfigs?.find((config) => config.slug === qaParamData.configSlug)

  const shouldFetch =
    hasPermissions && qaParamData.configSlug && qaParamData.style !== 'none' && activeQaConfig

  // Get user IDs from filter param when user-selected style is active
  const userIds =
    qaParamData.style === 'user-selected' && qaFilterParam?.users ? qaFilterParam.users : []

  const { data: currentQaData, isLoading } = useQuery({
    ...qaDataForMapQueryOptions({
      configId: activeQaConfig?.id || 0,
      regionSlug: regionSlug || 'none',
      userIds,
    }),
    enabled: !!shouldFetch,
    refetchOnWindowFocus: false,
  })

  // Filter QA data based on selected style (client-side filtering since Maplibre doesn't support feature-state in filters)
  // React Compiler automatically memoizes this computation
  const filteredQaData = currentQaData ? filterQaDataByStyle(currentQaData, qaParamData.style) : []

  const shouldUpdateFeatureStates = mainMap !== undefined && mapLoaded

  // Extract setFeatureState logic into a function
  const updateFeatureStates = useCallback(() => {
    if (!mainMap || !shouldUpdateFeatureStates) return

    // Check if the QA layer exists before querying it
    const qaLayer = mainMap.getMap().getLayer(qaLayerId)
    if (!qaLayer) {
      if (!isProd) console.log('[DEV][useQaMapState]', 'QA layer does not exist yet')
      return
    }

    // Get all rendered QA features from the map
    const mapQaFeatures: MapGeoJSONFeature[] = mainMap.queryRenderedFeatures({
      layers: [qaLayerId],
    })

    if (!isProd) console.time('[DEV][useQaMapState] setFeatureState')

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

    if (!isProd) console.timeEnd('[DEV][useQaMapState] setFeatureState')
  }, [mainMap, shouldUpdateFeatureStates, currentQaData, filteredQaData])

  // Initial loading effect - runs when QA data first loads or style changes
  useEffect(
    function syncFeatureStatesAfterQaDataChanges() {
      if (shouldUpdateFeatureStates) {
        startFeatureStateSync()
        updateFeatureStates()
        finishFeatureStateSync()
      }
    },
    [finishFeatureStateSync, shouldUpdateFeatureStates, startFeatureStateSync, updateFeatureStates],
  )

  // Data loading effect - runs when QA source data is loaded
  useEffect(
    function resyncFeatureStatesWhenQaSourceLoads() {
      if (!mainMap) return

      const handleData = (event: { sourceId?: string }) => {
        if (event.sourceId === qaSourceId && shouldUpdateFeatureStates) {
          startFeatureStateSync()
          updateFeatureStates()
          finishFeatureStateSync()
        }
      }

      mainMap.getMap().on('data', handleData)

      return function removeQaSourceDataListener() {
        mainMap.getMap().off('data', handleData)
      }
    },
    [
      finishFeatureStateSync,
      mainMap,
      shouldUpdateFeatureStates,
      startFeatureStateSync,
      updateFeatureStates,
    ],
  )

  return {
    qaData: currentQaData,
    isLoading,
    filteredQaData,
    filterQaDataByStyle,
  }
}
