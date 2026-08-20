import { Pill } from '@/components/shared/text/Pill'
import type { DataSchemaImportStatus } from '@/prisma/generated/client'

const statusConfig: Record<
  DataSchemaImportStatus,
  { label: string; color: 'yellow' | 'blue' | 'green' | 'red' }
> = {
  PENDING: { label: 'Wartend', color: 'yellow' },
  RUNNING: { label: 'Läuft', color: 'blue' },
  SUCCESS: { label: 'Erfolgreich', color: 'green' },
  FAILED: { label: 'Fehlgeschlagen', color: 'red' },
}

export const DataSchemaImportStatusPill = ({ status }: { status: DataSchemaImportStatus }) => {
  const config = statusConfig[status]
  return (
    <Pill color={config.color} className={status === 'RUNNING' ? 'animate-pulse' : undefined}>
      {config.label}
    </Pill>
  )
}
