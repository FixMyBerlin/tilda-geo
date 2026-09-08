import { categories } from '@/components/regionen/pageRegionSlug/mapData/mapDataCategories/categories.const'
import { getSourceData } from '@/components/regionen/pageRegionSlug/mapData/utils/getMapDataUtils'
import { createLayerKeyAtlasGeo } from '@/components/regionen/pageRegionSlug/utils/sourceKeyUtils/sourceKeyUtilsAtlasGeo'
import { beforeId } from '../utils/beforeId'
import { isAtlasStyleLayer } from '../utils/buildAtlasLayerProps'

// Enumerates every Atlas-Geo layer key that exists in code, across ALL categories
// (region-independent). This is the reference list for the admin layer-order UI and
// for detecting drift between code and the MapLayerOrder table.
// Keys are category-independent (source, subcategory, style, layer), so the same
// subcategory appearing in multiple categories yields one key — deduplicated here.
// `defaultBeforeId` is the anchor the layer gets on the default background without an admin
// override — same precedence as buildAtlasLayerProps (layer > subcategory > type default).
// `defaultBeforeIdSource` says which of the three supplied it, so the admin UI can explain it.
type AtlasLayerEntry = {
  layerKey: string
  layerType: string
  defaultBeforeId: string | undefined
  defaultBeforeIdSource: 'layer' | 'subcategory' | 'layerType'
}

export function getAllAtlasLayerEntries() {
  const seen = new Set<string>()
  const entries: AtlasLayerEntry[] = []
  for (const category of categories) {
    for (const subcategory of category.subcategories) {
      const sourceData = getSourceData(subcategory.sourceId)
      for (const style of subcategory.styles) {
        for (const layer of (style.layers ?? []).filter(isAtlasStyleLayer)) {
          const layerKey = createLayerKeyAtlasGeo(sourceData.id, subcategory.id, style.id, layer.id)
          if (seen.has(layerKey)) continue
          seen.add(layerKey)
          const defaultBeforeId =
            layer.beforeId ??
            beforeId({
              backgroundId: 'default',
              subcategoryBeforeId: subcategory.beforeId,
              layerType: layer.type,
            })
          const defaultBeforeIdSource = layer.beforeId
            ? 'layer'
            : subcategory.beforeId
              ? 'subcategory'
              : 'layerType'
          entries.push({ layerKey, layerType: layer.type, defaultBeforeId, defaultBeforeIdSource })
        }
      }
    }
  }
  return entries
}

export function getAllAtlasLayerKeys() {
  return getAllAtlasLayerEntries().map((e) => e.layerKey)
}
