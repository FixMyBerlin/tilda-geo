// We use bun.sh to run this file
import { styleText } from 'node:util'
import path from 'node:path'

console.log(styleText(['inverse', 'bold'], 'START'), __filename)

// Take the file from 'createGeojson' and create a pmtiles for it in `/datasets/pmtiles`
const inputFile = path.resolve(__dirname, './geojson/atlas-regional-masks.geojson')
const outputFile = path.resolve(__dirname, './pmtiles/atlas-regional-masks.pmtiles')

console.log('Tippecanoe for', inputFile)

Bun.spawnSync(['tippecanoe', `--output=${outputFile}`, '--force', '--layer=default', inputFile], {
  onExit(_proc, exitCode, _signalCode, error) {
    exitCode && console.log('exitCode:', exitCode)
    error && console.log('error:', error)
  },
})
