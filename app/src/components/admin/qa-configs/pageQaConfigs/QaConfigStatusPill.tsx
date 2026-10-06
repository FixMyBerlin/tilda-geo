import { Pill } from '@/components/shared/text/Pill'

export const QaConfigStatusPill = ({ isActive }: { isActive: boolean }) => (
  <Pill color={isActive ? 'green' : 'gray'}>{isActive ? 'Aktiv' : 'Inaktiv'}</Pill>
)
