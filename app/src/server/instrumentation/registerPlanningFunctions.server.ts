import { geoDataClient } from '@/server/prisma-client.server'

// Planning module tile sources.
//
// Martin auto-publishes functions from the `public` schema (configs/martin.yaml),
// so these MVT functions live in `public` but READ from the `planning` schema.
// They take a `query_params json` 4th argument — Martin passes URL query params
// as JSON, e.g. `…/planning_hexagons/{z}/{x}/{y}?run_id=42`.
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
      score_bodenbelag        real,
      score_zielorte          real,
      score_hangneigung       real,
      score_oepnv             real,
      score_vegetation        real,
      score_kreuzung          real,
      score_parken            real,
      score_fussgaengerzone   real,
      score_bestand           real,
      eignungsklasse          text
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
  await geoDataClient.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS planning.scenario_vegetation (
      run_id     bigint NOT NULL,
      geom       geometry(MultiPolygon, 3857) NOT NULL,
      ndvi       real,
      flaeche_m2 real
    );`)
  await geoDataClient.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS scenario_hexagons_run_id_idx ON planning.scenario_hexagons (run_id);`,
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
  // Potentialflächen werden nicht mehr berechnet; Altbestand aufräumen.
  await geoDataClient.$executeRawUnsafe(`DROP TABLE IF EXISTS planning.scenario_areas;`)
  await geoDataClient.$executeRawUnsafe(
    `DROP FUNCTION IF EXISTS public.planning_areas(int, int, int, json);`,
  )
}

async function registerHexagonsFunction() {
  await geoDataClient.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION public.planning_hexagons(z integer, x integer, y integer, query_params json)
    RETURNS bytea AS $$
    DECLARE
      mvt bytea;
      rid bigint := NULLIF(query_params->>'run_id', '')::bigint;
    BEGIN
      IF rid IS NULL THEN
        RETURN NULL;
      END IF;
      SELECT INTO mvt ST_AsMVT(tile, 'planning_hexagons', 4096, 'geom') FROM (
        SELECT
          h3_id,
          mce_gesamtscore,
          score_bedarf,
          score_bebauung,
          score_radweg,
          score_bodenbelag,
          score_hangneigung,
          score_oepnv,
          score_zielorte,
          score_vegetation,
          score_kreuzung,
          score_parken,
          score_fussgaengerzone,
          score_bestand,
          eignungsklasse,
          ST_AsMVTGeom(geom, ST_TileEnvelope(z, x, y), 4096, 64, true) AS geom
        FROM planning.scenario_hexagons
        WHERE run_id = rid AND (geom && ST_TileEnvelope(z, x, y))
      ) AS tile;
      RETURN mvt;
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
          score_bodenbelag: 'real',
          score_hangneigung: 'real',
          score_oepnv: 'real',
          score_zielorte: 'real',
          score_vegetation: 'real',
          score_kreuzung: 'real',
          score_parken: 'real',
          score_fussgaengerzone: 'real',
          score_bestand: 'real',
          eignungsklasse: 'text',
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
    CREATE OR REPLACE FUNCTION public.planning_vegetation(z integer, x integer, y integer, query_params json)
    RETURNS bytea AS $$
    DECLARE
      mvt bytea;
      rid bigint := NULLIF(query_params->>'run_id', '')::bigint;
    BEGIN
      IF rid IS NULL THEN
        RETURN NULL;
      END IF;
      SELECT INTO mvt ST_AsMVT(tile, 'planning_vegetation', 4096, 'geom') FROM (
        SELECT
          ndvi,
          flaeche_m2,
          ST_AsMVTGeom(geom, ST_TileEnvelope(z, x, y), 4096, 64, true) AS geom
        FROM planning.scenario_vegetation
        WHERE run_id = rid AND (geom && ST_TileEnvelope(z, x, y))
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

export async function registerPlanningFunctions() {
  await ensurePlanningSchema()
  await registerHexagonsFunction()
  await registerVegetationFunction()
}
