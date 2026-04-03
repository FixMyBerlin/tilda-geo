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
  return {
    type: 'Feature',
    id,
    geometry: f.geometry,
    properties: f.properties ?? null,
  } satisfies DrawArea
}

export function snapshotToDrawAreas(snapshot: GeoJSONStoreFeatures[]) {
  const out: DrawArea[] = []
  for (const f of snapshot) {
    const area = featureToDrawArea(f)
    if (area) out.push(area)
  }
  return out
}
