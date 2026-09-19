export const searchParamsRegistry = {
  // URL migration version written by migrateUrl; kept in the typed search so client-side navigations preserve it and the layout loader does not re-run migrations
  v: 'v',
  map: 'map',
  config: 'config',
  data: 'data',
  f: 'f', // selected features
  bg: 'bg',
  bg3d: 'bg3d',
  draw: 'draw',
  debugMap: 'debugMap',
  qa: 'qa', // QA mode JSON: key, status, users, search
  dialog: 'dialog',
  welcomeSkipDialog: '__skipDialog',
  notes: 'notes', // JSON: key (folder id or `osm`), search, extent, chips, new (compose pin) (`notesModeParam.ts`)
  review: 'review', // JSON: key, search, extent, status, source, new, move (`reviewListsModeParam.ts`)
  planning: 'planning',
  planningArea: 'planningArea',
  planningVariant: 'planningVariant',
  /** @deprecated Use planningVariant — kept for one release of URL compat. */
  planningScenario: 'planningScenario',
  planningRun: 'planningRun',
  planningScore: 'planningScore', // which probability colors the hexagons (bedarf/bebauung/kombination)
  planningHexagons: 'planningHexagons', // whether the hexagon result layer is visible
  planningHexagonsOpacity: 'planningHexagonsOpacity', // opacity (0-100%) of the hexagon result layer; 0 = same as planningHexagons=false
  planningMinArea: 'planningMinArea', // gesuchte Mindestfläche (m²), Client-Filter auf cluster_area_m2
  planningAreaFilter: 'planningAreaFilter', // ob der Zielgrößen-Filter aktiv ist
} as const
