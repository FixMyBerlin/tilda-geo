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
        'flex items-center justify-between gap-4 rounded-md bg-pink-100 p-3',
        className,
      )}
    >
      <div className="flex items-center gap-4">{left}</div>
      {right && <div className="flex items-center gap-4">{right}</div>}
    </div>
  )
}
