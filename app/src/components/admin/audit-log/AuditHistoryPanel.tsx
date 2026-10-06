import { AdminEmptyState } from '@/components/admin/AdminEmptyState'
import { AdminFormSection } from '@/components/admin/aside/AdminFormSection'
import { AuditLogTable } from '@/components/admin/audit-log/AuditLogTable'
import { Link } from '@/components/shared/links/Link'
import type { AuditLogRow } from '@/server/audit/queries/listAuditLog.server'

type Props = {
  /** Section id for the jump list — usually `history`. */
  id: string
  rows: AuditLogRow[]
  /** Link target to the full audit log filtered to this record (model + recordId). */
  model: string
  recordId: string
}

/** „Änderungsverlauf“ section on admin edit / detail pages (before `AdminTechnicalDetails`). */
export const AuditHistoryPanel = ({ id, rows, model, recordId }: Props) => {
  return (
    <AdminFormSection
      id={id}
      title="Änderungsverlauf"
      action={
        <Link to="/admin/audit-log" search={{ model, recordId: String(recordId) }}>
          Vollständiger Verlauf
        </Link>
      }
    >
      {rows.length === 0 ? (
        <AdminEmptyState bare>Noch keine Einträge vorhanden.</AdminEmptyState>
      ) : (
        <AuditLogTable rows={rows} fixedModel={model} fixedRecordId={String(recordId)} />
      )}
    </AdminFormSection>
  )
}
