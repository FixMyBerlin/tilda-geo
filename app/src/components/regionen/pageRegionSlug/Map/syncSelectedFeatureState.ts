import { differenceBy } from 'es-toolkit/compat'
import type { MapGeoJSONFeature } from 'react-map-gl/maplibre'

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
