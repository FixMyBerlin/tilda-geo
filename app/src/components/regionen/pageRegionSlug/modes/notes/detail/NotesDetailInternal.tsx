import { useQuery } from '@tanstack/react-query'
import {
  modePanelMutedClassName,
  modePanelTintHairlineTopClassName,
} from '@/components/regionen/pageRegionSlug/modes/modePanel.const'
import { AdminLogDataButton } from '@/components/shared/debug/AdminLogDataButton'
import { useHasPermissions } from '@/components/shared/hooks/useHasPermissions'
import { Spinner } from '@/components/shared/Spinner/Spinner'
import { getNoteAndCommentsFn } from '@/server/notes/notes.functions'
import { InternalNote } from './InternalNote'
import { InternalNoteComment } from './InternalNoteComment'
import { NewNoteCommentForm } from './NewNoteCommentForm'

type Props = {
  noteId: number
}

export const NotesDetailInternal = ({ noteId }: Props) => {
  const hasPermissions = useHasPermissions()
  const {
    data: noteAndComments,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['notes', 'getNoteAndComments', { id: noteId }],
    queryFn: () => getNoteAndCommentsFn({ data: { id: noteId } }),
  })

  if (!hasPermissions) return null
  if (isLoading) {
    return <Spinner className="my-3" size="5" />
  }
  if (isError || !noteAndComments) {
    return (
      <p className={`px-3 py-5 ${modePanelMutedClassName}`}>Hinweis konnte nicht geladen werden.</p>
    )
  }

  return (
    <div>
      <section className="px-3 py-5">
        <InternalNote note={noteAndComments} />

        <ul>
          {noteAndComments.noteComments?.map((comment) => {
            return (
              <li key={comment.id} className={`mt-5 ${modePanelTintHairlineTopClassName} pt-5`}>
                <InternalNoteComment comment={comment} />
              </li>
            )
          })}
          <li className={`mt-5 ${modePanelTintHairlineTopClassName} pt-5`}>
            <NewNoteCommentForm noteId={noteAndComments.id} />
          </li>
        </ul>
      </section>

      <div className="px-3 pb-3">
        <AdminLogDataButton data={noteAndComments} />
      </div>
    </div>
  )
}
