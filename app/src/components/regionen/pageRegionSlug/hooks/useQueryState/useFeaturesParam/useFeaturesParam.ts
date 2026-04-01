import { bbox } from '@turf/turf'
import adler32 from 'adler-32'
import { createParser, useQueryState } from 'nuqs'
import type { MapGeoJSONFeature } from 'react-map-gl/maplibre'
import invariant from 'tiny-invariant'
import { z } from 'zod'
import {
  numericSourceIds,
  persistableSourceKeys,
} from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/url'
import {
  isSourceKeyAtlasGeo,
  parseSourceKeyAtlasGeo,
} from '@/components/regionen/pageRegionSlug/utils/sourceKeyUtils/sourceKeyUtilsAtlasGeo'
import { parseSourceKeyStaticDatasets } from '@/components/regionen/pageRegionSlug/utils/sourceKeyUtils/sourceKeyUtilsStaticDataset'
import { searchParamsRegistry } from '../searchParamsRegistry'
import type { UrlFeature } from '../types'
import { latitude, longitude } from '../utils/zodHelper'

const stringSourceIds = Object.fromEntries(Object.entries(numericSourceIds).map(([k, v]) => [v, k]))

function adlerChecksum(s: string) {
  const arr = new Uint32Array([adler32.str(s)])
  const value = arr[0]
  invariant(
    value !== undefined,
    `adlerChecksum: unexpected empty result for input length ${s.length}`,
  )
  return value
}

export const getRegistrySourceKey = (feature: MapGeoJSONFeature) => {
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
    // biome-ignore lint/style/noNonNullAssertion: All our sources promote a feature id
    id: feature.id!,
    sourceId,
    coordinates: coords,
  } as UrlFeature
}

export const serializeFeaturesParam = (urlFeatures: UrlFeature[]) => {
  return urlFeatures
    .map((f) => {
      const { id, sourceId, coordinates } = f
      const numericSourceId = stringSourceIds[sourceId] || adlerChecksum(sourceId)
      return [numericSourceId, id, ...coordinates].join('|')
    })
    .join(',')
}

const Ids = [z.coerce.number(), z.union([z.coerce.number(), z.string()])] as const
const Point = [longitude, latitude] as const
const QuerySchema = z.union([z.tuple([...Ids, ...Point]), z.tuple([...Ids, ...Point, ...Point])])

function numericSourceIdToString(numericSourceId: number) {
  // Lookup: numericSourceId -> sourceId (numericSourceIds already maps number -> string)
  const sourceId = numericSourceIds[numericSourceId]
  if (sourceId) return sourceId

  // If not found in known mappings, it's an Adler-32 checksum for a static dataset
  // We can't reverse checksums deterministically, so we'd need to check all datasets
  // For now, return a placeholder - this is a limitation
  // TODO: Consider storing checksum->sourceId mapping or using a different approach
  return `unknown-${numericSourceId}`
}

export const parseFeaturesParam = (query: string) => {
  return query
    .split(',')
    .map((s) => {
      const parsed = QuerySchema.safeParse(s.split('|'))
      if (!parsed.success) return null
      const [numericSourceId, id, ...coordinates] = parsed.data
      const sourceId = numericSourceIdToString(numericSourceId)
      return {
        id,
        sourceId,
        coordinates: coordinates,
      }
    })
    .filter((p) => p !== null) as UrlFeature[]
}

const featuresParamParser = createParser({
  parse: (query) => parseFeaturesParam(query),
  serialize: serializeFeaturesParam,
}).withOptions({ history: 'push', shallow: true })

export const useFeaturesParam = () => {
  const [featuresParam, setFeaturesParam] = useQueryState(
    searchParamsRegistry.f,
    featuresParamParser,
  )
  return { featuresParam, setFeaturesParam }
}
