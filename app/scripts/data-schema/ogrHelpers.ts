/** Escape a value for libpq keyword/value syntax (single-quoted). */
function quoteLibpqValue(value: string) {
  return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`
}

export function databaseUrlToOgrPg(databaseUrl: string) {
  const url = new URL(databaseUrl)
  // Build key=value pairs manually — GDAL does not URL-decode PG: connection strings.
  // Values must be single-quoted: passwords may contain spaces, `=`, `'`, or `\`.
  const parts = [
    `host=${quoteLibpqValue(url.hostname)}`,
    `port=${quoteLibpqValue(url.port || '5432')}`,
    `dbname=${quoteLibpqValue(url.pathname.replace(/^\//, ''))}`,
    `user=${quoteLibpqValue(decodeURIComponent(url.username))}`,
  ]
  if (url.password) {
    parts.push(`password=${quoteLibpqValue(decodeURIComponent(url.password))}`)
  }
  return `PG:${parts.join(' ')}`
}

/**
 * Normalise ogrinfo / WKB geometry type names for comparison.
 * ogrinfo prints "Multi Polygon"; specs use "MultiPolygon". Strips leading 3D/Measured.
 */
export function normalizeOgrGeometryType(value: string) {
  return value
    .trim()
    .replace(/^(3D|Measured)\s+/i, '')
    .replace(/\s+/g, '')
    .toLowerCase()
}

export function geometryTypesMatch(ogrinfoValue: string, expectedSpecValue: string) {
  return normalizeOgrGeometryType(ogrinfoValue) === normalizeOgrGeometryType(expectedSpecValue)
}
