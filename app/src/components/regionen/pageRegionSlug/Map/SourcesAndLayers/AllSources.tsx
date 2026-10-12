import { SourcesRasterBackgrounds } from './SourcesLayerRasterBackgrounds'
import { SourcesAtlasGeo } from './SourcesLayersAtlasGeo'
import { SourcesInternalNotes } from './SourcesLayersInternalNotes'
import { SourcesOsmNotes } from './SourcesLayersOsmNotes'
import { SourcesQa } from './SourcesLayersQa'
import { SourcesStaticDatasets } from './SourcesLayersStaticDatasets'
import { SourcesSystemDatasets } from './SourcesLayersSystemDatasets'

// The Sources of the Layers in <AllLayers>. The order of Sources has no effect on the map.
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
