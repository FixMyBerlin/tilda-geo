import { useNewInternalNoteMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useNotesAtlasParams'
import { useNewOsmNoteMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useNotesOsmParams'

/** True while creating a note: `osmNote` or `internalNote` is set in the URL. */
export const useNotesComposeActive = () => {
  const { newOsmNoteMapParam } = useNewOsmNoteMapParam()
  const { newInternalNoteMapParam } = useNewInternalNoteMapParam()
  return Boolean(newOsmNoteMapParam || newInternalNoteMapParam)
}
