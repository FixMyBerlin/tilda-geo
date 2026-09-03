import { geoDataClient } from '@/server/prisma-client.server'
import { unwrapGeometry } from './censusSaettigung.server'

/**
 * Ob für dieses Planungsgebiet überhaupt OSM-Parkdaten vorliegen — Voraussetzung für die Faktoren
 * „Parken (Umwidmung)", „Kreuzungen", „Fußgängerzonen" und „Fahrbahnen ausschließen", die alle
 * `public._parking_*`-Tabellen lesen (siehe `flaechenfinder/postgis_loader.py`). Das
 * `parking`-Topic läuft nur in festen Bboxen (`processing/constants/topics.const.ts`) — außerhalb
 * existieren dort schlicht keine Zeilen, der Worker liefert dann still 0 Punkte statt eines
 * Hinweises. Die UI blendet die betroffenen Faktoren deshalb aus, statt ein verfälschtes
 * Scoring-Ergebnis zuzulassen.
 *
 * Reine Bbox-Überlappung (`&&`), wie in den Worker-Loadern — es geht nur um „gibt es hier
 * überhaupt Daten", nicht um exakte Geometrie. Schlägt die Abfrage fehl, gilt der Faktor als
 * verfügbar (fail open): ein Infrastrukturfehler soll keinen Faktor stumm blockieren.
 */
export async function checkParkingDataAvailable(studyArea: unknown): Promise<boolean> {
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
