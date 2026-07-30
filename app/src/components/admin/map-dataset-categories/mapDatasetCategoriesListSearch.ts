import type { MapDatasetCategoriesSearch } from '@/lib/mapDatasetCategoriesSearchSchema'

export function buildMapDatasetCategoriesListSearch(groupKey?: string): MapDatasetCategoriesSearch {
  const key = groupKey?.trim()
  if (!key) return { groupKey: undefined }
  return { groupKey: key }
}
