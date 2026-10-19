-- Planning module result schema.
--
-- Lives in its own `planning` schema so it is NOT auto-published by Martin
-- (martin.yaml only publishes `public`) and is untouched by the daily viewer
-- cache-clear. Result geometries are keyed by run_id (= prisma."PlanningRun".id)
-- and are immutable once written: a re-run produces a new run_id.
--
-- Idempotent: applied on worker startup and safe to run repeatedly.

CREATE SCHEMA IF NOT EXISTS planning;

CREATE TABLE IF NOT EXISTS planning.scenario_hexagons (
  run_id                  bigint NOT NULL,
  h3_id                   text   NOT NULL,
  geom                    geometry(Polygon, 3857) NOT NULL,
  mce_gesamtscore         real,
  score_radweg            real,
  score_zielorte          real,
  score_hangneigung       real,
  score_oepnv             real,
  score_vegetation        real,
  eignungsklasse          text
);

-- Backfill for existing tables (CREATE TABLE IF NOT EXISTS above does not add
-- columns to an existing table).
ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS score_vegetation real;

-- Separate sub-scores (issue #3415): demand likelihood (ÖPNV, Zielorte)
-- and build likelihood (Radweg, Hangneigung
-- + modifiers + exclusion). NULL for legacy runs or when the
-- group is entirely unweighted in the scenario. mce_gesamtscore stays the
-- unchanged combination.
ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS score_bedarf real;
ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS score_bebauung real;

-- Intersection bonus: boost near curb corners (bicycle parking); NULL when
-- the factor (w_intersection) is not weighted in the scenario.
ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS score_kreuzung real;

-- Parking bonus: boost on/near existing car parking areas (conversion to
-- bicycle parking); NULL when the factor (w_parken) is not weighted in the
-- scenario.
ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS score_parken real;

-- Square bonus/penalty: signed effect (bonus > 0 / penalty < 0, per
-- platz_direction) on/near squares (place=square); NULL when the factor
-- (w_platz) is not weighted in the scenario.
ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS score_platz real;

-- Pedestrian zone bonus: especially high boost at corners where a street meets
-- a pedestrian zone (demand group); NULL when the factor
-- (w_fussgaengerzone) is not weighted in the scenario.
ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS score_fussgaengerzone real;

-- Existing-facility demand reduction: existing bicycle parking
-- (public."bicycleParking_points") lowers demand around it; NULL when
-- the factor (w_bestand) is not weighted in the scenario. Signed penalty (≤ 0).
ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS score_bestand real;

-- Eigene Daten (user uploads): sum of the bonuses/penalties of all bonus/penalty datasets in
-- points inside the (buffered) geometry; NULL when no such dataset with strength > 0
-- applies (only exclusion datasets or no datasets).
ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS score_eigendaten real;

-- Bewohnerbedarf (census): boost in points around inhabited buildings, from the
-- weighted population neighborhood sum (data.census_population_point) normalized
-- against the saturation value. 0 on hexagons that intersect a building themselves;
-- NULL when the factor (w_bewohnerbedarf) is not weighted.
ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS score_bewohnerbedarf real;

-- Area clusters (connected-component labeling over H3 neighborhood): total
-- area of the contiguous area a hexagon belongs to (only cells with
-- mce_gesamtscore >= min_score_threshold; otherwise NULL). The client filters on it
-- for a target size. Only set on the fine grid (res 13).
ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS cluster_area_m2 real;

-- H3 resolution of the row: BASE (13) = fine scoring grid for high zoom
-- levels, AGG (11) = coarse aggregate for z < 16. Both grids of the same
-- run live in this table; the Martin function planning_hexagons picks one
-- per zoom level. Default 13 so existing rows count as BASE grid.
ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS resolution smallint NOT NULL DEFAULT 13;

-- Does the hexagon lie on a building (public._buildings)? Such cells are
-- hard-excluded (mce_gesamtscore = 0); the flag lets the sidebar show the
-- exclusion reason „Gebäude". Only set on the fine grid (res 13).
ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS gebaeude boolean NOT NULL DEFAULT false;

-- Does the hexagon lie on a carriageway (public._parking_roads, buffered by
-- the street width)? Only set when „Fahrbahnen ausschließen" was active;
-- such cells are hard-excluded (mce_gesamtscore = 0). Only set on the
-- fine grid (res 13).
ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS fahrbahn boolean NOT NULL DEFAULT false;

-- Does the hexagon lie in the exclusion area of user areas (user upload, dataset with
-- mode = exclude_inside/exclude_outside)? Only set in that case;
-- such cells are hard-excluded (mce_gesamtscore = 0). The flag
-- lets the sidebar show the exclusion reason even though
-- score_eigendaten stays NULL in this mode. Only set on the fine grid (res 13).
ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS eigendaten_ausschluss boolean NOT NULL DEFAULT false;

-- Per hexagon, how each Eigene-Daten dataset applied: JSON text like
-- [{"id":"a","p":12.5},{"id":"b","x":1}] (p = points, x = excluded). NULL where no
-- dataset applies, on the aggregate grid and for legacy runs.
ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS eigendaten_details text;

-- Potential areas (polygons derived from hexagons) are no longer
-- computed; clean up leftovers from earlier runs.
DROP TABLE IF EXISTS planning.scenario_areas;

-- On-demand computed vegetation areas (NDVI), stored per run.
CREATE TABLE IF NOT EXISTS planning.scenario_vegetation (
  run_id     bigint NOT NULL,
  geom       geometry(MultiPolygon, 3857) NOT NULL,
  ndvi       real,
  flaeche_m2 real
);

-- Buffered carriageway areas (public._parking_roads, width as buffer), stored per
-- run. Only filled when „Fahrbahnen ausschließen" was active
-- (see scenario_hexagons.fahrbahn); used here for the map display.
CREATE TABLE IF NOT EXISTS planning.scenario_carriageways (
  run_id   bigint NOT NULL,
  geom     geometry(MultiPolygon, 3857) NOT NULL,
  width_m  real
);

CREATE INDEX IF NOT EXISTS scenario_hexagons_run_id_idx ON planning.scenario_hexagons (run_id);
CREATE INDEX IF NOT EXISTS scenario_hexagons_run_res_idx ON planning.scenario_hexagons (run_id, resolution);
CREATE INDEX IF NOT EXISTS scenario_hexagons_geom_idx   ON planning.scenario_hexagons USING gist (geom);
CREATE INDEX IF NOT EXISTS scenario_vegetation_run_id_idx ON planning.scenario_vegetation (run_id);
CREATE INDEX IF NOT EXISTS scenario_vegetation_geom_idx   ON planning.scenario_vegetation USING gist (geom);
CREATE INDEX IF NOT EXISTS scenario_carriageways_run_id_idx ON planning.scenario_carriageways (run_id);
CREATE INDEX IF NOT EXISTS scenario_carriageways_geom_idx   ON planning.scenario_carriageways USING gist (geom);
