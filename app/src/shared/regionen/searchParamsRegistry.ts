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
} as const
