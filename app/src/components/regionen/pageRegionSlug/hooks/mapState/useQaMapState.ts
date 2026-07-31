import { useCallback, useEffect } from 'react'
import type { MapGeoJSONFeature } from 'react-map-gl/maplibre'
import { useMap } from 'react-map-gl/maplibre'
import {
  qaLayerId,
  qaSourceId,
} from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/SourcesLayersQa'
import { isProd } from '@/components/shared/utils/isEnv'
import { useMapActions, useMapLoaded } from './useMapState'
import { filterQaDataByStyle, useQaMapData } from './useQaMapData'

export const useQaMapState = () => {
  const { mainMap } = useMap()
  const mapLoaded = useMapLoaded()
  const { startFeatureStateSync, finishFeatureStateSync } = useMapActions()
  const { data: currentQaData, isLoading, filteredQaData, qaParamData } = useQaMapData()

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
      const styleFilteredQaData = currentQaData
        ? filterQaDataByStyle(currentQaData, qaParamData.style)
        : []
      const visibleAreaIds = new Set(styleFilteredQaData.map((item) => item.areaId))

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
  }, [mainMap, shouldUpdateFeatureStates, currentQaData, qaParamData.style])

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
