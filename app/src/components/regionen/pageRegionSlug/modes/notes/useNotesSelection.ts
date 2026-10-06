import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { useHasPermissions } from '@/components/shared/hooks/useHasPermissions'
import { resolveNotesSelection } from './notesSelection'
import { useNotesModeValue } from './useNotesModeParam'

/** OSM vs TILDA collection from region flags, membership, and `notes.key`. */
export const useNotesSelection = () => {
  const region = useRegion()
  const hasPermissions = useHasPermissions()
  const notesMode = useNotesModeValue()

  return resolveNotesSelection({
    hasInternalNotes: Boolean(region.notesInternal && hasPermissions),
    hasOsmNotes: Boolean(region.notesOsm),
    key: notesMode.key,
  })
}
