import { useQuery } from '@tanstack/react-query'
import { Layer, Source } from 'react-map-gl/maplibre'
import { useFeaturesParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/useFeaturesParam'
import {
  useHoveredListItem,
  useHoveredMapItemId,
} from '@/components/regionen/pageRegionSlug/modes/mode-list-store'
import {
  noteHighlightCirclePaint,
  noteHighlightFilter,
} from '@/components/regionen/pageRegionSlug/modes/notes/noteSelectRingPaint'
import { notesHighlightIds } from '@/components/regionen/pageRegionSlug/modes/notes/notesListHoverId'
import { notesModeToServerFilter } from '@/components/regionen/pageRegionSlug/modes/notes/notesModeParam'
import { useNoteFolders } from '@/components/regionen/pageRegionSlug/modes/notes/useNoteFolders'
import { useNotesModeValue } from '@/components/regionen/pageRegionSlug/modes/notes/useNotesModeParam'
import { useNotesSelection } from '@/components/regionen/pageRegionSlug/modes/notes/useNotesSelection'
import { useCurrentMode } from '@/components/regionen/pageRegionSlug/modes/useCurrentMode'
import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { internalNotesQueryOptions } from '@/server/regions/regionQueryOptions'

// Source and Layers are two components, see <AllSources> and <AllLayers>.

export const internalNotesLayerId = 'internal-notes-layer'
export const internalNotesSourceId = 'internal-notes-source'

// Both components use the same data and conditions, so the Layers never render without their Source.
const useInternalNotes = () => {
  const region = useRegion()
  const currentMode = useCurrentMode()
  const notesModeValue = useNotesModeValue()
  const notesSelection = useNotesSelection()
  const showLayers = currentMode.isNotes && notesSelection.kind === 'internal'
  // Map markers always follow the active folder, same query as the panel list.
  const { selectedFolderId } = useNoteFolders()
  const { data: result } = useQuery({
    ...internalNotesQueryOptions(
      region.slug,
      selectedFolderId,
      notesModeToServerFilter(notesModeValue),
    ),
    enabled: showLayers && selectedFolderId !== undefined,
  })

  if (result === undefined) return undefined
  if (!showLayers) return undefined
  return result
}

export const SourcesInternalNotes = () => {
  const result = useInternalNotes()
  if (result === undefined) return null

  return (
    <Source
      id={internalNotesSourceId}
      key={internalNotesSourceId}
      type="geojson"
      data={result.featureCollection}
      promoteId="id"
      // attribution="" Internal data / copyrighted
    />
  )
}

export const LayersInternalNotes = () => {
  const result = useInternalNotes()
  const { featuresParam } = useFeaturesParam()
  const hoveredListItem = useHoveredListItem()
  const hoveredMapItemId = useHoveredMapItemId()
  if (result === undefined) return null

  const selectedFeatureIds = featuresParam
    .filter((feature) => feature.sourceId === internalNotesSourceId)
    .map((feature) => Number(feature.id))
  const highlightIds = notesHighlightIds(
    selectedFeatureIds,
    hoveredListItem?.id,
    hoveredMapItemId,
    internalNotesSourceId,
  )

  return (
    <>
      <Layer
        id={`${internalNotesLayerId}-highlight`}
        key={`${internalNotesLayerId}-highlight`}
        source={internalNotesSourceId}
        type="circle"
        paint={noteHighlightCirclePaint}
        filter={noteHighlightFilter(highlightIds)}
      />
      <Layer
        id={internalNotesLayerId}
        key={internalNotesLayerId}
        source={internalNotesSourceId}
        type="symbol"
        layout={{
          visibility: 'visible',
          'icon-image': [
            'match',
            ['get', 'status'],
            // The sprites from Mapbox https://studio.mapbox.com/styles/hejco/cl706a84j003v14o23n2r81w7/edit/ => "sprites-fuer-atlas-notes-layer"
            'closed',
            'note-closed-intern' /* Checkmark */,
            'open',
            'note-open-intern' /* Questionmark */,
            'note-open-intern' /* fallback */,
          ],
          'icon-size': ['interpolate', ['linear'], ['zoom'], 0, 0.3, 10, 0.5, 22, 0.5],
          'icon-allow-overlap': true,
        }}
      />
    </>
  )
}
