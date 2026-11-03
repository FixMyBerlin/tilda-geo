export const spaceFinderTileLayers = ['hexagons', 'vegetation', 'carriageways', 'census'] as const

export type SpaceFinderTileLayer = (typeof spaceFinderTileLayers)[number]

/**
 * Tile URL template of the authenticated Flächenfinder tile route
 * (`routes/api/regions.$regionSlug.space-finder-tiles.$layer.$z.$x.$y.ts`). Same origin as the app, so
 * MapLibre sends the session cookie. `run_id` is part of the URL (a run is immutable, so the browser
 * can cache per URL); the route checks that the run belongs to `regionSlug`.
 */
export const spaceFinderTilesPath = (
  regionSlug: string,
  layer: SpaceFinderTileLayer,
  runId: number,
) => `/api/regions/${regionSlug}/space-finder-tiles/${layer}/{z}/{x}/{y}?run_id=${runId}`
