import dompurify from 'dompurify'
import { twJoin } from 'tailwind-merge'
import { modePanelMutedClassName } from '@/components/regionen/pageRegionSlug/modes/modePanel.const'
import { OsmUserLink } from '@/components/regionen/pageRegionSlug/SidebarInspector/OsmUserLink'
import { formatDateTime } from '@/components/shared/date/formatDate'
import { Markdown } from '@/components/shared/text/Markdown'
import { proseClasses } from '@/components/shared/text/prose'
import type { NoteComment } from '@/server/notes/queries/getNoteAndComments.server'
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
          'prose-sm border-l-4 border-gray-200 pl-3 prose-a:underline hover:prose-a:text-yellow-700 hover:prose-a:decoration-yellow-700',
        )}
      />

      <div className="relative mt-3 flex items-center justify-between">
        <div className={modePanelMutedClassName}>
          <strong className="font-medium text-gray-700">
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
