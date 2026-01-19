import { formatDateTime } from '@/src/app/_components/date/formatDate'
import { Markdown } from '@/src/app/_components/text/Markdown'
import { proseClasses } from '@/src/app/_components/text/prose'
import type { NoteComment } from '@/src/server/notes/queries/getNoteAndComments'
import dompurify from 'dompurify'
import { twJoin } from 'tailwind-merge'
import { OsmUserLink } from '../OsmUserLink'
import { EditNoteCommentForm } from './EditNoteCommentForm'
import { wasUpdated } from './utils/wasUpdated'

type Props = {
  comment: NoteComment
}

export const InternalNoteComment = ({ comment }: Props) => {
  return (
    <>
      <Markdown
        markdown={dompurify.sanitize(comment.body)}
        className={twJoin(
          proseClasses,
          'prose-sm prose-a:underline hover:prose-a:text-teal-700 hover:prose-a:decoration-teal-700 border-l-4 border-white pl-3',
        )}
      />

      <div className="relative mt-3 flex items-center justify-between">
        <div>
          <strong>
            <OsmUserLink
              firstName={comment.author?.firstName}
              lastName={comment.author?.lastName}
              osmName={comment.author.osmName}
              showMembership={false}
            />
          </strong>
          {wasUpdated(comment) ? <br /> : ', '}
          {formatDateTime(comment.createdAt)}
          {wasUpdated(comment) && <>, aktualisiert {formatDateTime(comment.updatedAt)}</>}
        </div>

        <EditNoteCommentForm comment={comment} />
      </div>
    </>
  )
}
