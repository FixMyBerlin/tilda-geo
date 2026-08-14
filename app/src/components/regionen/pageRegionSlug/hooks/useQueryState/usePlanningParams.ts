import {
  PLANNING_SCORE_PROPERTY,
  type PlanningScoreMode,
} from '@/shared/regionen/planningScoreMode.const'
import type { RegionSearch } from '@/shared/regionen/regionSearchSchemas'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { useRegionSearchNavigation } from './useRegionSearchNavigation'

export type { PlanningScoreMode }
export { PLANNING_SCORE_PROPERTY }

const usePlanningSearchParam = <Key extends keyof RegionSearch>(key: Key) => {
  const { search, updateSearch } = useRegionSearchNavigation()
  const value = search[key]
  const setValue = (next: RegionSearch[Key] | null) => {
    updateSearch({ [key]: next === null ? undefined : next } as Partial<RegionSearch>)
  }
  return [value, setValue] as const
}

/** Whether the interactive planning mode is active (entry from the map). */
export const usePlanningModeParam = () => usePlanningSearchParam(searchParamsRegistry.planning)

/** Active planungsgebiet id (geometry context). */
export const usePlanningAreaParam = () => usePlanningSearchParam(searchParamsRegistry.planningArea)

/**
 * Active variant id. Falls back to legacy `planningScenario` param for old shared links.
 */
export const usePlanningVariantParam = () => {
  const { search, updateSearch } = useRegionSearchNavigation()
  const value =
    search[searchParamsRegistry.planningVariant] ??
    search[searchParamsRegistry.planningScenario] ??
    undefined
  const setValue = (next: number | null) => {
    updateSearch({
      [searchParamsRegistry.planningVariant]: next === null ? undefined : next,
      [searchParamsRegistry.planningScenario]: undefined,
    })
  }
  return [value, setValue] as const
}

export const usePlanningRunParam = () => usePlanningSearchParam(searchParamsRegistry.planningRun)

export const usePlanningScoreParam = () =>
  usePlanningSearchParam(searchParamsRegistry.planningScore)

export const usePlanningHexagonsVisibleParam = () =>
  usePlanningSearchParam(searchParamsRegistry.planningHexagons)

export const usePlanningHexagonsOpacityParam = () =>
  usePlanningSearchParam(searchParamsRegistry.planningHexagonsOpacity)

export const usePlanningMinAreaParam = () =>
  usePlanningSearchParam(searchParamsRegistry.planningMinArea)

export const usePlanningAreaFilterParam = () =>
  usePlanningSearchParam(searchParamsRegistry.planningAreaFilter)
