import type { Prisma, UserRoleEnum } from '@/prisma/generated/client'
import type { AuditChangeSource } from '@/server/audit/auditChangeSources.const'
import type { AuditLogListFilters } from '@/server/audit/auditLogFilters.schema'
import { auditLogChangeSource } from '@/server/audit/auditLogMetadata.schema'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { paginate } from '@/server/utils/paginate.server'
import type { PaginatedList } from '@/shared/pagination/types'

type DbAuditLogRow = Prisma.AuditLogGetPayload<Record<string, never>>

type AuditLogUser = {
  osmName: string | null
  osmId: number
  firstName: string | null
  lastName: string | null
  email: string
  role: UserRoleEnum
}

export type AuditLogRow = DbAuditLogRow & {
  changeSource: AuditChangeSource | null
  user: AuditLogUser | null
}

export type ListAuditLogResult = PaginatedList<AuditLogRow>

const DEFAULT_TAKE = 50
const MAX_TAKE = 200

const AUDIT_LOG_USER_SELECT = {
  id: true,
  osmName: true,
  osmId: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
} as const

const loadUsersById = async (userIds: string[]) => {
  const uniqueIds = [...new Set(userIds.filter(Boolean))]
  if (uniqueIds.length === 0) return new Map<string, AuditLogUser>()

  const users = await db.user.findMany({
    where: { id: { in: uniqueIds } },
    select: AUDIT_LOG_USER_SELECT,
  })

  return new Map(
    users.map((user) => [
      user.id,
      {
        osmName: user.osmName,
        osmId: user.osmId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      } satisfies AuditLogUser,
    ]),
  )
}

const toAuditLogRows = async (rows: DbAuditLogRow[]): Promise<AuditLogRow[]> => {
  const usersById = await loadUsersById(rows.flatMap((row) => (row.userId ? [row.userId] : [])))

  return rows.map((row) => ({
    ...row,
    changeSource: auditLogChangeSource(row.metadata),
    user: row.userId ? (usersById.get(row.userId) ?? null) : null,
  }))
}

/** Child rows of Region that MCP/admin region writes replace via deleteMany + createMany. */
const REGION_ASSIGNMENT_AUDIT_MODELS = [
  'RegionCategoryAssignment',
  'RegionBackgroundAssignment',
  'RegionExportAssignment',
  'RegionNavigationLink',
] as const

/** Region scalar row plus category/export/nav/background assignment changes for one region. */
const regionAuditHistoryWhere = (regionId: number): Prisma.AuditLogWhereInput => {
  const assignmentRegionFilter = REGION_ASSIGNMENT_AUDIT_MODELS.flatMap((model) => [
    {
      model,
      oldData: { path: ['regionId'], equals: regionId },
    },
    {
      model,
      newData: { path: ['regionId'], equals: regionId },
    },
  ]) satisfies Prisma.AuditLogWhereInput[]

  return {
    OR: [{ model: 'Region', recordId: String(regionId) }, ...assignmentRegionFilter],
  }
}

/**
 * Query the unified AuditLog (written by the @explita/prisma-audit-log extension) across all audited
 * models. Filterable by model, record, user, changeSource (stored in metadata JSON), and date range.
 * Ordered newest-first with offset pagination.
 *
 * When `model=Region` and `recordId` are both set, expands to the same scope as region edit history
 * (Region row + related assignment models).
 *
 * Callers must enforce auth (`requireAdmin` or `guardAdminApi`) before invoking.
 */
export async function listAuditLog(filters: AuditLogListFilters = {}): Promise<ListAuditLogResult> {
  const createdAt: Prisma.DateTimeFilter = {}
  if (filters.from) createdAt.gte = filters.from
  if (filters.to) createdAt.lte = filters.to

  const expandRegionHistory = filters.model === 'Region' && filters.recordId !== undefined
  const regionId = expandRegionHistory ? Number(filters.recordId) : Number.NaN
  const regionWhere =
    expandRegionHistory && Number.isInteger(regionId) ? regionAuditHistoryWhere(regionId) : null

  const where: Prisma.AuditLogWhereInput = {
    ...(regionWhere ?? {
      ...(filters.model ? { model: filters.model } : {}),
      ...(filters.recordId ? { recordId: filters.recordId } : {}),
    }),
    ...(filters.userId ? { userId: filters.userId } : {}),
    ...(filters.changeSource
      ? { metadata: { path: ['changeSource'], equals: filters.changeSource } }
      : {}),
    ...(createdAt.gte || createdAt.lte ? { createdAt } : {}),
  }

  return paginate({
    skip: filters.skip,
    take: filters.take,
    defaultTake: DEFAULT_TAKE,
    maxTake: MAX_TAKE,
    count: () => db.auditLog.count({ where }),
    query: async ({ skip, take }) => {
      const rows = await db.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip })
      return toAuditLogRows(rows)
    },
  })
}

/** Recent audit entries for one record (admin edit-page history panel). Requires admin session. */
export async function getAuditHistoryForRecord(
  headers: Headers,
  model: string,
  recordId: string,
  take = 20,
): Promise<AuditLogRow[]> {
  await requireAdmin(headers)
  const { rows } = await listAuditLog({ model, recordId, take })
  return rows
}

/** Region edit history: scalar Region row plus category/export/nav/background assignment changes. */
export async function getAuditHistoryForRegionEdit(
  headers: Headers,
  regionId: number,
  take = 20,
): Promise<AuditLogRow[]> {
  await requireAdmin(headers)

  const rows = await db.auditLog.findMany({
    where: regionAuditHistoryWhere(regionId),
    orderBy: { createdAt: 'desc' },
    take,
  })
  return toAuditLogRows(rows)
}
