import {
  PLANNING_SCORE_PROPERTY,
  type PlanningScoreMode,
} from '@/shared/regionen/planningScoreMode.const'
import type { RegionSearch } from '@/shared/regionen/regionSearchSchemas'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { useRegionSearchNavigation } from './useRegionSearchNavigation'

export type { PlanningScoreMode }
export { PLANNING_SCORE_PROPERTY }

/**
 * [value, setValue] pair matching the nuqs `useQueryState` shape these hooks used to return
 * (including `null` as "clear the param", which callers still rely on).
 */
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

/**
 * Planning-mode URL state (shareable). Both are absent in the normal viewer, so
 * the planning map layers render nothing there.
 *
 * - planningScenario: the active scenario id being edited/viewed.
 * - planningRun: the run id whose immutable result tiles are displayed
 *   (drives the `?run_id=N` Martin function source + long-lived tile cache).
 */
export const usePlanningScenarioParam = () =>
  usePlanningSearchParam(searchParamsRegistry.planningScenario)

export const usePlanningRunParam = () => usePlanningSearchParam(searchParamsRegistry.planningRun)

export const usePlanningScoreParam = () =>
  usePlanningSearchParam(searchParamsRegistry.planningScore)

/**
 * Whether the hexagon result layer is visible. Toggled off via the icon state in
 * the "Anzeige" switcher (ScoreModeSwitcher); the color mode is preserved so
 * turning the layer back on restores the previous display mode.
 */
export const usePlanningHexagonsVisibleParam = () =>
  usePlanningSearchParam(searchParamsRegistry.planningHexagons)

/**
 * Deckkraft (0-100%) der Ergebnis-Hexagone. Kommt zusätzlich zu
 * usePlanningHexagonsVisibleParam, ist aber damit gekoppelt (siehe
 * ScoreModeSwitcher): 0% entspricht demselben "ausgeblendet"-Zustand wie der
 * Eye-Slash-Button, damit der Regler beim Herunterziehen auf 0 die Hexagone
 * genauso ausblendet. 100% (Default) entspricht der ursprünglichen festen
 * Layer-Deckkraft (siehe MAX_FILL_OPACITY in SourcesLayersPlanning) — der
 * Regler skaliert relativ dazu, nicht auf absolute CSS-Opacity 1.
 */
export const usePlanningHexagonsOpacityParam = () =>
  usePlanningSearchParam(searchParamsRegistry.planningHexagonsOpacity)

/**
 * Gesuchte Mindestfläche (m²) für die Flächensuche (Client-Filter auf die
 * persistierte Tile-Spalte `cluster_area_m2`, siehe SourcesLayersPlanning).
 * Bleibt auch erhalten, wenn der Filter per Checkbox (planningAreaFilter)
 * ausgeschaltet wird, damit der Wert beim Wiedereinschalten nicht neu
 * eingegeben werden muss.
 */
export const usePlanningMinAreaParam = () =>
  usePlanningSearchParam(searchParamsRegistry.planningMinArea)

/**
 * Ob der Zielgrößen-Filter aktiv ist. Getrennt von `planningMinArea`, damit man
 * per Checkbox jederzeit zur ungefilterten Ansicht (alle Hexagone normal
 * eingefärbt, wie vor Einführung des Filters) zurückschalten kann, ohne die
 * eingegebene Fläche zu verlieren.
 */
export const usePlanningAreaFilterParam = () =>
  usePlanningSearchParam(searchParamsRegistry.planningAreaFilter)
