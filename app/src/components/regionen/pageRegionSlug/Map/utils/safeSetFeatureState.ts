import type { MapGeoJSONFeature } from 'react-map-gl/maplibre'
import { isProd } from '@/components/shared/utils/isEnv'

type FeatureStateValue = string | number | boolean | null
type FeatureState = Record<string, FeatureStateValue>

type FeatureStateMap = {
  setFeatureState: (feature: MapGeoJSONFeature, state: FeatureState) => void
  getMap: () => { getSource: (sourceId: string) => unknown }
}

export const safeSetFeatureState = (
  map: FeatureStateMap,
  feature: MapGeoJSONFeature,
  state: FeatureState,
) => {
  if (feature.id === undefined || feature.id === null) {
    return
  }

  const sourceId = feature.source?.toString()
  if (!sourceId) {
    return
  }

  if (!map.getMap().getSource(sourceId)) {
    if (!isProd) {
      console.debug('[map] skip setFeatureState: source missing', { sourceId, state })
    }
    return
  }

  map.setFeatureState(feature, state)
}
