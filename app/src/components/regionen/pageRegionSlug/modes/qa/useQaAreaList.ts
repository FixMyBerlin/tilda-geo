import { useQuery } from '@tanstack/react-query'
import { useQaParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useQaParam'
import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { getQaAreaListFn } from '@/server/qa-configs/qa-configs.functions'
import { useMapViewportBbox } from '../useMapViewportBbox'
import { resolvedQaIndicatorKeys, resolvedQaStatusKeys } from './qaConfigStyles'
import { useActiveQaConfig } from './useActiveQaConfig'

/**
 * The QA area list for the filters in the URL (status, users, indicators, search, map extent).
 * The list rows and the count in the filter bar both call it; React Query fetches once.
 */
export const useQaAreaList = () => {
  const region = useRegion()
  const { qaParamData } = useQaParam()
  const { selectedKey, activeConfig } = useActiveQaConfig()
  const viewportBbox = useMapViewportBbox()

  const configSlug = selectedKey
  const regionSlug = region.slug
  const extent = qaParamData.extent ?? 'view'
  const bbox = extent === 'view' ? viewportBbox : undefined
  const status = resolvedQaStatusKeys(qaParamData.status)
  const users = qaParamData.users
  const indicatorKeys =
    qaParamData.ind && qaParamData.ind.length > 0
      ? resolvedQaIndicatorKeys(
          qaParamData.ind,
          (activeConfig?.indicators ?? []).map((indicator) => indicator.key),
        )
      : undefined
  const search = qaParamData.search ?? ''
  const enabled = Boolean(configSlug) && (extent === 'all' || bbox !== undefined)

  const query = useQuery({
    queryKey: [
      'qa-configs',
      'getQaAreaList',
      { configSlug, regionSlug, status, users, indicatorKeys, search, extent, bbox },
    ],
    queryFn: () =>
      getQaAreaListFn({
        data: {
          configSlug,
          regionSlug,
          status,
          userIds: users,
          indicatorKeys,
          search: search || undefined,
          bbox,
        },
      }),
    enabled,
  })

  return { ...query, enabled, configSlug, regionSlug, extent }
}
