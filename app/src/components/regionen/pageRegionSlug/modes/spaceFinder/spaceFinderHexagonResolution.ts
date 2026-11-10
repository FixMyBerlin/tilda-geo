/**
 * The Flächenfinder result comes in two grids (see `space_finder_hexagons` in martin_functions.sql):
 * fine cells (H3 resolution 13, one candidate area each) and coarse cells (resolution 11) that hold
 * the mean of the best 7 of their 49 fine cells per score column (≈ the best 300 m²; each column
 * picks its own cells) — no exclusion reasons, no per-dataset breakdown.
 *
 * The map switches from the coarse to the fine grid at one zoom, FINE_HEXAGON_ZOOM — colors and
 * clicks together. From FINE_HEXAGON_PREVIEW_ZOOM on, the outlines of the fine cells fade in on top
 * of the coarse colors, so zooming in hints that each coarse cell is about to split up.
 */
export const FINE_HEXAGON_PREVIEW_ZOOM = 15
export const FINE_HEXAGON_ZOOM = 16

const FINE_H3_RESOLUTION = 13

/**
 * Coarse (overview) cell? The H3 resolution is the second hex digit of the cell id (`8d…` = 13,
 * `8b…` = 11) — no h3-js and no extra tile attribute needed.
 */
export const isCoarseHexagon = (h3Id: unknown) =>
  typeof h3Id === 'string' && Number.parseInt(h3Id.charAt(1), 16) < FINE_H3_RESOLUTION

/** Does this cell belong to the grid that takes clicks and hover at this zoom? */
export const isActiveHexagonGrid = (h3Id: unknown, zoom: number) =>
  isCoarseHexagon(h3Id) === zoom < FINE_HEXAGON_ZOOM
