import { useQuery } from '@tanstack/react-query'
import { Layer, Source } from 'react-map-gl/maplibre'
import { useMapInspectorFeatures } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import {
  useInternalNotesFilterParam,
  useShowInternalNotesParam,
} from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useNotesAtlasParams'
import { useAllowInternalNotes } from '@/components/regionen/pageRegionSlug/notes/InternalNotes/utils/useAllowInternalNotes'
import { useStaticRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useStaticRegion'
import { internalNotesQueryOptions } from '@/server/regions/regionQueryOptions'

export const internalNotesLayerId = 'internal-notes-layer'
export const internalNotesSourceId = 'internal-notes-source'

export const SourcesLayersInternalNotes = () => {
  const { showInternalNotesParam } = useShowInternalNotesParam()
  const region = useStaticRegion()
  const allowInternalNotes = useAllowInternalNotes()
  const inspectorFeatures = useMapInspectorFeatures()

  const { internalNotesFilterParam } = useInternalNotesFilterParam()

  const { data: result } = useQuery({
    ...internalNotesQueryOptions(region.slug, internalNotesFilterParam),
    enabled: allowInternalNotes,
  })
  if (result === undefined) return null
  if (!allowInternalNotes) return null

  const selectedFeatureIds = inspectorFeatures
    .filter((feature) => feature.source === internalNotesSourceId)
    .map((feature) => (feature?.properties?.id || 0) as number)

  return (
    <>
      <Source
        id={internalNotesSourceId}
        key={internalNotesSourceId}
        type="geojson"
        data={result.featureCollection}
        // attribution="" Internal data / copyrighted
      />
      {showInternalNotesParam && (
        <>
          <Layer
            id={`${internalNotesLayerId}-hover`}
            key={`${internalNotesLayerId}-hover`}
            source={internalNotesSourceId}
            type="circle"
            paint={{
              'circle-radius': 12,
              'circle-color': '#f9a8d4', // pink-300 https://tailwindcss.com/docs/customizing-colors
            }}
            filter={['in', 'id', ...selectedFeatureIds]}
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
      )}
    </>
  )
}
