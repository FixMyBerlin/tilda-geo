-- A QA config checks every cell of its area table; each cell set is its own table, named
-- <owner>_qa_<date>_<cells|reference>[_<part>]. The column "areaFilter" goes away with its values.
--
-- 1. The eUVM parking configs (`priority` / `non_priority` on data.euvm_qa_voronoi_2026) move to
--    the Innenstadt and Außenstadt tables, with the same ids, so their evaluations stay attached.
--    Any other config on these values stops the migration: it needs its own cell table first.
-- 2. Configs that already point to a table under its first name of November 2026 move to the
--    final name.
-- 3. The first infraVelo bikelanes config (`with_reference` on all eUVM cells) is deleted with its
--    evaluations; the QA views along the network replace it. It holds no user decisions.
-- 4. Tables nothing reads any more are dropped on every environment.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "QaConfig"
    WHERE "areaFilter" IN ('priority', 'non_priority') AND "areaTable" <> 'data.euvm_qa_voronoi_2026'
  ) THEN
    RAISE EXCEPTION 'QaConfig rows use areaFilter priority/non_priority on a table other than data.euvm_qa_voronoi_2026; give them their own cell table first';
  END IF;
END $$;

UPDATE "QaConfig"
SET "areaTable" = CASE "areaFilter"
  WHEN 'priority' THEN 'data.euvm_qa_2026_cells_innenstadt'
  ELSE 'data.euvm_qa_2026_cells_aussenstadt'
END
WHERE "areaFilter" IN ('priority', 'non_priority');

-- Configs on all eUVM cells without a filter exist only in local seeds: parking checks the
-- Außenstadt, bikelanes the Radvorrangnetz.
UPDATE "QaConfig"
SET
  "areaTable" = CASE dataset WHEN 'bikelanes' THEN 'data.infravelo_qa_2026_cells_rvn' ELSE 'data.euvm_qa_2026_cells_aussenstadt' END,
  "referenceTable" = CASE dataset WHEN 'bikelanes' THEN 'data.infravelo_qa_2026_reference_rvn' ELSE "referenceTable" END
WHERE "areaFilter" = 'all' AND "areaTable" = 'data.euvm_qa_voronoi_2026';

UPDATE "QaConfig" SET "areaTable" = CASE "areaTable"
  WHEN 'data.euvm_innenstadt_qa_cells_2026' THEN 'data.euvm_qa_2026_cells_innenstadt'
  WHEN 'data.euvm_aussenstadt_qa_cells_2026' THEN 'data.euvm_qa_2026_cells_aussenstadt'
  WHEN 'data.infravelo_rvn_qa_cells_2026' THEN 'data.infravelo_qa_2026_cells_rvn'
  ELSE "areaTable"
END;

UPDATE "QaConfig" SET "referenceTable" = CASE "referenceTable"
  WHEN 'data.qa_parkings_euvm_reference_2026' THEN 'data.euvm_qa_2026_reference'
  WHEN 'data.infravelo_rvn_qa_reference_2026' THEN 'data.infravelo_qa_2026_reference_rvn'
  ELSE "referenceTable"
END;

-- The map tables processing wrote for these configs, unless another config writes the same one.
DO $$
DECLARE
  map_table TEXT;
  parts TEXT[];
BEGIN
  FOR map_table IN
    SELECT DISTINCT "mapTable" FROM "QaConfig" WHERE "areaFilter" = 'with_reference'
    EXCEPT SELECT "mapTable" FROM "QaConfig" WHERE "areaFilter" <> 'with_reference'
  LOOP
    parts := parse_ident(map_table);
    EXECUTE format('DROP TABLE IF EXISTS %I.%I, %I.%I, %I.%I',
      parts[1], parts[2], parts[1], parts[2] || '_indicators', parts[1], parts[2] || '_last_editors');
  END LOOP;
END $$;

DELETE FROM "QaEvaluation"
WHERE "configId" IN (SELECT id FROM "QaConfig" WHERE "areaFilter" = 'with_reference');
DELETE FROM "QaConfig" WHERE "areaFilter" = 'with_reference';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "QaConfig"
    WHERE "areaTable" IN ('data.euvm_qa_voronoi', 'data.euvm_qa_voronoi_2026')
       OR "referenceTable" IN ('data.qa_bikelanes_infravelo_reference_2026', 'data.qa_bikelanes_berlin_reference_2026')
  ) THEN
    RAISE EXCEPTION 'QaConfig rows still read a table this migration drops; move them to a current table first';
  END IF;
END $$;

ALTER TABLE "QaConfig" DROP COLUMN "areaFilter";
DROP TYPE "QaAreaFilter";

DROP TABLE IF EXISTS
  data.euvm_qa_voronoi,
  data.euvm_qa_voronoi_2026,
  data.euvm_innenstadt_qa_cells_2026,
  data.euvm_aussenstadt_qa_cells_2026,
  data.qa_parkings_euvm_reference_2026,
  data.qa_bikelanes_infravelo_reference_2026,
  data.infravelo_rvn_qa_cells_2026,
  data.infravelo_rvn_qa_reference_2026;
