import {
  sources,
  type SourcesId,
} from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/sources.const'
import { hasExplicitTilesUrl } from '@/components/regionen/pageRegionSlug/mapData/types'

/** Processing map sources whose Martin `atlas_generalized_*` paths can be cache-warmed. */
export const warmableSources = sources.filter((source) => !hasExplicitTilesUrl(source))

const sourceIdToTablesKey = new Map(
  warmableSources.map((source) => [source.id, source.tileTables.join(',')] as const),
)

const tablesKeyToSourceId = new Map(
  warmableSources.map((source) => [source.tileTables.join(','), source.id] as const),
)

export const warmableSourceIdSet = new Set<string>(sourceIdToTablesKey.keys())
export const warmableTablesKeySet = new Set(tablesKeyToSourceId.keys())

export const cacheWarmingSourceOptions = warmableSources.map((source) => ({
  id: source.id,
  label: source.id,
  tablesKey: source.tileTables.join(','),
}))

export const sourceIdToWarmingTablesKey = (id: string) => sourceIdToTablesKey.get(id as SourcesId)

export const warmingTablesKeyToSourceId = (key: string) => tablesKeyToSourceId.get(key)

export const sourceIdsToWarmingTables = (sourceIds: string[]) =>
  sourceIds.flatMap((id) => {
    const key = sourceIdToWarmingTablesKey(id)
    return key != null ? [key] : []
  })

export const warmingTablesToSourceIds = (tables: string[]) =>
  tables.flatMap((key) => {
    const id = warmingTablesKeyToSourceId(key)
    return id != null ? [id] : []
  })
