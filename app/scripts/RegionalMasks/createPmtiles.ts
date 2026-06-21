// We use nub to run this file

import path from 'node:path'
import { styleText } from 'node:util'
import { spawnSync } from '@/scripts/lib/bun'

console.log(styleText(['inverse', 'bold'], 'START'), import.meta.filename)

// Take the file from 'createGeojson' and create a pmtiles for it in `/datasets/pmtiles`
const inputFile = path.resolve(import.meta.dirname, './geojson/atlas-regional-masks.geojson')
const outputFile = path.resolve(import.meta.dirname, './pmtiles/atlas-regional-masks.pmtiles')

console.log('Tippecanoe for', inputFile)

spawnSync(['tippecanoe', `--output=${outputFile}`, '--force', '--layer=default', inputFile], {
  onExit(_proc, exitCode, _signalCode, error) {
    if (exitCode) {
      console.log('exitCode:', exitCode)
    }
    if (error) {
      console.log('error:', error)
    }
  },
})
