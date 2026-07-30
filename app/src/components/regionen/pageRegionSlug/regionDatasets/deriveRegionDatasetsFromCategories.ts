import type { MapDataCategoryId } from '@/components/regionen/pageRegionSlug/mapData/mapDataCategories/MapDataCategoryId'
import type { SourceExportApiIdentifier } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/export/exportIdentifier'
import { exportApiIdentifier } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/export/exportIdentifier'
import { exportConfigs } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/exports/exports.const'
import type { ExportId } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/exports/exports.const'
import type { SourcesId } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/sources.const'
import type { TableId } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/tables.const'
import { hasExplicitTilesUrl } from '@/components/regionen/pageRegionSlug/mapData/types'
import {
  getCategoryData,
  getSourceData,
} from '@/components/regionen/pageRegionSlug/mapData/utils/getMapDataUtils'
import { getTopicDocByTableName } from '@/data/topicDocs/runtime'

export type RegionForDatasetDerivation = {
  categories: MapDataCategoryId[]
  exports: null | [ExportId, ...ExportId[]]
}

const exportTableSet = new Set<SourceExportApiIdentifier>(exportApiIdentifier)
const exportTitleByTableName = new Map(exportConfigs.map((config) => [config.id, config.title]))

const isExportTableName = (tableId: TableId): tableId is SourceExportApiIdentifier =>
  exportTableSet.has(tableId as SourceExportApiIdentifier)

const getTableNamesForSourceId = (
  sourceId: SourcesId,
  tableNamesReferencedByRegionExports: Set<string>,
) => {
  const source = getSourceData(sourceId)
  if (hasExplicitTilesUrl(source)) return []

  const tableNames = new Set<SourceExportApiIdentifier>()

  for (const tableId of source.tileTables) {
    if (!isExportTableName(tableId)) continue

    const isReferencedByAnyRegion = tableNamesReferencedByRegionExports.has(tableId)
    const hasTopicDoc = Boolean(getTopicDocByTableName(tableId))
    if (!isReferencedByAnyRegion && !hasTopicDoc) continue

    tableNames.add(tableId)
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
  region: RegionForDatasetDerivation,
  allRegionExportTables: Iterable<string> = exportApiIdentifier,
): RegionDatasetFromCategories[] => {
  const tableNamesReferencedByRegionExports = new Set(allRegionExportTables)
  const tableNames = new Set<SourceExportApiIdentifier>()

  region.categories.forEach((categoryId) => {
    const categoryData = getCategoryData(categoryId)
    categoryData.subcategories.forEach((subcategory) => {
      const mappedTableNames = getTableNamesForSourceId(
        subcategory.sourceId,
        tableNamesReferencedByRegionExports,
      )
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

const allExportIds = exportConfigs.map((config) => config.id)

export const getExportIdsOrderedByRegionCategories = (
  categories: MapDataCategoryId[],
  catalogExportIds: readonly ExportId[] = allExportIds,
  allRegionExportTables: Iterable<string> = exportApiIdentifier,
) => {
  const orderedFromCategories = deriveRegionDatasetsFromCategories(
    { categories, exports: null },
    allRegionExportTables,
  ).map((dataset) => dataset.tableName)

  const orderedSet = new Set(orderedFromCategories)
  const remainder = catalogExportIds.filter((exportId) => !orderedSet.has(exportId))

  return [...orderedFromCategories, ...remainder]
}
