import wasmUrl from '@ngageoint/geopackage/dist/sql-wasm.wasm?url'

/**
 * Client-side preprocessing for the Planning-module GeoJSON uploads (study area /
 * user obstacles): converts GeoPackage files to GeoJSON and reprojects legacy
 * `crs`-tagged GeoJSON to WGS84. Both paths dynamically import their (WASM-backed)
 * dependency so a normal, already-valid WGS84 GeoJSON upload never pays for either.
 */

const CRS_MEMBER_RE = /"crs"\s*:/

/** True when the file name suggests a GeoPackage that needs conversion to GeoJSON first. */
export function isGeopackageFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.gpkg')
}

/** Cheap textual pre-check so callers can skip the reproject/epsg import for the common case. */
export function mightNeedReprojection(rawText: string): boolean {
  return CRS_MEMBER_RE.test(rawText)
}

/**
 * Reads a `.gpkg` file and merges all of its feature tables into a single GeoJSON
 * `FeatureCollection`. Each table is already reprojected to WGS84 while reading, using the
 * CRS stored in the GeoPackage's own `gpkg_spatial_ref_sys` table — no separate reprojection
 * step needed here. Dynamically imports `@ngageoint/geopackage` (SQLite-WASM, ~1-2 MB).
 */
export async function convertGeopackageToGeoJson(file: File): Promise<GeoJSON.FeatureCollection> {
  const { GeoPackageAPI, setSqljsWasmLocateFile } = await import('@ngageoint/geopackage')
  setSqljsWasmLocateFile(() => wasmUrl)
  const geoPackage = await GeoPackageAPI.open(new Uint8Array(await file.arrayBuffer()))
  try {
    const features: GeoJSON.Feature[] = []
    for (const tableName of geoPackage.getFeatureTables()) {
      for (const feature of geoPackage.iterateGeoJSONFeatures(tableName)) {
        features.push(feature as GeoJSON.Feature)
      }
    }
    if (features.length === 0)
      throw new Error('Das GeoPackage enthält keine Feature-Tabelle mit Geometrien.')
    return { type: 'FeatureCollection', features }
  } finally {
    geoPackage.close()
  }
}

/**
 * Reprojects a parsed GeoJSON that carries a legacy `crs` member (e.g. a QGIS export with
 * "alten CRS beibehalten") to WGS84. Returns the input unchanged when no `crs` member is
 * present — the common case, where the file is assumed to already be WGS84 per RFC 7946.
 * Dynamically imports `reproject` + the `epsg` definition table (~500 KB total).
 */
export async function reprojectToWgs84<T extends GeoJSON.GeoJSON>(geojson: T): Promise<T> {
  if (!('crs' in geojson) || geojson.crs == null) return geojson
  const [{ toWgs84 }, { default: epsgDefs }] = await Promise.all([
    import('reproject'),
    import('epsg'),
  ])
  let result: T
  try {
    result = toWgs84(geojson, undefined, epsgDefs)
  } catch (error) {
    throw new Error(
      `Das im GeoJSON angegebene Koordinatensystem konnte nicht reprojiziert werden: ${(error as Error).message}`,
    )
  }
  // `reproject` only strips `crs` from bare Geometry nodes, not from a Feature/
  // FeatureCollection wrapper — remove the now-stale, misleading member ourselves.
  const withoutCrs = result as GeoJSON.GeoJSON & Record<string, unknown>
  delete withoutCrs.crs
  return withoutCrs as T
}
