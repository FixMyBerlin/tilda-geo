# QA System Documentation

## Contents

- [Overview](#overview)
- [Key Components](#key-components)
  - [1. System vs User Status](#1-system-vs-user-status)
  - [2. User Decision Protection Rule](#2-user-decision-protection-rule)
  - [3. System Status Update Rules](#3-system-status-update-rules)
    - [3.1. System Overwrites System](#31-system-overwrites-system-no-user-decision)
    - [3.2. System Overwrites User Decision](#32-system-overwrites-user-decision)
- [Data Flow](#data-flow)
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

**User Status** (Manual):

- `OK_STRUCTURAL_CHANGE` - User confirmed OK, caused by construction/structural changes
- `OK_REFERENCE_ERROR` - User confirmed OK, caused by wrong reference data
- `NOT_OK_DATA_ERROR` - User confirmed problem, current data needs fixing
- `NOT_OK_PROCESSING_ERROR` - User confirmed problem, processing needs fixing
- `OK_QA_TOOLING_ERROR` - Diff OK, caused by methodical error in QA tooling (geometries/definitions) (Purple)

**Priority Rules**:

- User status **always overrides** system status when present
- System status is used as fallback when no user evaluation exists
- Areas with no evaluations show as gray (neutral)

### 2. User Decision Protection Rule

**Critical Rule**: When a user has marked an area as NOT_OK (either `NOT_OK_DATA_ERROR` or `NOT_OK_PROCESSING_ERROR`), the system should **NOT** overwrite this decision with new PROBLEMATIC or NEEDS_REVIEW evaluations. Only GOOD system evaluations are allowed to overwrite NOT_OK user decisions, as this indicates the problem has been resolved.

**Rationale**: If a user has identified a problem and marked it as NOT_OK, the system should not override this decision with new problematic evaluations. The user's assessment takes precedence until the system detects that the issue has been resolved (GOOD status).

### 3. System Status Update Rules

The system evaluates when to create a new evaluation based on two scenarios:

#### 3.1. System Overwrites System (No User Decision)

When there is **no user decision** (`userStatus === null`), the system uses an **effective system status** to decide whether to create a new evaluation. The **absolute difference is evaluated before** the percent-based status.

**Effective system status** (used for all update rules and for what is stored):

- If `|absoluteDifference| <= absoluteDifferenceThreshold` (from `QaConfig.absoluteDifferenceThreshold`): **effective status = GOOD**. The percent-based status is **not** used for update decisions or display; the area stays/becomes green.
- Otherwise: **effective status = status from %-thresholds** (GOOD / NEEDS_REVIEW / PROBLEMATIC from `goodThreshold` / `needsReviewThreshold`).

So: **if the absolute-diff check applies (within threshold), the percent-based status does not trigger** — the area is always treated as GOOD and no downgrade to NEEDS_REVIEW or PROBLEMATIC occurs.

**When \|absoluteDifference\| ≤ threshold** (effective status = GOOD; %-based status ignored):

| Previous System Status | Effective New Status | Action                                                         |
| ---------------------- | -------------------- | -------------------------------------------------------------- |
| **GOOD**               | GOOD                 | **No change** — keep existing evaluation                       |
| **NEEDS_REVIEW**       | GOOD                 | **Create new evaluation** — system overwrites itself with GOOD |
| **PROBLEMATIC**        | GOOD                 | **Create new evaluation** — system overwrites itself with GOOD |

**When \|absoluteDifference\| > threshold** (effective status = %-based: GOOD / NEEDS_REVIEW / PROBLEMATIC):

| Previous System Status | Effective New Status | Action                                                         |
| ---------------------- | -------------------- | -------------------------------------------------------------- |
| **GOOD**               | GOOD                 | **No change** — keep existing evaluation                       |
| **GOOD**               | NEEDS_REVIEW         | **Create new evaluation** — system overwrites itself          |
| **GOOD**               | PROBLEMATIC          | **Create new evaluation** — system overwrites itself          |
| **NEEDS_REVIEW**       | GOOD                 | **Create new evaluation** — system overwrites itself           |
| **NEEDS_REVIEW**       | NEEDS_REVIEW         | **No change** — keep existing evaluation                      |
| **NEEDS_REVIEW**       | PROBLEMATIC          | **Create new evaluation** — system overwrites itself          |
| **PROBLEMATIC**        | GOOD                 | **Create new evaluation** — system overwrites itself           |
| **PROBLEMATIC**        | NEEDS_REVIEW         | **Create new evaluation** — system overwrites itself          |
| **PROBLEMATIC**        | PROBLEMATIC          | **No change** — keep existing evaluation                      |

**Rules**:

- **Absolute diff first**: If `|absoluteDifference| <= absoluteDifferenceThreshold`, effective status is GOOD; %-based status is ignored for update and display.
- **Effective status changed** (e.g. GOOD → NEEDS_REVIEW): create a new evaluation (see “Create new evaluation” in the tables).
- **Effective status unchanged** (e.g. GOOD → GOOD): never create a new evaluation; keep the existing evaluation.

**Expected behavior (summary)**:

- If **absolute diff < threshold**: effective status is always GOOD; no downgrade to yellow/red. No new evaluation when already GOOD; otherwise create new evaluation with GOOD (system overwrites itself).
- If **absolute diff ≥ threshold**: %-based rules apply. New status overwrites previous system status (e.g. GOOD → NEEDS_REVIEW, or NEEDS_REVIEW → GOOD). System overwrites system; user classifications are not overwritten except when the system becomes GOOD (user NOT_OK can be reset to “resolved”). Absolute diff is always evaluated **before** the %-based status.

#### 3.2. System Overwrites User Decision

When there is **a user decision** (`userStatus !== null`), the system respects user decisions with specific rules:

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

**Rules**:

- **OK decisions (`OK_STRUCTURAL_CHANGE`, `OK_REFERENCE_ERROR`)**: Never reset - user decision is permanent regardless of system status
- **OK_QA_TOOLING_ERROR**: Reset when `newSystemStatus === 'GOOD'` (QA tooling error resolved), otherwise permanent
- **NOT*OK decisions (`NOT_OK*\*`)**: Only reset when `newSystemStatus === 'GOOD'` (problem resolved)
- **Reset user decision**: Creates new evaluation with `userStatus = null`, `body = null`, `userId = null`
- **Threshold behavior**: When a user decision exists, the absolute difference threshold (`QaConfig.absoluteDifferenceThreshold`) is either bypassed (for resets, which happen before threshold check) or not relevant (for permanent decisions, which prevent new evaluations regardless)

**Important Note**: All updates only occur when data has changed (`previousRelative !== currentRelative`). If the relative value hasn't changed, no new evaluation is created regardless of status changes.

## Data Flow

1. The static data that is used as a reference is stored in `data.euvm_qa_voronoi`
2. During processing, this data is copied and the actual reference dataset is created `public.qa_parkings_euvm`
   - This dataset can be recreated at any time (with some limitations, see "previous data")
   - All data here is public or OK to be publicly visible
   - We create manual files for each QA process (for now), for example [`parking/8_qa_parkings_euvm_voronoi.sql`](processing/topics/parking/8_qa_parkings_euvm_voronoi.sql)
   - This script preserves the previous data (from the previous run) which we use to make decisions, see "Status Override Table"
   - This script also joins our TILDA data and compares it to the reference data
3. The processing triggers an API route (`/api/private/post-processing-qa-update`) which evaluates the new data (see also "Status Override Table")
   - This is where the "System" evaluations are created
   - Gets all active QA configs from database
   - Queries each config's map table for areas with relative values
   - Calculates system status based on thresholds
   - Applies update rules to determine if new evaluations needed
   - Creates new evaluations when data has changed significantly
4. The app loads the public vector tiles and enriches them with data that only authorized users can see
   - We use `setFeatureState` for this
   - The map shows the private data, allows filtering and creating new evaluations, which update the map

## Adding a New QA Config

### 1. Database Requirements

**Source Table Requirements**:

- Must have a unique `id` column that is **always a string type**
- Must contain comparison data (reference vs current values)
- Must have polygon/area geometry data for map display

### 2. Create QA Config

Use the admin UI to create a new config.
Set `mapTable` to your source table (e.g., `public.my_qa_table`).
