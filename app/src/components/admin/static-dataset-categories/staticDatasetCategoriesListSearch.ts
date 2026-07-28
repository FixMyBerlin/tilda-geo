import type { StaticDatasetCategoriesSearch } from '@/lib/staticDatasetCategoriesSearchSchema'

export function buildStaticDatasetCategoriesListSearch(
  groupKey?: string,
): StaticDatasetCategoriesSearch {
  const key = groupKey?.trim()
  if (!key) return { groupKey: undefined }
  return { groupKey: key }
}
