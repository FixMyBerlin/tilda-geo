import { Prisma } from '@/prisma/generated/client'
import db from '@/server/db.server'
import { geoDataClient } from '@/server/prisma-client.server'

/**
 * Vorschlag für `bewohnerbedarf_saettigung_ew` aus den Zensusdaten des Planungsgebiets.
 *
 * Der Parameter ist KEINE Dichte, sondern der Sättigungswert der gewichteten Nachbarschaftssumme
 * je Hexagon: Σ Einwohner × (1 − Abstand/20 m), gemessen ab der Gebäudekante (siehe
 * `flaechenfinder/scorer.py`, Schritt 5 und 13). Aus einer Dichte in EW/ha lässt er sich nicht
 * verlässlich ableiten — an drei echten Läufen gemessen schwankt das Verhältnis um Faktor 2,3,
 * weil die Bruttodichte davon abhängt, wie viel Park, Gewerbe und Wasser im gezeichneten Polygon
 * liegt. Wir schätzen deshalb direkt dieselbe Größe: Rasterprobe über das Gebiet, Zensuspunkte
 * auf die OSM-Gebäude aggregiert, dieselbe Rampe. Gegen die zurückgerechneten Verteilungen der
 * Läufe traf das p50/p75/p90 auf wenige Prozent.
 *
 * Vorgeschlagen wird das p90: das oberste Zehntel der bewohnten Fläche bekommt den vollen
 * Zuschlag, der Rest differenziert über die volle Spanne. Der Wert ist ein Startwert — die UI
 * zeigt ihn als automatisch ermittelt an und lässt ihn überschreiben.
 */

/** Rasterweite der Stichprobe. 40 m statt der 20 m des H3-Rasters: im Test wich das p75 bei
 * 15 km² dichtem Berlin um 0,8 % ab, die Laufzeit sank von 2,2 s auf 0,9 s. */
const SAMPLE_GRID_M = Prisma.raw('40')

/** Reichweite des Faktors ab Gebäudekante — muss `UseCaseConfig.bewohnerbedarf_radius_m` in
 * `flaechenfinder/config.py` entsprechen (dort bewusst nicht UI-einstellbar). */
const DEMAND_RADIUS_M = Prisma.raw('20.0')

/** Metrisches CRS der Berechnung — dasselbe wie im Worker. */
const METRIC_SRID = Prisma.raw('25832')

/** Quell-CRS von `data.census_population_point` und `public._buildings`. */
const SOURCE_SRID = Prisma.raw('5243')

/** Notbremse: das Gebiet ist auf 15 km² begrenzt (dort ~1 s), aber eine Anfrage im
 * Anlege-Dialog darf unter keinen Umständen hängen bleiben. Prisma bricht die Transaktion sonst
 * schon nach seinen eigenen 5 s ab, bevor das Statement-Timeout überhaupt greifen könnte. */
const STATEMENT_TIMEOUT_MS = Prisma.raw('30000')
const TRANSACTION_TIMEOUT_MS = 35_000

/** Grenzen des Vorschlags. Unten verhindert die Schranke, dass in fast unbewohnten Gebieten
 * schon ein einzelnes Haus den vollen Zuschlag auslöst; oben, dass ein Hochhaus das ganze
 * Gebiet auf „nie voller Zuschlag" stellt. */
const MIN_SUGGESTION = 3
const MAX_SUGGESTION = 150

/** Auf ganze Zahlen unter 10, darüber auf Vielfache von 5 (das Eingabefeld läuft in 5er-Schritten). */
const roundSuggestion = (value: number) =>
  value < 10 ? Math.max(1, Math.round(value)) : Math.round(value / 5) * 5

type CensusStats = { saettigungEw: number; ewPerHa: number }

/**
 * Rechnet die Kennzahlen für eine Studiengebiet-Geometrie. Gibt `null` zurück, wenn das
 * Data-Schema auf dieser Umgebung fehlt, das Gebiet unbewohnt ist oder die Abfrage scheitert —
 * analog zu den graceful Fallbacks der Worker-Loader. Der Aufrufer speichert dann NULL, und der
 * Worker-Default (30) greift.
 */
async function computeCensusStats(studyArea: unknown): Promise<CensusStats | null> {
  const geometry = unwrapGeometry(studyArea)
  if (geometry == null) return null

  const geojson = JSON.stringify(geometry)
  try {
    return await geoDataClient.$transaction(
      async (tx) => {
        await tx.$executeRaw`SET LOCAL statement_timeout = ${STATEMENT_TIMEOUT_MS}`

        // Bewusst temporäre Tabellen statt einer großen CTE-Abfrage: die Rasterprobe schlägt für
        // jeden Punkt in den Quellen nach, und auf CTE-Ergebnissen gibt es keinen Index. Ohne die
        // GiST-Indizes unten wird daraus ein Nested Loop über alle Quellen — im Test 30 s statt 1 s.
        await tx.$executeRaw`
          CREATE TEMP TABLE census_area ON COMMIT DROP AS
          SELECT
            ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON(${geojson}), 4326), ${METRIC_SRID}) AS metric,
            ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON(${geojson}), 4326), ${SOURCE_SRID}) AS source`

        // Gebäude im Gebiet. Die Rampe misst ab der Gebäudekante, deshalb sind die Polygone die
        // Quellgeometrie und nicht die Zensuspunkte (die auf dem Gebäudemittelpunkt sitzen).
        await tx.$executeRaw`
          CREATE TEMP TABLE census_buildings ON COMMIT DROP AS
          SELECT row_number() OVER () AS bid, ST_Transform(b.geom, ${METRIC_SRID}) AS geom
          FROM census_area a
          JOIN public."_buildings" b ON b.geom && a.source AND ST_Intersects(b.geom, a.source)`
        await tx.$executeRaw`CREATE INDEX ON census_buildings USING gist (geom)`

        await tx.$executeRaw`
          CREATE TEMP TABLE census_points ON COMMIT DROP AS
          SELECT c.total::double precision AS ew, ST_Transform(c.geom, ${METRIC_SRID}) AS geom
          FROM census_area a
          JOIN data."census_population_point" c ON c.geom && a.source AND ST_Intersects(c.geom, a.source)
          WHERE c.total > 0`
        await tx.$executeRaw`CREATE INDEX ON census_points USING gist (geom)`
        await tx.$executeRaw`ANALYZE census_buildings, census_points`

        // Punkte per Point-in-Polygon auf ihr Gebäude aggregieren; was kein Gebäude trifft (der
        // Zensus kennt ALKIS, wir OSM) bleibt Punktquelle, damit keine Einwohner verloren gehen.
        await tx.$executeRaw`
          CREATE TEMP TABLE census_sources ON COMMIT DROP AS
          WITH matched AS (
            SELECT p.ew, p.geom,
              (SELECT b.bid FROM census_buildings b WHERE ST_Within(p.geom, b.geom) LIMIT 1) AS bid
            FROM census_points p
          )
          SELECT sum(m.ew) AS ew, (SELECT b.geom FROM census_buildings b WHERE b.bid = m.bid) AS geom
          FROM matched m WHERE m.bid IS NOT NULL GROUP BY m.bid
          UNION ALL
          SELECT m.ew, m.geom FROM matched m WHERE m.bid IS NULL`
        await tx.$executeRaw`CREATE INDEX ON census_sources USING gist (geom)`
        await tx.$executeRaw`ANALYZE census_sources`

        // Stichprobe: Rasterpunkte im Gebiet, die nicht auf einem Gebäude liegen. Gebäudeflächen
        // bekommen im Scorer bewusst 0 (der Bedarf entsteht rund um das Haus, nicht darauf).
        const rows = await tx.$queryRaw<{ p90: number | null; ew_pro_ha: number | null }[]>`
          WITH sample AS (
            SELECT (
              SELECT sum(s.ew * (1 - ST_Distance(g.geom, s.geom) / ${DEMAND_RADIUS_M}))
              FROM census_sources s
              WHERE ST_DWithin(g.geom, s.geom, ${DEMAND_RADIUS_M})
            ) AS bewohner_ew
            FROM (
              SELECT ST_Centroid(cell.geom) AS geom
              FROM census_area a, ST_SquareGrid(${SAMPLE_GRID_M}, a.metric) cell
              WHERE ST_Intersects(ST_Centroid(cell.geom), a.metric)
            ) g
            WHERE NOT EXISTS (SELECT 1 FROM census_buildings b WHERE ST_Intersects(g.geom, b.geom))
          )
          SELECT
            (SELECT percentile_cont(0.9) WITHIN GROUP (ORDER BY bewohner_ew)
             FROM sample WHERE bewohner_ew > 0)::double precision AS p90,
            (SELECT sum(p.ew) / (SELECT ST_Area(metric) / 10000 FROM census_area)
             FROM census_points p)::double precision AS ew_pro_ha`

        const p90 = rows[0]?.p90
        const ewPerHa = rows[0]?.ew_pro_ha
        if (p90 == null || !Number.isFinite(p90) || p90 <= 0) return null
        return {
          saettigungEw: Math.min(MAX_SUGGESTION, Math.max(MIN_SUGGESTION, roundSuggestion(p90))),
          ewPerHa: ewPerHa != null && Number.isFinite(ewPerHa) ? Math.round(ewPerHa * 10) / 10 : 0,
        }
      },
      { timeout: TRANSACTION_TIMEOUT_MS },
    )
  } catch (error) {
    console.error('Zensus-Sättigung konnte nicht ermittelt werden:', error)
    return null
  }
}

/** Rechnet neu und schreibt das Ergebnis ans Planungsgebiet — nach Anlegen und nach jeder
 * Geometrieänderung. Schlägt die Abfrage fehl, werden die Werte auf NULL zurückgesetzt, damit
 * kein Vorschlag zu einer alten Geometrie stehen bleibt. */
export async function refreshAreaCensusStats(areaId: number, studyArea: unknown) {
  const stats = await computeCensusStats(studyArea)
  await db.planningArea.update({
    where: { id: areaId },
    data: {
      censusSaettigungEw: stats?.saettigungEw ?? null,
      censusEwPerHa: stats?.ewPerHa ?? null,
      censusComputedAt: new Date(),
    },
  })
  return stats
}

/** Füllt die Kennzahlen für Gebiete nach, die vor diesem Feature angelegt wurden. Rechnet nur,
 * solange `censusComputedAt` NULL ist — danach nur noch über `refreshAreaCensusStats`. */
export async function ensureAreaCensusStats(areaId: number) {
  const area = await db.planningArea.findUnique({
    where: { id: areaId },
    select: { studyArea: true, censusComputedAt: true },
  })
  if (area == null || area.censusComputedAt != null) return null
  return refreshAreaCensusStats(areaId, area.studyArea)
}

/** GeoJSON auf die nackte Geometrie herunterbrechen — Gebiete liegen mal als Feature, mal als
 * FeatureCollection, mal als Geometrie vor (gleiche Normalisierung wie `planning_census`). */
function unwrapGeometry(studyArea: unknown) {
  const geo = studyArea as {
    type?: string
    geometry?: unknown
    features?: { geometry?: unknown }[]
  }
  if (geo == null || typeof geo !== 'object') return null
  if (geo.type === 'FeatureCollection') return geo.features?.[0]?.geometry ?? null
  if (geo.type === 'Feature') return geo.geometry ?? null
  return geo.type == null ? null : geo
}
