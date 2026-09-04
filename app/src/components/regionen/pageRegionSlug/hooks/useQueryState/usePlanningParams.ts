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

type PlanningSelection = {
  area: number | null
  variant: number | null
  run: number | null
  /** When set, also writes `planning` in the same navigation (leave-mode must not race). */
  planning?: boolean
}

/** Search patch for one atomic planningArea + variant + run (+ optional mode) write. */
export const planningSelectionSearch = (selection: PlanningSelection) => ({
  [searchParamsRegistry.planningArea]: selection.area === null ? undefined : selection.area,
  [searchParamsRegistry.planningVariant]:
    selection.variant === null ? undefined : selection.variant,
  [searchParamsRegistry.planningScenario]: undefined,
  [searchParamsRegistry.planningRun]: selection.run === null ? undefined : selection.run,
  ...(selection.planning === undefined
    ? {}
    : { [searchParamsRegistry.planning]: selection.planning ? true : undefined }),
})

/**
 * Write planningArea + planningVariant + planningRun in one navigation so map
 * overlays (hexagon tiles) and the dropdown stay in sync across create/delete/switch.
 */
export const useSetPlanningSelection = () => {
  const { updateSearch } = useRegionSearchNavigation()
  return (selection: PlanningSelection) => {
    updateSearch(planningSelectionSearch(selection), { replace: true })
  }
}

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
