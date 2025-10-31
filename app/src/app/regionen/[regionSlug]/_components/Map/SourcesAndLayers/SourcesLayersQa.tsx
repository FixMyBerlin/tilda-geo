import { getTilesUrl } from '@/src/app/_components/utils/getTilesUrl'
import {
  systemStatusConfig,
  userStatusConfig,
} from '@/src/app/regionen/[regionSlug]/_components/SidebarInspector/InspectorQa/qaConfigs'
import getQaConfigsForRegion from '@/src/server/qa-configs/queries/getQaConfigsForRegion'
import { useQuery } from '@blitzjs/rpc'
import { Fragment } from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'
import { useQaMapState } from '../../../_hooks/mapState/useQaMapState'
import { useQaParam } from '../../../_hooks/useQueryState/useQaParam'
import { useRegionSlug } from '../../regionUtils/useRegionSlug'
import { getLayerHighlightId } from '../utils/layerHighlight'
import { LayerHighlight } from './LayerHighlight'

export const qaLayerId = 'qa-layer'
export const qaSourceId = 'qa-source'
export const qaMinZoom = 12

export const SourcesLayersQa = () => {
  const { qaParamData } = useQaParam()
  const regionSlug = useRegionSlug()
  const [qaConfigs] = useQuery(getQaConfigsForRegion, { regionSlug: regionSlug! })

  // Initialize QA map state to trigger data loading and feature state updates
  useQaMapState()

  const activeQaConfig = qaConfigs?.find((config) => config.slug === qaParamData.configSlug)

  // Don't render if no QA config is selected or if style is 'none'
  if (!activeQaConfig || qaParamData.style === 'none') {
    return null
  }

  const vectorSourceName = activeQaConfig.mapTable.replace('public.', '')
  const dataUrl = getTilesUrl(vectorSourceName)

  return (
    <>
      <Source
        id={qaSourceId}
        key={qaSourceId}
        type="vector"
        url={dataUrl}
        // NOTE: We will likely have to make the promoteId part of the config
        promoteId={'id'}
        attribution={activeQaConfig.mapAttribution || ''}
        minzoom={qaMinZoom}
        maxzoom={16} // higher than default to fix geometric precision for circles and such
      />
      <Fragment key={qaLayerId}>
        <Layer
          id={qaLayerId}
          source={qaSourceId}
          source-layer={vectorSourceName}
          type="fill"
          paint={{
            'fill-color': [
              'case',
              ['==', ['feature-state', 'userStatus'], 'S'],
              userStatusConfig.OK_STRUCTURAL_CHANGE.hexColor,
              ['==', ['feature-state', 'userStatus'], 'R'],
              userStatusConfig.OK_REFERENCE_ERROR.hexColor,
              ['==', ['feature-state', 'userStatus'], 'D'],
              userStatusConfig.NOT_OK_DATA_ERROR.hexColor,
              ['==', ['feature-state', 'userStatus'], 'P'],
              userStatusConfig.NOT_OK_PROCESSING_ERROR.hexColor,
              ['==', ['feature-state', 'userStatus'], 'O'],
              userStatusConfig.OTHER.hexColor,
              ['==', ['feature-state', 'systemStatus'], 'G'],
              systemStatusConfig.GOOD.hexColor,
              ['==', ['feature-state', 'systemStatus'], 'N'],
              systemStatusConfig.NEEDS_REVIEW.hexColor,
              ['==', ['feature-state', 'systemStatus'], 'P'],
              systemStatusConfig.PROBLEMATIC.hexColor,
              'gray',
            ],
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
            'fill-outline-color': [
              'case',
              ['==', ['feature-state', 'userStatus'], 'S'],
              userStatusConfig.OK_STRUCTURAL_CHANGE.hexColor,
              ['==', ['feature-state', 'userStatus'], 'R'],
              userStatusConfig.OK_REFERENCE_ERROR.hexColor,
              ['==', ['feature-state', 'userStatus'], 'D'],
              userStatusConfig.NOT_OK_DATA_ERROR.hexColor,
              ['==', ['feature-state', 'userStatus'], 'P'],
              userStatusConfig.NOT_OK_PROCESSING_ERROR.hexColor,
              ['==', ['feature-state', 'userStatus'], 'O'],
              userStatusConfig.OTHER.hexColor,
              ['==', ['feature-state', 'systemStatus'], 'G'],
              systemStatusConfig.GOOD.hexColor,
              ['==', ['feature-state', 'systemStatus'], 'N'],
              systemStatusConfig.NEEDS_REVIEW.hexColor,
              ['==', ['feature-state', 'systemStatus'], 'P'],
              systemStatusConfig.PROBLEMATIC.hexColor,
              '#333333',
            ],
          }}
        />
        <Layer
          id={`${qaLayerId}-outline`}
          source={qaSourceId}
          source-layer={vectorSourceName}
          type="line"
          paint={{
            'line-color': [
              'case',
              ['==', ['feature-state', 'userStatus'], 'S'],
              userStatusConfig.OK_STRUCTURAL_CHANGE.hexColor,
              ['==', ['feature-state', 'userStatus'], 'R'],
              userStatusConfig.OK_REFERENCE_ERROR.hexColor,
              ['==', ['feature-state', 'userStatus'], 'D'],
              userStatusConfig.NOT_OK_DATA_ERROR.hexColor,
              ['==', ['feature-state', 'userStatus'], 'P'],
              userStatusConfig.NOT_OK_PROCESSING_ERROR.hexColor,
              ['==', ['feature-state', 'userStatus'], 'O'],
              userStatusConfig.OTHER.hexColor,
              ['==', ['feature-state', 'systemStatus'], 'G'],
              systemStatusConfig.GOOD.hexColor,
              ['==', ['feature-state', 'systemStatus'], 'N'],
              systemStatusConfig.NEEDS_REVIEW.hexColor,
              ['==', ['feature-state', 'systemStatus'], 'P'],
              systemStatusConfig.PROBLEMATIC.hexColor,
              '#333333',
            ],
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
        <LayerHighlight
          id={getLayerHighlightId(qaLayerId)}
          source={qaSourceId}
          source-layer={vectorSourceName}
          type="fill"
          paint={{}}
        />
        <LayerHighlight
          id={getLayerHighlightId(`${qaLayerId}-outline`)}
          source={qaSourceId}
          source-layer={vectorSourceName}
          type="line"
          paint={{
            'line-width': 3,
          }}
        />
      </Fragment>
    </>
  )
}
