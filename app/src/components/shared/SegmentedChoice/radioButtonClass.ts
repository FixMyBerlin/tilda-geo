import { twJoin } from 'tailwind-merge'

export const toggleButtonBase = 'rounded border px-2 py-1.5 text-xs font-medium transition-colors'
export const toggleButtonInactive = 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'

/** Radio-artige Auswahlbuttons (eine Option aktiv). Farbe bleibt pro Kontext. */
export const radioButtonClass = (active: boolean, accent: 'blue' | 'green' = 'blue') =>
  twJoin(
    toggleButtonBase,
    active
      ? accent === 'green'
        ? 'border-green-700 bg-green-50 text-green-700'
        : 'border-blue-600 bg-blue-50 text-blue-700'
      : toggleButtonInactive,
  )
