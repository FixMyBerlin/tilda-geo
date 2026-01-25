import { updateCache } from './steps/cache'
import { downloadFile, waitForFreshData } from './steps/download'
import { restartTileServer, triggerPrivateApi } from './steps/externalTriggers'
import { idFilter, tagFilter } from './steps/filter'
import { generateTypes } from './steps/generateTypes'
import { initialize } from './steps/initialize'
import { createProcessingEntry, updateProcessingEntry } from './steps/metadata'
import { processTopics } from './steps/processTopics'
import { berlinTimeString } from './utils/berlinTime'
import { logPadded, logTileInfo } from './utils/logging'
import { params } from './utils/parameters'

async function main() {
  try {
    logPadded('Processing', berlinTimeString(new Date()))

    await initialize()

    // Create processing entry at the start
    const processingId = await createProcessingEntry()

    logPadded('Processing: Download', berlinTimeString(new Date()))
    await waitForFreshData()
    let { fileName, fileChanged } = await downloadFile()

    logPadded('Processing: Filter', berlinTimeString(new Date()))
    // tagFilter regenerates filtered file if needed, but only returns sourceFileChanged
    // (filter regeneration doesn't affect diffing logic)
    const tagFilterResponse = await tagFilter(fileName, fileChanged)
    if (tagFilterResponse) ({ fileName, fileChanged } = tagFilterResponse)

    // idFilter regenerates filtered file when active, but only returns sourceFileChanged
    // (filter regeneration doesn't affect diffing logic - filtered data can still be diffed)
    const idFilterResponse = await idFilter(fileName, fileChanged, params.idFilter)
    if (idFilterResponse) ({ fileName, fileChanged } = idFilterResponse)

    // Start timing for the actual data processing (matches old behavior)
    const processingStartTime = Date.now()
    await processTopics(fileName, fileChanged)
    await generateTypes()
    const timeElapsed = Date.now() - processingStartTime

    logPadded('Processing: Finishing up', berlinTimeString(new Date()))

    // Update processing entry: mark main processing as complete, set status to 'postprocessing'
    await updateProcessingEntry(processingId, fileName, timeElapsed)

    // Frontend: Registers sql functions and starts the analysis run (async, fire-and-forget)
    // Frontend: Trigger QA evaluation updates for all regions (async, fire-and-forget)
    console.log('Finishing up: Trigger async app init (sql functions, analysis) and qa update')
    triggerPrivateApi('post-processing-hook')
    triggerPrivateApi('post-processing-qa-update')

    // Restart `tiles` container to refresh `/catalog`
    await restartTileServer()

    // Delete cache and (frontend) trigger cache warming
    await updateCache()

    logTileInfo()
  } catch (error) {
    // This `catch` will only trigger if child functions are `await`ed AND file calls a `main()` function. Top level code does not work.
    console.error('[ERROR] Processing failed (catchall)', error)
  }
}

main()
