import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import { twMerge } from 'tailwind-merge'

type Props = {
  open: boolean
  /**
   * Which side of the row the icon sits on.
   * Trailing points left when closed; leading points right. Both turn down when open (up with `content="above"`).
   */
  side: 'leading' | 'trailing'
  /**
   * Where the disclosed content sits relative to the toggle. `above` turns the open icon up
   * instead of down, e.g. a »Weniger anzeigen« below the text it collapses.
   */
  content?: 'below' | 'above'
  className?: string
}

/** One disclosure chevron. Do not swap icons or invent a new closed direction. */
export const DisclosureChevron = ({ open, side, content = 'below', className }: Props) => {
  const Icon = side === 'trailing' ? ChevronLeftIcon : ChevronRightIcon
  // ChevronLeft needs a counter-clockwise quarter turn to land pointing down.
  const clockwise = (side === 'leading') === (content === 'below')
  const openRotation = clockwise ? 'rotate-90' : '-rotate-90'

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
