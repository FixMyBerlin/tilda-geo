import { area } from '@turf/turf'

/** Maximum allowed size of a Planungsmodus-Berechnungsgebiet. */
export const MAX_STUDY_AREA_KM2 = 25

/** Area of a GeoJSON geometry in km², for the study-area size limit check. */
export function studyAreaSizeKm2(geometry: GeoJSON.Geometry) {
  return area({ type: 'Feature', geometry, properties: {} }) / 1_000_000
}
