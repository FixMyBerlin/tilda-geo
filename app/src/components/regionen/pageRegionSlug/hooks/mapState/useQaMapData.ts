import { useQuery } from '@tanstack/react-query'
import { QA_STATUS_OPTIONS } from '@/components/regionen/pageRegionSlug/modes/qa/qaConfigStyles'
import { useRegionSlug } from '@/components/regionen/pageRegionSlug/regionUtils/useRegionSlug'
import { useHasPermissions } from '@/components/shared/hooks/useHasPermissions'
import type { QaEvaluationStatus } from '@/prisma/generated/browser'
import type { QaIndicator } from '@/server/qa-configs/schemas/qaIndicatorsSchema'
import {
  qaDataForMapQueryOptions,
  regionQaConfigsQueryOptions,
} from '@/server/regions/regionQueryOptions'
import {
  decodeQaStatusLetters,
  encodeQaStatusLetters,
  type QaIndicatorStatusPair,
} from '@/shared/qaIndicatorStatus'
import { qaMapDefaultIndicatorPairs } from '@/shared/qaMapDefaultStatus'
import { useQaParam } from '../useQueryState/useQaParam'

/**
 * One payload row per cell (`getQaDataForMap`): `sys`/`usr` carry one letter per
 * indicator, in `QaConfig.indicators` order (`decodeQaStatusLetters`).
 */
export type QaMapDataRow = {
  areaId: string
  sys: string
  usr: string
}

export const qaMapDataQueryOptions = (opts: {
  configSlug: string
  regionSlug: string
  userIds?: string[]
  search?: string
}) => qaDataForMapQueryOptions(opts)

/**
 * Decodes one payload row into per-indicator pairs. `undefined` rows fall back to the map default
 * (every indicator Gut) only when the payload is the unfiltered, full config (`applyDefault`) —
 * otherwise the cell is absent because a user/search filter excluded it, not because it is default.
 */
export const resolveQaIndicatorPairs = (
  row: QaMapDataRow | undefined,
  indicatorCount: number,
  applyDefault: boolean,
) => {
  if (row) return decodeQaStatusLetters(row.sys, row.usr)
  if (applyDefault) return qaMapDefaultIndicatorPairs(indicatorCount)
  return undefined
}

/** Keeps only the selected indicators (by key), in `indicators` order. Absent selection = all. */
export const selectQaIndicatorPairs = <T>(
  pairs: T[],
  indicators: readonly { key: string }[],
  selectedKeys: readonly string[] | undefined,
) => {
  if (!selectedKeys || selectedKeys.length === 0) return pairs
  return pairs.filter((_, index) => selectedKeys.includes(indicators[index]!.key))
}

/** A cell matches a status option when ANY of its (already indicator-selected) pairs matches. */
export const qaMapRowMatchesStatus = (
  pairs: QaIndicatorStatusPair[],
  status: string | undefined,
) => {
  const option = status ? QA_STATUS_OPTIONS.find((entry) => entry.key === status) : undefined
  if (!option) return true

  return pairs.some((pair) => {
    const userMatches =
      option.userStatus === null ? pair.userStatus === null : pair.userStatus === option.userStatus
    const systemMatches = option.systemStatus === null || pair.systemStatus === option.systemStatus
    return userMatches && systemMatches
  })
}

/**
 * Optimistic update after a submission: only the decided indicators' letters change, every other
 * indicator (and its system status) is carried over unchanged.
 */
export const applyQaDecisionsToMapRow = (
  row: QaMapDataRow | undefined,
  areaId: string,
  indicators: readonly { key: string }[],
  decisions: readonly { indicatorKey: string; userStatus: QaEvaluationStatus }[],
  applyDefault: boolean,
) => {
  const pairs =
    resolveQaIndicatorPairs(row, indicators.length, applyDefault) ??
    qaMapDefaultIndicatorPairs(indicators.length)

  const nextPairs = pairs.map((pair, index) => {
    const decision = decisions.find((entry) => entry.indicatorKey === indicators[index]?.key)
    return decision ? { ...pair, userStatus: decision.userStatus } : pair
  })

  return { areaId, ...encodeQaStatusLetters(nextPairs) } satisfies QaMapDataRow
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

const NO_INDICATORS: QaIndicator[] = []

export const useQaMapData = () => {
  const hasPermissions = useHasPermissions()
  const { qaParamData } = useQaParam()
  const regionSlug = useRegionSlug()
  const { data: qaConfigs } = useQuery({
    ...regionQaConfigsQueryOptions(regionSlug ?? ''),
    enabled: hasPermissions && Boolean(regionSlug),
  })

  const activeQaConfig = qaConfigs?.find((config) => config.slug === qaParamData.key)
  const indicators = activeQaConfig?.indicators ?? NO_INDICATORS

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
    indicators,
    qaParamData,
    shouldFetch,
  }
}
