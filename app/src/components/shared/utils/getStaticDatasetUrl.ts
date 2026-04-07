import { getAppBaseUrl } from './getAppBaseUrl'

export const getStaticDatasetUrl = (
  staticDatasetSlug: string,
  format: 'pmtiles' | 'geojson' | 'csv',
) => {
  // Remove existing extension if present
  const baseName = staticDatasetSlug.replace(/\.(pmtiles|geojson|csv)$/, '')
  return getAppBaseUrl(`/api/uploads/${baseName}.${format}`)
}
