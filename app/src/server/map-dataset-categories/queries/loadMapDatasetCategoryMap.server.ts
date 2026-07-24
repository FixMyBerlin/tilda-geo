import db from '@/server/db.server'

export type MapDatasetCategoryRow = {
  key: string
  sortOrder: number
  title: string
  subtitle: string | null
}

export async function loadMapDatasetCategoryMap() {
  const rows = await db.mapDatasetCategory.findMany({
    select: { key: true, sortOrder: true, title: true, subtitle: true },
  })
  return new Map(rows.map((r) => [r.key, r]))
}

export function categoryPresentationForConfigCategory(
  configCategory: string | null | undefined,
  map: Map<string, MapDatasetCategoryRow>,
) {
  if (!configCategory || configCategory === '') {
    return {
      categorySortOrder: 1_000_000_000,
      categoryTitle: 'Statische Daten',
      categorySubtitle: null as string | null,
    }
  }
  const row = map.get(configCategory)
  if (!row) {
    return {
      categorySortOrder: 1_000_000_000,
      categoryTitle: configCategory,
      categorySubtitle: null as string | null,
    }
  }
  return {
    categorySortOrder: row.sortOrder,
    categoryTitle: row.title,
    categorySubtitle: row.subtitle ?? null,
  }
}
