# Docs

The goal is to allow special table cells that composit multiple keys or show keys in a special way (icons and such).

How it works:

1. Add the `documentedKeys` in `sources.const.ts`
   - prefix them with `composit_*`
   - (the `*` can be whatever, but listing the keys is a good idea)
   - eg: `composit_surface_smoothness``

2. Add a component in this folder
3. Render the component as part of the `switch`-statement in `TagsTable`
