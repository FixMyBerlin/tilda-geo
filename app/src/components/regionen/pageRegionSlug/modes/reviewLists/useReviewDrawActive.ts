import { reviewEntriesSourceId } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/reviewEntriesLayers.const'
import { useCurrentMode } from '@/components/regionen/pageRegionSlug/modes/useCurrentMode'
import { useModeDetailSelection } from '@/components/regionen/pageRegionSlug/modes/useModeDetailSelection'
import { useReviewListsModeValue } from './useReviewListsModeParam'

/** Same condition `ReviewMapDrawing` uses to start a geometry-edit session. */
export const reviewEditingEntryId = (
  selected: { id: string | number; sourceId: string } | undefined,
  isComposing: boolean,
  isMoveArmed: boolean,
) => {
  if (isComposing || !isMoveArmed || selected?.sourceId !== reviewEntriesSourceId) {
    return Number.NaN
  }
  return Number(selected.id)
}

/**
 * True only while a draw session can actually run: compose (`rl.new`), or geometry-edit
 * (`rl.move`) with a selected review entry. A leftover `rl.move` after delete is not a
 * draw session.
 */
export const useReviewDrawActive = () => {
  const currentMode = useCurrentMode()
  const { selected } = useModeDetailSelection()
  const { new: isComposing, move } = useReviewListsModeValue()
  const isEditing = !Number.isNaN(
    reviewEditingEntryId(selected, isComposing === true, move === true),
  )
  return currentMode.isReviewLists && (isComposing === true || isEditing)
}
