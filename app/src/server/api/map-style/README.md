# About

The `style.json` is the base style from Maptiler. Do not edit it by hand.

- Change the style in the [Maptiler editor](https://cloud.maptiler.com/maps/editor?map=08357855-50d4-44e1-ac9f-ea099d9de4a5).
- Run `bun run map-style-update` to download it. The script refuses a style that lacks one of the
  layers our own layers are placed below (`LAYER_POSITIONS`).
- `bun run dev` warns once per week when the style in Maptiler differs from our copy.

The `/api/map-style` route applies runtime overrides on top of it:

- sprite URL → our sprite under `/map-style/sprite`
- `sky: {}` → enable MapLibre sky with style-spec defaults (for pitched/3D views)
