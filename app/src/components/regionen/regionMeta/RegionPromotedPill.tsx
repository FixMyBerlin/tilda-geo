import { Pill } from '@/components/shared/text/Pill'
import { regionPromotedPillLabel } from '@/data/regionLabels.const'

type Props = {
  promoted: boolean
  className?: string
}

export const RegionPromotedPill = ({ promoted, className }: Props) => {
  switch (promoted) {
    case true:
      return (
        <Pill color="green" className={className}>
          {regionPromotedPillLabel.true}
        </Pill>
      )
    case false:
      return (
        <Pill color="red" className={className}>
          {regionPromotedPillLabel.false}
        </Pill>
      )
  }
}
