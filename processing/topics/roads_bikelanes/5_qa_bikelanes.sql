-- WHAT IT DOES:
-- QA for dataset `bikelanes`: the meters of bikelane per cell, for every indicator of every active
-- prisma."QaConfig" with dataset = 'bikelanes'. A line that crosses a cell border counts in each
-- cell with the share of its length that lies inside (processing/measure/measure_functions.sql).
-- 1. Build _qa_features within the extent of the configs' area tables
--    - Bikelanes stay on the road centerline in the DB, but the QA cells are per street side:
--      tilda_qa_side_lines moves each line by |offset| to the right of its own direction, for QA
--      only. Left-side lines run against the OSM way (roads_bikelanes_bikelanes.lua), so
--      "right of the line" is the correct street side for both sides (like the map style).
--    - amount = tags.length (meters), split over the side-line parts by part length
--    - tags as the QA compares them (tilda_qa_bikelane_tags: derived oneway values count as tagged)
--    - osm_user / updated_at from meta (last OSM editor, for trusted editors)
-- 2. tilda_qa_run_dataset (processing/qa/qa_functions.sql): measure, compare to the reference,
--    write the output tables
-- INPUT: public.bikelanes (left-side lines reversed on import), prisma."QaConfig",
--        per config: areaTable (e.g. data.euvm_qa_voronoi_2026), referenceTable (e.g. data.qa_bikelanes_berlin_reference_2026)
-- OUTPUT: per config (mapTable = public.<name>): public.<name>, public.<name>_indicators,
--         public.<name>_last_editors
--
DO $$ BEGIN RAISE NOTICE 'START qa bikelanes at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

DROP TABLE IF EXISTS pg_temp._qa_features;

CREATE TEMP TABLE _qa_features (
  geom geometry (LineString, 5243), -- 5243 (Germany, meters) for the side shift
  amount NUMERIC,
  tags JSONB,
  osm_user TEXT,
  updated_at BIGINT -- epoch seconds
);

INSERT INTO
  _qa_features (geom, amount, tags, osm_user, updated_at)
SELECT
  side.geom,
  (b.tags ->> 'length')::NUMERIC * side.share,
  tilda_qa_bikelane_tags (b.tags),
  b.meta ->> 'updated_by',
  (b.meta ->> 'updated_at')::BIGINT
FROM
  tilda_measure_bikelanes ((SELECT tilda_qa_dataset_extent ('bikelanes', 3857))) b
  CROSS JOIN LATERAL tilda_qa_side_lines (
    ST_Transform (b.geom, 5243),
    - ABS((b.tags ->> 'offset')::NUMERIC)
  ) side;

CREATE INDEX _qa_features_geom_idx ON _qa_features USING GIST (geom);

CALL tilda_qa_run_dataset ('bikelanes');

DROP TABLE _qa_features;

DO $$ BEGIN RAISE NOTICE 'END qa bikelanes at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;
