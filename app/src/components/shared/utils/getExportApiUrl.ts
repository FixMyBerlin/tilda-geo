import type { SourceExportApiIdentifier } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/export/exportIdentifier'
import type { EnvironmentValues } from '@/server/envSchema'
import type { RegionGeoJsonBBox } from '@/server/regions/regionGeoJson'
import { getAppBaseUrl } from './getAppBaseUrl'

const getExportApiBboxUrl = (
  regionSlug: string,
  apiIdentifier: SourceExportApiIdentifier,
  bbox: RegionGeoJsonBBox,
  env?: EnvironmentValues,
  apiKey?: string,
) => {
  const url = new URL(getAppBaseUrl(`/api/export/${regionSlug}/${apiIdentifier}`, env))
  const [minLng, minLat, maxLng, maxLat] = bbox
  url.searchParams.append('minlon', String(minLng))
  url.searchParams.append('minlat', String(minLat))
  url.searchParams.append('maxlon', String(maxLng))
  url.searchParams.append('maxlat', String(maxLat))
  if (apiKey) {
    url.searchParams.append('apiKey', apiKey)
  }
  return url.toString()
}

export const getExportOgrApiBboxUrl = (
  regionSlug: string,
  apiIdentifier: SourceExportApiIdentifier,
  bbox: RegionGeoJsonBBox,
  format: 'geojson' | 'gpkg' | 'fgb' = 'fgb',
  env?: EnvironmentValues,
  apiKey?: string,
) => {
  const baseUrl = getExportApiBboxUrl(regionSlug, apiIdentifier, bbox, env, apiKey)
  return `${baseUrl}&format=${format}`
}
