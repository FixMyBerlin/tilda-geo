import { Pill } from '@/components/shared/text/Pill'
import type { ProcessingMetaStatus } from '@/server/processing/schemas'

const statusConfig: Record<
  ProcessingMetaStatus,
  { label: string; color: 'yellow' | 'blue' | 'green' }
> = {
  processing: { label: 'Verarbeitung läuft', color: 'yellow' },
  postprocessing: { label: 'Nachbearbeitung', color: 'blue' },
  processed: { label: 'Abgeschlossen', color: 'green' },
}

export const ProcessingStatusPill = ({ status }: { status: ProcessingMetaStatus }) => {
  const config = statusConfig[status]
  return (
    <Pill color={config.color} className={status === 'processing' ? 'animate-pulse' : undefined}>
      {config.label}
    </Pill>
  )
}
