import dompurify from 'dompurify'
import { twJoin } from 'tailwind-merge'
import { ObjectDump } from '@/components/admin/ObjectDump'
import {
  modeAccentTintClassName,
  modeAccentTintEmphasisClassName,
} from '@/components/regionen/pageRegionSlug/modes/modeIdentity'
import { useOsmNotesQuery } from '@/components/regionen/pageRegionSlug/modes/notes/useOsmNotesQuery'
import { SvgNotesCheckmark } from '@/components/regionen/pageRegionSlug/SidebarInspector/icons/SvgNotesCheckmark'
import { SvgNotesQuestionmark } from '@/components/regionen/pageRegionSlug/SidebarInspector/icons/SvgNotesQuestionmark'
import { OsmUserLink } from '@/components/regionen/pageRegionSlug/SidebarInspector/OsmUserLink'
import { authClient } from '@/components/shared/auth/auth-client'
import { formatDateTime } from '@/components/shared/date/formatDate'
import { Link } from '@/components/shared/links/Link'
import { proseClasses } from '@/components/shared/text/prose'
import { getOsmUrl } from '@/components/shared/utils/getOsmUrl'
import { isDev } from '@/components/shared/utils/isEnv'

type Props = {
  noteId: number
}

export const NotesDetailOsm = ({ noteId }: Props) => {
  const { data: session } = authClient.useSession()
  const osmName = session?.user?.additionalFields?.osmName || null
  const { data: osmNotesFeatures } = useOsmNotesQuery()

  // Look up the thread from the Query cache rather than MapLibre properties
  // (those are escaped, so properties.comments is stringified).
  const thread = osmNotesFeatures?.features.find((f) => f.properties.id === noteId)?.properties

  if (!thread) return null

  return (
    <div>
      {thread.comments?.map((comment, index) => {
        const firstComment = index === 0
        const splitDate = comment.date.split(' ')
        const date = new Date(`${splitDate[0]}T${splitDate[1]}Z`)
        const formattedDate = formatDateTime(date)
        const userHasPermssionOnRegion = comment.user === osmName

        return (
          <section
            key={`${thread.id}-${comment.date}`}
            className={twJoin(
              'border-b border-b-gray-200 px-3 py-5',
              userHasPermssionOnRegion ? modeAccentTintEmphasisClassName : modeAccentTintClassName,
            )}
          >
            <div className="text-black">
              <strong>
                <OsmUserLink osmName={comment.user} />
              </strong>{' '}
              kommentierte am {formattedDate}:
            </div>

            <div
              // oxlint-disable-next-line react/no-danger -- sanitized with DOMPurify
              dangerouslySetInnerHTML={{ __html: dompurify.sanitize(comment.html) }}
              className={twJoin(
                proseClasses,
                'my-2 prose-sm border-l-4 border-white pl-3 prose-a:underline hover:prose-a:text-yellow-700 hover:prose-a:decoration-yellow-700',
              )}
            />
            {!firstComment && comment.action === 'opened' && (
              <p>
                <em>Der Hinweis wurde erneut geöffnet.</em>
              </p>
            )}
            {comment.action === 'closed' && (
              <p>
                <em>Der Hinweis wurde geschlossen.</em>
              </p>
            )}
          </section>
        )
      })}
      <div className="space-y-3 px-3 py-3">
        <p>Erstellt am {thread.date_created}</p>
        <p className="flex items-center gap-2">
          Status:{' '}
          {thread.status === 'closed' && (
            <span className="inline-flex gap-1">
              <SvgNotesCheckmark className="size-5 text-teal-800" />
              geschlossen
            </span>
          )}
          {thread.status === 'open' && (
            <span className="inline-flex gap-1">
              <SvgNotesQuestionmark className="size-5 text-teal-800" />
              offen
            </span>
          )}
        </p>
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
