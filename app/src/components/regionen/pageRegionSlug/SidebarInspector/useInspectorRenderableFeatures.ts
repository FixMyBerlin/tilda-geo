import type { MapGeoJSONFeature } from 'react-map-gl/maplibre'
import { useMapInspectorFeatures } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useSelectedFeatures } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/useSelectedFeatures'
import { isModeOwnedSource } from '@/components/regionen/pageRegionSlug/modes/modeScopedSelection'
import {
  isSourceKeyAtlasGeo,
  parseSourceKeyAtlasGeo,
} from '../utils/sourceKeyUtils/sourceKeyUtilsAtlasGeo'

const isMapFeature = (feature: MapGeoJSONFeature | undefined): feature is MapGeoJSONFeature =>
  feature !== undefined

/*
 * One map source (e.g. `atlas_bikelanes`) can be added under several categories, which gives
 * it several source keys (`cat:…--source:atlas_bikelanes--subcat:…`). A click then returns the
 * same feature once per category with identical properties, so we key by the data source and
 * the TILDA id (`properties.id`) instead of the source key.
 */
const dataFeatureKey = (feature: MapGeoJSONFeature) => {
  const featureId = feature.properties?.id ?? feature.id
  // Without an id we cannot tell duplicates from different features, so we keep them all.
  if (featureId === undefined || featureId === null) return undefined
  const sourceKey = String(feature.source)
  const dataSource = isSourceKeyAtlasGeo(sourceKey)
    ? parseSourceKeyAtlasGeo(sourceKey).sourceId
    : sourceKey
  return `${dataSource}|${featureId}`
}

const uniqueDataFeatures = (features: MapGeoJSONFeature[]) => {
  const seen = new Set<string>()
  return features.filter((feature) => {
    const key = dataFeatureKey(feature)
    if (key === undefined) return true
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** Inspector features excluding sources owned by the current mode panel (notes / QA / Prüflisten), each data feature once. */
export const inspectorRenderableFeatures = (
  inspectorFeatures: MapGeoJSONFeature[],
  selectedMapFeatures: (MapGeoJSONFeature | undefined)[],
) => {
  const rawFeatures = inspectorFeatures.length
    ? inspectorFeatures
    : selectedMapFeatures.filter(isMapFeature)
  return uniqueDataFeatures(rawFeatures.filter((feature) => !isModeOwnedSource(feature.source)))
}

/** True when the mobile inspector sheet (or desktop inspector) has something to show. */
export const useInspectorRenderableFeatures = () => {
  const inspectorFeatures = useMapInspectorFeatures()
  const selectedFeatures = useSelectedFeatures(!inspectorFeatures.length)
  return inspectorRenderableFeatures(
    inspectorFeatures,
    selectedFeatures.map((feature) => feature.mapFeature),
  )
}
