import { makeTileUrlCacheless } from '@/src/app/_components/utils/getTilesUrl'
import {
  Store,
  useMapDebugUseDebugCachelessTiles,
  useMapDebugUseDebugLayerStyles,
} from '@/src/app/regionen/[regionSlug]/_hooks/mapState/useMapDebugState'
import { useBackgroundParam } from '@/src/app/regionen/[regionSlug]/_hooks/useQueryState/useBackgroundParam'
import { useCategoriesConfig } from '@/src/app/regionen/[regionSlug]/_hooks/useQueryState/useCategoriesConfig/useCategoriesConfig'
import { debugLayerStyles } from '@/src/app/regionen/[regionSlug]/_mapData/mapDataSubcategories/mapboxStyles/debugLayerStyles'
import { FilterSpecification } from 'maplibre-gl'
import { Fragment, memo, useRef } from 'react'
import { Layer, LayerProps, Source } from 'react-map-gl/maplibre'
import { getSourceData } from '../../../_mapData/utils/getMapDataUtils'
import {
  createLayerKeyAtlasGeo,
  createSourceKeyAtlasGeo,
} from '../../utils/sourceKeyUtils/sourceKeyUtilsAtlasGeo'
import { getLayerHighlightId } from '../utils/layerHighlight'
import { layerVisibility } from '../utils/layerVisibility'
import { LayerHighlight } from './LayerHighlight'
import { beforeId } from './utils/beforeId'

// We add source+layer map-components for all categories and all subcategories of the given config.
// We then toggle the visibility of the layer base on the URL state (config).
// We also use this visbility to add/remove interactive layers.
//
// Performance Note:
// To prevent loading tiles for inactive layers, we only render the Source component
// after it has been activated at least once. After that, the source stays mounted
// even when layers are hidden, which allows browser caching to work efficiently.

type Props = Pick<Store, 'useDebugLayerStyles' | 'useDebugCachelessTiles'> & {
  categoriesConfig: any // inferred from useQueryState('config')
  backgroundParam: any // inferred from useQueryState('bg')
}

const SourcesLayersAtlasGeoMemoized = memo(function SourcesLayersAtlasGeoMemoized(props: Props) {
  const { useDebugLayerStyles, useDebugCachelessTiles, categoriesConfig, backgroundParam } = props
  const sourcesPreviouslyVisible = useRef<Record<string, boolean>>({})

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

              const tileUrl = makeTileUrlCacheless({
                url: sourceData.tiles,
                cacheless: useDebugCachelessTiles,
              })

              // Check if any style in this subcategory is active
              const isAnyStyleActive = subcategoryConfig.styles.some(
                (styleConfig) => categoryConfig.active && styleConfig.active,
              )

              // Don't render Source (and load data) before it was not visible at least once
              const sourceWasVisible = !!sourcesPreviouslyVisible.current[sourceKey]
              if (!sourceWasVisible && !isAnyStyleActive) return null
              sourcesPreviouslyVisible.current[sourceKey] = true

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
                    {
                      /* ========== layers ========== */
                    }
                    return styleConfig?.layers?.map((layer) => {
                      const layerId = createLayerKeyAtlasGeo(
                        sourceData.id,
                        subcategoryConfig.id,
                        styleConfig.id,
                        layer.id,
                      )

                      let layerFilter = layer.filter as FilterSpecification
                      let layerPaint = layer.paint
                      let layerLayout = { ...visibility, ...(layer.layout || {}) }

                      // Use ?debugMap=true and <DebugMap> to setUseDebugLayerStyles
                      if (useDebugLayerStyles) {
                        layerFilter = ['all'] as FilterSpecification
                        layerPaint = debugLayerStyles({
                          source: sourceKey,
                          sourceLayer: layer['source-layer'],
                        }).find((l) => l.type === layer.type)?.paint
                        layerLayout = {
                          ...debugLayerStyles({
                            source: sourceKey,
                            sourceLayer: layer['source-layer'],
                          }).find((l) => l.type === layer.type)?.layout,
                          ...visibility,
                        }
                      }

                      const layerProps = {
                        id: layerId,
                        source: sourceKey,
                        type: layer.type,
                        'source-layer': layer['source-layer'],
                        layout: layerLayout,
                        paint: layerPaint as any, // Too complex to apply all the different layer-type paint-types
                        beforeId: beforeId({
                          backgroundId: backgroundParam,
                          subcategoryBeforeId: subcategoryConfig.beforeId,
                          layerType: layer.type,
                        }),
                        ...(layerFilter ? { filter: layerFilter } : {}),
                        ...(layer.maxzoom ? { maxzoom: layer.maxzoom } : {}),
                        ...(layer.minzoom ? { minzoom: layer.minzoom } : {}),
                      } satisfies LayerProps

                      const layerHighlightId = getLayerHighlightId(layer.id)

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
})

export const SourcesLayersAtlasGeo = () => {
  const useDebugLayerStyles = useMapDebugUseDebugLayerStyles()
  const useDebugCachelessTiles = useMapDebugUseDebugCachelessTiles()
  const { categoriesConfig } = useCategoriesConfig()
  const { backgroundParam } = useBackgroundParam()

  const props: Props = {
    useDebugLayerStyles,
    categoriesConfig,
    backgroundParam,
    useDebugCachelessTiles,
  }
  if (!categoriesConfig?.length) return null

  return <SourcesLayersAtlasGeoMemoized {...props} />
}
