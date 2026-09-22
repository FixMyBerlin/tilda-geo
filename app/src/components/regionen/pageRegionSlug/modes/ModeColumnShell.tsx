import { Outlet } from '@tanstack/react-router'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { twMerge } from 'tailwind-merge'
import { useBreakpoint } from '@/components/shared/hooks/viewport/useBreakpoint'
import { FadeSlideIn } from '@/components/shared/motion/FadeSlideIn'
import { UI_SPRING } from '@/components/shared/motion/spring.const'
import { mapOverlayHairlineClassName } from '../mapOverlayChrome.const'
import { PanelResizeHandle } from '../PanelResizeHandle'
import { useModePanelWidth, useModePanelWidthDragging } from './mode-panel-width-store'
import { modeIdentity } from './modeIdentity'
import { ModeMobileDock } from './ModeMobileDock'
import { modeColumnElevationClassName } from './modePanel.const'
import { useOptimisticMode } from './useCurrentMode'
import { useResizableModePanelWidth } from './useResizableModePanelWidth'

/**
 * Animated right column for mode routes on desktop. Outer shell springs width 0 ↔ stored
 * panel width when entering/leaving a mode; switching between modes keeps width open. Inner
 * clip keeps content at full target width so list/table layout does not squash during the spring.
 *
 * Below `sm` the same outlet is a fixed, non-Dialog dock (`ModeMobileDock`) so the map flex
 * column stays full-bleed.
 *
 * Sheet chrome (left `modeColumnElevationClassName` + outline hairline) sits on this shell
 * shell (overflow visible when open) so it can cast onto the map / inspector. Content stays
 * clipped in the inner wrapper.
 *
 * Shadow stack (desktop region layout): header (`z-40 shadow-md`) → mode column (`z-30`) →
 * inspector (`z-20`) → map.
 */
export const ModeColumnShell = () => {
  const optimisticMode = useOptimisticMode()
  const isModeRoute = optimisticMode !== 'map'
  const isDesktop = useBreakpoint('sm')
  const panelWidth = useModePanelWidth()
  const isDragging = useModePanelWidthDragging()
  const reduceMotion = useReducedMotion()
  const instant = reduceMotion || isDragging
  const { panelRef, onResizeHandlePointerDown } = useResizableModePanelWidth({
    enabled: isDesktop,
  })

  if (!isDesktop) {
    return isModeRoute ? <ModeMobileDock /> : null
  }

  return (
    <AnimatePresence initial={false}>
      {isModeRoute ? (
        <motion.div
          key="mode-column"
          className={twMerge(
            'relative z-30 h-full shrink-0',
            modeIdentity[optimisticMode].accent.tintClassName,
            mapOverlayHairlineClassName,
            modeColumnElevationClassName,
          )}
          initial={{ width: 0, overflow: 'hidden' }}
          animate={{ width: panelWidth, overflow: 'visible' }}
          exit={{ width: 0, overflow: 'hidden' }}
          transition={instant ? { duration: 0 } : UI_SPRING}
        >
          <PanelResizeHandle
            label="Modus-Panelbreite ändern"
            onPointerDown={onResizeHandlePointerDown}
          />
          <div ref={panelRef} className="h-full overflow-hidden" style={{ width: panelWidth }}>
            <FadeSlideIn x={24} className="h-full w-full">
              <Outlet />
            </FadeSlideIn>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
