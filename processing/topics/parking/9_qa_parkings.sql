-- WHAT IT DOES:
-- QA for dataset `parking_euvm`: the public parking spaces per cell, for every indicator of every
-- active prisma."QaConfig" with dataset = 'parking_euvm'
-- (today: main cells `areaFilter = non_priority`, priority cells `areaFilter = priority`).
-- A parking line or lot that crosses a cell border counts in each cell with the share that lies
-- inside (processing/measure/measure_functions.sql).
-- 1. Build _qa_features within the extent of the configs' area tables: the parking lines along
--    the streets (excl. private) and the public parking lots; amount = capacity;
--    osm_user / updated_at from meta (last OSM editor of the source way/area, for trusted editors)
-- 2. tilda_qa_run_dataset (processing/qa/qa_functions.sql): measure, compare to the reference,
--    write the output tables
-- INPUT: public.parkings, public.off_street_parking_areas, prisma."QaConfig",
--        per config: areaTable (e.g. data.euvm_qa_voronoi_2026), referenceTable (e.g. data.qa_parkings_euvm_reference_2026)
-- OUTPUT: per config (mapTable = public.<name>): public.<name>, public.<name>_indicators,
--         public.<name>_last_editors
--
DO $$ BEGIN RAISE NOTICE 'START qa parkings at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

-- RUN ONCE PER ENV, THEN DELETE (by end of 2026 in any case).
-- Tables and functions that nothing reads any more.
DROP TABLE IF EXISTS public.qa_parkings_euvm_previous, public.qa_parkings_euvm_priority_previous;
DROP TABLE IF EXISTS public.parkings_quantized, public.off_street_parking_quantized;
DROP FUNCTION IF EXISTS tilda_explode_parkings (geometry, integer), tilda_quantize_polygon (geometry, integer), atlas_segmentize_linestring (geometry, double precision, integer);

DROP TABLE IF EXISTS pg_temp._qa_features;

CREATE TEMP TABLE _qa_features (
  geom geometry (Geometry, 5243),
  amount NUMERIC,
  tags JSONB,
  osm_user TEXT,
  updated_at BIGINT -- epoch seconds
);

INSERT INTO
  _qa_features (geom, amount, tags, osm_user, updated_at)
SELECT
  ST_Transform (geom, 5243),
  (tags ->> 'capacity')::NUMERIC,
  tags,
  meta ->> 'updated_by',
  (meta ->> 'updated_at')::BIGINT
FROM
  tilda_measure_parking ((SELECT tilda_qa_dataset_extent ('parking_euvm', 3857)))
WHERE
  CASE part
    WHEN 'street' THEN tags ->> 'operator_type' IS DISTINCT FROM 'private'
    ELSE tags ->> 'operator_type' = 'public'
  END;

CREATE INDEX _qa_features_geom_idx ON _qa_features USING GIST (geom);

CALL tilda_qa_run_dataset ('parking_euvm');

DROP TABLE _qa_features;

DO $$ BEGIN RAISE NOTICE 'END qa parkings at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;
