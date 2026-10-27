import { geoDataClient } from '@/server/prisma-client.server'
import { unwrapGeometry } from './censusSaettigung.server'

/**
 * Whether OSM parking data exists for this Planungsgebiet at all — a prerequisite for the factors
 * „Parken (Umwidmung)", „Kreuzungen", „Fußgängerzonen" and „Fahrbahnen ausschließen", which all
 * read `public._parking_*` tables (see `flaechenfinder/postgis_loader.py`). The `parking` topic
 * only runs in fixed bboxes (`processing/constants/topics.const.ts`) — outside them there are
 * simply no rows, and the worker silently yields 0 points instead of a warning. So the UI hides
 * the affected factors instead of allowing a skewed scoring result.
 *
 * Plain bbox overlap (`&&`), as in the worker loaders — it's only about "is there any data here",
 * not exact geometry. If the query fails, the factor counts as available (fail open): an
 * infrastructure error should not silently block a factor.
 */
export async function checkParkingDataAvailable(studyArea: unknown) {
  const geometry = unwrapGeometry(studyArea)
  if (geometry == null) return true

  const geojson = JSON.stringify(geometry)
  try {
    const rows = await geoDataClient.$queryRaw<{ available: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM public."_parking_roads"
        WHERE geom && ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON(${geojson}), 4326), 5243)
      ) AS available`
    return rows[0]?.available ?? true
  } catch (error) {
    console.error('Parkdaten-Verfügbarkeit konnte nicht ermittelt werden:', error)
    return true
  }
}
