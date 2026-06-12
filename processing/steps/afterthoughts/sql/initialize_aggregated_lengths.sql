DO $$ BEGIN
  RAISE NOTICE '[Initialize][aggregated_lengths] Ensure table exists (empty until afterthoughts) at %',
    clock_timestamp() AT TIME ZONE 'Europe/Berlin';
END $$;

CREATE TABLE IF NOT EXISTS public.aggregated_lengths
(
  id TEXT UNIQUE,
  name TEXT,
  level TEXT,
  geom Geometry(MultiPolygon, 3857),
  regionalschluessel TEXT,
  bikelane_length JSONB,
  road_length JSONB
);

-- TODO(2026-12): Remove ALTER ADD COLUMN when all deployments are migrated.
ALTER TABLE public.aggregated_lengths ADD COLUMN IF NOT EXISTS regionalschluessel TEXT;

DO $$
DECLARE
  row_count INT;
BEGIN
  SELECT count(*) INTO row_count FROM public.aggregated_lengths;
  RAISE NOTICE '[Initialize][aggregated_lengths] Ready (% rows; populated in afterthoughts)', row_count;
END $$;
