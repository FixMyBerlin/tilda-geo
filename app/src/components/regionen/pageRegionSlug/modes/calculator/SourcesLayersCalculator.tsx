import type { ExpressionSpecification } from 'maplibre-gl'
import { Layer, Source } from 'react-map-gl/maplibre'
import { useMapDebugDebugLayerStyles } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapDebugState'
import { useBackgroundParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useBackgroundParam'
import type { LayerPosition } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/utils/beforeId'
import {
  buildAtlasLayerProps,
  isAtlasStyleLayer,
} from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/utils/buildAtlasLayerProps'
import { layerVisibility } from '@/components/regionen/pageRegionSlug/Map/utils/layerVisibility'
import { getMapDataSourceTilesUrl } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/getMapDataSourceTilesUrl'
import { getSourceData } from '@/components/regionen/pageRegionSlug/mapData/utils/getMapDataUtils'
import {
  type CalculatorDataset,
  calculatorLayerId,
  calculatorPartKey,
  calculatorSourceKey,
} from './calculatorDatasets.const'
import type { CalculatorFilter } from './calculatorModeParam'
import {
  calculatorStyleColorExpression,
  calculatorStyleOtherColor,
  type CalculatorStyleColors,
} from './utils/calculatorStyleColors'

type Props = {
  dataset: Pick<CalculatorDataset, 'id' | 'parts'>
  filter: CalculatorFilter
  /** Colors of the active style (`sum.style`), if any. */
  styleColors: CalculatorStyleColors | undefined
}

/** Above the layers of the map, below the mask that dims what lies outside the areas. */
const calculatorDatasetPosition = 'atlas-app-beforeid-group1' satisfies LayerPosition

const FILL_OPACITY = 0.4
const DIMMED = 0.25

/**
 * True for the features that match the filter (a missing or empty tag is `''`, like in the rows
 * of the server). `undefined` while the filter narrows nothing. A filter on the part is the same
 * for all features of the layer.
 */
const summedExpression = (filter: CalculatorFilter, partId: string) => {
  const conditions = Object.entries(filter).map(([key, values]) =>
    key === calculatorPartKey
      ? values.includes(partId)
      : ['in', ['to-string', ['coalesce', ['get', key], '']], ['literal', values]],
  )
  return conditions.length > 0 ? (['all', ...conditions] as ExpressionSpecification) : undefined
}

/**
 * The features of the dataset that is summed, each part from the tiles of its source. They are
 * not a category: the mode owns them, so they are only on the map while the dataset is selected
 * in the Summieren mode.
 */
export const SourcesLayersCalculator = ({ dataset, filter, styleColors }: Props) => {
  const debugLayerStyles = useMapDebugDebugLayerStyles()
  const { backgroundParam } = useBackgroundParam()

  const sourceIds = [...new Set(dataset.parts.map((part) => part.sourceId))]

  // Source and layer ids hold the dataset id, so a dataset switch replaces both.
  return (
    <>
      {sourceIds.map((sourceId) => {
        const sourceData = getSourceData(sourceId)
        const sourceKey = calculatorSourceKey(dataset.id, sourceId)
        return (
          <Source
            key={sourceKey}
            id={sourceKey}
            type="vector"
            tiles={[getMapDataSourceTilesUrl(sourceData)]}
            promoteId={sourceData.promoteId}
            maxzoom={sourceData.maxzoom}
            minzoom={sourceData.minzoom}
          />
        )
      })}
      {dataset.parts.flatMap((part) => {
        const summed = summedExpression(filter, part.id)
        // Colored by part, all features of the layer have the one color of their part.
        const styleColor =
          styleColors?.key === calculatorPartKey
            ? (styleColors.colors[part.id] ?? calculatorStyleOtherColor)
            : styleColors && calculatorStyleColorExpression(styleColors)

        return part.layers.filter(isAtlasStyleLayer).map((layer) => {
          const layerId = calculatorLayerId(dataset.id, part.id, layer.id)
          const layerProps = buildAtlasLayerProps({
            layer,
            layerId,
            sourceKey: calculatorSourceKey(dataset.id, part.sourceId),
            visibility: layerVisibility(true),
            debugLayerStyles,
            backgroundId: backgroundParam,
            position: calculatorDatasetPosition,
          })
          // Features that do not match the filter are dimmed, not removed, so the map still
          // shows what a click on another value in the panel would add. Only the opacity says
          // "summed or not"; the color is free for the style.
          const full = layerProps.type === 'fill' ? FILL_OPACITY : 1
          const opacity = summed
            ? (['case', summed, full, full * DIMMED] as ExpressionSpecification)
            : full
          const color = styleColor ?? undefined

          switch (layerProps.type) {
            case 'line': {
              const paint = {
                ...layerProps.paint,
                'line-opacity': opacity,
                ...(color ? { 'line-color': color } : {}),
              }
              return <Layer key={layerId} {...layerProps} paint={paint} />
            }
            case 'fill': {
              const paint = {
                ...layerProps.paint,
                'fill-opacity': opacity,
                ...(color ? { 'fill-color': color } : {}),
              }
              return <Layer key={layerId} {...layerProps} paint={paint} />
            }
            case 'circle': {
              const paint = {
                ...layerProps.paint,
                'circle-opacity': opacity,
                'circle-stroke-opacity': opacity,
                ...(color ? { 'circle-color': color } : {}),
              }
              return <Layer key={layerId} {...layerProps} paint={paint} />
            }
            case 'heatmap':
            case 'symbol':
              return <Layer key={layerId} {...layerProps} />
          }
        })
      })}
    </>
  )
}
