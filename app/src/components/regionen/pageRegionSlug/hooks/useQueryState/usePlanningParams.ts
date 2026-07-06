import { parseAsBoolean, parseAsInteger, parseAsStringLiteral, useQueryState } from 'nuqs'

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

/**
 * Which of the three probabilities colors the hexagons (Issue #3415):
 * - 'kombination': the combined score `mce_gesamtscore` (default, unchanged behavior)
 * - 'bedarf': demand probability `score_bedarf`
 * - 'bebauung': buildability probability `score_bebauung`
 */
export const PLANNING_SCORE_MODES = ['kombination', 'bedarf', 'bebauung'] as const
export type PlanningScoreMode = (typeof PLANNING_SCORE_MODES)[number]

/** Tile property colored for each display mode. */
export const PLANNING_SCORE_PROPERTY: Record<PlanningScoreMode, string> = {
  kombination: 'mce_gesamtscore',
  bedarf: 'score_bedarf',
  bebauung: 'score_bebauung',
}

export const usePlanningScoreParam = () =>
  useQueryState(
    'planningScore',
    parseAsStringLiteral(PLANNING_SCORE_MODES).withDefault('kombination'),
  )

/**
 * Whether the hexagon result layer is visible. Toggled off via the icon state in
 * the "Anzeige" switcher (ScoreModeSwitcher); the color mode is preserved so
 * turning the layer back on restores the previous display mode.
 */
export const usePlanningHexagonsVisibleParam = () =>
  useQueryState('planningHexagons', parseAsBoolean.withDefault(true))

/**
 * Gesuchte Mindestfläche (m²) für die Flächensuche (Client-Filter auf die
 * persistierte Tile-Spalte `cluster_area_m2`, siehe SourcesLayersPlanning).
 * Bleibt auch erhalten, wenn der Filter per Checkbox (planningAreaFilter)
 * ausgeschaltet wird, damit der Wert beim Wiedereinschalten nicht neu
 * eingegeben werden muss.
 */
export const usePlanningMinAreaParam = () =>
  useQueryState('planningMinArea', parseAsInteger.withDefault(0))

/**
 * Ob der Zielgrößen-Filter aktiv ist. Getrennt von `planningMinArea`, damit man
 * per Checkbox jederzeit zur ungefilterten Ansicht (alle Hexagone normal
 * eingefärbt, wie vor Einführung des Filters) zurückschalten kann, ohne die
 * eingegebene Fläche zu verlieren.
 */
export const usePlanningAreaFilterParam = () =>
  useQueryState('planningAreaFilter', parseAsBoolean.withDefault(false))
