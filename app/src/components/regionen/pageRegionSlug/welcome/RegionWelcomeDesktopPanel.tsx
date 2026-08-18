import { motion, type Transition } from 'motion/react'
import { useEffect, useEffectEvent, useState } from 'react'
import { playwrightTestId } from '@/components/shared/utils/playwright'
import type { TRegionWelcome } from '@/server/regions/regionConfigMapper.server'
import { RegionWelcomePanelBody } from './RegionWelcomePanelBody'

type Props = {
  panelId: string
  welcome: TRegionWelcome | null
  isOpen: boolean
  onClose: () => void
  panelRef: React.RefObject<HTMLDivElement | null>
  motionTransition: Transition
}

type DesktopPanelContentProps = {
  welcome: TRegionWelcome | null
  onClose: () => void
  panelRef: React.RefObject<HTMLDivElement | null>
}

/** Owns welcome/faq view; remounted via `key` when the panel closes so FAQ resets without an Effect. */
const RegionWelcomeDesktopPanelContent = ({
  welcome,
  onClose,
  panelRef,
}: DesktopPanelContentProps) => {
  const [panelView, setPanelView] = useState<'welcome' | 'faq'>('welcome')
  return (
    <RegionWelcomePanelBody
      welcome={welcome}
      onClose={onClose}
      panelRef={panelRef}
      panelView={panelView}
      onPanelViewChange={setPanelView}
    />
  )
}

export const RegionWelcomeDesktopPanel = ({
  panelId,
  welcome,
  isOpen,
  onClose,
  panelRef,
  motionTransition,
}: Props) => {
  const onEscapeClose = useEffectEvent(() => {
    onClose()
  })

  // Desktop-only Escape — mobile sheet uses Headless UI Dialog Escape instead.
  useEffect(
    function bindDesktopWelcomeEscapeKey() {
      if (!isOpen) return
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key !== 'Escape') return
        onEscapeClose()
      }
      window.addEventListener('keydown', onKeyDown)
      return function unbindDesktopWelcomeEscapeKey() {
        window.removeEventListener('keydown', onKeyDown)
      }
    },
    [isOpen],
  )

  return (
    <motion.div
      id={panelId}
      data-testid={playwrightTestId('region-welcome-desktop-panel')}
      initial={false}
      animate={{ height: isOpen ? 'auto' : 0 }}
      transition={motionTransition}
      className="relative z-40 overflow-hidden bg-gray-900"
      aria-hidden={!isOpen}
      inert={!isOpen ? true : undefined}
    >
      <RegionWelcomeDesktopPanelContent
        key={isOpen ? 'open' : 'closed'}
        welcome={welcome}
        onClose={onClose}
        panelRef={panelRef}
      />
    </motion.div>
  )
}
