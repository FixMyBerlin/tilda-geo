export const planningTileLayers = ['hexagons', 'vegetation', 'carriageways', 'census'] as const

export type PlanningTileLayer = (typeof planningTileLayers)[number]

/**
 * Tile URL template of the authenticated planning tile route
 * (`routes/api/regions.$regionSlug.planning-tiles.$layer.$z.$x.$y.ts`). Same origin as the app, so
 * MapLibre sends the session cookie. `run_id` is part of the URL (a run is immutable, so the browser
 * can cache per URL); the route checks that the run belongs to `regionSlug`.
 */
export const planningTilesPath = (regionSlug: string, layer: PlanningTileLayer, runId: number) =>
  `/api/regions/${regionSlug}/planning-tiles/${layer}/{z}/{x}/{y}?run_id=${runId}`
