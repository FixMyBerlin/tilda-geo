import { z } from 'zod'
import type { QaEvaluationStatus, QaEvaluatorType, QaSystemStatus } from '@/prisma/generated/client'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { clampSkipTake, lastPageSkip } from '@/shared/pagination/clampSkipTake'
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

type OrphanLatestEvaluation = {
  areaId: string
  systemStatus: QaSystemStatus
  userStatus: QaEvaluationStatus | null
  createdAt: Date
  evaluatorType: QaEvaluatorType
  author: {
    osmName: string | null
    firstName: string | null
    lastName: string | null
  } | null
}

type OrphanAreaCounts = {
  evaluationCount: number
  commentCount: number
  userEvaluationCount: number
}

type CommentBodyRow = {
  areaId: string
  body: string | null
}

/** Matches SQL `btrim(body) <> ''`: NULL, empty, and whitespace-only bodies do not count. */
export function countNonBlankCommentBodies(rows: CommentBodyRow[]) {
  const commentCountByAreaId = new Map<string, number>()
  for (const row of rows) {
    if (row.body == null || row.body.trim() === '') continue
    commentCountByAreaId.set(row.areaId, (commentCountByAreaId.get(row.areaId) ?? 0) + 1)
  }
  return commentCountByAreaId
}

/** Neither sibling map-table query handles a missing relation; catch 42P01 so the admin page still renders. */
function isMissingMapTableError(error: unknown) {
  if (!(error instanceof Error)) return false
  return /relation .+ does not exist|42P01/i.test(error.message)
}

/**
 * Orphans first by human work (user evals, then comments), then recency, then `areaId`; then
 * skip/take. A `skip` past the end returns the last page (like `paginate({ fallbackToLastPage })`).
 */
export function selectQaOrphanedEvaluationPage(
  latestEvaluations: OrphanLatestEvaluation[],
  mapIdSet: Set<string>,
  countsByAreaId: Map<string, OrphanAreaCounts>,
  skip: number,
  take: number,
) {
  const orphans = latestEvaluations
    .filter((evaluation) => !mapIdSet.has(evaluation.areaId))
    .map((evaluation) => {
      const counts = countsByAreaId.get(evaluation.areaId) ?? {
        evaluationCount: 0,
        commentCount: 0,
        userEvaluationCount: 0,
      }
      return {
        areaId: evaluation.areaId,
        systemStatus: evaluation.systemStatus,
        userStatus: evaluation.userStatus,
        createdAt: evaluation.createdAt,
        evaluatorType: evaluation.evaluatorType,
        authorOsmName: evaluation.author?.osmName ?? null,
        authorFirstName: evaluation.author?.firstName ?? null,
        authorLastName: evaluation.author?.lastName ?? null,
        evaluationCount: counts.evaluationCount,
        commentCount: counts.commentCount,
        userEvaluationCount: counts.userEvaluationCount,
      } satisfies QaOrphanedEvaluation
    })
    .sort((a, b) => {
      if (b.userEvaluationCount !== a.userEvaluationCount) {
        return b.userEvaluationCount - a.userEvaluationCount
      }
      if (b.commentCount !== a.commentCount) {
        return b.commentCount - a.commentCount
      }
      if (b.createdAt.getTime() !== a.createdAt.getTime()) {
        return b.createdAt.getTime() - a.createdAt.getTime()
      }
      return a.areaId.localeCompare(b.areaId)
    })

  const pageSkip = skip > 0 && skip >= orphans.length ? lastPageSkip(orphans.length, take) : skip

  return {
    rows: orphans.slice(pageSkip, pageSkip + take),
    total: orphans.length,
    skip: pageSkip,
    take,
  } satisfies QaOrphanedEvaluationsResult
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

  // Fetch map ids and test membership in JS. Prisma `notIn` would bind every map id.
  let mapIdRows: Array<{ id: string }>
  try {
    mapIdRows = await db.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id::text AS id FROM ${tableName}`,
    )
  } catch (error) {
    if (isMissingMapTableError(error)) {
      return emptyResult
    }
    throw error
  }

  const mapIdSet = new Set(mapIdRows.map((row) => row.id))

  const [latestEvaluations, countGroups, commentBodies] = await Promise.all([
    db.qaEvaluation.findMany({
      where: { configId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      distinct: ['areaId'],
      select: {
        areaId: true,
        systemStatus: true,
        userStatus: true,
        createdAt: true,
        evaluatorType: true,
        author: {
          select: {
            osmName: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    db.qaEvaluation.groupBy({
      by: ['areaId', 'evaluatorType'],
      where: { configId },
      _count: { _all: true },
    }),
    // groupBy cannot btrim; load bodies and count non-blank in JS.
    db.qaEvaluation.findMany({
      where: { configId, body: { not: null } },
      select: { areaId: true, body: true },
    }),
  ])

  const countsByAreaId = new Map<string, OrphanAreaCounts>()
  for (const group of countGroups) {
    const current = countsByAreaId.get(group.areaId) ?? {
      evaluationCount: 0,
      commentCount: 0,
      userEvaluationCount: 0,
    }
    current.evaluationCount += group._count._all
    if (group.evaluatorType === 'USER') {
      current.userEvaluationCount = group._count._all
    }
    countsByAreaId.set(group.areaId, current)
  }
  for (const [areaId, commentCount] of countNonBlankCommentBodies(commentBodies)) {
    const current = countsByAreaId.get(areaId)
    if (current) current.commentCount = commentCount
  }

  return selectQaOrphanedEvaluationPage(latestEvaluations, mapIdSet, countsByAreaId, skip, take)
}
