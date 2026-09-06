import { LayersRasterBackgrounds } from './SourcesLayerRasterBackgrounds'
import { LayersAtlasGeo } from './SourcesLayersAtlasGeo'
import { LayersInternalNotes } from './SourcesLayersInternalNotes'
import { SourcesLayersMap3dBuildings } from './SourcesLayersMap3dBuildings'
import { SourcesLayersMap3dDem } from './SourcesLayersMap3dDem'
import { LayersOsmNotes } from './SourcesLayersOsmNotes'
import { LayersQa } from './SourcesLayersQa'
import { LayersStaticDatasets } from './SourcesLayersStaticDatasets'
import { LayersSystemDatasets } from './SourcesLayersSystemDatasets'

// All map Layers as one flat list, rendered separately from the Sources (see <AllSources>)
// so layers can be ordered independent of their Source. See LAYER_SORTING_REQUIREMENTS.md.
//
// Two ordering mechanisms:
// 1. `beforeId` splices each layer into the basemap at an anchor layer (groups).
// 2. Within a beforeId group, the mount order below defines the stacking (bottom → top).
//    Atlas-Geo layers are additionally sorted by the admin-managed DB order (empty table:
//    preserve JSX config order).
// Layers toggle via `layout.visibility`, never mount/unmount, so this order stays stable.
//
// BY DESIGN (see LAYER_SORTING_REQUIREMENTS.md): only Atlas-Geo layers are freely sortable.
// The group blocks below have fixed relative positions; interleaving between groups happens
// only at anchor-group level via beforeId. "Put an upload between two atlas layers" is not
// achievable via the admin UI — it requires a shared anchor group.
export const AllLayers = () => {
  return (
    <>
      {/* bottom → top */}
      <LayersRasterBackgrounds />
      <SourcesLayersMap3dDem />
      <SourcesLayersMap3dBuildings />
      <LayersSystemDatasets />
      <LayersAtlasGeo />
      <LayersStaticDatasets />
      <LayersOsmNotes />
      <LayersInternalNotes />
      <LayersQa />
    </>
  )
}
