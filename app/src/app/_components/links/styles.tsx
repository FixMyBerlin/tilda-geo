import { twJoin, twMerge } from 'tailwind-merge'

export const linkStyles = twJoin(
  'underline decoration-yellow-600 underline-offset-4 hover:text-yellow-700 hover:decoration-2 active:text-yellow-700 active:decoration-2',
)

export const buttonStyles = twJoin(
  'inline-flex items-center rounded-md border border-transparent bg-yellow-100 px-4 py-2 leading-4 font-semibold text-gray-800 shadow-sm select-none group-hover:bg-yellow-400 hover:bg-yellow-400 focus:ring-2 focus:ring-yellow-50 focus:ring-offset-2 focus:outline-none',
)

export const buttonStylesOnYellow = twMerge(buttonStyles, 'bg-yellow-400/80 shadow')

export const notesButtonStyle = twMerge(buttonStyles, 'bg-gray-100 p-1.5')
