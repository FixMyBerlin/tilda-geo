import type { MapSourceDataEvent } from 'maplibre-gl'
import { useEffect, useEffectEvent } from 'react'
import type { MapGeoJSONFeature } from 'react-map-gl/maplibre'
import { useMap } from 'react-map-gl/maplibre'
import {
  qaLayerId,
  qaSourceId,
} from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/SourcesLayersQa'
import {
  qaStatusForMapFilter,
  resolvedQaIndicatorKeys,
} from '@/components/regionen/pageRegionSlug/modes/qa/qaConfigStyles'
import { isProd } from '@/components/shared/utils/isEnv'
import {
  encodeQaStatusLetters,
  QA_NO_USER_STATUS_LETTER,
  worstQaIndicatorStatus,
} from '@/shared/qaIndicatorStatus'
import { qaMapPayloadAppliesDefault } from '@/shared/qaMapDefaultStatus'
import { useMapActions, useMapLoaded } from './useMapState'
import {
  qaMapRowMatchesStatus,
  resolveQaIndicatorPairs,
  selectQaIndicatorPairs,
  useQaMapData,
} from './useQaMapData'

/** Keeps QA feature-state in sync with the payload. Tile availability is `map.on('sourcedata')`; payload/filter is the effect below. */
export const useQaMapState = () => {
  const { mainMap } = useMap()
  const mapLoaded = useMapLoaded()
  const { startFeatureStateSync, finishFeatureStateSync } = useMapActions()
  const { data: currentQaData, qaDataByAreaId, indicators, qaParamData } = useQaMapData()

  const shouldUpdateFeatureStates = mainMap !== undefined && mapLoaded
  const applyDefault =
    currentQaData !== undefined &&
    qaMapPayloadAppliesDefault({ search: qaParamData.search, userIds: qaParamData.users })
  const statusFilter = qaStatusForMapFilter(qaParamData.status)
  // The map and the area list resolve the URL keys the same way: a selection that matches no key
  // of the config means every indicator.
  const resolvedIndicatorKeys = resolvedQaIndicatorKeys(
    qaParamData.ind,
    indicators.map((indicator) => indicator.key),
  )
  const selectedIndicatorKeys =
    qaParamData.ind && qaParamData.ind.length > 0 && resolvedIndicatorKeys.length > 0
      ? resolvedIndicatorKeys
      : undefined
  // A new array every render; the effect below depends on its content.
  const selectedIndicatorKeysId = selectedIndicatorKeys?.join('\u0000')

  const syncQaFeatureStates = useEffectEvent(function syncQaFeatureStates() {
    if (!mainMap || !shouldUpdateFeatureStates) return

    startFeatureStateSync()

    // Timing guard: queryRenderedFeatures is unsafe until the QA layer exists.
    const qaLayer = mainMap.getMap().getLayer(qaLayerId)
    if (!qaLayer) {
      if (!isProd) console.log('[DEV][useQaMapState]', 'QA layer does not exist yet')
    } else {
      const mapQaFeatures: MapGeoJSONFeature[] = mainMap.queryRenderedFeatures({
        layers: [qaLayerId],
      })

      if (!isProd) console.time('[DEV][useQaMapState] setFeatureState')

      // A cell can render as several features across tile boundaries; decide its feature-state
      // once per areaId instead of redoing the same pair/filter work for every duplicate.
      const featureStateByAreaId = new Map<
        string,
        { systemStatus: string | null; userStatus: string | null }
      >()

      const featureStateForArea = (areaId: string) => {
        const cached = featureStateByAreaId.get(areaId)
        if (cached) return cached

        const pairs = resolveQaIndicatorPairs(
          qaDataByAreaId.get(areaId),
          indicators.length,
          applyDefault,
        )
        const selectedPairs = pairs
          ? selectQaIndicatorPairs(pairs, indicators, selectedIndicatorKeys)
          : undefined

        // Only set status if visible — null systemStatus/userStatus when filtered out.
        let result: { systemStatus: string | null; userStatus: string | null }
        if (
          !selectedPairs ||
          selectedPairs.length === 0 ||
          !qaMapRowMatchesStatus(selectedPairs, statusFilter)
        ) {
          result = { systemStatus: null, userStatus: null }
        } else {
          const worst = worstQaIndicatorStatus(selectedPairs)!
          const { sys, usr } = encodeQaStatusLetters([worst])
          result = { systemStatus: sys, userStatus: usr === QA_NO_USER_STATUS_LETTER ? null : usr }
        }

        featureStateByAreaId.set(areaId, result)
        return result
      }

      mapQaFeatures.forEach((feature) => {
        const featureId = feature.id?.toString()
        if (!featureId) return
        mainMap.setFeatureState(feature, featureStateForArea(featureId))
      })

      if (!isProd) console.timeEnd('[DEV][useQaMapState] setFeatureState')
    }

    finishFeatureStateSync()
  })

  // Payload/filter changes, not style. Tile availability is a second trigger via map.on('sourcedata').
  useEffect(
    function syncFeatureStatesAfterQaDataChanges() {
      syncQaFeatureStates()
    },
    [
      applyDefault,
      qaDataByAreaId,
      indicators,
      selectedIndicatorKeysId,
      statusFilter,
      shouldUpdateFeatureStates,
      mainMap,
      mapLoaded,
    ],
  )

  useEffect(
    function subscribeToQaSourceData() {
      if (!mainMap) return
      const map = mainMap.getMap()

      const handleQaSourceData = (event: MapSourceDataEvent) => {
        if (event.sourceId !== qaSourceId || !event.isSourceLoaded) return
        syncQaFeatureStates()
      }

      map.on('sourcedata', handleQaSourceData)

      return function unsubscribeFromQaSourceData() {
        map.off('sourcedata', handleQaSourceData)
      }
    },
    [mainMap],
  )
}
