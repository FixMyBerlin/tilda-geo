import { LockClosedIcon } from '@heroicons/react/24/outline'
import { twMerge } from 'tailwind-merge'
import { Pill } from '@/components/shared/text/Pill'
import { regionStatusPillLabel } from '@/data/regionLabels.const'
import type { RegionStatus } from '@/prisma/generated/browser'

type RegionStatusPillVariant = 'text' | 'icon' | 'icon-text'

type Props = {
  status: RegionStatus
  className?: string
  variant?: RegionStatusPillVariant
}

export const RegionStatusPill = ({ status, className, variant = 'icon-text' }: Props) => {
  const showIcon = variant !== 'text'
  const showText = variant !== 'icon'
  const pillClassName = twMerge(
    'shrink-0',
    variant === 'icon' && 'px-1 py-0.5',
    variant === 'text' && 'px-1.5 py-0.5',
    showIcon && showText && 'gap-1',
    className,
  )

  switch (status) {
    case 'DEACTIVATED':
      return (
        <Pill color="gray" className={pillClassName}>
          {showIcon && <LockClosedIcon className="size-3.5 shrink-0" aria-hidden="true" />}
          {showText && regionStatusPillLabel.DEACTIVATED}
        </Pill>
      )
    case 'PRIVATE':
      return (
        <Pill color="purple" className={pillClassName} inverted>
          {showIcon && <LockClosedIcon className="size-3.5 shrink-0" aria-hidden="true" />}
          {showText && regionStatusPillLabel.PRIVATE}
        </Pill>
      )
    case 'PUBLIC':
      return (
        <Pill color="blue" className={pillClassName}>
          {regionStatusPillLabel.PUBLIC}
        </Pill>
      )
  }
}
