/** One summable calculator polygon; `id` is its position in `sum.areas` (`calculatorAreaId`). */
export type DrawArea = Omit<GeoJSON.Feature<GeoJSON.Polygon>, 'id'> & {
  id: string
}
