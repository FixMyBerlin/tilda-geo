import { updateCache } from './steps/cache'
import { downloadFile, waitForFreshData } from './steps/download'
import { restartTileServer, triggerPostProcessing } from './steps/externalTriggers'
import { idFilter, tagFilter } from './steps/filter'
import { generateTypes } from './steps/generateTypes'
import { initialize } from './steps/initialize'
import { processTopics } from './steps/processTopics'
import { berlinTimeString } from './utils/berlinTime'
import { logPadded, logTileInfo } from './utils/logging'
import { params } from './utils/parameters'
import { synologyLogError } from './utils/synology'

async function main() {
  try {
    logPadded('Processing')
    console.log('Processing:', 'Initialize', berlinTimeString(new Date()))
    await initialize()

    console.log('Processing:', 'Handle Data')
    await waitForFreshData()
    let { fileName, fileChanged } = await downloadFile()

    console.log('Processing:', 'Handle Filter')
    const tagFilterResponse = await tagFilter(fileName, fileChanged)
    if (tagFilterResponse) ({ fileName, fileChanged } = tagFilterResponse)

    const idFilterResponse = await idFilter(fileName, params.idFilter)
    if (idFilterResponse) ({ fileName, fileChanged } = idFilterResponse)

    console.log('Processing:', 'Handle Topics')
    await processTopics(fileName, fileChanged)
    await generateTypes()

    console.log('Processing:', 'Finishing up')
    // Call the frontend update hook which registers sql functions and starts the analysis run
    await triggerPostProcessing()

    // Restart `tiles` container to refresh `/catalog`
    await restartTileServer()

    // Delete cache and trigger cache warming
    await updateCache()

    logTileInfo()
  } catch (error) {
    // This `catch` will only trigger if child functions are `await`ed AND file calls a `main()` function. Top level code does not work.
    synologyLogError(`Processing failed: ${error}`)
  }
}

main()
