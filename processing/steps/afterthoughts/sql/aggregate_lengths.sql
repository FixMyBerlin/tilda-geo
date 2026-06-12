-- Afterthought: populate public.aggregated_lengths from roads, bikelanes, and boundaries.
-- Ported from app/src/server/statistics/analysis/aggregateLengths.server.ts

CREATE OR REPLACE FUNCTION atlas_segmentize_linestring(input_geom Geometry(LineString), input_length FLOAT, res INT)
RETURNS TABLE(
  length FLOAT,
  geom Geometry(point)
)
AS $$
DECLARE
  n INT := greatest(round(input_length / res), 1)::INT;
BEGIN
  RETURN query
  SELECT
    input_length / n as length,
    ST_SetSRID
    (
      ST_LineInterpolatePoint(input_geom, (generate_series(1, n) - 0.5) / n),
      ST_SRID(input_geom)
    ) AS geom;
END;
$$
LANGUAGE plpgsql;

DROP TABLE IF EXISTS temp_bikelanes_segmentized;
CREATE TABLE temp_bikelanes_segmentized AS
  SELECT
    id,
    tags->>'category' AS aggregator_key,
    CASE
      WHEN tags->>'oneway' = 'yes' THEN 1
      WHEN tags->>'oneway' = 'implicit_yes' THEN 1
      ELSE 2
    END AS factor,
    (atlas_segmentize_linestring(geom, (tags->>'length')::FLOAT, 100)).*
  FROM
    bikelanes;

CREATE INDEX temp_bikelanes_segmentized_geom_idx ON temp_bikelanes_segmentized USING gist(geom);
CREATE INDEX temp_bikelanes_segmentized_aggregator_idx ON temp_bikelanes_segmentized (aggregator_key);

DROP TABLE IF EXISTS temp_roads_segmentized;
CREATE TABLE temp_roads_segmentized AS
  SELECT
    id,
    tags->>'road' AS aggregator_key,
    CASE
      WHEN tags->>'oneway' = 'yes' THEN 1
      WHEN tags->>'oneway' = 'yes_dual_carriageway' THEN 1
      ELSE 2
    END AS factor,
    (atlas_segmentize_linestring(geom, (tags->>'length')::FLOAT, 100)).*
  FROM
    roads;

CREATE INDEX temp_roads_segmentized_geom_idx ON temp_roads_segmentized USING gist(geom);
CREATE INDEX temp_roads_segmentized_aggregator_idx ON temp_roads_segmentized (aggregator_key);

CREATE OR REPLACE FUNCTION atlas_aggregate_bikelanes(input_polygon Geometry(MultiPolygon, 3857))
RETURNS JSONB AS $$
DECLARE
  aggregated_length JSONB;
BEGIN
  SELECT
    jsonb_object_agg(aggregator_key, ROUND(total_length_km / 1000.0))
  INTO aggregated_length
  FROM (
    SELECT
      segmentized.aggregator_key,
      SUM(segmentized.length * segmentized.factor) AS total_length_km
    FROM
      temp_bikelanes_segmentized as segmentized
    WHERE
      ST_Intersects(segmentized.geom, input_polygon)
    GROUP BY
      segmentized.aggregator_key
  ) AS aggregated_data;

  RETURN aggregated_length;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION atlas_aggregate_roads(input_polygon Geometry(MultiPolygon, 3857))
RETURNS JSONB AS $$
DECLARE
  aggregated_length JSONB;
BEGIN
  SELECT
    jsonb_object_agg(aggregator_key, ROUND(total_length_km / 1000.0))
  INTO aggregated_length
  FROM (
    SELECT
      segmentized.aggregator_key,
      SUM(segmentized.length * segmentized.factor) AS total_length_km
    FROM
      temp_roads_segmentized as segmentized
    WHERE
      ST_Intersects(segmentized.geom, input_polygon)
    GROUP BY
      segmentized.aggregator_key
  ) AS aggregated_data;

  RETURN aggregated_length;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS aggregated_lengths
(
  id TEXT UNIQUE,
  name TEXT,
  level TEXT,
  geom Geometry(MultiPolygon, 3857),
  regionalschluessel TEXT,
  bikelane_length JSONB,
  road_length JSONB
);

-- TODO(2026-12): Remove ALTER ADD COLUMN when all deployments are migrated.
ALTER TABLE aggregated_lengths ADD COLUMN IF NOT EXISTS regionalschluessel TEXT;

BEGIN;

INSERT INTO aggregated_lengths (id, name, level, geom, regionalschluessel, bikelane_length, road_length)
SELECT
  id,
  tags->>'name',
  tags->>'admin_level',
  geom,
  tags->>'regionalschluessel',
  atlas_aggregate_bikelanes(geom),
  atlas_aggregate_roads(geom)
FROM boundaries
WHERE (tags->>'admin_level')::TEXT = '4'
  OR (tags->>'admin_level')::TEXT = '6'
ON CONFLICT (id)
  DO UPDATE SET
    regionalschluessel = EXCLUDED.regionalschluessel,
    bikelane_length = EXCLUDED.bikelane_length,
    road_length = EXCLUDED.road_length;

DROP INDEX IF EXISTS aggregated_lengths_geom_idx;
CREATE INDEX aggregated_lengths_geom_idx ON aggregated_lengths USING gist(geom);

DROP TABLE temp_roads_segmentized;
DROP TABLE temp_bikelanes_segmentized;

COMMIT;
