-- Helper to remove values and possibly lines from todo_lines.
--
-- We have a table public.todos_lines which has a tags column.
-- The tags column {"missing_width": "prio2", "missing_width_surface_set__mapillary": "prio2"}
-- We need do two things:
-- 1. Find all the rows that _do not_ have a `meta.mapillary_coverage` value (which is a string)
--    And delete the keys that end with `*__mapillary` from the `tags` column of those rows
-- 2. Check all rows if they have at least one property in `tags`. If not, delete those rows.
CREATE OR REPLACE FUNCTION delete_todos_lines_without_mapillary_coverage () RETURNS void AS $$
BEGIN
  -- 1. Remove keys ending with '__mapillary' from tags where meta.mapillary_coverage is missing
  UPDATE public.todos_lines
  SET tags = (
    SELECT jsonb_object_agg(key, value)
    FROM jsonb_each(tags)
    WHERE key NOT LIKE '%__mapillary'
  )
  WHERE (meta->>'mapillary_coverage') IS NULL;

  -- 2. Delete rows where tags is empty or null
  DELETE FROM public.todos_lines
  WHERE tags IS NULL OR tags = '{}'::jsonb;

  RAISE NOTICE 'delete_todos_lines_without_mapillary_coverage finished';
END;
$$ LANGUAGE plpgsql;
