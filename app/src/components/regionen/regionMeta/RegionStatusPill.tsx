import { LockClosedIcon } from '@heroicons/react/24/outline'
import { twMerge } from 'tailwind-merge'
import { Pill } from '@/components/shared/text/Pill'
import { regionStatusPillLabel } from '@/data/regionLabels.const'
import type { RegionStatus } from '@/prisma/generated/browser'

type Props = {
  status: RegionStatus
  className?: string
}

export const RegionStatusPill = ({ status, className }: Props) => {
  switch (status) {
    case 'DEACTIVATED':
      return (
        <Pill color="gray" className={className}>
          {regionStatusPillLabel.DEACTIVATED}
        </Pill>
      )
    case 'PRIVATE':
      return (
        <Pill color="purple" className={twMerge('gap-1', className)} inverted>
          <LockClosedIcon className="size-3.5 shrink-0" aria-hidden="true" />
          {regionStatusPillLabel.PRIVATE}
        </Pill>
      )
    case 'PUBLIC':
      return (
        <Pill color="blue" className={className}>
          {regionStatusPillLabel.PUBLIC}
        </Pill>
      )
  }
}
