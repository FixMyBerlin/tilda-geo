// `reproject` and `epsg` ship no types. Minimal ambient declarations for the
// subset used by `planningGeoConversion.ts`.
declare module 'reproject' {
  export function toWgs84<T extends GeoJSON.GeoJSON>(
    geojson: T,
    from?: unknown,
    crss?: Record<string, string>,
  ): T
}

declare module 'epsg' {
  const defs: Record<string, string>
  export default defs
}
