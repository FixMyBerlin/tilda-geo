import type { ReactNode } from 'react'
import { twJoin } from 'tailwind-merge'
import { mapOverlayBesideLayerControlsClassName } from '../mapOverlayChrome.const'
import { useLayerControlsOpen } from '../SidebarLayerControls/layer-controls-store'
import { modeIdentity } from './modeIdentity'
import { useCurrentMode } from './useCurrentMode'

/**
 * Horizontal box for overlays that are centered in the visible map: the whole map, minus the
 * layer-controls sheet while it is open (desktop). Shared by the hint and the drawing toolbars
 * so both move together.
 */
const useVisibleMapCenterClassName = () =>
  twJoin(
    'pointer-events-none absolute inset-x-2 flex justify-center',
    useLayerControlsOpen() && mapOverlayBesideLayerControlsClassName,
  )

type ToolbarProps = { children: ReactNode; 'aria-label': string }

/**
 * Drawing toolbar of a mode at the top of the visible map; below the floating header buttons
 * on a phone.
 */
export const ModeMapToolbar = ({ children, 'aria-label': ariaLabel }: ToolbarProps) => (
  <div className={twJoin(useVisibleMapCenterClassName(), 'top-14 z-1000 sm:top-2.5')}>
    <div
      className="pointer-events-auto isolate inline-flex rounded-md shadow-xs"
      role="group"
      aria-label={ariaLabel}
    >
      {children}
    </div>
  </div>
)

type HintProps = {
  children: ReactNode
  /**
   * `visibleMap` (default): mid-map, centered in the part the open layer list does not cover.
   * `pin`: just below the center of the map, for a hint that belongs to the center pin.
   */
  anchor?: 'visibleMap' | 'pin'
}

/**
 * Short instruction on the map for the first step of a mode ("click to draw an area", "move
 * the map to place the pin"), in the accent of the mode. One sentence; the caller removes it
 * once the step is done. Never takes pointer events.
 *
 * Render it inside the map box (`RegionMap` children or next to it in `MapInterface`).
 */
export const ModeMapHint = ({ children, anchor = 'visibleMap' }: HintProps) => {
  const { accent } = modeIdentity[useCurrentMode().mode]
  const visibleMapCenterClassName = useVisibleMapCenterClassName()

  return (
    <div
      className={
        anchor === 'pin'
          ? 'pointer-events-none absolute inset-x-4 top-[calc(50%+2.5rem)] z-10 flex justify-center'
          : twJoin(visibleMapCenterClassName, 'top-1/2 z-10')
      }
    >
      <div
        className={twJoin(
          'max-w-md rounded-sm px-3 py-1.5 text-center text-sm text-balance shadow-md',
          accent.className,
          accent.invertedFgClassName,
        )}
      >
        {children}
      </div>
    </div>
  )
}
