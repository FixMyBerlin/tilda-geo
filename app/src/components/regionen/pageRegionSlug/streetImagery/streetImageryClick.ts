import {
  queryStreetImageryFeatures,
  streetImageryInteractiveLayerIds,
} from '@osm-editor-kit/street-imagery-react'
import type { MapGeoJSONFeature } from 'react-map-gl/maplibre'
import { streetImageryProviderIds, type StreetImageryProviderId } from './streetImageryParam'

const allLayerIds = new Set(streetImageryInteractiveLayerIds([...streetImageryProviderIds]))

/** Photos are not TILDA data: they must not reach the inspector, hover states or the tooltip. */
export const isStreetImageryFeature = (feature: MapGeoJSONFeature) =>
  allLayerIds.has(feature.layer.id)

/** The photo under the click, if any. */
export const clickedStreetImageryPhoto = (features: MapGeoJSONFeature[] | undefined) => {
  const hit = queryStreetImageryFeatures({ features }).find((feature) => feature.kind === 'photo')
  const provider = streetImageryProviderIds.find((id) => id === hit?.providerId)
  if (!hit?.photoId || !provider) return null
  return { provider, id: hit.photoId, sequence: hit.sequenceId } satisfies {
    provider: StreetImageryProviderId
    id: string
    sequence?: string
  }
}
