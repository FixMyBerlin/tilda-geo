import { Outlet } from '@tanstack/react-router'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useLayoutEffect } from 'react'
import { twMerge } from 'tailwind-merge'
import { useBreakpoint } from '@/components/shared/hooks/viewport/useBreakpoint'
import { FadeSlideIn } from '@/components/shared/motion/FadeSlideIn'
import { UI_SPRING } from '@/components/shared/motion/spring.const'
import { mapOverlayHairlineClassName } from '../mapOverlayChrome.const'
import {
  useModePanelWidth,
  useModePanelWidthActions,
  useModePanelWidthDragging,
} from './mode-panel-width-store'
import { modeAccentStyle, modeAccentTintClassName, modeIdentity } from './modeIdentity'
import { modeColumnElevationClassName } from './modePanel.const'
import { readModePanelWidth } from './modePanelWidthStorage'
import { useOptimisticMode } from './useCurrentMode'
import { useIsModeRoute } from './useIsModeRoute'

const setModePanelWidthCssVar = (width: number) =>
  document.documentElement.style.setProperty('--mode-panel-width', `${width}px`)

/**
 * Animated right column for mode routes. Outer shell springs width 0 ↔ stored panel width when
 * entering/leaving a mode; switching between modes keeps width open. Inner clip keeps content at
 * full target width so list/table layout does not squash during the spring.
 *
 * Sheet chrome (left `modeColumnElevationClassName` + outline hairline) sits on this shell
 * shell (overflow visible when open) so it can cast onto the map / inspector. Content stays
 * clipped in the inner wrapper.
 *
 * Shadow stack (desktop region layout): header (`z-40 shadow-md`) → mode column (`z-30`) →
 * inspector (`z-20`) → map.
 */
export const ModeColumnShell = () => {
  const isModeRoute = useIsModeRoute()
  const optimisticMode = useOptimisticMode()
  const isDesktop = useBreakpoint('sm')
  const panelWidth = useModePanelWidth()
  const isDragging = useModePanelWidthDragging()
  const { resetFromStorage } = useModePanelWidthActions()
  const reduceMotion = useReducedMotion()
  const instant = reduceMotion || isDragging
  const seedCssVar = isModeRoute && isDesktop

  useLayoutEffect(
    function syncModePanelWidthCssVar() {
      resetFromStorage()
      if (!seedCssVar) {
        setModePanelWidthCssVar(0)
        return
      }

      setModePanelWidthCssVar(readModePanelWidth())
    },
    [resetFromStorage, seedCssVar],
  )

  return (
    <AnimatePresence initial={false}>
      {isModeRoute ? (
        <motion.div
          key="mode-column"
          className={twMerge(
            'relative z-30 h-full shrink-0',
            modeAccentTintClassName,
            mapOverlayHairlineClassName,
            modeColumnElevationClassName,
          )}
          style={modeAccentStyle(modeIdentity[optimisticMode].accent)}
          initial={{ width: 0, overflow: 'hidden' }}
          animate={{ width: panelWidth, overflow: isDragging ? 'hidden' : 'visible' }}
          exit={{ width: 0, overflow: 'hidden' }}
          transition={instant ? { duration: 0 } : UI_SPRING}
        >
          <div className="h-full overflow-hidden" style={{ width: panelWidth }}>
            <FadeSlideIn x={24} className="h-full w-full">
              <Outlet />
            </FadeSlideIn>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
