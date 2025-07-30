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
} as const
