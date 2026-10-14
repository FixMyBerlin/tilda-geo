import { twJoin } from 'tailwind-merge'

/**
 * Auf-/zuklappbare Box (Faktoren, Wizard-Schritte). Eingeklappt sieht sie sonst genauso aus wie
 * die flachen Info-/Schalterzeilen des Panels und wird als klickbar übersehen — deshalb bekommt
 * sie zugeklappt einen gefüllten Kopf. Der Rahmen bleibt auch aufgeklappt kräftig genug, um auf
 * dem getönten Panel sichtbar zu sein und die Box zusammenzuhalten.
 */
export const collapsibleBoxClass = (open: boolean) =>
  twJoin('rounded border', open ? 'border-gray-300' : 'border-gray-300 hover:border-gray-400')

export const collapsibleBoxHeaderClass = (open: boolean, twoLine = false) =>
  twJoin(
    'flex w-full cursor-pointer px-2.5 py-2 text-left text-sm font-semibold text-gray-800',
    twoLine ? 'flex-col gap-1.5' : 'items-center gap-2',
    open ? 'border-b border-gray-300 hover:bg-gray-50' : 'rounded bg-gray-100 hover:bg-gray-200',
  )
