import { existsSync, mkdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import * as p from '@clack/prompts'
import { PrismaPg } from '@prisma/adapter-pg'
import { z } from 'zod'
import { PrismaClient } from '@/prisma/generated/client'
import { getBaseDatabaseUrl } from '../../src/server/database-url.server'
import { applyDevPortSlotToProcessEnv } from '../predev/devPortSlot'

export const ALLOWED_SCHEMAS = ['prisma'] as const
export const ALLOWED_SOURCES = ['production', 'staging'] as const

export type AllowedSchema = (typeof ALLOWED_SCHEMAS)[number]
export type AllowedSource = (typeof ALLOWED_SOURCES)[number]

const REQUIRED_RESTORE_ENVIRONMENT = 'development'
const remoteDatabaseUrlSchema = z.string().trim().min(1)
const restoreEnvironmentSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.literal(REQUIRED_RESTORE_ENVIRONMENT))

/** Image for publish and db-pull `pg_dump`/`psql`. Same Postgres major; see data-schema/README.md#postgres-major-versions. */
export const POSTGRES_CLI_IMAGE = 'postgres:17-alpine'
const sourceArgSchema = z.string().trim().pipe(z.enum(ALLOWED_SOURCES))
const schemaArgSchema = z.string().trim().pipe(z.enum(ALLOWED_SCHEMAS))
const cliValuesSchema = z.object({
  schema: schemaArgSchema.optional(),
  source: sourceArgSchema.optional(),
  help: z.boolean().default(false),
})

const DATA_DIR = resolve(import.meta.dir, 'data')
export const PRE_RESTORE_SQL_PATH = resolve(import.meta.dir, 'sql', 'pre-restore.sql')

export function parseCliArgs(argv: string[]) {
  const { values } = parseArgs({
    args: argv,
    options: {
      schema: { type: 'string' },
      source: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
    allowPositionals: true,
    strict: true,
  })
  return cliValuesSchema.parse(values)
}

/** Prompt for schema only when more than one is allowed. `null` means the user cancelled. */
export async function resolveSchemaArg(schemaArg: AllowedSchema | undefined) {
  if (schemaArg) return schemaArg
  if (ALLOWED_SCHEMAS.length === 1) return ALLOWED_SCHEMAS[0]
  if (!process.stdin.isTTY) {
    throw new Error(
      `Missing required arg in non-interactive mode. Pass --schema <${ALLOWED_SCHEMAS.join('|')}>.`,
    )
  }
  const selected = await p.select({
    message: 'Select schema',
    initialValue: ALLOWED_SCHEMAS[0],
    options: ALLOWED_SCHEMAS.map((value) => ({ value, label: value })),
  })
  if (p.isCancel(selected)) return null
  return z.enum(ALLOWED_SCHEMAS).parse(selected)
}

export function getRemoteDatabaseUrl(source: AllowedSource) {
  const key = source === 'production' ? 'DATABASE_URL_PRODUCTION' : 'DATABASE_URL_STAGING'
  const parsed = remoteDatabaseUrlSchema.safeParse(process.env[key])
  if (!parsed.success) {
    throw new Error(`Missing ${key}. Add it to your local .env before running db pull.`)
  }
  return parsed.data
}

export function looksLikeConnectionError(message: string) {
  return /(connection refused|could not connect|could not translate host name|timeout expired|name or service not known|nodename nor servname provided|no route to host|network is unreachable|connection timed out)/i.test(
    message,
  )
}

/** Network failures plus auth failures that usually mean the SSH tunnel is down (local Docker is on the same port). */
export function looksLikeRemoteAccessError(message: string) {
  return (
    looksLikeConnectionError(message) ||
    /password authentication failed|authentication failed|no password supplied|fe_sendauth/i.test(
      message,
    )
  )
}

export function printRemoteConnectionGuidance(source: AllowedSource, _remoteUrl: string) {
  const localPortHint = source === 'production' ? '5434' : '5433'
  const tunnelCommand =
    source === 'production'
      ? 'ssh tilda-production-postgres-tunnel'
      : 'ssh tilda-staging-postgres-tunnel'

  p.log.warn(`Connection to ${source} DB failed. Start the SSH tunnel first.`)
  p.note(
    [
      `1) Terminal 1: start SSH tunnel for ${source}`,
      `   ${tunnelCommand}`,
      '2) Terminal 2: re-run db-pull',
      `   bun run db-pull:pull -- --source ${source}`,
      `3) Ensure DATABASE_URL_${source.toUpperCase()} points to localhost:${localPortHint}.`,
      `   Without the tunnel, that port may hit your local Docker DB (password auth fails).`,
      '   Setup docs: https://github.com/FixMyBerlin/dev-documentation/blob/main/server-management/ionos-tilda.md#use-the-ssh-tunnel',
    ].join('\n'),
    'How to connect',
  )
}

export function getLocalTargetDatabaseUrl() {
  // Same as predev / prisma.config. DEV_PORT_SLOT=1 sets DATABASE_PORT=5433, and so on.
  applyDevPortSlotToProcessEnv()
  return getBaseDatabaseUrl()
}

/** No audit extensions. Used for bulk restore and sanitize writes. */
export function createUnauditedPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: getLocalTargetDatabaseUrl(),
  })
  return new PrismaClient({ adapter })
}

export function toDockerNetworkUrl(databaseUrl: string) {
  const url = new URL(databaseUrl)
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === 'db') {
    url.hostname = 'host.docker.internal'
  }
  return url.toString()
}

export function assertLocalRestoreTarget(databaseUrl: string) {
  const parsedEnvironment = restoreEnvironmentSchema.safeParse(process.env.ENVIRONMENT)
  if (!parsedEnvironment.success) {
    const environment = process.env.ENVIRONMENT?.trim().toLowerCase()
    throw new Error(
      `Refusing restore: ENVIRONMENT must be "${REQUIRED_RESTORE_ENVIRONMENT}" (got "${environment ?? 'unset'}").`,
    )
  }

  const parsedDatabaseUrl = new URL(databaseUrl)
  if (!parsedDatabaseUrl.hostname) {
    throw new Error('Refusing restore: could not parse database host.')
  }
}

export function ensureDataDir() {
  mkdirSync(DATA_DIR, { recursive: true })
  return DATA_DIR
}

export function getDumpFilePath(source: AllowedSource, schema: AllowedSchema) {
  ensureDataDir()
  return resolve(DATA_DIR, `${source}.${schema}.sql`)
}

export function assertDumpFilePresent(path: string) {
  if (!existsSync(path)) {
    throw new Error(`Dump file not found: ${path}`)
  }
  const size = statSync(path).size
  if (size <= 0) {
    throw new Error(`Dump file is empty: ${path}`)
  }
}
