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
  type CalculatorDataset,
  calculatorLayerId,
  calculatorPartKey,
  calculatorSourceKey,
} from './calculatorDatasets.const'
import type { CalculatorFilter, CalculatorModeParam } from './calculatorModeParam'
import {
  calculatorStyleColorExpression,
  calculatorStyleOtherColor,
  type CalculatorStyleColors,
} from './utils/calculatorStyleColors'

type Props = {
  datasetId: string
  /** One source of the dataset; the dataset renders this once per part. */
  part: CalculatorDataset['parts'][number]
  filter: CalculatorFilter
  /** The drawn areas as of the last finished edit. */
  areas: CalculatorModeParam['areas']
  /** Colors of the active style (`sum.style`), if any. */
  styleColors: CalculatorStyleColors | undefined
}

/**
 * True for the points that are part of the sum: inside a drawn area and matching the filter
 * (`toFilterValue`: a missing or empty tag is `''`). `undefined` while neither narrows anything.
 * A filter on the part is the same for all points of the layer.
 */
const summedExpression = (areas: Props['areas'], filter: CalculatorFilter, partId: string) => {
  const conditions = [
    ...(areas ? [['within', areas]] : []),
    ...Object.entries(filter).map(([key, value]) =>
      key === calculatorPartKey
        ? value === partId
        : ['==', ['to-string', ['coalesce', ['get', key], '']], value],
    ),
  ]
  return conditions.length > 0 ? (['all', ...conditions] as ExpressionSpecification) : undefined
}

/**
 * The points of one part of the dataset that is summed. They are not a category: the mode owns
 * them, so they are only on the map while the dataset is selected in the Summieren mode.
 */
export const SourcesLayersCalculator = ({ datasetId, part, filter, areas, styleColors }: Props) => {
  const debugLayerStyles = useMapDebugDebugLayerStyles()
  const useDebugCachelessTiles = useMapDebugUseDebugCachelessTiles()
  const { backgroundParam } = useBackgroundParam()

  const summed = summedExpression(areas, filter, part.id)
  // Colored by part, all points of the layer have the one color of their part.
  const styleColor =
    styleColors?.key === calculatorPartKey
      ? (styleColors.colors[part.id] ?? calculatorStyleOtherColor)
      : styleColors && calculatorStyleColorExpression(styleColors)
  const sourceData = getSourceData(part.sourceId)
  const sourceKey = calculatorSourceKey(datasetId, part.id)
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
      {part.layers.filter(isAtlasStyleLayer).map((layer) => {
        const layerId = calculatorLayerId(datasetId, part.id, layer.id)
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
