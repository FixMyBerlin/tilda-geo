import type { MapSourceDataEvent } from 'maplibre-gl'
import { useEffect, useEffectEvent } from 'react'
import type { MapGeoJSONFeature } from 'react-map-gl/maplibre'
import { useMap } from 'react-map-gl/maplibre'
import {
  qaLayerId,
  qaSourceId,
} from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/SourcesLayersQa'
import { qaStatusForMapFilter } from '@/components/regionen/pageRegionSlug/modes/qa/qaConfigStyles'
import {
  qaMapPayloadAppliesDefault,
  resolveQaMapStatus,
} from '@/components/regionen/pageRegionSlug/modes/qa/qaMapDefaultStatus'
import { isProd } from '@/components/shared/utils/isEnv'
import { useMapActions, useMapLoaded } from './useMapState'
import { qaMapRowMatchesStatus, useQaMapData } from './useQaMapData'

/** Keeps QA feature-state in sync with the payload. Tile availability is `map.on('sourcedata')`; payload/filter is the effect below. */
export const useQaMapState = () => {
  const { mainMap } = useMap()
  const mapLoaded = useMapLoaded()
  const { startFeatureStateSync, finishFeatureStateSync } = useMapActions()
  const { data: currentQaData, qaDataByAreaId, qaParamData } = useQaMapData()

  const shouldUpdateFeatureStates = mainMap !== undefined && mapLoaded
  const applyDefault =
    currentQaData !== undefined &&
    qaMapPayloadAppliesDefault({ search: qaParamData.search, userIds: qaParamData.users })
  const statusFilter = qaStatusForMapFilter(qaParamData.status)

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

      mapQaFeatures.forEach((feature) => {
        const featureId = feature.id?.toString()
        if (!featureId) return

        const resolved = resolveQaMapStatus(qaDataByAreaId.get(featureId), applyDefault)
        // Only set status if visible — null systemStatus/userStatus when filtered out.
        if (!resolved || !qaMapRowMatchesStatus(resolved, statusFilter)) {
          mainMap.setFeatureState(feature, { systemStatus: null, userStatus: null })
          return
        }

        mainMap.setFeatureState(feature, {
          systemStatus: resolved.systemStatus,
          userStatus: resolved.userStatus,
        })
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
    [applyDefault, qaDataByAreaId, statusFilter, shouldUpdateFeatureStates, mainMap, mapLoaded],
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
