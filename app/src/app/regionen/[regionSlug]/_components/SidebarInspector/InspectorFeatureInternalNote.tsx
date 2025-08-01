import { Spinner } from '@/src/app/_components/Spinner/Spinner'
import { isDev } from '@/src/app/_components/utils/isEnv'
import { useHasPermissions } from '@/src/app/_hooks/useHasPermissions'
import { ObjectDump } from '@/src/app/admin/_components/ObjectDump'
import getNoteAndComments from '@/src/server/notes/queries/getNoteAndComments'
import { useQuery } from '@blitzjs/rpc'
import { Suspense } from 'react'
import { Disclosure } from './Disclosure/Disclosure'
import { InternalNote } from './InspectorFeatureInternalNote/InternalNote'
import { InternalNoteComment } from './InspectorFeatureInternalNote/InternalNoteComment'
import { NewNoteCommentForm } from './InspectorFeatureInternalNote/NewNoteCommentForm'

type Props = {
  noteId: number
}

export const InspectorFeatureInternalNoteWithQuery = ({ noteId }: Props) => {
  const [noteAndComments] = useQuery(getNoteAndComments, { id: noteId })

  // All users with permissions on the region may also read notes and commens
  const hasPermissions = useHasPermissions()
  if (!hasPermissions) {
    return null
  }

  return (
    <div className="mt-5 w-full rounded-2xl">
      <Disclosure
        title={noteAndComments.subject}
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
    </div>
  )
}

export const InspectorFeatureInternalNote = ({ noteId }: Props) => {
  return (
    <Suspense fallback={<Spinner className="my-3" size="5" />}>
      <InspectorFeatureInternalNoteWithQuery noteId={noteId} />
    </Suspense>
  )
}
