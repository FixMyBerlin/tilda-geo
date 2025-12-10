import { MapDataSourceInspectorEditor } from '@/src/app/regionen/[regionSlug]/_mapData/types'
import { envKey } from './isEnv'

const osmUrls = {
  development: 'https://www.openstreetmap.org',
  staging: 'https://www.openstreetmap.org',
  production: 'https://www.openstreetmap.org',
} as const

const osmApiUrls = {
  // REMINDER: Those URLs are tied to the `OSM_CLIENT_ID`, `OSM_CLIENT_SECRET` .env variables
  // See also: https://wiki.openstreetmap.org/wiki/Sandbox_for_editing
  // development: 'https://master.apis.dev.openstreetmap.org/api/0.6',
  // staging: 'https://master.apis.dev.openstreetmap.org/api/0.6',
  //
  // Currently the osm-staging side is down, so we use osm.org everywhere
  development: 'https://api.openstreetmap.org/api/0.6',
  staging: 'https://api.openstreetmap.org/api/0.6',
  production: 'https://api.openstreetmap.org/api/0.6',
} as const

export const getOsmUrl = (path?: string) => {
  const base = osmUrls[envKey]

  return (path ? `${base}${path}` : base) satisfies MapDataSourceInspectorEditor['urlTemplate']
}

export const getOsmApiUrl = (path?: string) => {
  const base = osmApiUrls[envKey]

  return (path ? `${base}${path}` : base) satisfies MapDataSourceInspectorEditor['urlTemplate']
}
