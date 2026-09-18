import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { twJoin } from 'tailwind-merge'
import { AdminDescriptionList } from '@/components/admin/AdminDescriptionList'
import { AdminTable, adminTableClasses } from '@/components/admin/AdminTable'
import type { AdminTableHeaderCell } from '@/components/admin/AdminTable'
import { AuditActionPill, auditChangeSourceColor } from '@/components/admin/audit-log/auditLogPills'
import { AuditLogUserCell } from '@/components/admin/audit-log/AuditLogUserCell'
import { ObjectDump } from '@/components/admin/ObjectDump'
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
  footer?: ReactNode
}

const buildHeader = (showModel: boolean, showRecordId: boolean) => {
  const header: AdminTableHeaderCell[] = [{ id: 'expand', label: 'Details', srOnly: true }]
  header.push('Zeitpunkt')
  if (showModel) header.push('Modell')
  if (showRecordId) header.push('ID')
  header.push('Aktion', 'Quelle', 'User', 'Felder')
  return header
}

const expandButtonClassName =
  'inline-flex size-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700'

const AuditLogTableRow = ({
  row,
  showModel,
  showRecordId,
  columnCount,
}: {
  row: AuditLogRow
  showModel: boolean
  showRecordId: boolean
  columnCount: number
}) => {
  const [open, setOpen] = useState(false)
  const hasDetails =
    row.oldData !== null || row.newData !== null || !!row.ipAddress || !!row.userAgent

  return (
    <>
      <tr>
        <td className={twJoin(adminTableClasses.td, 'w-8 pr-0')}>
          {hasDetails ? (
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              className={expandButtonClassName}
            >
              <ChevronRightIcon
                aria-hidden="true"
                className={twJoin('size-4 transition-transform', open && 'rotate-90')}
              />
              <span className="sr-only">Details {open ? 'ausblenden' : 'anzeigen'}</span>
            </button>
          ) : null}
        </td>
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
        <td className={adminTableClasses.td}>
          <AuditLogUserCell row={row} />
        </td>
        <td className={adminTableClasses.td}>
          {row.changedFields.length > 0 ? (
            <span
              className="block max-w-[16rem] min-w-0 truncate"
              title={row.changedFields.join(', ')}
            >
              {row.changedFields.join(', ')}
            </span>
          ) : (
            '—'
          )}
        </td>
      </tr>
      {open ? (
        <tr>
          <td colSpan={columnCount} className="space-y-3 bg-gray-50 px-4 py-3 sm:px-6">
            {row.ipAddress || row.userAgent ? (
              <AdminDescriptionList
                items={[
                  { label: 'IP-Adresse', value: row.ipAddress },
                  { label: 'User-Agent', value: row.userAgent },
                ]}
              />
            ) : null}
            <div className="space-y-2">
              {row.oldData !== null ? <ObjectDump title="Vorher" data={row.oldData} /> : null}
              {row.newData !== null ? <ObjectDump title="Nachher" data={row.newData} /> : null}
              {row.metadata !== null ? <ObjectDump title="Metadaten" data={row.metadata} /> : null}
            </div>
          </td>
        </tr>
      ) : null}
    </>
  )
}

/** Shared audit history table for edit-page panels and `/admin/audit-log`; rows expand for the raw diff. */
export const AuditLogTable = ({ rows, fixedModel, fixedRecordId, footer }: Props) => {
  const showModel = fixedModel === undefined || rows.some((row) => row.model !== fixedModel)
  const showRecordId =
    fixedRecordId === undefined || rows.some((row) => row.recordId !== fixedRecordId)
  const header = buildHeader(showModel, showRecordId)

  return (
    <AdminTable header={header} footer={footer}>
      {rows.map((row) => (
        <AuditLogTableRow
          key={row.id}
          row={row}
          showModel={showModel}
          showRecordId={showRecordId}
          columnCount={header.length}
        />
      ))}
    </AdminTable>
  )
}
