-- WHAT IT DOES:
-- Find corners of convex hull and create edges connecting corners along polygon boundary.
-- * Gets corners using `tilda_get_polygon_corners` (max angle 150 degrees)
-- * Connects each corner to next using `tilda_connect_on_polygon` to follow polygon boundary
-- * Returns edges as linestrings with sequential `edge_idx`
-- USED IN: Only used in this file.
DROP FUNCTION IF EXISTS tilda_get_parking_edges (geometry);

-- TODO: use custom type from below as return type
CREATE FUNCTION tilda_get_parking_edges (parking_geom geometry) RETURNS TABLE (edge_idx BIGINT, geom geometry) LANGUAGE plpgsql AS $$
DECLARE
  hull_geom geometry := ST_ConvexHull(ST_ForceRHR(parking_geom));
BEGIN
  RETURN QUERY
  -- Get all corners of the convex hull that are sharper than `max_angle_degrees`
  WITH corners AS (
    SELECT * FROM tilda_get_polygon_corners(poly := hull_geom, n_corners := NULL, max_angle_degrees := 150)
  )
    -- Create edges by connecting each corner to the next
  SELECT ROW_NUMBER() OVER (ORDER BY c1.corner_idx) AS edge_idx,
          tilda_connect_on_polygon(
              start_point  := c1.geom,
              end_point    := COALESCE(c2.geom, first.geom),
              project_onto := parking_geom
          ) AS geom
  FROM corners c1
  LEFT JOIN corners c2 ON c2.corner_idx = c1.corner_idx + 1
  -- Get first corner for wrap at last index
  CROSS JOIN LATERAL (
    SELECT corners.geom FROM corners WHERE corner_idx = 1
  ) first;
END;
$$;

-- WHAT IT DOES:
-- Check how well `from_geom` aligns with `to_geom`.
-- * Projects `from_geom` onto `to_geom` using `tilda_project_to_line`
-- * Calculates alignment (0..1) based on angle difference
-- * Returns alignment, length of projected substring, and which half-space the centroid is in
-- USED IN: Only used in this file.
DROP FUNCTION IF EXISTS tilda_projected_info (geometry, geometry);

CREATE FUNCTION tilda_projected_info (from_geom geometry, to_geom geometry) RETURNS TABLE (
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
  proj := tilda_project_to_line(project_from := from_geom, project_onto := to_geom);
  theta := ST_Azimuth(ST_StartPoint(from_geom), ST_EndPoint(from_geom))
    - ST_Azimuth(ST_StartPoint(proj), ST_EndPoint(proj));
  alignment_val := abs(cos(theta));

  p1 := ST_StartPoint(proj);
  p2 := ST_EndPoint(proj);

  -- Determine which half-space the centroid of `from_geom` is in with respect to `proj`
  half_space := CASE
    WHEN ((ST_X(p2) - ST_X(p1)) * (ST_Y(centroid) - ST_Y(p1)) - (ST_Y(p2) - ST_Y(p1)) * (ST_X(centroid) - ST_X(p1))) > 0 THEN 1
    WHEN ((ST_X(p2) - ST_X(p1)) * (ST_Y(centroid) - ST_Y(p1)) - (ST_Y(p2) - ST_Y(p1)) * (ST_X(centroid) - ST_X(p1))) < 0 THEN -1
    ELSE 0
  END;

  RETURN QUERY SELECT alignment_val, ST_Length(proj), half_space;
END;
$$ LANGUAGE plpgsql STABLE;

-- Define a composite type for edges
DROP TYPE IF EXISTS edge_info;

CREATE TYPE edge_info AS (geom geometry, edge_idx bigint);

-- WHAT IT DOES:
-- Main function: find edge closest to roads and convert to kerb linestring(s).
-- * Gets edges from `tilda_get_parking_edges`, scores each edge by proximity/alignment to nearby roads
-- * Returns best matching edge as front kerb with `side` (left/right)
-- * For areas with location tag (median/lane_centre): also returns back kerb (union of remaining edges)
-- USED IN: `separate_parkings/0_areas_project_to_kerb.sql` (convert polygon parking areas to kerb linestrings)
DROP FUNCTION IF EXISTS tilda_parking_area_to_line (geometry, jsonb, double precision);

CREATE FUNCTION tilda_parking_area_to_line (
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
  SELECT ARRAY(
    SELECT ROW(geom, edge_idx)::edge_info
    FROM tilda_get_parking_edges(parking_geom)
  ) INTO edges_arr;
  WITH closeby_roads  AS (
    SELECT t.edge_idx,
            COALESCE(proj_info.alignment * proj_info.length, 0) / (ST_Distance(t.geom, r.geom) + 1 + 2 * (r.is_driveway)::int) AS road_score,
            half_space
    FROM unnest(edges_arr) AS t(geom, edge_idx)
    LEFT JOIN _parking_roads r
      ON ST_Expand(ST_Centroid(t.geom), radius) && r.geom
      AND ST_DWithin(ST_Centroid(t.geom), r.geom, radius)
      AND (parking_tags->>'road_name' IS NULL
        OR r.tags->>'street_name' IS NULL
        OR parking_tags->>'road_name' != r.tags->>'street_name')
    CROSS JOIN LATERAL tilda_projected_info(t.geom, r.geom) proj_info
    ),
    aggregated AS (
      SELECT
        edge_idx,
        SUM(road_score) AS road_score,
        SUM(half_space) AS half_space
      FROM
        closeby_roads
      WHERE
        road_score IS NOT NULL
      GROUP BY edge_idx
    )
  SELECT
    edge_idx,
    road_score,
    CASE WHEN half_space > 0 THEN 'left' ELSE 'right' END
  INTO parking_kerb_idx, score, side
  FROM aggregated
  WHERE road_score IS NOT NULL
  ORDER BY road_score DESC
  LIMIT 1;

  -- Return the closest edge as `parking_kerb`
  SELECT geom
  INTO parking_kerb
  FROM unnest(edges_arr) AS t(geom, edge_idx)
  WHERE edge_idx = parking_kerb_idx;
  is_front_kerb := TRUE;
  RETURN NEXT;

  -- If location is not present, only return front kerb
  -- LUA sanitization only allows 'median' and 'lane_centre', so any present location value is valid
  IF COALESCE(parking_tags ->> 'location', '') = '' THEN
    RETURN;
  END IF;

  n_edges := array_length(edges_arr, 1);
  -- Return the union of the remaining edges as back kerb
  SELECT
    ST_LineMerge(ST_Union(geom))
  INTO parking_kerb
  FROM unnest(edges_arr) AS t(geom, edge_idx)
  WHERE edge_idx NOT IN (
    CASE WHEN parking_kerb_idx = 1 THEN n_edges ELSE parking_kerb_idx - 1 END,  -- Previous edge
    parking_kerb_idx,
    (parking_kerb_idx % n_edges) + 1                                            -- Next edge (wrap around)
  );
  is_front_kerb := FALSE;
  RETURN NEXT;
END;
$$;
