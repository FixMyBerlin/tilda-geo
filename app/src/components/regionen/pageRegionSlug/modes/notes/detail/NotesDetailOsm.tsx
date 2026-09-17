import dompurify from 'dompurify'
import { twJoin } from 'tailwind-merge'
import { ObjectDump } from '@/components/admin/ObjectDump'
import { ModeCommentMarkdown } from '@/components/regionen/pageRegionSlug/modes/ModeCommentMarkdown'
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
  'mt-2 mb-0 min-w-0 border-white leading-snug wrap-anywhere prose-p:my-1 prose-p:leading-snug prose-a:wrap-anywhere prose-a:underline prose-a:hover:text-yellow-700 prose-a:hover:decoration-yellow-700 prose-blockquote:my-1.5 prose-blockquote:border-sky-700/30 prose-blockquote:text-gray-700 prose-ol:leading-snug prose-ul:leading-snug',
)

export const NotesDetailOsmStatusBadge = ({ noteId }: { noteId: number }) => {
  const { data: osmNotesFeatures } = useOsmNotesQuery()
  const thread = osmNotesFeatures?.features.find((f) => f.properties.id === noteId)?.properties
  if (!thread) return null

  const isClosed = thread.status === 'closed'
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white py-0.5 pr-2 pl-0.5 text-xs font-medium text-gray-900"
      title={isClosed ? 'geschlossen' : 'offen'}
    >
      {isClosed ? (
        <SvgNotesCheckmark className="size-4 text-teal-700" />
      ) : (
        <SvgNotesQuestionmark className="size-4 text-teal-700" />
      )}
      {isClosed ? 'geschlossen' : 'offen'}
    </span>
  )
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
            className="border-b border-b-gray-200 px-3 pt-3.5 pb-4"
          >
            <div className="min-w-0 text-sm leading-5 text-black">
              <strong>
                <OsmUserLink osmName={comment.user} />
              </strong>{' '}
              kommentierte am{' '}
              <TimeWithRelativeTooltip date={comment.date} timeClassName="text-inherit" />:
            </div>

            {comment.text ? (
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
                className={twJoin(proseClasses, osmCommentBodyClassName, 'border-l-4 pl-3')}
              />
            )}
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
