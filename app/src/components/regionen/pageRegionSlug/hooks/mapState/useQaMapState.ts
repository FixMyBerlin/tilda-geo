import { useEffect } from 'react'
import type { MapGeoJSONFeature } from 'react-map-gl/maplibre'
import { useMap } from 'react-map-gl/maplibre'
import { qaLayerId } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/SourcesLayersQa'
import { qaStatusForMapFilter } from '@/components/regionen/pageRegionSlug/modes/qa/qaConfigStyles'
import {
  qaMapPayloadAppliesDefault,
  resolveQaMapStatus,
} from '@/components/regionen/pageRegionSlug/modes/qa/qaMapDefaultStatus'
import { isProd } from '@/components/shared/utils/isEnv'
import { useMapActions, useMapLoaded } from './useMapState'
import { qaMapRowMatchesStatus, useQaMapData } from './useQaMapData'

/** Keeps QA feature-state in sync with the payload. `syncQaFeatureStates` is also called from `<Map onSourceData>`. */
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

  const updateFeatureStates = () => {
    if (!mainMap || !shouldUpdateFeatureStates) return

    const qaLayer = mainMap.getMap().getLayer(qaLayerId)
    if (!qaLayer) {
      if (!isProd) console.log('[DEV][useQaMapState]', 'QA layer does not exist yet')
      return
    }

    const mapQaFeatures: MapGeoJSONFeature[] = mainMap.queryRenderedFeatures({
      layers: [qaLayerId],
    })

    if (!isProd) console.time('[DEV][useQaMapState] setFeatureState')

    mapQaFeatures.forEach((feature) => {
      const featureId = feature.id?.toString()
      if (!featureId) return

      const resolved = resolveQaMapStatus(qaDataByAreaId.get(featureId), applyDefault)
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

  const syncQaFeatureStates = () => {
    if (!shouldUpdateFeatureStates) return
    startFeatureStateSync()
    updateFeatureStates()
    finishFeatureStateSync()
  }

  // Initial loading effect - runs when QA data first loads or style changes
  useEffect(
    function syncFeatureStatesAfterQaDataChanges() {
      syncQaFeatureStates()
    },
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- Compiler memoizes syncQaFeatureStates; listing it fails "changes every render"
    [
      applyDefault,
      finishFeatureStateSync,
      mainMap,
      qaDataByAreaId,
      shouldUpdateFeatureStates,
      startFeatureStateSync,
      statusFilter,
    ],
  )

  return { syncQaFeatureStates }
}
