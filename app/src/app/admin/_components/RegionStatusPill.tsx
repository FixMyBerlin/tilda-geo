import { Pill } from '@/src/app/_components/text/Pill'
import { RegionStatus } from '@prisma/client'

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
        <Pill color="purple" className={className}>
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
