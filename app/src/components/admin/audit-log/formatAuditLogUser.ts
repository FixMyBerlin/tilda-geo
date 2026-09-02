import { getFullname } from '@/components/admin/memberships/pageMemberships/utils/getFullname'
import type { AuditLogRow } from '@/server/audit/queries/listAuditLog.server'

/** Compact admin label: `osmName (osmId)`, with fullname/email fallbacks; raw userId if user deleted. */
export const formatAuditLogUser = (row: Pick<AuditLogRow, 'userId' | 'user'>) => {
  if (!row.userId) return '—'
  if (!row.user) return row.userId

  const name = row.user.osmName || getFullname(row.user) || row.user.email
  return `${name} (${row.user.osmId})`
}
