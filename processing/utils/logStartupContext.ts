import { hostname, totalmem, cpus } from 'node:os'
import { styleText } from 'node:util'
import { $, sql } from 'bun'
import { topicsConfig } from '../constants/topics.const'
import { isBerlinSaturday } from './berlinTime'
import { logPadded } from './logging'
import { params, paramsFilteredForLogs } from './parameters'
import { getTopicScheduleSkipReason } from './topicScheduleEligibility'

/** Fixed iteration count — do not change without renaming the log field. */
const CPU_BENCHMARK_ITERATIONS = 1_000_000_000

/**
 * Reference values (1e9-add loop, bun 1.3.14, idle, 2026-07-03):
 *   tilda-production ~719 ms | tilda-staging ~1029 ms (1.43× slower)
 * Normalize cross-host times: timeA × (cpuBenchmarkMs_B / cpuBenchmarkMs_A)
 * Same-host spike → check hypervisor steal before blaming code.
 */
function runCpuBenchmark() {
  const t0 = performance.now()
  let s = 0
  for (let i = 0; i < CPU_BENCHMARK_ITERATIONS; i++) s += i
  const elapsed = performance.now() - t0
  return Math.round(elapsed + (s < 0 ? 1 : 0))
}

function getTopicSchedulePreview(isSaturdayRun: boolean) {
  const eligible: string[] = []
  const skippedWeekend: string[] = []
  const skippedProcessOnly: string[] = []

  for (const [topic, entry] of Array.from(topicsConfig)) {
    const skipReason = getTopicScheduleSkipReason(topic, entry, isSaturdayRun)

    if (skipReason === 'weekend') {
      skippedWeekend.push(topic)
      continue
    }

    if (skipReason === 'process_only') {
      skippedProcessOnly.push(topic)
      continue
    }

    eligible.push(topic)
  }

  return { eligible, skippedWeekend, skippedProcessOnly }
}

async function getOsm2pgsqlVersion() {
  try {
    const result = await $`osm2pgsql --version 2>&1`.text()
    return { version: result.trim().split('\n')[0] || null }
  } catch (error) {
    return { version: null, error: String(error) }
  }
}

function getStartupConfig() {
  return {
    ...paramsFilteredForLogs,
    hasOsmOAuth: Boolean(params.osmUsername),
    pgHost: process.env.PGHOST ?? null,
    pgDatabase: process.env.PGDATABASE ?? null,
    pgUser: process.env.PGUSER ?? null,
  }
}

function warnPerRunEnvOverrides() {
  if (params.environment !== 'staging' && params.environment !== 'production') return

  const overrides: string[] = []
  if (params.processOnlyTopics.length > 0) overrides.push('PROCESS_ONLY_TOPICS')
  if (params.processOnlyBbox) overrides.push('PROCESS_ONLY_BBOX')
  if (process.env.OSM2PGSQL_NUMBER_PROCESSES) overrides.push('OSM2PGSQL_NUMBER_PROCESSES')
  if (process.env.OSM2PGSQL_LOG_LEVEL && process.env.OSM2PGSQL_LOG_LEVEL !== 'info') {
    overrides.push('OSM2PGSQL_LOG_LEVEL')
  }
  if (params.waitForFreshData) overrides.push('WAIT_FOR_FRESH_DATA')
  if (params.skipWarmCache) overrides.push('SKIP_WARM_CACHE')

  if (overrides.length === 0) return

  console.warn(
    styleText(
      'yellow',
      `Processing: per-run env overrides active (${overrides.join(', ')}) — expected only for nightly workflow or explicit one-liner, not ad-hoc .env`,
    ),
  )
}

async function getPostgresVersion() {
  try {
    const [{ version }] = await sql`SELECT version()`
    return { version }
  } catch (error) {
    return { version: null, error: String(error) }
  }
}

export async function logProcessingStartupContext() {
  const isSaturdayRun = isBerlinSaturday(new Date())
  const osm2pgsqlPromise = getOsm2pgsqlVersion()
  const postgresPromise = getPostgresVersion()
  const cpuBenchmarkMs = runCpuBenchmark()
  const [{ version: osm2pgsqlVersion, error: osm2pgsqlVersionError }, postgres] = await Promise.all(
    [osm2pgsqlPromise, postgresPromise],
  )

  logPadded('Processing: Startup')
  console.log(JSON.stringify(getStartupConfig()))
  warnPerRunEnvOverrides()
  console.log(
    JSON.stringify({
      gitSha: process.env.GIT_SHA?.trim() || null,
      bunVersion: Bun.version,
      hostname: hostname(),
      cpuCount: cpus().length,
      memoryTotalGb: Math.round(totalmem() / 1e9),
      cpuBenchmarkMs,
      osm2pgsqlVersion,
      ...(osm2pgsqlVersionError ? { osm2pgsqlVersionError } : {}),
      postgresVersion: postgres.version,
      ...(postgres.error ? { postgresVersionError: postgres.error } : {}),
      isSaturdayRun,
      skipUnchangedActive: params.skipUnchanged,
      topicSchedulePreview: getTopicSchedulePreview(isSaturdayRun),
    }),
  )
}
