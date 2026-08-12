import { assertDataSchemaTableName } from '@/server/dataSchema/dataSchemaS3Keys'
import {
  POSTGRES_CLI_IMAGE,
  getLocalTargetDatabaseUrl,
  toDockerNetworkUrl,
} from '../db-pull/db-helpers'

const REQUIRED_ENVIRONMENT = 'development'
export const SCHEMA = 'data'

export function assertDevelopmentEnvironment() {
  const environment = process.env.ENVIRONMENT?.trim().toLowerCase()
  if (environment !== REQUIRED_ENVIRONMENT) {
    throw new Error(
      `Refusing: ENVIRONMENT must be "${REQUIRED_ENVIRONMENT}" (got "${environment ?? 'unset'}").`,
    )
  }
}

export function getDatabaseUrl() {
  return getLocalTargetDatabaseUrl()
}

export function getDockerDatabaseUrl() {
  return toDockerNetworkUrl(getDatabaseUrl())
}

export async function runPsql(command: string) {
  const { $ } = await import('bun')
  const dockerUrl = getDockerDatabaseUrl()
  const result =
    await $`docker run --rm --add-host=host.docker.internal:host-gateway --entrypoint psql ${POSTGRES_CLI_IMAGE} --tuples-only --no-align --command=${command} ${dockerUrl}`
      .quiet()
      .nothrow()
  if (result.exitCode !== 0) {
    throw new Error(result.stderr.toString().trim() || `psql failed (${result.exitCode})`)
  }
  return result.stdout.toString().trim()
}

export async function getRowCount(tableName: string) {
  assertDataSchemaTableName(tableName)
  const raw = await runPsql(`SELECT count(*)::bigint FROM ${SCHEMA}.${tableName};`)
  const count = Number(raw)
  if (!Number.isFinite(count)) {
    throw new Error(`Could not parse row count: ${raw}`)
  }
  return count
}

export { POSTGRES_CLI_IMAGE }
