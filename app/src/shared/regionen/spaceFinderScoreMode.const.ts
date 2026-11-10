/**
 * Which of the three probabilities colors the hexagons (Issue #3415):
 * - 'kombination': the combined score `mce_gesamtscore` (default, unchanged behavior)
 * - 'bedarf': demand probability `score_bedarf`
 * - 'bebauung': buildability probability `score_bebauung`
 */
export const SPACE_FINDER_SCORE_MODES = ['kombination', 'bedarf', 'bebauung'] as const
export type SpaceFinderScoreMode = (typeof SPACE_FINDER_SCORE_MODES)[number]

/** Tile property colored for each display mode. */
export const SPACE_FINDER_SCORE_PROPERTY: Record<SpaceFinderScoreMode, string> = {
  kombination: 'mce_gesamtscore',
  bedarf: 'score_bedarf',
  bebauung: 'score_bebauung',
}
