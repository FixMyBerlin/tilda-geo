import dompurify from 'dompurify'
import { OsmUserLink } from '@/components/regionen/pageRegionSlug/SidebarInspector/OsmUserLink'
import type { NoteComment } from '@/server/notes/queries/getNoteAndComments.server'
import { ModeComment } from '../../ModeComment'
import { ModeCommentMarkdown } from '../../ModeCommentMarkdown'
import { ModeCommentTime } from '../../ModeCommentTime'
import { EditNoteCommentForm } from './EditNoteCommentForm'
import { useIsAuthor } from './utils/useIsAuthor'

type Props = {
  comment: NoteComment
}

export const InternalNoteComment = ({ comment }: Props) => {
  const isAuthor = useIsAuthor(comment.author.id)

  return (
    <ModeComment
      actions={isAuthor ? <EditNoteCommentForm comment={comment} /> : undefined}
      body={<ModeCommentMarkdown variant="notes" markdown={dompurify.sanitize(comment.body)} />}
      author={
        <OsmUserLink
          firstName={comment.author?.firstName}
          lastName={comment.author?.lastName}
          osmName={comment.author.osmName}
          showMembership={false}
        />
      }
      date={<ModeCommentTime createdAt={comment.createdAt} updatedAt={comment.updatedAt} />}
    />
  )
}
