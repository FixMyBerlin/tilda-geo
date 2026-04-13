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

When a user has marked an area as NOT_OK (`NOT_OK_DATA_ERROR` or `NOT_OK_PROCESSING_ERROR`), the system must **not** overwrite that with new PROBLEMATIC or NEEDS_REVIEW evaluations. Only a GOOD system evaluation may overwrite a NOT_OK user decision (problem resolved). Full matrix: [§3.2 System Overwrites User Decision](#32-system-overwrites-user-decision).

### 3. System Status Update Rules

When to create a new evaluation depends on whether there is a user decision: [§3.1](#31-system-overwrites-system-no-user-decision) (no user decision) or [§3.2](#32-system-overwrites-user-decision) (user decision present).

#### 3.1. System Overwrites System (No User Decision)

When there is **no user decision** (`userStatus === null`), the system uses an **effective system status** to decide. Absolute difference is evaluated **before** percent-based status:

- **\|absoluteDifference\| ≤ threshold** (`QaConfig.absoluteDifferenceThreshold`): effective status = **GOOD**; %-based status is ignored (area stays/becomes green).
- **\|absoluteDifference\| > threshold**: effective status = %-based (GOOD / NEEDS_REVIEW / PROBLEMATIC from `goodThreshold` / `needsReviewThreshold`).

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

Effective status **unchanged** (e.g. GOOD → GOOD) → never create a new evaluation. Effective status **changed** → create a new evaluation where the tables say “Create new evaluation”. User classifications are not overwritten here; see [§3.2](#32-system-overwrites-user-decision) for when the system may reset a user decision (only when it becomes GOOD).

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

**Summary**:

- **OK decisions** (`OK_STRUCTURAL_CHANGE`, `OK_REFERENCE_ERROR`): never reset.
- **OK_QA_TOOLING_ERROR** and **NOT_OK** (`NOT_OK_DATA_ERROR`, `NOT_OK_PROCESSING_ERROR`): reset only when system status becomes GOOD.
- **Reset**: new evaluation with `userStatus = null`, `body = null`, `userId = null`.
- **Effective system status** (and thus "GOOD") follows [§3.1](#31-system-overwrites-system-no-user-decision) (absolute diff before %).

All updates require data to have changed (`previousRelative !== currentRelative`); otherwise no new evaluation is created.

## Data Flow

1. **Reference data**: Stored in `data.euvm_qa_voronoi`; during processing copied to `public.qa_parkings_euvm` (recreatable with limitations; all public). Example script: [`parking/8_qa_parkings_euvm_voronoi.sql`](processing/topics/parking/8_qa_parkings_euvm_voronoi.sql). The script keeps previous run data for comparison and joins TILDA data to reference; update rules use it ([§3.1](#31-system-overwrites-system-no-user-decision), [§3.2](#32-system-overwrites-user-decision)).
2. **QA update API** (`/api/private/post-processing-qa-update`): Runs after processing; loads active configs, queries each config’s map table, computes system status from thresholds, applies [System status update rules](#3-system-status-update-rules), creates new evaluations when warranted.
3. **App**: Loads public vector tiles, enriches with private evaluation data (`setFeatureState`); map allows filtering and creating evaluations.

## Adding a New QA Config

### 1. Database Requirements

**Source Table Requirements**:

- Must have a unique `id` column that is **always a string type**
- Must contain comparison data (reference vs current values)
- Must have polygon/area geometry data for map display

### 2. Create QA Config

Use the admin UI to create a new config.
Set `mapTable` to your source table (e.g., `public.my_qa_table`).
