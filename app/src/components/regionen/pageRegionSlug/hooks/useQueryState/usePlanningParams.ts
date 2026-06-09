import { parseAsBoolean, parseAsInteger, useQueryState } from 'nuqs'

/** Whether the interactive planning mode is active (entry from the map). */
export const usePlanningModeParam = () =>
  useQueryState('planning', parseAsBoolean.withDefault(false))

/**
 * Planning-mode URL state (shareable). Both are absent in the normal viewer, so
 * the planning map layers render nothing there.
 *
 * - planningScenario: the active scenario id being edited/viewed.
 * - planningRun: the run id whose immutable result tiles are displayed
 *   (drives the `?run_id=N` Martin function source + long-lived tile cache).
 */
export const usePlanningScenarioParam = () => useQueryState('planningScenario', parseAsInteger)

export const usePlanningRunParam = () => useQueryState('planningRun', parseAsInteger)
