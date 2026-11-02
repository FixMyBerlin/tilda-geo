# QA System Documentation

## Contents

- [Overview](#overview)
- [Scope: TILDA data, not the customer's merged network](#scope-tilda-data-not-the-customers-merged-network)
- [1. Indicators](#1-indicators)
- [2. Thresholds and status](#2-thresholds-and-status)
- [3. Trusted OSM editors (automatic OK)](#3-trusted-osm-editors-automatic-ok)
- [4. Nightly update rules, per indicator](#4-nightly-update-rules-per-indicator)
- [5. Processing tables (the contract app code reads)](#5-processing-tables-the-contract-app-code-reads)
- [6. Reference table](#6-reference-table)
- [7. Nightly update job](#7-nightly-update-job)
- [Cells](QA-Cells.md)
- [Map status payload, caching and options](QA-Map-Status-Payload.md)
- [Parking client freeze + QA](Parking-Client-Freeze-QA.md)

## Overview

The QA system compares a dataset's current state to a frozen reference, per cell, and flags cells
where the difference looks like a data problem rather than a real-world change. It combines
system-generated statuses (thresholds) with human decisions (one status per cell and indicator,
with a comment).

Two datasets exist today: `parking_euvm` (parking spaces) and `bikelanes` (meters of cycling
infrastructure). Both share the processing functions
([`processing/qa/qa_functions.sql`](../processing/qa/qa_functions.sql)) and the evaluation rules
([`qaEvaluationRules.ts`](../app/src/server/qa-configs/evaluation/qaEvaluationRules.ts)).

## Scope: TILDA data, not the customer's merged network

QA runs on TILDA's own processing tables. For the Berlin cycling delivery, the customer file
merges TILDA's `bikelanes` (side geometries) and `roads` (centerlines) into one network outside
this repository — nothing in TILDA merges them. Consequences:

- QA covers `bikelanes` per cell. A change that only touches `roads` (e.g. the surface of a
  mixed-traffic street with no separate bikelane) is invisible to QA unless a second `QaConfig` on
  `roads` is added (same generic SQL, other indicators). This has not been decided yet.
- The reference for the bikelanes config is TILDA `bikelanes` at delivery date
  (`data.qa_bikelanes_berlin_reference_<year>`, [freeze checklist](Parking-Client-Freeze-QA.md)).
  The merged customer file is not a valid reference.
- Indicator keys are TILDA tag names (`category`, `oneway`, …), not the customer schema.

## 1. Indicators

One `QaConfig` = one dataset + one cell set + a list of indicators, so a reviewer sees every
indicator of a cell in one view.

- The **dataset** ([`qaDatasets.const.ts`](../app/src/server/qa-configs/qaDatasets.const.ts))
  fixes the **amount** that is compared: the `capacity` of parking lines and lots, or the bikelane
  length in meters. It also names the source table whose topic-doc attributes can be picked as
  indicators (`parkings` / `bikelanes`; numeric attributes are left out).
- A feature that crosses a cell border counts in each cell with the share that lies inside it
  ([Measure.md](Measure.md)), so amounts can be fractional (12.4 parking spaces).
- An **indicator** is a Merkmal plus its thresholds (§2): `{ key, label, goodThreshold,
  needsReviewThreshold, absoluteDifferenceThreshold }` in `QaConfig.indicators`, validated by
  [`qaIndicatorsSchema.ts`](../app/src/server/qa-configs/schemas/qaIndicatorsSchema.ts). `key` is
  either `total` (the plain amount) or a tag, e.g. `condition_category_primary`; each key once per config.
  The order of the list is the order in the detail panel and on the map when statuses tie.
- **Defaults** for a new config (admin form, seeds): parking `total` + `condition_category_primary`;
  bikelanes `category` (meters per category — the category is derived from `traffic_sign` and
  follows every change in length) + `oneway` (not part of the category).
- **Bikelanes `oneway`**: the derived values count like the tagged ones (`implicit_yes` as `yes`,
  `assumed_no` as `no`, see `tilda_qa_bikelane_tags`). They have the same effect, so tagging one
  in OSM is not a change to review. The reference is built with the same rule.

### The comparison

Per cell, the amount is split by the values of the indicator's tag (untagged features form the
class `__none__`; the `total` has one class) and compared class by class with the reference:

- `reference`, `current`: the summed amounts.
- `difference = max(amount gained, amount lost)` over the classes — the amount that was added,
  removed or now carries another value. For the `total` this is `|reference − current|`.
- `deviation = difference / max(reference, current)`, 0 when both are 0. Always between 0 and 1:
  a cell whose features all disappeared, or which had none in the reference, has deviation 1.
- `breakdown`: `{ value: { reference, current } }` per class (not for the `total`).

Class amounts are rounded to 0.1 first. Computed in `tilda_qa_compute_indicators`
([`qa_functions.sql`](../processing/qa/qa_functions.sql), tests in
[`qa_functions.test.sql`](../processing/qa/qa_functions.test.sql)).

| Indicator  | reference (per class)         | current (per class)           | difference | deviation |
| ---------- | ----------------------------- | ----------------------------- | ---------- | --------- |
| `total`    | 75 spaces                     | 45 spaces                     | 30         | 0.4       |
| `category` | 800 m track, 200 m lane       | 600 m track, 400 m lane       | 200        | 0.2       |
| `surface`  | 10 m asphalt                  | 5 m asphalt, 10 m sett        | 10         | 0.6667    |
| `oneway`   | 300 m `yes`, 100 m `__none__` | 300 m `yes`, 100 m `__none__` | 0          | 0         |

A newly added tag counts as a change (`__none__` → value) — intended.

## 2. Thresholds and status

Thresholds live inside each indicator: units and semantic weight differ per attribute (a
`category` change should alert early, `oneway` refinements late). Relative thresholds are stored as
0–1 fractions; the admin form edits them in percent and converts once, at the form boundary
([`schemas.ts`](../app/src/server/qa-configs/schemas.ts)). The absolute threshold is in the
dataset's unit.

`calculateIndicatorStatus({ deviation, difference, thresholds })`
([`qaEvaluationRules.ts`](../app/src/server/qa-configs/evaluation/qaEvaluationRules.ts)) decides:

1. `difference ≤ absoluteDifferenceThreshold` → **GOOD**, whatever the deviation (a noise floor in
   dataset units).
2. `deviation ≤ goodThreshold` → **GOOD**.
3. `deviation ≤ needsReviewThreshold` → **NEEDS_REVIEW**.
4. otherwise → **PROBLEMATIC**.

Boundaries are inclusive, with a `1e-9` epsilon so float rounding does not flip a value that sits
exactly on a boundary.

**User status** (manual, per indicator), which always overrides the system status in the UI
(`qaEffectiveStatus` in [`qaIndicatorStatus.ts`](../app/src/shared/qaIndicatorStatus.ts)):

| Status                    | Meaning                                                             |
| ------------------------- | ------------------------------------------------------------------- |
| `OK_STRUCTURAL_CHANGE`    | Confirmed OK, caused by construction / a real structural change     |
| `OK_REFERENCE_ERROR`      | Confirmed OK, the reference data was wrong                          |
| `OK_QA_TOOLING_ERROR`     | Confirmed OK, caused by a methodical error in the QA tooling itself |
| `NOT_OK_DATA_ERROR`       | Confirmed problem, current data needs fixing                        |
| `NOT_OK_PROCESSING_ERROR` | Confirmed problem, processing needs fixing                          |

The admin form's "Mit aktuellen Daten prüfen" counts the statuses the latest processing run would
get with the thresholds being typed, and lists the largest differences.

The single-indicator design compared `max/min − 1`; its migration converts a threshold `t` to
`t / (1 + t)` (10 % → 9.09 %), which keeps every cell's status.

## 3. Trusted OSM editors (automatic OK)

Some deviations are expected: known-good OSM contributors re-map an area and the difference to the
frozen reference is real, not a data problem. A `QaConfig` can list `trustedOsmUsernames` whose
recent edits turn an indicator's non-GOOD status into `TRUSTED_EDITOR_CHANGE` (»Gut
(Vertrauensliste)«, map letter `T`).

- `trustedOsmUsernames` — OSM display names, stored lowercase. An empty list means off.
- `referenceFrozenAt` — 00:00 UTC of the freeze day; edits from then on are checked. Not the
  previous evaluation's date: that would reset the window every time a trusted row is written.
- Per cell, `public.<map>_last_editors` (§5) lists `{ osmUser, amount, updatedAt }` per
  `(osmUser, updatedAt)` pair among the cell's features; the same list applies to every indicator.

`checkTrustedEditors` passes when, among the edits since the freeze, at least one is by a trusted
user and the untrusted `amount` is ≤ the indicator's `absoluteDifferenceThreshold`.
`applyTrustedEditors` then turns NEEDS_REVIEW / PROBLEMATIC into `TRUSTED_EDITOR_CHANGE`; a
difference within the absolute threshold stays GOOD. It is not GOOD, so it never resets a human
decision (§4); on the map it ranks like a user OK. Its row `body` names the trusted editors.

Limitations: deleted OSM objects leave no editor behind, so a deletion always needs a review;
production needs the non-anonymized extract; merged parking lines credit their whole capacity to
the latest editor; an OSM account rename breaks the match until the list is updated; enabling the
list on a config with open reviews can flip many indicators in one night.

## 4. Nightly update rules, per indicator

For each `(cell, indicator)`: the latest row `P` (its stored system status and user status) and
the freshly computed system status `S`. `getQaUpdateDecision` returns `create`, `reset` or `none`,
**independently per indicator** — a decision on `condition_category_primary` never touches `total`.

| Case                                                                                                                             | Decision                       |
| -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| No previous row                                                                                                                  | `create`                       |
| No user status, `S` unchanged                                                                                                    | `none`                         |
| No user status, `S` differs                                                                                                      | `create`                       |
| Permanent user status (`OK_STRUCTURAL_CHANGE`, `OK_REFERENCE_ERROR`)                                                             | `none`, always                 |
| Resettable user status (`NOT_OK_DATA_ERROR`, `NOT_OK_PROCESSING_ERROR`, `OK_QA_TOOLING_ERROR`), `S = GOOD`, row was **not** GOOD | `reset`                        |
| Same, but the row was already GOOD                                                                                               | `none` — no signal of a fix    |
| Same, `S` is not GOOD                                                                                                            | `none` — protects the decision |

`create` and `reset` write a SYSTEM row (no user status). A user submission writes a USER row that
copies the indicator's current system status — that stored value is "the row" above. "Alle offenen
als OK markieren" writes one USER row per non-GOOD, undecided indicator (`isOpenQaIndicator`).

Example, parking cell with `total` and `condition_category_primary`: processing reports 30 of 75 spaces
missing → `total` PROBLEMATIC (`create`), `condition_category_primary` unchanged (`none`). A reviewer marks
`total` `NOT_OK_DATA_ERROR`. It stays red while the data is wrong; the night the spaces are mapped
again, `total` becomes GOOD and a `reset` row clears the decision.

## 5. Processing tables (the contract app code reads)

For a config with `mapTable = public.<name>`, all tables are created in SQL (never via
`osm2pgsql.define_table`), so a `--create` run does not wipe them:

- **`public.<name>`**: `id TEXT PRIMARY KEY, geom geometry(MultiPolygon, 3857)` + GIST index. The
  only table Martin publishes as vector tiles (no values, so nothing private leaks).
- **`public.<name>_indicators`**: `area_id, indicator_key, reference, current, difference,
  deviation, breakdown` (§1), primary key `(area_id, indicator_key)`. One row per cell and
  indicator with reference rows (§6), also when both sides are empty. Rebuilt every run, like
  `_last_editors`.
- **`public.<name>_last_editors`**: `area_id, last_editors JSONB` (§3), one row per cell, `[]`
  when empty.

Built by `tilda_qa_finalize` and driven per dataset by `tilda_qa_run_dataset`
([`qa_functions.sql`](../processing/qa/qa_functions.sql)), called from
[`9_qa_parkings.sql`](../processing/topics/parking/9_qa_parkings.sql) and
[`5_qa_bikelanes.sql`](../processing/topics/roads_bikelanes/5_qa_bikelanes.sql). Both first build
`_qa_features(geom, amount, tags, osm_user, updated_at)` from the dataset's features
([Measure.md](Measure.md)): the public parking lines and lots with their `capacity`, the bikelanes
with their `length`. Bikelane geometry stays on the road centerline in the database, but the cells
are per street side, so for QA the lines are moved by `|offset|` to the right of the line
(left-side lines run against the OSM way, see `roads_bikelanes_bikelanes.lua`).

The map shows the cell geometry the measure uses. The borders of the cells are straightened once,
in the cell table itself ([freeze checklist](Parking-Client-Freeze-QA.md), step 2).

## 6. Reference table

Each config points at a `referenceTable` (`data.*`): `area_id, indicator_key, value_key, amount`,
one row per cell, indicator and class (`value_key = '__total__'` for the `total`). It is written
once, at freeze time, by `tilda_qa_write_reference(dataset, config_id, target_table)` — see the
[freeze checklist](Parking-Client-Freeze-QA.md). An indicator added later has no reference rows
until the next freeze and is left out until then — comparing it against 0 would rate every cell
PROBLEMATIC; the nightly logs it as missing. A missing table (CI, fresh DB) leaves out all
indicators.

The **cell table** (`areaTable`, also `data.*`) has `id`, `geom` and optionally `priority` for
`areaFilter`; see [QA-Cells.md](QA-Cells.md).

## 7. Nightly update job

Per active config, three reads: every `<map>_indicators` row, every `<map>_last_editors` row and
the latest `QaEvaluation` per `(area, indicator)` (`ORDER BY createdAt DESC, id DESC` — rows of one
run share a timestamp). Decisions (§4) are computed in memory and written in chunks of 1,000. A
failing config is logged and skipped; `qa_update_completed_at` is written anyway.

`?dryRun=1` returns the same per-config counts without writing — used to calibrate new indicators'
thresholds on staging. Indicator keys in `<map>_indicators` but not in the config (or the reverse,
until the next processing run) are logged and skipped.
