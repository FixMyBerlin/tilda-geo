/**
 * The Flächenfinder result comes in two grids (see `planning_hexagons` in martin_functions.sql):
 * fine cells (H3 resolution 13, one candidate area each) from zoom 16, below that coarse cells
 * (resolution 11) that only hold scores averaged over their 49 fine cells — no exclusion reasons,
 * no per-dataset breakdown.
 */
export const FINE_HEXAGON_MIN_ZOOM = 16

const FINE_H3_RESOLUTION = 13

/**
 * Coarse (averaged) cell? The H3 resolution is the second hex digit of the cell id (`8d…` = 13,
 * `8b…` = 11) — no h3-js and no extra tile attribute needed.
 */
export const isCoarseHexagon = (h3Id: unknown) =>
  typeof h3Id === 'string' && Number.parseInt(h3Id.charAt(1), 16) < FINE_H3_RESOLUTION
