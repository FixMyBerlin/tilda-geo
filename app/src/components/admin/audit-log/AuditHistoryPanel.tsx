import { AuditLogTable } from '@/components/admin/audit-log/AuditLogTable'
import { Link } from '@/components/shared/links/Link'
import type { AuditLogRow } from '@/server/audit/queries/listAuditLog.server'

type Props = {
  rows: AuditLogRow[]
  /** Link target to the full audit log filtered to this record (model + recordId). */
  model: string
  recordId: string
}

/** Compact "Änderungshistorie" panel embedded on an admin edit page. */
export const AuditHistoryPanel = ({ rows, model, recordId }: Props) => {
  return (
    <section className="my-10">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-semibold">Änderungshistorie</h2>
        <Link
          to="/admin/audit-log"
          search={{ model, recordId: String(recordId) }}
          className="text-sm"
        >
          Vollständiger Verlauf →
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-gray-500">Keine Einträge.</p>
      ) : (
        <AuditLogTable rows={rows} fixedModel={model} fixedRecordId={String(recordId)} />
      )}
    </section>
  )
}
