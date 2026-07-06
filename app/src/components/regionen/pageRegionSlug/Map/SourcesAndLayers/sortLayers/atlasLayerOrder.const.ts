// Global, cross-region order of Atlas-Geo layers, bottom-first (like nudafa's beforeIdEntries).
// Keys are layer keys from `createLayerKeyAtlasGeo`, e.g.
//   'source:bikelanes--subcat:bikelanes--style:default--layer:line_base'
// Regions render only their subset of these layers; gaps in the list are fine because the
// order is relative. Layers not listed here keep their config order and render on top of the
// listed ones within their beforeId group.
//
// This list is the code-based default order. It is planned to move to a DB table editable
// via an admin drag-and-drop UI (see LAYER_SORTING_REQUIREMENTS.md §3.1).
export const atlasLayerOrder: readonly string[] = []
