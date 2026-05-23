import type { SourceExportApiIdentifier } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/export/exportIdentifier'
import { exportApiIdentifier } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/export/exportIdentifier'
import { exportConfigs } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/exports/exports.const'
import { atlasGeneralizedPrefix } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/generalization/generalizationIdentifier'
import type { SourcesId } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/sources.const'
import {
  getCategoryData,
  getSourceData,
} from '@/components/regionen/pageRegionSlug/mapData/utils/getMapDataUtils'
import { staticRegion } from '@/data/regions.const'
import { getTopicDocByTableName } from '@/data/topicDocs/runtime'
import type { DocsPageRegion } from './types'

const exportTableSet = new Set<SourceExportApiIdentifier>(exportApiIdentifier)
const exportTitleByTableName = new Map(exportConfigs.map((config) => [config.id, config.title]))
const exportTableByNormalizedIdentifier = new Map(
  exportApiIdentifier.map((tableName) => [tableName.replaceAll('_', '').toLowerCase(), tableName]),
)
const tableNamesReferencedByRegionExports = new Set(
  staticRegion.flatMap((region) => region.exports ?? []),
)

const sourceTileLayerRegex = new RegExp(`${atlasGeneralizedPrefix}([a-z0-9_]+)`, 'g')

const getTableNamesForSourceId = (sourceId: SourcesId) => {
  const source = getSourceData(sourceId)
  const tableNames = new Set<SourceExportApiIdentifier>()

  for (const match of source.tiles.matchAll(sourceTileLayerRegex)) {
    const sourceLayerId = match[1]
    if (!sourceLayerId) continue
    const normalizedSourceLayerId = sourceLayerId.replaceAll('_', '').toLowerCase()
    const tableName = exportTableByNormalizedIdentifier.get(normalizedSourceLayerId)
    if (!tableName || !exportTableSet.has(tableName)) continue

    const isReferencedByAnyRegion = tableNamesReferencedByRegionExports.has(tableName)
    const hasTopicDoc = Boolean(getTopicDocByTableName(tableName))
    if (!isReferencedByAnyRegion && !hasTopicDoc) continue

    tableNames.add(tableName)
  }

  return Array.from(tableNames)
}

const getDatasetLabel = (tableName: SourceExportApiIdentifier) => {
  const topicDoc = getTopicDocByTableName(tableName)
  if (topicDoc?.title) return topicDoc.title
  return exportTitleByTableName.get(tableName) ?? tableName
}

export type RegionDatasetFromCategories = {
  tableName: SourceExportApiIdentifier
  label: string
  isDownloadable: boolean
}

export const deriveRegionDatasetsFromCategories = (
  region: NonNullable<DocsPageRegion>,
): RegionDatasetFromCategories[] => {
  const tableNames = new Set<SourceExportApiIdentifier>()

  region.categories.forEach((categoryId) => {
    const categoryData = getCategoryData(categoryId)
    categoryData.subcategories.forEach((subcategory) => {
      const mappedTableNames = getTableNamesForSourceId(subcategory.sourceId)
      mappedTableNames.forEach((tableName) => {
        tableNames.add(tableName)
      })
    })
  })

  const downloadableTables = region.exports ? new Set(region.exports) : new Set<string>()

  return Array.from(tableNames).map((tableName) => ({
    tableName,
    label: getDatasetLabel(tableName),
    isDownloadable: downloadableTables.has(tableName),
  }))
}
