import { z } from 'zod'
import { QaEvaluationStatus } from '@/prisma/generated/client'
import { runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import {
  type MemberCaller,
  memberAuditContext,
  requireMemberSession,
} from '@/server/auth/memberCaller.server'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'
import { calculateQaIndicatorSystemStatus } from '@/server/qa-configs/evaluation/calculateQaIndicatorSystemStatus'
import { buildQaDecisionData } from '@/server/qa-configs/evaluation/planQaEvaluationCreates'
import {
  selectQaIndicatorTableRows,
  selectQaLastEditorsByAreaId,
  selectQaLatestEvaluationRows,
} from '@/server/qa-configs/queries/qaIndicatorRows.server'
import { parseQaConfigIndicators } from '@/server/qa-configs/utils/parseQaConfigIndicators'

export const CreateQaEvaluationsSchema = z.object({
  configSlug: z.string(),
  regionSlug: z.string(),
  areaId: z.string(),
  body: z.string().optional(),
  decisions: z
    .array(
      z.object({
        indicatorKey: z.string(),
        userStatus: z.enum(QaEvaluationStatus),
      }),
    )
    .min(1),
})

/**
 * One submission of the detail panel: a user status per indicator plus one shared comment.
 * "Alle offenen als OK markieren" is the same call with several decisions.
 *
 * Each row stores the CURRENT system status of its indicator — the latest evaluation's status, or,
 * when that indicator was never evaluated, the status computed live from `<map>_indicators` with
 * trusted editors applied (same as the nightly update). Never
 * a placeholder: the nightly reset rule reads this value to decide whether an indicator *became*
 * GOOD.
 */
export async function createQaEvaluations(
  input: z.infer<typeof CreateQaEvaluationsSchema>,
  caller: MemberCaller,
) {
  const appSession = await requireMemberSession(caller)
  const { configSlug, regionSlug, areaId, body, decisions } = CreateQaEvaluationsSchema.parse(input)
  await authorizeRegionMemberByRegionSlug(appSession, regionSlug)

  // Region-scoped: the slug alone is only unique per region (`@@unique([regionId, slug])`).
  const qaConfig = await db.qaConfig.findFirstOrThrow({
    where: { slug: configSlug, region: { slug: regionSlug } },
  })
  const indicators = parseQaConfigIndicators(qaConfig.indicators)
  const indicatorByKey = new Map(indicators.map((indicator) => [indicator.key, indicator]))

  const [indicatorRows, latestRows, lastEditorsByAreaId] = await Promise.all([
    selectQaIndicatorTableRows({ mapTable: qaConfig.mapTable, areaId }),
    selectQaLatestEvaluationRows({ configId: qaConfig.id, areaId }),
    selectQaLastEditorsByAreaId({ mapTable: qaConfig.mapTable, areaId }),
  ])
  const rowByKey = new Map(indicatorRows.map((row) => [row.indicatorKey, row]))
  const latestByKey = new Map(latestRows.map((row) => [row.indicatorKey, row]))

  const data = decisions.flatMap((decision) => {
    const indicator = indicatorByKey.get(decision.indicatorKey)
    if (!indicator) {
      console.warn(
        `createQaEvaluations: ${configSlug} has no indicator "${decision.indicatorKey}", decision skipped`,
      )
      return []
    }
    const row = rowByKey.get(decision.indicatorKey)
    if (!row) {
      console.warn(
        `createQaEvaluations: ${configSlug}/${areaId} has no ${qaConfig.mapTable}_indicators row for "${decision.indicatorKey}", decision skipped`,
      )
      return []
    }

    const systemStatus =
      latestByKey.get(decision.indicatorKey)?.systemStatus ??
      calculateQaIndicatorSystemStatus({
        deviation: row.deviation,
        difference: row.difference,
        indicator,
        lastEditors: lastEditorsByAreaId.get(areaId) ?? [],
        trustConfig: qaConfig,
      }).systemStatus

    return [
      {
        configId: qaConfig.id,
        areaId,
        indicatorKey: indicator.key,
        systemStatus,
        userStatus: decision.userStatus,
        body: body || null,
        evaluatorType: 'USER' as const,
        userId: appSession.userId,
        decisionData: buildQaDecisionData(row, indicator),
      },
    ]
  })

  if (data.length === 0) {
    return []
  }

  return runWithAuditContextAsync(memberAuditContext(caller, appSession.userId), () =>
    db.qaEvaluation.createManyAndReturn({
      data,
      include: {
        author: {
          select: { id: true, osmName: true, firstName: true, lastName: true },
        },
      },
    }),
  )
}
