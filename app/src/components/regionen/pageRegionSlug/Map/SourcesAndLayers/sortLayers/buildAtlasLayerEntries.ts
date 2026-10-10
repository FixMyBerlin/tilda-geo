import type { MapDataCategoryConfig } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/type'
import type { AtlasAppAnchorId } from '@/components/regionen/pageRegionSlug/mapData/types'
import { getSourceData } from '@/components/regionen/pageRegionSlug/mapData/utils/getMapDataUtils'
import {
  createLayerKeyAtlasGeo,
  createSourceKeyAtlasGeo,
} from '@/components/regionen/pageRegionSlug/utils/sourceKeyUtils/sourceKeyUtilsAtlasGeo'
import type { MapLayerOrderEntry } from '@/server/map-layer-order/queries/getMapLayerOrder.server'
import { AtlasAppAnchorIdSchema } from '@/server/map-layer-order/schemas'
import { getLayerHighlightId } from '../../utils/layerHighlight'
import { layerVisibility } from '../../utils/layerVisibility'
import {
  type AtlasStyleLayer,
  buildAtlasLayerProps,
  isAtlasStyleLayer,
} from '../utils/buildAtlasLayerProps'
import { sortByLayerOrder } from './sortByLayerOrder'

type Props = {
  categoriesConfig: MapDataCategoryConfig[]
  /** Rows of the MapLayerOrder table, bottom layer first. Empty: keep the config order. */
  layerOrder: MapLayerOrderEntry[]
  backgroundParam: string | undefined
  debugLayerStyles: boolean
}

/** The Atlas-Geo layers of a region in mount order, the bottom layer first. */
export function buildAtlasLayerEntries({
  categoriesConfig,
  layerOrder,
  backgroundParam,
  debugLayerStyles,
}: Props) {
  // An anchor id that is no longer part of the basemap style is ignored: maplibre does not add a
  // layer whose `beforeId` does not exist.
  const adminBeforeIds = new Map<string, AtlasAppAnchorId>()
  for (const { layerKey, beforeId } of layerOrder) {
    const anchor = AtlasAppAnchorIdSchema.safeParse(beforeId)
    if (anchor.success) adminBeforeIds.set(layerKey, anchor.data)
  }

  // A subcategory can be part of several categories of one region. The layer key has no category
  // id, so those are the same map layer: it mounts once and is visible when any of them is active.
  const layers = new Map<
    string,
    {
      layer: AtlasStyleLayer
      sourceKey: string
      subcategoryBeforeId: MapDataCategoryConfig['subcategories'][number]['beforeId']
      visible: boolean
    }
  >()
  for (const categoryConfig of categoriesConfig) {
    for (const subcategoryConfig of categoryConfig.subcategories) {
      const sourceData = getSourceData(subcategoryConfig.sourceId)
      const sourceKey = createSourceKeyAtlasGeo(
        categoryConfig.id,
        sourceData.id,
        subcategoryConfig.id,
      )
      for (const styleConfig of subcategoryConfig.styles) {
        const visible = categoryConfig.active && styleConfig.active
        for (const layer of styleConfig.layers?.filter(isAtlasStyleLayer) ?? []) {
          const layerId = createLayerKeyAtlasGeo(
            sourceData.id,
            subcategoryConfig.id,
            styleConfig.id,
            layer.id,
          )
          const known = layers.get(layerId)
          if (known) {
            known.visible ||= visible
            continue
          }
          layers.set(layerId, {
            layer,
            sourceKey,
            subcategoryBeforeId: subcategoryConfig.beforeId,
            visible,
          })
        }
      }
    }
  }

  const entries = Array.from(layers, ([layerId, { visible, ...layerConfig }]) => ({
    layerId,
    // All styles of a subcategory are mounted at once and reuse style layer ids like
    // "structure-icons", so the highlight id comes from the unique layer key.
    highlightLayerId: getLayerHighlightId(layerId),
    layerProps: buildAtlasLayerProps({
      ...layerConfig,
      layerId,
      visibility: layerVisibility(visible),
      debugLayerStyles,
      backgroundId: backgroundParam,
      adminBeforeId: adminBeforeIds.get(layerId),
    }),
  }))

  return sortByLayerOrder({
    items: entries,
    getKey: (entry) => entry.layerId,
    orderedKeys: layerOrder.map((entry) => entry.layerKey),
  })
}
