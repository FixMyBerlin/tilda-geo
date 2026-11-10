import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { twJoin } from 'tailwind-merge'
import type { SpaceFinderCandidate } from '@/components/regionen/pageRegionSlug/hooks/mapState/space-finder-candidates-store'
import { buttonStylesOnYellow } from '@/components/shared/links/styles'
import { ModalDialog } from '@/components/shared/Modal/ModalDialog'
import { getErrorMessage } from '@/components/shared/toast/toastError'
import { reviewListsQueryOptions } from '@/server/regions/regionQueryOptions'
import { createReviewEntriesFromSpaceFinderFn } from '@/server/review-lists/review-lists.functions'
import { modeRoutePaths } from '../../useCurrentMode'

type Props = {
  open: boolean
  onClose: () => void
  regionSlug: string
  runId: number
  candidates: SpaceFinderCandidate[]
  defaultListName: string
}

type Target = 'new' | 'existing'

/**
 * »In Prüfliste übernehmen«: candidates go into a new or an existing Prüfliste of the region. On
 * success the modal offers to open that list in the Prüflisten mode.
 */
export const SpaceFinderReviewListModal = ({
  open,
  onClose,
  regionSlug,
  runId,
  candidates,
  defaultListName,
}: Props) => {
  const queryClient = useQueryClient()
  const { data } = useQuery({ ...reviewListsQueryOptions(regionSlug), enabled: open })
  const lists = data?.lists ?? []

  const [target, setTarget] = useState<Target>('new')
  const [newListName, setNewListName] = useState(defaultListName)
  const [existingListId, setExistingListId] = useState<number | null>(null)
  const selectedExistingListId = existingListId ?? lists[0]?.id ?? null

  const submit = useMutation({
    mutationFn: () =>
      createReviewEntriesFromSpaceFinderFn({
        data: {
          regionSlug,
          runId,
          target:
            target === 'new'
              ? { newListName: newListName.trim() }
              : { listId: selectedExistingListId! },
          candidates: candidates.map((candidate) => ({
            h3Id: candidate.h3Id,
            geometry: candidate.geometry as {
              type: 'Polygon' | 'MultiPolygon'
              coordinates: unknown[]
            },
            properties: candidate.properties,
          })),
        },
      }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: reviewListsQueryOptions(regionSlug).queryKey }),
        queryClient.invalidateQueries({ queryKey: ['review-lists', 'getReviewEntriesForList'] }),
      ]),
  })

  const result = submit.data
  const canSubmit =
    !submit.isPending &&
    candidates.length > 0 &&
    (target === 'new' ? newListName.trim() !== '' : selectedExistingListId != null)

  return (
    <ModalDialog
      title="In Prüfliste übernehmen"
      icon="reviewList"
      mode="reviewLists"
      buttonCloseName={result ? 'Schließen' : 'Abbrechen'}
      open={open}
      setOpen={(next) => {
        if (!next) onClose()
      }}
      onExitComplete={() => {
        submit.reset()
        setTarget('new')
        setNewListName(defaultListName)
        setExistingListId(null)
      }}
      primaryAction={
        result ? (
          <Link
            from="/regionen/$regionSlug"
            to={modeRoutePaths.reviewLists}
            params={{ regionSlug }}
            search={(prev) => ({ ...prev, review: { key: result.listId } })}
            onClick={onClose}
            className={twJoin(buttonStylesOnYellow, 'inline-flex w-full justify-center sm:w-auto')}
          >
            Prüfliste öffnen
          </Link>
        ) : (
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => submit.mutate()}
            className={twJoin(
              buttonStylesOnYellow,
              'inline-flex w-full justify-center sm:w-auto',
              !canSubmit && 'opacity-50',
            )}
          >
            Übernehmen
          </button>
        )
      }
    >
      {result ? (
        <div className="space-y-1 text-sm text-gray-700" role="status">
          <p>
            {result.createdCount === 1
              ? '1 Kandidat übernommen.'
              : `${result.createdCount} Kandidaten übernommen.`}
          </p>
          {result.skippedCount > 0 && (
            <p>
              {result.skippedCount === 1
                ? '1 Kandidat war bereits in der Liste.'
                : `${result.skippedCount} Kandidaten waren bereits in der Liste.`}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            {candidates.length === 1
              ? '1 Kandidat wird übernommen.'
              : `${candidates.length} Kandidaten werden übernommen.`}
          </p>

          <fieldset className="space-y-3" disabled={submit.isPending}>
            <legend className="sr-only">Ziel</legend>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="radio"
                name="review-list-target"
                checked={target === 'new'}
                onChange={() => setTarget('new')}
                className="mt-1"
              />
              <span className="flex-1 space-y-1.5">
                <span className="block font-medium text-gray-900">Neue Prüfliste</span>
                <input
                  type="text"
                  value={newListName}
                  onChange={(event) => setNewListName(event.target.value)}
                  onFocus={() => setTarget('new')}
                  aria-label="Name der neuen Prüfliste"
                  className="block w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                />
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="radio"
                name="review-list-target"
                checked={target === 'existing'}
                disabled={lists.length === 0}
                onChange={() => setTarget('existing')}
                className="mt-1"
              />
              <span className="flex-1 space-y-1.5">
                <span className="block font-medium text-gray-900">
                  Zu bestehender Prüfliste hinzufügen
                </span>
                {lists.length === 0 ? (
                  <span className="block text-gray-500">In dieser Region gibt es noch keine.</span>
                ) : (
                  <select
                    value={selectedExistingListId ?? ''}
                    onChange={(event) => setExistingListId(Number(event.target.value))}
                    onFocus={() => setTarget('existing')}
                    aria-label="Bestehende Prüfliste"
                    className="block w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                  >
                    {lists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.name} ({list.entryCount})
                      </option>
                    ))}
                  </select>
                )}
              </span>
            </label>
          </fieldset>

          {submit.isError && (
            <p className="text-sm text-red-700" role="alert">
              {getErrorMessage(submit.error, 'Die Kandidaten konnten nicht übernommen werden.')}
            </p>
          )}
        </div>
      )}
    </ModalDialog>
  )
}
