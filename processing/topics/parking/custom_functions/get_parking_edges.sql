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

DROP TYPE edge_info;

-- Define a composite type for edges
CREATE TYPE edge_info AS (
  geom geometry,
  distance double precision,
  driveway_distance double precision,
  edge_idx bigint,
  length double precision
);

-- Function
CREATE OR REPLACE FUNCTION parking_area_to_line (
  parking_geom geometry,
  parking_tags JSONB,
  tolerance double precision
) RETURNS TABLE (parking_kerb geometry, rest geometry) LANGUAGE plpgsql AS $$
DECLARE
  edges_arr edge_info[];
  closest_edge_idx bigint;
  n_edges int;
BEGIN
  -- Materialize edges and distances into a typed array
  SELECT array_agg(
           ROW(e.geom,
               d.distance,
               dd.driveway_distance,
               e.edge_idx,
               ST_Length(e.geom))::edge_info
         )
  INTO edges_arr
  FROM get_parking_edges(parking_geom) e
  LEFT JOIN (
    SELECT edge_idx, MIN(distance) AS distance
    FROM (
      SELECT e.edge_idx,
             ST_Distance(e.mid_point, r.geom) AS distance,
             r.is_driveway
      FROM get_parking_edges(parking_geom) e
      LEFT JOIN _parking_roads r
        ON ST_DWithin(e.mid_point, r.geom, tolerance)
       AND (parking_tags->>'road_name' IS NULL
         OR r.tags->>'street_name' IS NULL
         OR parking_tags->>'road_name' != r.tags->>'street_name')
      WHERE r.is_driveway = FALSE
    ) sub
    GROUP BY edge_idx
  ) d ON d.edge_idx = e.edge_idx
  LEFT JOIN (
    SELECT edge_idx, MIN(distance) AS driveway_distance
    FROM (
      SELECT e.edge_idx,
             ST_Distance(e.mid_point, r.geom) AS distance,
             r.is_driveway
      FROM get_parking_edges(parking_geom) e
      LEFT JOIN _parking_roads r
        ON ST_DWithin(e.mid_point, r.geom, tolerance)
      WHERE r.is_driveway = TRUE
    ) sub
    GROUP BY edge_idx
  ) dd ON dd.edge_idx = e.edge_idx;

  n_edges := array_length(edges_arr, 1);

  -- Compute closest edge index using SQL
  SELECT edge_idx
  INTO closest_edge_idx
  FROM unnest(edges_arr) AS t(geom, distance, driveway_distance, edge_idx, length)
  ORDER BY COALESCE(distance, driveway_distance)
  LIMIT 1;

  -- Return the closest edge as parking_kerb
  SELECT geom
  INTO parking_kerb
  FROM unnest(edges_arr) AS t(geom, distance, driveway_distance, edge_idx, length)
  WHERE edge_idx = closest_edge_idx;

  -- Return the union of the remaining edges as rest
  SELECT ST_LineMerge(ST_Union(geom))
  INTO rest
  FROM unnest(edges_arr) AS t(geom, distance, driveway_distance, edge_idx, length)
  WHERE edge_idx NOT IN (
    closest_edge_idx,
    (closest_edge_idx % n_edges) + 1,                 -- next edge (wrap around)
    CASE WHEN closest_edge_idx = 1 THEN n_edges ELSE closest_edge_idx - 1 END  -- previous edge
  );
  RETURN NEXT;
END;
$$;
