import { twJoin } from 'tailwind-merge'

/** Planungspanel-Breite (etwas über Standard-`w-80`). */
export const PLANNING_PANEL_WIDTH = 'w-[22rem]'

/** Radio-artige Auswahlbuttons (eine Option aktiv). Farbe bleibt pro Kontext. */
export const planningRadioButtonClass = (active: boolean, accent: 'blue' | 'green' = 'blue') =>
  twJoin(
    'rounded border px-2 py-1.5 text-xs font-medium transition-colors',
    active
      ? accent === 'green'
        ? 'border-green-700 bg-green-50 text-green-700'
        : 'border-blue-600 bg-blue-50 text-blue-700'
      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
  )

/** Kompakte Eingabefelder — eine Stufe kleiner als Panel-Fließtext (`text-sm`). */
const planningInputClass =
  'rounded border border-gray-300 p-[3px] text-xs leading-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400'

export const planningNumberInputClass = `${planningInputClass} w-14 text-right tabular-nums`

export const planningTextInputClass = `${planningInputClass} w-full`

/** Volle Panel-Breite, normale Schriftgröße — für Titel/Name-Felder im Assistenten. */
export const planningPanelTitleInputClass =
  'w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none'
