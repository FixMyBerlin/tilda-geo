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
import { useNotesModeValue } from '@/components/regionen/pageRegionSlug/modes/notes/useNotesModeParam'
import { useNotesSelection } from '@/components/regionen/pageRegionSlug/modes/notes/useNotesSelection'
import { useCurrentMode } from '@/components/regionen/pageRegionSlug/modes/useCurrentMode'
import { useFilteredOsmNotes } from './utils/useFilteredOsmNotes'

// Source and Layers are two components, see <AllSources> and <AllLayers>.

export const osmNotesLayerId = 'osm-notes-layer'
export const osmNotesSourceId = 'osm-notes-source'

// Both components use the same condition, so the Layers never render without their Source.
const useShowOsmNotes = () => {
  const currentMode = useCurrentMode()
  const notesSelection = useNotesSelection()
  return currentMode.isNotes && notesSelection.kind === 'osm'
}

export const SourcesOsmNotes = () => {
  const showLayers = useShowOsmNotes()
  const notesModeValue = useNotesModeValue()
  const filteredFeatures = useFilteredOsmNotes(
    showLayers ? notesModeToServerFilter(notesModeValue) : undefined,
  )
  if (!showLayers) return null

  return (
    <Source
      id={osmNotesSourceId}
      key={osmNotesSourceId}
      type="geojson"
      data={filteredFeatures}
      promoteId="id"
      attribution="Notes: openstreetmap.org"
    />
  )
}

export const LayersOsmNotes = () => {
  const showLayers = useShowOsmNotes()
  const { featuresParam } = useFeaturesParam()
  const hoveredListItem = useHoveredListItem()
  const hoveredMapItemId = useHoveredMapItemId()
  if (!showLayers) return null

  const selectedFeatureIds = featuresParam
    .filter((feature) => feature.sourceId === osmNotesSourceId)
    .map((feature) => Number(feature.id))
  const highlightIds = notesHighlightIds(
    selectedFeatureIds,
    hoveredListItem?.id,
    hoveredMapItemId,
    osmNotesSourceId,
  )

  return (
    <>
      {/* Highlight "tilda" notes */}
      <Layer
        id={`${osmNotesLayerId}-tilda`}
        key={`${osmNotesLayerId}-tilda`}
        source={osmNotesSourceId}
        type="circle"
        paint={{
          'circle-radius': 12,
          'circle-color': '#fed7aa', // orange-200 https://tailwindcss.com/docs/customizing-colors
        }}
        filter={['get', 'tilda']}
      />
      {/* Hover and selection: same disc under the icon. */}
      <Layer
        id={`${osmNotesLayerId}-highlight`}
        key={`${osmNotesLayerId}-highlight`}
        source={osmNotesSourceId}
        type="circle"
        paint={noteHighlightCirclePaint}
        filter={noteHighlightFilter(highlightIds)}
      />
      <Layer
        id={osmNotesLayerId}
        key={osmNotesLayerId}
        source={osmNotesSourceId}
        type="symbol"
        paint={{
          // See `useNotesActiveByZoom` about this opacity.
          // We will not load any data below a certain zoom level.
          // However, we want to still show what we loaded, so the context is preserved.
          'icon-opacity': ['step', ['zoom'], 0.3, 10, 1],
        }}
        layout={{
          visibility: 'visible',
          'icon-image': [
            'match',
            ['get', 'status'],
            'closed',
            'note-closed-osm' /* Checkmark */,
            'open',
            'note-open-osm' /* Questionmark */,
            'note-open-osm' /* fallback */,
          ],
          'icon-size': ['interpolate', ['linear'], ['zoom'], 0, 0.3, 10, 0.5, 22, 0.5],
          'icon-allow-overlap': true,
        }}
      />
    </>
  )
}
