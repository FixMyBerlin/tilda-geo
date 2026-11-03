-- Rollback of Flaechenfinder-Migration-Squash.sql: back to the 14 old migrations
-- (Planning* tables, `planning` schema), so the previous code of `flaechenfinder-module`
-- runs again. Keeps every row, also the ones created after the move. The two dropped
-- columns come back empty; the old code no longer reads them.
--
-- Run it in one transaction while app and worker are stopped, then deploy the old commit.

BEGIN;

DO $$
BEGIN
  IF to_regclass('prisma."SpaceFinderArea"') IS NULL THEN
    RAISE EXCEPTION 'prisma."SpaceFinderArea" not found: not the moved state';
  END IF;
END $$;

-- Constraints first (they are addressed through the new table names)
ALTER TABLE prisma."SpaceFinderArea" RENAME CONSTRAINT "SpaceFinderArea_pkey" TO "PlanningArea_pkey";
ALTER TABLE prisma."SpaceFinderVariant" RENAME CONSTRAINT "SpaceFinderVariant_pkey" TO "PlanningVariant_pkey";
ALTER TABLE prisma."SpaceFinderRun" RENAME CONSTRAINT "SpaceFinderRun_pkey" TO "PlanningRun_pkey";
ALTER TABLE prisma."SpaceFinderJob" RENAME CONSTRAINT "SpaceFinderJob_pkey" TO "PlanningJob_pkey";
ALTER TABLE prisma."SpaceFinderArea" RENAME CONSTRAINT "SpaceFinderArea_regionId_fkey" TO "PlanningArea_regionId_fkey";
ALTER TABLE prisma."SpaceFinderArea" RENAME CONSTRAINT "SpaceFinderArea_createdById_fkey" TO "PlanningArea_createdById_fkey";
ALTER TABLE prisma."SpaceFinderVariant" RENAME CONSTRAINT "SpaceFinderVariant_areaId_fkey" TO "PlanningVariant_areaId_fkey";
ALTER TABLE prisma."SpaceFinderVariant" RENAME CONSTRAINT "SpaceFinderVariant_createdById_fkey" TO "PlanningVariant_createdById_fkey";
ALTER TABLE prisma."SpaceFinderVariant" RENAME CONSTRAINT "SpaceFinderVariant_parentId_fkey" TO "PlanningVariant_parentId_fkey";
ALTER TABLE prisma."SpaceFinderRun" RENAME CONSTRAINT "SpaceFinderRun_variantId_fkey" TO "PlanningRun_variantId_fkey";
ALTER TABLE prisma."SpaceFinderJob" RENAME CONSTRAINT "SpaceFinderJob_variantId_fkey" TO "PlanningJob_variantId_fkey";
ALTER TABLE prisma."SpaceFinderJob" RENAME CONSTRAINT "SpaceFinderJob_resultRunId_fkey" TO "PlanningJob_resultRunId_fkey";

-- Tables, enums, sequences, indexes
ALTER TABLE prisma."SpaceFinderArea" RENAME TO "PlanningArea";
ALTER TABLE prisma."SpaceFinderVariant" RENAME TO "PlanningVariant";
ALTER TABLE prisma."SpaceFinderRun" RENAME TO "PlanningRun";
ALTER TABLE prisma."SpaceFinderJob" RENAME TO "PlanningJob";
ALTER TYPE prisma."SpaceFinderRunStatus" RENAME TO "PlanningRunStatus";
ALTER TYPE prisma."SpaceFinderJobStatus" RENAME TO "PlanningJobStatus";
ALTER SEQUENCE prisma."SpaceFinderArea_id_seq" RENAME TO "PlanningArea_id_seq";
ALTER SEQUENCE prisma."SpaceFinderVariant_id_seq" RENAME TO "PlanningScenario_id_seq";
ALTER SEQUENCE prisma."SpaceFinderRun_id_seq" RENAME TO "PlanningRun_id_seq";
ALTER SEQUENCE prisma."SpaceFinderJob_id_seq" RENAME TO "PlanningJob_id_seq";
ALTER INDEX prisma."SpaceFinderArea_regionId_idx" RENAME TO "PlanningArea_regionId_idx";
ALTER INDEX prisma."SpaceFinderVariant_areaId_idx" RENAME TO "PlanningVariant_areaId_idx";
ALTER INDEX prisma."SpaceFinderRun_variantId_idx" RENAME TO "PlanningRun_variantId_idx";
ALTER INDEX prisma."SpaceFinderJob_resultRunId_key" RENAME TO "PlanningJob_resultRunId_key";
ALTER INDEX prisma."SpaceFinderJob_status_idx" RENAME TO "PlanningJob_status_idx";
ALTER INDEX prisma."SpaceFinderJob_variantId_idx" RENAME TO "PlanningJob_variantId_idx";

ALTER TABLE prisma."PlanningArea" ADD COLUMN "userGeojson" JSONB, ADD COLUMN "userGeojsonMode" TEXT;

UPDATE prisma."AuditLog" SET model = 'PlanningArea' WHERE model = 'SpaceFinderArea';
UPDATE prisma."AuditLog" SET model = 'PlanningVariant' WHERE model = 'SpaceFinderVariant';

-- Result schema: the new tile functions go, the old code recreates planning.planning_* on start.
DROP FUNCTION IF EXISTS space_finder.space_finder_hexagons(int, int, int, json);
DROP FUNCTION IF EXISTS space_finder.space_finder_vegetation(int, int, int, json);
DROP FUNCTION IF EXISTS space_finder.space_finder_carriageways(int, int, int, json);
DROP FUNCTION IF EXISTS space_finder.space_finder_census(int, int, int, json);
ALTER SCHEMA space_finder RENAME TO planning;

DELETE FROM prisma._prisma_migrations WHERE migration_name = '20261103125637_space_finder';
INSERT INTO prisma._prisma_migrations
  (id, checksum, migration_name, started_at, finished_at, applied_steps_count)
SELECT gen_random_uuid()::text, v.checksum, v.name, now(), now(), 1
FROM (VALUES
  ('20260609104415_planning_module', 'edaa2bbd0d8365980d47a78fa2e0d5b9d7f89c6740c0f78225cc5b8ff7869b2b'),
  ('20260630000000_planning_run_cir_attribution', '9754e12ba7506f6621c27b358d6b7d32e8d37222c2a77ca1599bf0db3144e76c'),
  ('20260701000000_planning_run_veg_count', 'cf027fbe23481b2f7d4d81002a689fa8859cd977b8bc3adf44979b719d86c82a'),
  ('20260701120000_planning_job_progress', 'b06e04f9a2295545052806d89fcfcf734dc487e29f9a943df639483b0cf83175'),
  ('20260701150000_planning_run_remove_area_count', 'c03de8a7c23799380e4f03192ea22837da54c8fff5e622b93c7bcd3d7efd2f86'),
  ('20260814120000_planning_area_variant', '908aba7a98eec6bee3298b7782dd9cfee0b5af6867ff90cdf72afa45259b8b55'),
  ('20260814130000_planning_variant_parent_set_null', 'b288bd6341baf961cfc80cb7300889c7b51cd173753c15270ad92d2eee8ef55d'),
  ('20260819065927_planning_area_use_case', '874399f5708ddc6853f50fb2044c96d0a8d42f85923438a792fa6fe3e7ec6d7e'),
  ('20260902092811_region_space_finder_enabled', 'd1ec8e7631de8bde955af2b6cab3e672d1124e1a14e0b7479cab20a88248e5f3'),
  ('20260902135225_planning_area_census_saettigung', 'd706863aca4ffbf7ca16fed2343aa94807136cf4d6bcc871fa9f6a66d590bc39'),
  ('20261007130000_region_space_finder_default_off', 'a8bae66e40b3f2dbb82358f82abfbecdad936e73f9640176cc4c412e82366b18'),
  ('20261007140000_planning_created_by_set_null', 'e5dea01e45c2b52158e913ae37d9da35f021671351741263d792def0b579e352'),
  ('20261008100000_review_entry_space_finder', 'd95e7a068de3b71d77bb96e9601b09006fa152c44748edbd93623f3aef96749c'),
  ('20261013090000_planning_user_datasets', '1c68354546d8f821f209e40038bbb76afb7bedbd457919c02da98c5072f80494')
) AS v (name, checksum);

COMMIT;
