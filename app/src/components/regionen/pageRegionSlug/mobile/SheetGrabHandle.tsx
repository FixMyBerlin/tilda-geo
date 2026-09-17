import { ChevronDoubleDownIcon, ChevronDoubleUpIcon } from '@heroicons/react/24/outline'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { twMerge } from 'tailwind-merge'

type Props = {
  onClick: () => void
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void
  disabled?: boolean
  ariaLabel: string
  ariaExpanded?: boolean
  /** Capsule fill (tone grabber / white wash on inverted chrome). */
  pillClassName: string
  iconClassName?: string
  /** Down = close or collapse; up = expand. Double chevron so it does not match dropdowns. */
  direction: 'down' | 'up'
}

/**
 * Combined drag pill + action control for mobile sheets. The whole strip is the
 * tap and drag target; layout height stays a single compact row.
 */
export const SheetGrabHandle = ({
  onClick,
  onPointerDown,
  disabled = false,
  ariaLabel,
  ariaExpanded,
  pillClassName,
  iconClassName,
  direction,
}: Props) => {
  const Icon = direction === 'down' ? ChevronDoubleDownIcon : ChevronDoubleUpIcon

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      disabled={disabled}
      aria-expanded={ariaExpanded}
      aria-label={ariaLabel}
      className="relative z-10 flex w-full shrink-0 cursor-grab touch-none items-center justify-center py-2 select-none after:absolute after:inset-x-0 after:-top-2 after:-bottom-2 after:content-[''] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-inset active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span
        className={twMerge(
          'inline-flex h-4 w-11 items-center justify-center rounded-full',
          pillClassName,
        )}
      >
        <Icon className={twMerge('size-2.5', iconClassName)} aria-hidden />
      </span>
    </button>
  )
}
