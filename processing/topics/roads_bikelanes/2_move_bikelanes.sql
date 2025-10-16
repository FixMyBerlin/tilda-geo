-- Move bikelanes based on offset
-- 1. Change projection (to EPSG:5243) to allow geometric operations
-- 2. Move the geometry by offset (+ left / - right)
--    - This reverses the geometry direction for negative offset values (right hand side) which is good and bad
--      - Good, because we now have a different direction per side
--      - Bad, because the direction is for left hand traffic, now (See step 3)
--    - Additionally we check wether the geometry is `simple` because otherwise we might get a MLString for the same reason we simplify the geometries
-- 3. Reverse direction of geometry for all ways that we touched before (see "Bad" above)
--
DO $$ BEGIN RAISE NOTICE 'START move bikelanes by offset %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

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
  geom = ST_Reverse (geom)
WHERE
  ST_IsSimple (geom)
  AND NOT ST_IsClosed (geom)
  AND tags ? 'offset';
