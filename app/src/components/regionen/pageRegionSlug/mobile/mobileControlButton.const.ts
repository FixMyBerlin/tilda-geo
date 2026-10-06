import { twMerge } from 'tailwind-merge'
import {
  mapOverlayActionOutlineClassName,
  mapOverlayButtonElevationClassName,
  mapOverlayControlSizeClassName,
} from '../mapOverlayChrome.const'

/**
 * Shared appearance for the floating control buttons in the mobile map header
 * (region menu, layers, search, user). Sizing is added per button (most are
 * `size-8.5`; the region/logo button is width-flexible). Keeps them visually
 * consistent with each other and with the bottom-right map controls.
 *
 * Plus control recipe: gray-300 action outline (not layout `border`) + shared map elevation.
 */
export const mobileControlButtonClassName = twMerge(
  'flex items-center justify-center rounded-md bg-white text-gray-700 hover:bg-yellow-50 focus:ring-2 focus:ring-yellow-500 focus:outline-none',
  mapOverlayActionOutlineClassName,
  mapOverlayButtonElevationClassName,
)

/** Square map control button (globe, notes new, etc.). */
export const mobileMapIconButtonClassName = twMerge(
  mobileControlButtonClassName,
  mapOverlayControlSizeClassName,
)

/**
 * Outline Heroicon inside a map control. Search (`MagnifyingGlassIcon` at `size-6`) is the
 * reference: 24px canvas, default 1.5 stroke. Use this for the overlay buttons
 * (search, zoom, download, globe, debug). The layers control stays a larger icon by design.
 */
export const mapControlIconClassName = 'size-6'

/**
 * Vertical connected group (zoom ±). `-space-y-px` overlaps per-segment hairlines into a
 * single outer edge + internal dividers; shadow lives on the group wrapper.
 */
export const mapControlButtonGroupClassName = twMerge(
  'isolate flex flex-col -space-y-px rounded-md',
  mapOverlayButtonElevationClassName,
)

/** Trigger inside a mapControlButtonGroup — radius/shadow on group; hairline on each segment. */
export const mapControlButtonGroupSegmentClassName =
  'rounded-none shadow-none focus:relative focus:z-10'

/**
 * Applied (via `twMerge`) on top of the base when the button's panel/sheet is open,
 * so the background indicates "this panel is open". Overrides the base hairline/bg.
 */
export const mobileControlButtonActiveClassName = 'outline-yellow-400 bg-yellow-100 text-yellow-900'
