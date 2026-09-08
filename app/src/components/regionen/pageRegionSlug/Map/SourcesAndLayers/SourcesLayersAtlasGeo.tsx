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
import { getSourceData } from '@/components/regionen/pageRegionSlug/mapData/utils/getMapDataUtils'
import { createSourceKeyAtlasGeo } from '@/components/regionen/pageRegionSlug/utils/sourceKeyUtils/sourceKeyUtilsAtlasGeo'
import { getCachelessTilesUrl } from '@/components/shared/utils/getCachelessTilesUrl'
import { mapLayerOrderQueryOptions } from '@/server/map-layer-order/mapLayerOrderQueryOptions'
import { LayerHighlight } from './LayerHighlight'
import { buildAtlasLayerEntries } from './sortLayers/buildAtlasLayerEntries'

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
  // Admin-managed global order (see /admin/layer-order). Wait for this query so the first
  // mount is already sorted (mount order = order within a beforeId group).
  const { data: dbLayerOrder, isPending: layerOrderPending } = useQuery(mapLayerOrderQueryOptions())

  if (!categoriesConfig?.length) return null
  if (layerOrderPending) return null

  const sortedLayerEntries = buildAtlasLayerEntries({
    categoriesConfig,
    dbLayerOrder,
    backgroundParam,
    debugLayerStyles,
  })

  return (
    <>
      {/* Highlights after all base layers so a highlighted feature is never covered by a sibling base layer of the same beforeId group (matches the pre-DB-order behaviour). */}
      {sortedLayerEntries.map(({ layerId, layerProps }) => (
        <Layer key={layerId} {...layerProps} />
      ))}
      {sortedLayerEntries.map(({ highlightLayerId, layerProps }) => (
        <LayerHighlight key={highlightLayerId} {...layerProps} id={highlightLayerId} />
      ))}
    </>
  )
}
