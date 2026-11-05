import type { MapGeoJSONFeature } from 'react-map-gl/maplibre'
import {
  isSourceKeyTilda,
  parseSourceKeyTilda,
} from '../../utils/sourceKeyUtils/sourceKeyUtilsTilda'

/*
 * One map source (e.g. `atlas_bikelanes`) can be added under several categories, which gives
 * it several source keys (`cat:…--source:atlas_bikelanes--subcat:…`). A click then returns the
 * same feature once per category with identical properties, so we key by the data source and
 * the TILDA id (`properties.id`) instead of the source key.
 * `properties.id` comes before `feature.id` because some sources promote another property
 * (`lars_parking_areas` promotes `osm_id`, which repeats across OSM types).
 */
const dataFeatureKey = (feature: MapGeoJSONFeature) => {
  const featureId = feature.properties?.id ?? feature.id
  // Without an id we cannot tell duplicates from different features, so we keep them all.
  if (featureId === undefined) return undefined
  const dataSource = isSourceKeyTilda(feature.source)
    ? parseSourceKeyTilda(feature.source).sourceId
    : feature.source
  return `${dataSource}|${featureId}`
}

/** Each data feature once, in the order given. */
export const uniqueDataFeatures = (features: MapGeoJSONFeature[]) => {
  const seen = new Set<string>()
  return features.filter((feature) => {
    const key = dataFeatureKey(feature)
    if (key === undefined) return true
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
