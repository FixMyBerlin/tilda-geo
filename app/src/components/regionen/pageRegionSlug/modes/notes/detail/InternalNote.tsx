import dompurify from 'dompurify'
import { modePanelMutedClassName } from '@/components/regionen/pageRegionSlug/modes/modePanel.const'
import { OsmUserLink } from '@/components/regionen/pageRegionSlug/SidebarInspector/OsmUserLink'
import { formatDateTime } from '@/components/shared/date/formatDate'
import type { NoteAndComments } from '@/server/notes/queries/getNoteAndComments.server'
import { ModeCommentMarkdown } from '../../ModeCommentMarkdown'
import { EditNoteForm } from './EditNoteForm'
import { EditNoteResolvedAtForm } from './EditNoteResolvedAtForm'
import { wasUpdated } from './utils/wasUpdated'

type Props = { note: NonNullable<NoteAndComments> }

export const InternalNote = ({ note }: Props) => {
  return (
    <>
      <ModeCommentMarkdown
        variant="notes"
        markdown={
          // Hinweis: Ein leerer body kommt nur bei importieren Notes vor, da der `body` ein Pflichtfeld in allen Formularen ist.
          note.body ? dompurify.sanitize(note.body) : `_Es wurde nur ein Betreff angegeben._`
        }
      />

      <div className="mt-3 flex items-center justify-between">
        <div>
          <div className={modePanelMutedClassName}>
            <strong className="font-medium text-gray-700">
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

          <EditNoteResolvedAtForm key={note.id} note={note} />
        </div>

        <EditNoteForm note={note} />
      </div>
    </>
  )
}
