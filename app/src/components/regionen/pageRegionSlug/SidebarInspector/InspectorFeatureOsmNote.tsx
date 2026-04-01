import dompurify from 'dompurify'
import { twJoin } from 'tailwind-merge'
import { ObjectDump } from '@/components/admin/ObjectDump'
import { useOsmNotesFeatures } from '@/components/regionen/pageRegionSlug/hooks/mapState/userMapNotes'
import { authClient } from '@/components/shared/auth/auth-client'
import { formatDateTime } from '@/components/shared/date/formatDate'
import { Link } from '@/components/shared/links/Link'
import { proseClasses } from '@/components/shared/text/prose'
import { getOsmUrl } from '@/components/shared/utils/getOsmUrl'
import { isDev } from '@/components/shared/utils/isEnv'
import { Disclosure } from './Disclosure/Disclosure'
import type { InspectorOsmNoteFeature } from './Inspector'
import { SvgNotesCheckmark } from './icons/SvgNotesCheckmark'
import { SvgNotesQuestionmark } from './icons/SvgNotesQuestionmark'
import { OsmUserLink } from './OsmUserLink'

type Props = Pick<InspectorOsmNoteFeature, 'feature'>

export const InspectorFeatureOsmNote = ({ feature }: Props) => {
  const { properties } = feature
  const { data: session } = authClient.useSession()
  const osmName = session?.user?.additionalFields?.osmName || null
  const osmNotesFeatures = useOsmNotesFeatures()

  // We look up our data from our internal store.
  // This is better than to use the properties from Maplibre directly
  // because those are escaped, so properties.comments is stringified.
  const thread = osmNotesFeatures.features.find(
    (f) => f.properties.id === properties?.id,
  )?.properties

  if (!thread) return null

  return (
    <Disclosure title="Öffentlicher Hinweis auf openstreetmap.org" objectId={String(thread.id)}>
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
              userHasPermssionOnRegion ? 'bg-teal-100/70' : 'bg-teal-50',
            )}
          >
            <div className="text-black">
              <strong>
                <OsmUserLink osmName={comment.user} />
              </strong>{' '}
              kommentierte am {formattedDate}:
            </div>

            <div
              // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized with DOMPurify
              dangerouslySetInnerHTML={{ __html: dompurify.sanitize(comment.html) }}
              className={twJoin(
                proseClasses,
                'prose-sm prose-a:underline hover:prose-a:text-teal-700 hover:prose-a:decoration-teal-700 my-2 border-l-4 border-white pl-3',
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
    </Disclosure>
  )
}
