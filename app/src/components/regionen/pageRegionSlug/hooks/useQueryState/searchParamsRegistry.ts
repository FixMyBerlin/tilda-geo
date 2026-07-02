export const searchParamsRegistry = {
  map: 'map',
  config: 'config',
  data: 'data',
  f: 'f', // selected features
  bg: 'bg',
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
  planning: 'planning',
  planningScenario: 'planningScenario',
  planningRun: 'planningRun',
  planningScore: 'planningScore', // which probability colors the hexagons (bedarf/bebauung/kombination)
  planningHexagons: 'planningHexagons', // whether the hexagon result layer is visible
} as const
