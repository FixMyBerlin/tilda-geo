DO $$ BEGIN RAISE NOTICE 'START create _bikelanes_centerline table %', clock_timestamp(); END $$;

DROP TABLE IF EXISTS _bikelanes_centerline;

-- Copy bikelanes to _bikelanes_centerline
-- because `bikelanes` gets updated next
CREATE TABLE _bikelanes_centerline AS
SELECT
  *
FROM
  bikelanes;
