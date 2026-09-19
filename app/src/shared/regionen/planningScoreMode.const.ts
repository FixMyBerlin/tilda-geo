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
