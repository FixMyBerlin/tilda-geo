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
import type { CalculatorFilter } from './calculatorModeParam'

type Props = { dataset: (typeof calculatorDatasets)[number]; filter: CalculatorFilter }

/** Matches what `toFilterValue` compares: a missing or empty tag is `''`. */
const filterExpression = (filter: CalculatorFilter) =>
  [
    'all',
    ...Object.entries(filter).map(([key, value]) => [
      '==',
      ['to-string', ['coalesce', ['get', key], '']],
      value,
    ]),
  ] as ExpressionSpecification

/**
 * The points of the dataset that is summed. They are not a category: the mode owns them, so
 * they are only on the map while the dataset is selected in the Summieren mode.
 */
export const SourcesLayersCalculator = ({ dataset, filter }: Props) => {
  const debugLayerStyles = useMapDebugDebugLayerStyles()
  const useDebugCachelessTiles = useMapDebugUseDebugCachelessTiles()
  const { backgroundParam } = useBackgroundParam()

  const hasFilter = Object.keys(filter).length > 0
  const sourceData = getSourceData(dataset.sourceId)
  const sourceKey = calculatorSourceKey(dataset.sourceId)
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
        const layerId = calculatorLayerId(dataset.sourceId, layer.id)
        const layerProps = buildAtlasLayerProps({
          layer,
          layerId,
          sourceKey,
          visibility: layerVisibility(true),
          debugLayerStyles,
          backgroundId: backgroundParam,
          subcategoryBeforeId: undefined,
        })
        // Points outside the filter are dimmed, not removed: the calculation reads the rendered
        // points, and the panel needs the filtered-out ones to offer their values.
        if (layerProps.type === 'circle' && hasFilter) {
          const dimmed = ['case', filterExpression(filter), 1, 0.15] as ExpressionSpecification
          return (
            <Layer
              key={layerId}
              {...layerProps}
              paint={{
                ...layerProps.paint,
                'circle-opacity': dimmed,
                'circle-stroke-opacity': dimmed,
              }}
            />
          )
        }
        return <Layer key={layerId} {...layerProps} />
      })}
    </>
  )
}
