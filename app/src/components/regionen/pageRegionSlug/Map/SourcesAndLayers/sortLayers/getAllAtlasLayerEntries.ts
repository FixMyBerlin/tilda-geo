import { categories } from '@/components/regionen/pageRegionSlug/mapData/mapDataCategories/categories.const'
import { getSourceData } from '@/components/regionen/pageRegionSlug/mapData/utils/getMapDataUtils'
import { createLayerKeyAtlasGeo } from '@/components/regionen/pageRegionSlug/utils/sourceKeyUtils/sourceKeyUtilsAtlasGeo'
import { type LayerPosition, layerPosition } from '../utils/beforeId'
import { isAtlasStyleLayer } from '../utils/buildAtlasLayerProps'

/**
 * Every Atlas-Geo layer that exists in code, across all categories, in config order. The list
 * that /admin/layer-order sorts. A layer key has no category id, so a subcategory that is part of
 * several categories is listed once, with all its categories.
 */
export function getAllAtlasLayerEntries() {
  const entries = new Map<
    string,
    {
      layerKey: string
      layerId: string
      layerType: string
      categoryNames: string[]
      subcategoryName: string
      styleName: string
      /** The position from the config. */
      defaultBeforeId: LayerPosition
    }
  >()
  for (const category of categories) {
    for (const subcategory of category.subcategories) {
      const sourceData = getSourceData(subcategory.sourceId)
      for (const style of subcategory.styles) {
        for (const layer of style.layers?.filter(isAtlasStyleLayer) ?? []) {
          const layerKey = createLayerKeyAtlasGeo(sourceData.id, subcategory.id, style.id, layer.id)
          const known = entries.get(layerKey)
          if (known) {
            known.categoryNames.push(category.name)
            continue
          }
          const defaultBeforeId = layerPosition({
            layer,
            subcategoryBeforeId: subcategory.beforeId,
          })
          entries.set(layerKey, {
            layerKey,
            layerId: layer.id,
            layerType: layer.type,
            categoryNames: [category.name],
            subcategoryName: subcategory.name,
            styleName: style.name,
            defaultBeforeId,
          })
        }
      }
    }
  }
  return [...entries.values()]
}

export type AtlasLayerEntry = ReturnType<typeof getAllAtlasLayerEntries>[number]
