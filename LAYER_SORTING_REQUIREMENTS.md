# Requirements: Layer Sorting (Layerreihenfolge)

Status: **concept agreed, implementation BLOCKED on `feature/regions-db-migration` merge** (uploads move to `MapDatasetUpload` + `MapDatasetLayerConfig` tables — the per-region ordering lives there).

Decisions in this revision (2026-07-02):

- Interleaving between layer groups happens **only at anchor-group level** (`beforeId`), not via one unified list across Atlas-Geo + static data.
- Atlas-Geo order is **one global list** (all regions render their subset in global order), stored in a **DB table, editable via admin drag-and-drop**.
- Static-data (upload) order is **per region, DB-based** (order column on `MapDatasetLayerConfig` or the region↔upload relation), with a **default order** when the admin hasn't set one.
- The React-compiler cleanup section of the old plan is **obsolete** — already done in TILDA.

## 1. Goals (Ziele)

- **Maptiler layers**: sorted in Maptiler itself (out of scope for app code).
- **Atlas-Geo (TILDA) layers**: sortable across all regions via one global, admin-editable list.
- **Static data (uploads)**: sortable per region via admin drag-and-drop.
- "Sorting" means ordering among our layers AND splicing into the basemap ("einspleißen") via `beforeId` anchor groups.

## 2. Core mechanism (verified against nudafa)

Reference implementation: nudafa (`src/components/page_radnetz/Map/AllSources.tsx`, `AllLayers.tsx`, `sortLayers/beforeIdEntries.const.ts`, admin tool `page_radnetz_admin/MapLayerOrder.tsx` at `/radnetz/admin/`).

1. **Separate `Source` from `Layer`.** All `<Source>`s render flat (order irrelevant); all `<Layer>`s render flat in one sorted list, referencing sources via the `source` prop. This lets layers from different sources interleave.
2. **`beforeId` only ever points at a layer that is guaranteed to exist**: a basemap-style layer. In TILDA we use our **custom empty anchor layers baked into the Maptiler style** (`atlas-app-beforeid-*`, see `TBeforeIds` in `_mapData/types.ts`) — these exist for every region as soon as the style loads, regardless of which TILDA layers are active. **Never** point `beforeId` at another TILDA layer (it may not exist / not yet exist → maplibre error).
3. **Within an anchor group, order = mount order.** Layers sharing a `beforeId` are stacked in the order they are added to the map. nudafa guarantees this by sorting the render array (bottom-first) and by **always rendering every layer** and toggling `layout.visibility` instead of mounting/unmounting.

### Critical invariant for TILDA's dynamic layers

react-map-gl inserts a newly *mounted* layer directly before its `beforeId` anchor — i.e. at the TOP of its anchor group, ignoring our intended order. Therefore:

- All layers of an anchor group must mount **together, in sorted order** (one React commit), and afterwards only toggle `visibility`.
- Atlas-Geo already works this way (`SourcesLayersAtlasGeo` renders everything, toggles visibility).
- **Static datasets currently mount/unmount on selection** (`SourcesLayersStaticDatasets`, incl. the `datasetsPreviouslyVisible` ref hack) — this must change to render-all-with-visibility once the region's upload list is loaded. Performance is fine: maplibre only requests tiles for sources used by a *visible* layer.
- If late mounting is ever unavoidable, the fallback is re-sorting via `map.moveLayer()` — avoid if possible.

This resolves the "beforeId must exist / regions have different layers" concern: anchors always exist; per-region subsets simply render fewer layers of the global list; toggling is visibility-only.

## 3. Solution per layer group

### 3.1 Atlas-Geo layers

- **One global ordered list** of all Atlas-Geo layer keys (compound keys `atlas_geo~{source}~{subcategory}~{style}~{layer}`), each assigned to an anchor group (`TBeforeIds`).
- **Storage: DB table** (e.g. `MapLayerOrder`: `layerKey`, `position`, `beforeId`), loaded once with the region loader (few KB, cacheable) — no per-frame cost.
- **Admin UI** analogous to nudafa `/radnetz/admin/`: reads the live stack (`map.getStyle().layers`), drag-and-drop reorder, writes to DB (nudafa generates copy-paste TS instead; we persist directly).
- **Admin UI structure**: the anchor groups (`TBeforeIds`) are the top-level sections; inside each group the layers are an ordered list. The UI shows ALL Atlas-Geo layer keys — regardless of region or current map visibility. Two edit operations:
  1. reorder layers **within** a group → changes `position`,
  2. move a layer **between** groups → changes `beforeId` + `position`.
- **UI library: Motion for React** (motion.dev). `Reorder.Group`/`Reorder.Item` covers within-group drag-reorder out of the box; cross-group moves need custom handling on top (Motion has no built-in multi-list drag) — e.g. drag detection across group boundaries or an explicit "move to group" action; decide during implementation.
- **Drift handling**: layer keys exist in code (const files) and may not exist in the DB (new subcategory) or vice versa (removed). Unknown keys get a deterministic default position (e.g. current type-based fallback from `utils/beforeId.ts`) + a warning list in the admin UI. A CI validation script checks for duplicates and reports code↔DB drift.
- Regions render only their subset — global order applies unchanged.

### 3.2 Static data (uploads) — after regions-db-migration merge

- Order is **per region**, stored in DB: order column on `MapDatasetLayerConfig` rows (or the region↔upload assignment), edited via drag-and-drop in the existing admin upload UI.
- **Default order** (e.g. current folder/name order) applies when no explicit order is set.
- Anchor-group assignment stays as today via `beforeId` in the dataset config (fallback `atlas-app-beforeid-fallback`).
- The old "folder order `1_name`, `2_name`" idea is superseded by the DB approach.

### 3.3 Notes / QA / mask / backgrounds

Fixed positions in the flat layer list: backgrounds at bottom, notes above data layers, QA above notes, mask layers on top (`beforeId: undefined`).

## 4. Target rendering structure

```tsx
<MapGl>
  <AllSources />   {/* reuse existing source logic, flat, order irrelevant */}
  <AllLayers />    {/* one flat, sorted list of <Layer>s; visibility-toggled */}
</MapGl>
```

`AllLayers` sorts by: anchor group (from DB / defaults) → position within group (global Atlas-Geo order; per-region upload order; fixed positions for notes/QA/mask).

## 5. Implementation phases (start AFTER regions merge)

1. **Rendering restructure**: extract flat `AllSources`/`AllLayers` from the seven `SourcesLayers*` components; keep current implicit order (parity refactor). Convert static datasets to always-mounted + visibility toggling.
2. **Sorting mechanics**: flat sorted layer list with anchor groups; temporary static default list in code (becomes the DB fallback).
3. **DB + admin**: `MapLayerOrder` table + drag-and-drop admin page (Atlas-Geo, global); order column + drag-and-drop for uploads (per region). Validation/drift tooling.

## 6. Success criteria

- [ ] Atlas-Geo layers sortable globally via admin (DB-backed), all regions render their subset in that order
- [ ] Upload layers sortable per region via admin, with sensible default order
- [ ] `beforeId` only ever targets `atlas-app-beforeid-*` anchors (or `undefined` for top)
- [ ] No mount/unmount of layers on toggle — visibility only; within-group order stable under any toggle sequence
- [ ] Notes/QA/mask keep their fixed relative positions
- [ ] Drift between code layer keys and DB order rows is surfaced (admin warning + CI check)

## 7. References

- nudafa: `src/components/page_radnetz/Map/{AllSources,AllLayers}.tsx`, `sortLayers/beforeIdEntries.const.ts`, `page_radnetz_admin/MapLayerOrder.tsx`, page `/radnetz/admin/`
- TILDA current state: `app/src/components/regionen/pageRegionSlug/Map/RegionMap.tsx`, `Map/SourcesAndLayers/*`, `Map/SourcesAndLayers/utils/beforeId.ts`, `_mapData/types.ts` (`TBeforeIds`)
- Tickets: FixMyBerlin/private-issues#945 (research), #2216 (first success)
- Dependency: branch `feature/regions-db-migration` (uploads → `MapDatasetUpload`/`MapDatasetLayerConfig`)
