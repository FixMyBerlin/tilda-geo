# About

The `style.json` is the base style from MapTiler. Do not hand-edit app-only keys there.

The `/api/map-style` route applies runtime overrides on top of it:

- sprite URL → our sprites under `/map-style/sprite`
- `sky: {}` → enable MapLibre sky with style-spec defaults (for pitched/3D views)
