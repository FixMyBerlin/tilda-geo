-- WHAT IT DOES:
-- Project separate parking points to kerb lines (convert point to linestring).
-- * Project point to closest kerb, buffer based on capacity, re-project to get final kerb segment
-- INPUT: `_parking_separate_parking_points` (point), `_parking_kerbs` (linestring), `_parking_orientation_constants`
-- OUTPUT: `_parking_separate_parking_points_projected` (linestring)
--
DO $$ BEGIN RAISE NOTICE 'START projecting obstacle points at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

DROP TABLE IF EXISTS _parking_separate_parking_points_projected CASCADE;

-- Project point to closest kerb and buffer based on capacity
-- * Project point to closest kerb using `project_to_k_closest_kerbs` (within 5m tolerance)
-- * Buffer projected point based on capacity and orientation (parallel/perpendicular/diagonal)
--   - Orientation determines constants from `_parking_orientation_constants` table (defined in `estimate_capacity.sql`):
--     * `car_space_x`: space per car along kerb (parallel=4.4m, perpendicular=2.0m, diagonal=calculated)
--     * `padding`: space between cars (parallel=0.8m, perpendicular=0.5m, diagonal=calculated)
--   - Buffer radius = ((car_space_x + padding) * capacity - padding) / 2
--     Formula calculates total length needed for N cars, then divides by 2 to get radius from center
--   - Defaults to 'parallel' if orientation tag is missing
CREATE TEMP TABLE _parking_separate_parking_points_snapped AS
SELECT
  pp.id || '-' || pk.kerb_id AS id,
  pp.osm_type,
  pp.osm_id,
  pp.id AS source_id,
  oc.car_space_x,
  oc.padding,
  pp.tags,
  pp.meta,
  pk.kerb_side AS side,
  pk.*,
  ST_Buffer (
    pk.geom,
    (
      (car_space_x + padding) * (pp.tags ->> 'capacity')::NUMERIC - padding
    ) / 2
  ) AS buffered_geom
FROM
  _parking_separate_parking_points pp
  JOIN _parking_orientation_constants oc ON oc.orientation = COALESCE(pp.tags ->> 'orientation', 'parallel')
  CROSS JOIN LATERAL (
    SELECT
      *
    FROM
      project_to_k_closest_kerbs (pp.geom, tolerance := 5, k := 1)
  ) pk;

-- Cleanup invalid geometries that sometimes happen during projection
DELETE FROM _parking_separate_parking_points_snapped
WHERE
  geom IS NULL;

-- Re-project buffered geometry to kerb to create final linestring segment (using `project_to_k_closest_kerbs`)
CREATE TABLE _parking_separate_parking_points_projected AS
SELECT
  id || '-' || pk.kerb_id AS id,
  osm_type,
  osm_id,
  side,
  tags,
  meta,
  id AS source_id,
  pk.*
FROM
  _parking_separate_parking_points_snapped
  CROSS JOIN LATERAL project_to_k_closest_kerbs (buffered_geom, tolerance := 5, k := 1) pk;

-- Filter: Remove cases where kerb_side doesn't match the original side tag for some reason
DELETE FROM _parking_separate_parking_points_projected
WHERE
  kerb_side <> side;

ALTER TABLE _parking_separate_parking_points_projected
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE INDEX parking_separate_parking_points_projected_geom_idx ON _parking_separate_parking_points_projected USING gist (geom);
