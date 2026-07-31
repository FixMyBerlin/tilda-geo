-- One-time (or re-runnable) backfill for public.todos_lines_campaign_stats.
-- Same shape as processing afterthought `campaign_counts`, but counts every key in
-- todos_lines.tags (unknown keys are ignored by /api/campaigns).
-- Safe to re-run: ON CONFLICT updates the row for the latest public.meta id.

CREATE TABLE IF NOT EXISTS public.todos_lines_campaign_stats (
  processing_id INTEGER PRIMARY KEY,
  osm_data_from TIMESTAMP,
  stats JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

WITH latest_run AS (
  SELECT id, osm_data_from FROM public.meta ORDER BY id DESC LIMIT 1
),
totals AS (
  SELECT k.key AS todo_id, COUNT(DISTINCT t.osm_id)::int AS count
  FROM public.todos_lines t
  CROSS JOIN LATERAL jsonb_object_keys(t.tags) AS k(key)
  GROUP BY k.key
),
by_state AS (
  SELECT c.todo_id,
         jsonb_agg(
           jsonb_build_object('id', b.id::text, 'name', b.tags->>'name', 'count', c.count)
           ORDER BY b.tags->>'name'
         ) AS states
  FROM (
    SELECT b.id AS bid, k.key AS todo_id, COUNT(DISTINCT t.osm_id)::int AS count
    FROM public.boundaries b
    JOIN public.todos_lines t ON ST_Intersects(t.geom, b.geom)
    CROSS JOIN LATERAL jsonb_object_keys(t.tags) AS k(key)
    WHERE b.tags->>'admin_level' = '4'
    GROUP BY b.id, k.key
  ) c
  JOIN public.boundaries b ON b.id = c.bid
  GROUP BY c.todo_id
)
INSERT INTO public.todos_lines_campaign_stats (processing_id, osm_data_from, stats)
SELECT
  latest_run.id,
  latest_run.osm_data_from,
  COALESCE((
    SELECT jsonb_object_agg(
      totals.todo_id,
      jsonb_build_object('total', totals.count, 'byState', COALESCE(by_state.states, '[]'::jsonb))
    )
    FROM totals
    LEFT JOIN by_state ON by_state.todo_id = totals.todo_id
  ), '{}'::jsonb)
FROM latest_run
ON CONFLICT (processing_id) DO UPDATE
  SET stats = EXCLUDED.stats,
      osm_data_from = EXCLUDED.osm_data_from,
      created_at = NOW();
