/** Planungspanel-Breite (etwas über Standard-`w-80`). */
export const PLANNING_PANEL_WIDTH = 'w-[22rem]'

/** Kompakte Eingabefelder — eine Stufe kleiner als Panel-Fließtext (`text-sm`). */
const planningInputClass =
  'rounded border border-gray-300 p-[3px] text-xs leading-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400'

export const planningNumberInputClass = `${planningInputClass} w-14 text-right tabular-nums`

export const planningTextInputClass = `${planningInputClass} w-full`
