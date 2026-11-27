import { TrashIcon } from '@heroicons/react/24/outline'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useModeDetailSelection } from '@/components/regionen/pageRegionSlug/modes/useModeDetailSelection'
import { useRegionSlug } from '@/components/regionen/pageRegionSlug/regionUtils/useRegionSlug'
import { DeleteConfirmDialog } from '@/components/shared/dialog/DeleteConfirmDialog'
import { reviewListsQueryOptions } from '@/server/regions/regionQueryOptions'
import { deleteReviewEntryFn } from '@/server/review-lists/review-lists.functions'
import { modePanelHeaderIconButtonClassName } from '../../modePanel.const'
import { useReviewListsModeParam } from '../useReviewListsModeParam'

type Props = { entryId: number }

/** Detail-header delete control: trash icon + `DeleteConfirmDialog`. */
export const ReviewEntryDeleteButton = ({ entryId }: Props) => {
  const regionSlug = useRegionSlug()
  const queryClient = useQueryClient()
  const { clearModeDetail } = useModeDetailSelection()
  const { reviewListsMode, setReviewListsModeParam } = useReviewListsModeParam()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const remove = useMutation({
    mutationFn: () => deleteReviewEntryFn({ data: { regionSlug, entryId } }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['review-lists', 'getReviewEntry', { regionSlug, entryId }],
        }),
        queryClient.invalidateQueries({ queryKey: reviewListsQueryOptions(regionSlug).queryKey }),
        queryClient.invalidateQueries({ queryKey: ['review-lists', 'getReviewEntriesForList'] }),
      ])
      setReviewListsModeParam({ ...reviewListsMode, move: undefined })
      clearModeDetail()
    },
  })

  return (
    <>
      <button
        type="button"
        aria-label="Prüfeintrag löschen"
        disabled={remove.isPending}
        onClick={() => setDeleteOpen(true)}
        className={modePanelHeaderIconButtonClassName}
      >
        <TrashIcon className="size-5" aria-hidden />
      </button>
      <DeleteConfirmDialog
        open={deleteOpen}
        setOpen={setDeleteOpen}
        title="Prüfeintrag löschen?"
        description="Der Prüfeintrag und seine Kommentare werden gelöscht. Das lässt sich nicht rückgängig machen."
        onDelete={async () => {
          await remove.mutateAsync()
        }}
      />
    </>
  )
}
