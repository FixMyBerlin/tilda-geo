import { geoDataClient } from '@/server/prisma-client.server'

// Planning module tile sources.
//
// Martin auto-publishes functions from the `public` schema (configs/martin.yaml),
// so these MVT functions live in `public` but READ from the `planning` schema.
// They take a `query_params json` 4th argument — Martin passes URL query params
// as JSON, e.g. `…/planning_hexagons/{z}/{x}/{y}?run_id=42`.
//
// Signatur und Rumpf müssen mit planning-worker/sql/martin_functions.sql
// übereinstimmen: beide Seiten legen dieselben Funktionen an (App beim Start,
// Worker beim Lauf). Abweichende Parameter-Defaults lässt Postgres bei
// CREATE OR REPLACE nicht zu (42P13).
//
// A completed run is immutable, so its tiles are cacheable forever under the
// run_id-keyed URL (see configs/nginx.conf `planning_cache` zone). A re-run
// produces a new run_id → new URL → automatic cache busting.

// Defensive, idempotent DDL so the functions never reference missing tables, even
// if the planning-worker has not run yet. Mirrors planning-worker/sql/schema.sql.
async function ensurePlanningSchema() {
  await geoDataClient.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS planning;`)
  await geoDataClient.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS planning.scenario_hexagons (
      run_id                  bigint NOT NULL,
      h3_id                   text   NOT NULL,
      geom                    geometry(Polygon, 3857) NOT NULL,
      mce_gesamtscore         real,
      score_bedarf            real,
      score_bebauung          real,
      score_radweg            real,
      score_zielorte          real,
      score_hangneigung       real,
      score_oepnv             real,
      score_vegetation        real,
      score_kreuzung          real,
      score_parken            real,
      score_fussgaengerzone   real,
      score_bestand           real,
      score_eigendaten        real,
      score_bewohnerbedarf    real,
      eignungsklasse          text,
      fahrbahn                boolean NOT NULL DEFAULT false,
      eigendaten_ausschluss   boolean NOT NULL DEFAULT false
    );`)
  // Bestehende Tabellen nachrüsten (CREATE TABLE IF NOT EXISTS fügt keine Spalte hinzu).
  await geoDataClient.$executeRawUnsafe(
    `ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS score_vegetation real;`,
  )
  // Getrennte Teil-Scores (Issue #3415): Bedarf vs. Bebauung; NULL bei Alt-Läufen.
  await geoDataClient.$executeRawUnsafe(
    `ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS score_bedarf real;`,
  )
  await geoDataClient.$executeRawUnsafe(
    `ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS score_bebauung real;`,
  )
  await geoDataClient.$executeRawUnsafe(
    `ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS score_kreuzung real;`,
  )
  await geoDataClient.$executeRawUnsafe(
    `ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS score_parken real;`,
  )
  await geoDataClient.$executeRawUnsafe(
    `ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS score_fussgaengerzone real;`,
  )
  await geoDataClient.$executeRawUnsafe(
    `ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS score_bestand real;`,
  )
  // Eigene Flächen (Nutzer-Upload): signierter Effekt in Punkten; NULL bei Alt-Läufen
  // und Ausschluss-Modi.
  await geoDataClient.$executeRawUnsafe(
    `ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS score_eigendaten real;`,
  )
  // Bewohnerbedarf (Zensus): Zuschlag in Punkten rund um bewohnte Gebäude; 0 auf
  // Gebäude-Hexagonen, NULL bei Alt-Läufen und ohne Gewicht.
  await geoDataClient.$executeRawUnsafe(
    `ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS score_bewohnerbedarf real;`,
  )
  // Flächen-Cluster (Connected-Component-Labeling über H3-Nachbarschaft): Gesamt-
  // fläche der zusammenhängenden Fläche, zu der ein Hexagon gehört (NULL unter
  // min_score_threshold). Client filtert clientseitig auf eine Zielgröße.
  await geoDataClient.$executeRawUnsafe(
    `ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS cluster_area_m2 real;`,
  )
  // Fahrbahnen ausschließen: Hexagon liegt auf einer um ihre Breite gepufferten
  // Straße (public._parking_roads); nur gesetzt, wenn die Checkbox aktiv war.
  await geoDataClient.$executeRawUnsafe(
    `ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS fahrbahn boolean NOT NULL DEFAULT false;`,
  )
  // H3-Auflösung der Zeile: BASE (13) für hohe Zoomstufen, AGG (11) als grobes
  // Aggregat darunter. planning_hexagons wählt je Zoomstufe.
  await geoDataClient.$executeRawUnsafe(
    `ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS resolution smallint NOT NULL DEFAULT 13;`,
  )
  // Hexagon liegt auf einem Gebäude (public._buildings) → hart ausgeschlossen;
  // das Flag erlaubt der Sidebar, den Ausschlussgrund anzuzeigen.
  await geoDataClient.$executeRawUnsafe(
    `ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS gebaeude boolean NOT NULL DEFAULT false;`,
  )
  // Hexagon liegt im Ausschlussbereich eigener Flächen (Nutzer-Upload,
  // exclude_inside/exclude_outside) → hart ausgeschlossen; das Flag erlaubt der
  // Sidebar, den Ausschlussgrund anzuzeigen, auch wenn score_eigendaten in
  // diesem Modus NULL bleibt.
  await geoDataClient.$executeRawUnsafe(
    `ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS eigendaten_ausschluss boolean NOT NULL DEFAULT false;`,
  )
  await geoDataClient.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS planning.scenario_vegetation (
      run_id     bigint NOT NULL,
      geom       geometry(MultiPolygon, 3857) NOT NULL,
      ndvi       real,
      flaeche_m2 real
    );`)
  // Gepufferte Fahrbahnflächen (public._parking_roads, Breite als Puffer); nur
  // befüllt, wenn „Fahrbahnen ausschließen" aktiv war. Dient der Kartenanzeige.
  await geoDataClient.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS planning.scenario_carriageways (
      run_id  bigint NOT NULL,
      geom    geometry(MultiPolygon, 3857) NOT NULL,
      width_m real
    );`)
  await geoDataClient.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS scenario_hexagons_run_id_idx ON planning.scenario_hexagons (run_id);`,
  )
  await geoDataClient.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS scenario_hexagons_run_res_idx ON planning.scenario_hexagons (run_id, resolution);`,
  )
  await geoDataClient.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS scenario_hexagons_geom_idx ON planning.scenario_hexagons USING gist (geom);`,
  )
  await geoDataClient.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS scenario_vegetation_run_id_idx ON planning.scenario_vegetation (run_id);`,
  )
  await geoDataClient.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS scenario_vegetation_geom_idx ON planning.scenario_vegetation USING gist (geom);`,
  )
  await geoDataClient.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS scenario_carriageways_run_id_idx ON planning.scenario_carriageways (run_id);`,
  )
  await geoDataClient.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS scenario_carriageways_geom_idx ON planning.scenario_carriageways USING gist (geom);`,
  )
  // Potentialflächen werden nicht mehr berechnet; Altbestand aufräumen.
  await geoDataClient.$executeRawUnsafe(`DROP TABLE IF EXISTS planning.scenario_areas;`)
  await geoDataClient.$executeRawUnsafe(
    `DROP FUNCTION IF EXISTS public.planning_areas(int, int, int, json);`,
  )
}

async function registerHexagonsFunction() {
  await geoDataClient.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION public.planning_hexagons(z integer, x integer, y integer, query_params json DEFAULT '{}')
    RETURNS bytea AS $$
    DECLARE
      hex_mvt bytea;
      label_mvt bytea;
      rid bigint := NULLIF(query_params->>'run_id', '')::bigint;
      bounds geometry := ST_TileEnvelope(z, x, y);
      res_val smallint := CASE WHEN z >= 16 THEN 13 ELSE 11 END;
    BEGIN
      IF rid IS NULL THEN
        RETURN NULL;
      END IF;
      SELECT INTO hex_mvt ST_AsMVT(tile, 'planning_hexagons', 4096, 'geom') FROM (
        SELECT
          h3_id,
          mce_gesamtscore,
          score_bedarf,
          score_bebauung,
          score_radweg,
          score_hangneigung,
          score_oepnv,
          score_zielorte,
          score_vegetation,
          score_kreuzung,
          score_parken,
          score_fussgaengerzone,
          score_bestand,
          score_eigendaten,
          score_bewohnerbedarf,
          cluster_area_m2,
          eignungsklasse,
          gebaeude,
          fahrbahn,
          eigendaten_ausschluss,
          ST_AsMVTGeom(geom, bounds, 4096, 256, true) AS geom
        FROM planning.scenario_hexagons
        WHERE run_id = rid AND resolution = res_val AND (geom && bounds)
      ) AS tile;

      -- Eigener Punkt-Layer für das Label (nur ab z18, siehe HEXAGON_LABEL_MIN_ZOOM in
      -- SourcesLayersPlanning.tsx): der Fläche-Layer oben puffert & schneidet die
      -- Hexagon-Polygone pro Kachel (buffer=256) für nahtlose Füllung an
      -- Kachelgrenzen — dasselbe Polygon liegt dadurch oft in mehreren Kacheln, je
      -- mit einem eigenen, zur sichtbaren Teilfläche versetzten Zentroid. Ein
      -- Symbol-Layer darauf würde also mehrfache, außermittige Labels je Hexagon
      -- zeigen. Der Label-Layer nimmt stattdessen den echten Hexagon-Mittelpunkt,
      -- ungepuffert (buffer=0) und via ST_Contains auf die ungeweiteten
      -- Kachelgrenzen gefiltert — jedes Hexagon liefert seinen Mittelpunkt so in
      -- genau einer Kachel.
      IF z >= 18 THEN
        SELECT INTO label_mvt ST_AsMVT(tile, 'planning_hexagons_label', 4096, 'geom') FROM (
          SELECT
            h3_id,
            mce_gesamtscore,
            score_bedarf,
            score_bebauung,
            ST_AsMVTGeom(ST_Centroid(geom), bounds, 4096, 0, true) AS geom
          FROM planning.scenario_hexagons
          WHERE run_id = rid AND resolution = res_val
            AND ST_Contains(bounds, ST_Centroid(geom))
        ) AS tile;
      END IF;

      RETURN NULLIF(COALESCE(hex_mvt, ''::bytea) || COALESCE(label_mvt, ''::bytea), ''::bytea);
    END
    $$ LANGUAGE plpgsql STABLE PARALLEL SAFE;`)
  const spec = {
    vector_layers: [
      {
        id: 'planning_hexagons',
        fields: {
          h3_id: 'text',
          mce_gesamtscore: 'real',
          score_bedarf: 'real',
          score_bebauung: 'real',
          score_radweg: 'real',
          score_hangneigung: 'real',
          score_oepnv: 'real',
          score_zielorte: 'real',
          score_vegetation: 'real',
          score_kreuzung: 'real',
          score_parken: 'real',
          score_fussgaengerzone: 'real',
          score_bestand: 'real',
          score_eigendaten: 'real',
          score_bewohnerbedarf: 'real',
          cluster_area_m2: 'real',
          eignungsklasse: 'text',
          gebaeude: 'boolean',
          fahrbahn: 'boolean',
          eigendaten_ausschluss: 'boolean',
        },
      },
      {
        id: 'planning_hexagons_label',
        fields: {
          h3_id: 'text',
          mce_gesamtscore: 'real',
          score_bedarf: 'real',
          score_bebauung: 'real',
        },
      },
    ],
  }
  await geoDataClient.$executeRawUnsafe(
    `COMMENT ON FUNCTION public.planning_hexagons IS '${JSON.stringify(spec)}';`,
  )
}

async function registerVegetationFunction() {
  await geoDataClient.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION public.planning_vegetation(z integer, x integer, y integer, query_params json DEFAULT '{}')
    RETURNS bytea AS $$
    DECLARE
      mvt bytea;
      rid bigint := NULLIF(query_params->>'run_id', '')::bigint;
      bounds geometry := ST_TileEnvelope(z, x, y);
    BEGIN
      IF rid IS NULL THEN
        RETURN NULL;
      END IF;
      SELECT INTO mvt ST_AsMVT(tile, 'planning_vegetation', 4096, 'geom') FROM (
        SELECT
          ndvi,
          flaeche_m2,
          ST_AsMVTGeom(geom, bounds, 4096, 256, true) AS geom
        FROM planning.scenario_vegetation
        WHERE run_id = rid AND (geom && bounds)
      ) AS tile;
      RETURN mvt;
    END
    $$ LANGUAGE plpgsql STABLE PARALLEL SAFE;`)
  const spec = {
    vector_layers: [{ id: 'planning_vegetation', fields: { ndvi: 'real', flaeche_m2: 'real' } }],
  }
  await geoDataClient.$executeRawUnsafe(
    `COMMENT ON FUNCTION public.planning_vegetation IS '${JSON.stringify(spec)}';`,
  )
}

async function registerCarriagewaysFunction() {
  await geoDataClient.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION public.planning_carriageways(z integer, x integer, y integer, query_params json DEFAULT '{}')
    RETURNS bytea AS $$
    DECLARE
      mvt bytea;
      rid bigint := NULLIF(query_params->>'run_id', '')::bigint;
      bounds geometry := ST_TileEnvelope(z, x, y);
    BEGIN
      IF rid IS NULL THEN
        RETURN NULL;
      END IF;
      SELECT INTO mvt ST_AsMVT(tile, 'planning_carriageways', 4096, 'geom') FROM (
        SELECT
          width_m,
          ST_AsMVTGeom(geom, bounds, 4096, 256, true) AS geom
        FROM planning.scenario_carriageways
        WHERE run_id = rid AND (geom && bounds)
      ) AS tile;
      RETURN mvt;
    END
    $$ LANGUAGE plpgsql STABLE PARALLEL SAFE;`)
  const spec = {
    vector_layers: [{ id: 'planning_carriageways', fields: { width_m: 'real' } }],
  }
  await geoDataClient.$executeRawUnsafe(
    `COMMENT ON FUNCTION public.planning_carriageways IS '${JSON.stringify(spec)}';`,
  )
}

/**
 * Zensus-Einwohnerpunkte des Bewohnerbedarf-Faktors als Punktlayer.
 *
 * Liest DIREKT aus `data.census_population_point` — es wird bewusst nichts pro Lauf
 * ins `planning`-Schema kopiert: die Tabelle deckt ganz Deutschland ab (~24 Mio.
 * Punkte, EPSG:5243) und liegt ohnehin in dieser DB. Gezeigt wird derselbe
 * Ausschnitt, den auch das Scoring benutzt — `PostgisLoader.load_census_population()`
 * filtert mit `geom && ST_Transform(study_area, 5243)`, also über die Bounding-Box
 * des Planungsgebiets. Das Gebiet kommt aus dem eingefrorenen
 * `factorConfigSnapshot` des Laufs, damit der Layer zum Ergebnis passt, auch wenn
 * das Planungsgebiet danach bearbeitet wurde.
 *
 * Fehlt das Data-Schema auf dieser Umgebung, liefert die Funktion NULL statt eines
 * Fehlers (leere Kachel) — wie die graceful Fallbacks im Worker.
 *
 * Muss mit planning-worker/sql/martin_functions.sql übereinstimmen.
 */
async function registerCensusFunction() {
  await geoDataClient.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION public.planning_census(z integer, x integer, y integer, query_params json DEFAULT '{}')
    RETURNS bytea AS $$
    DECLARE
      mvt bytea;
      rid bigint := NULLIF(query_params->>'run_id', '')::bigint;
      bounds geometry := ST_TileEnvelope(z, x, y);
      geo jsonb;
      area_5243 geometry;
    BEGIN
      IF rid IS NULL OR to_regclass('data.census_population_point') IS NULL THEN
        RETURN NULL;
      END IF;
      SELECT "factorConfigSnapshot" -> 'study_area' INTO geo
      FROM prisma."PlanningRun" WHERE id = rid;
      IF geo IS NULL THEN
        RETURN NULL;
      END IF;
      IF geo->>'type' = 'FeatureCollection' THEN
        geo := geo->'features'->0->'geometry';
      ELSIF geo->>'type' = 'Feature' THEN
        geo := geo->'geometry';
      END IF;
      area_5243 := ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON(geo::text), 4326), 5243);
      SELECT INTO mvt ST_AsMVT(tile, 'planning_census', 4096, 'geom') FROM (
        SELECT
          c.total AS einwohner,
          ST_AsMVTGeom(ST_Transform(c.geom, 3857), bounds, 4096, 256, true) AS geom
        FROM data.census_population_point c
        WHERE c.total > 0
          AND (c.geom && ST_Transform(ST_Expand(bounds, (ST_XMax(bounds) - ST_XMin(bounds)) * 0.1), 5243))
          AND (c.geom && area_5243)
      ) AS tile;
      RETURN mvt;
    END
    $$ LANGUAGE plpgsql STABLE PARALLEL SAFE;`)
  const spec = {
    vector_layers: [{ id: 'planning_census', fields: { einwohner: 'real' } }],
  }
  await geoDataClient.$executeRawUnsafe(
    `COMMENT ON FUNCTION public.planning_census IS '${JSON.stringify(spec)}';`,
  )
}

export async function registerPlanningFunctions() {
  await ensurePlanningSchema()
  await registerHexagonsFunction()
  await registerVegetationFunction()
  await registerCarriagewaysFunction()
  await registerCensusFunction()
}
