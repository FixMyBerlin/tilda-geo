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

### 3. System Status Update Rules

The system evaluates when to create a new evaluation based on two scenarios:

#### 3.1. System Overwrites System (No User Decision)

When there is **no user decision** (`userStatus === null`), the system will create a new evaluation whenever the system status changes. This allows the system to keep its evaluation up-to-date as data changes.

| Previous System Status | New System Status | Action |
|---|---|---|
| **GOOD**               | GOOD         | **No change** - Keep existing evaluation |
| **GOOD**               | NEEDS_REVIEW | **Create new evaluation** - System overwrites itself |
| **GOOD**               | PROBLEMATIC  | **Create new evaluation** - System overwrites itself |
| **NEEDS_REVIEW**       | GOOD         | **Create new evaluation** - System overwrites itself |
| **NEEDS_REVIEW**       | NEEDS_REVIEW | **No change** - Keep existing evaluation |
| **NEEDS_REVIEW**       | PROBLEMATIC  | **Create new evaluation** - System overwrites itself |
| **PROBLEMATIC**        | GOOD         | **Create new evaluation** - System overwrites itself |
| **PROBLEMATIC**        | NEEDS_REVIEW | **Create new evaluation** - System overwrites itself |
| **PROBLEMATIC**        | PROBLEMATIC  | **No change** - Keep existing evaluation |

**Rule**: New evaluation is created when `previousSystemStatus !== newSystemStatus` AND `previousRelative !== currentRelative` (data has changed).

#### 3.2. System Overwrites User Decision

When there is **a user decision** (`userStatus !== null`), the system respects user decisions with specific rules:

| Previous User Status | New System Status | Action |
|---|---|---|
| **OK_STRUCTURAL_CHANGE** | GOOD         | **No change** - User decision is permanent |
| **OK_STRUCTURAL_CHANGE** | NEEDS_REVIEW | **No change** - User decision is permanent |
| **OK_STRUCTURAL_CHANGE** | PROBLEMATIC  | **No change** - User decision is permanent |
| **OK_REFERENCE_ERROR**  | GOOD         | **No change** - User decision is permanent |
| **OK_REFERENCE_ERROR**  | NEEDS_REVIEW | **No change** - User decision is permanent |
| **OK_REFERENCE_ERROR**  | PROBLEMATIC  | **No change** - User decision is permanent |
| **NOT_OK_DATA_ERROR**    | GOOD         | **Reset user decision** - System detects problem resolved |
| **NOT_OK_DATA_ERROR**    | NEEDS_REVIEW | **No change** - Protect user's NOT_OK decision |
| **NOT_OK_DATA_ERROR**    | PROBLEMATIC  | **No change** - Protect user's NOT_OK decision |
| **NOT_OK_PROCESSING_ERROR** | GOOD         | **Reset user decision** - System detects problem resolved |
| **NOT_OK_PROCESSING_ERROR** | NEEDS_REVIEW | **No change** - Protect user's NOT_OK decision |
| **NOT_OK_PROCESSING_ERROR** | PROBLEMATIC  | **No change** - Protect user's NOT_OK decision |

**Rules**:
- **OK decisions (`OK_*`)**: Never reset - user decision is permanent regardless of system status
- **NOT_OK decisions (`NOT_OK_*`)**: Only reset when `newSystemStatus === 'GOOD'` (problem resolved)
- **Reset user decision**: Creates new evaluation with `userStatus = null`, `body = null`, `userId = null`

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
