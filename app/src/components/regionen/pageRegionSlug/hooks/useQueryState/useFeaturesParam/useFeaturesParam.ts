import { bbox } from '@turf/turf'
import type { MapGeoJSONFeature } from 'react-map-gl/maplibre'
import { persistableSourceKeys } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/url'
import {
  isSourceKeyAtlasGeo,
  parseSourceKeyAtlasGeo,
} from '@/components/regionen/pageRegionSlug/utils/sourceKeyUtils/sourceKeyUtilsAtlasGeo'
import { parseSourceKeyStaticDatasets } from '@/components/regionen/pageRegionSlug/utils/sourceKeyUtils/sourceKeyUtilsStaticDataset'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import type { UrlFeature } from '../types'
import { useRegionSearchNavigation } from '../useRegionSearchNavigation'
import { parseFeaturesParam, serializeFeaturesParam } from './featuresParamCodec'

const getRegistrySourceKey = (feature: MapGeoJSONFeature) => {
  // Only true for additionalSourceKeys (notes): they use simple source ids that match the registry.
  if (persistableSourceKeys.has(feature.source)) return feature.source
  // Atlas: feature.source is a long key e.g. "cat:bikelanes--source:atlas_bikelanes--subcat:bikelanes" → parse to registry key.
  const atlasGeoSourceId = parseSourceKeyAtlasGeo(feature.source).sourceId
  if (atlasGeoSourceId) return atlasGeoSourceId
  // Static: feature.source is e.g. "tilda_parkings" or "tilda_parkings--subId" → parse to sourceId.
  return parseSourceKeyStaticDatasets(feature.source).sourceId
}

export const isPersistableFeature = (
  feature: MapGeoJSONFeature,
  regionDatasets: { id: string }[],
) => {
  if (persistableSourceKeys.has(feature.source)) {
    return true
  }
  const key = getRegistrySourceKey(feature)
  if (persistableSourceKeys.has(key) && isSourceKeyAtlasGeo(feature.source)) {
    return true
  }
  return regionDatasets.some(({ id }) => id === key)
}

export const convertToUrlFeature = (feature: MapGeoJSONFeature) => {
  const sourceId = getRegistrySourceKey(feature)
  const coords = (
    feature.geometry.type === 'Point' ? feature.geometry.coordinates : bbox(feature.geometry)
  ).map((v) => Number(v.toFixed(6)))
  return {
    // oxlint-disable-next-line typescript/no-non-null-assertion -- All our sources promote a feature id
    id: feature.id!,
    sourceId,
    coordinates: coords,
  } as UrlFeature
}

export const useFeaturesParam = () => {
  const { search, updateSearch } = useRegionSearchNavigation()
  const wire = search[searchParamsRegistry.f]
  const featuresParam = wire ? parseFeaturesParam(wire) : []

  const setFeaturesParam = (value: UrlFeature[] | null) => {
    updateSearch({
      [searchParamsRegistry.f]:
        value && value.length > 0 ? serializeFeaturesParam(value) : undefined,
    })
  }

  return { featuresParam, setFeaturesParam }
}
