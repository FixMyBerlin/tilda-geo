export const getStaticDatasetUrl = (staticDatasetSlug: string, format: 'pmtiles' | 'geojson') => {
  // Remove existing extension if present
  const baseName = staticDatasetSlug.replace(/\.(pmtiles|geojson)$/, '')
  return `${process.env.NEXT_PUBLIC_APP_ORIGIN}/api/uploads/${baseName}.${format}`
}
