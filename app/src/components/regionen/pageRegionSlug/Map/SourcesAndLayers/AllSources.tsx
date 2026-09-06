import { SourcesRasterBackgrounds } from './SourcesLayerRasterBackgrounds'
import { SourcesAtlasGeo } from './SourcesLayersAtlasGeo'
import { SourcesInternalNotes } from './SourcesLayersInternalNotes'
import { SourcesOsmNotes } from './SourcesLayersOsmNotes'
import { SourcesQa } from './SourcesLayersQa'
import { SourcesStaticDatasets } from './SourcesLayersStaticDatasets'
import { SourcesSystemDatasets } from './SourcesLayersSystemDatasets'

// All map Sources, rendered separately from the Layers (see <AllLayers>).
// Source mount order has no effect on the map; layer stacking is defined in <AllLayers>.
export const AllSources = () => {
  return (
    <>
      <SourcesRasterBackgrounds />
      <SourcesSystemDatasets />
      <SourcesAtlasGeo />
      <SourcesStaticDatasets />
      <SourcesOsmNotes />
      <SourcesInternalNotes />
      <SourcesQa />
    </>
  )
}
