import { Outlet } from '@tanstack/react-router'
import { motion, useDragControls, useReducedMotion } from 'motion/react'
import { useLayoutEffect, useRef, useState } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { twMerge } from 'tailwind-merge'
import { UI_SPRING } from '@/components/shared/motion/spring.const'
import { playwrightTestId } from '@/components/shared/utils/playwright'
import { mapOverlayHairlineClassName } from '../mapOverlayChrome.const'
import { SheetGrabHandle } from '../mobile/SheetGrabHandle'
import { useInspectorRenderableFeatures } from '../SidebarInspector/useInspectorRenderableFeatures'
import {
  modeAccentInvertedClassName,
  modeAccentInvertedFgClassName,
  modeAccentStyle,
  modeAccentTintClassName,
  modeIdentity,
} from './modeIdentity'
import { applyModeMapCameraPadding, resetModeMapCameraPadding } from './modeMapCameraPadding'
import { useNotesComposeActive } from './notes/useNotesComposeActive'
import { useReviewDrawActive } from './reviewLists/useReviewDrawActive'
import { useOptimisticMode } from './useCurrentMode'

const MODE_MOBILE_DOCK_PEEK = '5.5rem'
const MODE_MOBILE_DOCK_EXPANDED = '62dvh'

const setModeMobileDockHeightCssVar = (height: string) =>
  document.documentElement.style.setProperty('--mode-mobile-dock-height', height)

/**
 * Persistent mobile mode panel: a docked bottom sheet without Dialog/backdrop so the map
 * stays pannable and clickable. Collapse is not leave-mode — switching to Karte does that.
 */
export const ModeMobileDock = () => {
  const { mainMap } = useMap()
  const optimisticMode = useOptimisticMode()
  const identity = modeIdentity[optimisticMode]
  const inspectorOpen = useInspectorRenderableFeatures().length > 0
  const notesComposeActive = useNotesComposeActive()
  const reviewDrawActive = useReviewDrawActive()
  const composeOrDraw = notesComposeActive || reviewDrawActive
  const [userExpanded, setUserExpanded] = useState(() => !composeOrDraw)
  const [composeOrDrawSeen, setComposeOrDrawSeen] = useState(composeOrDraw)
  const dragControls = useDragControls()
  const reduceMotion = useReducedMotion()
  const dockRef = useRef<HTMLElement>(null)

  if (composeOrDraw !== composeOrDrawSeen) {
    setComposeOrDrawSeen(composeOrDraw)
    setUserExpanded(!composeOrDraw)
  }

  const expanded = userExpanded && !inspectorOpen
  const height = expanded ? MODE_MOBILE_DOCK_EXPANDED : MODE_MOBILE_DOCK_PEEK

  useLayoutEffect(
    function syncModeMobileDockHeightCssVar() {
      const applyDockMetrics = (cssHeight: string) => {
        setModeMobileDockHeightCssVar(cssHeight)
        applyModeMapCameraPadding(mainMap)
      }

      applyDockMetrics(height)
      const el = dockRef.current
      if (!el || typeof ResizeObserver === 'undefined') {
        return function clearModeMobileDockHeightCssVar() {
          setModeMobileDockHeightCssVar('0px')
          resetModeMapCameraPadding(mainMap)
        }
      }

      const applyMeasuredHeight = () => {
        const measured = el.getBoundingClientRect().height
        if (measured > 0) {
          applyDockMetrics(`${Math.round(measured)}px`)
        }
      }
      applyMeasuredHeight()
      const observer = new ResizeObserver(applyMeasuredHeight)
      observer.observe(el)
      return function clearModeMobileDockHeightCssVar() {
        observer.disconnect()
        setModeMobileDockHeightCssVar('0px')
        resetModeMapCameraPadding(mainMap)
      }
    },
    [height, mainMap],
  )

  const toggleExpanded = () => {
    if (inspectorOpen) return
    setUserExpanded((current) => !current)
  }

  return (
    <motion.section
      ref={dockRef}
      aria-label="Modus-Panel"
      data-testid={playwrightTestId('mode-mobile-dock')}
      data-expanded={expanded ? 'true' : 'false'}
      className={twMerge(
        'pointer-events-auto fixed inset-x-0 bottom-0 z-20 flex flex-col overflow-hidden rounded-t-xl pb-[env(safe-area-inset-bottom)]',
        modeAccentTintClassName,
        mapOverlayHairlineClassName,
        'shadow-[0_-4px_6px_-1px_rgb(0_0_0/0.1),0_-2px_4px_-2px_rgb(0_0_0/0.1)]',
      )}
      style={modeAccentStyle(identity.accent)}
      initial={reduceMotion ? false : { y: '100%' }}
      animate={{ y: 0, height }}
      transition={reduceMotion ? { duration: 0 } : UI_SPRING}
      drag="y"
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.15, bottom: 0.35 }}
      onDragEnd={(_event, info) => {
        if (inspectorOpen) return
        if (info.offset.y > 80 || info.velocity.y > 500) {
          setUserExpanded(false)
          return
        }
        if (info.offset.y < -80 || info.velocity.y < -500) {
          setUserExpanded(true)
        }
      }}
    >
      <div
        className={twMerge(
          modeAccentInvertedClassName,
          modeAccentInvertedFgClassName(optimisticMode),
        )}
      >
        <SheetGrabHandle
          onClick={toggleExpanded}
          onPointerDown={(event) => dragControls.start(event)}
          disabled={inspectorOpen}
          ariaExpanded={expanded}
          ariaLabel={expanded ? 'Panel verkleinern' : 'Panel vergrößern'}
          pillClassName="bg-current/35"
          direction={expanded ? 'down' : 'up'}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </div>
    </motion.section>
  )
}
