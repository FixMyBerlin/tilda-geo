import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { motion, type Transition } from 'motion/react'
import { playwrightTestId } from '@/components/shared/utils/playwright'

/** Panel-open offset so the toggle straddles the header bar and panel top edge. */
const TOGGLE_PANEL_OPEN_OFFSET_Y = 30

type Props = {
  panelId: string
  expanded: boolean
  onToggle: () => void
  toggleRef: React.RefObject<HTMLButtonElement | null>
  motionTransition: Transition
}

export const RegionPanelToggle = ({
  panelId,
  expanded,
  onToggle,
  toggleRef,
  motionTransition,
}: Props) => {
  return (
    <motion.button
      ref={toggleRef}
      type="button"
      data-testid={playwrightTestId('region-welcome-toggle')}
      onClick={onToggle}
      aria-expanded={expanded}
      aria-controls={panelId}
      animate={{ y: expanded ? TOGGLE_PANEL_OPEN_OFFSET_Y : 0 }}
      transition={motionTransition}
      className="inline-flex items-center justify-center rounded-md border border-gray-700 p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-white focus:outline-none focus:ring-inset"
    >
      <span className="sr-only">{expanded ? 'Menü schließen' : 'Menü öffnen'}</span>
      {expanded ? (
        <XMarkIcon className="size-6" aria-hidden="true" />
      ) : (
        <Bars3Icon className="size-6" aria-hidden="true" />
      )}
    </motion.button>
  )
}
