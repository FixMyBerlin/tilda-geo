import { XMarkIcon } from '@heroicons/react/24/outline'
import { twJoin } from 'tailwind-merge'

/**
 * Small grey "x" to remove one entry from a Flächenfinder list (candidates, own datasets, upload
 * history). One look everywhere; the label is the accessible name and the hover tooltip.
 */
export const RemoveIconButton = ({
  label,
  onClick,
  className,
}: {
  label: string
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  className?: string
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className={twJoin(
      'shrink-0 rounded p-0.5 text-gray-400 hover:bg-white hover:text-gray-800',
      className,
    )}
  >
    <XMarkIcon className="size-4" aria-hidden="true" />
  </button>
)
