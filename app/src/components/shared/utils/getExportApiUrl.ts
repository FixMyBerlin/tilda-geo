import type { SourceExportApiIdentifier } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/export/exportIdentifier'
import type { StaticRegion } from '@/data/regions.const'
import type { EnvironmentValues } from '@/server/envSchema'
import { appBaseUrl } from './appBaseUrl.const'

export const getBoundaryExportApiBaseUrl = (env?: EnvironmentValues) => {
  const e = env ?? import.meta.env.VITE_APP_ENV
  const url = new URL(`${appBaseUrl[e]}/api/boundary`)
  return url.toString()
}

export const getExportApiUrl = (
  regionSlug: string,
  apiIdentifier: SourceExportApiIdentifier,
  env?: EnvironmentValues,
) => {
  const e = env ?? import.meta.env.VITE_APP_ENV
  const url = new URL(`${appBaseUrl[e]}/api/export/${regionSlug}/${apiIdentifier}`)
  return url.toString()
}

export const getExportApiBboxUrl = (
  regionSlug: string,
  apiIdentifier: SourceExportApiIdentifier,
  bbox: NonNullable<StaticRegion['bbox']>,
  env?: EnvironmentValues,
  apiKey?: string,
) => {
  const url = new URL(getExportApiUrl(regionSlug, apiIdentifier, env))
  url.searchParams.append('minlon', String(bbox.min[0]))
  url.searchParams.append('minlat', String(bbox.min[1]))
  url.searchParams.append('maxlon', String(bbox.max[0]))
  url.searchParams.append('maxlat', String(bbox.max[1]))
  if (apiKey) {
    url.searchParams.append('apiKey', apiKey)
  }
  return url.toString()
}

export const getExportOgrApiBboxUrl = (
  regionSlug: string,
  apiIdentifier: SourceExportApiIdentifier,
  bbox: NonNullable<StaticRegion['bbox']>,
  format: 'geojson' | 'gpkg' | 'fgb' = 'fgb',
  env?: EnvironmentValues,
  apiKey?: string,
) => {
  const baseUrl = getExportApiBboxUrl(regionSlug, apiIdentifier, bbox, env, apiKey)
  return `${baseUrl}&format=${format}`
}
