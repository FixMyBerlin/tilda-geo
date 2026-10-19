import { twJoin } from 'tailwind-merge'

/**
 * Collapsible box (factors, wizard steps). Collapsed, it would otherwise look just like the
 * panel's flat info/toggle rows and be overlooked as clickable — so it gets a filled header when
 * collapsed. The border stays strong enough when open to be visible on the tinted panel and hold
 * the box together.
 */
export const collapsibleBoxClass = (open: boolean) =>
  twJoin('rounded border', open ? 'border-gray-300' : 'border-gray-300 hover:border-gray-400')

export const collapsibleBoxHeaderClass = (open: boolean, twoLine = false) =>
  twJoin(
    'flex w-full cursor-pointer px-2.5 py-2 text-left text-sm font-semibold text-gray-800',
    twoLine ? 'flex-col gap-1.5' : 'items-center gap-2',
    open ? 'border-b border-gray-300 hover:bg-gray-50' : 'rounded bg-gray-100 hover:bg-gray-200',
  )
