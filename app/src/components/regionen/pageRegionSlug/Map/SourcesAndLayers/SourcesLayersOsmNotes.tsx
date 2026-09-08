import { Layer, Source } from 'react-map-gl/maplibre'
import { useFeaturesParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/useFeaturesParam'
import { noteSelectRingPaint } from '@/components/regionen/pageRegionSlug/modes/notes/noteSelectRingPaint'
import { notesModeToServerFilter } from '@/components/regionen/pageRegionSlug/modes/notes/notesModeParam'
import { useNotesModeValue } from '@/components/regionen/pageRegionSlug/modes/notes/useNotesModeParam'
import { useCurrentMode } from '@/components/regionen/pageRegionSlug/modes/useCurrentMode'
import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { useFilteredOsmNotes } from './utils/useFilteredOsmNotes'

export const osmNotesLayerId = 'osm-notes-layer'
export const osmNotesSourceId = 'osm-notes-source'

export const SourcesLayersOsmNotes = () => {
  const region = useRegion()
  const { featuresParam } = useFeaturesParam()
  const isNotesMode = useCurrentMode() === 'notes'
  const notesModeValue = useNotesModeValue()
  const showLayers = isNotesMode && region.notesOsm
  const filteredFeatures = useFilteredOsmNotes(
    showLayers ? notesModeToServerFilter(notesModeValue) : undefined,
  )

  if (!showLayers) return null

  const selectedFeatureIds = featuresParam
    .filter((feature) => feature.sourceId === osmNotesSourceId)
    .map((feature) => Number(feature.id))

  return (
    <>
      <Source
        id={osmNotesSourceId}
        key={osmNotesSourceId}
        type="geojson"
        data={filteredFeatures}
        attribution="Notes: openstreetmap.org"
      />
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
      {/* Selection ring under the icon (same as LayerHighlight for symbols). */}
      <Layer
        id={`${osmNotesLayerId}-selected`}
        key={`${osmNotesLayerId}-selected`}
        source={osmNotesSourceId}
        type="circle"
        paint={noteSelectRingPaint}
        filter={
          selectedFeatureIds.length > 0 ? ['in', 'id', ...selectedFeatureIds] : ['literal', false]
        }
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
            // The sprites from Mapbox https://studio.mapbox.com/styles/hejco/cl706a84j003v14o23n2r81w7/edit/ => "sprites-fuer-atlas-notes-layer"
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
