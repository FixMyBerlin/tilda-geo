import adler32 from 'adler-32'
import invariant from 'tiny-invariant'
import { z } from 'zod'
import type { UrlFeature } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/types'
import { numericSourceIds } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/url'
import {
  latitude,
  longitude,
} from '@/components/regionen/pageRegionSlug/hooks/useQueryState/utils/zodHelper'

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

  // Adler-32 checksum for a static dataset id not in numericSourceIds; checksums are not reversible.
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
