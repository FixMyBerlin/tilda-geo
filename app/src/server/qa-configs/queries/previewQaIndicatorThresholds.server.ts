import { z } from 'zod'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import {
  computeQaIndicatorThresholdPreview,
  type QaIndicatorPreviewRow,
} from '@/server/qa-configs/evaluation/computeQaIndicatorThresholdPreview'
import { selectQaLastEditorsByAreaId } from '@/server/qa-configs/queries/qaIndicatorRows.server'
import { qaIndicatorThresholdsSchema } from '@/server/qa-configs/schemas/qaIndicatorsSchema'
import { getQaIndicatorsTableName } from '@/server/qa-configs/utils/getQaTableName'

export const PreviewQaIndicatorThresholdsSchema = z.object({
  configId: z.number(),
  indicatorKey: z.string(),
  thresholds: qaIndicatorThresholdsSchema,
})

/**
 * Admin "Mit aktuellen Daten prüfen" for one indicator (see computeQaIndicatorThresholdPreview.ts).
 * Loads only that indicator's rows; the status is computed in JS by the nightly's own function
 * rather than a second SQL implementation of the rule.
 */
export async function previewQaIndicatorThresholds(
  input: z.infer<typeof PreviewQaIndicatorThresholdsSchema>,
  headers: Headers,
) {
  await requireAdmin(headers)
  const { configId, indicatorKey, thresholds } = PreviewQaIndicatorThresholdsSchema.parse(input)

  const qaConfig = await db.qaConfig.findUniqueOrThrow({ where: { id: configId } })
  const tableName = getQaIndicatorsTableName(qaConfig.mapTable)

  const rowsQuery = db.$queryRawUnsafe<QaIndicatorPreviewRow[]>(
    `
      SELECT
        area_id AS "areaId",
        reference::float,
        current::float,
        difference::float,
        deviation::float
      FROM ${tableName}
      WHERE indicator_key = $1
    `,
    indicatorKey,
  )
  const [rows, lastEditorsByAreaId] = await Promise.all([
    rowsQuery,
    selectQaLastEditorsByAreaId({ mapTable: qaConfig.mapTable }),
  ])

  // Trusted editors use the saved config's list and freeze date; only the thresholds are drafts.
  return computeQaIndicatorThresholdPreview({
    rows,
    thresholds,
    lastEditorsByAreaId,
    trustConfig: qaConfig,
  })
}
