import type { MapDataCategoryConfig } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/type'

export const getActiveRadinfraCampaignStyleId = (categoriesConfig: MapDataCategoryConfig[]) => {
  const campaignsCategory = categoriesConfig.find(
    (category) => category.id === 'radinfra_campagins' && category.active,
  )
  if (!campaignsCategory) return undefined

  const campaignsSubcategory = campaignsCategory.subcategories.find(
    (subcategory) => subcategory.id === 'campaigns',
  )

  return campaignsSubcategory?.styles.find((style) => style.active)?.id
}
