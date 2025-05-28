-- We have a table data.mapillary_coverage which we update manually.
-- On every run, we copy the latest data from that table to some of our user facing tables.
-- For now, we add those mapillary_* keys to the `meta` column.
--
CREATE OR REPLACE FUNCTION copy_mapillary_coverage_tags (target_table text) RETURNS void AS $$
BEGIN
    -- Check if data.mapillary_coverage table exists
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'data'
      AND table_name = 'mapillary_coverage'
  ) THEN
    -- Dynamic SQL to update the passed table
    EXECUTE format(
      'UPDATE %s t
       SET meta = jsonb_set(
         COALESCE(t.meta, ''{}''),
         ''{mapillary_coverage}'',
         to_jsonb(m.mapillary_coverage)
       )
       FROM data.mapillary_coverage m
       WHERE t.osm_id = m.osm_id;',
      target_table
    );
  ELSE
  --
    RAISE NOTICE 'Skipped: data.mapillary_coverage does not exist';
  END IF;

  RAISE NOTICE 'copy_mapillary_coverage_tags finished for table %', target_table;
END;
$$ LANGUAGE plpgsql;
