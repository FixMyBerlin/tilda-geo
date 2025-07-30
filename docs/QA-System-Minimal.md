# Minimal QA System for Parking Data

## Overview

A streamlined quality assurance system that leverages existing infrastructure to provide parking data verification with minimal development effort and maximum impact.

## Key Principles

1. **Leverage existing infrastructure** - Use the already-generated voronoi comparison data from manual SQL processing
2. **Minimal new code** - Create separate QA-specific models following existing Note/Comment patterns
3. **Simple configuration** - Store QA configs as arrays in regions.const.ts
4. **Clear visual workflow** - Three-color system with fixed colors transitioning to two-color final state

## Current Infrastructure We're Building On

### Existing Voronoi Data Processing

The system already processes parking comparisons via manual SQL in `processing/topics/parking/8_voronoi.sql`:

**Input**:
- `data.euvm_qa_voronoi` - Reference voronoi polygons with expected parking counts
- `parkings_quantized` - Current processed parking data

**Processing**:
1. Drops and recreates `public.qa_parkings_euvm` table
2. Copies reference voronoi polygons from `data.euvm_qa_voronoi` to `public.qa_parkings_euvm`
3. **Copies current values to previous columns** before updating
4. Counts current parking points within each voronoi polygon using spatial join
5. Calculates absolute difference: `count_reference - count_current`
6. Calculates relative ratio: `count_current / count_reference` (NULL if reference=0)

**Output Table**: `public.qa_parkings_euvm` contains:
- `id` - Unique identifier from reference data
- `count_reference` (Integer) - Expected parking count from reference data
- `count_current` (Integer) - Actual count from current processed data
- `previous_count_current` (Integer) - Previous count from last processing run
- `difference` (Integer) - Absolute difference (reference - current)
- `relative` (Numeric) - Relative ratio (current/reference, NULL if reference=0)
- `previous_relative` (Numeric) - Previous relative ratio from last processing run
- `geom` (Geometry) - Voronoi polygon from reference data

## Database Schema Changes

### 1. New QA models

```prisma
// Add to existing Region model
model Region {
  // ... existing fields
  qaConfigs  QaConfig[]
}

// Simple QA config model - mostly for UI organization
model QaConfig {
  id          Int      @id @default(autoincrement())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  slug        String   // e.g., "euvm_parking_capacity"
  label       String   // e.g., "eUVM Parkplätze Kapazität"
  isActive    Boolean  @default(true)

  // Reference to existing data table (with schema prefix)
  mapTable    String   // e.g., "public.qa_parkings_euvm"

  // Thresholds for automatic system evaluation
  goodThreshold      Float   @default(0.2)  // relative <= 0.2 difference = GOOD
  needsReviewThreshold Float   @default(0.5)  // relative <= 0.5 difference = NEEDS_REVIEW
  problematicThreshold Float   @default(1.0)  // relative > 0.5 difference = PROBLEMATIC

  region      Region   @relation(fields: [regionId], references: [id])
  regionId    Int

  qaEvaluations QaEvaluation[]

  @@unique([regionId, slug])
}

// Human evaluations of QA items - this is where the value is added
model QaEvaluation {
  id           Int      @id @default(autoincrement())
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Reference to row in existing data table (could be voronoi, h3, etc.)
  areaId       String   // Links to public.qa_parkings_euvm.id

  // System automatic evaluation (based on thresholds)
  systemStatus QaSystemStatus @default(NEEDS_REVIEW)

  // Manual user evaluation status
  userStatus  QaEvaluationStatus?  // NULL means no user decision yet

  // Optional evaluation text/reasoning (only for human evaluations)
  body         String?

  config       QaConfig @relation(fields: [configId], references: [id])
  configId     Int

  // Evaluator tracking - either system or user
  evaluatorType   QaEvaluatorType @default(SYSTEM)
  author       User?    @relation(fields: [userId], references: [id])
  userId       Int?

  // Remove unique constraint to allow evaluation history
  // @@unique([configId, areaId])  // REMOVED
}

enum QaSystemStatus {
  GOOD           // Green - no review needed
  NEEDS_REVIEW   // Yellow - medium difference
  PROBLEMATIC    // Red - large difference
}

enum QaEvaluationStatus {
  OK_STRUCTURAL_CHANGE    // "Diff OK, caused by structural change in the area like construction"
  OK_REFERENCE_ERROR      // "Diff OK, caused by wrong past/reference data"
  NOT_OK_DATA_ERROR       // "Diff not OK, current data needs to be fixed"
  NOT_OK_PROCESSING_ERROR // "Diff not OK, processing needs to be fixed"
}

enum QaEvaluatorType {
  SYSTEM
  USER
}

// Extend existing User model
model User {
  // ... existing fields
  qaEvaluations QaEvaluation[]
}
```

### 2. Leverage existing data tables

We use the existing `public.qa_parkings_euvm` table that already has all comparison data needed.

### 3. Evaluation History & Update Rules

The system preserves evaluation history by creating new records for each change. The latest evaluation for an area is determined by the most recent `createdAt` timestamp.

#### Case Analysis Table

| Previous System Status | Previous User Status | New System Status | Action |
|---|---|---|---|
| **GOOD**         | None     | GOOD         | No change needed |
| **GOOD**         | None     | NEEDS_REVIEW | Create new evaluation, no user decision |
| **GOOD**         | None     | PROBLEMATIC  | Create new evaluation, no user decision |
| **NEEDS_REVIEW** | None     | GOOD         | Create new evaluation, no user decision |
| **NEEDS_REVIEW** | None     | NEEDS_REVIEW | No change needed |
| **NEEDS_REVIEW** | None     | PROBLEMATIC  | Create new evaluation, no user decision |
| **PROBLEMATIC**  | None     | GOOD         | Create new evaluation, no user decision |
| **PROBLEMATIC**  | None     | NEEDS_REVIEW | Create new evaluation, no user decision |
| **PROBLEMATIC**  | None     | PROBLEMATIC  | No change needed |
| **GOOD**         | OK_*     | GOOD         | No change needed |
| **GOOD**         | OK_*     | NEEDS_REVIEW | Reset user decision (system got worse) |
| **GOOD**         | OK_*     | PROBLEMATIC  | Reset user decision (system got worse) |
| **NEEDS_REVIEW** | OK_*     | GOOD         | No change needed (system improved) |
| **NEEDS_REVIEW** | OK_*     | NEEDS_REVIEW | No change needed |
| **NEEDS_REVIEW** | OK_*     | PROBLEMATIC  | Reset user decision (system got worse) |
| **PROBLEMATIC**  | OK_*     | GOOD         | No change needed (system improved) |
| **PROBLEMATIC**  | OK_*     | NEEDS_REVIEW | No change needed (system improved) |
| **PROBLEMATIC**  | OK_*     | PROBLEMATIC  | No change needed |
| **GOOD**         | NOT_OK_* | GOOD         | Reset user decision (system improved) |
| **GOOD**         | NOT_OK_* | NEEDS_REVIEW | No change needed |
| **GOOD**         | NOT_OK_* | PROBLEMATIC  | No change needed |
| **NEEDS_REVIEW** | NOT_OK_* | GOOD         | Reset user decision (system improved) |
| **NEEDS_REVIEW** | NOT_OK_* | NEEDS_REVIEW | No change needed |
| **NEEDS_REVIEW** | NOT_OK_* | PROBLEMATIC  | No change needed |
| **PROBLEMATIC**  | NOT_OK_* | GOOD         | Reset user decision (system improved) |
| **PROBLEMATIC**  | NOT_OK_* | NEEDS_REVIEW | Reset user decision (system improved) |
| **PROBLEMATIC**  | NOT_OK_* | PROBLEMATIC  | No change needed |

**Legend:**
- **OK_*** = `OK_STRUCTURAL_CHANGE`, `OK_REFERENCE_ERROR`
- **NOT_OK_*** = `NOT_OK_DATA_ERROR`, `NOT_OK_PROCESSING_ERROR`
- **No change needed** = Keep existing evaluation as is
- **Reset user decision** = Create new evaluation with userStatus, body, userId set to null

## Visual System & Colors

### Color Mapping Constants
```typescript
// Constants for QA system status colors
export const QA_SYSTEM_STATUS_COLORS = {
  GOOD: '#009E73',           // Green - no review needed
  NEEDS_REVIEW: '#E69F00',   // Yellow - requires human evaluation
  PROBLEMATIC: '#D55E00'     // Red - action needed
} as const

// Constants for user evaluation status colors
export const QA_USER_STATUS_COLORS = {
  OK_STRUCTURAL_CHANGE: '#0066CC',    // Blue - user confirmed OK
  OK_REFERENCE_ERROR: '#0066CC',      // Blue - user confirmed OK
  NOT_OK_DATA_ERROR: '#D55E00',       // Red - user confirmed problem
  NOT_OK_PROCESSING_ERROR: '#D55E00'  // Red - user confirmed problem
} as const
```

### Visual Workflow

1. **Initial State** (automatic evaluation based on `relative` field):
   - Green (`#009E73`): Small difference, likely OK
   - Yellow (`#E69F00`): Medium difference, needs review
   - Red (`#D55E00`): Large difference, likely problem

2. **After Human Evaluation**:
   - **`DIFF_OK_*`** → Blue (`#0066CC`)
   - **`DIFF_NOT_OK_*`** → Red (`#D55E00`) (stays red)
   - **"UNDECIDED" (`NULL`)** → Keep original automatic color

3. **Final Map State**: Only Green and Blue areas (with Red for confirmed problems)

### Map Filters
- "Show all areas" (Default)
- "Show only evaluated areas"
- "Show only evaluated areas with DIFF_OK_STRUCTURAL_CHANGE*"
- "Show only evaluated areas with DIFF_OK_REFERENCE_ERROR"
- "Show only evaluated areas with DIFF_NOT_OK_DATA_ERROR"
- "Show only evaluated areas with NOT_OK_PROCESSING_ERROR"
- "Show only evaluated areas with UNDECIDED" (NULL) (pending review)

## Backend Implementation

### Blitz RPC Functions Needed

Following the existing notes system pattern in `src/server/`:

1. **Queries**:
   - `getQaEvaluationsForRegion` - Get voronoi data with colors and evaluations
   - `getQaEvaluation` - Get single area evaluation

2. **Mutations**:
   - `createOrUpdateQaEvaluation` - Create/update human evaluation
   - `deleteQaEvaluation` - Remove evaluation (back to UNDECIDED)

### Core Query Logic

```typescript
// src/server/qa/queries/getQaEvaluationsForRegion.ts
// Read from public.qa_parkings_euvm
// Join with QaEvaluation to get human status
// Apply color logic based on relative + thresholds
// Return GeoJSON with color and status properties
```

## Frontend Implementation

### Map Integration
- **QA Layer**: Read from voronoi table, color by automatic evaluation + human overrides
- **QA Selector**: Dropdown in left navigation to choose QA category
- **Inspector Panel**: Show difference values, evaluation status, evaluation form
- **Filter Controls**: Toggle different evaluation states

### URL Structure
```
/regionen/berlin?qa=parking_capacity
```

## Data Flow

1. **Existing Processing** (`processing/topics/parking/8_voronoi.sql`):
   ```sql
   public.qa_parkings_euvm
   ├── count_reference (eUVM data)
   ├── count_current (our data)
   ├── difference (calculated)
   ├── relative (factor)
   └── geom (for map)
   ```

2. **QA Layer** (new):
   ```sql
   QaEvaluation
   ├── areaId → links to public.qa_parkings_euvm.id
   ├── status → human decision (UNDECIDED/DIFF_OK_*/DIFF_NOT_OK_*)
   ├── body → optional evaluation text/reasoning
   └── userId → who evaluated (with timestamps)
   ```

3. **Map Display**:
   - Read from `public.qa_parkings_euvm`
   - Apply automatic color based on `relative` + thresholds
   - Override color if `QaEvaluation.status` exists and not UNDECIDED
   - Show evaluation status, body, and author in popup

## Processing Integration

### Enhanced Voronoi Processing

Modify `processing/topics/parking/8_voronoi.sql` to track previous vs current values:

```sql
-- Add previous value columns (run once)
ALTER TABLE qa_parkings_euvm
ADD COLUMN previous_count_current INTEGER,
ADD COLUMN previous_relative NUMERIC;

-- Copy current values to previous before updating (run each time)
UPDATE qa_parkings_euvm
SET
  previous_count_current = count_current,
  previous_relative = relative;

-- Then proceed with normal calculation...
-- (existing logic remains the same)
```

This allows the API route to compare `previous_relative` vs `current_relative` to determine if data has changed significantly and whether to update QA evaluations.

### API Route for QA Updates

Create `app/src/app/api/qa/update-after-processing/route.ts`:

```typescript
export async function POST(request: Request) {
  // Get all active QA configs from database
  const qaConfigs = await db.qaConfig.findMany({
    where: { isActive: true },
    include: { region: true }
  })

  for (const config of qaConfigs) {
    // Get areas from the map table
    const areas = await getAreasFromMapTable(config.mapTable)

    for (const area of areas) {
      const systemStatus = calculateSystemStatus(area.relative, config)

      await upsertQaEvaluationWithRules(config.id, area.id, {
        systemStatus,
        previousRelative: area.previous_relative,
        currentRelative: area.relative
      })
    }
  }

  return Response.json({ success: true })
}

// Helper function to calculate system status based on relative value and thresholds
function calculateSystemStatus(relative: number | null, config: QaConfig): QaSystemStatus {
  if (relative === null) {
    return 'NEEDS_REVIEW' // Handle NULL relative values
  }

  const difference = Math.abs(relative - 1.0)

  if (difference <= config.goodThreshold) {
    return 'GOOD'
  } else if (difference <= config.needsReviewThreshold) {
    return 'NEEDS_REVIEW'
  } else {
    return 'PROBLEMATIC'
  }
}
```

### Update Rules Logic

```typescript
async function upsertQaEvaluationWithRules(
  configId: number,
  areaId: string,
  evaluation: {
    systemStatus: QaSystemStatus
    previousRelative: number | null
    currentRelative: number | null
  }
) {
  const previousEvaluation = await getCurrentEvaluation(configId, areaId)

  // Check if data changed significantly
  const dataChanged = hasSignificantChange(
    evaluation.previousRelative,
    evaluation.currentRelative
  )

  if (!dataChanged) {
    // No significant change - no new evaluation needed
    return previousEvaluation
  }

    // Check if we need to create a new evaluation or keep existing
  if (shouldCreateNewEvaluation(previousEvaluation, evaluation.systemStatus)) {
    return db.qaEvaluation.create({
      data: {
        configId,
        areaId,
        systemStatus: evaluation.systemStatus,
        evaluatorType: 'SYSTEM',
        // Reset user decision (set to null)
        userStatus: null,
        body: null,
        userId: null,
      }
    })
  } else {
    // No change needed - keep existing evaluation
    return previousEvaluation
  }
}

// Helper function to get current evaluation for an area
function getCurrentEvaluation(configId: number, areaId: string) {
  return db.qaEvaluation.findFirst({
    where: { configId, areaId },
    orderBy: { createdAt: 'desc' }
  })
}

// Helper function to determine if we need to create a new evaluation
function shouldCreateNewEvaluation(
  previousEvaluation: QaEvaluation | null,
  newSystemStatus: QaSystemStatus
): boolean {
  if (!previousEvaluation) return true

  const previousSystemStatus = previousEvaluation.systemStatus
  const hasUserDecision = previousEvaluation.userStatus !== null

  // If no user decision, create new evaluation if system status changed
  if (!hasUserDecision) {
    return previousSystemStatus !== newSystemStatus
  }

  // If user decision exists, only create new evaluation if we need to reset it
  return shouldResetUserDecision(previousSystemStatus, newSystemStatus, true)
}

// Helper function to determine if user decision should be reset
function shouldResetUserDecision(
  previousSystemStatus: QaSystemStatus,
  newSystemStatus: QaSystemStatus,
  hasUserDecision: boolean
): boolean {
  if (!hasUserDecision) return false

  // Reset if system got worse
  if (isSystemWorse(previousSystemStatus, newSystemStatus)) return true

  // Reset if system improved significantly (user should re-evaluate)
  if (isSystemBetter(previousSystemStatus, newSystemStatus)) return true

  return false
}

function isSystemWorse(previous: QaSystemStatus, current: QaSystemStatus): boolean {
  const severity = { 'GOOD': 1, 'NEEDS_REVIEW': 2, 'PROBLEMATIC': 3 }
  return severity[current] > severity[previous]
}

function isSystemBetter(previous: QaSystemStatus, current: QaSystemStatus): boolean {
  const severity = { 'GOOD': 1, 'NEEDS_REVIEW': 2, 'PROBLEMATIC': 3 }
  return severity[current] < severity[previous]
}


```

### Processing Workflow Integration

Update `processing/index.ts` to trigger QA updates:

```typescript
// In processing/index.ts after processTopics
await processTopics(fileName, fileChanged)

// Trigger QA evaluation updates for all regions
await triggerQaUpdates()

// ... rest of existing workflow
```

## Inspector Display Logic

The inspector needs to show the complete evaluation history to users:

```typescript
// In Inspector component
function QaEvaluationDisplay({ evaluation, areaData }) {
  const systemEvaluation = {
    status: evaluation.systemStatus,
    color: QA_SYSTEM_STATUS_COLORS[evaluation.systemStatus],
    description: getSystemStatusDescription(evaluation.systemStatus)
  }

  const userEvaluation = evaluation.userStatus ? {
    status: evaluation.userStatus,
    author: evaluation.author,
    body: evaluation.body,
    color: QA_USER_STATUS_COLORS[evaluation.userStatus]
  } : null

  return (
    <div>
      <h3>QA Evaluation</h3>

      {/* System Evaluation */}
      <div className="system-eval">
        <span style={{ color: systemEvaluation.color }}>●</span>
        <strong>System:</strong> {systemEvaluation.description}
        <small>
          Based on {areaData.relative}× difference
          ({areaData.count_current} vs {areaData.count_reference})
        </small>
      </div>

      {/* User Evaluation */}
      {userEvaluation ? (
        <div className="user-eval">
          <span style={{ color: userEvaluation.color }}>●</span>
          <strong>User:</strong> {getUserStatusDescription(userEvaluation.status)}
          <small>by {userEvaluation.author.osmName}</small>
          {userEvaluation.body && <p>{userEvaluation.body}</p>}
        </div>
      ) : (
        <div className="no-user-eval">
          <em>No user evaluation yet</em>
          <button onClick={() => openEvaluationForm()}>
            Evaluate this area
          </button>
        </div>
      )}

      {/* Final Display Color */}
      <div className="final-color">
        <strong>Map Color:</strong>
        <span style={{ color: getFinalDisplayColor(evaluation) }}>●</span>
        {getFinalColorExplanation(evaluation)}
      </div>
    </div>
  )
}
```

## Vector Tiles & Map Styling

The vector tiles will be generated dynamically with TypeScript-based styling that applies colors based on the thresholds from the config:

```typescript
// In vector tile generation
function generateQaLayerStyle(qaConfig: QaConfig) {
  return {
    'fill-color': [
      'case',
      // If user evaluation exists and is OK, use blue
      ['has', 'user_status_ok'], QA_USER_STATUS_COLORS.OK_STRUCTURAL_CHANGE,
      // Otherwise use system color based on relative value
      ['case',
        ['<=', ['abs', ['-', ['get', 'relative'], 1]], qaConfig.goodThreshold], QA_SYSTEM_STATUS_COLORS.GOOD,
        ['<=', ['abs', ['-', ['get', 'relative'], 1]], qaConfig.needsReviewThreshold], QA_SYSTEM_STATUS_COLORS.NEEDS_REVIEW,
        QA_SYSTEM_STATUS_COLORS.PROBLEMATIC
      ]
    ],
    'fill-opacity': 0.7
  }
}
```
