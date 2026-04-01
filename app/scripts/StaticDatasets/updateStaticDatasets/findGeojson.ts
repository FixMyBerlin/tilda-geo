import fs from 'node:fs'
import path from 'node:path'
import { yellow } from '../utils/log'

/** @returns geojson fullFilename | null */
export const findGeojson = (datasetFolderPath: string) => {
  const filenames = fs
    .readdirSync(datasetFolderPath)
    .filter((filename) => filename.includes('.geojson') || filename.includes('.geojson.gz'))
    .filter((filename) => ['.geojson', '.gz'].includes(path.parse(filename).ext))

  if (filenames.length === 0) {
    yellow(`  Folder "${datasetFolderPath}" does not contain a geojson.`)
    return null
  }
  if (filenames.length > 1) {
    yellow(`  Folder "${datasetFolderPath}" contains multiple geojsons.`)
    return null
  }

  const first = filenames[0]
  if (!first) return null
  const fullFilename = path.join(datasetFolderPath, first)
  if (!fs.lstatSync(fullFilename).isFile()) {
    yellow(`  Path "${fullFilename}" is not a file.`)
    return null
  }

  return fullFilename
}
