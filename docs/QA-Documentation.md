# QA System Documentation

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

**Priority Rules**:
- User status **always overrides** system status when present
- System status is used as fallback when no user evaluation exists
- Areas with no evaluations show as gray (neutral)

### 2. User Decision Protection Rule

**Critical Rule**: When a user has marked an area as NOT_OK (either `NOT_OK_DATA_ERROR` or `NOT_OK_PROCESSING_ERROR`), the system should **NOT** overwrite this decision with new PROBLEMATIC or NEEDS_REVIEW evaluations. Only GOOD system evaluations are allowed to overwrite NOT_OK user decisions, as this indicates the problem has been resolved.

**Rationale**: If a user has identified a problem and marked it as NOT_OK, the system should not override this decision with new problematic evaluations. The user's assessment takes precedence until the system detects that the issue has been resolved (GOOD status).

### 3. Status Override Table

| Previous System Status | Previous User Status | New System Status | Action |
|---|---|---|---|
| **GOOD**               | None     | GOOD         | No change needed                        |
| **GOOD**               | None     | NEEDS_REVIEW | Create new evaluation, no user decision |
| **GOOD**               | None     | PROBLEMATIC  | Create new evaluation, no user decision |
| **NEEDS_REVIEW**       | None     | GOOD         | Create new evaluation, no user decision |
| **NEEDS_REVIEW**       | None     | NEEDS_REVIEW | No change needed                        |
| **NEEDS_REVIEW**       | None     | PROBLEMATIC  | Create new evaluation, no user decision |
| **PROBLEMATIC**        | None     | GOOD         | Create new evaluation, no user decision |
| **PROBLEMATIC**        | None     | NEEDS_REVIEW | Create new evaluation, no user decision |
| **PROBLEMATIC**        | None     | PROBLEMATIC  | No change needed                        |
| **GOOD**               | OK_*     | GOOD         | No change needed                        |
| **GOOD**               | OK_*     | NEEDS_REVIEW | Reset user decision (system got worse)  |
| **GOOD**               | OK_*     | PROBLEMATIC  | Reset user decision (system got worse)  |
| **NEEDS_REVIEW**       | OK_*     | GOOD         | No change needed (system improved)      |
| **NEEDS_REVIEW**       | OK_*     | NEEDS_REVIEW | No change needed                        |
| **NEEDS_REVIEW**       | OK_*     | PROBLEMATIC  | Reset user decision (system got worse)  |
| **PROBLEMATIC**        | OK_*     | GOOD         | No change needed (system improved)      |
| **PROBLEMATIC**        | OK_*     | NEEDS_REVIEW | No change needed (system improved)      |
| **PROBLEMATIC**        | OK_*     | PROBLEMATIC  | No change needed                        |
| **GOOD**               | NOT_OK_* | GOOD         | Reset user decision (system improved)   |
| **GOOD**               | NOT_OK_* | NEEDS_REVIEW | **NO CHANGE** (protect user decision)  |
| **GOOD**               | NOT_OK_* | PROBLEMATIC  | **NO CHANGE** (protect user decision)  |
| **NEEDS_REVIEW**       | NOT_OK_* | GOOD         | Reset user decision (system improved)   |
| **NEEDS_REVIEW**       | NOT_OK_* | NEEDS_REVIEW | **NO CHANGE** (protect user decision)  |
| **NEEDS_REVIEW**       | NOT_OK_* | PROBLEMATIC  | **NO CHANGE** (protect user decision)  |
| **PROBLEMATIC**        | NOT_OK_* | GOOD         | Reset user decision (system improved)   |
| **PROBLEMATIC**        | NOT_OK_* | NEEDS_REVIEW | **NO CHANGE** (protect user decision)  |
| **PROBLEMATIC**        | NOT_OK_* | PROBLEMATIC  | **NO CHANGE** (protect user decision)  |

**Legend:**
- **OK_*** = `OK_STRUCTURAL_CHANGE`, `OK_REFERENCE_ERROR`
- **NOT_OK_*** = `NOT_OK_DATA_ERROR`, `NOT_OK_PROCESSING_ERROR`
- **Reset user decision** = Create new evaluation with userStatus, body, userId set to null
- **NO CHANGE** = Keep existing evaluation unchanged (user decision protection)

## Data Flow

1. The static data that is used as a reference is stored in `data.euvm_qa_voronoi`
2. During processing, this data is copied and the actual reference dataset is created `public.qa_parkings_euvm`
    - This dataset can be recreated at any time (with some limitations, see "previous data")
    - All data here is public or OK to be publicly visible
    - We create manual files for each QA process (for now), for example [`parking/8_voronoi.sql`](processing/topics/parking/8_voronoi.sql)
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
