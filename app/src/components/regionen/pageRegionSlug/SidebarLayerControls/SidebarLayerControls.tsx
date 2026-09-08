import { ChevronUpIcon } from '@heroicons/react/20/solid'
import { AnimatePresence, motion, type Transition, type Variants } from 'motion/react'
import { useEffect, useLayoutEffect } from 'react'
import { twJoin } from 'tailwind-merge'
import { useMapActions } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useOptimisticMode } from '@/components/regionen/pageRegionSlug/modes/useCurrentMode'
import { useElementSize } from '@/components/shared/hooks/useElementSize'
import { useBreakpoint } from '@/components/shared/hooks/viewport/useBreakpoint'
import { playwrightTestId } from '@/components/shared/utils/playwright'
import {
  mapOverlayLayerControlsWidthClassName,
  mapOverlayMaxHeightClassName,
  mapOverlaySheetClassName,
} from '../mapOverlayChrome.const'
import { Categories } from './Categories/Categories'
import { useLayerControlsActions, useLayerControlsOpen } from './layer-controls-store'
import { LayerControlsOpenButton } from './LayerControlsOpenButton'
import { StaticDatasetCategories } from './StaticDatasets/StaticDatasetCategories'

const PANEL_ID = 'sidebar-layer-controls'

/** Center of the reopen button (overlay inset + half of `size-13`) in the panel's box. */
const SUCK_ORIGIN = '2.125rem 2.125rem'

const PANEL_VARIANTS = {
  open: { scale: 1, opacity: 1 },
  closed: { scale: 0.08, opacity: 0 },
} satisfies Variants

/** Accelerate into the button — stronger than the modal's 0.92 / 25% offset. */
const CLOSE_TRANSITION = { duration: 0.22, ease: [0.45, 0, 1, 0.2] } satisfies Transition

/** Ease out of the button — no overshoot. */
const OPEN_TRANSITION = { duration: 0.22, ease: [0.16, 1, 0.3, 1] } satisfies Transition

export const SidebarLayerControls = () => {
  const isSmBreakpointOrAbove = useBreakpoint('sm')
  const { updateSidebarSize } = useMapActions()
  const mode = useOptimisticMode()
  const open = useLayerControlsOpen()
  const { setOpenForMode, clearLayoutFold } = useLayerControlsActions()

  useLayoutEffect(
    function clearLayoutFoldOnModeChange() {
      clearLayoutFold()
    },
    [mode, clearLayoutFold],
  )

  const ref = useElementSize((size) => {
    if (!open || size.height < 1) {
      updateSidebarSize({ width: 0, height: 0 })
      return
    }
    updateSidebarSize(size)
  })

  useEffect(
    function zeroSidebarSizeWhenLayerControlsClosed() {
      if (!open) {
        updateSidebarSize({ width: 0, height: 0 })
      }
    },
    [open, updateSidebarSize],
  )

  // On mobile the layer controls are rendered via MobileLayerButton (bottom sheet).
  if (!isSmBreakpointOrAbove) {
    return null
  }

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.div
            key="layer-controls-open"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.08 } }}
            transition={{ duration: 0.15 }}
            className="absolute top-[var(--map-overlay-inset)] left-[var(--map-overlay-inset)] z-30"
          >
            <LayerControlsOpenButton
              expanded={false}
              onClick={() => setOpenForMode(mode, true)}
              aria-controls={PANEL_ID}
              data-testid={playwrightTestId('sidebar-layer-controls-open')}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.section
        id={PANEL_ID}
        ref={ref}
        initial={false}
        variants={PANEL_VARIANTS}
        animate={open ? 'open' : 'closed'}
        transition={open ? OPEN_TRANSITION : CLOSE_TRANSITION}
        inert={!open}
        aria-hidden={!open}
        data-testid={playwrightTestId('sidebar-layer-controls')}
        style={{ transformOrigin: SUCK_ORIGIN }}
        className={twJoin(
          'absolute z-20 flex flex-col overflow-hidden text-pretty',
          mapOverlayLayerControlsWidthClassName,
          mapOverlayMaxHeightClassName,
          'top-(--map-overlay-inset) left-(--map-overlay-inset)',
          mapOverlaySheetClassName,
          !open && 'pointer-events-none',
        )}
      >
        <div className="min-h-0 overflow-x-visible overflow-y-auto pb-px">
          <Categories />
          <StaticDatasetCategories />
        </div>
        <button
          type="button"
          onClick={() => setOpenForMode(mode, false)}
          aria-label="Kategorien schließen"
          aria-expanded={open}
          aria-controls={PANEL_ID}
          data-testid={playwrightTestId('sidebar-layer-controls-close')}
          className="flex h-8 shrink-0 cursor-pointer items-center justify-center border-t border-gray-200 bg-white text-gray-500 hover:bg-yellow-50 hover:text-gray-900 focus:ring-2 focus:ring-yellow-500 focus:outline-none focus:ring-inset"
        >
          <ChevronUpIcon className="size-4" />
        </button>
      </motion.section>
    </>
  )
}
