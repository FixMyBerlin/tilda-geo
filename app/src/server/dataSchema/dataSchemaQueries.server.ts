import type { DataSchemaImportStatus, Prisma } from '@/prisma/generated/client'
import db from '@/server/db.server'
import { paginate } from '@/server/utils/paginate.server'
import {
  getDataSchemaManifestIfExists,
  getDataSchemaSpecIfExists,
  listDataSchemaSnapshotIds,
  listDataSchemaTables,
} from './dataSchemaS3.server'
import { dataSchemaIdentifierSchema } from './dataSchemaSpec.schema'

const DATA_SCHEMA_OVERVIEW_HISTORY_LIMIT = 5

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

type DataSchemaImportRow = Awaited<ReturnType<typeof db.dataSchemaImport.findMany>>[number]

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

async function loadDatasetOverview(table: string, historyLimit: number) {
  const [snapshotIds, recentImports, spec, manifestResult] = await Promise.all([
    listDataSchemaSnapshotIds(table).catch(() => [] as string[]),
    db.dataSchemaImport
      .findMany({
        where: { tableName: table },
        orderBy: { createdAt: 'desc' },
        take: historyLimit,
        select: historySelect,
      })
      .catch(() => [] as DataSchemaImportRow[]),
    loadSpecSummary(table),
    getDataSchemaManifestIfExists(table)
      .then((manifest) => ({ ok: true as const, manifest }))
      .catch((error: unknown) => ({
        ok: false as const,
        error: error instanceof Error ? error.message : String(error),
      })),
  ])

  if (!manifestResult.ok) {
    return {
      table,
      error: manifestResult.error,
      spec,
      manifest: null,
      snapshotIds,
      recentImports,
    }
  }
  if (!manifestResult.manifest) {
    return {
      table,
      error: 'No data.manifest.json',
      spec,
      manifest: null,
      snapshotIds,
      recentImports,
    }
  }

  const { manifest } = manifestResult
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
}

/** Tables that currently exist in Postgres `data.*` on this environment. */
async function listDataSchemaPostgresTables() {
  try {
    const rows = await db.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'data' ORDER BY tablename
    `
    return rows.map((row) => row.tablename)
  } catch {
    return []
  }
}

export async function listDataSchemaOverview(historyLimit = DATA_SCHEMA_OVERVIEW_HISTORY_LIMIT) {
  let tables: string[] = []
  let listError: string | null = null
  try {
    tables = await listDataSchemaTables()
  } catch (error) {
    listError = error instanceof Error ? error.message : String(error)
  }

  const [datasets, postgresTables] = await Promise.all([
    Promise.all(tables.map((table) => loadDatasetOverview(table, historyLimit))),
    listDataSchemaPostgresTables(),
  ])

  return { datasets, listError, postgresTables }
}

export async function listDataSchemaImports(
  filters: {
    table?: string
    status?: DataSchemaImportStatus
    skip?: number
    take?: number
  } = {},
) {
  const table = filters.table ? dataSchemaIdentifierSchema.parse(filters.table) : undefined
  const where = {
    ...(table ? { tableName: table } : {}),
    ...(filters.status ? { status: filters.status } : {}),
  } satisfies Prisma.DataSchemaImportWhereInput

  return paginate({
    skip: filters.skip,
    take: filters.take,
    count: () => db.dataSchemaImport.count({ where }),
    query: ({ skip, take }) =>
      db.dataSchemaImport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: historySelect,
      }),
  })
}
