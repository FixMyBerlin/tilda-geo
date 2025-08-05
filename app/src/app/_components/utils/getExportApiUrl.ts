import { SourceExportApiIdentifier } from '@/src/app/regionen/[regionSlug]/_mapData/mapDataSources/export/exportIdentifier'
import { StaticRegion } from '@/src/data/regions.const'
import { appBaseUrl } from './appBaseUrl.const'

export const getBoundaryExportApiBaseUrl = (env?: typeof process.env.NEXT_PUBLIC_APP_ENV) => {
  env = env ?? process.env.NEXT_PUBLIC_APP_ENV
  const url = new URL(`${appBaseUrl[env]}/api/boundary`)

  return url.toString()
}

export const getExportApiUrl = (
  regionSlug: string,
  apiIdentifier: SourceExportApiIdentifier,
  env?: typeof process.env.NEXT_PUBLIC_APP_ENV,
) => {
  env = env ?? process.env.NEXT_PUBLIC_APP_ENV
  const url = new URL(`${appBaseUrl[env]}/api/export/${regionSlug}/${apiIdentifier}`)

  return url.toString()
}

export const getExportApiBboxUrl = (
  regionSlug: string,
  apiIdentifier: SourceExportApiIdentifier,
  bbox: NonNullable<StaticRegion['bbox']>,
  env?: typeof process.env.NEXT_PUBLIC_APP_ENV,
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
  env?: typeof process.env.NEXT_PUBLIC_APP_ENV,
  apiKey?: string,
) => {
  const baseUrl = getExportApiBboxUrl(regionSlug, apiIdentifier, bbox, env, apiKey)
  return `${baseUrl.replace('export', 'export-ogr')}&format=${format}`
}
