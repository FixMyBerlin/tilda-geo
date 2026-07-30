import type { SourceExportApiIdentifier } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/export/exportIdentifier'
import type { EnvironmentValues } from '@/server/envSchema'
import type { RegionGeoJsonBBox } from '@/server/regions/regionGeoJson'
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

/**
 * Export URL with explicit bbox query params.
 *
 * Deprecated as a public API — prefer {@link getExportOgrApiUrl}. Custom bbox params will
 * eventually be restricted to admins only. Kept for scripts and temporary API clients.
 */
export const getExportOgrApiBboxUrl = (
  regionSlug: string,
  apiIdentifier: SourceExportApiIdentifier,
  bbox: RegionGeoJsonBBox,
  format: 'geojson' | 'gpkg' | 'fgb' = 'fgb',
  env?: EnvironmentValues,
  apiKey?: string,
) => {
  const url = buildExportApiUrl(regionSlug, apiIdentifier, env, apiKey)
  const [minLng, minLat, maxLng, maxLat] = bbox
  url.searchParams.set('minlon', String(minLng))
  url.searchParams.set('minlat', String(minLat))
  url.searchParams.set('maxlon', String(maxLng))
  url.searchParams.set('maxlat', String(maxLat))
  url.searchParams.set('format', format)
  return url.toString()
}
