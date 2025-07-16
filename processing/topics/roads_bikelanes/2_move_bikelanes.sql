-- Move bikelanes based on offset
-- 1. Project to cartesian coordinates
-- 2. Move the geometry by offset (+ left / - right)
--    Because negative offsets reverse the order and we want the right side to be aligned we reverse the order again
--    Additionally we check wether the geometry is `simple` because otherwise we might get a MLString
--    for the same reason we simplify the geometries
-- 3. Reverse order for right side
--
-- Ideas for improvements:
-- IDEA 1: maybe we can transform closed geometries with some sort of buffer function:
--   at least for the cases where we buffer "outside"(side=right) this should always yield a LineString
-- IDEA 2: scale around center of geom (would require to estimate the scaling factor)
--   Query below shows the geometries that would result in MultiLineString
-- SELECT * from "bikelanes" WHERE not ST_IsSimple(geom) or ST_IsClosed(geom);
--
DO $$ BEGIN RAISE NOTICE 'START move bikelanes by offset %', clock_timestamp(); END $$;

UPDATE bikelanes
SET
  geom = ST_Transform (
    ST_OffsetCurve (
      ST_Simplify (ST_Transform (geom, 5243), 0.5),
      (tags ->> 'offset')::numeric
    ),
    3857
  )
WHERE
  ST_IsSimple (geom)
  AND NOT ST_IsClosed (geom)
  AND tags ? 'offset';

UPDATE bikelanes
SET
  geom = ST_Reverse (geom);
