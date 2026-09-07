import { useQuery } from '@tanstack/react-query'
import {
  SYSTEM_STATUS_TO_LETTER,
  USER_STATUS_TO_LETTER,
} from '@/components/regionen/pageRegionSlug/modes/qa/detail/qaConfigs'
import { QA_STATUS_OPTIONS } from '@/components/regionen/pageRegionSlug/modes/qa/qaConfigStyles'
import { useRegionSlug } from '@/components/regionen/pageRegionSlug/regionUtils/useRegionSlug'
import { useHasPermissions } from '@/components/shared/hooks/useHasPermissions'
import type { QaMapData } from '@/server/qa-configs/queries/getQaDataForMap.server'
import {
  qaDataForMapQueryOptions,
  regionQaConfigsQueryOptions,
} from '@/server/regions/regionQueryOptions'
import { useQaParam } from '../useQueryState/useQaParam'

export const qaMapDataQueryOptions = (opts: {
  configSlug: string
  regionSlug: string
  userIds?: string[]
  search?: string
}) => qaDataForMapQueryOptions(opts)

export const qaMapRowMatchesStatus = (
  item: Pick<QaMapData, 'systemStatus' | 'userStatus'>,
  status: string | undefined,
) => {
  const option = status ? QA_STATUS_OPTIONS.find((entry) => entry.key === status) : undefined
  if (!option) return true

  const userMatches =
    option.userStatus === null
      ? item.userStatus === null
      : item.userStatus === USER_STATUS_TO_LETTER[option.userStatus]
  const systemMatches =
    option.systemStatus === null
      ? true
      : item.systemStatus === SYSTEM_STATUS_TO_LETTER[option.systemStatus]
  return userMatches && systemMatches
}

export const upsertQaMapDataRow = <T extends { areaId: string }>(current: readonly T[], row: T) => {
  const exists = current.some((item) => item.areaId === row.areaId)
  if (exists) {
    return current.map((item) => (item.areaId === row.areaId ? row : item))
  }
  return [...current, row]
}

export const restoreQaMapDataRow = <T extends { areaId: string }>(
  current: readonly T[],
  areaId: string,
  previousRow: T | undefined,
) => {
  if (previousRow) return upsertQaMapDataRow(current, previousRow)
  return current.filter((item) => item.areaId !== areaId)
}

export const useQaMapData = () => {
  const hasPermissions = useHasPermissions()
  const { qaParamData } = useQaParam()
  const regionSlug = useRegionSlug()
  const { data: qaConfigs } = useQuery({
    ...regionQaConfigsQueryOptions(regionSlug ?? ''),
    enabled: hasPermissions && Boolean(regionSlug),
  })

  const activeQaConfig = qaConfigs?.find((config) => config.slug === qaParamData.key)

  const shouldFetch = hasPermissions && qaParamData.key && activeQaConfig

  const userIds = qaParamData.users ?? []

  const { data, isLoading, isFetching } = useQuery({
    ...qaMapDataQueryOptions({
      configSlug: qaParamData.key,
      regionSlug: regionSlug || 'none',
      userIds,
      search: qaParamData.search,
    }),
    enabled: !!shouldFetch,
    refetchOnWindowFocus: false,
  })

  const qaDataByAreaId = new Map((data ?? []).map((item) => [item.areaId, item]))

  return {
    data,
    isLoading,
    isFetching,
    qaDataByAreaId,
    activeQaConfig,
    qaParamData,
    shouldFetch,
  }
}
