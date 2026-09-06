import type { MapDataCategoryParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/type'

type Subcategories = MapDataCategoryParam['subcategories']

// Old Beleuchtung had a separate `lit-completeness` checkbox next to roads `lit`.
// Merge that onto the roads completeness style, then drop the checkbox subcategory.
export function migrateLitCompletenessSubcategories(subcategories: Subcategories) {
  const completenessOn = subcategories.some(
    (subcategory) =>
      subcategory.id === 'lit-completeness' && subcategory.styles.some((style) => style.active),
  )

  return subcategories.flatMap((subcategory) => {
    if (subcategory.id === 'lit-completeness') return []
    if (subcategory.id !== 'lit' || !completenessOn) return [subcategory]

    const hasCompletenessStyle = subcategory.styles.some((style) => style.id === 'completeness')
    const styles = [
      ...subcategory.styles.map((style) => {
        if (style.id === 'completeness') return { id: style.id, active: true }
        if (style.id === 'hidden' || style.id === 'default' || style.id === 'lit') {
          return { id: style.id, active: false }
        }
        return { id: style.id, active: style.active }
      }),
      ...(hasCompletenessStyle ? [] : [{ id: 'completeness' as const, active: true }]),
    ]

    return [{ ...subcategory, styles }]
  })
}
