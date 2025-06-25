export const formats = ['geojson', 'gpkg', 'fgb', 'geoparket'] as const

export const ogrFormats: Record<(typeof formats)[number], string> = {
  geojson: 'GeoJSON',
  gpkg: 'GPKG',
  fgb: 'FlatGeobuf',
  geoparket: 'Parquet',
} as const
