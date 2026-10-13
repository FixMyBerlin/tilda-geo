import type { MapDataCategoryConfig } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/type'
import { getSourceData } from '@/components/regionen/pageRegionSlug/mapData/utils/getMapDataUtils'
import {
  createLayerKeyAtlasGeo,
  createSourceKeyAtlasGeo,
} from '@/components/regionen/pageRegionSlug/utils/sourceKeyUtils/sourceKeyUtilsAtlasGeo'
import type { MapLayerOrderEntry } from '@/server/map-layer-order/queries/getMapLayerOrder.server'
import { LayerPositionSchema } from '@/server/map-layer-order/schemas'
import { getLayerHighlightId } from '../../utils/layerHighlight'
import { layerVisibility } from '../../utils/layerVisibility'
import { type LayerPosition, layerPosition, layerPositionRank } from '../utils/beforeId'
import {
  type AtlasStyleLayer,
  buildAtlasLayerProps,
  isAtlasStyleLayer,
} from '../utils/buildAtlasLayerProps'

type Props = {
  categoriesConfig: MapDataCategoryConfig[]
  /** The rows of the MapLayerOrder table, the bottom layer first. */
  layerOrder: MapLayerOrderEntry[]
  backgroundParam: string | undefined
  debugLayerStyles: boolean
  /** Hides every layer, whatever the config says: a mode shows its own data instead. */
  hidden?: boolean
}

/** The Atlas-Geo layers of a region in mount order, the bottom layer first. */
export function buildAtlasLayerEntries({
  categoriesConfig,
  layerOrder,
  backgroundParam,
  debugLayerStyles,
  hidden = false,
}: Props) {
  // A position that is no longer a layer of the basemap style is ignored: maplibre does not add a
  // layer whose `beforeId` does not exist.
  const adminBeforeIds = new Map<string, LayerPosition>()
  for (const { layerKey, beforeId } of layerOrder) {
    const position = LayerPositionSchema.safeParse(beforeId)
    if (position.success) adminBeforeIds.set(layerKey, position.data)
  }

  // A subcategory can be part of several categories of one region. The layer key has no category
  // id, so those are the same map layer: it mounts once and is visible when any of them is active.
  const layers = new Map<
    string,
    {
      layer: AtlasStyleLayer
      sourceKey: string
      position: LayerPosition
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
        const visible = !hidden && categoryConfig.active && styleConfig.active
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
            position: layerPosition({
              layer,
              subcategoryBeforeId: subcategoryConfig.beforeId,
              adminBeforeId: adminBeforeIds.get(layerId),
            }),
            visible,
          })
        }
      }
    }
  }

  const entries = Array.from(layers, ([layerId, { visible, ...layerConfig }]) => ({
    layerId,
    position: layerConfig.position,
    // All styles of a subcategory are mounted at once and reuse style layer ids like
    // "structure-icons", so the highlight id comes from the unique layer key.
    highlightLayerId: getLayerHighlightId(layerId),
    layerProps: buildAtlasLayerProps({
      ...layerConfig,
      layerId,
      visibility: layerVisibility(visible),
      debugLayerStyles,
      backgroundId: backgroundParam,
    }),
  }))

  const savedPosition = new Map(layerOrder.map((entry, index) => [entry.layerKey, index]))
  const sortKey = (entry: (typeof entries)[number]) => {
    const position = savedPosition.get(entry.layerId)
    if (position === undefined) {
      // The server gives every layer of the code a row when it starts, see `getMapLayerOrder`.
      throw new Error(
        `Map layer order: no entry for layer "${entry.layerId}". Restart the app server; that fills the table again.`,
      )
    }
    // Layers of a lower position mount first. On the default background each position has its
    // own `beforeId`. On a raster background the lower positions share one `beforeId` (see
    // `beforeIdOnBackground`) and with this stack like on the default background.
    return [layerPositionRank(entry.position), position] as const
  }
  return entries
    .map((entry) => ({ entry, key: sortKey(entry) }))
    .sort((a, b) => a.key[0] - b.key[0] || a.key[1] - b.key[1])
    .map(({ entry }) => entry)
}
