import { LayersRasterBackgrounds } from './SourcesLayerRasterBackgrounds'
import { LayersAtlasGeo } from './SourcesLayersAtlasGeo'
import { LayersInternalNotes } from './SourcesLayersInternalNotes'
import { SourcesLayersMap3dBuildings } from './SourcesLayersMap3dBuildings'
import { SourcesLayersMap3dDem } from './SourcesLayersMap3dDem'
import { LayersOsmNotes } from './SourcesLayersOsmNotes'
import { LayersQa } from './SourcesLayersQa'
import { LayersStaticDatasets } from './SourcesLayersStaticDatasets'
import { SourcesLayersStreetImagery } from './SourcesLayersStreetImagery'
import { LayersSystemDatasets } from './SourcesLayersSystemDatasets'

// All data layers of the map as one flat list, apart from their Sources (see <AllSources>).
// Layers that share a `beforeId` stack in the order of this list, the first one at the bottom.
// The same holds for layers without a `beforeId`, which sit on top of the whole map.
export const AllLayers = () => {
  return (
    <>
      <LayersRasterBackgrounds />
      {/* 3D and street imagery keep Source and Layers in one component. */}
      <SourcesLayersMap3dDem />
      <SourcesLayersMap3dBuildings />
      <LayersSystemDatasets />
      <LayersAtlasGeo />
      <LayersStaticDatasets />
      <SourcesLayersStreetImagery />
      <LayersOsmNotes />
      <LayersInternalNotes />
      <LayersQa />
    </>
  )
}
