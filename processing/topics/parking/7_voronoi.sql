DROP TABLE IF EXISTS parkings_euvm_qa_voronoi;

SELECT
  * INTO parkings_euvm_qa_voronoi
FROM
  data.euvm_qa_voronoi;

ALTER TABLE parkings_euvm_qa_voronoi
ADD COLUMN count_fmc INTEGER;

WITH
  counts AS (
    SELECT
      v.id,
      COUNT(p.*) AS count_fmc
    FROM
      parkings_euvm_qa_voronoi v
      LEFT JOIN parkings_sum_points p ON ST_Contains (v.geom, p.geom)
    GROUP BY
      v.id
  )
UPDATE parkings_euvm_qa_voronoi pv
SET
  count_fmc = COALESCE(c.count_fmc, 0)
FROM
  counts c
WHERE
  pv.id = c.id;

ALTER TABLE parkings_euvm_qa_voronoi
ADD COLUMN difference INTEGER;

UPDATE parkings_euvm_qa_voronoi
SET
  difference = count_euvm - count_fmc;

ALTER TABLE parkings_euvm_qa_voronoi
ADD COLUMN relative NUMERIC;

UPDATE parkings_euvm_qa_voronoi
SET
  relative = CASE
    WHEN count_euvm <> 0 THEN count_fmc::NUMERIC / count_euvm::NUMERIC
    ELSE NULL
  END;
