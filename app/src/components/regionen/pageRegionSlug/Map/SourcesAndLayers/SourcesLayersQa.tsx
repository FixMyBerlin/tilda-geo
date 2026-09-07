import { useQuery } from '@tanstack/react-query'
import type { ExpressionSpecification } from 'maplibre-gl'
import { Fragment } from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'
import { useFeaturesParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/useFeaturesParam'
import { useQaParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useQaParam'
import { modeIdentity } from '@/components/regionen/pageRegionSlug/modes/modeIdentity'
import { useCurrentMode } from '@/components/regionen/pageRegionSlug/modes/useCurrentMode'
import { useRegionSlug } from '@/components/regionen/pageRegionSlug/regionUtils/useRegionSlug'
import { useHasPermissions } from '@/components/shared/hooks/useHasPermissions'
import { getTilesUrl } from '@/components/shared/utils/getTilesUrl'
import { regionQaConfigsQueryOptions } from '@/server/regions/regionQueryOptions'
import { getLayerHighlightId } from '../utils/layerHighlight'
import { LayerHighlight } from './LayerHighlight'
import {
  QA_MAP_UNSTYLED_FILL,
  QA_MAP_UNSTYLED_OUTLINE,
  qaMapStatusColorExpression,
} from './qaMapPaint'

export const qaLayerId = 'qa-layer'
export const qaSourceId = 'qa-source'
export const qaMinZoom = 12

export const SourcesLayersQa = () => {
  const hasPermissions = useHasPermissions()
  const { qaParamData } = useQaParam()
  const regionSlug = useRegionSlug()
  const isQaMode = useCurrentMode() === 'qa'
  const { featuresParam } = useFeaturesParam()
  const { data: qaConfigs } = useQuery({
    ...regionQaConfigsQueryOptions(regionSlug ?? ''),
    enabled: hasPermissions && Boolean(regionSlug),
  })

  const activeQaConfig = qaConfigs?.find((config) => config.slug === qaParamData.key)
  const vectorSourceName = activeQaConfig?.mapTable.replace('public.', '')

  // Selected purple inner ring; base fill opacity stays on feature-state hover/selected so
  // unselected areas keep their transparent fill. List hover uses MapListHoverMarker.
  const selectedIdStrings = featuresParam
    .filter((feature) => feature.sourceId === qaSourceId)
    .map((feature) => String(feature.id))
  const isHighlighted = (
    selectedIdStrings.length > 0
      ? ['in', ['to-string', ['id']], ['literal', selectedIdStrings]]
      : false
  ) as ExpressionSpecification | false

  if (!hasPermissions) {
    return null
  }

  // QA lives only in the QA mode now (not on the default map / other modes).
  if (!isQaMode) {
    return null
  }

  if (!activeQaConfig || !vectorSourceName) {
    return null
  }

  const dataUrl = getTilesUrl(vectorSourceName)

  // Key by vector tileset so Source + layers remount together when switching QA configs.
  // Otherwise MapLibre can apply new source-layer ids while the vector source URL is still
  // the previous tileset, causing "Source layer X does not exist on source qa-source".
  const qaVectorSetKey = `${qaSourceId}:${vectorSourceName}`

  return (
    <>
      <Source
        id={qaSourceId}
        key={`${qaVectorSetKey}--source`}
        type="vector"
        url={dataUrl}
        // NOTE: We will likely have to make the promoteId part of the config
        promoteId={'id'}
        attribution={activeQaConfig.mapAttribution || ''}
        minzoom={qaMinZoom}
        maxzoom={16} // higher than default to fix geometric precision for circles and such
      />
      <Fragment key={`${qaVectorSetKey}--layers`}>
        <Layer
          id={qaLayerId}
          source={qaSourceId}
          source-layer={vectorSourceName}
          type="fill"
          paint={{
            'fill-color': qaMapStatusColorExpression(QA_MAP_UNSTYLED_FILL),
            'fill-opacity': [
              'case',
              [
                'any',
                ['boolean', ['feature-state', 'hover'], false],
                ['boolean', ['feature-state', 'selected'], false],
              ],
              0,
              0.7,
            ],
            'fill-outline-color': qaMapStatusColorExpression(QA_MAP_UNSTYLED_OUTLINE),
          }}
        />
        <Layer
          id={`${qaLayerId}-outline`}
          source={qaSourceId}
          source-layer={vectorSourceName}
          type="line"
          paint={{
            'line-color': qaMapStatusColorExpression(QA_MAP_UNSTYLED_OUTLINE),
            'line-width': 3,
            'line-opacity': [
              'case',
              [
                'any',
                ['boolean', ['feature-state', 'hover'], false],
                ['boolean', ['feature-state', 'selected'], false],
              ],
              0,
              1,
            ],
          }}
        />
        {selectedIdStrings.length > 0 ? (
          <Layer
            id={`${qaLayerId}-selected`}
            source={qaSourceId}
            source-layer={vectorSourceName}
            type="line"
            filter={
              isHighlighted === false
                ? (['literal', false] as ExpressionSpecification)
                : isHighlighted
            }
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            paint={{
              'line-color': modeIdentity.qa.accent,
              'line-opacity': 0.85,
              'line-width': 10,
              'line-offset': -5,
            }}
          />
        ) : null}
        <LayerHighlight
          id={getLayerHighlightId(qaLayerId)}
          source={qaSourceId}
          source-layer={vectorSourceName}
          type="fill"
          paint={{}}
          hoverColor={modeIdentity.qa.accent}
          includeSelected={false}
        />
        <LayerHighlight
          id={getLayerHighlightId(`${qaLayerId}-outline`)}
          source={qaSourceId}
          source-layer={vectorSourceName}
          type="line"
          paint={{
            'line-width': 3,
          }}
          hoverColor={modeIdentity.qa.accent}
          includeSelected={false}
        />
      </Fragment>
    </>
  )
}
