import { Pill } from '@/components/shared/text/Pill'
import type { ProcessingMetaStatus } from '@/server/processing/schemas'

const statusConfig = {
  processing: { label: 'Verarbeitung läuft', color: 'yellow' },
  postprocessing: { label: 'Nachgelagerte Schritte', color: 'yellow' },
  processed: { label: 'Abgeschlossen', color: 'green' },
} as const satisfies Record<ProcessingMetaStatus, { label: string; color: 'yellow' | 'green' }>

export const ProcessingStatusPill = ({ status }: { status: ProcessingMetaStatus }) => {
  const config = statusConfig[status]
  return (
    <Pill color={config.color} className={status === 'processing' ? 'animate-pulse' : undefined}>
      {config.label}
    </Pill>
  )
}
