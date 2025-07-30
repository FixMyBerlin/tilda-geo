import { formatDateTime } from '@/src/app/_components/date/formatDate'
import { Markdown } from '@/src/app/_components/text/Markdown'
import { proseClasses } from '@/src/app/_components/text/prose'
import { NoteAndComments } from '@/src/server/notes/queries/getNoteAndComments'
import dompurify from 'dompurify'
import { twJoin } from 'tailwind-merge'
import { OsmUserLink } from '../OsmUserLink'
import { EditNoteForm } from './EditNoteForm'
import { EditNoteResolvedAtForm } from './EditNoteResolvedAtForm'
import { wasUpdated } from './utils/wasUpdated'

type Props = {
  note: NoteAndComments
}

export const InternalNote = ({ note }: Props) => {
  return (
    <>
      <div className="border-l-4 border-white pl-3">
        <Markdown
          markdown={
            // Hinweis: Ein leerer body kommt nur bei importieren Notes vor, da der `body` ein Pflichtfeld in allen Formularen ist.
            note.body ? dompurify.sanitize(note.body) : `_Es wurde nur ein Betreff angegeben._`
          }
          className={twJoin(
            proseClasses,
            'prose-sm prose-a:underline hover:prose-a:text-teal-700 hover:prose-a:decoration-teal-700',
          )}
        />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div>
          <div>
            <strong>
              <OsmUserLink
                firstName={note.author?.firstName}
                lastName={note.author?.lastName}
                osmName={note.author.osmName}
                showMembership={false}
              />
            </strong>
            {wasUpdated(note) ? <br /> : ', '}
            {formatDateTime(note.createdAt)}
            {wasUpdated(note) && <>, aktualisiert {formatDateTime(note.updatedAt)}</>}
          </div>

          <EditNoteResolvedAtForm note={note} />
        </div>

        <EditNoteForm note={note} />
      </div>
    </>
  )
}
