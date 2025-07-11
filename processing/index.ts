import { updateCache } from './steps/cache'
import { downloadFile, waitForFreshData } from './steps/download'
import { restartTileServer, triggerPostProcessing } from './steps/externalTriggers'
import { idFilter, tagFilter } from './steps/filter'
import { generateTypes } from './steps/generateTypes'
import { initialize } from './steps/initialize'
import { initializeOAuth } from './steps/initializeOAuth'
import { processTopics } from './steps/processTopics'
import { berlinTimeString } from './utils/berlinTime'
import { logPadded, logTileInfo } from './utils/logging'
import { params } from './utils/parameters'

async function main() {
  try {
    logPadded('Processing', berlinTimeString(new Date()))

    await initialize()

    await initializeOAuth()

    logPadded('Processing: Download', berlinTimeString(new Date()))
    await waitForFreshData()
    let { fileName, fileChanged } = await downloadFile()

    logPadded('Processing: Filter', berlinTimeString(new Date()))
    const tagFilterResponse = await tagFilter(fileName, fileChanged)
    if (tagFilterResponse) ({ fileName, fileChanged } = tagFilterResponse)

    const idFilterResponse = await idFilter(fileName, params.idFilter)
    if (idFilterResponse) ({ fileName, fileChanged } = idFilterResponse)

    await processTopics(fileName, fileChanged)
    await generateTypes()

    logPadded('Processing: Finishing up', berlinTimeString(new Date()))
    // Call the frontend update hook which registers sql functions and starts the analysis run
    await triggerPostProcessing()

    // Restart `tiles` container to refresh `/catalog`
    await restartTileServer()

    // Delete cache and trigger cache warming
    await updateCache()

    logTileInfo()
  } catch (error) {
    // This `catch` will only trigger if child functions are `await`ed AND file calls a `main()` function. Top level code does not work.
    console.error('[ERROR] Processing failed (catchall)', error)
  }
}

main()
