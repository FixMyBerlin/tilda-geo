import { styleText } from 'node:util'
import { z } from 'zod'
import type { TopicConfigBbox } from '../constants/topics.const'

export type DiffingMode = 'off' | 'previous' | 'fixed' | 'reference'

function parseBbox(envVar: string | undefined): TopicConfigBbox | null {
  const result = envVar ? (envVar.split(',').map((t) => Number(t.trim())) as TopicConfigBbox) : null
  if (result !== null && result.length !== 4) {
    console.error(
      styleText(
        'red',
        `ERROR: BBOX value was parsed but did not result in a valid bbox (input: ${envVar}, result: ${JSON.stringify(result)})`,
      ),
    )
  }
  return result
}

const diffingModeSchema = z.enum(['off', 'previous', 'fixed', 'reference'])

const oauthCredentialSchema = z
  .string()
  .min(5, 'OAuth credential must be at least 5 characters')
  .or(z.literal('').transform(() => undefined))
  .or(z.undefined())

const urlSchema = z.url('Must be a valid URL')

// Default 4 — benchmark and rationale: processing/docs/osm2pgsql-number-processes.md
const OSM2PGSQL_DEFAULT_NUMBER_PROCESSES = 4
const osm2pgsqlNumberProcessesSchema = z.coerce.number().default(OSM2PGSQL_DEFAULT_NUMBER_PROCESSES)

function parseParameters() {
  return {
    waitForFreshData: process.env.WAIT_FOR_FRESH_DATA === '1',
    skipDownload: process.env.SKIP_DOWNLOAD === '1',
    skipWarmCache: process.env.SKIP_WARM_CACHE === '1',
    osmUsername: oauthCredentialSchema.parse(process.env.PROCESS_GEOFABRIK_OAUTH_OSM_USERNAME),
    osmPassword: oauthCredentialSchema.parse(process.env.PROCESS_GEOFABRIK_OAUTH_OSM_PASSWORD),
    pbfDownloadUrl: urlSchema.parse(process.env.PROCESS_GEOFABRIK_DOWNLOAD_URL),
    apiKey: process.env.ATLAS_API_KEY || '',
    diffingMode: diffingModeSchema.parse(process.env.PROCESSING_DIFFING_MODE),
    diffingBbox: parseBbox(process.env.PROCESSING_DIFFING_BBOX),
    skipUnchanged: process.env.SKIP_UNCHANGED === '1',
    environment: process.env.ENVIRONMENT || '',
    processOnlyTopics: process.env.PROCESS_ONLY_TOPICS
      ? process.env.PROCESS_ONLY_TOPICS.split(',').map((t) => t.trim())
      : [],
    processOnlyBbox: parseBbox(process.env.PROCESS_ONLY_BBOX),
    osm2pgsqlLogLevel: process.env.OSM2PGSQL_LOG_LEVEL || 'info',
    osm2pgsqlNumberProcesses: osm2pgsqlNumberProcessesSchema.parse(
      // Missing env → undefined → default 4. Compose may set the var to "" (key present, empty value);
      // that is not undefined, and z.coerce.number() would parse "" as 0 — || undefined maps both to default.
      process.env.OSM2PGSQL_NUMBER_PROCESSES || undefined,
    ),
  }
}

export const params = parseParameters()

export const paramsFilteredForLogs = {
  ...params,
  apiKey: params.apiKey ? '***' : '',
  osmUsername: params.osmUsername ? '***' : params.osmUsername,
  osmPassword: params.osmPassword ? '***' : params.osmPassword,
}
