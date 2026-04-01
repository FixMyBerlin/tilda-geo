import type { MapDataOsmIdConfig } from '@/components/regionen/pageRegionSlug/mapData/types'
import { longOsmType } from './shortLongOsmType'

// This file looks complicated due to all the type guarding.
// But all it does is take properties and the `osmIdConfig` from a source
// and return { osmType: null, osmId: null }
// or  return { osmType: 'way'|'node'|'relation', osmId: number }
// where osmType is always the long version (not 'w','n','r')

const emptyResponse = { osmType: null, osmId: null }

export type OsmTypeId = ReturnType<typeof extractOsmTypeIdByConfig>
export type OsmTypeIdNonNull = Exclude<
  ReturnType<typeof extractOsmTypeIdByConfig>,
  { osmType: null; osmId: null }
>

export const extractOsmTypeIdByConfig = (
  properties: Record<string, string | number>,
  config: MapDataOsmIdConfig,
) => {
  if (!config) return emptyResponse

  if ('osmTypeId' in config) {
    const key = config.osmTypeId
    return deserializeId(properties[key])
  }

  if ('osmType' in config && 'osmId' in config) {
    const keyType = config.osmType
    const keyId = config.osmId
    const valueType = properties[keyType]
    if (typeof valueType !== 'string') return emptyResponse
    const resolvedType = makeLongOsmType(valueType)
    if (!resolvedType) return emptyResponse
    return { osmType: resolvedType, osmId: Number(properties[keyId]) }
  }

  return emptyResponse
}

const deserializeId = (id: string | number | undefined) => {
  if (typeof id !== 'string') return emptyResponse

  const [osmType, osmId] = id.split('/', 2)
  if (typeof osmType !== 'string') return emptyResponse

  const resolvedType = makeLongOsmType(osmType)
  if (!resolvedType || typeof osmId !== 'string') return emptyResponse

  return { osmType: resolvedType, osmId: Number(osmId) }
}

const makeLongOsmType = (osmType: string | undefined) => {
  if (!osmType) return null

  const checkType = longOsmType[osmType]
  if (checkType === 'way') return 'way' as const
  if (checkType === 'node') return 'node' as const
  if (checkType === 'relation') return 'relation' as const
  return null
}
