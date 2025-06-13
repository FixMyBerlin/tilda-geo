import { $ } from 'bun'
import { join } from 'path'
import { CONSTANTS_DIR, DATA_TABLE_DIR, TOPIC_DIR } from '../constants/directories.const'
import { topicsConfig, type Topic } from '../constants/topics.const'
import {
  backupTable,
  diffTables,
  dropDiffTable,
  getSchemaTables,
  getTopicTables,
} from '../diffing/diffing'
import { directoryHasChanged, updateDirectoryHash } from '../utils/hashing'
import { logEnd, logStart } from '../utils/logging'
import { params } from '../utils/parameters'
import { synologyLogInfo } from '../utils/synology'
import { bboxesFilter, filteredFilePath } from './filter'
import { writeMetadata } from './metadata'

const topicPath = (topic: Topic) => join(TOPIC_DIR, topic)
const mainFilePath = (topic: Topic) => join(topicPath(topic), topic)

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
    // Did not find an easy way to use $(Shell) and make the `--bbox` optional
    await $`osm2pgsql \
              --number-processes=8 \
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
export async function runTopic(fileName: string, topic: Topic) {
  await runLua(fileName, topic)
  await runSQL(topic)
}

/**
 * Run the given topics with optional diffing and code caching
 * @param topics a list of topics to run
 * @param fileName an OSM file name to run the topics on
 * @param fileChanged whether the file has changed since the last run
 */
export async function processTopics(fileName: string, fileChanged: boolean) {
  const tableListPublic = await getSchemaTables('public')
  const tableListBackup = await getSchemaTables('backup')

  // drop all previous diffs
  if (!params.freezeData) {
    tableListPublic.forEach(dropDiffTable)
  }

  // when the helpers have changed we disable all diffing functionality
  const helperPath = join(TOPIC_DIR, 'helper')
  const helpersChanged = await directoryHasChanged(helperPath)
  updateDirectoryHash(helperPath)
  if (helpersChanged) {
    console.log('ℹ️ Helpers have changed. Rerunning all code.')
  }

  // when the constants have changed we disable all diffing functionality
  const constantsDirChanged = await directoryHasChanged(CONSTANTS_DIR)
  updateDirectoryHash(CONSTANTS_DIR)
  if (constantsDirChanged) {
    console.log('ℹ️ processing/constants have changed. Rerunning all code.')
  }

  // when the constants have changed we disable all diffing functionality
  const dataTablesDirChanged = await directoryHasChanged(DATA_TABLE_DIR)
  updateDirectoryHash(DATA_TABLE_DIR)
  if (dataTablesDirChanged) {
    console.log('ℹ️ processing/dataTables have changed. Rerunning all code.')
  }

  const skipCode =
    params.skipUnchanged &&
    !helpersChanged &&
    !constantsDirChanged &&
    !dataTablesDirChanged &&
    !fileChanged &&
    params.processOnlyBbox !== null
  const diffChanges = params.computeDiffs && !fileChanged

  logStart('Processing Topics')

  try {
    const response = await fetch(params.fileURL.toString(), { method: 'HEAD' })
    const lastModified = response.headers.get('Last-Modified')
    const lastModifiedDate = lastModified ? new Date(lastModified).toISOString() : undefined
    synologyLogInfo(`Processing file from ${lastModifiedDate || 'UNKOWN_DATE'}`)
  } catch (error) {
    console.log('ERROR logging the lastModified date', error)
  }

  for (const [topic, bboxes] of Array.from(topicsConfig)) {
    let innerBboxes = bboxes
    let innerFileName = fileName

    // Topic: Skip unchanged topic
    const topicChanged = await directoryHasChanged(topicPath(topic))
    if (skipCode && !topicChanged) {
      console.log(
        `⏩ Skipping topic "${topic}".`,
        "The code hasn't changed and `SKIP_UNCHANGED` is active.",
      )
      continue
    }
    // Topic: Skip topic based on ENV
    if (params.processOnlyTopics.length > 0 && !params.processOnlyTopics.includes(topic)) {
      console.log(
        `⏩ Skipping topic "${topic}" based on PROCESS_ONLY_TOPICS=${params.processOnlyTopics.join(',')}`,
      )
      continue
    }
    // Bboxes: Overwrite bboxes based on ENV
    if (params.processOnlyBbox?.length === 4) {
      console.log(
        `ℹ️ Forcing a bbox filter based on PROCESS_ONLY_BBOX=${params.processOnlyBbox.join(',')}`,
      )
      // @ts-expect-error the readonly part gets in the way here…
      innerBboxes = [params.processOnlyBbox]
    }

    // Bboxes: Create filtered source file
    if (innerBboxes) {
      innerFileName = `${topic}_extracted.osm.pbf`
      await bboxesFilter(fileName, innerFileName, innerBboxes, fileChanged)
    }

    // Get all tables related to `topic`
    const topicTables = await getTopicTables(topic)

    logStart(`Topic "${topic}"`)
    const processedTopicTables = topicTables.intersection(tableListPublic)

    // Backup all tables related to topic
    if (diffChanges) {
      console.log('Diffing:', 'Backup tables')
      // With `freezeData=true` (which is `FREEZE_DATA=1`) we only backup tables that are not already backed up (making sure the backup is complete).
      // Which means existing backup tables don't change (are frozen).
      // Learn more in [processing/README](../../processing/README.md#reference)
      const toBackup = params.freezeData
        ? processedTopicTables.difference(tableListBackup)
        : processedTopicTables
      await Promise.all(Array.from(toBackup).map(backupTable))
    }

    // Run the topic with osm2pgsql (LUA) and the sql processing
    await runTopic(innerFileName, topic)

    // Update the code hashes
    updateDirectoryHash(topicPath(topic))

    // Update the diff tables
    if (diffChanges) {
      console.log('Diffing:', 'Update diffs')
      await diffTables(Array.from(processedTopicTables))
    }

    logEnd(`Topic "${topic}"`)
  }

  const timeElapsed = logEnd('Processing Topics')

  await writeMetadata(fileName, timeElapsed)
}
