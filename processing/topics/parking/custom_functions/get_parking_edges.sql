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

DROP FUNCTION IF EXISTS projected_info (geometry, geometry);

-- checks how well from_geom aligns with to_geom
-- returns alignment (0..1), length of the projected substring, and which half-space the
CREATE FUNCTION projected_info (from_geom geometry, to_geom geometry) RETURNS TABLE (
  alignment double precision,
  length double precision,
  half_space int
) AS $$
DECLARE
  proj geometry;
  theta double precision;
  alignment_val double precision;
  centroid geometry := ST_Centroid(from_geom);
  p1 geometry;
  p2 geometry;
BEGIN
  proj := project_to_line(project_from := from_geom, project_onto := to_geom);
  theta := ST_Azimuth(ST_StartPoint(from_geom), ST_EndPoint(from_geom))
    - ST_Azimuth(ST_StartPoint(proj), ST_EndPoint(proj));
  alignment_val := abs(cos(theta));

  p1 := ST_StartPoint(proj);
  p2 := ST_EndPoint(proj);

  -- Determine which half-space the centroid of from_geom is in with respect to proj
  half_space := CASE
    WHEN ((ST_X(p2) - ST_X(p1)) * (ST_Y(centroid) - ST_Y(p1)) - (ST_Y(p2) - ST_Y(p1)) * (ST_X(centroid) - ST_X(p1))) > 0 THEN 1
    WHEN ((ST_X(p2) - ST_X(p1)) * (ST_Y(centroid) - ST_Y(p1)) - (ST_Y(p2) - ST_Y(p1)) * (ST_X(centroid) - ST_X(p1))) < 0 THEN -1
    ELSE 0
  END;

  RETURN QUERY SELECT alignment_val, ST_Length(proj), half_space;
END;
$$ LANGUAGE plpgsql STABLE;

DROP TYPE IF EXISTS edge_info;

-- Define a composite type for edges
CREATE TYPE edge_info AS (
  geom geometry,
  road_score double precision,
  half_space double precision,
  edge_idx bigint
);

DROP FUNCTION IF EXISTS parking_area_to_line (geometry, jsonb, double precision);

CREATE FUNCTION parking_area_to_line (
  parking_geom geometry,
  parking_tags JSONB,
  radius double precision
) RETURNS TABLE (
  parking_kerb geometry,
  score double precision,
  is_front_kerb boolean,
  side TEXT
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
               ra.half_space,
               e.edge_idx)::edge_info
         )
  INTO edges_arr
  FROM get_parking_edges(parking_geom) e
  -- calculate road scores
  LEFT JOIN (
    SELECT
      edge_idx,
      SUM(road_score) AS road_score,
      SUM(half_space * road_score) AS half_space
    FROM (
      SELECT e.edge_idx,
             COALESCE(proj_info.alignment * proj_info.length, 0) / (ST_Distance(e.geom, r.geom) + 1 + 2 * (r.is_driveway)::int) AS road_score,
             half_space
      FROM get_parking_edges(parking_geom) e
      LEFT JOIN _parking_roads r
        ON ST_DWithin(e.mid_point, r.geom, radius)
       AND (parking_tags->>'road_name' IS NULL
         OR r.tags->>'street_name' IS NULL
         OR parking_tags->>'road_name' != r.tags->>'street_name')
      CROSS JOIN LATERAL projected_info(e.geom, r.geom) proj_info
    ) sub
    GROUP BY edge_idx
  ) ra ON ra.edge_idx = e.edge_idx;

  n_edges := array_length(edges_arr, 1);


  is_front_kerb := TRUE;

  SELECT
    edge_idx,
    road_score,
    CASE WHEN half_space > 0 THEN 'left' ELSE 'right' END
  INTO parking_kerb_idx, score, side
  FROM unnest(edges_arr) AS t(geom, road_score, half_space, edge_idx)
  ORDER BY road_score DESC
  LIMIT 1;


  -- Return the closest edge as parking_kerb
  SELECT geom
  INTO parking_kerb
  FROM unnest(edges_arr) AS t(geom, road_score, half_space, edge_idx)
  WHERE edge_idx = parking_kerb_idx;

  RETURN NEXT;

    IF COALESCE(parking_tags ->> 'location', '') != 'median' THEN
      RETURN;
    END IF;

  is_front_kerb := FALSE;
    -- Return the union of the remaining edges as rest
  SELECT
    ST_LineMerge(ST_Union(geom)),
    MIN(road_score), CASE WHEN SUM(half_space) > 0 THEN 'left' ELSE 'right' END
  INTO parking_kerb, score, side
  FROM unnest(edges_arr) AS t(geom, road_score, half_space, edge_idx)
  WHERE edge_idx NOT IN (
    CASE WHEN parking_kerb_idx = 1 THEN n_edges ELSE parking_kerb_idx - 1 END,  -- previous edge
    parking_kerb_idx,
    (parking_kerb_idx % n_edges) + 1                                            -- next edge (wrap around)
  );
  RETURN NEXT;
END;
$$;
