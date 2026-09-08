import { useQuery } from '@tanstack/react-query'
import { Layer, Source } from 'react-map-gl/maplibre'
import { useFeaturesParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/useFeaturesParam'
import { noteSelectRingPaint } from '@/components/regionen/pageRegionSlug/modes/notes/noteSelectRingPaint'
import { notesModeToServerFilter } from '@/components/regionen/pageRegionSlug/modes/notes/notesModeParam'
import { useAllowInternalNotes } from '@/components/regionen/pageRegionSlug/modes/notes/useAllowInternalNotes'
import { useNotesModeValue } from '@/components/regionen/pageRegionSlug/modes/notes/useNotesModeParam'
import { useCurrentMode } from '@/components/regionen/pageRegionSlug/modes/useCurrentMode'
import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { internalNotesQueryOptions } from '@/server/regions/regionQueryOptions'

export const internalNotesLayerId = 'internal-notes-layer'
export const internalNotesSourceId = 'internal-notes-source'

export const SourcesLayersInternalNotes = () => {
  const region = useRegion()
  const allowInternalNotes = useAllowInternalNotes()
  const { featuresParam } = useFeaturesParam()
  const isNotesMode = useCurrentMode() === 'notes'
  const notesModeValue = useNotesModeValue()
  const showLayers = isNotesMode && region.notesInternal && allowInternalNotes
  const { data: result } = useQuery({
    ...internalNotesQueryOptions(region.slug, notesModeToServerFilter(notesModeValue)),
    enabled: showLayers,
  })

  if (result === undefined) return null
  if (!showLayers) return null

  const selectedFeatureIds = featuresParam
    .filter((feature) => feature.sourceId === internalNotesSourceId)
    .map((feature) => Number(feature.id))

  return (
    <>
      <Source
        id={internalNotesSourceId}
        key={internalNotesSourceId}
        type="geojson"
        data={result.featureCollection}
        // attribution="" Internal data / copyrighted
      />
      {/* Selection ring under the icon. Always mounted so it stays below the symbol. */}
      <Layer
        id={`${internalNotesLayerId}-selected`}
        key={`${internalNotesLayerId}-selected`}
        source={internalNotesSourceId}
        type="circle"
        paint={noteSelectRingPaint}
        filter={
          selectedFeatureIds.length > 0 ? ['in', 'id', ...selectedFeatureIds] : ['literal', false]
        }
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
