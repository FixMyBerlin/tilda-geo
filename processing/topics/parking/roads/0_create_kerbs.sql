DROP TABLE IF EXISTS _parking_kerbs;

SELECT
  ROW_NUMBER() OVER () AS id,
  ST_OffsetCurve (geom, kerb_sides.offset) AS geom,
  kerb_sides.side,
  kerb_sides.offset,
  osm_type,
  osm_id,
  tags ->> 'name' AS street_name,
  is_parking,
  is_driveway,
  tags,
  meta INTO _parking_kerbs
FROM
  _parking_roads
  CROSS JOIN LATERAL (
    VALUES
      ('left', (tags ->> 'perform_offset_left')::numeric),
      (
        'right',
        (tags ->> 'perform_offset_right')::numeric
      )
  ) AS kerb_sides ("side", "offset");

ALTER TABLE _parking_kerbs
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE INDEX parking_kerbs_moved_idx ON _parking_kerbs USING BTREE (osm_id);

CREATE INDEX parking_kerbs_moved_joint_idx_side ON _parking_kerbs USING BTREE (osm_id, side);

CREATE INDEX parking_kerbs_moved_joint_name_side ON _parking_kerbs USING BTREE (street_name, side);

CREATE INDEX parking_kerbs_moved_geom_idx ON _parking_kerbs USING GIST (geom);

DO $$
BEGIN
  RAISE NOTICE 'Finished creating kerbs %', clock_timestamp();
END
$$;
