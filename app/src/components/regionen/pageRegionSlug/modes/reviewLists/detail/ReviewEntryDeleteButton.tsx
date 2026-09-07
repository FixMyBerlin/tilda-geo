import { TrashIcon } from '@heroicons/react/24/outline'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useModeDetailSelection } from '@/components/regionen/pageRegionSlug/modes/useModeDetailSelection'
import { useRegionSlug } from '@/components/regionen/pageRegionSlug/regionUtils/useRegionSlug'
import { reviewListsQueryOptions } from '@/server/regions/regionQueryOptions'
import { deleteReviewEntryFn } from '@/server/review-lists/review-lists.functions'
import { modePanelHeaderIconButtonClassName } from '../../modePanel.const'
import { useReviewListsModeParam } from '../useReviewListsModeParam'

type Props = { entryId: number }

/** Detail-header delete control: trash icon + `window.confirm`. */
export const ReviewEntryDeleteButton = ({ entryId }: Props) => {
  const regionSlug = useRegionSlug()
  const queryClient = useQueryClient()
  const { clearModeDetail } = useModeDetailSelection()
  const { reviewListsMode, setReviewListsModeParam } = useReviewListsModeParam()

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
    <button
      type="button"
      aria-label="Prüfeintrag löschen"
      disabled={remove.isPending}
      onClick={() => {
        if (window.confirm('Prüfeintrag wirklich löschen?')) remove.mutate()
      }}
      className={modePanelHeaderIconButtonClassName}
    >
      <TrashIcon className="size-5" aria-hidden />
    </button>
  )
}
