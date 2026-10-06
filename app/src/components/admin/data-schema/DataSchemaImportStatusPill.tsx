import { Pill } from '@/components/shared/text/Pill'
import type { DataSchemaImportStatus } from '@/prisma/generated/client'

const statusConfig = {
  PENDING: { label: 'Wartend', color: 'gray' },
  RUNNING: { label: 'Läuft', color: 'yellow' },
  SUCCESS: { label: 'Erfolgreich', color: 'green' },
  FAILED: { label: 'Fehlgeschlagen', color: 'red' },
} as const satisfies Record<
  DataSchemaImportStatus,
  { label: string; color: 'gray' | 'yellow' | 'green' | 'red' }
>

export const DataSchemaImportStatusPill = ({ status }: { status: DataSchemaImportStatus }) => {
  const config = statusConfig[status]
  return (
    <Pill color={config.color} className={status === 'RUNNING' ? 'animate-pulse' : undefined}>
      {config.label}
    </Pill>
  )
}
