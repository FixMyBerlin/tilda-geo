import { SmallSpinner } from '@/src/app/_components/Spinner/SmallSpinner'
import getNotesAndCommentsForRegion from '@/src/server/notes/queries/getNotesAndCommentsForRegion'
import { ErrorBoundary } from '@blitzjs/next'
import { useQuery } from '@blitzjs/rpc'
import { Suspense } from 'react'
import {
  useInternalNotesFilterParam,
  useNewInternalNoteMapParam,
} from '../../../_hooks/useQueryState/useNotesAtlasParams'
import { useRegionSlug } from '../../regionUtils/useRegionSlug'
import { NotesNew } from '../NotesNew/NotesNew'
import { NotesNewMap } from '../NotesNew/NotesNewMap'
import { InternalNotesControls } from './InteralNotesControls'
import { InternalNotesNewForm } from './InternalNotesNewForm'
import { useAllowInternalNotes } from './utils/useAllowInternalNotes'
import { useQueryKey } from './utils/useQueryKey'

export const InternalNotes = () => {
  const allowInternalNotes = useAllowInternalNotes()
  // This will not just hide the UI, but also prevent the query so no data is rendered on the map
  if (!allowInternalNotes) return null

  return (
    <Suspense fallback={<SmallSpinner />}>
      <InternalNotesSuspended />
    </Suspense>
  )
}

const InternalNotesSuspended = () => {
  const { newInternalNoteMapParam, setNewInternalNoteMapParam } = useNewInternalNoteMapParam()
  const { internalNotesFilterParam } = useInternalNotesFilterParam()

  const queryKey = useQueryKey()
  const regionSlug = useRegionSlug()!
  // For now, we load all notes. We will want to scope this to the viewport later.
  const [{ stats }, { isLoading, isError, error }] = useQuery(
    getNotesAndCommentsForRegion,
    { regionSlug, filter: internalNotesFilterParam },
    { queryKey },
  )

  if (isError) {
    console.error('Error when loading notes from', error)
  }

  return (
    <>
      <InternalNotesControls
        totalNotes={stats?.filteredTotal}
        isLoading={isLoading}
        isError={isError}
      />
      <NotesNew
        visible={Boolean(newInternalNoteMapParam)}
        title="Einen internen Hinweis hinterlassen"
      >
        <ErrorBoundary>
          <NotesNewMap
            mapId="newInternalNoteMap"
            newNoteMapParam={newInternalNoteMapParam}
            setNewNoteMapParam={setNewInternalNoteMapParam}
          />
        </ErrorBoundary>
        <InternalNotesNewForm />
      </NotesNew>
    </>
  )
}
