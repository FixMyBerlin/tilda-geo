import { getFullname } from '@/components/admin/memberships/pageMemberships/utils/getFullname'
import type { AuditLogRow } from '@/server/audit/queries/listAuditLog.server'

/** Display name: real name if set, otherwise OSM username (or email / raw id). No OSM numeric id. */
export const formatAuditLogUser = (row: Pick<AuditLogRow, 'userId' | 'user'>) => {
  if (!row.userId) return '—'
  if (!row.user) return row.userId

  const fullname = getFullname(row.user)
  return fullname || row.user.osmName || row.user.email
}
