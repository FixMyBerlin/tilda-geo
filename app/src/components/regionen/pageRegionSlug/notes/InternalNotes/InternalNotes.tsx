import { useQuery } from '@tanstack/react-query'
import {
  useInternalNotesFilterParam,
  useNewInternalNoteMapParam,
} from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useNotesAtlasParams'
import { useRegionSlug } from '@/components/regionen/pageRegionSlug/regionUtils/useRegionSlug'
import { internalNotesQueryOptions } from '@/server/regions/regionQueryOptions'
import { NotesNew } from '../NotesNew/NotesNew'
import { NotesNewMap } from '../NotesNew/NotesNewMap'
import { InternalNotesControls } from './InternalNotesControls'
import { InternalNotesNewForm } from './InternalNotesNewForm'
import { useAllowInternalNotes } from './utils/useAllowInternalNotes'

export const InternalNotes = () => {
  const allowInternalNotes = useAllowInternalNotes()
  const { newInternalNoteMapParam, setNewInternalNoteMapParam } = useNewInternalNoteMapParam()
  const { internalNotesFilterParam } = useInternalNotesFilterParam()

  const regionSlug = useRegionSlug()
  const { data, isLoading, isError, error } = useQuery({
    ...internalNotesQueryOptions(regionSlug ?? '', internalNotesFilterParam),
    enabled: Boolean(regionSlug) && allowInternalNotes,
  })

  // This will not just hide the UI, but also prevent the query so no data is rendered on the map
  if (!allowInternalNotes) return null

  if (isError) {
    console.error('Error when loading notes from', error)
  }

  return (
    <>
      <InternalNotesControls
        totalNotes={data?.stats?.filteredTotal}
        isLoading={isLoading}
        isError={isError}
      />
      <NotesNew
        visible={Boolean(newInternalNoteMapParam)}
        title="Einen internen Hinweis hinterlassen"
      >
        <NotesNewMap
          mapId="newInternalNoteMap"
          newNoteMapParam={newInternalNoteMapParam}
          setNewNoteMapParam={setNewInternalNoteMapParam}
        />
        <InternalNotesNewForm />
      </NotesNew>
    </>
  )
}
