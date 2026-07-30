-- Verify latest campaign stats row after 06-backfill-campaign-stats.sql
SELECT processing_id, osm_data_from,
       (SELECT count(*)::int FROM jsonb_object_keys(stats)) AS todo_count
FROM public.todos_lines_campaign_stats
ORDER BY processing_id DESC
LIMIT 1;
