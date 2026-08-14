export const searchParamsRegistry = {
  map: 'map',
  config: 'config',
  data: 'data',
  f: 'f', // selected features
  bg: 'bg',
  bg3d: 'bg3d',
  draw: 'draw',
  osmNotes: 'osmNotes', // show osmNotes on the map
  osmNote: 'osmNote', // show new osmNotes dialogue
  atlasNotes: 'notes', // show atlasNotes on the map
  atlasNote: 'atlasNote', // show new atlasNotes dialogue
  atlasNotesFilter: 'atlasNotesFilter', // TODO: We renamed everything to internalNotes except the URL param. We need to add a migration for this.
  osmNotesFilter: 'osmNotesFilter',
  debugMap: 'debugMap',
  qa: 'qa', // QA layer selection
  qaFilter: 'qaFilter', // QA filter params
  dialog: 'dialog',
  welcomeSkipDialog: '__skipDialog',
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
