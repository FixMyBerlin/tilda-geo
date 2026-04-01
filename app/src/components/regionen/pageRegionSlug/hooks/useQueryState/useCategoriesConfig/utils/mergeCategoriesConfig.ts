import { produce } from 'immer'
import type { MapDataCategoryConfig, MapDataCategoryParam } from '../type'

type Props = {
  freshConfig: MapDataCategoryConfig[]
  urlConfig: MapDataCategoryParam[] | undefined
}

/**
 * @desc Use once to initialize the mapRegionConfig. Receives the config from URL and a fresh config from the current system. The fresh config is updated based on the information from the URL (when possible). Options from the URL that cannot be found in the fresh config, are dropped and fresh config defaults apply.
 * - If something was added since the URL was created, the options are added with new defaults
 * - If something was renamed since the URL was created, the options are ignored
 * - If the options stayed the same, the URL active states are preserved
 */
export const mergeCategoriesConfig = ({ freshConfig, urlConfig }: Props) => {
  // Case: Initial page render without an `urlConfig`. We set the first category as active.
  if (!urlConfig) {
    return produce(freshConfig, (old) => {
      // TODO: We should change this to activate `bikelanes` instead of the first (and have a fallback to first)
      const first = old?.[0]
      if (first) first.active = true
    })
  }

  const mergedConfig = freshConfig.map((categoryConfig) => {
    const urlConfigCategory = urlConfig?.find((t) => t?.id === categoryConfig.id)

    return {
      ...categoryConfig,
      active: urlConfigCategory?.active || categoryConfig.active,
      subcategories: categoryConfig.subcategories.map((subcategoryConfig) => {
        const urlConfigSubcat = urlConfigCategory?.subcategories?.find(
          (t) => t?.id === subcategoryConfig.id,
        )

        return {
          ...subcategoryConfig,
          styles: subcategoryConfig.styles.map((styleConfig) => {
            const urlConfigSubcatStyle = urlConfigSubcat?.styles?.find(
              (s) => s.id === styleConfig.id,
            )

            return {
              ...styleConfig,
              active: urlConfigSubcatStyle ? urlConfigSubcatStyle.active : styleConfig.active,
            }
          }),
        }
      }),
    }
  })

  return mergedConfig satisfies MapDataCategoryConfig[]
}
