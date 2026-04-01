import type { MapDataCategoryId } from '../../../mapData/mapDataCategories/MapDataCategoryId'
import { getCategoryData } from '../../../mapData/utils/getMapDataUtils'
import type { MapDataCategoryConfig } from './type'

/**
 * @desc The blueprint of our main state object. Our region references the categories by ID. This helper creates an array of categories and add the right default `active` flags to it.
 */
export const createFreshCategoriesConfig = (regionCategoryIds: MapDataCategoryId[]) => {
  // We want to preserve the sort order of `regionCategoryIds`.
  const sortedCategoryData = regionCategoryIds.map((id) => getCategoryData(id))

  const config = sortedCategoryData.map((categoryData) => {
    return {
      ...categoryData,
      active: false,
      subcategories: categoryData.subcategories.map((subcategoryData) => {
        return {
          ...subcategoryData,
          styles: subcategoryData.styles.map((style) => {
            return {
              ...style,
              active: style.id === subcategoryData.defaultStyle,
            }
          }),
        }
      }),
    }
  })

  return config satisfies MapDataCategoryConfig[]
}
