import dompurify from 'dompurify'
import { OsmUserLink } from '@/components/regionen/pageRegionSlug/SidebarInspector/OsmUserLink'
import type { NoteAndComments } from '@/server/notes/queries/getNoteAndComments.server'
import { ModeComment } from '../../ModeComment'
import { ModeCommentMarkdown } from '../../ModeCommentMarkdown'
import { ModeCommentTime } from '../../ModeCommentTime'
import { EditNoteForm } from './EditNoteForm'
import { useIsAuthor } from './utils/useIsAuthor'

type Props = { note: NonNullable<NoteAndComments> }

export const InternalNote = ({ note }: Props) => {
  const isAuthor = useIsAuthor(note.author?.id ?? '')

  return (
    <ModeComment
      actions={isAuthor ? <EditNoteForm note={note} /> : undefined}
      body={
        <ModeCommentMarkdown
          variant="notes"
          markdown={
            // Hinweis: Ein leerer body kommt nur bei importieren Notes vor, da der `body` ein Pflichtfeld in allen Formularen ist.
            note.body ? dompurify.sanitize(note.body) : `_Es wurde nur ein Betreff angegeben._`
          }
        />
      }
      author={
        <OsmUserLink
          firstName={note.author?.firstName}
          lastName={note.author?.lastName}
          osmName={note.author.osmName}
          showMembership={false}
        />
      }
      date={<ModeCommentTime createdAt={note.createdAt} updatedAt={note.updatedAt} />}
    />
  )
}
