import { AdminConsoleDumpButton } from '@/components/admin/AdminConsoleDumpButton'
import { AuditActionPill, auditChangeSourceColor } from '@/components/admin/audit-log/auditLogPills'
import { formatDateTimeBerlin } from '@/components/shared/date/formatDateBerlin'
import { Link } from '@/components/shared/links/Link'
import { Pill } from '@/components/shared/text/Pill'
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
        <ul className="divide-y divide-gray-200 rounded-lg ring-1 ring-gray-900/5">
          {rows.map((row) => (
            <li key={row.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <AuditActionPill action={row.action} />
                {row.changeSource ? (
                  <Pill color={auditChangeSourceColor(row.changeSource)}>{row.changeSource}</Pill>
                ) : null}
                <span className="text-gray-500">{formatDateTimeBerlin(row.createdAt)}</span>
                {row.userId ? <span className="text-gray-500">· {row.userId}</span> : null}
                {row.changedFields.length > 0 ? (
                  <span className="text-gray-500">· {row.changedFields.join(', ')}</span>
                ) : null}
                <AdminConsoleDumpButton
                  name={`audit-${row.id}`}
                  data={{ oldData: row.oldData, newData: row.newData }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
