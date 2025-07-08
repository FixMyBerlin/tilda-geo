import type { TopicConfigBbox } from '../constants/topics.const'

function parseParameters() {
  return {
    waitForFreshData: process.env.WAIT_FOR_FRESH_DATA === '1',
    skipDownload: process.env.SKIP_DOWNLOAD === '1',
    skipWarmCache: process.env.SKIP_WARM_CACHE === '1',
    fileURL: new URL(process.env.OSM_DOWNLOAD_URL || ''),
    idFilter: process.env.ID_FILTER || '',
    apiKey: process.env.ATLAS_API_KEY || '',
    computeDiffs: process.env.COMPUTE_DIFFS === '1',
    computeDiffBbox: process.env.PROCESS_COMPUTE_DIFF_BBOX
      ? (process.env.PROCESS_COMPUTE_DIFF_BBOX.split(',').map((t) =>
          Number(t.trim()),
        ) as TopicConfigBbox)
      : null,
    freezeData: process.env.FREEZE_DATA === '1',
    skipUnchanged: process.env.SKIP_UNCHANGED === '1',
    environment: process.env.ENVIRONMENT || '',
    synologyLogToken: process.env.SYNOLOGY_LOG_TOKEN,
    synologyErrorLogToken: process.env.SYNOLOGY_ERROR_LOG_TOKEN,
    synologyURL: process.env.SYNOLOGY_URL,
    processOnlyTopics: process.env.PROCESS_ONLY_TOPICS
      ? process.env.PROCESS_ONLY_TOPICS.split(',').map((t) => t.trim())
      : [],
    processOnlyBbox: process.env.PROCESS_ONLY_BBOX
      ? (process.env.PROCESS_ONLY_BBOX.split(',').map((t) => Number(t.trim())) as TopicConfigBbox)
      : null,
    osm2pgsqlLogLevel: process.env.OSM2PGSQL_LOG_LEVEL || 'info',
  }
}

export const params = parseParameters()
