import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { twMerge } from 'tailwind-merge'
import { useRegionSlug } from '@/components/regionen/pageRegionSlug/regionUtils/useRegionSlug'
import { TimeWithRelativeTooltip } from '@/components/shared/date/TimeWithRelativeTooltip'
import { buttonStyles, buttonStylesOnYellow } from '@/components/shared/links/styles'
import { ReviewEntryStatus } from '@/prisma/generated/enums'
import {
  createReviewEntryCommentFn,
  getReviewEntryFn,
  updateReviewEntryFn,
} from '@/server/review-lists/review-lists.functions'
import { formatUserDisplayName } from '@/shared/userDisplayName'
import { reviewCommentDraftId } from '../../composerDrafts/composerDraftIds'
import { ModeCommentComposer } from '../../ModeCommentComposer'
import { modePanelMutedClassName, modePanelTintHairlineTopClassName } from '../../modePanel.const'
import { REVIEW_ENTRY_MOVE_COLOR, REVIEW_ENTRY_MOVE_COLOR_LABEL } from '../reviewEntryMapColors'
import { STATUS_LABEL } from '../reviewListsModeFilters'
import { useReviewListsModeValue } from '../useReviewListsModeParam'
import { ReviewEntryComment } from './ReviewEntryComment'

type Props = { entryId: number }

export const ReviewEntryDetail = ({ entryId }: Props) => {
  const regionSlug = useRegionSlug()
  const { move: isMoveArmed } = useReviewListsModeValue()
  const queryClient = useQueryClient()

  const queryKey = ['review-lists', 'getReviewEntry', { regionSlug, entryId }] as const
  const { data: entry, isError } = useQuery({
    queryKey,
    queryFn: () => getReviewEntryFn({ data: { regionSlug, entryId } }),
  })

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey }),
      queryClient.invalidateQueries({
        queryKey: ['review-lists', 'getReviewEntriesForList'],
      }),
    ])

  const setStatus = useMutation({
    mutationFn: (status: (typeof ReviewEntryStatus)[keyof typeof ReviewEntryStatus]) =>
      updateReviewEntryFn({ data: { regionSlug, entryId, status } }),
    onSuccess: invalidate,
  })
  const addComment = useMutation({
    mutationFn: (body: string) =>
      createReviewEntryCommentFn({ data: { regionSlug, entryId, body } }),
    onSuccess: invalidate,
  })
  if (isError && !entry) {
    return (
      <p className={`px-4 py-4 ${modePanelMutedClassName}`}>
        Prüfeintrag konnte nicht geladen werden.
      </p>
    )
  }
  if (!entry) return null

  const createdByName = formatUserDisplayName(entry.createdBy)
  const updatedByName = formatUserDisplayName(entry.updatedBy)
  const wasUpdated = new Date(entry.updatedAt).getTime() !== new Date(entry.createdAt).getTime()

  return (
    <div>
      <div className="space-y-3 px-4 pt-4 pb-4">
        <div className="min-w-0 text-xs text-gray-500">
          <p className="truncate">
            {entry.source === 'MANUAL' ? 'Manuell erstellt' : 'Importiert'}{' '}
            <TimeWithRelativeTooltip date={entry.createdAt} timeClassName="text-inherit" />
            {createdByName ? ` von ${createdByName}` : null}
          </p>
          {wasUpdated ? (
            <p className="truncate">
              Zuletzt aktualisiert{' '}
              <TimeWithRelativeTooltip date={entry.updatedAt} timeClassName="text-inherit" />
              {updatedByName ? ` von ${updatedByName}` : null}
            </p>
          ) : null}
        </div>
        {isMoveArmed ? (
          <p className="text-xs text-gray-500">
            Geometrie-Bearbeitung ist aktiv (
            <span className="inline-flex items-center gap-1 font-medium text-gray-700">
              <span
                className="inline-block size-2.5 rounded-full"
                style={{ backgroundColor: REVIEW_ENTRY_MOVE_COLOR }}
                aria-hidden
              />
              {REVIEW_ENTRY_MOVE_COLOR_LABEL}
            </span>
            ). Das Element auf der Karte ziehen oder über die Werkzeugleiste Teile hinzufügen und
            löschen.
          </p>
        ) : null}

        <div className="isolate inline-flex rounded-md shadow-sm" role="group" aria-label="Status">
          {Object.values(ReviewEntryStatus).map((status) => (
            <button
              key={status}
              type="button"
              disabled={setStatus.isPending}
              onClick={() => setStatus.mutate(status)}
              className={twMerge(
                entry.status === status ? buttonStylesOnYellow : buttonStyles,
                '-ml-px rounded-none shadow-none first:ml-0 first:rounded-l-md last:rounded-r-md focus:z-10',
              )}
              aria-pressed={entry.status === status}
            >
              {STATUS_LABEL[status]}
            </button>
          ))}
        </div>

        {entry.properties &&
          typeof entry.properties === 'object' &&
          Object.keys(entry.properties).length > 0 && (
            <div>
              <h3 className="mb-1.5 text-xs font-medium text-gray-900">Attribute des Eintrags</h3>
              <dl className="divide-y divide-gray-950/10 overflow-hidden rounded-md border border-gray-950/10 text-xs">
                {Object.entries(entry.properties as Record<string, unknown>).map(([key, value]) => {
                  const display = String(value)
                  return (
                    <div
                      key={key}
                      className="grid grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)] items-baseline gap-x-2 px-2.5 py-1.5"
                    >
                      <dt className="truncate font-medium text-gray-500" title={key}>
                        {key}
                      </dt>
                      <dd className="truncate text-gray-900" title={display}>
                        {display}
                      </dd>
                    </div>
                  )
                })}
              </dl>
            </div>
          )}
      </div>

      <div className={modePanelTintHairlineTopClassName}>
        <ul className="px-4 pt-4 pb-5">
          {entry.comments.map((comment, index) => (
            <li
              key={comment.id}
              className={index === 0 ? undefined : `mt-5 ${modePanelTintHairlineTopClassName} pt-5`}
            >
              <ReviewEntryComment comment={comment} regionSlug={regionSlug} onSaved={invalidate} />
            </li>
          ))}
          <li
            className={
              entry.comments.length === 0
                ? undefined
                : `mt-5 ${modePanelTintHairlineTopClassName} pt-5`
            }
          >
            {entry.comments.length === 0 ? (
              <p className="mb-3 text-xs text-gray-400">Noch keine Kommentare.</p>
            ) : null}
            <ModeCommentComposer
              draftId={reviewCommentDraftId(entryId)}
              label="Kommentar (Markdown)"
              submitLabel="Kommentieren"
              placeholder="Kommentar hinzufügen…"
              onSubmit={async (body) => {
                await addComment.mutateAsync(body)
              }}
            />
          </li>
        </ul>
      </div>
    </div>
  )
}
