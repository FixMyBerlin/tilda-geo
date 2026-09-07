# Map hover and selection across region modes

## Purpose

The region map pairs a sidebar list with map layers in Hinweise, QA, and Prüflisten. Hover and selection can start on either surface. This is the live wiring, plus the gaps.

## Directions

| Direction                  | Mechanism                                                                                                                                                                                                                                                                                                                                 | Status                  |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| List hover → map marker    | `ModeListItem` / `ModeDataTableRow` write `{ id, coordinates }` to `mode-list-store`; `MapListHoverMarker` draws a mode-accent ring at that point (clamped to the canvas edge when off-screen). `ModePanel` shows “Außerhalb des Kartenausschnitts” while `atEdge`.                                                                       | Live in all three modes |
| Map hover → list row       | `RegionMap` `updateHover` sets MapLibre `feature-state hover` only; it never writes the list store. Rows have CSS hover and `active` (URL selection), but not a map-driven hover style.                                                                                                                                                   | Gap in all modes        |
| Map click → selection ring | Click writes the `f` param. `UpdateFeatureState` syncs `selected` (never `hover`). QA paints a dedicated `${qaLayerId}-selected` inner ring; OSM/internal notes paint `${layerId}-selected` circles (filter on the `id` **property**); Prüflisten paints status-colored geometry plus a selection halo, excluding the entry being edited. | Live                    |
| List click → map selection | Row `onClick` calls `setFeaturesParam(mergeModeUrlFeature(…))`. Same `f` param and the same selected layers as a map click; the active row scrolls into view.                                                                                                                                                                             | Live                    |

Pointer hover on a **map** feature is separate from the list marker: QA uses `LayerHighlight` with `includeSelected={false}` so the accent inner ring and fill fade do not stack with `qa-layer-selected`. Notes and review-list paints do not read `feature-state hover`, so pointer hover on those features is a gap (review-list hitareas are `opacity: 0`).

List hover no longer merges the hovered id into those `*-selected` filters. The centroid marker is the list→map hover signal.

## Two highlight mechanisms

**MapLibre `feature-state`.** `RegionMap` diffs `queryRenderedFeatures` and calls `safeSetFeatureState`. Paint expressions read `['feature-state', 'hover']` / `selected`. Only layers from `useInteractiveLayers` participate. `safeSetFeatureState` no-ops when `feature.id` is missing. QA and review-list sources set `promoteId` to `id`; **notes sources set neither**, so feature-state on a note does nothing. Feature-state also cannot reach unloaded tiles.

**Filtered highlight layer.** Notes and Prüflisten match the GeoJSON `id` property (`['in', 'id', …]`). No `promoteId` required. The notes `*-selected` layer ids used to include hover; they are selection-only now. Prefer this for new notes/review work unless you specifically need QA’s fill/opacity fade.

Ids in the list store are mode-prefixed (`qa-${areaId}`, `note-${sourceId}-${id}`, `review-${id}`). The store carries coordinates, not a feature reference, so the ring works for off-screen items. `unhoverListItem(id)` only clears when `id` is still hovered, because `mouseleave` can arrive after the next `mouseenter`. Accents come from `modeIdentity[mode].accent`.
