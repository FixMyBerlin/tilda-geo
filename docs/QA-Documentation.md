# QA System Documentation

## Contents

- [Overview](#overview)
- [Key Components](#key-components)
  - [1. System vs User Status](#1-system-vs-user-status)
  - [2. User Decision Protection Rule](#2-user-decision-protection-rule)
  - [3. System Status Update Rules](#3-system-status-update-rules)
    - [3.1. System Overwrites System](#31-system-overwrites-system-no-user-decision)
    - [3.2. System Overwrites User Decision](#32-system-overwrites-user-decision)
    - [3.3. Trusted OSM editors (automatic OK)](#33-trusted-osm-editors-automatic-ok)
- [Data Flow](#data-flow)
- [Parking client freeze + QA](Parking-Client-Freeze-QA.md)
- [Adding a New QA Config](#adding-a-new-qa-config)

## Overview

The QA (Quality Assurance) system provides automated and manual evaluation of data quality across different regions and datasets. It combines system-generated evaluations based on thresholds with human expert evaluations to ensure data accuracy and reliability.

## Key Components

### 1. System vs User Status

The QA system uses a dual-status approach:

**System Status** (Automatic):

- `GOOD` - Small difference, likely OK (Green)
- `NEEDS_REVIEW` - Medium difference, needs review (Yellow)
- `PROBLEMATIC` - Large difference, likely problem (Red)
- `TRUSTED_EDITOR_CHANGE` - Over threshold, but the changed spaces were last edited by trusted OSM users — "Gut (Vertrauensliste)" (Blue)

**User Status** (Manual):

- `OK_STRUCTURAL_CHANGE` - User confirmed OK, caused by construction/structural changes
- `OK_REFERENCE_ERROR` - User confirmed OK, caused by wrong reference data
- `NOT_OK_DATA_ERROR` - User confirmed problem, current data needs fixing
- `NOT_OK_PROCESSING_ERROR` - User confirmed problem, processing needs fixing
- `OK_QA_TOOLING_ERROR` - Diff OK, caused by methodical error in QA tooling (geometries/definitions) (Teal / distinct OK green in UI)

**Priority Rules**:

- User status **always overrides** system status when present
- System status is used as fallback when no user evaluation exists
- Areas with no evaluations show as gray (neutral)

### 2. User Decision Protection Rule

When a user has marked an area as NOT_OK (`NOT_OK_DATA_ERROR` or `NOT_OK_PROCESSING_ERROR`), the system must **not** overwrite that with new PROBLEMATIC or NEEDS_REVIEW evaluations. Only a GOOD system evaluation may overwrite a NOT_OK user decision (problem resolved). Full matrix: [§3.2 System Overwrites User Decision](#32-system-overwrites-user-decision).

### 3. System Status Update Rules

When to create a new evaluation depends on whether there is a user decision: [§3.1](#31-system-overwrites-system-no-user-decision) (no user decision) or [§3.2](#32-system-overwrites-user-decision) (user decision present). `TRUSTED_EDITOR_CHANGE` ([§3.3](#33-trusted-osm-editors-automatic-ok)) is simply one more possible **effective system status**, computed alongside GOOD/NEEDS_REVIEW/PROBLEMATIC — it does not change when an evaluation is created, only which status it gets.

#### 3.1. System Overwrites System (No User Decision)

When there is **no user decision** (`userStatus === null`), the system uses an **effective system status** to decide. The effective status is computed in this order (`getEffectiveSystemStatus` in `qaEvaluationRules.ts`):

1. **\|absoluteDifference\| ≤ threshold** (`QaConfig.absoluteDifferenceThreshold`): effective status = **GOOD**; nothing else is checked.
2. Otherwise, if the percent-based status is not GOOD **and** the trusted-editor check ([§3.3](#33-trusted-osm-editors-automatic-ok)) passes: effective status = **TRUSTED_EDITOR_CHANGE**.
3. Otherwise: effective status = the percent-based status (GOOD / NEEDS_REVIEW / PROBLEMATIC from `goodThreshold` / `needsReviewThreshold`).

**When \|absoluteDifference\| ≤ threshold** (effective = GOOD):

| Previous System Status | Effective New Status | Action                                                         |
| ---------------------- | -------------------- | -------------------------------------------------------------- |
| **GOOD**               | GOOD                 | **No change** — keep existing evaluation                       |
| **NEEDS_REVIEW**       | GOOD                 | **Create new evaluation** — system overwrites itself with GOOD |
| **PROBLEMATIC**        | GOOD                 | **Create new evaluation** — system overwrites itself with GOOD |

**When \|absoluteDifference\| > threshold** (effective status = %-based: GOOD / NEEDS_REVIEW / PROBLEMATIC):

| Previous System Status | Effective New Status | Action                                               |
| ---------------------- | -------------------- | ---------------------------------------------------- |
| **GOOD**               | GOOD                 | **No change** — keep existing evaluation             |
| **GOOD**               | NEEDS_REVIEW         | **Create new evaluation** — system overwrites itself |
| **GOOD**               | PROBLEMATIC          | **Create new evaluation** — system overwrites itself |
| **NEEDS_REVIEW**       | GOOD                 | **Create new evaluation** — system overwrites itself |
| **NEEDS_REVIEW**       | NEEDS_REVIEW         | **No change** — keep existing evaluation             |
| **NEEDS_REVIEW**       | PROBLEMATIC          | **Create new evaluation** — system overwrites itself |
| **PROBLEMATIC**        | GOOD                 | **Create new evaluation** — system overwrites itself |
| **PROBLEMATIC**        | NEEDS_REVIEW         | **Create new evaluation** — system overwrites itself |
| **PROBLEMATIC**        | PROBLEMATIC          | **No change** — keep existing evaluation             |

Effective status **unchanged** (e.g. GOOD → GOOD) → never create a new evaluation. Effective status **changed** → create a new evaluation where the tables say “Create new evaluation”. `TRUSTED_EDITOR_CHANGE` is not in the tables above but follows exactly the same rule: unchanged (e.g. `TRUSTED_EDITOR_CHANGE` → `TRUSTED_EDITOR_CHANGE`, because trusted editors still cover the diff) → no-op; changed (into or out of `TRUSTED_EDITOR_CHANGE`) → create a new evaluation with the new effective status. User classifications are not overwritten here; see [§3.2](#32-system-overwrites-user-decision) for when the system may reset a user decision (only when it becomes GOOD).

#### 3.2. System Overwrites User Decision

When there is **a user decision** (`userStatus !== null`), the system respects user decisions with specific rules. `TRUSTED_EDITOR_CHANGE` is not GOOD, so it **never** resets a user decision — only an effective status of GOOD does (same rule as NEEDS_REVIEW/PROBLEMATIC in the table below).

| Previous User Status        | New System Status | Action                                                    |
| --------------------------- | ----------------- | --------------------------------------------------------- |
| **OK_STRUCTURAL_CHANGE**    | GOOD              | **No change** - User decision is permanent                |
| **OK_STRUCTURAL_CHANGE**    | NEEDS_REVIEW      | **No change** - User decision is permanent                |
| **OK_STRUCTURAL_CHANGE**    | PROBLEMATIC       | **No change** - User decision is permanent                |
| **OK_REFERENCE_ERROR**      | GOOD              | **No change** - User decision is permanent                |
| **OK_REFERENCE_ERROR**      | NEEDS_REVIEW      | **No change** - User decision is permanent                |
| **OK_REFERENCE_ERROR**      | PROBLEMATIC       | **No change** - User decision is permanent                |
| **OK_QA_TOOLING_ERROR**     | GOOD              | **Reset user decision** - System detects problem resolved |
| **OK_QA_TOOLING_ERROR**     | NEEDS_REVIEW      | **No change** - User decision is permanent                |
| **OK_QA_TOOLING_ERROR**     | PROBLEMATIC       | **No change** - User decision is permanent                |
| **NOT_OK_DATA_ERROR**       | GOOD              | **Reset user decision** - System detects problem resolved |
| **NOT_OK_DATA_ERROR**       | NEEDS_REVIEW      | **No change** - Protect user's NOT_OK decision            |
| **NOT_OK_DATA_ERROR**       | PROBLEMATIC       | **No change** - Protect user's NOT_OK decision            |
| **NOT_OK_PROCESSING_ERROR** | GOOD              | **Reset user decision** - System detects problem resolved |
| **NOT_OK_PROCESSING_ERROR** | NEEDS_REVIEW      | **No change** - Protect user's NOT_OK decision            |
| **NOT_OK_PROCESSING_ERROR** | PROBLEMATIC       | **No change** - Protect user's NOT_OK decision            |

**Summary**:

- **OK decisions** (`OK_STRUCTURAL_CHANGE`, `OK_REFERENCE_ERROR`): never reset.
- **OK_QA_TOOLING_ERROR** and **NOT_OK** (`NOT_OK_DATA_ERROR`, `NOT_OK_PROCESSING_ERROR`): reset only when system status becomes GOOD.
- **Reset**: new evaluation with `userStatus = null`, `body = null`, `userId = null`.
- **Effective system status** (and thus "GOOD") follows [§3.1](#31-system-overwrites-system-no-user-decision) (absolute diff before %).
- **Stored system status on a user evaluation**: computed from the counts in the saved decision data (same thresholds as nightly), not a `NEEDS_REVIEW` placeholder. Users cannot set system status; `NEEDS_REVIEW` is only a system value.

**Order of checks** (`getQaUpdateDecision` in `qaEvaluationRules.ts`):

1. No previous evaluation → always create a `SYSTEM` evaluation (first run).
2. **Reset check** (independent of, and before, any data-changed gate): previous user status is `NOT_OK_DATA_ERROR`, `NOT_OK_PROCESSING_ERROR`, or `OK_QA_TOOLING_ERROR` and the effective status is `GOOD` → create a reset evaluation (see above).
3. Otherwise, a **data-changed gate** applies: `dataChanged = (effective status !== previous systemStatus) OR (previousRelative !== currentRelative AND |absoluteDifference| > threshold)`. If `dataChanged` is false → keep the existing evaluation.
4. If `dataChanged` is true, a new evaluation is created only when [§3.1](#31-system-overwrites-system-no-user-decision)/[§3.2](#32-system-overwrites-user-decision) say so — without a user decision, whenever the effective status changed; with a user decision, only the reset case from step 2 (already handled above).

The relative-change part of the gate (`previousRelative !== currentRelative`) therefore never creates an evaluation by itself — it only opens the gate for the effective-status check, so the tables in §3.1/§3.2 remain the full truth for when an evaluation is created. `previousRelative` comes from the processing table's previous run (`public.qa_parkings_euvm*.previous_relative`), not from the previously stored evaluation.

#### 3.3. Trusted OSM editors (automatic OK)

Some deviations are expected: known-good OSM contributors legitimately re-map an area (e.g. re-survey a street), and the diff against the frozen reference is real but not a data or processing problem. Rather than leave the cell as `NEEDS_REVIEW`/`PROBLEMATIC` for a human to confirm, a `QaConfig` can list `trustedOsmUsernames` whose recent edits turn a bad percent-based status into the `TRUSTED_EDITOR_CHANGE` system status instead — see the step order in [§3.1](#31-system-overwrites-system-no-user-decision).

**Inputs** (`QaConfig`):

- `trustedOsmUsernames: String[]` — OSM display names, stored lowercase and trimmed. Empty list (the default) means the check can never pass.
- `referenceFrozenAt: DateTime` — 00:00 UTC of the day the reference voronoi baseline was frozen; required. Edits from that moment on are checked against `trustedOsmUsernames`.

**Per-cell input**: the map table's `last_editors` JSONB column (aggregated by processing step 9), one entry per `(osmUser, updatedAt)` pair touching the cell's points: `{ osmUser: string | null, spaceCount: number, updatedAt: number }`. `updatedAt` is the OSM object's last-edit time as **Unix epoch seconds**, always present (osm2pgsql runs with `--extra-attributes`); `osmUser` is `null` for an anonymized extract; a cell with no points has `[]`.

**The check** (`checkTrustedEditors` in `qaEvaluationRules.ts`):

1. Only entries edited **at or after** the freeze cutoff count (`updatedAt * 1000 >= referenceFrozenAt`); entries edited before the freeze are part of the frozen baseline and are ignored entirely (neither trusted nor untrusted).
2. An entry is trusted only if `osmUser` is non-null and, lowercased, is in `trustedOsmUsernames`. **`null` osmUser is never trusted** — production must run this against the internal (non-anonymized) extract, or the check can never pass.
3. The cell passes when **at least one considered entry is trusted** AND the summed `spaceCount` of the untrusted considered entries (`untrustedSpaceCount`) is **≤ `absoluteDifferenceThreshold`** — the same tolerance §3.1 already uses for "no real change".
4. An empty `trustedOsmUsernames` list, or an empty `last_editors`, naturally never passes (no entry can ever be trusted).

**Why the freeze date, not the previous evaluation's `createdAt`**: using the previous evaluation as the cutoff would make a `TRUSTED_EDITOR_CHANGE` row's own creation reset the cutoff to "now", so no edit could ever be after it again — the very next night the check would find nothing new and flip back to a plain bad review. The cutoff is always the reference's freeze date, so every night re-checks the same fixed window of edits.

**Relation to §3.1/§3.2**: `TRUSTED_EDITOR_CHANGE` is one more effective system status (see [§3.1](#31-system-overwrites-system-no-user-decision)). A change into or out of it creates a new `SYSTEM` row like any other status change, and it never resets a human decision (only GOOD does, per [§3.2](#32-system-overwrites-user-decision)). A `TRUSTED_EDITOR_CHANGE` row's `body` names the trusted editors and, if `untrustedSpaceCount > 0`, how many Stellplätze were last edited by others within the tolerance.

**Limitations**:

- **Deleted OSM objects**: a capacity drop caused by objects being deleted (not edited) leaves no recently-edited points behind to attribute to a trusted editor, so a genuine deletion never becomes `TRUSTED_EDITOR_CHANGE` — it always needs human review.
- **Anonymized extracts**: `osmUser` must come from the internal (non-anonymized) extract in production; a public/anonymized extract has `osmUser: null` everywhere and can never pass the check.
- **Merged on-street lines**: when several OSM ways are merged into one parking line, its whole capacity is attributed to the latest editor among the merged ways — so `last_editors` is an approximation, not an exact per-space attribution.
- **OSM renames**: extracts carry the account's current display name on all its edits, so when a trusted contributor renames their OSM account, the listed name no longer matches any of their edits until the config is updated.
- **First night after enabling**: turning this on (or widening the list) for a config that already has bad reviews can flip many cells at once — watch the `by trusted editors` count in the nightly log line (`post-processing-qa-update.ts`).

## Data Flow

Parking client freezes must include a QA package (quantized points) and a new production `data.*` voronoi baseline; see [Parking client freeze + QA](Parking-Client-Freeze-QA.md).

1. **Reference data**: Stored in a dated `data.*` baseline (currently `data.euvm_qa_voronoi_2026`) that is valid MultiPolygon and already clipped to Berlin. During processing it is copied to `public.qa_parkings_euvm` / `public.qa_parkings_euvm_priority` (recreatable with limitations; all public). Script: [`parking/9_qa_parkings_euvm_voronoi.sql`](../processing/topics/parking/9_qa_parkings_euvm_voronoi.sql). The script does **not** clip to Berlin (that happens in [`qa_create_new_voronoi_baseline.sql`](qa_create_new_voronoi_baseline.sql)). It keeps previous run data for comparison and joins TILDA data to reference; update rules use it ([§3.1](#31-system-overwrites-system-no-user-decision), [§3.2](#32-system-overwrites-user-decision)). Every environment gets the real baseline via `/admin/data-schema` → Import after publish — the empty placeholder that step 9 creates when the table is missing is only a CI/throwaway fallback, not a supported setup. Keep the undated base table `data.euvm_qa_voronoi` published so the generator SQL can be re-run outside production. Freeze checklist: [Parking client freeze + QA](Parking-Client-Freeze-QA.md).
2. **QA update API** (`/api/private/post-processing-qa-update`): Runs after processing; loads active configs, queries each config’s map table, computes system status from thresholds, applies [System status update rules](#3-system-status-update-rules), creates new evaluations when warranted.
3. **App**: Loads public vector tiles, enriches with private evaluation data (`setFeatureState`); map allows filtering and creating evaluations.

## Adding a New QA Config

### 1. Database Requirements

**Source Table Requirements**:

- Must have a unique `id` column that is **always a string type**
- Must contain comparison data (reference vs current values)
- Must have polygon/area geometry data for map display
- For the trusted-editor check ([§3.3](#33-trusted-osm-editors-automatic-ok)) to work, the table needs a `last_editors` JSONB column; processing step 9 (parking) aggregates it per cell.

### 2. Create QA Config

Use the admin UI to create a new config.
Set `mapTable` to your source table (e.g., `public.my_qa_table`).
Set the required `referenceFrozenAt` (the reference baseline's freeze date). Optionally add `trustedOsmUsernames` (OSM display names, one per trusted contributor) to enable the [§3.3 trusted-editor check](#33-trusted-osm-editors-automatic-ok); leave it empty to keep the check permanently failing (no cell can ever become `TRUSTED_EDITOR_CHANGE`).
