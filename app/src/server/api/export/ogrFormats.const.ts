export const formats = [
  'geojson',
  'gpkg',
  'fgb',
  // GeoParquet needs GDAL built with Apache Arrow. Debian gdal-bin (Trixie 3.10.3, and still unstable) does not ship that driver.
  // https://gdal.org/en/stable/drivers/vector/parquet.html
  // 'geoparquet'
] as const

type OgrFormatEntry = { driver: string; mimeType: string }
export type Formats = (typeof formats)[number]

export const ogrFormats: Record<Formats, OgrFormatEntry> = {
  geojson: { driver: 'GeoJSON', mimeType: 'application/geo+json' },
  gpkg: { driver: 'GPKG', mimeType: 'application/geopackage+sqlite3' },
  fgb: { driver: 'FlatGeobuf', mimeType: 'application/octet-stream' },
}
