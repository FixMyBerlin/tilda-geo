import { SourcesRasterBackgrounds } from './SourcesLayerRasterBackgrounds'
import { SourcesInternalNotes } from './SourcesLayersInternalNotes'
import { SourcesOsmNotes } from './SourcesLayersOsmNotes'
import { SourcesQa } from './SourcesLayersQa'
import { SourcesStaticDatasets } from './SourcesLayersStaticDatasets'
import { SourcesSystemDatasets } from './SourcesLayersSystemDatasets'
import { SourcesTilda } from './SourcesLayersTilda'

// The Sources of the Layers in <AllLayers>. The order of Sources has no effect on the map.
export const AllSources = () => {
  return (
    <>
      <SourcesRasterBackgrounds />
      <SourcesSystemDatasets />
      <SourcesTilda />
      <SourcesStaticDatasets />
      <SourcesOsmNotes />
      <SourcesInternalNotes />
      <SourcesQa />
    </>
  )
}
