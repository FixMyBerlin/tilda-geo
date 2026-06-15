# layout.visibility vs unmounting layers

Two ways to hide map content: set **`layout: { visibility: 'none' }`** on `<Layer>` (layer stays in the style), or **stop rendering** the `<Source>` / `<Layer>` React components (nodes removed from the tree). Both are declarative — do not use `map.addLayer` / `map.setLayoutProperty` instead ([declarative-source-layer.md](declarative-source-layer.md)).

## Tilda default: visibility toggle (atlas)

All category layers stay mounted; URL/config drives visibility:

```tsx
// tilda-geo: SourcesLayersAtlasGeo.tsx — simplified
<Layer
  id="regions-fill"
  type="fill"
  source="regions"
  source-layer="default"
  layout={{
    visibility: categoryActive && styleActive ? 'visible' : 'none',
  }}
  paint={{ 'fill-color': '#3b82f6', 'fill-opacity': 0.4 }}
/>
```

MapLibre only requests tiles for sources used by a **visible** layer. Unmounting removes the source from the style and can trigger a fresh fetch on remount; toggling `visibility` may still hit the network once, but browser caching usually makes that acceptable.

## Tilda alternative: unmount (static datasets)

Datasets selected in URL are rendered; others return `null`. Unmounting unused datasets saves memory but adds remount cost when toggled back — for frequently toggled layers, prefer keeping them mounted with `visibility: 'none'`.

```tsx
// tilda-geo: SourcesLayersStaticDatasets.tsx
if (!selectedDatasetIdsSet || visibleDatasets.length === 0) return null
```

## Comparison

Two real choices: toggle **visibility** (layer stays in the style) or **unmount** (React stops rendering `<Source>` / `<Layer>`).

| Approach                                      | Network / tiles                                              | Memory                             | Toggle cost                        | interactiveLayerIds                                   |
| --------------------------------------------- | ------------------------------------------------------------ | ---------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| `visibility: 'none'`                          | Source may stay warm; no new fetch if layer was visible once | Layers + sources remain in style   | Cheap (layout update)              | Keep id in list only if still clickable when “hidden” |
| Unmount (don’t render `<Source>` / `<Layer>`) | Source removed from style; **re-fetch on remount**           | Lower when unused sources are gone | Remount + style diff + tile reload | Remove ids when unmounted                             |

Unmount granularity:

- **Whole source group** — `return null` before `<Source>` (tilda static datasets). Tears down source + all its layers. Best for heavy, rarely used PMTiles.
- **Single layer only** — stop rendering one `<Layer>` while siblings keep the source alive. Same idea, but the source stays if other layers still reference it.

## When to use which

**Prefer `visibility: 'none'` when:**

- Users toggle layers frequently (atlas categories, styles).
- You need stable layer ids for `interactiveLayerIds`, highlight layers, or `beforeId` ordering.
- Many layers share one source — hiding one layer should not tear down the source.

**Prefer unmount when:**

- Data is heavy and rarely shown (optional PMTiles datasets).
- Selected set is small and URL-driven (tilda static datasets).
- You want to free GPU/style memory for unused sources.

**Hybrid (tilda):** Atlas = always mounted + visibility. Static datasets = mount only when selected in URL.

## interactiveLayerIds coupling

`visibility: 'none'` does **not** remove a layer from `interactiveLayerIds` — update the list yourself when a hidden layer should not be pickable. Unmounting removes the layer from the style; drop its id too, or pointer queries may warn/fail when react-map-gl / MapLibre tries to hit a layer that is not in the style. See interactive-layer-ids.md for the style-sync guard on manual `queryRenderedFeatures`.

## Config hygiene

Do not bake `layout.visibility` into static dataset JSON — it can leave layers permanently hidden. Visibility belongs in React-driven `<Layer layout={{ visibility: … }} />` toggles.

## Performance note

React Compiler / memoization: tilda filters datasets before `.map()` to avoid useless iterations. Use `Set` for selected id lookups when unmounting selectively.
