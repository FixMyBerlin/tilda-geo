import type { QaConfig } from '@/prisma/generated/client'
import { runWithAuditContextAsync, systemApiAuditContext } from '@/server/audit/auditContext.server'
import db from '@/server/db.server'
import { planQaEvaluationCreates } from '@/server/qa-configs/evaluation/planQaEvaluationCreates'
import {
  selectQaIndicatorTableRows,
  selectQaLastEditorsByAreaId,
  selectQaLatestEvaluationRows,
} from '@/server/qa-configs/queries/qaIndicatorRows.server'
import {
  parseQaConfigIndicators,
  qaDatasetOf,
} from '@/server/qa-configs/utils/parseQaConfigIndicators'
import { updateProcessingMetaAsync } from '@/server/statistics/analysis/updateProcessingStatus.server'

/** `createMany` batch size. Big enough to keep the round trips low, small enough for one bind. */
const QA_CREATE_CHUNK_SIZE = 1000

function getSecondsElapsed(startTime: number) {
  return Math.round((Date.now() - startTime) / 100) / 10
}

/**
 * One config: three reads (`<map>_indicators`, `<map>_last_editors` and the latest evaluation per
 * (area, indicator)), every decision in memory, then chunked writes. Nothing runs per cell.
 */
async function qaUpdateConfig(config: QaConfig, options: { dryRun: boolean }) {
  const [indicatorRows, lastEditorsByAreaId, latestRows] = await Promise.all([
    selectQaIndicatorTableRows({ mapTable: config.mapTable }),
    selectQaLastEditorsByAreaId({ mapTable: config.mapTable }),
    selectQaLatestEvaluationRows({ configId: config.id }),
  ])

  const { creates, ...counts } = planQaEvaluationCreates({
    indicatorRows,
    latestRows,
    indicators: parseQaConfigIndicators(config.indicators),
    unit: qaDatasetOf(config).unit,
    lastEditorsByAreaId,
    trustConfig: config,
  })

  if (!options.dryRun) {
    for (let index = 0; index < creates.length; index += QA_CREATE_CHUNK_SIZE) {
      // createManyAndReturn (not createMany) so the audit-log extension records the real row ids
      await db.qaEvaluation.createManyAndReturn({
        data: creates.slice(index, index + QA_CREATE_CHUNK_SIZE).map((row) => ({
          ...row,
          configId: config.id,
          evaluatorType: 'SYSTEM' as const,
        })),
      })
    }
  }

  return counts
}

/**
 * The nightly QA update. `dryRun` reports the same counts without writing a row — used to
 * calibrate new indicators' thresholds on staging before production.
 */
export async function runQaUpdate(headers: Headers, options: { dryRun: boolean }) {
  const startTime = Date.now()
  const logPrefix = options.dryRun ? 'QA update (dry run):' : 'QA update:'
  console.log(`${logPrefix} Started processing`)

  if (!options.dryRun) {
    await updateProcessingMetaAsync('qa_update_started_at')
  }

  const configs = await runWithAuditContextAsync(systemApiAuditContext(headers), async () => {
    const qaConfigs = await db.qaConfig.findMany({
      where: { isActive: true },
      include: { region: { select: { slug: true } } },
    })

    const results = []
    for (const config of qaConfigs) {
      const configStartTime = Date.now()
      // Config slugs are only unique per region.
      const configLabel = `${config.region.slug}/${config.slug}`
      try {
        const counts = await qaUpdateConfig(config, options)
        if (counts.unknownIndicatorKeys.length > 0 || counts.missingIndicatorKeys.length > 0) {
          console.warn(`${logPrefix} ${configLabel}: indicator keys skipped`, {
            [`only in ${config.mapTable}_indicators`]: counts.unknownIndicatorKeys,
            'only in the config': counts.missingIndicatorKeys,
          })
        }
        console.log(`${logPrefix} ${configLabel}`, {
          areas: counts.areas,
          indicators: counts.indicators,
          created: counts.created,
          resets: counts.resets,
          // Subset of created + resets: rows auto-rated by the trusted-editor list.
          trustedEditorChanges: counts.trustedEditorChanges,
          seconds: getSecondsElapsed(configStartTime),
        })
        results.push({ configId: config.id, configSlug: config.slug, ...counts })
      } catch (error) {
        // One broken config (missing `<map>_indicators` table, malformed `indicators` JSON) must
        // neither stop the others nor keep `qa_update_completed_at` from being written.
        console.error(`${logPrefix} ${configLabel} failed`, error)
        results.push({
          configId: config.id,
          configSlug: config.slug,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }
    return results
  })

  if (!options.dryRun) {
    await updateProcessingMetaAsync('qa_update_completed_at')
  }

  const succeeded = configs.flatMap((entry) => ('error' in entry ? [] : [entry]))
  const total = (key: 'created' | 'resets' | 'trustedEditorChanges') =>
    succeeded.reduce((sum, entry) => sum + entry[key], 0)
  const secondsElapsed = getSecondsElapsed(startTime)
  console.log(`${logPrefix} Completed in ${secondsElapsed} s`)

  return {
    success: true as const,
    dryRun: options.dryRun,
    configsProcessed: configs.length,
    configsFailed: configs.length - succeeded.length,
    created: total('created'),
    resets: total('resets'),
    trustedEditorChanges: total('trustedEditorChanges'),
    configs,
    secondsElapsed,
  }
}
