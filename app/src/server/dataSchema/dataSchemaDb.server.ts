import { getBaseDatabaseUrl } from '@/server/database-url.server'
import db from '@/server/db.server'
import { assertDataSchemaTableName } from './dataSchemaS3Keys'

// Host PATH `pg_restore`. Do not docker-run this from the app.

const PG_RESTORE_MISSING = `pg_restore not found on PATH.
https://github.com/FixMyBerlin/tilda-geo/blob/develop/app/README.md#host-binaries-local-vs-server`

function throwIfPgRestoreMissing(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  if (/Executable not found in \$PATH/i.test(message)) {
    throw new Error(PG_RESTORE_MISSING, { cause: error })
  }
}

export async function pgRestoreList(dumpPath: string) {
  let result
  try {
    result = Bun.spawnSync(['pg_restore', '--list', dumpPath], {
      stdout: 'pipe',
      stderr: 'pipe',
    })
  } catch (error: unknown) {
    throwIfPgRestoreMissing(error)
    throw error
  }
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
  let proc
  try {
    proc = Bun.spawn(
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
  } catch (error: unknown) {
    throwIfPgRestoreMissing(error)
    throw error
  }
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

async function countRows(table: string) {
  const rows = await db.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT count(*)::bigint AS count FROM data.${table}`,
  )
  return Number(rows[0]?.count ?? 0)
}
