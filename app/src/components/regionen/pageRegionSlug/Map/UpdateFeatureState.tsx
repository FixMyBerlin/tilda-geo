import { differenceBy } from 'es-toolkit/compat'
import { useEffect, useRef } from 'react'
import type { MapGeoJSONFeature } from 'react-map-gl/maplibre'
import { useMap } from 'react-map-gl/maplibre'
import {
  useMapInspectorFeatures,
  useMapLoaded,
} from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useSelectedFeatures } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/useSelectedFeatures'
import { safeSetFeatureState } from './utils/safeSetFeatureState'

const key = (f: MapGeoJSONFeature) => `${f.id}:::${f.layer.id}`

type FeatureStateMapWriter = {
  setFeatureState: (feature: MapGeoJSONFeature, state: { selected: boolean }) => void
}

export const syncSelectedFeatureState = ({
  map,
  currentSelectedFeatures,
  previousSelectedFeatures,
}: {
  map: FeatureStateMapWriter
  currentSelectedFeatures: MapGeoJSONFeature[]
  previousSelectedFeatures: MapGeoJSONFeature[]
}) => {
  differenceBy(previousSelectedFeatures, currentSelectedFeatures, key).forEach((f) => {
    map.setFeatureState(f, { selected: false })
  })

  differenceBy(currentSelectedFeatures, previousSelectedFeatures, key).forEach((f) => {
    map.setFeatureState(f, { selected: true })
  })
}

export const UpdateFeatureState = () => {
  const { mainMap } = useMap()
  const mapLoaded = useMapLoaded()
  const previous = useRef<MapGeoJSONFeature[]>([])
  const inspectorFeatures = useMapInspectorFeatures()
  const selectedFeatures = useSelectedFeatures(!inspectorFeatures.length)

  const currentSelectedFeatures = inspectorFeatures.length
    ? inspectorFeatures
    : selectedFeatures.map((f) => f.mapFeature).filter(Boolean)

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
    [currentSelectedFeatures, mainMap, mapLoaded],
  )

  return null
}
