import { categories } from '@/components/regionen/pageRegionSlug/mapData/mapDataCategories/categories.const'
import { getSourceData } from '@/components/regionen/pageRegionSlug/mapData/utils/getMapDataUtils'
import { createLayerKeyAtlasGeo } from '@/components/regionen/pageRegionSlug/utils/sourceKeyUtils/sourceKeyUtilsAtlasGeo'
import { isAtlasStyleLayer } from '../utils/buildAtlasLayerProps'

// Enumerates every Atlas-Geo layer key that exists in code, across ALL categories
// (region-independent). This is the reference list for the admin layer-order UI and
// for detecting drift between code and the MapLayerOrder table.
// Keys are category-independent (source, subcategory, style, layer), so the same
// subcategory appearing in multiple categories yields one key — deduplicated here.
export function getAllAtlasLayerKeys() {
  const keys = new Set<string>()
  for (const category of categories) {
    for (const subcategory of category.subcategories) {
      const sourceData = getSourceData(subcategory.sourceId)
      for (const style of subcategory.styles) {
        for (const layer of (style.layers ?? []).filter(isAtlasStyleLayer)) {
          keys.add(createLayerKeyAtlasGeo(sourceData.id, subcategory.id, style.id, layer.id))
        }
      }
    }
  }
  return [...keys]
}
