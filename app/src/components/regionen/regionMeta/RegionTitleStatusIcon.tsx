import type { RegionStatus } from '@/prisma/generated/browser'
import { RegionStatusPill } from './RegionStatusPill'

type Props = {
  status: RegionStatus
  className?: string
}

export const RegionTitleStatusIcon = ({ status, className }: Props) => {
  if (status === 'PRIVATE') {
    return <RegionStatusPill status="PRIVATE" variant="icon" className={className} />
  }
  if (status === 'DEACTIVATED') {
    return <RegionStatusPill status="DEACTIVATED" variant="icon" className={className} />
  }
  return null
}
