import { getTilesUrl } from '@/src/app/_components/utils/getTilesUrl'
import getQaConfigsForRegion from '@/src/server/qa-configs/queries/getQaConfigsForRegion'
import { useQuery } from '@blitzjs/rpc'
import { Layer, Source } from 'react-map-gl/maplibre'
import { useQaParam } from '../../../_hooks/useQueryState/useQaParam'
import { useRegionSlug } from '../../regionUtils/useRegionSlug'

export const qaLayerId = 'qa-layer'
const qaSourceId = 'qa-source'

export const SourcesLayersQa = () => {
  const { qaParamData } = useQaParam()
  const regionSlug = useRegionSlug()
  const [qaConfigs] = useQuery(getQaConfigsForRegion, { regionSlug: regionSlug! })

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
      />
      <Layer
        id={qaLayerId}
        key={qaLayerId}
        source={qaSourceId}
        source-layer={vectorSourceName}
        type="fill"
        paint={{
          'fill-color': '#ec4899', // pink-500
          'fill-opacity': 0.7,
          'fill-outline-color': '#be185d', // pink-700
        }}
      />
    </>
  )
}
