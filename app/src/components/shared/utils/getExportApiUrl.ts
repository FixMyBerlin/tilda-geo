import type { SourceExportApiIdentifier } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/export/exportIdentifier'
import type { StaticRegion } from '@/data/regions.const'
import type { EnvironmentValues } from '@/server/envSchema'
import { getAppBaseUrl } from './getAppBaseUrl'

export const getBoundaryExportApiBaseUrl = (env?: EnvironmentValues) => {
  return getAppBaseUrl('/api/boundary', env)
}

export const getExportApiBboxUrl = (
  regionSlug: string,
  apiIdentifier: SourceExportApiIdentifier,
  bbox: NonNullable<StaticRegion['bbox']>,
  env?: EnvironmentValues,
  apiKey?: string,
) => {
  const url = new URL(getAppBaseUrl(`/api/export/${regionSlug}/${apiIdentifier}`, env))
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
