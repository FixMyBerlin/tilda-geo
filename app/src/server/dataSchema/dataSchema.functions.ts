import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { getDataSchemaTableRowCount } from './dataSchemaDb.server'
import { dataSchemaManifestSchema } from './dataSchemaManifest.schema'
import {
  getS3ObjectJsonFirst,
  listDataSchemaSnapshotIds,
  listDataSchemaTables,
} from './dataSchemaS3.server'
import { dataSchemaManifestReadKeys, dataSchemaSpecReadKeys } from './dataSchemaS3Keys'
import { parseDataSchemaSpec } from './dataSchemaSpec.schema'

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
    const specHit = await getS3ObjectJsonFirst(dataSchemaSpecReadKeys(table))
    if (!specHit) return null
    const parsed = parseDataSchemaSpec(specHit.json, table)
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
      let liveRowCount: number | null = null
      try {
        liveRowCount = await getDataSchemaTableRowCount(table)
      } catch {
        liveRowCount = null
      }

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
        const hit = await getS3ObjectJsonFirst(dataSchemaManifestReadKeys(table))
        if (!hit) throw new Error('No data.manifest.json')
        const manifest = dataSchemaManifestSchema.parse(hit.json)
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
          liveRowCount,
          snapshotIds,
          recentImports,
        }
      } catch (error) {
        return {
          table,
          error: error instanceof Error ? error.message : String(error),
          spec,
          manifest: null,
          liveRowCount,
          snapshotIds,
          recentImports,
        }
      }
    }),
  )

  return { datasets, listError }
})
