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

/** Floor for laptop ogr2ogr (PostGIS). Export metadata edits want 3.11+ separately. */
export const MIN_GDAL_VERSION = '3.8'

export function parseGdalVersion(text: string) {
  const match = text.match(/GDAL (\d+)\.(\d+)(?:\.(\d+))?/)
  if (!match?.[1] || !match[2]) return null
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3] ?? 0) }
}

export function gdalVersionMeetsMinimum(version: { major: number; minor: number }) {
  const [minMajor = 0, minMinor = 0] = MIN_GDAL_VERSION.split('.').map(Number)
  return version.major > minMajor || (version.major === minMajor && version.minor >= minMinor)
}
