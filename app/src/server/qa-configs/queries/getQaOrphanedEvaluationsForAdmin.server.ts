import { z } from 'zod'
import type { QaEvaluationStatus, QaEvaluatorType, QaSystemStatus } from '@/prisma/generated/client'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { clampSkipTake } from '@/shared/pagination/clampSkipTake'
import type { PaginatedList } from '@/shared/pagination/types'
import { getQaTableName } from '../utils/getQaTableName'

const Schema = z.object({
  configId: z.number(),
  mapTable: z.string(),
  skip: z.number().optional(),
  take: z.number().optional(),
})

export type QaOrphanedEvaluation = {
  areaId: string
  systemStatus: QaSystemStatus
  userStatus: QaEvaluationStatus | null
  createdAt: Date
  evaluatorType: QaEvaluatorType
  authorOsmName: string | null
  authorFirstName: string | null
  authorLastName: string | null
  evaluationCount: number
  commentCount: number
  userEvaluationCount: number
}

export type QaOrphanedEvaluationsResult = PaginatedList<QaOrphanedEvaluation>

type OrphanRow = {
  areaId: string
  systemStatus: QaSystemStatus
  userStatus: QaEvaluationStatus | null
  createdAt: Date
  evaluatorType: QaEvaluatorType
  authorOsmName: string | null
  authorFirstName: string | null
  authorLastName: string | null
  evaluation_count: bigint | number | null
  comment_count: bigint | number | null
  user_evaluation_count: bigint | number | null
  total_count: bigint | number | null
}

/** Neither sibling map-table query handles a missing relation; catch 42P01 so the admin page still renders. */
function isMissingMapTableError(error: unknown) {
  if (!(error instanceof Error)) return false
  return /relation .+ does not exist|42P01/i.test(error.message)
}

export function buildQaOrphanedEvaluationsSql(tableName: string) {
  // User evaluations and comments first: those orphans carry human work an admin must act on.
  return `
WITH latest AS (
  SELECT DISTINCT ON (e."areaId")
         e."areaId", e."systemStatus", e."userStatus", e."createdAt", e."evaluatorType", e."userId"
  FROM prisma."QaEvaluation" e
  WHERE e."configId" = $1
  ORDER BY e."areaId", e."createdAt" DESC, e.id DESC
),
stats AS (
  SELECT e."areaId",
         count(*)::int AS evaluation_count,
         count(*) FILTER (WHERE e.body IS NOT NULL AND btrim(e.body) <> '')::int AS comment_count,
         count(*) FILTER (WHERE e."evaluatorType" = 'USER')::int AS user_evaluation_count
  FROM prisma."QaEvaluation" e
  WHERE e."configId" = $1
  GROUP BY e."areaId"
)
SELECT l."areaId", l."systemStatus", l."userStatus", l."createdAt", l."evaluatorType",
       u."osmName" AS "authorOsmName", u."firstName" AS "authorFirstName", u."lastName" AS "authorLastName",
       s.evaluation_count, s.comment_count, s.user_evaluation_count,
       count(*) OVER () AS total_count
FROM latest l
JOIN stats s ON s."areaId" = l."areaId"
LEFT JOIN prisma."User" u ON u.id = l."userId"
LEFT JOIN ${tableName} a ON a.id = l."areaId"
WHERE a.id IS NULL
ORDER BY s.user_evaluation_count DESC, s.comment_count DESC, l."createdAt" DESC
LIMIT $2
OFFSET $3
`
}

export async function getQaOrphanedEvaluationsForAdmin(
  input: z.infer<typeof Schema>,
  headers: Headers,
) {
  await requireAdmin(headers)
  const { configId, mapTable, skip: skipInput, take: takeInput } = Schema.parse(input)
  const { skip, take } = clampSkipTake(skipInput, takeInput)
  const tableName = getQaTableName(mapTable)
  const emptyResult = { rows: [], total: 0, skip, take } satisfies QaOrphanedEvaluationsResult

  try {
    const rows = await db.$queryRawUnsafe<OrphanRow[]>(
      buildQaOrphanedEvaluationsSql(tableName),
      configId,
      take,
      skip,
    )
    const total = rows[0] ? Number(rows[0].total_count ?? 0) : 0

    return {
      rows: rows.map(
        (row) =>
          ({
            areaId: row.areaId,
            systemStatus: row.systemStatus,
            userStatus: row.userStatus,
            createdAt: row.createdAt,
            evaluatorType: row.evaluatorType,
            authorOsmName: row.authorOsmName,
            authorFirstName: row.authorFirstName,
            authorLastName: row.authorLastName,
            evaluationCount: Number(row.evaluation_count ?? 0),
            commentCount: Number(row.comment_count ?? 0),
            userEvaluationCount: Number(row.user_evaluation_count ?? 0),
          }) satisfies QaOrphanedEvaluation,
      ),
      total,
      skip,
      take,
    } satisfies QaOrphanedEvaluationsResult
  } catch (error) {
    if (isMissingMapTableError(error)) {
      return emptyResult
    }
    throw error
  }
}
