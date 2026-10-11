import { useQuery } from '@tanstack/react-query'
import type { ExpressionSpecification } from 'maplibre-gl'
import { Fragment } from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'
import { useQaMapState } from '@/components/regionen/pageRegionSlug/hooks/mapState/useQaMapState'
import { useBackgroundParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useBackgroundParam'
import { useFeaturesParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/useFeaturesParam'
import { useQaParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useQaParam'
import {
  useHoveredListItem,
  useHoveredMapItemId,
} from '@/components/regionen/pageRegionSlug/modes/mode-list-store'
import { modeIdentity } from '@/components/regionen/pageRegionSlug/modes/modeIdentity'
import { qaHighlightIds } from '@/components/regionen/pageRegionSlug/modes/modeListItemId'
import { useCurrentMode } from '@/components/regionen/pageRegionSlug/modes/useCurrentMode'
import { useRegionSlug } from '@/components/regionen/pageRegionSlug/regionUtils/useRegionSlug'
import { useHasPermissions } from '@/components/shared/hooks/useHasPermissions'
import { getTilesUrl } from '@/components/shared/utils/getTilesUrl'
import { regionQaConfigsQueryOptions } from '@/server/regions/regionQueryOptions'
import { getLayerHighlightId } from '../utils/layerHighlight'
import { LayerHighlight } from './LayerHighlight'
import {
  QA_MAP_FILL_OPACITY,
  QA_MAP_UNSTYLED_FILL,
  QA_MAP_UNSTYLED_OUTLINE,
  qaMapStatusColorExpression,
} from './qaMapPaint'
import { beforeIdOnBackground } from './utils/beforeId'

// Source and Layers are two components, see <AllSources> and <AllLayers>.

export const qaLayerId = 'qa-layer'
export const qaSourceId = 'qa-source'
export const qaMinZoom = 12

const qaAccent = modeIdentity.qa.accent.hex

/** Base fill/outline hide under pointer hover (feature-state) and under list-hover/selection ids. */
const hideHoveredOrSelected = (highlightIdStrings: string[]) => {
  const conditions: ExpressionSpecification[] = [
    ['boolean', ['feature-state', 'hover'], false],
    ['boolean', ['feature-state', 'selected'], false],
    // One `==` per id: with `in` next to `feature-state`, maplibre paints every feature with
    // the default opacity of 1.
    ...highlightIdStrings.map((id): ExpressionSpecification => ['==', ['to-string', ['id']], id]),
  ]
  return ['any', ...conditions] as ExpressionSpecification
}

/** An area with a status, see `qaMapStatusColorExpression`. The others are gray. */
const hasStatus = [
  'any',
  ['!=', ['feature-state', 'userStatus'], null],
  ['!=', ['feature-state', 'systemStatus'], null],
] as ExpressionSpecification

// Both components use the same query and conditions, so the Layers never render without their Source.
const useActiveQaConfig = () => {
  const hasPermissions = useHasPermissions()
  const { qaParamData } = useQaParam()
  const regionSlug = useRegionSlug()
  const currentMode = useCurrentMode()
  const { data: qaConfigs } = useQuery({
    ...regionQaConfigsQueryOptions(regionSlug ?? ''),
    enabled: hasPermissions && Boolean(regionSlug),
  })

  const activeQaConfig = qaConfigs?.find((config) => config.slug === qaParamData.key)
  const vectorSourceName = activeQaConfig?.mapTable.replace('public.', '')

  if (!hasPermissions) {
    return undefined
  }

  // QA lives only in the QA mode now (not on the default map / other modes).
  if (!currentMode.isQa) {
    return undefined
  }

  if (!activeQaConfig || !vectorSourceName) {
    return undefined
  }

  return { activeQaConfig, vectorSourceName }
}

export const SourcesQa = () => {
  useQaMapState()
  const active = useActiveQaConfig()
  if (!active) return null
  const { activeQaConfig, vectorSourceName } = active

  const dataUrl = getTilesUrl(vectorSourceName)

  // Key by vector tileset so Source + layers remount together when switching QA configs.
  // Otherwise MapLibre can apply new source-layer ids while the vector source URL is still
  // the previous tileset, causing "Source layer X does not exist on source qa-source".
  const qaVectorSetKey = `${qaSourceId}:${vectorSourceName}`

  return (
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
  )
}

export const LayersQa = () => {
  const { backgroundParam } = useBackgroundParam()
  const { featuresParam } = useFeaturesParam()
  const hoveredListItem = useHoveredListItem()
  const hoveredMapItemId = useHoveredMapItemId()
  const active = useActiveQaConfig()
  if (!active) return null
  const { vectorSourceName } = active

  const selectedIdStrings = featuresParam
    .filter((feature) => feature.sourceId === qaSourceId)
    .map((feature) => String(feature.id))
  const highlightIdStrings = qaHighlightIds(
    selectedIdStrings,
    hoveredListItem?.id,
    hoveredMapItemId,
  )
  const highlightFilter = [
    'in',
    ['to-string', ['id']],
    ['literal', highlightIdStrings],
  ] as ExpressionSpecification
  const hideBaseFill = hideHoveredOrSelected(highlightIdStrings)

  const qaVectorSetKey = `${qaSourceId}:${vectorSourceName}`

  return (
    <Fragment key={`${qaVectorSetKey}--layers`}>
      <Layer
        id={qaLayerId}
        source={qaSourceId}
        source-layer={vectorSourceName}
        type="fill"
        beforeId={beforeIdOnBackground('atlas-app-beforeid-below-road', backgroundParam)}
        paint={{
          'fill-color': qaMapStatusColorExpression(QA_MAP_UNSTYLED_FILL),
          'fill-opacity': ['case', hideBaseFill, 0, QA_MAP_FILL_OPACITY],
          'fill-outline-color': qaMapStatusColorExpression(QA_MAP_UNSTYLED_OUTLINE),
        }}
      />
      {/* Neighbours share their border. The gray outlines are an own layer below, so a gray
          neighbour never covers the border of an area with a status. */}
      <Layer
        id={`${qaLayerId}-outline-unstyled`}
        source={qaSourceId}
        source-layer={vectorSourceName}
        type="line"
        paint={{
          'line-color': QA_MAP_UNSTYLED_OUTLINE,
          'line-width': 3,
          'line-opacity': ['case', ['any', hideBaseFill, hasStatus], 0, 1],
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
          'line-opacity': ['case', ['all', hasStatus, ['!', hideBaseFill]], 1, 0],
        }}
      />
      {highlightIdStrings.length > 0 ? (
        <>
          <Layer
            id={`${qaLayerId}-highlight`}
            source={qaSourceId}
            source-layer={vectorSourceName}
            type="line"
            filter={highlightFilter}
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            paint={{
              'line-color': qaAccent,
              'line-opacity': 0.5,
              'line-width': 10,
              'line-offset': -5,
            }}
          />
          <Layer
            id={`${qaLayerId}-highlight-outline`}
            source={qaSourceId}
            source-layer={vectorSourceName}
            type="line"
            filter={highlightFilter}
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            paint={{
              'line-color': qaAccent,
              'line-opacity': 0.5,
              'line-width': 3,
            }}
          />
        </>
      ) : null}
      <LayerHighlight
        id={getLayerHighlightId(qaLayerId)}
        source={qaSourceId}
        source-layer={vectorSourceName}
        type="fill"
        paint={{}}
        hoverColor={qaAccent}
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
        hoverColor={qaAccent}
        includeSelected={false}
      />
    </Fragment>
  )
}
