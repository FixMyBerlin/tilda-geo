import type { GeoJSONStoreFeatures } from 'terra-draw'
import type { DrawArea } from './drawAreaTypes'

const CALC_ID_KEY = 'tildaCalcId'

export function drawAreasToStoreFeatures(areas: DrawArea[]) {
  return areas.map(
    (area) =>
      ({
        type: 'Feature',
        id: area.id,
        geometry: area.geometry,
        properties: {
          mode: 'polygon',
          [CALC_ID_KEY]: area.id,
        },
      }) satisfies GeoJSONStoreFeatures,
  )
}

function featureToDrawArea(f: GeoJSONStoreFeatures) {
  if (f.geometry.type !== 'Polygon') return null
  const fromProp =
    typeof f.properties?.[CALC_ID_KEY] === 'string' ? f.properties[CALC_ID_KEY] : undefined
  const fromId = f.id !== undefined && f.id !== null ? String(f.id) : undefined
  const id = fromProp ?? fromId ?? crypto.randomUUID()
  // `selected` is TerraDraw UI state; keeping it would make every selection look like an edit.
  const { selected: _selected, ...properties } = f.properties ?? {}
  return {
    type: 'Feature',
    id,
    geometry: f.geometry,
    properties,
  } satisfies DrawArea
}

/** Finished polygons only; a polygon that is still being drawn is not an area yet. */
export function snapshotToDrawAreas(snapshot: GeoJSONStoreFeatures[]) {
  const out: DrawArea[] = []
  for (const f of snapshot) {
    if (f.properties?.currentlyDrawing) continue
    const area = featureToDrawArea(f)
    if (area) out.push(area)
  }
  return out
}
