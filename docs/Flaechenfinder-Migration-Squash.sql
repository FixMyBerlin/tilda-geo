-- One-time move of the Flächenfinder instance (flaechenfinder.tilda-geo.de) from the
-- 14 development migrations (Planning* tables, `planning` result schema) to the squashed
-- migration `20261103125637_space_finder` (SpaceFinder* tables, `space_finder` schema).
-- Keeps every study area, variant, run, job and all result geometries.
--
-- Run it in one transaction while app and worker are stopped, BEFORE the new image starts.
-- Steps around it: docs/Flaechenfinder-Migration-Squash.md. Never run it on staging or
-- production: they never had the old migrations and get the squashed one via `migrate deploy`.

BEGIN;

-- Guard: stop if this database is not in the expected old state.
DO $$
BEGIN
  IF to_regclass('prisma."PlanningArea"') IS NULL THEN
    RAISE EXCEPTION 'prisma."PlanningArea" not found: not the old Flächenfinder state';
  END IF;
  IF (SELECT count(*) FROM prisma._prisma_migrations
      WHERE migration_name IN (
        '20260609104415_planning_module',
        '20260630000000_planning_run_cir_attribution',
        '20260701000000_planning_run_veg_count',
        '20260701120000_planning_job_progress',
        '20260701150000_planning_run_remove_area_count',
        '20260814120000_planning_area_variant',
        '20260814130000_planning_variant_parent_set_null',
        '20260819065927_planning_area_use_case',
        '20260902092811_region_space_finder_enabled',
        '20260902135225_planning_area_census_saettigung',
        '20261007130000_region_space_finder_default_off',
        '20261007140000_planning_created_by_set_null',
        '20261008100000_review_entry_space_finder',
        '20261013090000_planning_user_datasets'
      ) AND finished_at IS NOT NULL AND rolled_back_at IS NULL) <> 14 THEN
    RAISE EXCEPTION 'expected all 14 old Flächenfinder migrations to be applied';
  END IF;
END $$;

-- Was backfilled into "userDatasets" (dataset d1) by 20261013090000_planning_user_datasets.
ALTER TABLE prisma."PlanningArea" DROP COLUMN "userGeojson", DROP COLUMN "userGeojsonMode";

-- Tables
ALTER TABLE prisma."PlanningArea" RENAME TO "SpaceFinderArea";
ALTER TABLE prisma."PlanningVariant" RENAME TO "SpaceFinderVariant";
ALTER TABLE prisma."PlanningRun" RENAME TO "SpaceFinderRun";
ALTER TABLE prisma."PlanningJob" RENAME TO "SpaceFinderJob";

-- Enums
ALTER TYPE prisma."PlanningRunStatus" RENAME TO "SpaceFinderRunStatus";
ALTER TYPE prisma."PlanningJobStatus" RENAME TO "SpaceFinderJobStatus";

-- Sequences (the variant one still carries the name of the even older PlanningScenario table)
ALTER SEQUENCE prisma."PlanningArea_id_seq" RENAME TO "SpaceFinderArea_id_seq";
ALTER SEQUENCE prisma."PlanningScenario_id_seq" RENAME TO "SpaceFinderVariant_id_seq";
ALTER SEQUENCE prisma."PlanningRun_id_seq" RENAME TO "SpaceFinderRun_id_seq";
ALTER SEQUENCE prisma."PlanningJob_id_seq" RENAME TO "SpaceFinderJob_id_seq";

-- Primary keys (renames their index too)
ALTER TABLE prisma."SpaceFinderArea" RENAME CONSTRAINT "PlanningArea_pkey" TO "SpaceFinderArea_pkey";
ALTER TABLE prisma."SpaceFinderVariant" RENAME CONSTRAINT "PlanningVariant_pkey" TO "SpaceFinderVariant_pkey";
ALTER TABLE prisma."SpaceFinderRun" RENAME CONSTRAINT "PlanningRun_pkey" TO "SpaceFinderRun_pkey";
ALTER TABLE prisma."SpaceFinderJob" RENAME CONSTRAINT "PlanningJob_pkey" TO "SpaceFinderJob_pkey";

-- Foreign keys
ALTER TABLE prisma."SpaceFinderArea" RENAME CONSTRAINT "PlanningArea_regionId_fkey" TO "SpaceFinderArea_regionId_fkey";
ALTER TABLE prisma."SpaceFinderArea" RENAME CONSTRAINT "PlanningArea_createdById_fkey" TO "SpaceFinderArea_createdById_fkey";
ALTER TABLE prisma."SpaceFinderVariant" RENAME CONSTRAINT "PlanningVariant_areaId_fkey" TO "SpaceFinderVariant_areaId_fkey";
ALTER TABLE prisma."SpaceFinderVariant" RENAME CONSTRAINT "PlanningVariant_createdById_fkey" TO "SpaceFinderVariant_createdById_fkey";
ALTER TABLE prisma."SpaceFinderVariant" RENAME CONSTRAINT "PlanningVariant_parentId_fkey" TO "SpaceFinderVariant_parentId_fkey";
ALTER TABLE prisma."SpaceFinderRun" RENAME CONSTRAINT "PlanningRun_variantId_fkey" TO "SpaceFinderRun_variantId_fkey";
ALTER TABLE prisma."SpaceFinderJob" RENAME CONSTRAINT "PlanningJob_variantId_fkey" TO "SpaceFinderJob_variantId_fkey";
ALTER TABLE prisma."SpaceFinderJob" RENAME CONSTRAINT "PlanningJob_resultRunId_fkey" TO "SpaceFinderJob_resultRunId_fkey";

-- Indexes
ALTER INDEX prisma."PlanningArea_regionId_idx" RENAME TO "SpaceFinderArea_regionId_idx";
ALTER INDEX prisma."PlanningVariant_areaId_idx" RENAME TO "SpaceFinderVariant_areaId_idx";
ALTER INDEX prisma."PlanningRun_variantId_idx" RENAME TO "SpaceFinderRun_variantId_idx";
ALTER INDEX prisma."PlanningJob_resultRunId_key" RENAME TO "SpaceFinderJob_resultRunId_key";
ALTER INDEX prisma."PlanningJob_status_idx" RENAME TO "SpaceFinderJob_status_idx";
ALTER INDEX prisma."PlanningJob_variantId_idx" RENAME TO "SpaceFinderJob_variantId_idx";

-- Audit history keeps pointing at the records under their new model names.
UPDATE prisma."AuditLog" SET model = 'SpaceFinderArea' WHERE model = 'PlanningArea';
UPDATE prisma."AuditLog" SET model = 'SpaceFinderVariant' WHERE model = 'PlanningVariant';

-- Result schema of the worker. The old tile functions are dropped; app and worker
-- recreate them as space_finder.space_finder_* on startup. Without a `planning` schema
-- (the worker never ran) there is nothing to rename.
DO $$
BEGIN
  IF to_regnamespace('space_finder') IS NOT NULL THEN
    RAISE EXCEPTION 'schema space_finder already exists: did the new app or worker start already?';
  END IF;
  IF to_regnamespace('planning') IS NOT NULL THEN
    ALTER SCHEMA planning RENAME TO space_finder;
  ELSE
    CREATE SCHEMA space_finder;
  END IF;
END $$;
DROP FUNCTION IF EXISTS space_finder.planning_hexagons(int, int, int, json);
DROP FUNCTION IF EXISTS space_finder.planning_vegetation(int, int, int, json);
DROP FUNCTION IF EXISTS space_finder.planning_carriageways(int, int, int, json);
DROP FUNCTION IF EXISTS space_finder.planning_census(int, int, int, json);
-- Leftovers the old code cleaned up on every start (the new code no longer does).
DROP TABLE IF EXISTS space_finder.scenario_areas;
DROP FUNCTION IF EXISTS public.planning_hexagons(int, int, int, json);
DROP FUNCTION IF EXISTS public.planning_vegetation(int, int, int, json);
DROP FUNCTION IF EXISTS public.planning_carriageways(int, int, int, json);
DROP FUNCTION IF EXISTS public.planning_census(int, int, int, json);
DROP FUNCTION IF EXISTS public.planning_areas(int, int, int, json);

-- Migration history: replace the 14 old rows by the squashed migration, so the
-- `prisma migrate deploy` on app start has nothing left to do. Same row as
-- `prisma migrate resolve --applied`; the checksum is `shasum -a 256` of its migration.sql.
DELETE FROM prisma._prisma_migrations
WHERE migration_name IN (
  '20260609104415_planning_module',
  '20260630000000_planning_run_cir_attribution',
  '20260701000000_planning_run_veg_count',
  '20260701120000_planning_job_progress',
  '20260701150000_planning_run_remove_area_count',
  '20260814120000_planning_area_variant',
  '20260814130000_planning_variant_parent_set_null',
  '20260819065927_planning_area_use_case',
  '20260902092811_region_space_finder_enabled',
  '20260902135225_planning_area_census_saettigung',
  '20261007130000_region_space_finder_default_off',
  '20261007140000_planning_created_by_set_null',
  '20261008100000_review_entry_space_finder',
  '20261013090000_planning_user_datasets'
);
INSERT INTO prisma._prisma_migrations
  (id, checksum, migration_name, started_at, finished_at, applied_steps_count)
VALUES (
  gen_random_uuid()::text,
  'ff397ca812ec9be2db0c8f204aacd53a83532e37a93c334197f4b80fdcbb2698',
  '20261103125637_space_finder',
  now(),
  now(),
  1
);

COMMIT;
