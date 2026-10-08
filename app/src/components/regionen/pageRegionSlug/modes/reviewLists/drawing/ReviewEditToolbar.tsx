import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { ModeMapToolbar } from '../../ModeMapHint'
import { reviewToolbarButtonClassName } from './ReviewDrawingToolbar'

type Props = {
  isDrawing: boolean
  isAddingPart: boolean
  canAddPart: boolean
  canDeletePart: boolean
  onAddPart: () => void
  onDeletePart: () => void
  onFinish: () => void
  onCancel: () => void
}

const DELETE_DISABLED_TITLE =
  'Erst einen Teil auf der Karte auswählen. Der Eintrag braucht mindestens eine Geometrie – nutzen Sie den Löschen-Button oben, um den ganzen Eintrag zu löschen.'

/**
 * Edit-session toolbar: add a part of the same type, or delete the selected part. The
 * geometry itself is changed directly on the map.
 */
export const ReviewEditToolbar = ({
  isDrawing,
  isAddingPart,
  canAddPart,
  canDeletePart,
  onAddPart,
  onDeletePart,
  onFinish,
  onCancel,
}: Props) => (
  <ModeMapToolbar aria-label="Geometrie bearbeiten">
    <button
      type="button"
      aria-pressed={isAddingPart}
      disabled={!canAddPart}
      onClick={onAddPart}
      className={reviewToolbarButtonClassName({ active: isAddingPart, disabled: !canAddPart })}
    >
      <PlusIcon className="size-4" aria-hidden />
      Teil hinzufügen
    </button>
    {isDrawing ? (
      <>
        <button type="button" onClick={onFinish} className={reviewToolbarButtonClassName()}>
          Fertig
        </button>
        <button type="button" onClick={onCancel} className={reviewToolbarButtonClassName()}>
          Abbrechen
        </button>
      </>
    ) : (
      <button
        type="button"
        disabled={!canDeletePart}
        title={canDeletePart ? undefined : DELETE_DISABLED_TITLE}
        onClick={onDeletePart}
        className={reviewToolbarButtonClassName({ disabled: !canDeletePart })}
      >
        <TrashIcon className="size-4" aria-hidden />
        Teil löschen
      </button>
    )}
  </ModeMapToolbar>
)
