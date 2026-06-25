import { twMerge } from 'tailwind-merge'
import { filterChipStyles, filterChipStylesActive } from '@/components/shared/links/styles'
import { Pill } from '@/components/shared/text/Pill'
import { FilterChipDot } from './FilterChipDot'

export const filterChipClassName = (active: boolean) =>
  active ? filterChipStylesActive : filterChipStyles

type FilterChipProps = {
  active?: boolean
  dotFillClassName?: string
  count?: number
  children: React.ReactNode
  className?: string
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'>

export const FilterChip = ({
  active = false,
  dotFillClassName,
  count,
  children,
  className,
  type = 'button',
  ...props
}: FilterChipProps) => {
  return (
    <button
      type={type}
      className={twMerge(filterChipClassName(active), 'gap-1.5', className)}
      aria-pressed={active}
      {...props}
    >
      {dotFillClassName ? <FilterChipDot fillClassName={dotFillClassName} /> : null}
      {children}
      {count !== undefined ? (
        <Pill
          color={active ? 'yellow' : 'gray'}
          className="ml-0.5 min-w-5 justify-center rounded px-1 py-px text-[0.65rem] leading-none tracking-tighter lining-nums tabular-nums"
        >
          {count}
        </Pill>
      ) : null}
    </button>
  )
}
