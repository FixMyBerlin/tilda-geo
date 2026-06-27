import { runAfterthoughts } from './steps/afterthoughts'
import { updateCache } from './steps/cache'
import { downloadFile, waitForFreshData } from './steps/download'
import { triggerPrivateApi } from './steps/externalTriggers'
import { generateTypes } from './steps/generateTypes'
import { initialize } from './steps/initialize'
import { createProcessingEntry, updateProcessingEntry } from './steps/metadata'
import { processTopics } from './steps/processTopics'
import { berlinTimeString } from './utils/berlinTime'
import { logPadded, logTileInfo } from './utils/logging'
import { logProcessingStartupContext } from './utils/logStartupContext'

async function main() {
  try {
    logPadded('Processing', berlinTimeString(new Date()))

    await logProcessingStartupContext()
    await initialize()

    // Create processing entry at the start
    const processingId = await createProcessingEntry()

    logPadded('Processing: Download', berlinTimeString(new Date()))
    await waitForFreshData()
    const { fileName: sourceFileName, fileChanged } = await downloadFile()

    logPadded('Processing: Topics', berlinTimeString(new Date()))
    const processingStartTime = Date.now()
    const ranTopics = await processTopics(sourceFileName, fileChanged, processingId)
    await generateTypes()
    const timeElapsed = Date.now() - processingStartTime

    logPadded('Processing: Finishing up', berlinTimeString(new Date()))

    // Update processing entry: mark main processing as complete, set status to 'postprocessing'
    await updateProcessingEntry(processingId, sourceFileName, timeElapsed)

    // Frontend: Registers sql functions (async, fire-and-forget)
    // Frontend: Trigger QA evaluation updates for all regions (async, fire-and-forget)
    console.log('Finishing up: Trigger async app init (sql functions) and qa update')
    triggerPrivateApi('post-processing-hook')
    triggerPrivateApi('post-processing-qa-update')

    // Delete cache and (frontend) trigger cache warming
    await updateCache()

    logTileInfo()
    await runAfterthoughts(processingId, fileChanged, ranTopics)
  } catch (error) {
    // This `catch` will only trigger if child functions are `await`ed AND file calls a `main()` function. Top level code does not work.
    console.error('[ERROR] Processing failed (catchall)', error)
  }
}

main()
