# About

The `style.json` is the original base style downloaded by `scripts/MapboxStyles/process.ts`
(`bun run mapbox-styles-update`). Treat it as a generated artifact — do not hand-edit app-only keys there.

The `/api/map-style` route applies runtime overrides on top of that download:

- sprite URL → our merged sprites under `/map-style/sprite`
- `sky: {}` → enable MapLibre sky with style-spec defaults (for pitched/3D views)
