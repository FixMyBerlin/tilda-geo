import dompurify from 'dompurify'
import { twJoin } from 'tailwind-merge'
import { ObjectDump } from '@/components/admin/ObjectDump'
import { ModeComment } from '@/components/regionen/pageRegionSlug/modes/ModeComment'
import { ModeCommentMarkdown } from '@/components/regionen/pageRegionSlug/modes/ModeCommentMarkdown'
import {
  modePanelTintContentRailClassName,
  modePanelTintHairlineBottomClassName,
} from '@/components/regionen/pageRegionSlug/modes/modePanel.const'
import { NotesOpenClosedBadge } from '@/components/regionen/pageRegionSlug/modes/notes/notesStatusBadge'
import { useOsmNotesQuery } from '@/components/regionen/pageRegionSlug/modes/notes/useOsmNotesQuery'
import { SvgNotesCheckmark } from '@/components/regionen/pageRegionSlug/SidebarInspector/icons/SvgNotesCheckmark'
import { SvgNotesQuestionmark } from '@/components/regionen/pageRegionSlug/SidebarInspector/icons/SvgNotesQuestionmark'
import { OsmUserLink } from '@/components/regionen/pageRegionSlug/SidebarInspector/OsmUserLink'
import { TimeWithRelativeTooltip } from '@/components/shared/date/TimeWithRelativeTooltip'
import { Link } from '@/components/shared/links/Link'
import { proseClasses } from '@/components/shared/text/prose'
import { getOsmUrl } from '@/components/shared/utils/getOsmUrl'
import { isDev } from '@/components/shared/utils/isEnv'

const osmCommentBodyClassName = twJoin(
  'mb-0 min-w-0 leading-snug wrap-anywhere prose-p:my-1 prose-p:leading-snug prose-a:wrap-anywhere prose-a:text-inherit prose-a:underline prose-a:decoration-current prose-a:underline-offset-4 prose-a:hover:text-gray-950 prose-blockquote:my-1.5 prose-blockquote:border-sky-700/30 prose-blockquote:text-gray-700 prose-ol:list-inside prose-ol:ps-0 prose-ol:leading-snug prose-ul:list-inside prose-ul:ps-0 prose-ul:leading-snug prose-li:ps-0 prose-li:marker:text-white/80',
)

export const NotesDetailOsmStatusBadge = ({ noteId }: { noteId: number }) => {
  const { data: osmNotesFeatures } = useOsmNotesQuery()
  const thread = osmNotesFeatures?.features.find((f) => f.properties.id === noteId)?.properties
  if (!thread) return null

  return <NotesOpenClosedBadge status={thread.status} />
}

export const NotesDetailOsmHeaderMeta = ({ noteId }: { noteId: number }) => {
  const { data: osmNotesFeatures } = useOsmNotesQuery()
  const thread = osmNotesFeatures?.features.find((f) => f.properties.id === noteId)?.properties
  if (!thread) return null

  return (
    <span className="inline-flex items-center gap-1">
      Erstellt <TimeWithRelativeTooltip date={thread.date_created} timeClassName="text-inherit" />
    </span>
  )
}

type Props = {
  noteId: number
}

export const NotesDetailOsm = ({ noteId }: Props) => {
  const { data: osmNotesFeatures } = useOsmNotesQuery()

  // Look up the thread from the Query cache rather than MapLibre properties
  // (those are escaped, so properties.comments is stringified).
  const thread = osmNotesFeatures?.features.find((f) => f.properties.id === noteId)?.properties

  if (!thread) return null

  return (
    <div>
      {thread.comments?.map((comment, index) => {
        const firstComment = index === 0

        return (
          <section
            key={`${noteId}-${index}-${comment.date.toISOString()}`}
            className={`${modePanelTintHairlineBottomClassName} px-3 pt-3.5 pb-4`}
          >
            <ModeComment
              body={
                comment.text ? (
                  <ModeCommentMarkdown
                    key={`${noteId}-${index}-md`}
                    variant="notes"
                    markdown={comment.text}
                    className={osmCommentBodyClassName}
                  />
                ) : (
                  <div
                    // oxlint-disable-next-line react/no-danger -- OSM HTML; markdown text missing
                    dangerouslySetInnerHTML={{ __html: dompurify.sanitize(comment.html) }}
                    className={twJoin(
                      proseClasses,
                      osmCommentBodyClassName,
                      modePanelTintContentRailClassName,
                    )}
                  />
                )
              }
              author={<OsmUserLink osmName={comment.user} />}
              date={<TimeWithRelativeTooltip date={comment.date} timeClassName="text-inherit" />}
            >
              {!firstComment && comment.action === 'opened' && (
                <p className="mt-2 flex items-center gap-1 text-sm italic">
                  <SvgNotesQuestionmark className="size-4 shrink-0 text-teal-700" />
                  Der Hinweis wurde erneut geöffnet.
                </p>
              )}
              {comment.action === 'closed' && (
                <p className="mt-2 flex items-center gap-1 text-sm italic">
                  <SvgNotesCheckmark className="size-4 shrink-0 text-teal-700" />
                  Der Hinweis wurde geschlossen.
                </p>
              )}
            </ModeComment>
          </section>
        )
      })}
      <div className="space-y-3 px-3 py-3">
        <p>
          <Link button blank href={getOsmUrl(`/note/${thread.id}`)}>
            Auf openstreetmap.org ansehen und kommentieren
          </Link>
        </p>
      </div>

      {isDev && <ObjectDump data={thread} />}
    </div>
  )
}
