CREATE OR REPLACE FUNCTION segmentize_way_to_edges (way_id BIGINT) RETURNS TABLE (
  id TEXT,
  source BIGINT,
  target BIGINT,
  cost DOUBLE PRECISION,
  geom geometry
) AS $$
DECLARE
  pts geometry[];
  source_idx INT := 1;
  source_id BIGINT;
  segment_idx INT := 1;
  rec RECORD;
BEGIN
  -- Load the points of the way into an array
  SELECT ARRAY_AGG((dp).geom ORDER BY (dp).path[1])
    INTO pts
  FROM ST_DumpPoints(
    (SELECT r.geom FROM _parking_roads r WHERE osm_id = segmentize_way_to_edges.way_id)
  ) AS dp;

  -- Initialize source_id to the first node on the way
  SELECT node_id
    INTO source_id
  FROM _parking_node_road_mapping nrm
  WHERE nrm.way_id = segmentize_way_to_edges.way_id AND idx = 1;

  -- Loop through all nodes on this way in order
  FOR rec IN
    SELECT node_id, idx, is_terminal_node
      FROM _parking_node_road_mapping nrm
      WHERE nrm.way_id = segmentize_way_to_edges.way_id
      ORDER BY idx
  LOOP
    -- If this node is an intersection (degree > min_degree) and not the first
    IF rec.idx > 1
       AND (EXISTS(
         SELECT 1 FROM _parking_intersections i
         WHERE i.node_id = rec.node_id AND i.road_degree > 2
       ) OR rec.is_terminal_node)
    THEN
      -- Build edge id
      id := way_id || '_' || segment_idx;
      source := source_id;
      target := rec.node_id;
      -- Build the linestring from pts[source_idx] to pts[rec.idx]
      geom := ST_MakeLine(pts[source_idx:rec.idx]);
      cost := ST_Length(geom);
      -- Emit this edge
      RETURN NEXT;

      -- Reset for next segment
      source_idx := rec.idx;
      source_id := rec.node_id;
      segment_idx := segment_idx + 1;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql STABLE;
