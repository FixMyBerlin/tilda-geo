/** Tailwind gray steps so parallel ways stay distinguishable without a loud palette. */
const PROFILE_SERIES_COLORS = [
  '#4b5563', // gray-600
  '#6b7280', // gray-500
  '#374151', // gray-700
  '#9ca3af', // gray-400
  '#1f2937', // gray-800
  '#d1d5db', // gray-300
  '#111827', // gray-900
  '#e5e7eb', // gray-200
] as const

export const terrainProfileSeriesColor = (index: number) =>
  PROFILE_SERIES_COLORS[index % PROFILE_SERIES_COLORS.length]!
