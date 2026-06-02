import type { FilterRowItem } from '@/components/shared/FilterRow/types'

type CategoryWithGroup = { groupKey: string }

export function buildStaticDatasetCategoryFilterItems(
  categories: CategoryWithGroup[],
): FilterRowItem[] {
  const counts = new Map<string, number>()
  for (const category of categories) {
    counts.set(category.groupKey, (counts.get(category.groupKey) ?? 0) + 1)
  }

  const groupKeys = [...counts.keys()].sort((a, b) => a.localeCompare(b))

  return [
    { id: '', label: 'Alle', count: categories.length },
    ...groupKeys.map((groupKey) => ({
      id: groupKey,
      label: groupKey,
      count: counts.get(groupKey),
    })),
  ]
}
