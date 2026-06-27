import { join } from 'node:path'
import { $ } from 'bun'
import { type Topic, type TopicConfigEntry, topicsConfig } from '../constants/topics.const'
import type { TagFilterProfile } from '../constants/topics.tagFilters.const'
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
import { bboxesFilter, filteredFilePath, type TagFilterSource, tagFilterForProfile } from './filter'
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

type ProfilePbfCacheEntry = {
  fileName: string
  regenerated: boolean
}

type ProfilePbfCache = Map<TagFilterProfile, ProfilePbfCacheEntry>

type ProcessOnlyBboxCache = {
  source?: TagFilterSource
}

async function ensureProfileTaggedPbf(
  profile: TagFilterProfile,
  source: TagFilterSource,
  cache: ProfilePbfCache,
  outputFileName?: string,
) {
  const cached = cache.get(profile)
  if (cached) return cached

  const { fileName, regenerated } = await tagFilterForProfile({
    profile,
    source,
    outputFileName,
  })
  const entry: ProfilePbfCacheEntry = { fileName, regenerated }
  cache.set(profile, entry)
  return entry
}

async function ensureProcessOnlyBboxSource(
  sourceFileName: string,
  sourceFileChanged: boolean,
  cache: ProcessOnlyBboxCache,
) {
  if (cache.source) return cache.source
  if (!params.processOnlyBbox) {
    return {
      fileName: sourceFileName,
      changed: sourceFileChanged,
      inputFromDownload: true,
    } satisfies TagFilterSource
  }

  // PROCESS_ONLY_BBOX is a dev shortcut: create one bbox source from the original download,
  // then build the requested topic profiles from that bounded input.
  const fileName = 'process_only_bbox.osm.pbf'
  const regenerated = await bboxesFilter(
    sourceFileName,
    fileName,
    [params.processOnlyBbox],
    sourceFileChanged,
    {
      inputFromDownload: true,
    },
  )
  cache.source = {
    fileName,
    changed: sourceFileChanged || regenerated,
    inputFromDownload: false,
  }
  return cache.source
}

/**
 * Resolve the osm2pgsql input PBF for a topic (profile tag-filter, optional bbox extract).
 */
async function resolveTopicInputFile(
  topic: Topic,
  entry: TopicConfigEntry,
  sourceFileName: string,
  sourceFileChanged: boolean,
  profileCache: ProfilePbfCache,
  processOnlyBboxCache: ProcessOnlyBboxCache,
  useGlobalBboxFilter: boolean,
) {
  if (entry.bboxes && !useGlobalBboxFilter) {
    // Topic bboxes are applied before tag filters so bbox-limited topics never scan full-DE
    // profile inputs.
    const bboxFileName = `${topic}_bbox.osm.pbf`
    const extractedFileName = `${topic}_extracted.osm.pbf`
    const bboxRegenerated = await bboxesFilter(
      sourceFileName,
      bboxFileName,
      entry.bboxes,
      sourceFileChanged,
      {
        inputFromDownload: true,
      },
    )
    const { fileName } = await tagFilterForProfile({
      profile: entry.tagFilterProfile,
      source: {
        fileName: bboxFileName,
        changed: sourceFileChanged || bboxRegenerated,
        inputFromDownload: false,
      },
      outputFileName: extractedFileName,
    })
    return fileName
  }

  const source = useGlobalBboxFilter
    ? await ensureProcessOnlyBboxSource(sourceFileName, sourceFileChanged, processOnlyBboxCache)
    : ({
        fileName: sourceFileName,
        changed: sourceFileChanged,
        inputFromDownload: true,
      } satisfies TagFilterSource)
  const outputFileName = useGlobalBboxFilter
    ? `${entry.tagFilterProfile}_bbox_extracted.osm.pbf`
    : undefined
  const profilePbf = await ensureProfileTaggedPbf(
    entry.tagFilterProfile,
    source,
    profileCache,
    outputFileName,
  )

  return profilePbf.fileName
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
 * @param sourceFileName original download OSM file name
 * @param fileChanged whether the source file has changed since the last run
 * @param processingId current meta row id for persisting per-topic timings
 */
export async function processTopics(
  sourceFileName: string,
  fileChanged: boolean,
  processingId: number | null,
) {
  logStart('Processing: Topics')

  const ranTopics = new Set<Topic>()
  const topicTimings: ProcessingTopicsMeta = {}
  const profilePbfCache: ProfilePbfCache = new Map()
  const processOnlyBboxCache: ProcessOnlyBboxCache = {}

  const tableListPublic = await getSchemaTables('public')
  const tableListReference = await getSchemaTables('diffing_reference')

  const skipContext = await getSkipUnchangedContext(fileChanged)

  // Reference mode: Always create reference, never diff (clean baseline).
  // Previous/Fixed modes: Only diff when the source PBF file has not changed (new download).
  // Filter regenerations do not affect diffing; they are still the same source data.
  const isReferenceMode = params.diffingMode === 'reference'
  const diffChanges =
    params.diffingMode !== 'off' && params.diffingMode !== 'reference' && !fileChanged

  // Reference mode: Drop all diff tables once at the start for a clean slate.
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

    const innerFileName = await resolveTopicInputFile(
      topic,
      entry,
      sourceFileName,
      fileChanged,
      profilePbfCache,
      processOnlyBboxCache,
      useGlobalBboxFilter,
    )

    // Get all tables related to `topic`.
    const topicTables = await getTopicTables(topic)

    logStart(`Topics: ${topic}`)
    const processedTopicTables = topicTables.intersection(tableListPublic)

    const ranEntry: TopicRanEntry = {}
    // Wall-clock window for reference creation + diff computation (stored as meta.topics[].diff).
    let diffStart: Date | null = null

    // Reference Creation Phase (for non-reference modes).
    if (!isReferenceMode && diffChanges) {
      // Previous/Fixed modes: Create reference tables conditionally.
      const createRefLabel = 'Diffing: Create reference tables'
      console.log(`${createRefLabel} - Start`)
      diffStart = new Date()
      const createRefStart = Date.now()
      // With PROCESSING_DIFFING_MODE=fixed we only create missing reference tables. Existing
      // reference tables stay frozen so repeated fixed runs compare against the same baseline.
      const toCreateReference =
        params.diffingMode === 'fixed'
          ? processedTopicTables.difference(tableListReference)
          : processedTopicTables
      await Promise.all(Array.from(toCreateReference).map(createReferenceTable))
      console.log(`${createRefLabel} – Took ${formatTimestamp(Date.now() - createRefStart)}`)
    }

    // Run the topic with osm2pgsql (Lua) and optional SQL post-processing.
    const runTimings = await runTopic(innerFileName, topic)
    ranEntry.lua = toIsoWindow(runTimings.lua.start, runTimings.lua.end)
    if (runTimings.sql) {
      ranEntry.sql = toIsoWindow(runTimings.sql.start, runTimings.sql.end)
    }
    ranTopics.add(topic)

    // Update the code hashes after a successful topic run.
    await updateDirectoryHash(topicPath(topic))

    // Reference Creation Phase (for reference mode - AFTER topic runs).
    if (isReferenceMode) {
      // Reference mode: Create reference tables AFTER processing to capture final state.
      const createRefLabel = 'Diffing: Create reference tables (reference mode)'
      console.log(`${createRefLabel} - Start`)
      if (!diffStart) diffStart = new Date()
      const createRefStart = Date.now()
      await Promise.all(Array.from(processedTopicTables).map(createReferenceTable))
      console.log(`${createRefLabel} – Took ${formatTimestamp(Date.now() - createRefStart)}`)
    }

    // Diffing Phase.
    if (isReferenceMode) {
      // Reference mode: Skip diff computation (already cleaned up).
      console.log('Diffing:', 'Skip diff computation (reference mode)')
    } else if (diffChanges) {
      // Previous/Fixed modes: Compute diffs.
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

  // Persist per-topic lua/sql/diff windows (or skip reasons) on public.meta.topics.
  await updateProcessingTopics(processingId, topicTimings)

  logEnd('Processing: Topics')
  return ranTopics
}
