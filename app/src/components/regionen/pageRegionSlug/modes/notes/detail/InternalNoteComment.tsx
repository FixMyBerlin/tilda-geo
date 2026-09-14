import dompurify from 'dompurify'
import { modePanelMutedClassName } from '@/components/regionen/pageRegionSlug/modes/modePanel.const'
import { OsmUserLink } from '@/components/regionen/pageRegionSlug/SidebarInspector/OsmUserLink'
import { formatDateTime } from '@/components/shared/date/formatDate'
import type { NoteComment } from '@/server/notes/queries/getNoteAndComments.server'
import { ModeCommentMarkdown } from '../../ModeCommentMarkdown'
import { EditNoteCommentForm } from './EditNoteCommentForm'
import { wasUpdated } from './utils/wasUpdated'

type Props = {
  comment: NoteComment
}

export const InternalNoteComment = ({ comment }: Props) => {
  return (
    <>
      <ModeCommentMarkdown variant="notes" markdown={dompurify.sanitize(comment.body)} />

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
