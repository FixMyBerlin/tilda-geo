/* sql-formatter-disable */
-- WHAT IT DOES:
-- "How much of a dataset lies inside an area" — the one rule shared by QA (cells), Statistik
-- (boundaries) and Summieren (drawn areas). Functions only, no data; loaded once per run
-- (processing/dataTables/dataTables.ts) before any topic SQL.
--
-- The rule: every feature carries amounts (numeric tags: `capacity`, `length`, …). An area gets
-- the share of the feature that lies inside it:
--   point  all or nothing
--   line   by length
--   area   by area
-- A caller sums `share * amount`. Sums can be fractional (89.6 parking spaces); round for display only.
--
-- * tilda_measure_share:      the share of one feature inside one area
-- * tilda_measure_<dataset>:  the features of a dataset, the same for every caller
-- * tilda_measure_sum:        Summieren: the amounts of datasets inside drawn areas
-- Docs: docs/Measure.md
--

-- The dataset functions name topic tables that do not exist on a fresh database.
SET check_function_bodies = off;

-- Share (0…1) of `feature` that lies inside `area`. Both in the same SRID; a ratio, so 3857 is fine.
-- A point exactly on the border of two areas counts for both.
CREATE OR REPLACE FUNCTION tilda_measure_share(area geometry, feature geometry)
RETURNS FLOAT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT CASE
    WHEN ST_Covers(area, feature) THEN 1
    WHEN ST_Dimension(feature) = 1
      THEN COALESCE(ST_Length(ST_Intersection(area, feature)) / NULLIF(ST_Length(feature), 0), 0)
    WHEN ST_Dimension(feature) = 2
      THEN COALESCE(ST_Area(ST_Intersection(area, feature)) / NULLIF(ST_Area(feature), 0), 0)
    ELSE 0
  END
$$;

-- The features of a dataset that touch `extent` (3857), each in its own geometry.
-- `part` names the source table, so callers can filter or break down by it.
-- Amounts are numeric tags: `capacity` (parking, bicycle_parking), `objects` (bicycle_parking: 1 per
-- part, also when its `capacity` is unknown), `length` in meters (bikelanes, roads) and `length_directions`, the meters per
-- direction of travel (`tilda_measure_directions`).
-- One function per dataset, each a single SELECT: the planner inlines it, so the tables are read
-- with their indexes, and a caller only needs the tables of its own dataset to exist.

-- The directions of travel of a line: 1 for a oneway, else 2. Kilometers of a network are
-- compared per direction, so a street with both directions counts like two oneways.
CREATE OR REPLACE FUNCTION tilda_measure_directions(tags JSONB)
RETURNS INT
LANGUAGE sql IMMUTABLE PARALLEL SAFE
AS $$
  SELECT CASE WHEN tags ->> 'oneway' IN ('yes', 'implicit_yes', 'yes_dual_carriageway') THEN 1 ELSE 2 END
$$;

-- `tags` with `length_directions`. Without a numeric `length` the tags stay as they are.
CREATE OR REPLACE FUNCTION tilda_measure_length_tags(tags JSONB)
RETURNS JSONB
LANGUAGE sql IMMUTABLE PARALLEL SAFE
AS $$
  SELECT CASE WHEN jsonb_typeof(tags -> 'length') = 'number'
    THEN tags || jsonb_build_object('length_directions', (tags ->> 'length')::NUMERIC * tilda_measure_directions(tags))
    ELSE tags END
$$;

CREATE OR REPLACE FUNCTION tilda_measure_parking(extent geometry)
RETURNS TABLE (part TEXT, id TEXT, geom geometry, tags JSONB, meta JSONB)
LANGUAGE sql STABLE PARALLEL SAFE
AS $$
  SELECT 'street', id, geom, tags, meta FROM public.parkings WHERE geom && extent
  UNION ALL
  SELECT 'off_street', id, geom, tags, meta FROM public.off_street_parking_areas WHERE geom && extent
$$;

CREATE OR REPLACE FUNCTION tilda_measure_bikelanes(extent geometry)
RETURNS TABLE (part TEXT, id TEXT, geom geometry, tags JSONB, meta JSONB)
LANGUAGE sql STABLE PARALLEL SAFE
AS $$
  SELECT 'bikelanes', id, geom, tilda_measure_length_tags(tags), meta FROM public.bikelanes WHERE geom && extent
$$;

CREATE OR REPLACE FUNCTION tilda_measure_roads(extent geometry)
RETURNS TABLE (part TEXT, id TEXT, geom geometry, tags JSONB, meta JSONB)
LANGUAGE sql STABLE PARALLEL SAFE
AS $$
  SELECT 'roads', id, geom, tilda_measure_length_tags(tags), meta FROM public.roads WHERE geom && extent
  UNION ALL
  SELECT 'paths', id, geom, tilda_measure_length_tags(tags), meta FROM public."roadsPathClasses" WHERE geom && extent
$$;

CREATE OR REPLACE FUNCTION tilda_measure_bicycle_parking(extent geometry)
RETURNS TABLE (part TEXT, id TEXT, geom geometry, tags JSONB, meta JSONB)
LANGUAGE sql STABLE PARALLEL SAFE
AS $$
  -- Every part of a bicycle parking is one point here (`kind` and `capacity` per part, see
  -- processing/topics/bicycleParking). A part mapped as an area has its point inside the area part.
  -- `bicycleParking_areas` holds the same features a second time, as their outline for the map.
  -- A mobility hub is a container for the parkings inside it, not a parking: it is left out.
  -- `objects` counts the parts; a part without `capacity` only counts there.
  SELECT 'points', id, geom, jsonb_build_object('objects', 1) || tags, meta
    FROM public."bicycleParking_points"
    WHERE geom && extent AND tags ->> 'kind' IS DISTINCT FROM 'mobility_hub'
$$;

-- Summieren: the amounts of `datasets` inside the areas a user drew, one row per area, part and
-- combination of the `group_by` tag values.
-- * `datasets`: names of the dataset functions above ('parking' -> tilda_measure_parking), read together
-- * `areas_geojson`: a GeoJSON Polygon or MultiPolygon (4326); every polygon is one area
-- * `area`: the position of the polygon (0, 1, …), NULL for all areas together. That row is
--   measured on their union, so a feature in an overlap counts once.
-- * `properties`: `{tag: value}` of the `group_by` tags, a missing tag is ''
-- * `sums`: `{metric: amount}` for the numeric tags named in `metrics`
-- * `missing`: `{metric: count}` of the features without a number for that metric (only counts > 0);
--   they are not in `sums`, the UI tells how many are left out
-- Dropped first: CREATE OR REPLACE cannot change the columns of an existing function.
DROP FUNCTION IF EXISTS tilda_measure_sum(TEXT[], TEXT, TEXT[], TEXT[]);
CREATE FUNCTION tilda_measure_sum(datasets TEXT[], areas_geojson TEXT, group_by TEXT[], metrics TEXT[])
RETURNS TABLE (area INT, part TEXT, properties JSONB, sums JSONB, missing JSONB)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  features TEXT;
BEGIN
  SELECT string_agg(format('SELECT * FROM %I(areas.geom)', 'tilda_measure_' || name), ' UNION ALL ')
  INTO features
  FROM unnest(datasets) AS name;

  RETURN QUERY EXECUTE format($sql$
    WITH
    polygons AS (
      SELECT
        dump.path[1] - 1 AS area,
        -- A drawn polygon may cross itself.
        ST_Transform(ST_CollectionExtract(ST_MakeValid(dump.geom), 3), 3857) AS geom
      FROM ST_Dump(ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326))) AS dump
    ),
    areas AS (
      SELECT area, geom FROM polygons
      UNION ALL
      -- A single polygon is its own union: its rows are returned twice below.
      SELECT NULL, ST_Union(geom) FROM polygons HAVING COUNT(*) > 1
    ),
    -- Materialized, so the share of a feature is computed once and not per metric.
    shares AS MATERIALIZED (
      SELECT areas.area, feature.part, feature.tags, tilda_measure_share(areas.geom, feature.geom) AS share
      FROM areas
      CROSS JOIN LATERAL (%s) AS feature
      WHERE ST_Intersects(areas.geom, feature.geom)
    ),
    amounts AS (
      SELECT
        shares.area,
        shares.part,
        grouped.properties,
        metric.key,
        SUM(CASE WHEN jsonb_typeof(shares.tags -> metric.key) = 'number'
          THEN shares.share * (shares.tags ->> metric.key)::NUMERIC END) AS amount,
        COUNT(*) FILTER (WHERE jsonb_typeof(shares.tags -> metric.key) IS DISTINCT FROM 'number') AS missing
      FROM shares
      CROSS JOIN LATERAL (
        SELECT COALESCE(jsonb_object_agg(key, COALESCE(btrim(shares.tags ->> key), '')), '{}') AS properties
        FROM unnest($2) AS key
      ) AS grouped
      CROSS JOIN unnest($3) AS metric (key)
      WHERE shares.share > 0
      GROUP BY 1, 2, 3, 4
    ),
    sums AS (
      SELECT
        amounts.area,
        amounts.part,
        amounts.properties,
        COALESCE(jsonb_object_agg(amounts.key, amounts.amount) FILTER (WHERE amounts.amount IS NOT NULL), '{}') AS sums,
        COALESCE(jsonb_object_agg(amounts.key, amounts.missing) FILTER (WHERE amounts.missing > 0), '{}') AS missing
      FROM amounts
      GROUP BY 1, 2, 3
    )
    SELECT * FROM sums
    UNION ALL
    SELECT NULL, sums.part, sums.properties, sums.sums, sums.missing FROM sums WHERE (SELECT COUNT(*) FROM polygons) = 1
  $sql$, features)
  USING areas_geojson, group_by, metrics;
END;
$$;

