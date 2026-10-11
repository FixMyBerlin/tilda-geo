import { z } from 'zod'
import { type MemberCaller, getMemberSession } from '@/server/auth/memberCaller.server'
import { canAccessMemberModeForRegion } from '@/server/authorization/canAccessMemberModeForRegion.server'
import db from '@/server/db.server'
import { calculateQaIndicatorSystemStatus } from '@/server/qa-configs/evaluation/calculateQaIndicatorSystemStatus'
import { buildQaDecisionData } from '@/server/qa-configs/evaluation/planQaEvaluationCreates'
import {
  selectQaIndicatorTableRows,
  selectQaLastEditorsByAreaId,
} from '@/server/qa-configs/queries/qaIndicatorRows.server'
import { transformEvaluationWithDecisionData } from '@/server/qa-configs/schemas/qaDecisionDataSchema'
import {
  parseQaConfigIndicators,
  qaDatasetOf,
} from '@/server/qa-configs/utils/parseQaConfigIndicators'

const Schema = z.object({
  configSlug: z.string(),
  areaId: z.string(),
  regionSlug: z.string(),
})

/**
 * The detail panel of one cell: per indicator (config order) the live values from
 * `<map>_indicators`, the status and the evaluation history. The status comes from the latest
 * evaluation, like on the map and in the list, so all three agree between a processing run and the
 * nightly; only an indicator that was never evaluated gets its status computed live (trusted
 * editors applied, same as the nightly).
 *
 * Indicators without a `<map>_indicators` row are skipped — the table is the only source of the
 * values, and inventing a status here would contradict the nightly.
 */
export async function getQaDecisionDataForArea(
  input: z.infer<typeof Schema>,
  caller: MemberCaller,
) {
  const appSession = await getMemberSession(caller)

  const { configSlug, areaId, regionSlug } = Schema.parse(input)

  const { isAuthorized } = await canAccessMemberModeForRegion(appSession, regionSlug)
  if (!isAuthorized) {
    return null
  }

  const qaConfig = await db.qaConfig.findFirst({
    where: { slug: configSlug, region: { slug: regionSlug } },
  })
  if (!qaConfig) {
    return null
  }
  const indicators = parseQaConfigIndicators(qaConfig.indicators)
  const { unit, unitSuffix, inspectorSourceId } = qaDatasetOf(qaConfig)

  const [indicatorRows, lastEditorsByAreaId, evaluations] = await Promise.all([
    selectQaIndicatorTableRows({ mapTable: qaConfig.mapTable, areaId }),
    selectQaLastEditorsByAreaId({ mapTable: qaConfig.mapTable, areaId }),
    db.qaEvaluation.findMany({
      where: { configId: qaConfig.id, areaId },
      include: { author: { select: { id: true, osmName: true, firstName: true, lastName: true } } },
      // Newest first; the id breaks the tie between rows of the same nightly run.
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    }),
  ])

  const rowByKey = new Map(indicatorRows.map((row) => [row.indicatorKey, row]))
  // A cell has a handful of evaluations, so filtering per indicator is cheap.
  const allHistory = evaluations.map((evaluation) =>
    transformEvaluationWithDecisionData(evaluation),
  )

  return {
    indicators: indicators.flatMap((indicator) => {
      const row = rowByKey.get(indicator.key)
      if (!row) return []
      const history = allHistory.filter((evaluation) => evaluation.indicatorKey === indicator.key)
      const latest = history[0]

      return [
        {
          key: indicator.key,
          label: indicator.label,
          unit,
          unitSuffix,
          inspectorSourceId,
          decisionData: buildQaDecisionData(row, indicator),
          systemStatus:
            latest?.systemStatus ??
            calculateQaIndicatorSystemStatus({
              deviation: row.deviation,
              difference: row.difference,
              indicator,
              lastEditors: lastEditorsByAreaId.get(areaId) ?? [],
              trustConfig: qaConfig,
            }).systemStatus,
          userStatus: latest?.userStatus ?? null,
          history,
        },
      ]
    }),
  }
}

type QaDecisionDataForArea = NonNullable<Awaited<ReturnType<typeof getQaDecisionDataForArea>>>
export type QaDecisionDataIndicator = QaDecisionDataForArea['indicators'][number]
export type QaEvaluationForArea = QaDecisionDataIndicator['history'][number]
