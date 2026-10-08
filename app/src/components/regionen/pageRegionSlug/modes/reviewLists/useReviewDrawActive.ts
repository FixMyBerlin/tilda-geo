import { useQuery } from '@tanstack/react-query'
import { reviewEntriesSourceId } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/reviewEntriesLayers.const'
import { useCurrentMode } from '@/components/regionen/pageRegionSlug/modes/useCurrentMode'
import { useModeDetailSelection } from '@/components/regionen/pageRegionSlug/modes/useModeDetailSelection'
import { useRegionSlug } from '@/components/regionen/pageRegionSlug/regionUtils/useRegionSlug'
import { reviewListsQueryOptions } from '@/server/regions/regionQueryOptions'
import { useReviewListsModeValue } from './useReviewListsModeParam'

/**
 * The one answer to "is a draw session running, and which": compose (`rl.new`), or
 * geometry-edit (`rl.move`) with a selected review entry. A leftover `rl.move` after delete is
 * not a session, and neither is anything before a list is known to save into.
 */
export const useReviewDrawSession = () => {
  const currentMode = useCurrentMode()
  const regionSlug = useRegionSlug()
  const { selected } = useModeDetailSelection()
  const { key, new: isComposing, move: isMoveArmed } = useReviewListsModeValue()

  const { data: lists } = useQuery({
    ...reviewListsQueryOptions(regionSlug),
    enabled: currentMode.isReviewLists,
  })
  const activeListId = key ?? lists?.lists[0]?.id

  const isEditing =
    !isComposing && isMoveArmed === true && selected?.sourceId === reviewEntriesSourceId
  const editingEntryId = isEditing ? Number(selected.id) : Number.NaN
  const session =
    !currentMode.isReviewLists || activeListId === undefined
      ? ('idle' as const)
      : isComposing
        ? ('compose' as const)
        : isEditing
          ? ('edit' as const)
          : ('idle' as const)

  return { session, editingEntryId, activeListId }
}

/** While true, map clicks and pointer gestures belong to the drawing (see RegionMap). */
export const useReviewDrawActive = () => useReviewDrawSession().session !== 'idle'
