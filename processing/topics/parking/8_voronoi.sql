DROP TABLE IF EXISTS parkings_euvm_qa_voronoi;

SELECT
  * INTO parkings_euvm_qa_voronoi
FROM
  data.euvm_qa_voronoi;

ALTER TABLE parkings_euvm_qa_voronoi
ADD COLUMN count_current INTEGER;

WITH
  counts AS (
    SELECT
      v.id,
      COUNT(p.*) AS count_current
    FROM
      parkings_euvm_qa_voronoi v
      LEFT JOIN parkings_quantized p ON ST_Contains (v.geom, p.geom)
    GROUP BY
      v.id
  )
UPDATE parkings_euvm_qa_voronoi pv
SET
  count_current = COALESCE(c.count_current, 0)
FROM
  counts c
WHERE
  pv.id = c.id;

ALTER TABLE parkings_euvm_qa_voronoi
ADD COLUMN difference INTEGER;

UPDATE parkings_euvm_qa_voronoi
SET
  difference = count_reference - count_current;

ALTER TABLE parkings_euvm_qa_voronoi
ADD COLUMN relative NUMERIC;

UPDATE parkings_euvm_qa_voronoi
SET
  relative = CASE
    WHEN count_reference <> 0 THEN count_current::NUMERIC / count_reference::NUMERIC
    ELSE NULL
  END;
