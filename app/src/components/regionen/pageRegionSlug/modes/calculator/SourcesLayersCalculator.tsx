import type { ExpressionSpecification } from 'maplibre-gl'
import { Layer, Source } from 'react-map-gl/maplibre'
import {
  useMapDebugDebugLayerStyles,
  useMapDebugUseDebugCachelessTiles,
} from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapDebugState'
import { useBackgroundParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useBackgroundParam'
import {
  buildAtlasLayerProps,
  isAtlasStyleLayer,
} from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/utils/buildAtlasLayerProps'
import { layerVisibility } from '@/components/regionen/pageRegionSlug/Map/utils/layerVisibility'
import { getMapDataSourceTilesUrl } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/getMapDataSourceTilesUrl'
import { getSourceData } from '@/components/regionen/pageRegionSlug/mapData/utils/getMapDataUtils'
import { getCachelessTilesUrl } from '@/components/shared/utils/getCachelessTilesUrl'
import {
  type calculatorDatasets,
  calculatorLayerId,
  calculatorSourceKey,
} from './calculatorDatasets.const'
import type { CalculatorFilter, CalculatorModeParam } from './calculatorModeParam'
import {
  calculatorStyleColorExpression,
  type CalculatorStyleColors,
} from './utils/calculatorStyleColors'

type Props = {
  dataset: (typeof calculatorDatasets)[number]
  filter: CalculatorFilter
  /** The drawn areas, including a drag in progress. */
  areas: CalculatorModeParam['areas']
  /** Colors of the active style (`sum.style`), if any. */
  styleColors: CalculatorStyleColors | undefined
}

/**
 * True for the points that are part of the sum: inside a drawn area and matching the filter
 * (`toFilterValue`: a missing or empty tag is `''`). `undefined` while neither narrows anything.
 */
const summedExpression = (areas: Props['areas'], filter: CalculatorFilter) => {
  const conditions = [
    ...(areas ? [['within', areas]] : []),
    ...Object.entries(filter).map(([key, value]) => [
      '==',
      ['to-string', ['coalesce', ['get', key], '']],
      value,
    ]),
  ]
  return conditions.length > 0 ? (['all', ...conditions] as ExpressionSpecification) : undefined
}

/**
 * The points of the dataset that is summed. They are not a category: the mode owns them, so
 * they are only on the map while the dataset is selected in the Summieren mode.
 */
export const SourcesLayersCalculator = ({ dataset, filter, areas, styleColors }: Props) => {
  const debugLayerStyles = useMapDebugDebugLayerStyles()
  const useDebugCachelessTiles = useMapDebugUseDebugCachelessTiles()
  const { backgroundParam } = useBackgroundParam()

  const summed = summedExpression(areas, filter)
  const styleColor = styleColors ? calculatorStyleColorExpression(styleColors) : undefined
  const sourceData = getSourceData(dataset.sourceId)
  const sourceKey = calculatorSourceKey(dataset.id)
  const tileUrl = getCachelessTilesUrl({
    url: getMapDataSourceTilesUrl(sourceData),
    cacheless: useDebugCachelessTiles,
  })

  // Source and layer ids hold the dataset id, so a dataset switch replaces both.
  return (
    <>
      <Source
        key={sourceKey}
        id={sourceKey}
        type="vector"
        tiles={[tileUrl]}
        promoteId={sourceData.promoteId}
        maxzoom={sourceData.maxzoom}
        minzoom={sourceData.minzoom}
      />
      {dataset.layers.filter(isAtlasStyleLayer).map((layer) => {
        const layerId = calculatorLayerId(dataset.id, layer.id)
        const layerProps = buildAtlasLayerProps({
          layer,
          layerId,
          sourceKey,
          visibility: layerVisibility(true),
          debugLayerStyles,
          backgroundId: backgroundParam,
          subcategoryBeforeId: undefined,
        })
        // Points that are not summed are dimmed, not removed: the calculation reads the rendered
        // points, and the panel needs the filtered-out ones to offer their values. Only the
        // opacity says "summed or not"; the color is free for the style.
        if (layerProps.type === 'circle' && (summed || styleColor)) {
          const dimmed = summed ? (['case', summed, 1, 0.25] as ExpressionSpecification) : undefined
          return (
            <Layer
              key={layerId}
              {...layerProps}
              paint={{
                ...layerProps.paint,
                ...(dimmed ? { 'circle-opacity': dimmed, 'circle-stroke-opacity': dimmed } : {}),
                ...(styleColor ? { 'circle-color': styleColor } : {}),
              }}
            />
          )
        }
        return <Layer key={layerId} {...layerProps} />
      })}
    </>
  )
}
