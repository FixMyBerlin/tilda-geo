-- Afterthought: populate public.aggregated_lengths from roads, bikelanes, and boundaries.
-- Table shell is created at processing initialize; this run fills/updates rows.

DO $$ BEGIN
  RAISE NOTICE '[Afterthoughts][Statistics] Populate aggregated_lengths at %',
    clock_timestamp() AT TIME ZONE 'Europe/Berlin';
END $$;

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

DO $$
DECLARE
  row_count INT;
BEGIN
  SELECT count(*) INTO row_count FROM public.aggregated_lengths;
  RAISE NOTICE '[Afterthoughts][Statistics] Populated % rows at %',
    row_count,
    clock_timestamp() AT TIME ZONE 'Europe/Berlin';
END $$;
