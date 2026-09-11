import { createFileRoute } from '@tanstack/react-router'
import type { QaEvaluationStatus, QaSystemStatus } from '@/prisma/generated/client'
import { GuardEndpointSchema, guardEndpoint } from '@/server/api/private/guardEndpoint'
import { runWithAuditContextAsync, systemApiAuditContext } from '@/server/audit/auditContext.server'
import db from '@/server/db.server'
import {
  planQaEvaluationCreates,
  type QaAreaRow,
} from '@/server/qa-configs/evaluation/planQaEvaluationCreates'
import { getQaTableName } from '@/server/qa-configs/utils/getQaTableName'
import { updateProcessingMetaAsync } from '@/server/statistics/analysis/updateProcessingStatus.server'

// Keeps the audit-log createMany (12 columns per row) below the Postgres bind parameter limit.
const QA_EVALUATION_INSERT_CHUNK_SIZE = 2000

function getSecondsElapsed(startTime: number) {
  return Math.round((Date.now() - startTime) / 100) / 10
}

async function getLatestEvaluationsByAreaId(configId: number) {
  type LatestEvaluationRow = {
    areaId: string
    systemStatus: QaSystemStatus
    userStatus: QaEvaluationStatus | null
  }
  const rows = await db.$queryRaw<LatestEvaluationRow[]>`
    SELECT DISTINCT ON ("areaId")
      "areaId",
      "systemStatus"::text AS "systemStatus",
      "userStatus"::text AS "userStatus"
    FROM prisma."QaEvaluation"
    WHERE "configId" = ${configId}
    ORDER BY "areaId", "createdAt" DESC, id DESC
  `

  return new Map(rows.map(({ areaId, ...previous }) => [areaId, previous]))
}

async function qaUpdate(headers: Headers) {
  const startTime = Date.now()
  console.log('QA update: Started processing')

  try {
    await updateProcessingMetaAsync('qa_update_started_at')

    const result = await runWithAuditContextAsync(systemApiAuditContext(headers), async () => {
      const qaConfigs = await db.qaConfig.findMany({
        where: { isActive: true },
        include: { region: true },
      })

      let totalEvaluations = 0
      let newEvaluations = 0

      for (const config of qaConfigs) {
        const configStartTime = Date.now()
        const tableName = getQaTableName(config.mapTable)

        const areas = await db.$queryRawUnsafe<QaAreaRow[]>(`
        SELECT
          id,
          relative::float,
          previous_relative::float,
          count_reference,
          count_current,
          difference as "absoluteDifference"
        FROM ${tableName}
      `)
        const previousByAreaId = await getLatestEvaluationsByAreaId(config.id)

        const evaluationsToCreate = planQaEvaluationCreates({
          configId: config.id,
          config,
          areas,
          previousByAreaId,
        })

        let createdCount = 0
        for (let i = 0; i < evaluationsToCreate.length; i += QA_EVALUATION_INSERT_CHUNK_SIZE) {
          // createManyAndReturn (not createMany) so the audit-log extension records the real row ids
          const created = await db.qaEvaluation.createManyAndReturn({
            data: evaluationsToCreate.slice(i, i + QA_EVALUATION_INSERT_CHUNK_SIZE),
          })
          createdCount += created.length
        }

        totalEvaluations += areas.length
        newEvaluations += createdCount
        console.log(
          `QA update: ${config.region.slug}/${config.slug}: ${areas.length} areas, ${createdCount} created in ${getSecondsElapsed(configStartTime)} s`,
        )
      }

      await updateProcessingMetaAsync('qa_update_completed_at')

      return {
        success: true as const,
        totalEvaluations,
        newEvaluations,
        configsProcessed: qaConfigs.length,
      }
    })

    console.log(`QA update: Completed in ${getSecondsElapsed(startTime)} s`)

    return result
  } catch (error) {
    console.error('QA update: Error', error)
    throw error
  }
}

export const Route = createFileRoute('/api/private/post-processing-qa-update')({
  ssr: false,
  server: {
    handlers: {
      GET: ({ request }) => {
        const { access, response } = guardEndpoint(request, GuardEndpointSchema)
        if (access === false) return response

        qaUpdate(request.headers).catch((error) => {
          console.error('QA update: Unhandled error in background task', error)
        })

        return Response.json({ message: 'TRIGGERED' }, { status: 200 })
      },
    },
  },
})
