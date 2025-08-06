import { numericSourceIds } from '@/src/app/regionen/[regionSlug]/_hooks/useQueryState/useFeaturesParam/url'
import { bbox } from '@turf/turf'
import adler32 from 'adler-32'
import { memoize } from 'lodash'
import { createParser, useQueryState } from 'nuqs'
import { MapGeoJSONFeature } from 'react-map-gl/maplibre'
import { z } from 'zod'
import { osmNotesSourceId } from '../../../_components/Map/SourcesAndLayers/SourcesLayersOsmNotes'
import { parseSourceKeyAtlasGeo } from '../../../_components/utils/sourceKeyUtils/sourceKeyUtilsAtlasGeo'
import { parseSourceKeyStaticDatasets } from '../../../_components/utils/sourceKeyUtils/sourceKeyUtilsStaticDataset'
import { searchParamsRegistry } from '../searchParamsRegistry'
import { UrlFeature } from '../types'
import { createMemoizer } from '../utils/createMemoizer'
import { latitude, longitude } from '../utils/zodHelper'

const memoizer = createMemoizer()

const stringSourceIds = Object.fromEntries(Object.entries(numericSourceIds).map(([k, v]) => [v, k]))

function adlerChecksum(s: string) {
  return new Uint32Array([adler32.str(s)])[0]!
}

export const convertToUrlFeature = (feature: MapGeoJSONFeature): UrlFeature => {
  const { id, source, geometry } = feature
  let sourceId: string
  const atlasGeoSourceId = parseSourceKeyAtlasGeo(source).sourceId
  if (source === osmNotesSourceId) {
    sourceId = osmNotesSourceId
  } else if (atlasGeoSourceId) {
    sourceId = atlasGeoSourceId
  } else {
    sourceId = parseSourceKeyStaticDatasets(source).sourceId as string
  }
  const data: any = {
    id,
    sourceId,
    coordinates: (geometry.type === 'Point' ? geometry.coordinates : bbox(geometry)).map((v) =>
      Number(v.toFixed(6)),
    ),
  }
  return data
}

export const serializeFeaturesParam = (urlFeatures: UrlFeature[]): string => {
  return urlFeatures
    .map((f) => {
      const { id, sourceId, coordinates } = f
      const numericSourceId = stringSourceIds[sourceId] || adlerChecksum(sourceId)
      return [numericSourceId, id, ...coordinates].join('|')
    })
    .join(',')
}

const Ids = [z.coerce.number(), z.union([z.coerce.number(), z.string()])]
const Point = [longitude, latitude]
// @ts-expect-errors - this work
const QuerySchema = z.union([z.tuple([...Ids, ...Point]), z.tuple([...Ids, ...Point, ...Point])])

export const parseFeaturesParam = memoize((query: string) => {
  return query
    .split(',')
    .map((s) => {
      const parsed = QuerySchema.safeParse(s.split('|'))
      if (!parsed.success) return null
      const [numericSourceId, id, ...coordinates] = parsed.data
      return {
        id,
        coordinates,
      }
    })
    .filter((p) => p !== null) as unknown as UrlFeature[]
})

const featuresParamParser = createParser({
  parse: (query): UrlFeature[] => parseFeaturesParam(query),
  serialize: serializeFeaturesParam,
}).withOptions({ history: 'push' })

export const useFeaturesParam = () => {
  const [featuresParam, setFeaturesParam] = useQueryState(
    searchParamsRegistry.f,
    featuresParamParser,
  )
  return memoizer({ featuresParam, setFeaturesParam })
}
