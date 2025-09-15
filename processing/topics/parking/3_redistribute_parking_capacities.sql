UPDATE _parking_parkings_cutted
SET
  geom = ST_SnapToGrid (geom, 0.1);

-- first we delete all parking lots where the length of the geometry is zero.
DELETE FROM _parking_parkings_cutted
WHERE
  ST_Length (geom) = 0;

-- then we redistribute the parking capacities based on the length of the geometry and the original capacity.
-- this is done by calculating the total length of all geometries with the same id and then redistributing the capacity proportionally for each geometry.
WITH
  total_lengths AS (
    SELECT
      original_id,
      SUM(ST_Length (geom)) AS length,
      COUNT(*) AS count
    FROM
      _parking_parkings_cutted
    WHERE
      tags ? 'capacity'
    GROUP BY
      original_id
  )
UPDATE _parking_parkings_cutted pc
SET
  tags = tags - ARRAY['area', 'area_source', 'area_confidence'] || jsonb_build_object(
    'capacity',
    (tags ->> 'capacity')::NUMERIC * ST_Length (pc.geom) / tl.length,
    'capacity_source',
    tags ->> 'capacity_source' || ' (redistributed)'
  )
FROM
  total_lengths tl
WHERE
  tl.count > 1
  AND pc.original_id = tl.original_id;
