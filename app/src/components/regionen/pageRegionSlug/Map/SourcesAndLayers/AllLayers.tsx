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
// so layers can be ordered independent of their Source.
//
// Two ordering mechanisms:
// 1. `beforeId` splices each layer into the basemap at an anchor layer (groups).
//    https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/LayerSpecification/#beforeid
// 2. Within a beforeId group, the mount order below defines the stacking (bottom → top).
//    Atlas-Geo layers are additionally sorted by the admin-managed DB order (empty table:
//    preserve JSX config order).
// Layers toggle via `layout.visibility`, never mount/unmount, so this order stays stable.
//
// Only Atlas-Geo layers are freely sortable via the admin UI. The group blocks below have
// fixed relative positions; interleaving between groups happens only at anchor-group level
// via beforeId.
export const AllLayers = () => {
  return (
    <>
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
