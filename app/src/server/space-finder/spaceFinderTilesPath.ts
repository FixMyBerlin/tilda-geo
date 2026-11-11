export const spaceFinderTileLayers = ['hexagons', 'vegetation', 'carriageways', 'census'] as const

export type SpaceFinderTileLayer = (typeof spaceFinderTileLayers)[number]

/**
 * H3 resolutions of the hexagon layer: 11 = coarse cells (scores averaged over their 49 fine
 * cells), 13 = fine cells (one candidate area each). Must match AGG_H3_RES/BASE_H3_RES in
 * space-finder-worker/scoring/scorer.py.
 */
export const spaceFinderHexagonResolutions = ['11', '13'] as const

export type SpaceFinderHexagonResolution = (typeof spaceFinderHexagonResolutions)[number]

/**
 * Tile URL template of the authenticated Flächenfinder tile route
 * (`routes/api/regions.$regionSlug.space-finder-tiles.$layer.$z.$x.$y.ts`). Same origin as the app, so
 * MapLibre sends the session cookie. `run_id` is part of the URL (a run is immutable, so the browser
 * can cache per URL); the route checks that the run belongs to `regionSlug`. `res` pins the
 * hexagon grid so the map can load both grids around the switch at z16; without it the tile
 * function picks the grid by zoom.
 *
 * `agg` is the version of the coarse-cell aggregation (`aggregate_hexagons` in the worker). Bump it
 * when old runs get their coarse cells rebuilt, so browsers drop their cached hexagon tiles.
 */
const HEXAGON_AGGREGATION_VERSION = 2

export const spaceFinderTilesPath = (
  regionSlug: string,
  layer: SpaceFinderTileLayer,
  runId: number,
  res?: SpaceFinderHexagonResolution,
) =>
  `/api/regions/${regionSlug}/space-finder-tiles/${layer}/{z}/{x}/{y}?run_id=${runId}${res ? `&res=${res}` : ''}${layer === 'hexagons' ? `&agg=${HEXAGON_AGGREGATION_VERSION}` : ''}`
