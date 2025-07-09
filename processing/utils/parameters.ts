import { z } from 'zod'
import type { TopicConfigBbox } from '../constants/topics.const'

export type DiffingMode = 'off' | 'previous' | 'fixed'

function parseBbox(envVar: string | undefined): TopicConfigBbox | null {
  return envVar ? (envVar.split(',').map((t) => Number(t.trim())) as TopicConfigBbox) : null
}

const diffingModeSchema = z.enum(['off', 'previous', 'fixed'])

function parseParameters() {
  return {
    waitForFreshData: process.env.WAIT_FOR_FRESH_DATA === '1',
    skipDownload: process.env.SKIP_DOWNLOAD === '1',
    skipWarmCache: process.env.SKIP_WARM_CACHE === '1',
    fileURL: new URL(process.env.OSM_DOWNLOAD_URL || ''),
    idFilter: process.env.ID_FILTER || '',
    apiKey: process.env.ATLAS_API_KEY || '',
    diffingMode: diffingModeSchema.parse(process.env.PROCESSING_DIFFING_MODE),
    diffingBbox: parseBbox(process.env.PROCESSING_DIFFING_BBOX),
    skipUnchanged: process.env.SKIP_UNCHANGED === '1',
    environment: process.env.ENVIRONMENT || '',
    synologyLogToken: process.env.SYNOLOGY_LOG_TOKEN,
    synologyErrorLogToken: process.env.SYNOLOGY_ERROR_LOG_TOKEN,
    synologyURL: process.env.SYNOLOGY_URL,
    processOnlyTopics: process.env.PROCESS_ONLY_TOPICS
      ? process.env.PROCESS_ONLY_TOPICS.split(',').map((t) => t.trim())
      : [],
    processOnlyBbox: parseBbox(process.env.PROCESS_ONLY_BBOX),
    osm2pgsqlLogLevel: process.env.OSM2PGSQL_LOG_LEVEL || 'info',
  }
}

export const params = parseParameters()
