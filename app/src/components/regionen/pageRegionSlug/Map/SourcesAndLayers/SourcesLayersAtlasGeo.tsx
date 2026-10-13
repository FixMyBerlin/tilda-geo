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
import { useCurrentMode } from '@/components/regionen/pageRegionSlug/modes/useCurrentMode'
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
// 1. `beforeId` puts a layer below a layer of the basemap style, its position (see `layerPosition`).
//    https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/LayerSpecification/#beforeid
// 2. Layers that share a `beforeId` stack in mount order, the first one at the bottom.
// All layers are therefore rendered as one list, sorted by the order from /admin/layer-order.
// Source and Layers are two components, see <AllSources> and <AllLayers>.

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
  // Loaded by the region route before the map mounts. The layers have to mount in their final
  // order, so nothing renders without it.
  const { data: layerOrder } = useQuery(mapLayerOrderQueryOptions())
  // The Summieren mode shows the dataset that is summed with its own layers. A category on top
  // of it would show other data, or the same data a second time in another style.
  const { isCalculator } = useCurrentMode()

  if (!categoriesConfig?.length || !layerOrder) return null

  const layerEntries = buildAtlasLayerEntries({
    categoriesConfig,
    layerOrder,
    backgroundParam,
    debugLayerStyles,
    hidden: isCalculator,
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
