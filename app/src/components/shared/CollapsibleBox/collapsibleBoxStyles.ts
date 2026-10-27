import { twJoin } from 'tailwind-merge'

/**
 * Collapsible box (Flächenfinder sections). Light gray like the header, open or closed, so the
 * section reads as one block on the tinted panel and its rows are clearly part of it.
 */
export const collapsibleBoxClass = (open: boolean) =>
  twJoin(
    'rounded border bg-gray-100',
    open ? 'border-gray-300' : 'border-gray-300 hover:border-gray-400',
  )

export const collapsibleBoxHeaderClass = (open: boolean, twoLine = false) =>
  twJoin(
    'flex w-full cursor-pointer rounded px-2.5 py-2 text-left text-sm font-semibold text-gray-800 hover:bg-gray-200',
    twoLine ? 'flex-col gap-1.5' : 'items-center gap-2',
    open && 'rounded-b-none border-b border-gray-300',
  )
