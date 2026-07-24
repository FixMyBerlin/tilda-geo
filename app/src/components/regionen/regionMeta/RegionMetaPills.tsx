import { twMerge } from 'tailwind-merge'
import type { TRegion } from '@/server/regions/regionConfigMapper.server'
import { RegionPromotedPill } from './RegionPromotedPill'
import { RegionStatusPill } from './RegionStatusPill'

type RegionMeta = Pick<TRegion, 'status' | 'promoted'>

type Props = {
  region: RegionMeta
  className?: string
  pillClassName?: string
}

export const RegionMetaPills = ({ region, className, pillClassName }: Props) => {
  const showStatus = region.status !== 'PUBLIC' || !region.promoted
  const showPromoted = !region.promoted

  if (!showStatus && !showPromoted) return null

  return (
    <div className={twMerge('flex flex-wrap gap-1', className)}>
      {showStatus && <RegionStatusPill status={region.status} className={pillClassName} />}
      {showPromoted && <RegionPromotedPill promoted={region.promoted} className={pillClassName} />}
    </div>
  )
}
