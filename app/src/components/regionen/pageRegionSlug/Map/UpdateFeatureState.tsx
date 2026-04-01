import { differenceBy } from 'es-toolkit/compat'
import { useEffect, useRef } from 'react'
import type { MapGeoJSONFeature } from 'react-map-gl/maplibre'
import { useMap } from 'react-map-gl/maplibre'
import { useMapInspectorFeatures } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useSelectedFeatures } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/useSelectedFeatures'

const key = (f: MapGeoJSONFeature) => `${f.id}:::${f.layer.id}`

export const UpdateFeatureState = () => {
  const { mainMap } = useMap()
  const previous = useRef<MapGeoJSONFeature[]>([])
  const inspectorFeatures = useMapInspectorFeatures()
  const selectedFeatures = useSelectedFeatures(!inspectorFeatures.length)

  const currentSelectedFeatures = inspectorFeatures.length
    ? inspectorFeatures
    : selectedFeatures.map((f) => f.mapFeature).filter(Boolean)

  const currentSelectedRef = useRef(currentSelectedFeatures)
  currentSelectedRef.current = currentSelectedFeatures

  useEffect(
    function syncSelectedFeatureStateToMap() {
      if (!mainMap) return

      const current = currentSelectedRef.current
      const previousSelectedFeatures = previous.current

      differenceBy(previousSelectedFeatures, current, key).forEach((f) => {
        mainMap.setFeatureState(f, { selected: false })
      })

      differenceBy(current, previousSelectedFeatures, key).forEach((f) => {
        mainMap.setFeatureState(f, { selected: true })
      })

      previous.current = current
    },
    [mainMap],
  )

  return null
}
