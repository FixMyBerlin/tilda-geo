import chalk from 'chalk'
import { berlinTimeString } from './berlinTime'
import { formatTimestamp } from './formatTimestamp'
import { params } from './parameters'
import { endTimer, startTimer } from './timeTracking'

const lineLength = process.stdout.columns || 120

export function logPadded(left: string, right: string = '') {
  const leftWithEquals = `=== ${left} ===`
  console.log(chalk.inverse(leftWithEquals.padEnd(lineLength - right.length) + right))
}

export function logStart(id: string) {
  logPadded(id, berlinTimeString(new Date()))
  startTimer(id)
}

export function logEnd(id: string) {
  const timeElapsed = endTimer(id)
  const timeFormatted = formatTimestamp(timeElapsed)

  console.log(`${id} finished in ${timeFormatted}`)
}

export function logTileInfo() {
  logPadded('Processing: Finished', berlinTimeString(new Date()))

  const tileURLs = {
    development: 'http://localhost:3000/catalog',
    staging: 'https://staging-tiles.tilda-geo.de/catalog',
    production: 'https://tiles.tilda-geo.de/catalog',
  } as const

  if (params.environment in tileURLs) {
    const environmentCapitalized =
      params.environment.charAt(0).toUpperCase() + params.environment.slice(1)
    console.log(`Tile Inspector: https://viewer.tilda-geo.de/?source=${environmentCapitalized}`)
    console.log(`Tile Catalog:   ${tileURLs[params.environment as keyof typeof tileURLs]}`)
  }
}
