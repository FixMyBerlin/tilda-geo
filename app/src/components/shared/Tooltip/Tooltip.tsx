import type React from 'react'
import { twJoin } from 'tailwind-merge'

type Props = {
  text: string
  className?: string
  children: React.ReactNode
}

export const Tooltip = ({ text, children, className }: Props) => {
  return (
    <div className={twJoin('group/tooltip', className)}>
      <div
        className="absolute hidden rounded bg-gray-900/90 p-2 text-xs text-white shadow-md select-none group-hover/tooltip:z-50 group-hover/tooltip:block"
        style={{ top: 0, width: '20.5rem', transform: 'translateY(-100%)' }}
      >
        {text}
      </div>
      {children}
    </div>
  )
}
