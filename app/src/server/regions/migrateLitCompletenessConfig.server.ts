import type { MapDataCategoryParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/type'

function hasOldLitConfig(category: MapDataCategoryParam) {
  return category.subcategories.some(
    (subcategory) =>
      subcategory.id === 'lit-completeness' ||
      subcategory.styles.some((style) => style.id !== 'default'),
  )
}

// Old Beleuchtung URLs used dropdown styles (`hidden` / `default` / `lit` / `completeness`)
// and/or a `lit-completeness` checkbox. Do not preserve those choices: turn the category on
// and drop subcategory state so merge applies current defaults (all dataset checkboxes on).
export function migrateOldLitCategory(category: MapDataCategoryParam) {
  if (category.id !== 'lit' || !hasOldLitConfig(category)) return category

  return { ...category, active: true, subcategories: [] }
}
