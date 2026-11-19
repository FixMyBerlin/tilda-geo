/**
 * »Beste Standorte«: 'area' ranks the best hexagon of each contiguous area (X places instead of
 * X neighbors in one spot), 'hexagon' the X best hexagons wherever they lie.
 */
export const SPACE_FINDER_TOP_BY = ['area', 'hexagon'] as const
export type SpaceFinderTopBy = (typeof SPACE_FINDER_TOP_BY)[number]

export const SPACE_FINDER_TOP_DEFAULT = 10
export const SPACE_FINDER_TOP_MAX = 100
