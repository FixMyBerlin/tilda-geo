import db from '@/server/db.server'

export type StaticDatasetCategoryRow = {
  key: string
  sortOrder: number
  title: string
  subtitle: string | null
}

export async function loadStaticDatasetCategoryMap() {
  const rows = await db.staticDatasetCategory.findMany({
    select: { key: true, sortOrder: true, title: true, subtitle: true },
  })
  return new Map(rows.map((r) => [r.key, r]))
}

export function categoryPresentationForConfigCategory(
  configCategory: string | null | undefined,
  map: Map<string, StaticDatasetCategoryRow>,
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
