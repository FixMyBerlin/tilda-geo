import { PrismaPg } from '@prisma/adapter-pg'
import { Client } from 'pg'
import { PrismaClient } from '@/prisma/generated/client'
import { getBaseDatabaseUrl } from '@/server/database-url.server'
import { assertDataSchemaTableName } from './dataSchemaS3Keys'
import { parsePgRestoreToc } from './parsePgRestoreToc'
import { type AsideRenameMapping, asidePgIdentifier } from './pgIdentifier'

const SCHEMA = 'data'
const ASIDE_SUFFIX = '__old'

// Dedicated client without geo statement_timeout/lock_timeout — large data.* COUNT(*) exceeds 60s.
const dataSchemaAdapter = new PrismaPg({ connectionString: getBaseDatabaseUrl() })
const dataSchemaClient = new PrismaClient({ adapter: dataSchemaAdapter })

function databaseUrlToPgEnv(databaseUrl: string) {
  const url = new URL(databaseUrl)
  return {
    PGHOST: url.hostname,
    PGPORT: url.port || '5432',
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
    PGDATABASE: url.pathname.replace(/^\//, '').split('?')[0] ?? '',
  }
}

function pgCliEnv() {
  return {
    ...process.env,
    ...databaseUrlToPgEnv(getBaseDatabaseUrl()),
  }
}

/** Session advisory lock for one table import; must use a dedicated connection (pool-safe). */
export async function withDataSchemaImportLock<T>(table: string, fn: () => Promise<T>) {
  assertDataSchemaTableName(table)
  const lockKey = `data-schema-import:${table}`
  const client = new Client({ connectionString: getBaseDatabaseUrl() })
  await client.connect()
  try {
    const result = await client.query<{ locked: boolean }>(
      `SELECT pg_try_advisory_lock(hashtext($1)) AS locked`,
      [lockKey],
    )
    if (!result.rows[0]?.locked) {
      throw new Error(
        `Import läuft bereits für data.${table} (advisory lock nicht verfügbar). Bitte warten und erneut versuchen.`,
      )
    }
    try {
      return await fn()
    } finally {
      await client
        .query(`SELECT pg_advisory_unlock(hashtext($1))`, [lockKey])
        .catch(() => undefined)
    }
  } finally {
    await client.end().catch(() => undefined)
  }
}

/** `pg_dump --table=data.*` omits CREATE SCHEMA; fresh DBs need this before restore. */
export async function ensureDataSchemaExists() {
  await dataSchemaClient.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS ${quoteIdent(SCHEMA)}`)
}

export async function dataSchemaTableExists(table: string) {
  assertDataSchemaTableName(table)
  const existsRows = await dataSchemaClient.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = ${SCHEMA}
        AND table_name = ${table}
    ) AS "exists"
  `
  return Boolean(existsRows[0]?.exists)
}

export async function getDataSchemaTableRowCount(table: string) {
  assertDataSchemaTableName(table)
  if (!(await dataSchemaTableExists(table))) return null

  const countRows = await dataSchemaClient.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT count(*)::bigint AS count FROM ${SCHEMA}.${quoteIdent(table)}`,
  )
  return Number(countRows[0]?.count ?? 0)
}

export async function pgRestoreListTables(dumpPath: string) {
  const result = Bun.spawnSync(['pg_restore', '--list', dumpPath], {
    stdout: 'pipe',
    stderr: 'pipe',
  })
  if (result.exitCode !== 0) {
    throw new Error(
      result.stderr.toString().trim() || `pg_restore --list failed (${result.exitCode})`,
    )
  }
  const stdout = result.stdout.toString()
  // Validate early so callers that only use `tables` still reject hostile dumps.
  const entries = parsePgRestoreToc(stdout)
  const tables = new Set<string>()
  for (const entry of entries) {
    if (entry.unparseable) continue
    if (entry.desc === 'TABLE' || entry.desc === 'TABLE DATA') {
      if (entry.schema) tables.add(`${entry.schema}.${entry.name}`)
    }
  }
  return { stdout, tables }
}

export async function renameTableAside(table: string, suffix = ASIDE_SUFFIX) {
  assertDataSchemaTableName(table)
  const asideName = asidePgIdentifier(table, suffix)
  const mapping: AsideRenameMapping = {
    table: { from: table, to: asideName },
    indexes: [],
    constraints: [],
    sequences: [],
  }

  await dataSchemaClient.$transaction(async (tx) => {
    // ACCESS EXCLUSIVE blocks while readers hold the table (e.g. nightly processing); fail fast.
    await tx.$executeRaw`SELECT set_config('lock_timeout', '5s', true)`

    await tx.$executeRawUnsafe(
      `ALTER TABLE ${SCHEMA}.${quoteIdent(table)} RENAME TO ${quoteIdent(asideName)}`,
    )

    const indexes = await tx.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname FROM pg_indexes
      WHERE schemaname = ${SCHEMA} AND tablename = ${asideName}
    `
    for (const { indexname } of indexes) {
      const newName = asidePgIdentifier(indexname, suffix)
      mapping.indexes.push({ from: indexname, to: newName })
      await tx.$executeRawUnsafe(
        `ALTER INDEX ${SCHEMA}.${quoteIdent(indexname)} RENAME TO ${quoteIdent(newName)}`,
      )
    }

    const constraints = await tx.$queryRaw<Array<{ conname: string }>>`
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      JOIN pg_namespace n ON t.relnamespace = n.oid
      WHERE n.nspname = ${SCHEMA} AND t.relname = ${asideName}
    `
    for (const { conname } of constraints) {
      const newName = asidePgIdentifier(conname, suffix)
      mapping.constraints.push({ from: conname, to: newName })
      await tx.$executeRawUnsafe(
        `ALTER TABLE ${SCHEMA}.${quoteIdent(asideName)} RENAME CONSTRAINT ${quoteIdent(conname)} TO ${quoteIdent(newName)}`,
      )
    }

    // SERIAL/IDENTITY sequences keep their own names when the table is renamed; free
    // data.<table>_id_seq so the next pg_restore can CREATE SEQUENCE again.
    const sequences = await tx.$queryRaw<Array<{ sequencename: string }>>`
      SELECT seq.relname AS sequencename
      FROM pg_class seq
      JOIN pg_namespace seq_ns ON seq_ns.oid = seq.relnamespace
      JOIN pg_depend dep ON dep.objid = seq.oid AND dep.deptype = 'a'
      JOIN pg_class tbl ON dep.refobjid = tbl.oid
      JOIN pg_namespace tbl_ns ON tbl_ns.oid = tbl.relnamespace
      WHERE seq.relkind = 'S'
        AND seq_ns.nspname = ${SCHEMA}
        AND tbl_ns.nspname = ${SCHEMA}
        AND tbl.relname = ${asideName}
    `
    for (const { sequencename } of sequences) {
      const newName = asidePgIdentifier(sequencename, suffix)
      mapping.sequences.push({ from: sequencename, to: newName })
      await tx.$executeRawUnsafe(
        `ALTER SEQUENCE ${SCHEMA}.${quoteIdent(sequencename)} RENAME TO ${quoteIdent(newName)}`,
      )
    }
  })

  return mapping
}

/** Reverse of renameTableAside using the recorded original→aside map (not string slicing). */
export async function restoreTableAside(mapping: AsideRenameMapping) {
  const { table, indexes, constraints, sequences } = mapping
  assertDataSchemaTableName(table.from)

  await dataSchemaClient.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('lock_timeout', '5s', true)`

    // Rename owned objects back before the table so names cannot collide with a live restore.
    for (const { from, to } of indexes) {
      await tx.$executeRawUnsafe(
        `ALTER INDEX ${SCHEMA}.${quoteIdent(to)} RENAME TO ${quoteIdent(from)}`,
      )
    }

    for (const { from, to } of constraints) {
      await tx.$executeRawUnsafe(
        `ALTER TABLE ${SCHEMA}.${quoteIdent(table.to)} RENAME CONSTRAINT ${quoteIdent(to)} TO ${quoteIdent(from)}`,
      )
    }

    for (const { from, to } of sequences) {
      await tx.$executeRawUnsafe(
        `ALTER SEQUENCE ${SCHEMA}.${quoteIdent(to)} RENAME TO ${quoteIdent(from)}`,
      )
    }

    await tx.$executeRawUnsafe(
      `ALTER TABLE ${SCHEMA}.${quoteIdent(table.to)} RENAME TO ${quoteIdent(table.from)}`,
    )
  })
}

export function expectedAsideTableName(table: string, suffix = ASIDE_SUFFIX) {
  return asidePgIdentifier(table, suffix)
}

export async function dropTableIfExists(qualifiedName: string) {
  const match = qualifiedName.match(/^([a-z][a-z0-9_]*)\.([a-z][a-z0-9_]*)$/)
  if (!match) {
    throw new Error(`Invalid qualified table name "${qualifiedName}"`)
  }
  const schema = match[1]!
  const table = match[2]!
  if (schema === SCHEMA) assertDataSchemaTableName(table)
  await dataSchemaClient.$executeRawUnsafe(
    `DROP TABLE IF EXISTS ${quoteIdent(schema)}.${quoteIdent(table)} CASCADE`,
  )
}

export async function restoreDumpFile(dumpPath: string, _table: string) {
  const env = pgCliEnv()
  // Credentials via env (not argv) so they do not appear in ps/cmdline.
  const proc = Bun.spawn(
    [
      'pg_restore',
      `--dbname=${env.PGDATABASE}`,
      '--single-transaction',
      '--no-owner',
      '--no-privileges',
      dumpPath,
    ],
    { stdout: 'pipe', stderr: 'pipe', env },
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

export async function dumpTableToFile(table: string, dumpPath: string) {
  assertDataSchemaTableName(table)
  const env = pgCliEnv()
  const proc = Bun.spawn(
    [
      'pg_dump',
      '--format=custom',
      '--no-owner',
      '--no-privileges',
      `--table=${SCHEMA}.${table}`,
      `--file=${dumpPath}`,
    ],
    { stdout: 'pipe', stderr: 'pipe', env },
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

export async function getPgDumpVersion() {
  const result = Bun.spawnSync(['pg_dump', '--version'], { stdout: 'pipe', stderr: 'pipe' })
  if (result.exitCode !== 0) {
    throw new Error(result.stderr.toString().trim() || 'pg_dump --version failed')
  }
  const text = result.stdout.toString().trim()
  const match = text.match(/(\d+\.\d+(?:\.\d+)?)/)
  return match?.[1] ?? text
}

function quoteIdent(ident: string) {
  if (!ident || ident.includes('\0')) {
    throw new Error(`Unsafe SQL identifier "${ident}"`)
  }
  return `"${ident.replaceAll('"', '""')}"`
}
