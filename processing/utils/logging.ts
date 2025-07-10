import chalk from 'chalk'
import { berlinTimeString } from './berlinTime'
import { formatTimestamp } from './formatTimestamp'
import { params } from './parameters'
import { synologyLogInfo } from './synology'
import { endTimer, startTimer } from './timeTracking'

const lineLength = process.stdout.columns || 120

export function logPadded(left: string, right: string = '') {
  console.log(chalk.inverse(left.padEnd(lineLength - right.length) + right))
}

export function logStart(id: string) {
  const message = `${id} started`
  synologyLogInfo(message)
  logPadded(message)
  startTimer(id)
}

export function logEnd(id: string) {
  const timeElapsed = endTimer(id)
  const timeFormatted = formatTimestamp(timeElapsed)

  const message = `${id} finished`
  synologyLogInfo(`${message} in ${timeFormatted}`)
  logPadded(message, timeFormatted)
  return timeElapsed
}

export function logTileInfo() {
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
    console.log('Processing:', 'Finished', berlinTimeString(new Date()))
  }
}
