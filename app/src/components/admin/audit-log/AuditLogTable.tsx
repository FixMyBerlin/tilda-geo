import { AdminConsoleDumpButton } from '@/components/admin/AdminConsoleDumpButton'
import { AdminTable, adminTableClasses } from '@/components/admin/AdminTable'
import type { AdminTableHeaderCell } from '@/components/admin/AdminTable'
import { AuditActionPill, auditChangeSourceColor } from '@/components/admin/audit-log/auditLogPills'
import { formatDateTimeBerlin } from '@/components/shared/date/formatDateBerlin'
import { Pill } from '@/components/shared/text/Pill'
import type { AuditLogRow } from '@/server/audit/queries/listAuditLog.server'

type Props = {
  rows: AuditLogRow[]
  /** When set, omit Modell column if every row matches (e.g. Region filter / edit). */
  fixedModel?: string
  /** When set, omit ID column if every row matches (e.g. single-record filter). */
  fixedRecordId?: string
  /** Extra content below the table inside the admin table shell (e.g. pagination). */
  footer?: React.ReactNode
}

const buildHeader = (showModel: boolean, showRecordId: boolean) => {
  const header: AdminTableHeaderCell[] = ['Zeitpunkt']
  if (showModel) header.push('Modell')
  if (showRecordId) header.push('ID')
  header.push('Aktion', 'Quelle', 'User', 'Felder', { id: 'audit-diff', label: '' })
  return header
}

const AuditLogTableRow = ({
  row,
  showModel,
  showRecordId,
}: {
  row: AuditLogRow
  showModel: boolean
  showRecordId: boolean
}) => (
  <tr>
    <td className={adminTableClasses.td}>{formatDateTimeBerlin(row.createdAt)}</td>
    {showModel ? <td className={adminTableClasses.td}>{row.model}</td> : null}
    {showRecordId ? (
      <td className={adminTableClasses.td}>
        <span className="block max-w-[8rem] truncate" title={row.recordId}>
          {row.recordId}
        </span>
      </td>
    ) : null}
    <td className={adminTableClasses.td}>
      <AuditActionPill action={row.action} />
    </td>
    <td className={adminTableClasses.td}>
      {row.changeSource ? (
        <Pill color={auditChangeSourceColor(row.changeSource)}>{row.changeSource}</Pill>
      ) : (
        '—'
      )}
    </td>
    <td className={adminTableClasses.td}>{row.userId ?? '—'}</td>
    <td className={adminTableClasses.td}>
      {row.changedFields.length > 0 ? row.changedFields.join(', ') : '—'}
    </td>
    <td className={adminTableClasses.td}>
      <AdminConsoleDumpButton name={`audit-${row.id}`} data={row} />
    </td>
  </tr>
)

/** Shared audit history table for edit-page panels and `/admin/audit-log`. */
export const AuditLogTable = ({ rows, fixedModel, fixedRecordId, footer }: Props) => {
  const showModel = fixedModel === undefined || rows.some((row) => row.model !== fixedModel)
  const showRecordId =
    fixedRecordId === undefined || rows.some((row) => row.recordId !== fixedRecordId)

  const table = (
    <AdminTable header={buildHeader(showModel, showRecordId)}>
      {rows.map((row) => (
        <AuditLogTableRow
          key={row.id}
          row={row}
          showModel={showModel}
          showRecordId={showRecordId}
        />
      ))}
    </AdminTable>
  )

  if (!footer) return table
  return (
    <div className={adminTableClasses.paginatedShell}>
      {table}
      {footer}
    </div>
  )
}
