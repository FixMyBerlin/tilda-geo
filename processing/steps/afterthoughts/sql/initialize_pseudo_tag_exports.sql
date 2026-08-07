DO $$ BEGIN
  RAISE NOTICE '[Initialize][pseudo_tag_exports] Ensure export tables exist (empty until afterthoughts) at %',
    clock_timestamp() AT TIME ZONE 'Europe/Berlin';
END $$;

CREATE TABLE IF NOT EXISTS public.pseudo_tag_export_sidepath (
  osm_type TEXT NOT NULL,
  osm_id BIGINT NOT NULL,
  is_sidepath TEXT NOT NULL,
  adjoining_road TEXT,
  adjoining_maxspeed TEXT
);

ALTER TABLE public.pseudo_tag_export_sidepath
  ADD COLUMN IF NOT EXISTS adjoining_road TEXT,
  ADD COLUMN IF NOT EXISTS adjoining_maxspeed TEXT;

CREATE TABLE IF NOT EXISTS public.pseudo_tag_export_settlement (
  osm_type TEXT NOT NULL,
  osm_id BIGINT NOT NULL,
  in_settlement_area TEXT NOT NULL
);

DO $$
DECLARE
  sidepath_count INT;
  settlement_count INT;
BEGIN
  SELECT count(*) INTO sidepath_count FROM public.pseudo_tag_export_sidepath;
  SELECT count(*) INTO settlement_count FROM public.pseudo_tag_export_settlement;
  RAISE NOTICE '[Initialize][pseudo_tag_exports] Ready (sidepath=%, settlement=%; populated in afterthoughts)',
    sidepath_count, settlement_count;
END $$;
