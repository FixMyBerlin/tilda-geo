export const getStaticDatasetUrl = (
  staticDatasetSlug: string,
  format: 'pmtiles' | 'geojson' | 'csv',
) => {
  // Remove existing extension if present
  const baseName = staticDatasetSlug.replace(/\.(pmtiles|geojson|csv)$/, '')
  return `${import.meta.env.VITE_APP_ORIGIN}/api/uploads/${baseName}.${format}`
}
