# Requirements Document: Layer Sorting Implementation

## 1. Goals (Ziele)

### Primary Objectives

- **Maptiler Layer Sorting**: Ability to sort layers within Maptiler basemap
- **Atlas Geo (TILDA) Layer Sorting**: Ability to sort Atlas Geo layers across all regions via static configuration
- **Regional Static Data Sorting**: Ability to sort static data layers per region
- **Layer Integration**: "Sorting" means both ordering layers among themselves AND integrating them into the basemap ("_einspleißen_")

## 2. Core Principles (Grundprinzip)

### Layer-Source Separation

- **Independent Rendering**: Layer order is defined by rendering layers in the correct sequence
- **Source-Layer Decoupling**: This requires separating `Layer` and `Source` components so all `Layer` components can be mixed together independently of their `Source`
- **Result**: Achieves correct ordering within the layer hierarchy

### Basemap Integration

- **beforeId Mechanism**: Integration of our layers into Maptiler's layer list is possible via `beforeId`
- **Grouping Strategy**: We group our layers using `beforeId` groups
- **Ordering Within Groups**: When multiple layers use the same `beforeId`, they maintain our defined order within that group
- **Constraint**: `beforeId` can only reliably be used for layers that come from the basemap style, as errors occur when the referenced layer doesn't (yet) exist

## 3. Technical Solutions

### 3.1 Atlas Geo Layer Solution

**Approach**: Create a large, static list of layers that describes the order and groups (`beforeId`s)
**Reference**: Similar to [nudafa's admin interface](https://www.nudafa.de/radnetz/admin/)

### 3.2 Static Data Layer Solution

- **Timing**: Static data must be added to the map last
- **Grouping**: Continue using `beforeId` in config for grouping
- **TBD**: Best approach for establishing order within a region's layers
  - **Option**: Use folder order: `regionen-bb/1_layername`, `regionen-bb/2_layername`
    - **Pros**: Simple; leverages existing system
    - **Cons**: Doesn't work when multiple configs in one folder need different positions
    - **Workaround**: Move config to separate folder and reference data (Con: data duplication for users)

### 3.3 Notes Layer Solution

- **OSM Notes**: External notes from OpenStreetMap with conditional visibility
- **Internal Notes**: Internal notes with conditional visibility based on user permissions
- **OSM Notes**: External notes from OpenStreetMap with conditional visibility
- **Internal Notes**: Internal notes with conditional visibility based on user permissions
- **Layer Types**: Symbol layers for notes, circle layers for highlights
- **Integration**: Notes should appear above most data layers but below QA layers

### 3.4 QA Layer Solution

- **Dynamic Configuration**: QA layers are configured per region via admin interface
- **Feature States**: Uses MapLibre feature states for dynamic styling
- **Layer Types**: Fill layers with outline layers for QA data visualization
- **Integration**: QA layers should appear on top of all other data layers
- **Conditional Rendering**: Only renders when QA config is active for the region

## 4. Current Component Analysis

### 4.1 Existing Source/Layer Components

**Current Structure in Map.tsx:**

```tsx
<SourcesLayerRasterBackgrounds />      // Background raster tiles
<SourcesLayersRegionMask />           // Regional boundary masks
<SourcesLayersAtlasGeo />             // Main Atlas Geo data layers
<SourcesLayersStaticDatasets />       // Regional static datasets
<SourcesLayersOsmNotes />             // OSM notes with conditional visibility
<SourcesLayersInternalNotes />        // Internal notes with permissions
<SourcesLayersQa />                   // QA layers with feature states
```

**Notes New System (Non-Relevant for Main Map):**

- `SourceLayerFeature` - Temporary geometry for note creation (separate map)
- `SourceLayerForRegion` - Region-specific note layers (separate map)
- `SourceLayerBikelanes` - Bikelanes reference for notes (separate map)
- `SourceLayerInfravelo` - Infravelo data for notes (separate map)
- `SourceLayerRegionBbSg` - Regional data for notes (separate map)

### 4.2 Current Separation Status

**Already Separated (Flat Structure):**

- ✅ `SourcesLayersOsmNotes` - Uses flat Source/Layer structure
- ✅ `SourcesLayersInternalNotes` - Uses flat Source/Layer structure
- ✅ `SourcesLayersQa` - Uses flat Source/Layer structure
- ✅ `SourcesLayerRasterBackgrounds` - Uses flat Source/Layer structure
- ✅ `SourcesLayersRegionMask` - Uses flat Source/Layer structure
- ✅ `SourcesLayersStaticDatasets` - Uses flat Source/Layer structure
- ✅ `SourcesLayersAtlasGeo` - Uses flat Source/Layer structure

**Non-Relevant Components (Separate Maps):**

- Notes New components - Used in separate note creation map, not main map

**All components already follow the flat Source/Layer pattern!**

## 5. Implementation Requirements

### 5.1 Component Structure

We need to create:

1. **Atlas Geo Sources**: A list of `Source` components for Atlas Geo data
2. **Atlas Geo Layers**: A list of `Layer` components for Atlas Geo data
3. **Static Data Sources**: A list of `Source` components for static data
4. **Static Data Layers**: A list of `Layer` components for static data
5. **Notes Sources**: A list of `Source` components for Notes data (OSM Notes, Internal Notes)
6. **Notes Layers**: A list of `Layer` components for Notes data
7. **QA Sources**: A list of `Source` components for QA data
8. **QA Layers**: A list of `Layer` components for QA data
9. **Background Sources**: A list of `Source` components for raster backgrounds
10. **Background Layers**: A list of `Layer` components for raster backgrounds

### 5.2 Performance Optimization Cleanup

- **React Compiler Compatibility**: Remove performance optimizations that don't follow React rules
- **State Management**: Clean up code that stores state outside React components to manage rendering
- **Future Compatibility**: Prepare for React compiler activation
- **Code Comments**: Remove or update "ignore react compiler" comments

**Files that need updates:**

#### 1. **SourcesLayersStaticDatasets.tsx** - Remove Manual Visibility Management

```typescript
// CURRENT (Problematic):
const datasetsPreviouslyVisible = useRef({})
// ...
const datasetWasVisible = !!datasetsPreviouslyVisible.current[datasetSourceId]
if (!datasetWasVisible && !visible) return null
datasetsPreviouslyVisible.current[datasetSourceId] = true

// TARGET (React-compiler friendly):
// Remove all manual visibility tracking - let React handle it
// Simply render based on current visibility state
if (!visible) return null
```

#### 2. **useSelectedFeatures.ts** - Remove Manual Caching

```typescript
// CURRENT (Problematic):
const featuresCache = useRef<{ [key: string | number]: MapGeoJSONFeature }>({}).current
// ...
if (mapFeature) {
  featuresCache[urlFeature.id] = mapFeature
}

// TARGET (React-compiler friendly):
// Remove manual caching - let React handle memoization
// Use React.memo or useMemo if needed for expensive operations
const result = featuresParam.map((urlFeature) => {
  const mapFeature = renderedFeatures.find(
    (f) => f.id === urlFeature.id && !isLayerHighlightId(f.layer.id),
  )
  return { urlFeature, mapFeature }
})
```

#### 3. **Files with React Compiler Disable Comments** that are relevant for this rework

- `app/src/app/admin/layout.tsx` - Line 12
- `app/src/app/regionen/[regionSlug]/_components/Map/SourcesAndLayers/SourcesLayersStaticDatasets.tsx` - Line 28
- `app/src/app/regionen/[regionSlug]/_components/Map/UpdateFeatureState.tsx` - Lines 15, 29
- `app/src/app/regionen/[regionSlug]/_hooks/useQueryState/useFeaturesParam/useSelectedFeatures.ts` - Line 22
- `app/src/app/regionen/[regionSlug]/_components/SidebarInspector/SidebarInspector.tsx` - Lines 43, 51, 61
- `app/src/app/regionen/[regionSlug]/_components/SidebarInspector/InspectorFeatureInternalNote/NewNoteCommentForm.tsx` - Line 29

**Action Required:**

1. Remove all manual visibility management and caching
2. Remove all `eslint-disable-next-line react-compiler/react-compiler` comments
3. Let React compiler handle optimization naturally
4. Use React.memo or useMemo only for truly expensive operations
5. Test that functionality remains the same after changes

## 6. Reference Implementation

Based on the working nudafa project, we need to implement:

### 6.1 AllSources Component

```typescript
// Reuse existing source components
export const AllSources = () => {
  return (
    <>
      <SourcesLayerRasterBackgrounds />
      <SourcesLayersRegionMask />
      <SourcesLayersAtlasGeo />
      <SourcesLayersStaticDatasets />
      <SourcesLayersOsmNotes />
      <SourcesLayersInternalNotes />
      <SourcesLayersQa />
    </>
  )
}
```

### 6.2 AllLayers Component

```typescript
// Extract layers from existing components with sorting
export const AllLayers = () => {
  return (
    <>
      {/* Order: Background → Mask → Atlas Geo → Static Data → Notes → QA */}
      <BackgroundLayers />
      <MaskLayers />
      <AtlasGeoLayers />
      <StaticDataLayers />
      <OsmNotesLayers />
      <InternalNotesLayers />
      <QaLayers />
    </>
  )
}
```

### 6.3 Concrete Implementation Examples

**What we want to achieve:**

```tsx
// Current Map.tsx structure:
<MapGl>
  <SourcesLayerRasterBackgrounds />
  <SourcesLayersRegionMask />
  <SourcesLayersAtlasGeo />
  <SourcesLayersStaticDatasets />
  <SourcesLayersOsmNotes />
  <SourcesLayersInternalNotes />
  <SourcesLayersQa />
</MapGl>

// Target structure:
<MapGl>
  <AllSources />
  <AllLayers />
</MapGl>
```

**Reusing Current Components:**

Since source order doesn't matter, we can reuse existing components and just extract their sources:

```typescript
// AllSources component - reuses existing components
export const AllSources = () => {
  return (
    <>
      {/* Reuse existing source components */}
      <SourcesLayerRasterBackgrounds />
      <SourcesLayersRegionMask />
      <SourcesLayersAtlasGeo />
      <SourcesLayersStaticDatasets />
      <SourcesLayersOsmNotes />
      <SourcesLayersInternalNotes />
      <SourcesLayersQa />
    </>
  )
}

// AllLayers component - extracts layers from existing components
export const AllLayers = () => {
  return (
    <>
      {/* Extract layers from existing components */}
      <BackgroundLayers />
      <AtlasGeoLayers />
      <StaticDataLayers />
      <OsmNotesLayers />
      <InternalNotesLayers />
      <QaLayers />
      <MaskLayers />
    </>
  )
}
```

**Helper Components (encapsulate existing logic):**

```typescript
// Example: BackgroundLayers component
export const BackgroundLayers = () => {
  // Reuse all the helper logic from SourcesLayerRasterBackgrounds
  const { backgroundParam } = useBackgroundParam()
  const region = useRegion()
  const backgrounds = sourcesBackgroundsRaster.filter(...)

  return (
    <>
      {backgrounds.map(({ id, tiles, minzoom, maxzoom, tileSize, attributionHtml }) => {
        const backgroundId = `${id}_tiles`
        const visible = backgroundParam === id

        return (
          <Layer
            key={backgroundId}
            id={id}
            type="raster"
            source={backgroundId}
            layout={layerVisibility(visible)}
            beforeId={beforeId}
          />
        )
      })}
    </>
  )
}
```

**CRITICAL ISSUE: This approach still doesn't solve interleaved ordering!**

The problem with the current approach is that it still stacks all Atlas Geo layers together, then all Static Data layers together. But we need **interleaved ordering** where Atlas Geo and Static Data layers can be mixed.

**Better Approach: Unified Layer List**

```typescript
// AllLayers component with unified layer list
export const AllLayers = () => {
  // Get all layers from all components
  const allLayers = [
    ...getBackgroundLayers(),
    ...getAtlasGeoLayers(),
    ...getStaticDataLayers(),
    ...getOsmNotesLayers(),
    ...getInternalNotesLayers(),
    ...getQaLayers(),
    ...getMaskLayers(),
  ]

  // Sort based on layer order configuration
  const sortedLayers = sortLayersByOrder(allLayers, layerOrderEntries)

  return (
    <>
      {sortedLayers.map((layer) => (
        <Layer key={layer.id} {...layer} />
      ))}
    </>
  )
}
```

This way, Atlas Geo and Static Data layers can be interleaved based on the layer order configuration.

### 6.4 Layer List Generation Strategy

We need to generate the complete layer list dynamically, considering different layer types:

#### 6.4.1 Layer Types Analysis

**Code-Based Layers (Static Configuration):**

- **Background Layers**: Defined in `sourcesBackgroundsRaster.const.ts`
- **Atlas Geo Layers**: Defined in `mapDataSubcategories/*.const.ts` files
- **Notes Layers**: Defined in `SourcesLayersOsmNotes.tsx` and `SourcesLayersInternalNotes.tsx`
- **QA Layers**: Defined in `SourcesLayersQa.tsx`
- **Mask Layers**: Defined in `SourcesLayersRegionMask.tsx`

**Database-Based Layers (Dynamic):**

- **Static Data Layers**: Stored in database, filtered by user permissions

#### 6.4.2 Layer List Generation Approach

**Step 1: Generate Complete Layer List (Build Time)**

```typescript
// scripts/generateLayerList.ts
export const generateCompleteLayerList = () => {
  const allLayers: LayerOrderEntry[] = []

  // 1. Background Layers (from sourcesBackgroundsRaster.const.ts)
  sourcesBackgroundsRaster.forEach((bg) => {
    allLayers.push({
      key: bg.id,
      category: 'background',
      beforeId: 'background',
    })
  })

  // 2. Mask Layers (from SourcesLayersRegionMask.tsx)
  allLayers.push(
    { key: 'mask-buffer', category: 'mask', beforeId: 'mask' },
    { key: 'mask-boundary', category: 'mask', beforeId: 'mask' },
    { key: 'mask-boundary-bg', category: 'mask', beforeId: 'mask' },
  )

  // 3. Atlas Geo Layers (from mapDataSubcategories/*.const.ts)
  // This requires parsing all subcategory files
  const atlasGeoLayerIds = extractAtlasGeoLayerIds()
  atlasGeoLayerIds.forEach((layerId) => {
    allLayers.push({
      key: layerId,
      category: 'atlas-geo',
      beforeId: 'atlas-geo',
    })
  })

  // 4. Notes Layers (from existing components)
  allLayers.push(
    { key: 'osm-notes-symbol', category: 'notes', beforeId: 'notes' },
    { key: 'osm-notes-circle', category: 'notes', beforeId: 'notes' },
    { key: 'internal-notes-symbol', category: 'notes', beforeId: 'notes' },
    { key: 'internal-notes-circle', category: 'notes', beforeId: 'notes' },
  )

  // 5. QA Layers (from SourcesLayersQa.tsx)
  allLayers.push(
    { key: 'qa-fill', category: 'qa', beforeId: 'qa' },
    { key: 'qa-outline', category: 'qa', beforeId: 'qa' },
  )

  return allLayers
}

// Helper function to extract Atlas Geo layer IDs
const extractAtlasGeoLayerIds = () => {
  // This would parse all mapDataSubcategories/*.const.ts files
  // and extract layer IDs from the mapboxStyleLayers arrays
  // Implementation depends on the structure of these files
}
```

**Step 2: Filter Layers for Region (Runtime)**

```typescript
// hooks/useRegionLayerList.ts
export const useRegionLayerList = (regionSlug: string) => {
  const { data: staticDatasets } = useQuery(getStaticDatasets, { regionSlug })
  const { data: qaConfigs } = useQuery(getQaConfigs, { regionSlug })

  // Start with complete layer list
  const completeLayerList = generateCompleteLayerList()

  // Filter based on region-specific data
  const regionLayerList = completeLayerList.filter((entry) => {
    switch (entry.category) {
      case 'background':
      case 'mask':
      case 'atlas-geo':
      case 'notes':
        // Always include code-based layers
        return true

      case 'static-data':
        // Only include if dataset exists for this region
        return staticDatasets?.some((dataset) => dataset.layerId === entry.key) ?? false

      case 'qa':
        // Only include if QA config exists for this region
        return qaConfigs?.some((config) => config.layerId === entry.key) ?? false

      default:
        return false
    }
  })

  return regionLayerList
}
```

**Step 3: Build-Time Validation Script**

```typescript
// scripts/validateLayerList.ts
export const validateLayerList = () => {
  const completeLayerList = generateCompleteLayerList()

  // Check for duplicate layer IDs
  const layerIds = completeLayerList.map((entry) => entry.key)
  const duplicates = layerIds.filter((id, index) => layerIds.indexOf(id) !== index)

  if (duplicates.length > 0) {
    throw new Error(`Duplicate layer IDs found: ${duplicates.join(', ')}`)
  }

  // Check that all Atlas Geo layers are included
  const atlasGeoIds = extractAtlasGeoLayerIds()
  const missingAtlasGeo = atlasGeoIds.filter(
    (id) => !completeLayerList.some((entry) => entry.key === id),
  )

  if (missingAtlasGeo.length > 0) {
    throw new Error(`Missing Atlas Geo layers: ${missingAtlasGeo.join(', ')}`)
  }

  console.log(`✅ Layer list validation passed: ${completeLayerList.length} layers`)
}
```

#### 6.4.3 Implementation Strategy

**Build-Time Generation:**

1. **Script**: `scripts/generateLayerList.ts` - Generates complete layer list
2. **Validation**: `scripts/validateLayerList.ts` - Validates completeness
3. **Integration**: Run validation in CI/CD pipeline
4. **Output**: Generate `layerList.const.ts` file

**Runtime Filtering:**

1. **Hook**: `useRegionLayerList` - Filters complete list for specific region
2. **Permissions**: Respect user permissions for static data
3. **Conditional**: Only include layers that exist for the region

**File Structure:**

```
app/
├── scripts/
│   ├── generateLayerList.ts
│   └── validateLayerList.ts
├── src/
│   └── app/
│       └── regionen/
│           └── [regionSlug]/
│               └── _hooks/
│                   └── useRegionLayerList.ts
└── generated/
    └── layerList.const.ts
```

#### 6.4.4 Sorting Implementation

```typescript
// hooks/useSortedLayers.ts
export const useSortedLayers = (regionSlug: string) => {
  const regionLayerList = useRegionLayerList(regionSlug)

  // Sort layers based on their order in the complete list
  const sortedLayers = regionLayerList.sort((a, b) => {
    const completeList = generateCompleteLayerList()
    const aIndex = completeList.findIndex(entry => entry.key === a.key)
    const bIndex = completeList.findIndex(entry => entry.key === b.key)

    // If not found in complete list, put at the end
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1

    return aIndex - bIndex
  })

  return sortedLayers
}

// Updated AllLayers component
export const AllLayers = () => {
  const { regionSlug } = useParams()
  const sortedLayers = useSortedLayers(regionSlug)

  return (
    <>
      {sortedLayers.map((layerEntry) => (
        <Layer
          key={layerEntry.key}
          id={layerEntry.key}
          source={getSourceForLayer(layerEntry.key)}
          source-layer={getSourceLayerForLayer(layerEntry.key)}
          beforeId={layerEntry.beforeId}
          {...getLayerProps(layerEntry.key)}
        />
      ))}
    </>
  )
}
```

#### 6.4.5 Atlas Geo Layer Extraction Strategy

The most complex part is extracting Atlas Geo layer IDs from the subcategory files:

```typescript
// scripts/extractAtlasGeoLayerIds.ts
export const extractAtlasGeoLayerIds = () => {
  const layerIds: string[] = []

  // Read all mapDataSubcategories/*.const.ts files
  const subcategoryFiles = glob.sync(
    'src/app/regionen/[regionSlug]/_mapData/mapDataSubcategories/*.const.ts',
  )

  subcategoryFiles.forEach((filePath) => {
    const fileContent = fs.readFileSync(filePath, 'utf8')

    // Parse the file to extract layer IDs
    // This depends on the structure of the const files
    const layerMatches = fileContent.match(/id:\s*['"`]([^'"`]+)['"`]/g)

    layerMatches?.forEach((match) => {
      const layerId = match.match(/['"`]([^'"`]+)['"`]/)?.[1]
      if (layerId) {
        layerIds.push(layerId)
      }
    })
  })

  return layerIds
}
```

**Alternative Approach for Atlas Geo Layers:**

If parsing const files is too complex, we could:

1. **Create a registry**: Add a `layerRegistry.ts` file that explicitly lists all Atlas Geo layers
2. **Auto-generate**: Create a script that scans the codebase and generates the registry
3. **Manual maintenance**: Keep the registry updated manually (simpler but requires discipline)

```typescript
// src/app/regionen/[regionSlug]/_mapData/layerRegistry.ts
export const ATLAS_GEO_LAYERS = [
  'atlas-bikelanes-fill',
  'atlas-bikelanes-line',
  'atlas-roads-fill',
  'atlas-roads-line',
  'atlas-parkings-symbol',
  // ... etc
] as const
```

## 7. Migration Strategy

### 7.1 Phase 1: Component Separation

- Keep existing `Source` components as-is
- Extract `Layer` components from existing components
- Create `AllSources` and `AllLayers` components
- Maintain current functionality
- **Component Structure**:
  - `AllSources` → Reuses existing source components
  - `AllLayers` → Uses new layer components that extract from existing ones
  - `BackgroundLayers` → Extracts layers from `SourcesLayerRasterBackgrounds`
  - `MaskLayers` → Extracts layers from `SourcesLayersRegionMask`
  - `AtlasGeoLayers` → Extracts layers from `SourcesLayersAtlasGeo`
  - `StaticDataLayers` → Extracts layers from `SourcesLayersStaticDatasets`
  - `OsmNotesLayers` → Extracts layers from `SourcesLayersOsmNotes`
  - `InternalNotesLayers` → Extracts layers from `SourcesLayersInternalNotes`
  - `QaLayers` → Extracts layers from `SourcesLayersQa`

**Concrete Example:**

```typescript
// Current: Multiple separate components
<SourcesLayerRasterBackgrounds />
<SourcesLayersRegionMask />
<SourcesLayersAtlasGeo />
<SourcesLayersStaticDatasets />
<SourcesLayersOsmNotes />
<SourcesLayersInternalNotes />
<SourcesLayersQa />

// Target: Two unified components
<AllSources />
<AllLayers />
```

### 7.2 Phase 2: Layer Ordering

- Implement layer order configuration
- Add sorting logic to `AllLayers`
- Test with Atlas Geo layers
- **Layer Order Priority** (bottom to top):
  1. Background layers (raster)
  2. Region mask layers
  3. Atlas Geo layers (main data)
  4. Static data layers
  5. Notes layers (OSM, Internal)
  6. QA layers (top priority)

**Concrete Example:**

```typescript
// Layer order in practice:
const layerOrder = [
  'background-raster', // Bottom
  'mask-buffer',
  'mask-boundary',
  'atlas-bikelanes-fill',
  'atlas-roads-line',
  'atlas-parkings-symbol',
  'static-data-regional-fill',
  'osm-notes-symbol',
  'internal-notes-symbol',
  'qa-fill', // Top
  'qa-outline',
]
```

### 7.3 Phase 3: Notes and QA Integration

- Extend ordering system to Notes and QA layers
- Implement conditional visibility logic
- Add feature state management for QA
- **Notes Integration**:
  - OSM Notes: Conditional visibility based on `showOsmNotesParam`
  - Internal Notes: Conditional visibility based on user permissions
- **QA Integration**:
  - Dynamic configuration per region
  - Feature state management for styling
  - Conditional rendering based on active QA config

### 7.4 Phase 4: Static Data Integration

- Extend ordering system to static data
- Implement region-specific configurations
- Add beforeId integration

### 7.5 Phase 5: Performance Optimization

- Clean up React compiler incompatible code
- Remove external state management
- Update performance optimizations

**Concrete Tasks:**

1. **Fix SourcesLayersStaticDatasets.tsx**:
   - Remove `useRef({})` and all manual visibility tracking
   - Simply render based on current `visible` state
   - Remove `eslint-disable-next-line react-compiler/react-compiler` comment

2. **Fix useSelectedFeatures.ts**:
   - Remove `useRef({}).current` and manual caching
   - Let React handle memoization naturally
   - Remove `eslint-disable react-compiler/react-compiler` comment

3. **Remove React Compiler Disable Comments**:
   - Remove all 8 instances of `eslint-disable-next-line react-compiler/react-compiler`
   - Let React compiler handle optimization
   - Test functionality after each change

4. **Simplify Performance Patterns**:
   - Remove all manual state management for visibility/caching
   - Trust React's built-in optimization
   - Only use React.memo/useMemo for truly expensive operations

## 8. Success Criteria

- [ ] All Atlas Geo layers can be sorted via static configuration
- [ ] Static data layers can be sorted per region
- [ ] Notes layers (OSM, Internal) are properly integrated and ordered
- [ ] QA layers are properly integrated with feature state management
- [ ] Background layers are properly ordered and integrated
- [ ] Layers integrate properly with Maptiler basemap
- [ ] Performance optimizations are React compiler compatible
- [ ] No "ignore react compiler" comments remain
- [ ] Layer ordering is consistent across all regions
- [ ] Conditional visibility works for all layer types
- [ ] Feature state management works for QA layers

## 9. References

- [nudafa AllLayers.tsx](https://raw.githubusercontent.com/FixMyBerlin/nudafa/refs/heads/main/src/components/page_radnetz/Map/AllLayers.tsx)
- [nudafa AllSources.tsx](https://raw.githubusercontent.com/FixMyBerlin/nudafa/refs/heads/main/src/components/page_radnetz/Map/AllSources.tsx)
- [nudafa RadnetzMap.tsx](https://raw.githubusercontent.com/FixMyBerlin/nudafa/refs/heads/main/src/components/page_radnetz/Map/RadnetzMap.tsx)
- [nudafa sortLayers README](https://raw.githubusercontent.com/FixMyBerlin/nudafa/refs/heads/main/src/components/page_radnetz/sortLayers/README.md)
- [nudafa beforeIdEntries.const.ts](https://raw.githubusercontent.com/FixMyBerlin/nudafa/refs/heads/main/src/components/page_radnetz/sortLayers/beforeIdEntries.const.ts)

This requirements document provides a clear roadmap for implementing the layer sorting functionality while maintaining compatibility with the existing tilda-geo architecture and preparing for future React compiler integration.
