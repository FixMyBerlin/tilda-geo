/* sql-formatter-disable */
-- WHAT IT DOES:
-- Statistik: kilometers of bikelanes (per category) and roads (per road class) for every
-- Bundesland and Kreis, into public.aggregated_lengths (table shell: initialize_aggregated_lengths.sql).
-- A line that crosses a boundary counts on each side with the share of its length that lies there
-- (processing/measure/measure_functions.sql).
-- Kilometers are per direction: a line that is not oneway counts twice (`length_directions`).
-- INPUT: public.boundaries (admin_level 4 and 6), datasets `bikelanes` and `roads` (part roads only)
-- OUTPUT: public.aggregated_lengths (bikelane_length, road_length: {class: km}); read by /api/stats
--
DO $$ BEGIN
  RAISE NOTICE '[Afterthoughts][Statistics] Populate aggregated_lengths at %',
    clock_timestamp() AT TIME ZONE 'Europe/Berlin';
END $$;

WITH
areas AS (
  SELECT id, tags, geom FROM boundaries WHERE tags ->> 'admin_level' IN ('4', '6')
),
kilometers AS (
  SELECT
    a.id,
    f.part,
    COALESCE(f.tags ->> 'category', f.tags ->> 'road') AS class,
    ROUND(SUM(
      (f.tags ->> 'length_directions')::FLOAT
      * tilda_measure_share(a.geom, f.geom)
    ) / 1000) AS km
  FROM areas a
  CROSS JOIN LATERAL (
    SELECT * FROM tilda_measure_bikelanes(a.geom)
    UNION ALL
    SELECT * FROM tilda_measure_roads(a.geom) WHERE part = 'roads'
  ) f
  WHERE ST_Intersects(a.geom, f.geom)
  GROUP BY 1, 2, 3
)
INSERT INTO aggregated_lengths (id, name, level, geom, regionalschluessel, bikelane_length, road_length)
SELECT
  a.id,
  a.tags ->> 'name',
  a.tags ->> 'admin_level',
  a.geom,
  a.tags ->> 'regionalschluessel',
  (SELECT jsonb_object_agg(k.class, k.km) FROM kilometers k WHERE k.id = a.id AND k.part = 'bikelanes'),
  (SELECT jsonb_object_agg(k.class, k.km) FROM kilometers k WHERE k.id = a.id AND k.part = 'roads')
FROM areas a
ON CONFLICT (id)
  DO UPDATE SET
    regionalschluessel = EXCLUDED.regionalschluessel,
    bikelane_length = EXCLUDED.bikelane_length,
    road_length = EXCLUDED.road_length;

DO $$
DECLARE
  row_count INT;
BEGIN
  SELECT count(*) INTO row_count FROM public.aggregated_lengths;
  RAISE NOTICE '[Afterthoughts][Statistics] Populated % rows at %',
    row_count,
    clock_timestamp() AT TIME ZONE 'Europe/Berlin';
END $$;
