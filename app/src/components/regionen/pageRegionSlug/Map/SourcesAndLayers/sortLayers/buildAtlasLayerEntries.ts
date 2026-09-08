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
import { buildAtlasLayerProps, isAtlasStyleLayer } from '../utils/buildAtlasLayerProps'
import { sortByLayerOrder } from './sortByLayerOrder'

export function buildAtlasLayerEntries({
  categoriesConfig,
  dbLayerOrder,
  backgroundParam,
  debugLayerStyles,
}: {
  categoriesConfig: MapDataCategoryConfig[]
  dbLayerOrder: MapLayerOrderEntry[] | undefined
  backgroundParam: string | undefined
  debugLayerStyles: boolean
}) {
  // DB order when the table has rows; otherwise [] so sortByLayerOrder keeps JSX config order.
  // NOTE: A changed DB order applies on the next page load — layers are deliberately
  // not remounted mid-session (staleTime: Infinity).
  const orderedKeys = dbLayerOrder?.length ? dbLayerOrder.map((e) => e.layerKey) : []
  // Anchor overrides only apply on the default background (custom raster backgrounds put
  // all data on top), so skip building them otherwise. Unknown anchor ids (e.g. renamed
  // in the style after being saved) are dropped — maplibre would silently not add such layers.
  const beforeIdOverrides = new Map<string, AtlasAppAnchorId>(
    backgroundParam === 'default'
      ? (dbLayerOrder ?? []).flatMap((e) => {
          const anchor = AtlasAppAnchorIdSchema.safeParse(e.beforeId)
          return anchor.success ? [[e.layerKey, anchor.data] as const] : []
        })
      : [],
  )

  const layerEntries = categoriesConfig.flatMap((categoryConfig) => {
    return categoryConfig.subcategories.flatMap((subcategoryConfig) => {
      const sourceData = getSourceData(subcategoryConfig?.sourceId)
      const sourceKey = createSourceKeyAtlasGeo(
        categoryConfig.id,
        sourceData.id,
        subcategoryConfig.id,
      )

      return subcategoryConfig.styles.flatMap((styleConfig) => {
        const visibility = layerVisibility((categoryConfig.active && styleConfig.active) || false)
        const supportedLayers = styleConfig?.layers?.filter(isAtlasStyleLayer) ?? []
        return supportedLayers.map((layer) => {
          const layerId = createLayerKeyAtlasGeo(
            sourceData.id,
            subcategoryConfig.id,
            styleConfig.id,
            layer.id,
          )
          const layerProps = buildAtlasLayerProps({
            layer,
            layerId,
            sourceKey,
            visibility,
            debugLayerStyles,
            backgroundId: backgroundParam,
            subcategoryBeforeId: subcategoryConfig.beforeId,
            adminBeforeId: beforeIdOverrides.get(layerId),
          })
          // Derive from the unique atlas key, not the raw style layer id: several styles of one
          // subcategory reuse raw ids (e.g. "structure-icons"), and all styles are mounted at once.
          // A shared highlight id would make the last-rendered <LayerHighlight> own the map layer
          // and drive its visibility/filter for the wrong style.
          return { layerId, highlightLayerId: getLayerHighlightId(layerId), layerProps }
        })
      })
    })
  })

  // The same subcategory can appear in several categories of one region.
  // createLayerKeyAtlasGeo contains no category id, so first occurrence wins
  // (avoids duplicate React keys and duplicate maplibre addLayer calls).
  const seenLayerIds = new Set<string>()
  const uniqueLayerEntries = layerEntries.filter((entry) => {
    if (seenLayerIds.has(entry.layerId)) return false
    seenLayerIds.add(entry.layerId)
    return true
  })

  return sortByLayerOrder({
    items: uniqueLayerEntries,
    getKey: (entry) => entry.layerId,
    orderedKeys,
  })
}
