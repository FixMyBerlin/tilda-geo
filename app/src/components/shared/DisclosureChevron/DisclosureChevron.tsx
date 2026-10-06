import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import { twMerge } from 'tailwind-merge'

type Props = {
  open: boolean
  /**
   * Which side of the row the icon sits on.
   * Trailing points left when closed; leading points right. Both turn down when open.
   */
  side: 'leading' | 'trailing'
  className?: string
}

/** One disclosure chevron. Do not swap icons or invent a new closed direction. */
export const DisclosureChevron = ({ open, side, className }: Props) => {
  const Icon = side === 'trailing' ? ChevronLeftIcon : ChevronRightIcon
  // ChevronLeft needs a counter-clockwise quarter turn to land pointing down.
  const openRotation = side === 'trailing' ? '-rotate-90' : 'rotate-90'

  return (
    <Icon
      aria-hidden
      className={twMerge(
        'shrink-0 transition-transform motion-reduce:transition-none',
        open && openRotation,
        className,
      )}
    />
  )
}
