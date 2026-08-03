import { twMerge } from 'tailwind-merge'

/**
 * Shared appearance for the floating control buttons in the mobile map header
 * (region menu, layers, search, user). Sizing is added per button (most are
 * `size-10`; the region/logo button is width-flexible). Keeps them visually
 * consistent with each other and with the bottom-right map controls.
 */
export const mobileControlButtonClassName =
  'flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 shadow-md hover:bg-yellow-50 focus:ring-2 focus:ring-yellow-500 focus:outline-none'

/** Square map control button (globe, notes toggle, etc.). */
export const mobileMapIconButtonClassName = twMerge(mobileControlButtonClassName, 'size-10')

/**
 * Middle segment of a split notes control group (filter, download).
 * `-ml-px` overlaps borders with the previous segment. Outer rounding is on the first/last segments.
 */
export const notesSplitControlSegmentClassName = twMerge(
  mobileMapIconButtonClassName,
  'z-0 -ml-px rounded-none shadow-none',
)

/** Toggle button when the split group is open (left segment). */
export const notesSplitControlFirstSegmentClassName = 'rounded-l-md rounded-r-none shadow-none'

/** Plus button (right segment). Square inner corners avoid white gaps at the group radius. */
export const notesSplitControlLastSegmentClassName = twMerge(
  notesSplitControlSegmentClassName,
  'rounded-l-none rounded-r-md',
)

/** Wrapper when the notes control is expanded into a split button group. */
export const notesSplitControlGroupClassName = 'isolate flex rounded-md shadow-md'

/**
 * Applied (via `twMerge`) on top of the base when the button's panel/sheet is open,
 * so the background indicates "this panel is open". Overrides the base border/bg.
 */
export const mobileControlButtonActiveClassName = 'border-yellow-400 bg-yellow-100 text-yellow-900'
