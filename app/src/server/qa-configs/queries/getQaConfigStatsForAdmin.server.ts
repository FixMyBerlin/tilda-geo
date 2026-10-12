import { z } from 'zod'
import { type MemberCaller, requireAdminSession } from '@/server/auth/memberCaller.server'
import db from '@/server/db.server'
import { selectQaLatestEvaluationRows } from '@/server/qa-configs/queries/qaIndicatorRows.server'
import { parseQaConfigIndicators } from '@/server/qa-configs/utils/parseQaConfigIndicators'
import { worstQaIndicatorStatus } from '@/shared/qaIndicatorStatus'

const Schema = z.object({
  configId: z.number(),
})

export type QaConfigStats = {
  totalAreas: number
  evaluationStats: {
    SYSTEM: {
      GOOD: number
      NEEDS_REVIEW: number
      PROBLEMATIC: number
      TRUSTED_EDITOR_CHANGE: number
    }
    USER: {
      OK_STRUCTURAL_CHANGE: number
      OK_REFERENCE_ERROR: number
      NOT_OK_DATA_ERROR: number
      NOT_OK_PROCESSING_ERROR: number
      OK_QA_TOOLING_ERROR: number
    }
  }
}

/**
 * Cells per status for the admin config card.
 *
 * A cell is counted once, by its **worst effective indicator** (`worstQaIndicatorStatus`, the same
 * ranking the map paints with): if that indicator carries a user decision it lands in `USER`,
 * otherwise in `SYSTEM`. So the buckets add up to `totalAreas` and read as "what does this cell
 * look like right now", not "how many rows of each kind exist".
 */
export async function getQaConfigStatsForAdmin(
  input: z.infer<typeof Schema>,
  caller: MemberCaller,
) {
  await requireAdminSession(caller)
  const { configId } = Schema.parse(input)

  const qaConfig = await db.qaConfig.findFirst({ where: { id: configId } })
  const stats: QaConfigStats = {
    totalAreas: 0,
    evaluationStats: {
      SYSTEM: {
        GOOD: 0,
        NEEDS_REVIEW: 0,
        PROBLEMATIC: 0,
        TRUSTED_EDITOR_CHANGE: 0,
      },
      USER: {
        OK_STRUCTURAL_CHANGE: 0,
        OK_REFERENCE_ERROR: 0,
        NOT_OK_DATA_ERROR: 0,
        NOT_OK_PROCESSING_ERROR: 0,
        OK_QA_TOOLING_ERROR: 0,
      },
    },
  }
  if (!qaConfig) return stats

  const indicators = parseQaConfigIndicators(qaConfig.indicators)
  const indicatorOrder = new Map(indicators.map((indicator, index) => [indicator.key, index]))

  const latestRows = await selectQaLatestEvaluationRows({ configId })

  const byAreaId = new Map<string, typeof latestRows>()
  for (const row of latestRows) {
    // A retired indicator key would distort the picture the admin sees for the current config.
    if (!indicatorOrder.has(row.indicatorKey)) continue
    const group = byAreaId.get(row.areaId) ?? []
    group.push(row)
    byAreaId.set(row.areaId, group)
  }

  for (const group of byAreaId.values()) {
    group.sort(
      (a, b) =>
        (indicatorOrder.get(a.indicatorKey) ?? 0) - (indicatorOrder.get(b.indicatorKey) ?? 0),
    )
    const worst = worstQaIndicatorStatus(group)
    if (!worst) continue
    stats.totalAreas += 1
    if (worst.userStatus) {
      stats.evaluationStats.USER[worst.userStatus] += 1
    } else {
      stats.evaluationStats.SYSTEM[worst.systemStatus] += 1
    }
  }

  return stats
}
