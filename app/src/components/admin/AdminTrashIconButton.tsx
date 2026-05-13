import { TrashIcon } from '@heroicons/react/24/outline'
import { twMerge } from 'tailwind-merge'

const buttonBase =
  'inline-flex shrink-0 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-60'

const sizeClass = {
  compact: 'h-6 w-6',
  comfortable: 'h-9 w-9',
} as const

const iconClass = {
  compact: 'size-4',
  comfortable: 'size-5',
} as const

type Props = {
  ariaLabel: string
  disabled?: boolean
  onClick: () => void
  size?: keyof typeof sizeClass
  type?: 'button' | 'submit'
}

export function AdminTrashIconButton({
  ariaLabel,
  disabled,
  onClick,
  size = 'compact',
  type = 'button',
}: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={twMerge(buttonBase, sizeClass[size])}
    >
      <TrashIcon className={iconClass[size]} aria-hidden />
    </button>
  )
}
