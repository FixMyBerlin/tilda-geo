import { Prisma } from '@/prisma/generated/client'
import { getBaseDatabaseUrl } from '@/server/database-url.server'
import db from '@/server/db.server'
import { assertDataSchemaTableName } from './dataSchemaS3Keys'
import { pgDumpArchiveFlags } from './pgDumpArchiveFlags'

export async function getDataSchemaTableRowCount(table: string) {
  assertDataSchemaTableName(table)
  try {
    return await countRows(table)
  } catch (error) {
    if (isUndefinedTableError(error)) return null
    throw error
  }
}

export async function pgRestoreList(dumpPath: string) {
  const result = Bun.spawnSync(['pg_restore', '--list', dumpPath], {
    stdout: 'pipe',
    stderr: 'pipe',
  })
  if (result.exitCode !== 0) {
    throw new Error(
      result.stderr.toString().trim() || `pg_restore --list failed (${result.exitCode})`,
    )
  }
  return result.stdout.toString()
}

async function dropTableIfExists(table: string) {
  // No CASCADE: indexes/sequences on this table go with it; views and FKs from other tables do not.
  await db.$executeRawUnsafe(`DROP TABLE IF EXISTS data.${table}`)
}

async function restoreDumpFile(dumpPath: string) {
  const proc = Bun.spawn(
    [
      'pg_restore',
      `--dbname=${getBaseDatabaseUrl()}`,
      '--single-transaction',
      '--no-owner',
      '--no-privileges',
      dumpPath,
    ],
    { stdout: 'pipe', stderr: 'pipe' },
  )
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])
  if (exitCode !== 0) {
    throw new Error(
      [stderr.trim(), stdout.trim()].filter(Boolean).join('\n') ||
        `pg_restore failed (${exitCode})`,
    )
  }
}

export async function replaceTableFromDump(
  table: string,
  dumpPath: string,
  expectedRowCount: number,
) {
  assertDataSchemaTableName(table)
  await dropTableIfExists(table)
  await restoreDumpFile(dumpPath)
  const rowCount = await countRows(table)
  if (rowCount !== expectedRowCount) {
    throw new Error(
      `Row count mismatch after restore: expected ${expectedRowCount}, got ${rowCount}`,
    )
  }
  return rowCount
}

export async function dumpTableToFile(table: string, dumpPath: string) {
  assertDataSchemaTableName(table)
  const proc = Bun.spawn(
    [
      'pg_dump',
      `--dbname=${getBaseDatabaseUrl()}`,
      ...pgDumpArchiveFlags,
      `--table=data.${table}`,
      `--file=${dumpPath}`,
    ],
    { stdout: 'pipe', stderr: 'pipe' },
  )
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])
  if (exitCode !== 0) {
    throw new Error(
      [stderr.trim(), stdout.trim()].filter(Boolean).join('\n') || `pg_dump failed (${exitCode})`,
    )
  }
}

async function countRows(table: string) {
  const rows = await db.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT count(*)::bigint AS count FROM data.${table}`,
  )
  return Number(rows[0]?.count ?? 0)
}

function isUndefinedTableError(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2010') {
    return false
  }
  const cause = (error.meta?.driverAdapterError as { cause?: { kind?: string } } | undefined)?.cause
  return cause?.kind === 'TableDoesNotExist'
}
