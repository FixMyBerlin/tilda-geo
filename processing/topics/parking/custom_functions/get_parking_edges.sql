DROP FUNCTION IF EXISTS get_parking_edges (geometry);

DROP FUNCTION IF EXISTS parking_area_to_line (geometry, jsonb, double precision);

CREATE FUNCTION get_parking_edges (parking_geom geometry) RETURNS TABLE (
  edge_idx BIGINT,
  geom geometry,
  mid_point geometry
) LANGUAGE plpgsql AS $$
DECLARE
  hull_geom geometry := ST_ConvexHull(ST_ForceRHR(parking_geom));
BEGIN
  RETURN QUERY
  -- get all corners of the convex hull that are sharper than max_angle_degrees
  WITH corners AS (
    SELECT * FROM get_polygon_corners(poly := hull_geom, n_corners := NULL, max_angle_degrees := 150)
  )
  -- create edges by connecting each corner to the next
  SELECT ROW_NUMBER() OVER (ORDER BY c1.corner_idx) AS edge_idx,
          connect_on_polygon(
              start_point  := c1.geom,
              end_point    := COALESCE(c2.geom, first.geom),
              project_onto := parking_geom
          ) AS geom,
          ST_Centroid(ST_Union(ARRAY[c1.geom, COALESCE(c2.geom, first.geom)])) AS mid_point
  FROM corners c1
  LEFT JOIN corners c2 ON c2.corner_idx = c1.corner_idx + 1
  -- get first corner for wrap  at last index
  CROSS JOIN LATERAL (
    SELECT corners.geom FROM corners WHERE corner_idx = 1
  ) first;
END;
$$;

CREATE OR REPLACE FUNCTION projected_alignment (g1 geometry, g2 geometry) RETURNS double precision AS $$
DECLARE
    proj geometry;
    theta double precision;
    alignment double precision;
BEGIN
    proj := project_to_line(project_from := g1, project_onto := g2);
    theta := ST_Azimuth(ST_StartPoint(g1), ST_EndPoint(g1))
           - ST_Azimuth(ST_StartPoint(proj), ST_EndPoint(proj));

    -- Normalize angle to [0, pi/2] because we don't care about the direction
    theta := abs(theta);
    IF theta > pi()/2 THEN
        theta := pi() - theta;
    END IF;

    -- 3. Compute alignment: max(|cosθ|, |sinθ|) for desired behavior
    alignment := abs(cos(theta));

    RETURN alignment * ST_length(proj);
END;
$$ LANGUAGE plpgsql STABLE;

DROP TYPE edge_info;

-- Define a composite type for edges
CREATE TYPE edge_info AS (
  geom geometry,
  road_score double precision,
  edge_idx bigint
);

-- Function
CREATE OR REPLACE FUNCTION parking_area_to_line (
  parking_geom geometry,
  parking_tags JSONB,
  tolerance double precision
) RETURNS TABLE (
  parking_kerb geometry,
  rest geometry,
  score double precision
) LANGUAGE plpgsql AS $$
DECLARE
  edges_arr edge_info[];
  parking_kerb_idx bigint;
  n_edges int;
BEGIN
  -- Materialize edges and distances into a typed array
  SELECT array_agg(
           ROW(e.geom,
               ra.road_score,
               e.edge_idx)::edge_info
         )
  INTO edges_arr
  FROM get_parking_edges(parking_geom) e
  -- calculate road scores
  LEFT JOIN (
    SELECT edge_idx, SUM(alignment / (distance + 1) ) AS road_score
    FROM (
      SELECT e.edge_idx,
             COALESCE(projected_alignment(e.geom, r.geom), 0) as alignment,
             ST_Distance(e.geom, r.geom) as distance
      FROM get_parking_edges(parking_geom) e
      LEFT JOIN _parking_roads r
        ON ST_DWithin(e.mid_point, r.geom, tolerance)
       AND (parking_tags->>'road_name' IS NULL
         OR r.tags->>'street_name' IS NULL
         OR parking_tags->>'road_name' != r.tags->>'street_name')
    ) sub
    GROUP BY edge_idx
  ) ra ON ra.edge_idx = e.edge_idx;

  n_edges := array_length(edges_arr, 1);

  SELECT edge_idx, road_score
  INTO parking_kerb_idx, score
  FROM unnest(edges_arr) AS t(geom, road_score, edge_idx)
  ORDER BY road_score DESC
  LIMIT 1;

  -- Return the closest edge as parking_kerb
  SELECT geom
  INTO parking_kerb
  FROM unnest(edges_arr) AS t(geom, road_score, edge_idx)
  WHERE edge_idx = parking_kerb_idx;

  -- Return the union of the remaining edges as rest
  SELECT ST_LineMerge(ST_Union(geom))
  INTO rest
  FROM unnest(edges_arr) AS t(geom, road_score, edge_idx)
  WHERE edge_idx NOT IN (
    CASE WHEN parking_kerb_idx = 1 THEN n_edges ELSE parking_kerb_idx - 1 END,  -- previous edge
    parking_kerb_idx,
    (parking_kerb_idx % n_edges) + 1                                            -- next edge (wrap around)
  );
  RETURN NEXT;
END;
$$;
