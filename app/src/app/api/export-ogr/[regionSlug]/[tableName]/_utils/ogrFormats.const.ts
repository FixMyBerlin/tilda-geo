export const formats = [
  'geojson',
  'gpkg',
  'fgb',
  // geoparket requires gdal 3.9+ which is not available in node:22-bookworm-slim (app.Dockerfile)
  // (see https://gdal.org/en/stable/drivers/vector/parquet.html)
  // 'geoparket'
] as const

export type Formats = keyof typeof ogrFormats

export const ogrFormats: Record<(typeof formats)[number], string> = {
  geojson: 'GeoJSON',
  gpkg: 'GPKG',
  fgb: 'FlatGeobuf',
  // geoparket: 'Parquet',
} as const
