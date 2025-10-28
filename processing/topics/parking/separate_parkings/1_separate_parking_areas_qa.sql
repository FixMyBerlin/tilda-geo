DROP TABLE IF EXISTS _parking_separate_parking_areas_qa;

CREATE TABLE _parking_separate_parking_areas_qa AS
SELECT
  p.osm_id,
  p.tags,
  l.total_length as projected_length,
  ST_Area (p.geom) as area,
  ST_Centroid (p.geom) as geom
FROM
  _parking_separate_parking_areas p
  JOIN (
    SELECT
      osm_id,
      SUM(ST_Length (geom)) AS total_length
    FROM
      _parking_separate_parking_areas_projected
    GROUP BY
      osm_id
  ) l ON p.osm_id = l.osm_id;

ALTER TABLE _parking_separate_parking_areas_qa
ADD COLUMN area_estimated NUMERIC;

UPDATE _parking_separate_parking_areas_qa
SET
  area_estimated = estimate_area (projected_length::NUMERIC, tags ->> 'orientation');

ALTER TABLE _parking_separate_parking_areas_qa
ADD COLUMN area_difference NUMERIC;

UPDATE _parking_separate_parking_areas_qa
SET
  area_difference = area - area_estimated;

ALTER TABLE _parking_separate_parking_areas_qa
ADD COLUMN area_difference_relative NUMERIC;

UPDATE _parking_separate_parking_areas_qa
SET
  area_difference_relative = area_difference / area;

-- delete every entry where we overestimated the area by less than 30%
DELETE FROM _parking_separate_parking_areas_qa
WHERE
  area_difference_relative < 0
  AND ABS(area_difference_relative) < 0.3;

-- delete every entry where underestimated the area by less than 20%
DELETE FROM _parking_separate_parking_areas_qa
WHERE
  area_difference_relative > 0
  and area_difference_relative < 0.2;

ALTER TABLE _parking_separate_parking_areas_qa
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

DROP INDEX IF EXISTS parking_separate_parking_areas_qa_geom_idx;

CREATE INDEX parking_separate_parking_areas_qa_geom_idx ON _parking_separate_parking_areas_qa USING GIST (geom);
