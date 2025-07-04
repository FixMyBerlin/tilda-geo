DO $$ BEGIN RAISE NOTICE 'START estimating parking capacity at %', clock_timestamp(); END $$;

-- add length and delete short parkings
ALTER TABLE _parking_parkings_merged
ADD COLUMN length numeric;

UPDATE _parking_parkings_merged
SET
  length = ST_Length (geom);

-- estimate capacity
ALTER TABLE _parking_parkings_merged
ADD COLUMN estimated_capacity numeric;

UPDATE _parking_parkings_merged
SET
  estimated_capacity = estimate_capacity (length, tags ->> 'orientation');

UPDATE _parking_parkings_merged pm
SET
  tags = tags || jsonb_build_object('capacity', estimated_capacity) || '{"capacity_source": "estimated", "capacity_confidence": "medium"}'::JSONB
WHERE
  tags ->> 'capacity' IS NULL;

DROP TABLE IF EXISTS _parking_discarded;

SELECT
  * INTO _parking_discarded
FROM
  _parking_parkings_merged
WHERE
  (tags ->> 'capacity')::NUMERIC < 1;

UPDATE _parking_discarded
SET
  tags = tags || '{"reason": "capacity < 1"}'::JSONB;

CREATE INDEX parking_discarded_idx ON _parking_discarded USING BTREE (id);

DELETE FROM _parking_parkings_merged
WHERE
  id IN (
    SELECT
      id
    FROM
      _parking_discarded
  );

UPDATE _parking_parkings_merged
SET
  tags = tags || jsonb_build_object(
    'capacity',
    ROUND(((tags ->> 'capacity')::NUMERIC))
  );

-- MISC
ALTER TABLE _parking_parkings_merged
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

ALTER TABLE _parking_discarded
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

-- create an index on the merged table
CREATE INDEX parking_parkings_merged_geom_idx ON _parking_parkings_merged USING GIST (geom);

CREATE INDEX parking_parkings_merged_osm_ids_idx ON _parking_parkings_merged USING GIN (original_osm_ids);

CREATE INDEX parking_parkings_discared_geom_idx ON _parking_discarded USING GIST (geom);
