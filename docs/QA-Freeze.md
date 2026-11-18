# Freeze a QA view

A QA config compares the current data per cell with a frozen state: usually the data of a client
delivery. It names two `data.*` tables ([QA-Documentation.md](QA-Documentation.md)):

| Table                              | Holds                                                        | Columns                                                                                          |
| ---------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Cell table (`areaTable`)           | the cells; the config checks every one of them               | `id` (text, stable), `geom` (valid MultiPolygon, EPSG:4326), `name` (optional)                   |
| Reference table (`referenceTable`) | the amount per cell, indicator and tag value at the delivery | `area_id`, `indicator_key`, `value_key` (`__total__` for `total`, `__none__` untagged), `amount` |

Why the cells look like this: [QA-Cells.md](QA-Cells.md).

## Where the tables are built

Cells and reference belong to the project that delivers; tilda-geo only loads the result. Each
project has a folder `tilda-qa/` whose scripts write SQL files straight into
`data-schema/<table>/` of this repo. Table names follow `<owner>_qa_<date>_<cells|reference>[_<part>]`,
e.g. `euvm_qa_2026_cells_innenstadt`, `euvm_qa_2026_reference`, `infravelo_qa_2026_cells_rvn`,
`infravelo_qa_2026_12_01_reference_ren_bezirk07`. A table keeps its name when it is no longer in use.

| Project             | Folder                                                                                                                       | Cells                                                                                                           | Reference                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Parking eUVM        | [FMC/scripts `tilda-parkraum-euvm/tilda-qa/`](https://github.com/FixMyBerlin/scripts/tree/main/tilda-parkraum-euvm/tilda-qa) | the delivered eUVM cells, clipped to Berlin, borders straightened, one table each for Innenstadt and Außenstadt | the public parking lines and lots of the delivered `parking_public.gpkg`, amount = `capacity`            |
| Bikelanes infraVelo | [infravelo-radnetz `tilda-qa/`](https://github.com/FixMyBerlin/infravelo-radnetz/tree/main/tilda-qa)                         | one cell per edge of the delivered network, optionally one district                                             | the TILDA `bikelanes` export the delivery was computed from, amount = length, lines on their street side |

The reference scripts load the delivered features into a local tilda-geo database and measure them
with the QA functions ([`processing/qa/qa_functions.sql`](../processing/qa/qa_functions.sql)), so the
reference is measured exactly like the nightly measures the current data ([Measure.md](Measure.md)).
A new cell table always needs a new reference: the reference is measured on the cell geometry.

On production a reference can also be written from the live data at delivery date: build
`_qa_features` like the dataset script does (everything above its `CALL` in
[`9_qa_parkings.sql`](../processing/topics/parking/9_qa_parkings.sql) or
[`5_qa_bikelanes.sql`](../processing/topics/roads_bikelanes/5_qa_bikelanes.sql)), then
`CALL tilda_qa_write_reference('<dataset>', <config_id>, 'data.<reference_table>');` and export the
table as SQL dump. The customer's merged roads+bikelanes network is **not** a valid input — QA reads
TILDA's own tables; see
[QA-Documentation.md](QA-Documentation.md#scope-tilda-data-not-the-customers-merged-network).

## Publish and switch on

1. `data-schema/<table>/spec.yaml` next to the SQL file (skill
   [add-db-data-table](../.agents/skills/add-db-data-table/SKILL.md)). Copy the spec of the previous
   table of that kind; `source.file` is the `.sql` dump, no `import` block. Put the script call and
   the delivery date into `source.documentation`: it is the only place the origin is recorded.
   Keep the SQL dump: a GeoPackage/GeoJSON round trip would replace the text `id` with an integer.
2. `bun run data-schema-verify`, `data-schema-load`, then
   `bun run data-schema-publish -- --table <table> --mode snapshot` (`--mode override` for a new
   table).
3. **Import** on local, staging and production (`/admin/data-schema` or MCP `data_schema_import`).
   Until then the config has no reference values (the nightly logs them as missing).
4. **QA config** (`/admin/qa-configs`): the cell table, the reference table and `referenceFrozenAt`
   = the delivery date. The trusted-editor check counts edits from that date on
   ([QA-Documentation.md §3](QA-Documentation.md#3-trusted-osm-editors-automatic-ok)). The config
   takes effect with the next processing run.
5. **Sanity check**: the `total` of the reference is close to the amount of the delivery inside the
   cells (the scripts print both). A large unexplained gap means the input is wrong — stop and ask.
