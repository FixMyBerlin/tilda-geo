DO $$ BEGIN RAISE NOTICE 'START filtering separate parking where the kerb has `parking != separate`%', clock_timestamp(); END $$;

SELECT
  osm_id,
  side INTO TEMP separate_parkings
FROM
  _parking_road_parkings
WHERE
  tags ->> 'parking' = 'separate';

CREATE INDEX separate_parkings_idx ON separate_parkings (osm_id, side);

DELETE FROM _parking_separate_parking_areas_projected
WHERE
  (kerb_osm_id, kerb_side) NOT IN (
    SELECT
      osm_id,
      side
    FROM
      separate_parkings
  );

DELETE FROM _parking_separate_parking_points_projected
WHERE
  (kerb_osm_id, kerb_side) NOT IN (
    SELECT
      osm_id,
      side
    FROM
      separate_parkings
  );
