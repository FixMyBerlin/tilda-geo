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
  osmNote: 'osmNote', // notes compose open + pin (zoom/lat/lng)
  internalNote: 'internalNote', // notes compose open + pin (zoom/lat/lng)
  debugMap: 'debugMap',
  qa: 'qa', // QA mode JSON: key, status, users, search
  dialog: 'dialog',
  welcomeSkipDialog: '__skipDialog',
  notesMode: 'notesMode', // JSON: key, search, extent, chips (`notesModeParam.ts`)
  reviewLists: 'rl', // JSON: key, search, extent, status, source, new, move (`reviewListsModeParam.ts`)
} as const
