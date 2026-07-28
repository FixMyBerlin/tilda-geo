import { twMerge } from 'tailwind-merge'

export const FilterChipDot = ({ fillClassName }: { fillClassName: string }) => (
  <svg viewBox="0 0 6 6" aria-hidden className={twMerge('size-1.5 shrink-0', fillClassName)}>
    <circle r={3} cx={3} cy={3} />
  </svg>
)
