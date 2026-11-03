import { geoDataClient } from '@/server/prisma-client.server'

// Flächenfinder tile functions.
//
// The MVT functions live in the `space_finder` schema, NOT in `public`: Martin
// auto-publishes every function in `public` (configs/martin.yaml) and would serve
// them on the public tiles hosts without any session or region check. They are
// called only by the authenticated app route
// (app/src/server/space-finder/serveSpaceFinderTile.server.ts, docs/Permissions.md).
//
// Signature and body must match space-finder-worker/sql/martin_functions.sql:
// both sides create the same functions (the app on startup, the worker per
// run). Postgres rejects differing parameter defaults on CREATE OR REPLACE
// (42P13).
//
// Die `query_params json`-Signatur bleibt bewusst erhalten (Aufruf mit
// `{"run_id": "<id>"}`), damit sich die Rümpfe nicht ändern müssen.

// Defensive, idempotent DDL so the functions never reference missing tables, even
// if the space-finder-worker has not run yet. Mirrors space-finder-worker/sql/schema.sql.
async function ensureSpaceFinderSchema() {
  await geoDataClient.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS space_finder;`)
  await geoDataClient.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS space_finder.scenario_hexagons (
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
      score_platz             real,
      score_fussgaengerzone   real,
      score_bestand           real,
      score_eigendaten        real,
      score_bewohnerbedarf    real,
      eignungsklasse          text,
      fahrbahn                boolean NOT NULL DEFAULT false,
      eigendaten_ausschluss   boolean NOT NULL DEFAULT false,
      eigendaten_details      text
    );`)
  // Upgrade existing tables (CREATE TABLE IF NOT EXISTS doesn't add columns).
  await geoDataClient.$executeRawUnsafe(
    `ALTER TABLE space_finder.scenario_hexagons ADD COLUMN IF NOT EXISTS score_vegetation real;`,
  )
  // Separate partial scores (issue #3415): demand vs. built environment; NULL for old runs.
  await geoDataClient.$executeRawUnsafe(
    `ALTER TABLE space_finder.scenario_hexagons ADD COLUMN IF NOT EXISTS score_bedarf real;`,
  )
  await geoDataClient.$executeRawUnsafe(
    `ALTER TABLE space_finder.scenario_hexagons ADD COLUMN IF NOT EXISTS score_bebauung real;`,
  )
  await geoDataClient.$executeRawUnsafe(
    `ALTER TABLE space_finder.scenario_hexagons ADD COLUMN IF NOT EXISTS score_kreuzung real;`,
  )
  await geoDataClient.$executeRawUnsafe(
    `ALTER TABLE space_finder.scenario_hexagons ADD COLUMN IF NOT EXISTS score_parken real;`,
  )
  await geoDataClient.$executeRawUnsafe(
    `ALTER TABLE space_finder.scenario_hexagons ADD COLUMN IF NOT EXISTS score_platz real;`,
  )
  await geoDataClient.$executeRawUnsafe(
    `ALTER TABLE space_finder.scenario_hexagons ADD COLUMN IF NOT EXISTS score_fussgaengerzone real;`,
  )
  await geoDataClient.$executeRawUnsafe(
    `ALTER TABLE space_finder.scenario_hexagons ADD COLUMN IF NOT EXISTS score_bestand real;`,
  )
  // Eigene Daten (user upload): signed effect in points; NULL for old runs
  // and exclusion modes.
  await geoDataClient.$executeRawUnsafe(
    `ALTER TABLE space_finder.scenario_hexagons ADD COLUMN IF NOT EXISTS score_eigendaten real;`,
  )
  // Resident demand (census): bonus points around inhabited buildings; 0 on
  // building hexagons, NULL for old runs and without weight.
  await geoDataClient.$executeRawUnsafe(
    `ALTER TABLE space_finder.scenario_hexagons ADD COLUMN IF NOT EXISTS score_bewohnerbedarf real;`,
  )
  // Area clusters (connected-component labeling over H3 neighbors): total area of
  // the contiguous area a hexagon belongs to (NULL below min_score_threshold).
  // The client filters on a target size.
  await geoDataClient.$executeRawUnsafe(
    `ALTER TABLE space_finder.scenario_hexagons ADD COLUMN IF NOT EXISTS cluster_area_m2 real;`,
  )
  // "Fahrbahnen ausschließen": hexagon lies on a road buffered by its width
  // (public._parking_roads); only set when the checkbox was active.
  await geoDataClient.$executeRawUnsafe(
    `ALTER TABLE space_finder.scenario_hexagons ADD COLUMN IF NOT EXISTS fahrbahn boolean NOT NULL DEFAULT false;`,
  )
  // H3 resolution of the row: BASE (13) for high zoom levels, AGG (11) as coarse
  // aggregate below. space_finder_hexagons picks per zoom level.
  await geoDataClient.$executeRawUnsafe(
    `ALTER TABLE space_finder.scenario_hexagons ADD COLUMN IF NOT EXISTS resolution smallint NOT NULL DEFAULT 13;`,
  )
  // Hexagon lies on a building (public._buildings) → hard exclusion;
  // the flag lets the sidebar show the exclusion reason.
  await geoDataClient.$executeRawUnsafe(
    `ALTER TABLE space_finder.scenario_hexagons ADD COLUMN IF NOT EXISTS gebaeude boolean NOT NULL DEFAULT false;`,
  )
  // Hexagon lies in the exclusion zone of user datasets (user upload,
  // exclude_inside/exclude_outside) → hard exclusion; the flag lets the sidebar
  // show the exclusion reason even though score_eigendaten stays NULL in this
  // mode.
  await geoDataClient.$executeRawUnsafe(
    `ALTER TABLE space_finder.scenario_hexagons ADD COLUMN IF NOT EXISTS eigendaten_ausschluss boolean NOT NULL DEFAULT false;`,
  )
  // Per hexagon, which "Eigene Daten" dataset had which effect: JSON text like
  // [{"id":"a","p":12.5},{"id":"b","x":1}] (p = points, x = excluded). NULL where no
  // dataset applies, and for old runs.
  await geoDataClient.$executeRawUnsafe(
    `ALTER TABLE space_finder.scenario_hexagons ADD COLUMN IF NOT EXISTS eigendaten_details text;`,
  )
  await geoDataClient.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS space_finder.scenario_vegetation (
      run_id     bigint NOT NULL,
      geom       geometry(MultiPolygon, 3857) NOT NULL,
      ndvi       real,
      flaeche_m2 real
    );`)
  // Buffered carriageway areas (public._parking_roads, width as buffer); only
  // filled when „Fahrbahnen ausschließen" was active. Used for map display.
  await geoDataClient.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS space_finder.scenario_carriageways (
      run_id  bigint NOT NULL,
      geom    geometry(MultiPolygon, 3857) NOT NULL,
      width_m real
    );`)
  await geoDataClient.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS scenario_hexagons_run_id_idx ON space_finder.scenario_hexagons (run_id);`,
  )
  await geoDataClient.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS scenario_hexagons_run_res_idx ON space_finder.scenario_hexagons (run_id, resolution);`,
  )
  await geoDataClient.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS scenario_hexagons_geom_idx ON space_finder.scenario_hexagons USING gist (geom);`,
  )
  await geoDataClient.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS scenario_vegetation_run_id_idx ON space_finder.scenario_vegetation (run_id);`,
  )
  await geoDataClient.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS scenario_vegetation_geom_idx ON space_finder.scenario_vegetation USING gist (geom);`,
  )
  await geoDataClient.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS scenario_carriageways_run_id_idx ON space_finder.scenario_carriageways (run_id);`,
  )
  await geoDataClient.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS scenario_carriageways_geom_idx ON space_finder.scenario_carriageways USING gist (geom);`,
  )
}

async function registerHexagonsFunction() {
  await geoDataClient.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION space_finder.space_finder_hexagons(z integer, x integer, y integer, query_params json DEFAULT '{}')
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
      SELECT INTO hex_mvt ST_AsMVT(tile, 'space_finder_hexagons', 4096, 'geom') FROM (
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
          score_platz,
          score_fussgaengerzone,
          score_bestand,
          score_eigendaten,
          score_bewohnerbedarf,
          cluster_area_m2,
          eignungsklasse,
          gebaeude,
          fahrbahn,
          eigendaten_ausschluss,
          eigendaten_details,
          ST_AsMVTGeom(geom, bounds, 4096, 256, true) AS geom
        FROM space_finder.scenario_hexagons
        WHERE run_id = rid AND resolution = res_val AND (geom && bounds)
      ) AS tile;

      -- Separate point layer for the label (only from z18, see HEXAGON_LABEL_MIN_ZOOM in
      -- SourcesLayersSpaceFinder.tsx): the fill layer above buffers & clips the hexagon
      -- polygons per tile (buffer=256) so the fill stays seamless at tile edges — but the
      -- same polygon then often lands in several tiles, each with its own centroid shifted
      -- toward the visible part. A symbol layer based on that would produce multiple,
      -- off-center labels per hexagon. Instead the label layer uses the true hexagon
      -- center, unbuffered (buffer=0) and filtered via ST_Contains against the unexpanded
      -- tile bounds — so each hexagon yields its center in exactly one tile.
      IF z >= 18 THEN
        SELECT INTO label_mvt ST_AsMVT(tile, 'space_finder_hexagons_label', 4096, 'geom') FROM (
          SELECT
            h3_id,
            mce_gesamtscore,
            score_bedarf,
            score_bebauung,
            ST_AsMVTGeom(ST_Centroid(geom), bounds, 4096, 0, true) AS geom
          FROM space_finder.scenario_hexagons
          WHERE run_id = rid AND resolution = res_val
            AND ST_Contains(bounds, ST_Centroid(geom))
        ) AS tile;
      END IF;

      RETURN NULLIF(COALESCE(hex_mvt, ''::bytea) || COALESCE(label_mvt, ''::bytea), ''::bytea);
    END
    $$ LANGUAGE plpgsql STABLE PARALLEL SAFE;`)
}

async function registerVegetationFunction() {
  await geoDataClient.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION space_finder.space_finder_vegetation(z integer, x integer, y integer, query_params json DEFAULT '{}')
    RETURNS bytea AS $$
    DECLARE
      mvt bytea;
      rid bigint := NULLIF(query_params->>'run_id', '')::bigint;
      bounds geometry := ST_TileEnvelope(z, x, y);
    BEGIN
      IF rid IS NULL THEN
        RETURN NULL;
      END IF;
      SELECT INTO mvt ST_AsMVT(tile, 'space_finder_vegetation', 4096, 'geom') FROM (
        SELECT
          ndvi,
          flaeche_m2,
          ST_AsMVTGeom(geom, bounds, 4096, 256, true) AS geom
        FROM space_finder.scenario_vegetation
        WHERE run_id = rid AND (geom && bounds)
      ) AS tile;
      RETURN mvt;
    END
    $$ LANGUAGE plpgsql STABLE PARALLEL SAFE;`)
}

async function registerCarriagewaysFunction() {
  await geoDataClient.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION space_finder.space_finder_carriageways(z integer, x integer, y integer, query_params json DEFAULT '{}')
    RETURNS bytea AS $$
    DECLARE
      mvt bytea;
      rid bigint := NULLIF(query_params->>'run_id', '')::bigint;
      bounds geometry := ST_TileEnvelope(z, x, y);
    BEGIN
      IF rid IS NULL THEN
        RETURN NULL;
      END IF;
      SELECT INTO mvt ST_AsMVT(tile, 'space_finder_carriageways', 4096, 'geom') FROM (
        SELECT
          width_m,
          ST_AsMVTGeom(geom, bounds, 4096, 256, true) AS geom
        FROM space_finder.scenario_carriageways
        WHERE run_id = rid AND (geom && bounds)
      ) AS tile;
      RETURN mvt;
    END
    $$ LANGUAGE plpgsql STABLE PARALLEL SAFE;`)
}

/**
 * Census population points of the resident demand factor as a point layer.
 *
 * Reads DIRECTLY from `data.census_population_point` — deliberately nothing is copied
 * into the `space_finder` schema per run: the table covers all of Germany (~24M points,
 * EPSG:5243) and lives in this DB anyway. It shows the same extent the scoring uses —
 * `PostgisLoader.load_census_population()` filters with
 * `geom && ST_Transform(study_area, 5243)`, i.e. the Planungsgebiet bounding box. The
 * area comes from the run's frozen `factorConfigSnapshot`, so the layer matches the
 * result even if the Planungsgebiet was edited later.
 *
 * If the data schema is missing on this environment, the function returns NULL instead
 * of an error (empty tile) — like the graceful fallbacks in the worker.
 *
 * Must match space-finder-worker/sql/martin_functions.sql.
 */
async function registerCensusFunction() {
  await geoDataClient.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION space_finder.space_finder_census(z integer, x integer, y integer, query_params json DEFAULT '{}')
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
      FROM prisma."SpaceFinderRun" WHERE id = rid;
      IF geo IS NULL THEN
        RETURN NULL;
      END IF;
      IF geo->>'type' = 'FeatureCollection' THEN
        geo := geo->'features'->0->'geometry';
      ELSIF geo->>'type' = 'Feature' THEN
        geo := geo->'geometry';
      END IF;
      area_5243 := ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON(geo::text), 4326), 5243);
      SELECT INTO mvt ST_AsMVT(tile, 'space_finder_census', 4096, 'geom') FROM (
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
}

export async function registerSpaceFinderFunctions() {
  await ensureSpaceFinderSchema()
  await registerHexagonsFunction()
  await registerVegetationFunction()
  await registerCarriagewaysFunction()
  await registerCensusFunction()
}
