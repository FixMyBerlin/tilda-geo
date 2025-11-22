# Mapillary Campaign Data Flow

This document describes the complete process of how Mapillary coverage data flows from external sources into MapRoulette campaigns.

## Overview

The system uses Mapillary coverage data to create specialized campaigns that only include ways with available street-level imagery. This enables more efficient editing workflows where contributors can verify infrastructure using visual evidence.

## Process Flow

### 1. Download Mapillary Coverage Data

**Location:** `processing/pseudoTags/downloadPseudoTagsData.ts`

- **Source:** External GitHub repository `vizsim/mapillary_coverage`
- **URL:** Defined in `processing/pseudoTags/mapillaryCoverageSource/source.const.ts`
  - Current: `https://raw.githubusercontent.com/vizsim/mapillary_coverage/refs/heads/main/output/germany_osm-highways_mp-coverage_latest.csv`
- **Format:** CSV with columns:
  - `osm_id` (Number): OSM way ID
  - `mapillary_coverage` (Enum: `'regular' | 'pano'`): Coverage type
- **Processing Date:** Stored in `app/src/data/mapillaryCoverage.const.ts` and displayed in campaign task templates
- **Download Logic:**
  - Runs during initialization (`processing/steps/initialize.ts`)
  - Only downloads if source or data directory has changed (hash-based caching)
  - Saves to: `/data/pseudoTagsData/mapillaryCoverageData/mapillary_coverage.csv`

**External Processing:**
- The source repository (`vizsim/mapillary_coverage`) processes Mapillary tiles for sequences in Germany
- Matches them to OSM roads data using a fixed buffer
- Includes ways where ≥60% has Mapillary coverage

### 2. Load CSV in LUA Processing

**Location:** `processing/topics/roads_bikelanes/roads_bikelanes.lua`

**Initialization:**
```lua
local mapillary_coverage_data = load_csv_mapillary_coverage()
```

**CSV Loading Chain:**
1. `load_csv_mapillary_coverage()` → `processing/topics/helper/pseudo_tags/load_csv_mapillary_coverage.lua`
2. Uses generic `load_csv()` → `processing/topics/helper/pseudo_tags/load_csv.lua`
3. Parses CSV using `ftcsv` library
4. Transforms into hash map: `{ [osm_id] => { mapillary_coverage = "regular|pano" } }`
5. Caches in memory for the entire processing run

**Lookup During Processing:**
```lua
local mapillary_coverage_lines = mapillary_coverage_data:get()
local mapillary_coverage_value = mapillary_coverage(mapillary_coverage_lines, object.id)
```

- Returns: `'pano' | 'regular' | nil`
- `nil` means no Mapillary coverage found for that OSM way

### 3. Store Mapillary Data in Database Tables

**Location:** `processing/topics/roads_bikelanes/roads_bikelanes.lua`

The `mapillary_coverage_value` is stored in multiple places:

#### A. `bikelanes` and `roads` Tables
- Stored in `tags` column as `mapillary_coverage = 'regular' | 'pano'`
- Used for visualization and filtering in the map

#### B. `todos_lines` Table
- Stored in `meta` column as JSONB: `{ mapillary_coverage: 'regular' | 'pano' }`
- This is the critical table for MapRoulette campaigns

**Table Structure:**
```sql
todos_lines (
  id TEXT,              -- e.g., "way/123/cycleway/right"
  table TEXT,           -- "bikelanes" or "roads"
  tags JSONB,           -- Campaign names as keys, priority as values: {"needs_clarification__mapillary": "1"}
                        -- Key = campaign/todo ID (e.g., "needs_clarification__mapillary")
                        -- Value = priority string ("1" = high, "2" = medium) used by MapRoulette to order tasks
  meta JSONB,           -- Contains: {mapillary_coverage: "regular", todos: "...", category: "..."}
  geom LINESTRING,
  length INTEGER,
  minzoom INTEGER
)
```

### 4. Create Todos with Mapillary Variants

**Location:**
- **Bikelane Todos:** `processing/topics/roads_bikelanes/bikelanes/BikelaneTodos.lua`
- **Road Todos:** `processing/topics/roads_bikelanes/roads/RoadTodos.lua`
- **Usage:** Both are imported and used in `processing/topics/roads_bikelanes/roads_bikelanes.lua`

**Where Campaigns are Defined:**
All campaign/todo definitions originate in these LUA files. Each todo object defines:
- `id`: The campaign identifier (e.g., `"needs_clarification__mapillary"`)
- `conditions`: Function that determines when this todo applies
- `priority`: Function that returns priority string (`"1"` or `"2"`)
- `todoTableOnly`: Boolean indicating if it's only for campaigns (not Inspector)

These LUA definitions are the source of truth for campaign IDs. The TypeScript campaign config files in `app/src/data/radinfra-de/campaigns/*.ts` must match these LUA todo IDs.

**Pattern:**
For each todo type, there are typically two variants:

1. **Standard todo** (e.g., `needs_clarification`):
   - Checks conditions without Mapillary requirement
   - Priority: `'1'` if `mapillary_coverage` exists, else `'2'`

2. **Mapillary-specific todo** (e.g., `needs_clarification__mapillary`):
   - Checks same conditions AND requires `objectTags.mapillary_coverage` to be truthy
   - Priority: Always `'1'` (high priority) - Mapillary campaigns always have high priority since visual evidence is available
   - `todoTableOnly: true` (hidden from Inspector, only in campaigns)

**Example:**
```lua
local needs_clarification__mapillary = BikelaneTodo.new({
  id = "needs_clarification__mapillary",
  desc = "Tagging insufficient to categorize the bike infrastructure.",
  todoTableOnly = true,
  priority = function(_, _) return "1" end,
  conditions = function(objectTags, resultTags)
    return objectTags.mapillary_coverage and needs_clarification(objectTags, resultTags)
  end
})
```

**Todo Storage:**

Todos are stored differently in different tables:

1. **In `bikelanes` and `roads` tables:**
   - Stored in `tags` JSONB column with key `"todos"`
   - Value is a semicolon-separated list of campaign IDs: `"needs_clarification;missing_surface"`
   - Created via `ToMarkdownList()` function (which generates markdown format internally, but stored/used as semicolon-separated)
   - Only includes todos where `todoTableOnly !== true` (visible in Inspector)
   - Used by the UI Inspector to display applicable campaigns when clicking on features
   - Example: `tags.todos = "needs_clarification;missing_surface"`

2. **In `todos_lines` table:**
   - Stored in `tags` JSONB column with campaign IDs as keys
   - Format: `{campaign_id: priority}`
   - Created via `ToTodoTags()` function: `{"needs_clarification__mapillary": "1"}`
   - **Key = Campaign/Todo ID:** The campaign name (e.g., `"needs_clarification__mapillary"`) that matches the campaign config file
   - **Value = Priority:** String priority (`"1"` = high, `"2"` = medium) used by MapRoulette to determine task ordering
   - Multiple campaigns can apply to the same feature: `{"needs_clarification__mapillary": "1", "missing_surface": "2"}`
   - This is the format used by the MapRoulette API to query and filter tasks

**Todo ID Type Generation:**
- **Location:** `processing/steps/generateTypes.ts`
- After LUA processing, extracts all todo IDs from LUA code
- Generates TypeScript types in `app/src/data/processingTypes/todoId.generated.const.ts`
- This ensures type safety between LUA todo IDs and TypeScript campaign configs - campaign configs must match LUA todo definitions
- Sorts todos so non-mapillary variants appear before `__mapillary` variants in UI dropdowns

### 4b. Cleanup Duplicate todos_lines Entries

**Location:** `processing/topics/roads_bikelanes/3_cleanup_todos_lines.sql`

**Problem:**
- LUA processing can create duplicate entries when encountering transformed geometries
- Duplicates have identical data except `id` may have `/left` or `/right` postfix
- This happens due to complexity of `cycleway` vs `cycleway:SIDE` processing

**Solution:**
- SQL script removes duplicates after LUA processing completes
- Uses `ROW_NUMBER()` window function to identify duplicates
- Partitions by: `osm_type`, `osm_id`, `table`, `tags`, `meta`, `geom`, `length`, `minzoom`
- Keeps first occurrence (ordered by `id`), deletes even-numbered duplicates
- This cleanup is necessary because duplicates can occur from transformed geometries during LUA processing

**When:** Runs as part of SQL post-processing step after LUA completes

### 5. Campaign Configuration Files

**Location:** `app/src/data/radinfra-de/campaigns/*.ts`

Each campaign has a TypeScript configuration file that defines:
- Campaign metadata (title, description, task instructions)
- MapRoulette challenge settings (enabled, checkinComment, etc.)
- Task template with Mustache-style placeholders (e.g., `%%MAPILLARY_URL_START%%`)

**Example:** `needs_clarification__mapillary.ts`
- `id`: Must match the todo ID from LUA (`needs_clarification__mapillary`)
- `maprouletteChallenge.enabled`: Whether to create/update in MapRoulette
- `taskTemplate`: Markdown template for task instructions

**Campaign Collection:**
- All campaigns imported in `app/src/data/radinfra-de/campaigns.ts`
- Validated against `CampaignSchema`
- Exported as `campaigns` array

### 6. API Route: Query Todos and Generate GeoJSON

**Location:** `app/src/app/api/maproulette/data/[projectKey]/route.ts`

**Endpoint:** `GET /api/maproulette/data/{projectKey}`

**Important: Identifier Naming Across the System:**
The `projectKey` parameter is the same identifier used throughout the system, but it has different names in different contexts:
- **In LUA:** Called `id` (e.g., `"needs_clarification__mapillary"`)
- **In `todos_lines.tags`:** Used as JSONB key (e.g., `{"needs_clarification__mapillary": "1"}`)
- **In campaign configs:** Called `id` (e.g., `id: 'needs_clarification__mapillary'`)
- **In API route:** Called `projectKey` (URL parameter)
- **In TypeScript types:** Called `TodoId` (in `todoId.generated.const.ts`)

This identifier is the main link between:
- LUA todo definitions → `todos_lines` table → Campaign configs → MapRoulette challenges

**Process:**

1. **Validate `projectKey`:**
   - Must be a valid todo ID from `todoId.generated.const.ts`
   - This is the same identifier stored as keys in `todos_lines.tags` JSONB
   - Maps to campaign ID in TypeScript configs (e.g., `needs_clarification__mapillary`)

2. **Query `todos_lines` table:**
   ```sql
   SELECT
     todos_lines.osm_type,
     todos_lines.osm_id,
     todos_lines.id,
     todos_lines.tags->>'needs_clarification__mapillary' as priority,
     -- ↑ Extracts the priority value ("1" or "2") for this campaign from the tags JSONB
     todos_lines.meta->'category' AS kind,
     ST_AsGeoJSON(ST_SimplifyPreserveTopology(ST_Transform(todos_lines.geom, 4326), 0.75), 6)::jsonb AS geometry
   FROM public.todos_lines
   WHERE todos_lines.tags ? 'needs_clarification__mapillary'
   -- ↑ JSONB "contains key" operator: checks if tags has this campaign name as a key
   ORDER BY todos_lines.length DESC
   LIMIT 40000;
   ```

   **How the query works:**
   - `tags ? 'campaign_id'` checks if the JSONB object contains the campaign name as a key
   - `tags->>'campaign_id'` extracts the priority value (e.g., `"1"` or `"2"`) for that campaign
   - This priority is used by MapRoulette to order tasks: higher priority tasks appear first
   - **Geometry Simplification:** Geometries are simplified using `ST_SimplifyPreserveTopology` with tolerance `0.75` to reduce file size
   - **Coordinate Precision:** GeoJSON coordinates are limited to 6 decimal places via `ST_AsGeoJSON(..., 6)`
   - **Task Limit:** MapRoulette allows 50k tasks per challenge, but we limit to 40k to account for completed tasks

3. **Build Task Instructions:**
   - Uses `buildTaskInstructions()` from `app/src/data/radinfra-de/utils/buildTaskInstructions.ts`
   - Finds campaign config by `projectKey`
   - Replaces Mustache placeholders:
     - `%%MAPILLARY_URL_START%%` → Mapillary URL at start of line
     - `%%MAPILLARY_URL_END%%` → Mapillary URL at end of line
     - `%%ATLAS_URL%%` → TILDA map URL
     - `%%OSM_URL%%` → OpenStreetMap URL
     - `%%CATEGORY%%` → Infrastructure category name

4. **Generate Newline-Delimited GeoJSON:**
   - Creates GeoJSON features with properties:
     - `priority`: Extracted from `todos_lines.tags->>projectKey` (the value stored for this campaign)
       - This priority string (`"1"` or `"2"`) tells MapRoulette how to order tasks
       - Higher priority (`"1"`) tasks appear before lower priority (`"2"`) tasks in MapRoulette
     - `osmIdentifier`: OSM type/id string (e.g., "way/123")
     - `data_updated_at`: OSM data processing date
     - `task_updated_at`: Current timestamp
     - `task_markdown`: Rendered task instructions
   - Uses Record Separator (`0x1E`) between features (MapRoulette format)
   - Compresses with gzip if client supports it
   - Limits to 40,000 tasks (MapRoulette allows 50k, but includes completed tasks)

### 7. MapRoulette Challenge Creation/Update

**Location:** `app/scripts/MaprouletteCreate/process.ts`

**Script:** `npm run maproulette:create` (with optional `--filter` param)

**Process:**

1. **Iterate Campaigns:**
   - Reads from `app/src/data/radinfra-de/campaigns.ts`
   - Skips if `maprouletteChallenge.enabled === false`
   - Can filter by campaign ID using `--filter` param

2. **Determine Action:**
   - **CREATE:** If `maprouletteChallenge.id` is missing
   - **UPDATE:** If `maprouletteChallenge.id` exists

3. **Build Challenge Data:**
   - Merges defaults from `default.const.ts` with campaign-specific data
   - Sets `remoteGeoJson` to: `https://tilda-geo.de/api/maproulette/data/{campaignId}`
   - Builds hashtags via `buildHashtags()`:
     - Always includes: `#radinfra_de`
     - Campaign-specific: `#{campaignId}` (e.g., `#needs_clarification__mapillary`)
     - Category-specific: `#traffic_signs` (if applicable)
     - MapRoulette flag: `#maproulette` (if enabled)
     - These hashtags are used in OSM changeset comments for tracking and attribution
   - Validates against `CreateMapRouletteChallengeSchema` or `UpdateMapRouletteChallengeSchema`

4. **API Calls:**
   - **CREATE:** `POST https://maproulette.org/api/v2/challenge`
   - **UPDATE:** `PUT https://maproulette.org/api/v2/challenge/{id}`
   - Uses `MAPROULETTE_API_KEY` from environment
   - All challenges belong to project `57664`

5. **Result:**
   - MapRoulette fetches tasks from `remoteGeoJson` URL
   - Challenges appear in MapRoulette UI
   - Contributors can work on tasks with Mapillary imagery links

### 8. Campaign Listing API (for External Astro Site)

**Location:** `app/src/app/api/campaigns/route.ts`

**Endpoint:** `GET /api/campaigns`

**Purpose:** Provides campaign metadata to external Astro.js site at `radinfra.de`

**Response:**
- Returns all campaigns from `app/src/data/radinfra-de/campaigns.ts`
- Adds computed fields:
  - `remoteGeoJson`: Full URL to MapRoulette data endpoint
  - `hashtags`: Array of hashtags for OSM changesets

**Usage:**
- External Astro site fetches this endpoint
- Generates static pages at `https://radinfra.de/kampagnen/{campaignId}/`
- Displays campaign information, progress, and links to MapRoulette

### 9. MapRoulette Challenge Rebuild

**Location:** `app/scripts/MaprouletteRebuild/process.ts`

**Script:** `npm run maproulette:rebuild` (with optional `--filter` param)

**Purpose:** Refreshes task lists when source data changes without recreating the challenge

**Process:**
1. Calls MapRoulette API: `POST /api/v2/challenge/{id}/rebuild`
2. Deletes all unfinished tasks
3. Rebuilds tasks from `remoteGeoJson` URL
4. Used when OSM data is reprocessed and todos_lines table is updated

**Automation:**
- Triggered by GitHub Actions workflow: `.github/workflows/generate-maproulette-tasks.production.yml`
- Runs periodically to keep MapRoulette tasks in sync with latest TILDA data

### 10. Map Visualization of Campaigns

**Location:** `app/src/app/regionen/[regionSlug]/_mapData/mapDataSubcategories/subcat_radinfra_campaigns.const.ts`

**How it Works:**
- `todos_lines` table is exposed as vector tile source: `atlas_todos_lines`
- Source layer: `todos_lines`
- Creates map subcategory "Kampagnen" with multiple style options:

1. **"Alle Kampagnen" (default):**
   - Shows all todos_lines with campaign styling
   - Pink lines (`#fda5e4`) for todos
   - Blue lines (`#050dff`) for Mapillary coverage

2. **Per-Campaign Styles:**
   - One style per todo ID (e.g., `needs_clarification__mapillary`)
   - Filters: `['has', todoId]` - only shows lines where `tags` contains that todo ID
   - Name from campaign config, or fallback to todo ID
   - Category grouping from campaign config

**Map Integration:**
- Users can select campaign from dropdown in map UI
- Only relevant todos_lines are displayed based on selected campaign
- Visual distinction between todos with/without Mapillary coverage
- `todos_lines` is exposed as vector tiles (`atlas_todos_lines`) and can be filtered by campaign in the map UI

### 11. UI Integration: Inspector Display

**Location:** `app/src/app/regionen/[regionSlug]/_components/SidebarInspector/InspectorFeatureSource/NoticeMaproulette.tsx`

**How it Works:**
When a user clicks on a feature in the map, the inspector shows campaign information:

1. **For `todos_lines` source (`atlas_todos_lines`):**
   - Extracts todo IDs from feature `properties` keys
   - Shows all todos that apply to this feature
   - Displays warning about careful editing
   - Defaults to open/expanded

2. **For `bikelanes` or `roads` sources:**
   - Extracts todos from `properties.todos` markdown field
   - Only shows non-`todoTableOnly` todos (visible in Inspector)
   - More limited display

**Display:**
- Shows "Aufgabe(n) zur Datenverbesserung" section
- Lists all applicable campaigns for the selected feature
- Each campaign shows task details via `NoticeMaprouletteTask` component
- Links to MapRoulette challenge pages
- Clicking on features in the map shows applicable campaigns in the sidebar inspector with links to MapRoulette

## Data Flow Summary

```mermaid
graph TB
    subgraph A["A: Data Processing Pipeline"]
        A1[External Source<br/>vizsim/mapillary_coverage] --> A2[CSV Download<br/>downloadPseudoTagsData.ts]
        A2 --> A3[CSV File<br/>mapillary_coverage.csv]
        A3 --> A4[LUA Processing<br/>roads_bikelanes.lua]
        A4 --> A5[SQL Cleanup<br/>3_cleanup_todos_lines.sql]
        A5 --> A6[Type Generation<br/>generateTypes.ts]
        A6 --> A7[(Database<br/>todos_lines table)]
    end

    subgraph B["B: Campaign Configuration"]
        B1[Campaign Config Files<br/>app/src/data/radinfra-de/campaigns/*.ts]
        B1 --> B2[Campaign Collection<br/>campaigns.ts]
    end

    subgraph C["C: API & Integration Layer"]
        A7 --> C1[API Route<br/>/api/maproulette/data/[projectKey]]
        B2 --> C1
        C1 --> C2[MapRoulette Create Script<br/>MaprouletteCreate/process.ts]
        C2 --> C3[MapRoulette Platform]
        C3 --> C4[Contributors]
    end

    A7 --> C5[Map Visualization<br/>subcat_radinfra_campaigns]
    B2 --> C6[Campaigns API<br/>/api/campaigns]
    C6 --> C7[External Astro Site<br/>radinfra.de]

    style A fill:#e1f5ff
    style B fill:#fff4e1
    style C fill:#e8f5e9
    style A7 fill:#ffebee
    style B2 fill:#ffebee
```
