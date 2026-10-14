import type { SourceExportApiIdentifier } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/export/exportIdentifier'
import type { EnvironmentValues } from '@/server/envSchema'
import { getAppBaseUrl } from './getAppBaseUrl'

const buildExportApiUrl = (
  regionSlug: string,
  apiIdentifier: SourceExportApiIdentifier,
  env?: EnvironmentValues,
  apiKey?: string,
) => {
  const url = new URL(getAppBaseUrl(`/api/export/${regionSlug}/${apiIdentifier}`, env))
  if (apiKey) {
    url.searchParams.set('apiKey', apiKey)
  }
  return url
}

/** Region-slug export URL; server resolves bbox from region config. */
export const getExportOgrApiUrl = (
  regionSlug: string,
  apiIdentifier: SourceExportApiIdentifier,
  format: 'geojson' | 'gpkg' | 'fgb' = 'fgb',
  env?: EnvironmentValues,
  apiKey?: string,
) => {
  const url = buildExportApiUrl(regionSlug, apiIdentifier, env, apiKey)
  url.searchParams.set('format', format)
  return url.toString()
}
