/**
 * Shared appearance for the floating control buttons in the mobile map header
 * (region menu, layers, search, user). Sizing is added per button (most are
 * `size-10`; the region/logo button is width-flexible). Keeps them visually
 * consistent with each other and with the bottom-right map controls.
 */
export const mobileControlButtonClassName =
  'flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 shadow-md hover:bg-yellow-50 focus:ring-2 focus:ring-yellow-500 focus:outline-none'

/**
 * Applied (via `twMerge`) on top of the base when the button's panel/sheet is open,
 * so the background indicates "this panel is open". Overrides the base border/bg.
 */
export const mobileControlButtonActiveClassName = 'border-yellow-400 bg-yellow-100 text-yellow-900'
