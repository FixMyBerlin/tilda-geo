-- Hide network noise at low zoom
-- ====================
-- Two cheap filters on the `routing` graph, collapsed to one geometry per OSM parent way
-- (carriageway and left/right bike lane edges of the same way count as one):
--
-- 1. Islands: the parent touches no other line at all.
-- 2. Short dangling tips (one pass): `tags.length` < 20 m, exactly one end attached,
--    the other end free, and nothing else touches the line (no interior T, no crossing).
--    We do not recompute after hiding stubs, so a short way that only becomes a stub
--    once its own stubs are hidden stays visible.
--
-- An end is "attached" when it lies on another line (endpoint or interior; OSM often T-joins
-- onto a way's interior without a shared node). Lines from `roads` / `roadsPathClasses` that are
-- not part of `routing` (eg. motorways, no-bicycle roads) count as connectors but are never hidden.
-- With `PROCESS_ONLY_BBOX` (local dev), parents not fully inside the bbox shrunk by ~10 m are
-- skipped: osmium keeps ways crossing the cut whole, but drops their neighbours outside it.
-- Without it (full extract) there is no clip guard; ways at the country border may be hidden.
--
-- Map tables (`roads`, `roadsPathClasses`, `bikelanes`, `bikelanesPresence`, `bikeSuitability`):
-- `minzoom = GREATEST(minzoom, 14)`. Not drawn at z4–13, still in the z14 tile (overzoomed),
-- so the inspector keeps working and the lines stay in the data.
-- `routing`: rows are moved to `_routing_discarded` (with `discard_reason` `island` | `stub`)
-- so the routing graph never sees them; look up discarded ids there.
-- `todos_lines` is untouched.
--
DO $$ BEGIN RAISE NOTICE 'START hide network noise %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

-- Per-step timings: each step below logs its duration since the previous one.
DO $$ BEGIN PERFORM set_config('tilda.noise_step', clock_timestamp()::text, false); END $$;

-- Helper tables are UNLOGGED (not TEMP): temp tables live in the small per-session
-- `temp_buffers` and can not be scanned by parallel workers. Both made the endpoint check
-- several times slower on a full extract. They are dropped at the end.
SET max_parallel_workers_per_gather = 4;

-- One geometry per candidate parent, plus connector-only lines outside `routing`.
-- Touch tolerance below is 1 unit in EPSG:3857 (same ballpark as SnapToGrid 0.5).
DROP TABLE IF EXISTS _network_noise_lines;

CREATE UNLOGGED TABLE _network_noise_lines AS
SELECT DISTINCT
  ON (tags ->> 'parent_id') tags ->> 'parent_id' AS parent_id,
  TRUE AS is_candidate,
  geom,
  (tags ->> 'length')::numeric AS length
FROM
  public.routing
WHERE
  geom IS NOT NULL
ORDER BY
  tags ->> 'parent_id',
  id;

DO $$ BEGIN RAISE NOTICE 'hide network noise: collect routing parent lines took %', clock_timestamp() - current_setting('tilda.noise_step')::timestamptz; PERFORM set_config('tilda.noise_step', clock_timestamp()::text, false); END $$;

INSERT INTO
  _network_noise_lines (parent_id, is_candidate, geom, length)
SELECT
  connector.id,
  FALSE,
  connector.geom,
  NULL
FROM
  (
    SELECT
      id,
      geom
    FROM
      public.roads
    UNION ALL
    SELECT
      id,
      geom
    FROM
      public."roadsPathClasses"
  ) connector
WHERE
  connector.geom IS NOT NULL
  AND NOT EXISTS (
    SELECT
      1
    FROM
      public.routing r
    WHERE
      r.tags ->> 'parent_id' = connector.id
  );

DO $$ BEGIN RAISE NOTICE 'hide network noise: add connector lines (roads, roadsPathClasses) took %', clock_timestamp() - current_setting('tilda.noise_step')::timestamptz; PERFORM set_config('tilda.noise_step', clock_timestamp()::text, false); END $$;

CREATE INDEX ON _network_noise_lines USING gist (geom);

CREATE INDEX ON _network_noise_lines (parent_id);

ANALYZE _network_noise_lines;

DO $$ BEGIN RAISE NOTICE 'hide network noise: index lines took %', clock_timestamp() - current_setting('tilda.noise_step')::timestamptz; PERFORM set_config('tilda.noise_step', clock_timestamp()::text, false); END $$;

-- Clip area: `PROCESS_ONLY_BBOX` (MINLON,MINLAT,MAXLON,MAXLAT) shrunk by ~10 m, or NULL
\getenv process_only_bbox PROCESS_ONLY_BBOX
\if :{?process_only_bbox}
\else
\set process_only_bbox ''
\endif
DROP TABLE IF EXISTS _network_noise_clip;

CREATE UNLOGGED TABLE _network_noise_clip AS
SELECT
  CASE
    WHEN cardinality(b) = 4 THEN ST_Buffer (
      ST_Transform (ST_MakeEnvelope (b[1], b[2], b[3], b[4], 4326), 3857),
      -10 / cos(radians((b[2] + b[4]) / 2))
    )
  END AS inner_area
FROM
  (
    SELECT
      string_to_array(NULLIF(trim(:'process_only_bbox'), ''), ',')::float8[] AS b
  ) bbox;

-- Start and end point of each candidate parent
DROP TABLE IF EXISTS _network_noise_ends;

CREATE UNLOGGED TABLE _network_noise_ends AS
SELECT
  parent_id,
  TRUE AS is_start,
  ST_StartPoint (geom) AS pt
FROM
  _network_noise_lines
WHERE
  is_candidate
UNION ALL
SELECT
  parent_id,
  FALSE,
  ST_EndPoint (geom)
FROM
  _network_noise_lines
WHERE
  is_candidate;

DO $$ BEGIN RAISE NOTICE 'hide network noise: collect line ends took %', clock_timestamp() - current_setting('tilda.noise_step')::timestamptz; PERFORM set_config('tilda.noise_step', clock_timestamp()::text, false); END $$;

-- Per end: attached to another line?
-- Most ends share an OSM node with another line, so an exact match against the vertices of all
-- other lines settles them with a hash join. Only the rest need the spatial `ST_DWithin` check
-- (unnoded T-joins within the touch tolerance, and truly free ends). Same result as running
-- `ST_DWithin` on every end, since a shared vertex is always within the tolerance.
DROP TABLE IF EXISTS _network_noise_vertices;

CREATE UNLOGGED TABLE _network_noise_vertices AS
SELECT
  l.parent_id,
  ST_X (d.geom) AS x,
  ST_Y (d.geom) AS y
FROM
  _network_noise_lines l,
  ST_DumpPoints (l.geom) d;

ANALYZE _network_noise_vertices;

ANALYZE _network_noise_ends;

DROP TABLE IF EXISTS _network_noise_attached_by_vertex;

CREATE UNLOGGED TABLE _network_noise_attached_by_vertex AS
SELECT
  e.parent_id,
  e.is_start
FROM
  _network_noise_ends e
WHERE
  EXISTS (
    SELECT
      1
    FROM
      _network_noise_vertices v
    WHERE
      v.x = ST_X (e.pt)
      AND v.y = ST_Y (e.pt)
      AND v.parent_id <> e.parent_id
  );

ANALYZE _network_noise_attached_by_vertex;

DROP TABLE IF EXISTS _network_noise_attached_by_distance;

CREATE UNLOGGED TABLE _network_noise_attached_by_distance AS
SELECT
  e.parent_id,
  e.is_start
FROM
  _network_noise_ends e
WHERE
  NOT EXISTS (
    SELECT
      1
    FROM
      _network_noise_attached_by_vertex a
    WHERE
      a.parent_id = e.parent_id
      AND a.is_start = e.is_start
  )
  AND EXISTS (
    SELECT
      1
    FROM
      _network_noise_lines other
    WHERE
      other.parent_id <> e.parent_id
      AND ST_DWithin (e.pt, other.geom, 1)
  );

DROP TABLE IF EXISTS _network_noise_end_state;

CREATE UNLOGGED TABLE _network_noise_end_state AS
SELECT
  e.parent_id,
  e.pt,
  a.parent_id IS NOT NULL AS attached
FROM
  _network_noise_ends e
  LEFT JOIN (
    SELECT
      parent_id,
      is_start
    FROM
      _network_noise_attached_by_vertex
    UNION ALL
    SELECT
      parent_id,
      is_start
    FROM
      _network_noise_attached_by_distance
  ) a ON a.parent_id = e.parent_id
  AND a.is_start = e.is_start;

DO $$ BEGIN RAISE NOTICE 'hide network noise: check attached ends took %', clock_timestamp() - current_setting('tilda.noise_step')::timestamptz; PERFORM set_config('tilda.noise_step', clock_timestamp()::text, false); END $$;

-- Candidates from the endpoint pass; the line-line check below only runs on those
DROP TABLE IF EXISTS _network_noise_candidates;

CREATE UNLOGGED TABLE _network_noise_candidates AS
SELECT
  l.parent_id,
  l.geom,
  CASE
    WHEN s.attached_count = 0 THEN 'island'
    ELSE 'stub'
  END AS kind,
  s.attached_pt
FROM
  _network_noise_lines l
  JOIN (
    SELECT
      parent_id,
      count(*) FILTER (
        WHERE
          attached
      ) AS attached_count,
      (array_agg(pt) FILTER (
        WHERE
          attached
      ))[1] AS attached_pt
    FROM
      _network_noise_end_state
    GROUP BY
      parent_id
  ) s USING (parent_id)
  CROSS JOIN _network_noise_clip clip
WHERE
  l.is_candidate
  AND (
    clip.inner_area IS NULL
    OR ST_Within (l.geom, clip.inner_area)
  )
  AND (
    s.attached_count = 0
    OR (
      s.attached_count = 1
      AND l.length < 20
    )
  );

DO $$ BEGIN RAISE NOTICE 'hide network noise: select candidates took %', clock_timestamp() - current_setting('tilda.noise_step')::timestamptz; PERFORM set_config('tilda.noise_step', clock_timestamp()::text, false); END $$;

-- Confirm: islands touch no other line anywhere (covers crossings at interior nodes);
-- stubs are touched only by lines that pass through their attached end
-- (an interior T or crossing from any other line keeps the way).
DROP TABLE IF EXISTS _network_noise_hidden;

CREATE UNLOGGED TABLE _network_noise_hidden AS
SELECT
  c.parent_id,
  c.kind
FROM
  _network_noise_candidates c
WHERE
  NOT EXISTS (
    SELECT
      1
    FROM
      _network_noise_lines other
    WHERE
      other.parent_id <> c.parent_id
      AND ST_DWithin (c.geom, other.geom, 1)
      AND (
        c.kind = 'island'
        OR NOT ST_DWithin (c.attached_pt, other.geom, 1)
      )
  );

CREATE INDEX ON _network_noise_hidden (parent_id);

ANALYZE _network_noise_hidden;

DO $$ BEGIN RAISE NOTICE 'hide network noise: confirm hidden parents took %', clock_timestamp() - current_setting('tilda.noise_step')::timestamptz; PERFORM set_config('tilda.noise_step', clock_timestamp()::text, false); END $$;

DO $$
DECLARE
  island_count integer;
  stub_count integer;
BEGIN
  SELECT count(*) FILTER (WHERE kind = 'island'), count(*) FILTER (WHERE kind = 'stub')
  INTO island_count, stub_count
  FROM _network_noise_hidden;
  RAISE NOTICE 'hide network noise: % islands, % short stubs', island_count, stub_count;
END $$;

-- Move discarded parents out of `routing` (kept for debugging, not exposed as tiles)
DROP TABLE IF EXISTS public._routing_discarded;

CREATE TABLE public._routing_discarded AS
SELECT
  r.*,
  h.kind AS discard_reason
FROM
  public.routing r
  JOIN _network_noise_hidden h ON h.parent_id = r.tags ->> 'parent_id';

CREATE INDEX ON public._routing_discarded (id);

CREATE INDEX ON public._routing_discarded ((tags ->> 'parent_id'));

DO $$ BEGIN RAISE NOTICE 'hide network noise: copy rows to _routing_discarded took %', clock_timestamp() - current_setting('tilda.noise_step')::timestamptz; PERFORM set_config('tilda.noise_step', clock_timestamp()::text, false); END $$;

DELETE FROM public.routing r USING _network_noise_hidden h
WHERE
  r.tags ->> 'parent_id' = h.parent_id;

DO $$ BEGIN RAISE NOTICE 'hide network noise: delete rows from routing took %', clock_timestamp() - current_setting('tilda.noise_step')::timestamptz; PERFORM set_config('tilda.noise_step', clock_timestamp()::text, false); END $$;

-- Stamp minzoom on the map line tables: `way/{id}` optionally followed by `/…` suffixes.
UPDATE public.roads t
SET
  minzoom = GREATEST(t.minzoom, 14)
FROM
  _network_noise_hidden h
WHERE
  split_part(t.id, '/', 1) || '/' || split_part(t.id, '/', 2) = h.parent_id
  AND t.minzoom < 14;

DO $$ BEGIN RAISE NOTICE 'hide network noise: minzoom update on roads took %', clock_timestamp() - current_setting('tilda.noise_step')::timestamptz; PERFORM set_config('tilda.noise_step', clock_timestamp()::text, false); END $$;

UPDATE public."roadsPathClasses" t
SET
  minzoom = GREATEST(t.minzoom, 14)
FROM
  _network_noise_hidden h
WHERE
  split_part(t.id, '/', 1) || '/' || split_part(t.id, '/', 2) = h.parent_id
  AND t.minzoom < 14;

DO $$ BEGIN RAISE NOTICE 'hide network noise: minzoom update on roadsPathClasses took %', clock_timestamp() - current_setting('tilda.noise_step')::timestamptz; PERFORM set_config('tilda.noise_step', clock_timestamp()::text, false); END $$;

UPDATE public.bikelanes t
SET
  minzoom = GREATEST(t.minzoom, 14)
FROM
  _network_noise_hidden h
WHERE
  split_part(t.id, '/', 1) || '/' || split_part(t.id, '/', 2) = h.parent_id
  AND t.minzoom < 14;

DO $$ BEGIN RAISE NOTICE 'hide network noise: minzoom update on bikelanes took %', clock_timestamp() - current_setting('tilda.noise_step')::timestamptz; PERFORM set_config('tilda.noise_step', clock_timestamp()::text, false); END $$;

UPDATE public."bikelanesPresence" t
SET
  minzoom = GREATEST(t.minzoom, 14)
FROM
  _network_noise_hidden h
WHERE
  split_part(t.id, '/', 1) || '/' || split_part(t.id, '/', 2) = h.parent_id
  AND t.minzoom < 14;

DO $$ BEGIN RAISE NOTICE 'hide network noise: minzoom update on bikelanesPresence took %', clock_timestamp() - current_setting('tilda.noise_step')::timestamptz; PERFORM set_config('tilda.noise_step', clock_timestamp()::text, false); END $$;

UPDATE public."bikeSuitability" t
SET
  minzoom = GREATEST(t.minzoom, 14)
FROM
  _network_noise_hidden h
WHERE
  split_part(t.id, '/', 1) || '/' || split_part(t.id, '/', 2) = h.parent_id
  AND t.minzoom < 14;

DO $$ BEGIN RAISE NOTICE 'hide network noise: minzoom update on bikeSuitability took %', clock_timestamp() - current_setting('tilda.noise_step')::timestamptz; PERFORM set_config('tilda.noise_step', clock_timestamp()::text, false); END $$;

DROP TABLE _network_noise_hidden;

DROP TABLE _network_noise_candidates;

DROP TABLE _network_noise_end_state;

DROP TABLE _network_noise_attached_by_distance;

DROP TABLE _network_noise_attached_by_vertex;

DROP TABLE _network_noise_vertices;

DROP TABLE _network_noise_ends;

DROP TABLE _network_noise_clip;

DROP TABLE _network_noise_lines;

RESET max_parallel_workers_per_gather;

DO $$ BEGIN RAISE NOTICE 'END hide network noise %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;
