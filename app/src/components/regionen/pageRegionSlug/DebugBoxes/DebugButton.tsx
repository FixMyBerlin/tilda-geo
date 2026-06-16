import { BugAntIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { twMerge } from 'tailwind-merge'
import {
  useMapDebugActions,
  useMapDebugShowDebugInfo,
} from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapDebugState'
import { MobileBottomSheet } from '../mobile/MobileBottomSheet'
import { mobileControlButtonClassName } from '../mobile/mobileControlButton.const'
import { DebugMap } from './DebugMap'
import { DebugStateInteraction } from './DebugStateInteraction'

/**
 * Single entry point for the (admin) map debug tools. Visible only when debug mode
 * is on (toggled via the user menu). Opens the merged DebugMap +
 * DebugStateInteraction panels in a bottom sheet instead of floating boxes on the map.
 *
 * Placed in both the MobileMapHeader (mobile) and the bottom controls cluster
 * (desktop); each is rendered only on its breakpoint, so no breakpoint class is needed.
 */
export const DebugButton = () => {
  const showDebugInfo = useMapDebugShowDebugInfo()
  const { setShowDebugInfo } = useMapDebugActions()
  const [open, setOpen] = useState(false)

  if (!showDebugInfo) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Debug"
        aria-expanded={open}
        className={twMerge(
          mobileControlButtonClassName,
          // Admin colors (the debug tools were pink/purple), but shaped like the other buttons.
          'size-10 border-pink-400 bg-pink-300 text-pink-900 hover:bg-pink-400 focus:ring-pink-500',
          open && 'border-pink-600 bg-pink-400',
        )}
      >
        <BugAntIcon className="size-6" aria-hidden="true" />
      </button>

      <MobileBottomSheet open={open} onClose={() => setOpen(false)} title="Debug" tone="debug">
        <div className="space-y-2 p-2">
          <button
            type="button"
            onClick={() => {
              setShowDebugInfo(false)
              setOpen(false)
            }}
            className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
          >
            Debug-Modus ausschalten
          </button>
          <DebugStateInteraction />
          <DebugMap />
        </div>
      </MobileBottomSheet>
    </>
  )
}
