import { styleText } from 'node:util'
import { aggregateLengths } from './aggregateLengths'

// This function gets called by the `private/post-processing-hook` endpoint
// To run it locally, use http://127.0.0.1:5173/api/private/post-processing-hook?apiKey=<KEY_FROM_ENV>
export async function analysis() {
  try {
    const startTime = Date.now()
    console.log(styleText(['bold', 'white'], ' ○'), `Running analysis`)

    const aggregateLengthsPromise = aggregateLengths()

    // collect promises and add a final log message
    const analysisPromise = Promise.all([aggregateLengthsPromise]).then(() => {
      const secondsElapsed = Math.round((Date.now() - startTime) / 100) / 10
      console.log(`${styleText(['bold', 'green'], ' ✓')} Analysis completed in ${secondsElapsed} s`)
    })
    return analysisPromise
  } catch (e) {
    console.error('\n\nANALYSIS FAILED', e)
  }
}
