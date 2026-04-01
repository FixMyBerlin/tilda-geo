import type {
  MapDataCategoryConfig,
  MapDataSubcategoryConfig,
} from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/type'

export const flattenSubcategories = (categoryConfigs: MapDataCategoryConfig[]) => {
  const subcategoryConfigConfigs: MapDataSubcategoryConfig[] = []

  for (const categoryConfig of categoryConfigs) {
    for (const subcategoryConfigConfig of categoryConfig.subcategories) {
      // What we get here as `subcategoryConfigConfig` is the `id`+`active`
      // object from src/regionen/[regionSlug]/_components/mapStateConfig/type.ts
      if (!subcategoryConfigConfigs.some((t) => t.id === subcategoryConfigConfig.id)) {
        subcategoryConfigConfigs.push(subcategoryConfigConfig)
      }
    }
  }
  return subcategoryConfigConfigs
}
