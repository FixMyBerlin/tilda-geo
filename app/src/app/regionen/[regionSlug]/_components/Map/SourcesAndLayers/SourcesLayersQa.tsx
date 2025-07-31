import { getTilesUrl } from '@/src/app/_components/utils/getTilesUrl'
import getQaConfigsForRegion from '@/src/server/qa-configs/queries/getQaConfigsForRegion'
import { useQuery } from '@blitzjs/rpc'
import { Layer, Source } from 'react-map-gl/maplibre'
import { useQaMapState } from '../../../_hooks/mapState/useQaMapState'
import { useQaParam } from '../../../_hooks/useQueryState/useQaParam'
import { useRegionSlug } from '../../regionUtils/useRegionSlug'

export const qaLayerId = 'qa-layer'
export const qaSourceId = 'qa-source'
export const qaMinZoom = 13

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
      />
      <Layer
        id={qaLayerId}
        key={qaLayerId}
        source={qaSourceId}
        source-layer={vectorSourceName}
        type="fill"
        paint={{
          'fill-color': ['coalesce', ['feature-state', 'qaColor'], 'gray'],
          'fill-opacity': 0.7,
          'fill-outline-color': ['coalesce', ['feature-state', 'qaColor'], '#333333'],
        }}
      />
    </>
  )
}
