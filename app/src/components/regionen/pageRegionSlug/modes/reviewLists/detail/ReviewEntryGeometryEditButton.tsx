import { PencilIcon } from '@heroicons/react/24/outline'
import { twMerge } from 'tailwind-merge'
import { modePanelHeaderIconButtonClassName } from '../../modePanel.const'
import { useReviewListsModeParam } from '../useReviewListsModeParam'

/** Detail-header toggle: arms or ends geometry edit (`rl.move`). */
export const ReviewEntryGeometryEditButton = () => {
  const { reviewListsMode, setReviewListsModeParam } = useReviewListsModeParam()
  const isEditing = reviewListsMode.move === true

  return (
    <button
      type="button"
      aria-pressed={isEditing}
      aria-label={isEditing ? 'Geometrie-Bearbeitung beenden' : 'Geometrie bearbeiten'}
      onClick={() =>
        setReviewListsModeParam({
          ...reviewListsMode,
          move: isEditing ? undefined : true,
        })
      }
      className={twMerge(
        modePanelHeaderIconButtonClassName,
        isEditing && 'bg-yellow-400 hover:bg-yellow-400',
      )}
    >
      <PencilIcon className="size-5" aria-hidden />
    </button>
  )
}
