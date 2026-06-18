import { twMerge } from 'tailwind-merge'

const colors = {
  gray: 'bg-gray-50 text-gray-600 ring-1 ring-gray-500/10 ring-inset',
  red: 'bg-red-50 text-red-700 ring-1 ring-red-600/10 ring-inset',
  yellow: 'bg-yellow-50 text-yellow-800 ring-1 ring-yellow-600/20 ring-inset',
  green: 'bg-green-50 text-green-700 ring-1 ring-green-600/20 ring-inset',
  blue: 'bg-blue-50 text-blue-700 ring-1 ring-blue-700/10 ring-inset',
  indigo: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-700/10 ring-inset',
  purple: 'bg-purple-50 text-purple-700 ring-1 ring-purple-700/10 ring-inset',
  pink: 'bg-pink-50 text-pink-700 ring-1 ring-pink-700/10 ring-inset',
  // Solide Marken-Pills (Marketing-Seiten), ohne Ring.
  amber: 'bg-[#ffb400] text-[#6b4900]',
  amberSoft: 'bg-[#fabe48]/15 text-[#7e5700]',
}

const invertedColors = {
  gray: 'bg-gray-600 text-white ring-1 ring-gray-400/30 ring-inset',
  red: 'bg-red-600 text-white ring-1 ring-red-400/30 ring-inset',
  yellow: 'bg-yellow-600 text-white ring-1 ring-yellow-400/30 ring-inset',
  green: 'bg-green-600 text-white ring-1 ring-green-400/30 ring-inset',
  blue: 'bg-blue-600 text-white ring-1 ring-blue-400/30 ring-inset',
  indigo: 'bg-indigo-600 text-white ring-1 ring-indigo-400/30 ring-inset',
  purple: 'bg-purple-600 text-white ring-1 ring-purple-400/30 ring-inset',
  pink: 'bg-pink-600 text-white ring-1 ring-pink-400/30 ring-inset',
  amber: 'bg-[#ffb400] text-[#6b4900]',
  amberSoft: 'bg-[#fabe48]/15 text-[#7e5700]',
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
        'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium',
        inverted ? invertedColors[color] : colors[color],
        className,
      )}
    >
      {children}
    </span>
  )
}
