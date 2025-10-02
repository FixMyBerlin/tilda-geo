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
    const tagFilterResponse = await tagFilter(fileName, fileChanged)
    if (tagFilterResponse) ({ fileName, fileChanged } = tagFilterResponse)

    const idFilterResponse = await idFilter(fileName, params.idFilter)
    if (idFilterResponse) ({ fileName, fileChanged } = idFilterResponse)

    // Start timing for the actual data processing (matches old behavior)
    const processingStartTime = Date.now()
    await processTopics(fileName, fileChanged)
    await generateTypes()
    const timeElapsed = Date.now() - processingStartTime

    logPadded('Processing: Finishing up', berlinTimeString(new Date()))

    // Frontend: Registers sql functions and starts the analysis run
    await triggerPrivateApi('post-processing-hook')

    // Restart `tiles` container to refresh `/catalog`
    await restartTileServer()

    // Delete cache and (frontend) trigger cache warming
    await updateCache()

    // Frontend: Trigger QA evaluation updates for all regions
    console.log('Finishing up: Trigger qa update')
    await triggerPrivateApi('post-processing-qa-update')

    // Update processing entry with completion data
    await updateProcessingEntry(processingId, fileName, timeElapsed)

    logTileInfo()
  } catch (error) {
    // This `catch` will only trigger if child functions are `await`ed AND file calls a `main()` function. Top level code does not work.
    console.error('[ERROR] Processing failed (catchall)', error)
  }
}

main()
