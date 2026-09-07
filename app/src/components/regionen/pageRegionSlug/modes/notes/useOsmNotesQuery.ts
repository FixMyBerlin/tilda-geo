import { useQuery } from '@tanstack/react-query'
import { useMapLoaded } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useCurrentMode } from '@/components/regionen/pageRegionSlug/modes/useCurrentMode'
import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { osmNotesQueryOptions } from './osmNotesQueryOptions'
import { useNotesActiveByZoom } from './useNotesActiveByZoom'
import { useOsmNotesBbox } from './useOsmNotesBbox'

/** Shared OSM-notes query; `enabled` is the fetch gate, cached/placeholder data still reads. */
export const useOsmNotesQuery = () => {
  const mapLoaded = useMapLoaded()
  const isNotesMode = useCurrentMode() === 'notes'
  const region = useRegion()
  const notesActiveByZoom = useNotesActiveByZoom()
  const bbox = useOsmNotesBbox()

  return useQuery({
    ...osmNotesQueryOptions({ bbox }),
    enabled: mapLoaded && Boolean(bbox) && isNotesMode && region.notesOsm && notesActiveByZoom,
  })
}
