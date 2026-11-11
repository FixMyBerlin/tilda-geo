import { produce } from 'immer'
import type { MapDataCategoryConfig } from '../../../hooks/useQueryState/useCategoriesConfig/type'

// A region has one of the two Fahrradparken categories; both draw the table with parking and bike sharing.
const BICYCLE_PARKING_LAYERS = [
  'bicycleParking/bicycleParking',
  'radinfra_bicycleParking/radinfraBicycleParking',
]

// The map layers of the tables the space-finder-worker reads (space-finder-worker/scoring/postgis_loader.py).
// Factors without a normal map layer (Kreuzungen, Fußgängerzonen, Vegetation, Bewohnerbedarf, Hangneigung, Plätze) are not listed.
const SPACE_FINDER_FACTOR_LAYERS = {
  w_transit: ['poi/poiPlusPublicTransport', ...BICYCLE_PARKING_LAYERS],
  w_target: ['poi/poi'],
  w_bestand: BICYCLE_PARKING_LAYERS,
  w_cyclepath: ['bikelanes/bikelanes', 'bikelanes-minimal/bikelanes'],
  w_parken: ['parkingTilda/parkingTilda', 'parkingTilda/parkingTildaOffStreet'],
} satisfies Record<string, string[]>

export const spaceFinderWantedFactorLayers = (weights: Record<string, number>) => {
  const factorKeys = Object.entries(SPACE_FINDER_FACTOR_LAYERS)
    .filter(([weightKey]) => (weights[weightKey] ?? 0) > 0)
    .flatMap(([, layerKeys]) => layerKeys)

  return [...new Set(factorKeys)].sort()
}

const splitLayerKey = (key: string) => {
  const separatorIndex = key.indexOf('/')
  return { categoryId: key.slice(0, separatorIndex), subcategoryId: key.slice(separatorIndex + 1) }
}

// Structural type: passing the immer draft of the full subcategory type is too deep for tsc (TS2589).
const isSubcategoryOn = (subcategory: { styles: { id: string; active: boolean }[] }) =>
  subcategory.styles.some((style) => style.id !== 'hidden' && style.active)

/**
 * Switches on the layers in `wanted` and their categories. Nothing is ever switched off, and a
 * layer of a category the region does not have is skipped.
 */
export const activateSpaceFinderFactorLayers = ({
  categoriesConfig,
  wanted,
}: {
  categoriesConfig: MapDataCategoryConfig[]
  wanted: string[]
}) => {
  let changed = false

  const nextConfig = produce(categoriesConfig, (draft) => {
    for (const key of wanted) {
      const { categoryId, subcategoryId } = splitLayerKey(key)
      const category = draft.find((item) => item.id === categoryId)
      const subcategory = category?.subcategories.find((item) => item.id === subcategoryId)
      if (!category || !subcategory) continue

      if (!isSubcategoryOn(subcategory)) {
        for (const style of subcategory.styles) style.active = false
        const style =
          subcategory.styles.find(
            (item) => item.id === subcategory.defaultStyle && item.id !== 'hidden',
          ) ?? subcategory.styles.find((item) => item.id !== 'hidden')
        if (style) {
          style.active = true
          changed = true
        }
      }

      if (!category.active) {
        category.active = true
        changed = true
      }
    }
  })

  return { categoriesConfig: nextConfig, changed }
}
