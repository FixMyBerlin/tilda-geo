import { twMerge } from 'tailwind-merge'

const colors = {
  gray: 'bg-gray-50 text-gray-600 ring-gray-500/10',
  red: 'bg-red-50 text-red-700 ring-red-600/10',
  yellow: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20',
  green: 'bg-green-50 text-green-700 ring-green-600/20',
  blue: 'bg-blue-50 text-blue-700 ring-blue-700/10',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-700/10',
  purple: 'bg-purple-50 text-purple-700 ring-purple-700/10',
  pink: 'bg-pink-50 text-pink-700 ring-pink-700/10',
}

const invertedColors = {
  gray: 'bg-gray-600 text-white ring-gray-400/30',
  red: 'bg-red-600 text-white ring-red-400/30',
  yellow: 'bg-yellow-600 text-white ring-yellow-400/30',
  green: 'bg-green-600 text-white ring-green-400/30',
  blue: 'bg-blue-600 text-white ring-blue-400/30',
  indigo: 'bg-indigo-600 text-white ring-indigo-400/30',
  purple: 'bg-purple-600 text-white ring-purple-400/30',
  pink: 'bg-pink-600 text-white ring-pink-400/30',
}

export const Pill = ({
  color,
  className,
  children,
  inverted = false,
}: {
  color: keyof typeof colors
  className?: string
  children: React.ReactNode
  inverted?: boolean
}) => {
  return (
    <span
      className={twMerge(
        className,
        inverted ? invertedColors[color] : colors[color],
        'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
      )}
    >
      {children}
    </span>
  )
}
