-- Create input views for sidepath estimation.
-- Paths = path-class ways (roadsPathClasses), roads = non-path roads (roads).
-- osm_id comes from the flex table (id_column); tags are wrapped as {tags: ...} for sidepath_lib.
CREATE OR REPLACE TEMP VIEW sidepath_paths_input AS
SELECT
  osm_id AS id,
  geom::geometry AS geom,
  jsonb_build_object('tags', tags) AS tags
FROM "roadsPathClasses";

CREATE OR REPLACE TEMP VIEW sidepath_roads_input AS
SELECT
  osm_id AS id,
  geom::geometry AS geom,
  jsonb_build_object('tags', tags) AS tags
FROM roads;

-- Run estimation script (expects -v paths_table=sidepath_paths_input -v roads_table=sidepath_roads_input -v format=is_sidepath_csv -v outfile=...)
\ir generate_sidepath_estimation.script.sql
