import { useQuery } from '@tanstack/react-query'
import { Fragment } from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'
import {
  useMapDebugDebugLayerStyles,
  useMapDebugUseDebugCachelessTiles,
} from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapDebugState'
import { useBackgroundParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useBackgroundParam'
import { useCategoriesConfig } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/useCategoriesConfig'
import { getMapDataSourceTilesUrl } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/getMapDataSourceTilesUrl'
import {
  ATLAS_APP_ANCHOR_IDS,
  type AtlasAppAnchorId,
} from '@/components/regionen/pageRegionSlug/mapData/types'
import { getSourceData } from '@/components/regionen/pageRegionSlug/mapData/utils/getMapDataUtils'
import {
  createLayerKeyAtlasGeo,
  createSourceKeyAtlasGeo,
} from '@/components/regionen/pageRegionSlug/utils/sourceKeyUtils/sourceKeyUtilsAtlasGeo'
import { getCachelessTilesUrl } from '@/components/shared/utils/getCachelessTilesUrl'
import { mapLayerOrderQueryOptions } from '@/server/map-layer-order/mapLayerOrderQueryOptions'
import { getLayerHighlightId } from '../utils/layerHighlight'
import { layerVisibility } from '../utils/layerVisibility'
import { LayerHighlight } from './LayerHighlight'
import { atlasLayerOrder } from './sortLayers/atlasLayerOrder.const'
import { sortByLayerOrder } from './sortLayers/sortByLayerOrder'
import { buildAtlasLayerProps, isAtlasStyleLayer } from './utils/buildAtlasLayerProps'

// Sources and Layers are rendered by two separate components (via <AllSources> / <AllLayers>)
// so all Layers of the map form one flat, sortable list independent of their Source.
// See LAYER_SORTING_REQUIREMENTS.md.
//
// We add map-components for all categories and all subcategories of the given config.
// We then toggle the visibility of the layer based on the URL state (config) — layers are
// never unmounted on toggle, which keeps the mount order (= order within a beforeId group) stable.
// We also use this visibility to add/remove interactive layers.
//
// Performance Note:
// Maplibre GL JS will only create network request for sources that are used by a visible layer.
// But, it will create them again, when the source was unmounted.
// TODO / BUG: But, we still see network requests when we toggle the visibility like we do here. Which is fine for now, due to browser caching.

export const SourcesAtlasGeo = () => {
  const useDebugCachelessTiles = useMapDebugUseDebugCachelessTiles()
  const { categoriesConfig } = useCategoriesConfig()

  if (!categoriesConfig?.length) return null

  return (
    <>
      {categoriesConfig.map((categoryConfig) => {
        return (
          <Fragment key={categoryConfig.id}>
            {categoryConfig.subcategories.map((subcategoryConfig) => {
              const sourceData = getSourceData(subcategoryConfig?.sourceId)

              // One source can be used by multiple subcategories, so we need to make the key source-category-specific.
              const sourceKey = createSourceKeyAtlasGeo(
                categoryConfig.id,
                sourceData.id,
                subcategoryConfig.id,
              )

              const tileUrl = getCachelessTilesUrl({
                url: getMapDataSourceTilesUrl(sourceData),
                cacheless: useDebugCachelessTiles,
              })

              return (
                <Source
                  id={sourceKey}
                  key={sourceKey}
                  type="vector"
                  tiles={[tileUrl]}
                  promoteId={sourceData.promoteId}
                  maxzoom={sourceData.maxzoom}
                  minzoom={sourceData.minzoom}
                />
              )
            })}
          </Fragment>
        )
      })}
    </>
  )
}

export const LayersAtlasGeo = () => {
  const debugLayerStyles = useMapDebugDebugLayerStyles()
  const { categoriesConfig } = useCategoriesConfig()
  const { backgroundParam } = useBackgroundParam()
  // Admin-managed global order (see /admin/layer-order). Layers must mount ONCE in their
  // final order (mount order = order within a beforeId group), so we wait for this query
  // before rendering any layer. On error we fall back to the code default below.
  const { data: dbLayerOrder, isPending: layerOrderPending } = useQuery(mapLayerOrderQueryOptions())

  if (!categoriesConfig?.length) return null
  if (layerOrderPending) return null

  // DB order wins when present; the (currently empty) code list is the fallback.
  // NOTE: A changed DB order applies on the next page load — layers are deliberately
  // not remounted mid-session (staleTime: Infinity).
  const orderedKeys = dbLayerOrder?.length ? dbLayerOrder.map((e) => e.layerKey) : atlasLayerOrder
  // Anchor overrides only apply on the default background (custom raster backgrounds put
  // all data on top), so skip building them otherwise. Unknown anchor ids (e.g. renamed
  // in the style after being saved) are dropped — maplibre would silently not add such layers.
  const isKnownAnchor = (value: string | null): value is AtlasAppAnchorId =>
    (ATLAS_APP_ANCHOR_IDS as readonly string[]).includes(value ?? '')
  const beforeIdOverrides = new Map<string, AtlasAppAnchorId>(
    backgroundParam === 'default'
      ? (dbLayerOrder ?? [])
          .filter((e) => isKnownAnchor(e.beforeId))
          .map((e) => [e.layerKey, e.beforeId as AtlasAppAnchorId])
      : [],
  )

  // Collect all layers of all categories/subcategories/styles into one flat list…
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
          return { layerId, highlightLayerId: getLayerHighlightId(layer.id), layerProps }
        })
      })
    })
  })

  // …then sort by the global order list (bottom-first) so the render order — and with it the
  // order within each beforeId group — matches the configured order.
  const sortedLayerEntries = sortByLayerOrder({
    items: layerEntries,
    getKey: (entry) => entry.layerId,
    orderedKeys,
  })

  return (
    <>
      {sortedLayerEntries.map(({ layerId, highlightLayerId, layerProps }) => {
        return (
          <Fragment key={layerId}>
            <Layer key={layerId} {...layerProps} />
            <LayerHighlight key={highlightLayerId} {...layerProps} id={highlightLayerId} />
          </Fragment>
        )
      })}
    </>
  )
}
