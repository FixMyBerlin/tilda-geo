# Flat Source + Layer components

Use **sibling** `<Source>` and `<Layer>` components under `<Map>`, not nested `<Layer>` trees inside `<Source>`. react-map-gl allows nesting, but flat structure matches MapLibre’s mental model (sources and layers are separate registries) and makes refactors easier.

## Rule

For each logical source:

1. One `<Source id="…" … />` — `type`, `tiles` / `data` / `url`, optional `promoteId`, zoom limits.
2. One or more **sibling** `<Layer id="…" source="…" … />` — `source` must match the Source `id`.

## Minimal example

```tsx
<Source id="roads" type="vector" tiles={[tileUrl]} promoteId="id" />
<Layer
  id="roads-fill"
  type="fill"
  source="roads"
  source-layer="transportation"
  paint={{ 'fill-color': '#ccc', 'fill-opacity': 0.4 }}
/>
<Layer
  id="roads-line"
  type="line"
  source="roads"
  source-layer="transportation"
  paint={{ 'line-color': '#333', 'line-width': 1 }}
/>
```

## Required Layer props (typical)

| Prop                  | Required    | Notes                                                 |
| --------------------- | ----------- | ----------------------------------------------------- |
| `id`                  | yes         | MapLibre layer id; also used in `interactiveLayerIds` |
| `type`                | yes         | `fill`, `line`, `circle`, `symbol`, `raster`, …       |
| `source`              | yes         | Must match `<Source id>`                              |
| `source-layer`        | vector only | Tile layer name inside the vector source              |
| `layout`              | often       | e.g. `visibility: 'visible' \| 'none'` for toggles    |
| `paint`               | per type    | Type-specific paint props                             |
| `filter`              | optional    | MapLibre filter expression                            |
| `minzoom` / `maxzoom` | optional    |                                                       |
| `beforeId`            | optional    | Insert below another layer id                         |

## Layer `id` and `interactiveLayerIds`

The string you pass as `<Layer id="…">` is the same id MapLibre registers in the style — and the same string must appear in `<Map interactiveLayerIds={…}>` for that layer to be clickable/hoverable (see interactive-layer-ids.md). A typo in one place silently breaks picking.

**Export a shared const** when the id is referenced from more than one module — layer component, `useInteractiveLayers`, feature-state code, tests:

```tsx
// tilda-geo: SourcesLayersOsmNotes.tsx
export const osmNotesLayerId = 'osm-notes-layer'

<Layer id={osmNotesLayerId} source={osmNotesSourceId} type="symbol" … />
```

```tsx
// tilda-geo: useInteractiveLayers.ts
import { osmNotesLayerId } from '../SourcesAndLayers/SourcesLayersOsmNotes'

if (showOsmNotesParam) {
  activeCategoryLayerIds.push(osmNotesLayerId)
}
```

Same pattern for `qaLayerId`, `internalNotesLayerId`, and atlas layer ids built via shared `createLayerKey…` helpers so config, `<Layer id>`, and `interactiveLayerIds` stay in sync.

Only list layers that should receive pointer events — decorative layers (highlights, halos) usually stay **out** of `interactiveLayerIds` even when they share a source.

## Anti-pattern

```tsx
// ❌ Nested — harder to split files or reuse one source across layer groups
<Source id="a" type="geojson" data={data}>
  <Layer id="fill" type="fill" />
</Source>

// ✅ Flat
<Source id="a" type="geojson" data={data} />
<Layer id="fill" type="fill" source="a" />
```

## React `key` vs MapLibre `id`

These are **different**:

|              | MapLibre `id`                            | React `key`                                           |
| ------------ | ---------------------------------------- | ----------------------------------------------------- |
| Purpose      | Identity in the map style                | Identity in React’s tree / lists                      |
| Stable when… | Toggling visibility, updating paint/data | Same logical source/layer across renders              |
| Change when… | You want a new style object (rare)       | List item identity changes, or you must force remount |

### When to set `key`

**1. Mapping over a list — required on the list wrapper**

Tilda wraps each source + its layers in `<Fragment key={…}>` when iterating datasets or categories:

```tsx
{datasets.map(({ sourceId, layers, url }) => (
  <Fragment key={sourceId}>
    <Source id={sourceId} key={sourceId} type="vector" url={url} />
    {layers.map((layer) => (
      <Layer key={layer.id} id={layer.id} type="fill" source={sourceId} … />
    ))}
  </Fragment>
))}
```

- **`Fragment key`** — required; tells React which source group is which when the list changes.
- **`<Layer key={layerId}>`** — required inside `layers.map()`; tilda sets `key` equal to MapLibre `id`.

**2. `<Source key>` — tilda mirrors `id`, except when remount is intentional**

In mapped groups, tilda also sets `<Source key={sourceId}>` to the same string as `id`. Single-child Sources outside a map often omit `key` (not harmful when `id` is stable).

**3. Same MapLibre `id`, different React `key` — force remount**

QA keeps a fixed source id but changes `key` when the underlying tileset changes, so MapLibre does not apply new `source-layer` names against a stale source URL:

```tsx
// tilda-geo: SourcesLayersQa.tsx
const qaVectorSetKey = `${qaSourceId}:${vectorSourceName}`

<Source id={qaSourceId} key={`${qaVectorSetKey}--source`} type="vector" url={dataUrl} … />
<Fragment key={`${qaVectorSetKey}--layers`}>
  <Layer id={qaLayerId} source={qaSourceId} source-layer={vectorSourceName} … />
</Fragment>
```

Use this pattern when **`id` must stay stable** (bookmarks, `interactiveLayerIds`, other code references the id) but **source URL or layer stack must fully reset**.

### When `key` is optional

- One Source and a few Layers, not produced by `.map()`.
- GeoJSON `data` updates on a stable source — update the `data` prop; do **not** bump `key` every render (tilda OSM notes: stable `key={osmNotesSourceId}`, `data={filteredFeatures}`).

### When not to use `key` for behavior

- **Visibility** — use `layout.visibility`, not remounting via a new `key` (see layer-visibility-vs-unmount.md).
- **Style tweaks** — update `paint` / `filter` props; keep `id` and `key` stable.

## Render order under `<Map>`

Tilda stacks roughly: backgrounds → system layers → main vector → URL-selected datasets → notes/QA → controls. Use `beforeId` for fine-grained order within a group.

## Identity stability

Keep MapLibre `id` and `type` stable across re-renders so MapLibre’s style diffing stays cheap. Toggle visibility with `layout.visibility`, not new layer ids.
