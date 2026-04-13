/** One summable calculator polygon; `id` is stable in the URL and UI. */
export type DrawArea = Omit<GeoJSON.Feature<GeoJSON.Polygon>, 'id'> & {
  id: string
}
