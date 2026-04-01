import type { RegionStatus } from '@prisma/client'
import { Pill } from '@/components/shared/text/Pill'

type Props = {
  status: RegionStatus
  className?: string
}

export const RegionStatusPill = ({ status, className }: Props) => {
  switch (status) {
    case 'DEACTIVATED':
      return (
        <Pill color="gray" className={className}>
          Deaktiviert
        </Pill>
      )
    case 'PRIVATE':
      return (
        <Pill color="purple" className={className} inverted>
          Privat
        </Pill>
      )
    case 'PUBLIC':
      return (
        <Pill color="blue" className={className}>
          Öffentlich
        </Pill>
      )
  }
}
