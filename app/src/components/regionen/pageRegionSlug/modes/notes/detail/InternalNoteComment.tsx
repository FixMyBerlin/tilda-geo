import dompurify from 'dompurify'
import { OsmUserLink } from '@/components/regionen/pageRegionSlug/SidebarInspector/OsmUserLink'
import type { NoteComment } from '@/server/notes/queries/getNoteAndComments.server'
import { ModeCommentMarkdown } from '../../ModeCommentMarkdown'
import { EditNoteCommentForm } from './EditNoteCommentForm'
import { NotesCommentByline } from './NotesCommentByline'
import { NotesCommentStack } from './NotesCommentStack'
import { NotesCommentTime } from './NotesCommentTime'
import { useIsAuthor } from './utils/useIsAuthor'

type Props = {
  comment: NoteComment
}

export const InternalNoteComment = ({ comment }: Props) => {
  const isAuthor = useIsAuthor(comment.author.id)

  return (
    <NotesCommentStack actions={isAuthor ? <EditNoteCommentForm comment={comment} /> : undefined}>
      <ModeCommentMarkdown variant="notes" markdown={dompurify.sanitize(comment.body)} />

      <NotesCommentByline
        author={
          <OsmUserLink
            firstName={comment.author?.firstName}
            lastName={comment.author?.lastName}
            osmName={comment.author.osmName}
            showMembership={false}
          />
        }
        date={<NotesCommentTime createdAt={comment.createdAt} updatedAt={comment.updatedAt} />}
      />
    </NotesCommentStack>
  )
}
