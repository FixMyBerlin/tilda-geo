import { AdminConsoleDumpButton } from '@/components/admin/AdminConsoleDumpButton'
import { AuditActionPill, auditChangeSourceColor } from '@/components/admin/audit-log/auditLogPills'
import { formatDateTimeBerlin } from '@/components/shared/date/formatDateBerlin'
import { Pill } from '@/components/shared/text/Pill'
import type { AuditLogRow } from '@/server/audit/queries/listAuditLog.server'

type Props = {
  row: AuditLogRow
  /** When set, omit model on rows that match (e.g. Region edit / Region filter). */
  fixedModel?: string
  /** When set, omit recordId on rows that match (e.g. single-record filter). */
  fixedRecordId?: string
}

const recordLabel = (row: AuditLogRow, showModel: boolean) => {
  if (showModel) return `${row.model} #${row.recordId}`
  return `#${row.recordId}`
}

/** One Änderungshistorie / audit-log list row; field visibility depends on page/filter context. */
export const AuditLogListRow = ({ row, fixedModel, fixedRecordId }: Props) => {
  const showModel = fixedModel === undefined || row.model !== fixedModel
  const showRecordId = fixedRecordId === undefined || row.recordId !== fixedRecordId

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <AuditActionPill action={row.action} />
        {row.changeSource ? (
          <Pill color={auditChangeSourceColor(row.changeSource)}>{row.changeSource}</Pill>
        ) : null}
        <span className="text-gray-500">{formatDateTimeBerlin(row.createdAt)}</span>
        <span className="text-gray-500">· {row.userId ?? '—'}</span>
        {showModel || showRecordId ? (
          <span className="text-gray-500">· {recordLabel(row, showModel)}</span>
        ) : null}
        {row.changedFields.length > 0 ? (
          <span className="text-gray-500">· {row.changedFields.join(', ')}</span>
        ) : null}
        <AdminConsoleDumpButton name={`audit-${row.id}`} data={row} />
      </div>
    </li>
  )
}
