import { useEffect, useRef } from 'react'
import type { MapGeoJSONFeature } from 'react-map-gl/maplibre'
import { useMap } from 'react-map-gl/maplibre'
import {
  useMapInspectorFeatures,
  useMapLoaded,
} from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useFeaturesParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/useFeaturesParam'
import { useSelectedFeatures } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/useSelectedFeatures'
import { isModeOwnedSource } from '@/components/regionen/pageRegionSlug/modes/modeScopedSelection'
import { syncSelectedFeatureState } from './syncSelectedFeatureState'
import { safeSetFeatureState } from './utils/safeSetFeatureState'

export const UpdateFeatureState = () => {
  const { mainMap } = useMap()
  const mapLoaded = useMapLoaded()
  const previous = useRef<MapGeoJSONFeature[]>([])
  const inspectorFeatures = useMapInspectorFeatures()
  const { featuresParam } = useFeaturesParam()
  const hasModeUrlSelection = featuresParam.some((feature) => isModeOwnedSource(feature.sourceId))
  const selectedFeatures = useSelectedFeatures(!inspectorFeatures.length || hasModeUrlSelection)
  const inspectorDomainFeatures = inspectorFeatures.filter(
    (feature) => !isModeOwnedSource(feature.source),
  )
  const urlMapFeatures = selectedFeatures.map((f) => f.mapFeature).filter(Boolean)
  const currentSelectedFeatures = inspectorDomainFeatures.length
    ? [
        ...inspectorDomainFeatures,
        ...urlMapFeatures.filter((feature) => isModeOwnedSource(feature.source)),
      ]
    : urlMapFeatures

  useEffect(
    function syncSelectedFeatureStateToMap() {
      if (!mainMap || !mapLoaded) return

      const current = currentSelectedFeatures
      const previousSelectedFeatures = previous.current
      const map = {
        setFeatureState: (feature: MapGeoJSONFeature, state: { selected: boolean }) => {
          safeSetFeatureState(mainMap, feature, state)
        },
      }

      syncSelectedFeatureState({
        map,
        currentSelectedFeatures: current,
        previousSelectedFeatures,
      })

      previous.current = current
    },
    // oxlint-disable-next-line react/exhaustive-deps -- oxlint --fix-dangerously drops this and leaves selection highlighting stale
    [mainMap, mapLoaded, currentSelectedFeatures],
  )

  return null
}
