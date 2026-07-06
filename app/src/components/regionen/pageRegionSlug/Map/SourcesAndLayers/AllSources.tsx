import { SourcesRasterBackgrounds } from './SourcesLayerRasterBackgrounds'
import { SourcesAtlasGeo } from './SourcesLayersAtlasGeo'
import { SourcesInternalNotes } from './SourcesLayersInternalNotes'
import { SourcesOsmNotes } from './SourcesLayersOsmNotes'
import { SourcesQa } from './SourcesLayersQa'
import { SourcesStaticDatasets } from './SourcesLayersStaticDatasets'
import { SourcesSystemDatasets } from './SourcesLayersSystemDatasets'

// All map Sources, rendered separately from the Layers (see <AllLayers>).
// The order of Sources has no effect on the map; layer order is defined in <AllLayers>.
// See LAYER_SORTING_REQUIREMENTS.md.
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
