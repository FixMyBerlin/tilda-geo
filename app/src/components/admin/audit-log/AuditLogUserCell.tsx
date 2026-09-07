import { formatAuditLogUser } from '@/components/admin/audit-log/formatAuditLogUser'
import { Link } from '@/components/shared/links/Link'
import { Pill } from '@/components/shared/text/Pill'
import { isAdmin } from '@/components/shared/utils/usersUtils'
import type { AuditLogRow } from '@/server/audit/queries/listAuditLog.server'

export const AuditLogUserCell = ({ row }: { row: Pick<AuditLogRow, 'userId' | 'user'> }) => {
  const label = formatAuditLogUser(row)
  if (!row.userId || !row.user) return label

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <Link to="/admin/memberships/new" search={{ userId: row.userId }}>
        {label}
      </Link>
      {isAdmin(row.user) ? (
        <Pill color="yellow" className="ml-0">
          Admin
        </Pill>
      ) : null}
    </span>
  )
}
