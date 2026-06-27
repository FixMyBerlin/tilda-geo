import { join } from 'node:path'
import { $ } from 'bun'
import { type Topic, topicsConfig } from '../constants/topics.const'
import {
  createReferenceTable,
  diffTables,
  dropAllDiffTables,
  getSchemaTables,
  getTopicTables,
} from '../diffing/diffing'
import { isBerlinSaturday } from '../utils/berlinTime'
import { formatTimestamp } from '../utils/formatTimestamp'
import { updateDirectoryHash } from '../utils/hashing'
import { logEnd, logStart } from '../utils/logging'
import { params } from '../utils/parameters'
import { getSkipUnchangedContext, topicPath, willSkipTopic } from '../utils/skipUnchanged'
import { getTopicScheduleSkipReason } from '../utils/topicScheduleEligibility'
import { bboxesFilter, filteredFilePath } from './filter'
import {
  type ProcessingTopicsMeta,
  type TopicRanEntry,
  type TopicSkipReason,
  toIsoWindow,
  updateProcessingTopics,
} from './metadata'

const mainFilePath = (topic: Topic) => join(topicPath(topic), topic)

type TopicRunTimings = {
  lua: { start: Date; end: Date }
  sql?: { start: Date; end: Date }
}

/**
 * Run the given topic's SQL file
 * @param topic
 * @returns
 */
async function runSQL(topic: Topic) {
  console.log('runTopic: runSQL', topic)
  const psqlFile = `${mainFilePath(topic)}.sql`
  const exists = await Bun.file(psqlFile).exists()

  if (exists) {
    try {
      console.time(`Running SQL ${psqlFile}`)
      await $`psql -v ON_ERROR_STOP=1 -q -f ${psqlFile}`
      console.timeEnd(`Running SQL ${psqlFile}`)
    } catch (error) {
      throw new Error(`Failed to run SQL file "${psqlFile}": ${error}`)
    }
  }
}

/**
 * Run the given topic's lua file with osm2pgsql on the given file
 */
async function runLua(fileName: string, topic: Topic) {
  const filePath = filteredFilePath(fileName)
  const luaFile = `${mainFilePath(topic)}.lua`
  console.log('runTopic: runLua', topic, JSON.stringify({ luaFile, filePath }))
  try {
    await $`osm2pgsql \
              --number-processes=${params.osm2pgsqlNumberProcesses} \
              --create \
              --output=flex \
              --extra-attributes \
              --style=${luaFile} \
              --log-level=${params.osm2pgsqlLogLevel} \
              ${filePath}`
  } catch (error) {
    throw new Error(`Failed to run lua file "${luaFile}": ${error}`)
  }
}

/**
 * Run the given topic with osm2pgsql and the sql post-processing
 * @param fileName
 * @param topic
 */
async function runTopic(fileName: string, topic: Topic) {
  const luaStart = new Date()
  await runLua(fileName, topic)
  const luaEnd = new Date()

  const psqlFile = `${mainFilePath(topic)}.sql`
  const hasSql = await Bun.file(psqlFile).exists()

  if (!hasSql) {
    return { lua: { start: luaStart, end: luaEnd } } satisfies TopicRunTimings
  }

  const sqlStart = new Date()
  await runSQL(topic)
  const sqlEnd = new Date()

  return {
    lua: { start: luaStart, end: luaEnd },
    sql: { start: sqlStart, end: sqlEnd },
  } satisfies TopicRunTimings
}

/**
 * Run the given topics with optional diffing and code caching
 * @param fileName an OSM file name to run the topics on
 * @param fileChanged whether the file has changed since the last run
 * @param processingId current meta row id for persisting per-topic timings
 */
export async function processTopics(
  fileName: string,
  fileChanged: boolean,
  processingId: number | null,
) {
  logStart('Processing: Topics')

  const ranTopics = new Set<Topic>()
  const topicTimings: ProcessingTopicsMeta = {}

  const tableListPublic = await getSchemaTables('public')
  const tableListReference = await getSchemaTables('diffing_reference')

  const skipContext = await getSkipUnchangedContext(fileChanged)

  // Reference mode: Always create reference, never diff (clean baseline)
  // Previous/Fixed modes: Only diff when source PBF file hasn't changed (new download)
  // Note: Filter regenerations (tag/bbox filters) don't affect diffing - filtered data can still be diffed
  const isReferenceMode = params.diffingMode === 'reference'
  const diffChanges =
    params.diffingMode !== 'off' && params.diffingMode !== 'reference' && !fileChanged

  // Reference mode: Drop all diff tables once at the start for a clean slate
  if (isReferenceMode) {
    console.log('Diffing: Drop all diff tables (reference mode - clean slate)')
    await dropAllDiffTables()
  }

  const useGlobalBboxFilter = params.processOnlyBbox !== null
  if (params.processOnlyBbox) {
    console.log(
      `Topics: ℹ️ Using global PROCESS_ONLY_BBOX=${params.processOnlyBbox.join(',')}. Topic bbox filters are skipped.`,
    )
  }

  // Weekend topics run on the Saturday nightly run (Berlin time). Computed once for this run.
  const isSaturdayRun = isBerlinSaturday(new Date())

  for (const [topic, entry] of Array.from(topicsConfig)) {
    let innerBboxes = entry.bboxes
    let innerFileName = fileName

    const scheduleSkipReason = getTopicScheduleSkipReason(topic, entry, isSaturdayRun)
    if (scheduleSkipReason === 'weekend') {
      console.log(
        `Topics: ⏩ Skipping "${topic}" (schedule=weekend; runs on Saturday nights or via PROCESS_ONLY_TOPICS=${topic}).`,
      )
      topicTimings[topic] = { skipped: 'weekend' }
      continue
    }
    if (scheduleSkipReason === 'process_only') {
      console.log(
        `Topics: ⏩ Skipping "${topic}" based on PROCESS_ONLY_TOPICS=${params.processOnlyTopics.join(',')}`,
      )
      topicTimings[topic] = { skipped: 'process_only_topics' }
      continue
    }

    if (await willSkipTopic(topic, fileChanged, skipContext)) {
      const skipReason: TopicSkipReason =
        params.processOnlyTopics.length > 0 && !params.processOnlyTopics.includes(topic)
          ? 'process_only_topics'
          : 'unchanged'

      if (skipReason === 'process_only_topics') {
        console.log(
          `Topics: ⏩ Skipping "${topic}" based on PROCESS_ONLY_TOPICS=${params.processOnlyTopics.join(',')}`,
        )
      } else {
        console.log(
          `Topics: ⏩ Skipping "${topic}".`,
          "The code hasn't changed and `SKIP_UNCHANGED` is active.",
        )
      }
      topicTimings[topic] = { skipped: skipReason }
      continue
    }

    // In dev mode with PROCESS_ONLY_BBOX we already applied a global bbox filter in index.ts.
    // Keep topic bboxes only when no global bbox is active.
    if (useGlobalBboxFilter) {
      innerBboxes = null
    }

    // Bboxes: Create filtered source file
    if (innerBboxes) {
      innerFileName = `${topic}_extracted.osm.pbf`
      await bboxesFilter(fileName, innerFileName, innerBboxes, fileChanged)
    }

    // Get all tables related to `topic`
    const topicTables = await getTopicTables(topic)

    logStart(`Topics: ${topic}`)
    const processedTopicTables = topicTables.intersection(tableListPublic)

    const ranEntry: TopicRanEntry = {}
    // Wall-clock window for reference creation + diff computation (stored as meta.topics[].diff)
    let diffStart: Date | null = null

    // ============================================
    // Reference Creation Phase (for non-reference modes)
    // ============================================
    if (!isReferenceMode && diffChanges) {
      // Previous/Fixed modes: Create reference tables conditionally
      const createRefLabel = 'Diffing: Create reference tables'
      console.log(`${createRefLabel} - Start`)
      diffStart = new Date()
      const createRefStart = Date.now()
      // With `PROCESSING_DIFFING_MODE=fixed` we only create reference tables that are not already created (making sure the reference is complete).
      // Which means existing reference tables don't change (are frozen).
      // Learn more in [processing/README](../../processing/README.md#reference)
      const toCreateReference =
        params.diffingMode === 'fixed'
          ? processedTopicTables.difference(tableListReference)
          : processedTopicTables
      await Promise.all(Array.from(toCreateReference).map(createReferenceTable))
      console.log(`${createRefLabel} – Took ${formatTimestamp(Date.now() - createRefStart)}`)
    }

    // Run the topic with osm2pgsql (LUA) and the sql processing
    const runTimings = await runTopic(innerFileName, topic)
    ranEntry.lua = toIsoWindow(runTimings.lua.start, runTimings.lua.end)
    if (runTimings.sql) {
      ranEntry.sql = toIsoWindow(runTimings.sql.start, runTimings.sql.end)
    }
    ranTopics.add(topic)

    // Update the code hashes
    await updateDirectoryHash(topicPath(topic))

    // ============================================
    // Reference Creation Phase (for reference mode - AFTER topic runs)
    // ============================================
    if (isReferenceMode) {
      // Reference mode: Create reference tables AFTER processing to capture final state
      const createRefLabel = 'Diffing: Create reference tables (reference mode)'
      console.log(`${createRefLabel} - Start`)
      if (!diffStart) diffStart = new Date()
      const createRefStart = Date.now()
      await Promise.all(Array.from(processedTopicTables).map(createReferenceTable))
      console.log(`${createRefLabel} – Took ${formatTimestamp(Date.now() - createRefStart)}`)
    }

    // ============================================
    // Diffing Phase
    // ============================================
    if (isReferenceMode) {
      // Reference mode: Skip diff computation (already cleaned up)
      console.log('Diffing:', 'Skip diff computation (reference mode)')
    } else if (diffChanges) {
      // Previous/Fixed modes: Compute diffs
      const diffLabel = `Diffing: Update diffs (${params.diffingMode})`
      console.log(`${diffLabel} - Start`)
      if (!diffStart) diffStart = new Date()
      const diffComputeStart = Date.now()
      await diffTables(Array.from(processedTopicTables))
      console.log(`${diffLabel} – Took ${formatTimestamp(Date.now() - diffComputeStart)}`)
    } else {
      console.log(
        'Diffing:',
        'Skip diffing',
        JSON.stringify({
          diffChanges,
          diffingMode: params.diffingMode,
          fileChanged,
        }),
        diffChanges === false
          ? '`diffChanges` is false when `fileChanged==true` (new download) or `diffingMode==off`'
          : '',
      )
    }

    if (diffStart) {
      ranEntry.diff = toIsoWindow(diffStart, new Date())
    }

    topicTimings[topic] = ranEntry

    logEnd(`Topics: ${topic}`)
  }

  // Persist per-topic lua/sql/diff windows (or skip reasons) on public.meta.topics
  await updateProcessingTopics(processingId, topicTimings)

  logEnd('Processing: Topics')
  return ranTopics
}
