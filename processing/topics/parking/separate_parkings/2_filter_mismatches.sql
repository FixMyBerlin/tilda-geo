DO $$ BEGIN RAISE NOTICE 'START filtering separate parking where the kerb has `parking != separate`%', clock_timestamp(); END $$;

SELECT
  id INTO TEMP separate_parkings
FROM
  _parking_road_parkings
WHERE
  tags ->> 'parking' = 'separate';

CREATE INDEX separate_parkings_idx ON separate_parkings (id);

DELETE FROM _parking_separate_parking_areas_projected
WHERE
  kerb_id NOT IN (
    SELECT
      id
    FROM
      separate_parkings
  );

DELETE FROM _parking_separate_parking_points_projected
WHERE
  kerb_id NOT IN (
    SELECT
      id
    FROM
      separate_parkings
  );
