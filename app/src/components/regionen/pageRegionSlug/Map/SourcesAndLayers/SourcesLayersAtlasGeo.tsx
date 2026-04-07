import { Fragment } from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'
import {
  useMapDebugDebugLayerStyles,
  useMapDebugUseDebugCachelessTiles,
} from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapDebugState'
import { useBackgroundParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useBackgroundParam'
import { useCategoriesConfig } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/useCategoriesConfig'
import { getSourceData } from '@/components/regionen/pageRegionSlug/mapData/utils/getMapDataUtils'
import {
  createLayerKeyAtlasGeo,
  createSourceKeyAtlasGeo,
} from '@/components/regionen/pageRegionSlug/utils/sourceKeyUtils/sourceKeyUtilsAtlasGeo'
import { getCachelessTilesUrl } from '@/components/shared/utils/getCachelessTilesUrl'
import { getLayerHighlightId } from '../utils/layerHighlight'
import { layerVisibility } from '../utils/layerVisibility'
import { LayerHighlight } from './LayerHighlight'
import { buildAtlasLayerProps, isAtlasStyleLayer } from './utils/buildAtlasLayerProps'

// We add source+layer map-components for all categories and all subcategories of the given config.
// We then toggle the visibility of the layer base on the URL state (config).
// We also use this visbility to add/remove interactive layers.
//
// Performance Note:
// Maplibre GL JS will only create network request for sources that are used by a visible layer.
// But, it will create them again, when the source was unmounted.
// TODO / BUG: But, we still see network requests when we toggle the visibility like we do here. Which is fine for now, due to browser caching.

export const SourcesLayersAtlasGeo = () => {
  const debugLayerStyles = useMapDebugDebugLayerStyles()
  const useDebugCachelessTiles = useMapDebugUseDebugCachelessTiles()
  const { categoriesConfig } = useCategoriesConfig()
  const { backgroundParam } = useBackgroundParam()

  if (!categoriesConfig?.length) return null

  return (
    <>
      {/* ========== categories ========== */}
      {categoriesConfig.map((categoryConfig) => {
        return (
          <Fragment key={categoryConfig.id}>
            {/* ========== subcategories ========== */}
            {categoryConfig.subcategories.map((subcategoryConfig) => {
              const sourceData = getSourceData(subcategoryConfig?.sourceId)

              // One source can be used by multipe subcategories, so we need to make the key source-category-specific.
              const sourceKey = createSourceKeyAtlasGeo(
                categoryConfig.id,
                sourceData.id,
                subcategoryConfig.id,
              )

              const tileUrl = getCachelessTilesUrl({
                url: sourceData.tiles,
                cacheless: useDebugCachelessTiles,
              })

              return (
                <Fragment key={sourceKey}>
                  <Source
                    id={sourceKey}
                    key={sourceKey}
                    type="vector"
                    tiles={[tileUrl]}
                    promoteId={sourceData.promoteId}
                    maxzoom={sourceData.maxzoom}
                    minzoom={sourceData.minzoom}
                  />
                  {/* ========== styles ========== */}
                  {subcategoryConfig.styles.map((styleConfig) => {
                    const currStyleConfig = subcategoryConfig.styles.find(
                      (s) => s.id === styleConfig.id,
                    )
                    const visibility = layerVisibility(
                      (categoryConfig.active && currStyleConfig?.active) || false,
                    )
                    const supportedLayers = styleConfig?.layers?.filter(isAtlasStyleLayer)
                    return supportedLayers?.map((layer) => {
                      const layerId = createLayerKeyAtlasGeo(
                        sourceData.id,
                        subcategoryConfig.id,
                        styleConfig.id,
                        layer.id,
                      )
                      const layerHighlightId = getLayerHighlightId(layer.id)

                      const layerProps = buildAtlasLayerProps({
                        layer,
                        layerId,
                        sourceKey,
                        visibility,
                        debugLayerStyles,
                        backgroundId: backgroundParam,
                        subcategoryBeforeId: subcategoryConfig.beforeId,
                      })

                      return (
                        <Fragment key={layerId}>
                          <Layer key={layerId} {...layerProps} />
                          <LayerHighlight
                            key={layerHighlightId}
                            {...layerProps}
                            id={layerHighlightId}
                          />
                        </Fragment>
                      )
                    })
                  })}
                </Fragment>
              )
            })}
          </Fragment>
        )
      })}
    </>
  )
}
