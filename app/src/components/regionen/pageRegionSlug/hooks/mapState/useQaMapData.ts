import { useQuery } from '@tanstack/react-query'
import { useRegionSlug } from '@/components/regionen/pageRegionSlug/regionUtils/useRegionSlug'
import { USER_STATUS_TO_LETTER } from '@/components/regionen/pageRegionSlug/SidebarInspector/InspectorQa/qaConfigs'
import { useHasPermissions } from '@/components/shared/hooks/useHasPermissions'
import type { QaMapData } from '@/server/qa-configs/queries/getQaDataForMap.server'
import {
  qaDataForMapQueryOptions,
  regionQaConfigsQueryOptions,
} from '@/server/regions/regionQueryOptions'
import { useQaFilterParam } from '../useQueryState/useQaFilterParam'
import { useQaParam } from '../useQueryState/useQaParam'

// Shared filter function for both filtering and optimistic updates
export const filterQaDataByStyle = (data: QaMapData[], style: string) => {
  switch (style) {
    case 'none':
      return []
    case 'all':
      return data
    case 'user-not-ok-processing':
      return data.filter((item) => {
        return item.userStatus === USER_STATUS_TO_LETTER.NOT_OK_PROCESSING_ERROR
      })
    case 'user-not-ok-osm':
      return data.filter((item) => {
        return item.userStatus === USER_STATUS_TO_LETTER.NOT_OK_DATA_ERROR
      })
    case 'user-ok-construction':
      return data.filter((item) => {
        return item.userStatus === USER_STATUS_TO_LETTER.OK_STRUCTURAL_CHANGE
      })
    case 'user-ok-reference-error':
      return data.filter((item) => {
        return item.userStatus === USER_STATUS_TO_LETTER.OK_REFERENCE_ERROR
      })
    case 'user-ok-qa-tooling-error':
      return data.filter((item) => {
        return item.userStatus === USER_STATUS_TO_LETTER.OK_QA_TOOLING_ERROR
      })
    case 'user-pending-needs-review':
      return data.filter((item) => {
        return item.userStatus === null && item.systemStatus === 'N'
      })
    case 'user-pending-problematic':
      return data.filter((item) => {
        return item.userStatus === null && item.systemStatus === 'P'
      })
    case 'user-selected':
      // Filtering by users happens server-side, so just return all data
      return data
    default:
      return data
  }
}

export const useQaMapData = () => {
  const hasPermissions = useHasPermissions()
  const { qaParamData } = useQaParam()
  const { qaFilterParam } = useQaFilterParam()
  const regionSlug = useRegionSlug()
  const { data: qaConfigs } = useQuery({
    ...regionQaConfigsQueryOptions(regionSlug ?? ''),
    enabled: hasPermissions && Boolean(regionSlug),
  })

  // React Compiler automatically memoizes this computation
  const activeQaConfig = qaConfigs?.find((config) => config.slug === qaParamData.configSlug)

  const shouldFetch =
    hasPermissions && qaParamData.configSlug && qaParamData.style !== 'none' && activeQaConfig

  // Get user IDs from filter param when user-selected style is active
  const userIds =
    qaParamData.style === 'user-selected' && qaFilterParam?.users ? qaFilterParam.users : []

  const { data, isLoading, isFetching } = useQuery({
    ...qaDataForMapQueryOptions({
      configId: activeQaConfig?.id || 0,
      regionSlug: regionSlug || 'none',
      userIds,
    }),
    enabled: !!shouldFetch,
    refetchOnWindowFocus: false,
  })

  // Filter QA data based on selected style (client-side filtering since Maplibre doesn't support feature-state in filters)
  // React Compiler automatically memoizes this computation
  const filteredQaData = data ? filterQaDataByStyle(data, qaParamData.style) : []

  return {
    data,
    isLoading,
    isFetching,
    filteredQaData,
    activeQaConfig,
    qaParamData,
    shouldFetch,
  }
}
