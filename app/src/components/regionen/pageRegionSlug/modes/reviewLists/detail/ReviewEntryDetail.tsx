import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { twJoin, twMerge } from 'tailwind-merge'
import { useRegionSlug } from '@/components/regionen/pageRegionSlug/regionUtils/useRegionSlug'
import { formatRelativeTime } from '@/components/shared/date/relativeTime'
import { TimeWithRelativeTooltip } from '@/components/shared/date/TimeWithRelativeTooltip'
import { useHasPermissions } from '@/components/shared/hooks/useHasPermissions'
import { buttonStyles, buttonStylesOnYellow } from '@/components/shared/links/styles'
import { Markdown } from '@/components/shared/text/Markdown'
import { proseClasses } from '@/components/shared/text/prose'
import { ReviewEntryStatus } from '@/prisma/generated/enums'
import {
  createReviewEntryCommentFn,
  getReviewEntryFn,
  updateReviewEntryFn,
} from '@/server/review-lists/review-lists.functions'
import { reviewCommentDraftId } from '../../composerDrafts/composerDraftIds'
import { ModeCommentComposer } from '../../ModeCommentComposer'
import { modePanelMutedClassName } from '../../modePanel.const'
import { REVIEW_ENTRY_MOVE_COLOR, REVIEW_ENTRY_MOVE_COLOR_LABEL } from '../reviewEntryMapColors'
import { STATUS_LABEL } from '../reviewListsModeFilters'
import { useReviewListsModeValue } from '../useReviewListsModeParam'

type Props = { entryId: number }

export const ReviewEntryDetail = ({ entryId }: Props) => {
  const regionSlug = useRegionSlug()
  const hasPermissions = useHasPermissions()
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

  return (
    <div className="space-y-3 px-4 py-4">
      <div className="text-xs text-gray-500">
        {entry.source === 'MANUAL' ? 'Manuell erstellt' : 'Aus Upload'}
        {entry.createdBy?.osmName ? ` · ${entry.createdBy.osmName}` : ''}
      </div>
      {new Date(entry.updatedAt).getTime() !== new Date(entry.createdAt).getTime() ? (
        <div className="text-xs text-gray-500">
          Geändert <TimeWithRelativeTooltip date={entry.updatedAt} />
          {entry.updatedBy?.osmName ? ` von ${entry.updatedBy.osmName}` : ''}
        </div>
      ) : null}
      {hasPermissions ? (
        <p className="text-xs text-gray-500">
          {isMoveArmed ? (
            <>
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
            </>
          ) : (
            <>
              Mit dem Stift-Button oben die Geometrie-Bearbeitung starten (
              <span className="inline-flex items-center gap-1 font-medium text-gray-700">
                <span
                  className="inline-block size-2.5 rounded-full"
                  style={{ backgroundColor: REVIEW_ENTRY_MOVE_COLOR }}
                  aria-hidden
                />
                {REVIEW_ENTRY_MOVE_COLOR_LABEL}
              </span>
              ). Danach das Element auf der Karte ziehen.
            </>
          )}
        </p>
      ) : null}

      {/* Status */}
      <div className="isolate inline-flex rounded-md shadow-sm" role="group" aria-label="Status">
        {Object.values(ReviewEntryStatus).map((status) => (
          <button
            key={status}
            type="button"
            disabled={!hasPermissions || setStatus.isPending}
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

      {/* Display attributes from upload/drawing */}
      {entry.properties &&
        typeof entry.properties === 'object' &&
        Object.keys(entry.properties).length > 0 && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-xs text-gray-600">
            {Object.entries(entry.properties as Record<string, unknown>).map(([key, value]) => (
              <div key={key} className="contents">
                <dt className="font-medium text-gray-500">{key}</dt>
                <dd className="truncate">{String(value)}</dd>
              </div>
            ))}
          </dl>
        )}

      {/* Comments */}
      <div className="space-y-2 border-t border-gray-100 pt-2">
        <h3 className="text-xs font-semibold text-gray-600 uppercase">Kommentare</h3>
        {entry.comments.length === 0 && <p className="text-xs text-gray-400">Noch keine.</p>}
        {entry.comments.map((c) => (
          <div key={c.id} className="rounded bg-gray-50 px-2 py-1 text-xs">
            <div className="text-gray-500">
              {c.author?.osmName ?? 'Unbekannt'} · {formatRelativeTime(new Date(c.createdAt))}
            </div>
            <Markdown
              markdown={c.body}
              className={twJoin(
                proseClasses,
                'prose-sm prose-p:leading-tight prose-p:text-gray-800',
              )}
            />
          </div>
        ))}
        {hasPermissions ? (
          <ModeCommentComposer
            draftId={reviewCommentDraftId(entryId)}
            label="Kommentar (Markdown)"
            submitLabel="Kommentieren"
            placeholder="Kommentar hinzufügen…"
            onSubmit={async (body) => {
              await addComment.mutateAsync(body)
            }}
          />
        ) : null}
      </div>
    </div>
  )
}
