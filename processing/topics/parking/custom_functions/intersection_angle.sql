DROP FUNCTION IF EXISTS intersection_angle;

-- TODO: sometimes we miss intersection corners because the roads are splitted close to the intersection, see: https://viewer.tilda-geo.de/?map=19.2/52.47141/13.34039&search=parking&source=Staging&layers=parking_intersection_corners,parking_intersections,_parking_roads
CREATE FUNCTION intersection_angle (
  intersection_id BIGINT,
  road_id1 BIGINT,
  road_id2 BIGINT
) RETURNS double precision AS $$
DECLARE
  smallest_angle double precision;
BEGIN
  -- for each pair of intersction_id and way_id, get the index of the node in the way
  -- and the index of the next node in the way. For n > 1 this is n - 1 for n = 1 this is n + 1
  WITH end_segments AS (
    SELECT
      way_id,
      idx,
      CASE
        WHEN idx = 1 THEN idx + 1
        ELSE idx - 1
      END AS idx_next
    FROM _parking_node_road_mapping
    WHERE node_id = intersection_id
      AND way_id IN (road_id1, road_id2)
  ),
  -- calculate the azimuths of the two roads at the intersection point
  -- for loops we have more than one pair of intersection_id and way_id
  azimuths AS (
    SELECT
      es.way_id,
      ST_Azimuth(
        ST_PointN(r.geom, es.idx),
        ST_PointN(r.geom, es.idx_next)
      ) AS azimuth
    FROM end_segments es
    JOIN _parking_roads r ON r.osm_id = es.way_id
  ),
  intersection_angles AS (
    SELECT
      abs(a1.azimuth - a2.azimuth) AS angle
    FROM azimuths a1
    JOIN azimuths a2
      ON a1.way_id < a2.way_id
  )
  -- Get the smallest angle (adjust for angles greater than pi)
  SELECT
    MIN(CASE
          WHEN angle > pi() THEN 2 * pi() - angle
          ELSE angle
        END)
  INTO smallest_angle
  FROM intersection_angles;

  RETURN smallest_angle;
END;

$$ LANGUAGE plpgsql STABLE;
