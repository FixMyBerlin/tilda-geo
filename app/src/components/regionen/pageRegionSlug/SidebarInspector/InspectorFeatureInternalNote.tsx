import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { ObjectDump } from '@/components/admin/ObjectDump'
import { useHasPermissions } from '@/components/shared/hooks/useHasPermissions'
import { Spinner } from '@/components/shared/Spinner/Spinner'
import { isDev } from '@/components/shared/utils/isEnv'
import { getNoteAndCommentsFn } from '@/server/notes/notes.functions'
import { Disclosure } from './Disclosure/Disclosure'
import { InternalNote } from './InspectorFeatureInternalNote/InternalNote'
import { InternalNoteComment } from './InspectorFeatureInternalNote/InternalNoteComment'
import { NewNoteCommentForm } from './InspectorFeatureInternalNote/NewNoteCommentForm'

type Props = {
  noteId: number
}

export const InspectorFeatureInternalNote = ({ noteId }: Props) => {
  const hasPermissions = useHasPermissions()
  const { data: noteAndComments, isLoading } = useQuery({
    queryKey: ['notes', 'getNoteAndComments', { id: noteId }],
    queryFn: () => getNoteAndCommentsFn({ data: { id: noteId } }),
  })

  if (!hasPermissions) return null
  if (isLoading) {
    return <Spinner className="my-3" size="5" />
  }
  if (!noteAndComments) {
    return <Spinner className="my-3" size="5" />
  }

  return (
    <Disclosure
      title={
        <span className="inline-flex items-center gap-2 leading-tight">
          <ChatBubbleLeftRightIcon className="size-4 flex-none" aria-hidden="true" />
          {noteAndComments.subject}
        </span>
      }
      objectId={String(noteAndComments.id)}
      showLockIcon={true}
    >
      <section className="bg-blue-50 px-3 py-5">
        <InternalNote note={noteAndComments} />

        <ul>
          {noteAndComments.noteComments?.map((comment) => {
            return (
              <li key={comment.id} className="mt-5 border-t border-t-gray-200 pt-5">
                <InternalNoteComment comment={comment} />
              </li>
            )
          })}
          <li className="mt-5 border-t border-t-gray-200 pt-5">
            <NewNoteCommentForm noteId={noteAndComments.id} />
          </li>
        </ul>
      </section>

      {isDev && <ObjectDump data={noteAndComments} />}
    </Disclosure>
  )
}
