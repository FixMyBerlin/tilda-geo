import invariant from 'tiny-invariant'
import type { RegionDataset } from '@/server/uploads/queries/getUploadsForRegion.server'
import { categories } from '../mapDataCategories/categories.const'
import type { MapDataCategoryId } from '../mapDataCategories/MapDataCategoryId'
import type { SourcesId } from '../mapDataSources/sources.const'
import { sources } from '../mapDataSources/sources.const'

export const getCategoryData = (categoryId: MapDataCategoryId | undefined) => {
  const categoryData = categories.find((the) => the.id === categoryId)
  invariant(categoryData, `getCategoryData: category data for ${categoryId} missing`)
  return categoryData
}

export const getSourceData = (sourceId: SourcesId) => {
  const sourceData = sources?.find((s) => s.id === sourceId)
  invariant(sourceData, `getSourceData: sourceData for ${sourceId} missing`)
  return sourceData
}

export const getDatasetOrSourceData = (
  sourceId: SourcesId | string, // string = StaticDatasetsIds
  sourcesDatasets: RegionDataset[],
) => {
  const sourceData = sources?.find((s) => s.id === sourceId)
  const datasetData = sourcesDatasets.find((s) => s.id === sourceId)
  return sourceData || datasetData
}
