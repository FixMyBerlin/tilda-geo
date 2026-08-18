import { createServerFn } from '@tanstack/react-start'
import { getRequest, getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { extendBunRequestIdleTimeout } from '@/server/http/extendBunRequestIdleTimeout.server'
import {
  getDataSchemaManifestIfExists,
  getDataSchemaSpecIfExists,
  listDataSchemaSnapshotIds,
  listDataSchemaTables,
} from './dataSchemaS3.server'
import { dataSchemaIdentifierSchema } from './dataSchemaSpec.schema'
import { importDataSchemaTable } from './importDataSchemaTable.server'
import { publishDataSchemaTableFromEnvironment } from './publishDataSchemaTable.server'

const HISTORY_LIMIT_OVERVIEW = 5

const historySelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  tableName: true,
  publishedAt: true,
  snapshotId: true,
  sha256: true,
  status: true,
  rowCount: true,
  durationMs: true,
  errorText: true,
  createdById: true,
  updatedById: true,
} as const

async function loadSpecSummary(table: string) {
  try {
    const parsed = await getDataSchemaSpecIfExists(table)
    if (!parsed) return null
    return {
      file: parsed.source.file,
      provider: parsed.source.provider ?? null,
      documentation: parsed.source.documentation ?? null,
      consumedBy: parsed.consumedBy ?? null,
    }
  } catch {
    return null
  }
}

export const getDataSchemaOverviewLoaderFn = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdmin(getRequestHeaders())

  let tables: string[] = []
  let listError: string | null = null
  try {
    tables = await listDataSchemaTables()
  } catch (error) {
    listError = error instanceof Error ? error.message : String(error)
  }

  const datasets = await Promise.all(
    tables.map(async (table) => {
      let snapshotIds: string[] = []
      try {
        snapshotIds = await listDataSchemaSnapshotIds(table)
      } catch {
        snapshotIds = []
      }

      let recentImports: Awaited<ReturnType<typeof db.dataSchemaImport.findMany>> = []
      try {
        recentImports = await db.dataSchemaImport.findMany({
          where: { tableName: table },
          orderBy: { createdAt: 'desc' },
          take: HISTORY_LIMIT_OVERVIEW,
          select: historySelect,
        })
      } catch {
        recentImports = []
      }

      const spec = await loadSpecSummary(table)

      try {
        const manifest = await getDataSchemaManifestIfExists(table)
        if (!manifest) throw new Error('No data.manifest.json')
        return {
          table,
          error: null as string | null,
          spec,
          manifest: {
            publishedAt: manifest.publishedAt,
            rowCount: manifest.rowCount,
            sha256: manifest.sha256,
            snapshotId: manifest.snapshotId ?? null,
          },
          snapshotIds,
          recentImports,
        }
      } catch (error) {
        return {
          table,
          error: error instanceof Error ? error.message : String(error),
          spec,
          manifest: null,
          snapshotIds,
          recentImports,
        }
      }
    }),
  )

  return { datasets, listError }
})

const ImportDataSchemaInput = z.object({
  table: dataSchemaIdentifierSchema,
  snapshotId: z.string().min(1).nullable().optional(),
})

export const importDataSchemaTableFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof ImportDataSchemaInput>) => ImportDataSchemaInput.parse(data))
  .handler(async ({ data }) => {
    const admin = await requireAdmin(getRequestHeaders())
    extendBunRequestIdleTimeout(getRequest(), 0)
    const result = await importDataSchemaTable({
      table: data.table,
      snapshotId: data.snapshotId ?? null,
      userId: admin.userId,
    })
    return {
      warning: result.warning ?? null,
    }
  })

const PublishDataSchemaInput = z.object({
  table: dataSchemaIdentifierSchema,
  snapshot: z.boolean().optional(),
})

export const publishDataSchemaTableFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof PublishDataSchemaInput>) => PublishDataSchemaInput.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin(getRequestHeaders())
    extendBunRequestIdleTimeout(getRequest(), 0)
    const result = await publishDataSchemaTableFromEnvironment({
      table: data.table,
      snapshot: data.snapshot ?? false,
    })
    return {
      warning: result.warning ?? null,
    }
  })
