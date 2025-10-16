-- Cleanup duplicate `todos_lines`
-- ====================
-- Our process creates duplicated entries whenever encounter a transformed geometry.
-- Those results have identical tags, except for the `id` which has a `/left` or `/right` postfix.
-- It's very complex to skip those duplications during line-by-line processing, due to the complexity of `cycleway`|`cycleway:SIDE`
-- Our workaround is, to remove all identical lines except for one, which is what this script does.
--
DO $$ BEGIN RAISE NOTICE 'START cleanup todos_lines %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

WITH
  duplicates AS (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY
          osm_type,
          osm_id,
          'table',
          tags,
          meta,
          geom,
          length,
          minzoom
        ORDER BY
          id
      ) AS rn
    FROM
      todos_lines
  )
DELETE FROM todos_lines
WHERE
  id IN (
    SELECT
      id
    FROM
      duplicates
    WHERE
      rn % 2 = 0
  );
