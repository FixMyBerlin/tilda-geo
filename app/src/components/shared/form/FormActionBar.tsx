import type { ReactNode } from 'react'
import { twJoin } from 'tailwind-merge'

type Props = {
  left: ReactNode
  right?: ReactNode
  className?: string
}

export function FormActionBar({ left, right, className }: Props) {
  if (!left && !right) {
    return null
  }

  return (
    <div
      className={twJoin(
        'flex items-center justify-between gap-4 rounded-xl bg-white/90 px-4 py-3 shadow-sm ring-1 ring-gray-900/5 dark:bg-gray-800/50 dark:shadow-none dark:ring-white/10',
        className,
      )}
    >
      <div className="flex items-center gap-4">{left}</div>
      {right && <div className="flex items-center gap-4">{right}</div>}
    </div>
  )
}
