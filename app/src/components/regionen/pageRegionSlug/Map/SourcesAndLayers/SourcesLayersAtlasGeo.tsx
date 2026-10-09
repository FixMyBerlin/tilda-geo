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

// We add source+layer map-components for all categories and all subcategories of the given config.
// We then toggle the visibility of the layer base on the URL state (config).
// We also use this visbility to add/remove interactive layers.
//
// Layer order:
// 1. `beforeId` puts a layer below an anchor layer of the basemap style.
//    https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/LayerSpecification/#beforeid
// 2. Layers that share a `beforeId` stack in mount order, the first one at the bottom. The same
//    holds for layers without a `beforeId` (raster backgrounds), which sit on top of the style.
// All layers are therefore rendered as one list, apart from their Sources, sorted by the order
// from /admin/layer-order.
//
// Performance Note:
// Maplibre GL JS will only create network request for sources that are used by a visible layer.
// But, it will create them again, when the source was unmounted.
// TODO / BUG: But, we still see network requests when we toggle the visibility like we do here. Which is fine for now, due to browser caching.

const SourcesAtlasGeo = () => {
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

const LayersAtlasGeo = () => {
  const debugLayerStyles = useMapDebugDebugLayerStyles()
  const { categoriesConfig } = useCategoriesConfig()
  const { backgroundParam } = useBackgroundParam()
  // Loaded by the region route before the map mounts. The layers have to mount in their final
  // order, so nothing renders without it.
  const { data: layerOrder } = useQuery(mapLayerOrderQueryOptions())

  if (!categoriesConfig?.length || !layerOrder) return null

  const layerEntries = buildAtlasLayerEntries({
    categoriesConfig,
    layerOrder,
    backgroundParam,
    debugLayerStyles,
  })

  return (
    <>
      {layerEntries.map(({ layerId, layerProps }) => (
        <Layer key={layerId} {...layerProps} />
      ))}
      {/* All highlights mount after all layers: a highlight is never covered by another layer with the same beforeId. */}
      {layerEntries.map(({ highlightLayerId, layerProps }) => (
        <LayerHighlight key={highlightLayerId} {...layerProps} id={highlightLayerId} />
      ))}
    </>
  )
}

export const SourcesLayersAtlasGeo = () => {
  return (
    <>
      <SourcesAtlasGeo />
      <LayersAtlasGeo />
    </>
  )
}
