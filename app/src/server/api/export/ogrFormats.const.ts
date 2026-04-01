export const formats = [
  'geojson',
  'gpkg',
  'fgb',
  // geoparket requires gdal 3.9+ which is not available in node:22-bookworm-slim (app.Dockerfile)
  // (see https://gdal.org/en/stable/drivers/vector/parquet.html)
  // 'geoparket'
] as const

type OgrFormatEntry = { driver: string; mimeType: string }
export type Formats = (typeof formats)[number]

export const ogrFormats: Record<Formats, OgrFormatEntry> = {
  geojson: { driver: 'GeoJSON', mimeType: 'application/geo+json' },
  gpkg: { driver: 'GPKG', mimeType: 'application/geopackage+sqlite3' },
  fgb: { driver: 'FlatGeobuf', mimeType: 'application/octet-stream' },
}
